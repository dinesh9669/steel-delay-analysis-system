# backend/routes/dashboard.py  (UPDATED — export permission guard added)
#
# Role restrictions enforced here:
#   GET /api/dashboard/export-excel → sys_admin, dept_admin, ppm_admin ONLY
#                                     dept_user and ppm_user BLOCKED

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
import io

from database import get_db
from models import DelayRecord
from routes.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

AGENCY_LABELS = {
    "O":"Operations","M":"Mechanical","E":"Electrical","SD":"Shutdown",
    "C":"Crane","CR":"Crane","ID":"Idle","MIS":"Miscellaneous",
    "MS":"Miscellaneous","S":"Structural","I":"Internal",
    "P":"Process","R":"Raw Material","IR":"Industrial Relations",
}

# Who can export Excel
CAN_EXPORT = ("sys_admin", "dept_admin", "ppm_admin")

def get_shift(dt) -> str:
    if dt is None: return "Unknown"
    h = dt.hour
    if  6 <= h < 14: return "Morning (06:00–14:00)"
    if 14 <= h < 22: return "Evening (14:00–22:00)"
    return "Night (22:00–06:00)"


# ── GET /api/dashboard/live ───────────────────────────────
@router.get("/live")
def live_kpis(db: Session = Depends(get_db), _ = Depends(get_current_user)):
    now   = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week  = now - timedelta(days=7)
    month = now - timedelta(days=30)

    total_all   = db.query(func.count(DelayRecord.id)).scalar() or 0
    total_today = db.query(func.count(DelayRecord.id)).filter(DelayRecord.delay_from >= today).scalar() or 0
    total_week  = db.query(func.count(DelayRecord.id)).filter(DelayRecord.delay_from >= week).scalar() or 0
    hrs_today   = db.query(func.sum(DelayRecord.delay_duration)).filter(DelayRecord.delay_from >= today).scalar() or 0
    hrs_week    = db.query(func.sum(DelayRecord.delay_duration)).filter(DelayRecord.delay_from >= week).scalar() or 0
    hrs_month   = db.query(func.sum(DelayRecord.delay_duration)).filter(DelayRecord.delay_from >= month).scalar() or 0
    top_agency  = db.query(DelayRecord.agency, func.count(DelayRecord.id).label("cnt"))\
                    .filter(DelayRecord.delay_from >= week).group_by(DelayRecord.agency)\
                    .order_by(func.count(DelayRecord.id).desc()).first()
    active_shops= db.query(func.count(func.distinct(DelayRecord.shop_code)))\
                    .filter(DelayRecord.delay_from >= month).scalar() or 0

    return {
        "total_all":    total_all,
        "total_today":  total_today,
        "total_week":   total_week,
        "hrs_today":    round(hrs_today, 1),
        "hrs_week":     round(hrs_week, 1),
        "hrs_month":    round(hrs_month, 1),
        "top_agency":   AGENCY_LABELS.get(top_agency[0], top_agency[0]) if top_agency else "—",
        "active_shops": active_shops,
        "last_updated": now.strftime("%d-%m-%Y %H:%M:%S"),
    }


# ── GET /api/dashboard/shift-analysis ────────────────────
@router.get("/shift-analysis")
def shift_analysis(
    shop_code: Optional[int] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date:   Optional[str] = Query(None),
    db: Session = Depends(get_db), _ = Depends(get_current_user)
):
    q = db.query(DelayRecord)
    if shop_code: q = q.filter(DelayRecord.shop_code == shop_code)
    if from_date: q = q.filter(DelayRecord.delay_from >= datetime.fromisoformat(from_date))
    if to_date:   q = q.filter(DelayRecord.delay_from <= datetime.fromisoformat(to_date + "T23:59:59"))

    buckets = {
        "Morning (06:00–14:00)": {"count":0,"total_hrs":0.0},
        "Evening (14:00–22:00)": {"count":0,"total_hrs":0.0},
        "Night (22:00–06:00)":   {"count":0,"total_hrs":0.0},
    }
    for r in q.all():
        shift = get_shift(r.delay_from)
        if shift in buckets:
            buckets[shift]["count"]     += 1
            buckets[shift]["total_hrs"] += r.delay_duration or 0

    return [{"shift":k,"count":v["count"],"total_hrs":round(v["total_hrs"],2)} for k,v in buckets.items()]


# ── GET /api/dashboard/top-equipment ─────────────────────
@router.get("/top-equipment")
def top_equipment(
    limit:     int           = Query(10, ge=1, le=50),
    from_date: Optional[str] = Query(None),
    db: Session = Depends(get_db), _ = Depends(get_current_user)
):
    q = db.query(
        DelayRecord.eqpt_name, DelayRecord.shop_desc,
        func.count(DelayRecord.id).label("freq"),
        func.sum(DelayRecord.delay_duration).label("total_hrs"),
        func.avg(DelayRecord.delay_duration).label("avg_hrs"),
    )
    if from_date:
        q = q.filter(DelayRecord.delay_from >= datetime.fromisoformat(from_date))

    rows = q.filter(DelayRecord.eqpt_name != None)\
            .group_by(DelayRecord.eqpt_name, DelayRecord.shop_desc)\
            .order_by(func.sum(DelayRecord.delay_duration).desc())\
            .limit(limit).all()

    result = []
    for i, r in enumerate(rows):
        total = round(r.total_hrs or 0, 1)
        risk  = "CRITICAL" if total > 500 else "HIGH" if total > 200 else "MEDIUM" if total > 50 else "LOW"
        result.append({
            "rank":      i + 1,
            "eqpt_name": r.eqpt_name,
            "shop_desc": r.shop_desc or "—",
            "frequency": r.freq,
            "total_hrs": total,
            "avg_hrs":   round(r.avg_hrs or 0, 2),
            "risk":      risk,
        })
    return result


# ── GET /api/dashboard/trend ──────────────────────────────
@router.get("/trend")
def trend(
    days:      int           = Query(30, ge=7, le=365),
    shop_code: Optional[int] = Query(None),
    db: Session = Depends(get_db), _ = Depends(get_current_user)
):
    since = datetime.utcnow() - timedelta(days=days)
    q = db.query(DelayRecord).filter(DelayRecord.delay_from >= since)
    if shop_code: q = q.filter(DelayRecord.shop_code == shop_code)

    buckets = {}
    for r in q.all():
        if r.delay_from:
            d = r.delay_from.strftime("%d-%m")
            if d not in buckets:
                buckets[d] = {"date":d,"count":0,"total_hrs":0.0}
            buckets[d]["count"]     += 1
            buckets[d]["total_hrs"] += r.delay_duration or 0

    result = sorted(buckets.values(), key=lambda x: x["date"])
    for r in result:
        r["total_hrs"] = round(r["total_hrs"], 1)
    return result


# ── GET /api/dashboard/alerts ─────────────────────────────
@router.get("/alerts")
def alerts(
    threshold_hrs: float = Query(100.0),
    db: Session = Depends(get_db), _ = Depends(get_current_user)
):
    month_ago = datetime.utcnow() - timedelta(days=30)
    rows = db.query(
        DelayRecord.eqpt_name, DelayRecord.shop_desc,
        func.count(DelayRecord.id).label("freq"),
        func.sum(DelayRecord.delay_duration).label("total_hrs"),
    ).filter(
        DelayRecord.delay_from >= month_ago,
        DelayRecord.eqpt_name != None,
    ).group_by(DelayRecord.eqpt_name, DelayRecord.shop_desc)\
     .having(func.sum(DelayRecord.delay_duration) >= threshold_hrs)\
     .order_by(func.sum(DelayRecord.delay_duration).desc()).all()

    return [{
        "eqpt_name":   r.eqpt_name,
        "shop_desc":   r.shop_desc or "—",
        "frequency":   r.freq,
        "total_hrs":   round(r.total_hrs or 0, 1),
        "alert_level": "CRITICAL" if (r.total_hrs or 0) > threshold_hrs * 3
                       else "HIGH" if (r.total_hrs or 0) > threshold_hrs * 1.5
                       else "WARNING",
        "message":     f"Equipment logged {round(r.total_hrs or 0,1)} hrs in last 30 days",
    } for r in rows]


# ── GET /api/dashboard/export-excel ──────────────────────
@router.get("/export-excel")
def export_excel(
    shop_code: Optional[int] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date:   Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: any   = Depends(get_current_user)   # typed as any to avoid import cycle
):
    # ── Permission check ─────────────────────────────────
    # dept_user and ppm_user cannot export
    if user.role not in CAN_EXPORT:
        raise HTTPException(
            status_code=403,
            detail=f"Role '{user.role}' is not permitted to export data. "
                   f"Export is available to dept_admin, ppm_admin, and sys_admin only."
        )

    try:
        import pandas as pd
    except ImportError:
        raise HTTPException(500, "pandas not installed")

    q = db.query(DelayRecord)
    if shop_code: q = q.filter(DelayRecord.shop_code == shop_code)
    if from_date: q = q.filter(DelayRecord.delay_from >= datetime.fromisoformat(from_date))
    if to_date:   q = q.filter(DelayRecord.delay_from <= datetime.fromisoformat(to_date + "T23:59:59"))

    records = q.order_by(DelayRecord.delay_from.desc()).all()

    data = [{
        "Shop":           r.shop_desc or "",
        "Equipment":      r.eqpt_name or "",
        "Sub Equipment":  r.sub_eqpt_name or "",
        "Agency":         AGENCY_LABELS.get(r.agency, r.agency or ""),
        "Delay From":     r.delay_from.strftime("%d-%m-%Y %H:%M") if r.delay_from else "",
        "Delay Upto":     r.delay_upto.strftime("%d-%m-%Y %H:%M") if r.delay_upto else "",
        "Duration (Hrs)": round(r.delay_duration or 0, 2),
        "Description":    r.delay_desc or "",
        "Entered By":     r.user_entered or "",
        "Timestamp":      r.timestamp.strftime("%d-%m-%Y %H:%M") if r.timestamp else "",
        "Shift":          get_shift(r.delay_from),
    } for r in records]

    df  = pd.DataFrame(data)
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Delays")
    buf.seek(0)

    filename = f"delays_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
