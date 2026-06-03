# backend/routes/reports.py
# Reports API (Page 4) — tabular, chart aggregation, and KPI summary
#
# GET /api/reports/tabular   filtered table data  (Version 1)
# GET /api/reports/chart     aggregated chart data (Version 2)
# GET /api/reports/summary   KPI cards (total delays, total hrs, worst equip)

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from database import get_db
from models import DelayRecord
from routes.auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

AGENCY_LABELS = {
    "O":   "Operations",      "M":   "Mechanical",
    "E":   "Electrical",      "SD":  "Shutdown",
    "C":   "Crane",           "CR":  "Crane",
    "ID":  "Idle",            "MIS": "Miscellaneous",
    "MS":  "Miscellaneous",   "S":   "Structural",
    "I":   "Internal",        "P":   "Process",
    "R":   "Raw Material",    "IR":  "Industrial Relations",
}


# ── Shared filter builder ─────────────────────────────────
def apply_filters(q, shop_code, from_date, to_date):
    if shop_code and shop_code != 0:
        q = q.filter(DelayRecord.shop_code == shop_code)
    if from_date:
        q = q.filter(DelayRecord.delay_from >= datetime.fromisoformat(from_date))
    if to_date:
        q = q.filter(DelayRecord.delay_from <= datetime.fromisoformat(to_date + "T23:59:59"))
    return q


# ── GET /api/reports/tabular ──────────────────────────────
@router.get("/tabular")
def tabular_report(
    shop_code: Optional[int] = Query(None, description="0 = All shops"),
    from_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    to_date:   Optional[str] = Query(None, description="YYYY-MM-DD"),
    page:      int           = Query(1,   ge=1),
    page_size: int           = Query(100, ge=1, le=1000),
    db:        Session       = Depends(get_db),
    _                        = Depends(get_current_user)
):
    q     = apply_filters(db.query(DelayRecord), shop_code, from_date, to_date)
    total = q.count()
    rows  = (
        q.order_by(DelayRecord.delay_from.desc())
         .offset((page - 1) * page_size)
         .limit(page_size)
         .all()
    )
    return {
        "total": total,
        "page":  page,
        "data": [{
            "id":             r.id,
            "shop_desc":      r.shop_desc or "—",
            "eqpt_name":      r.eqpt_name or "—",
            "sub_eqpt_name":  r.sub_eqpt_name or "—",
            "agency":         AGENCY_LABELS.get(r.agency, r.agency),
            "delay_from":     r.delay_from.strftime("%d-%m-%Y %H:%M") if r.delay_from else "—",
            "delay_upto":     r.delay_upto.strftime("%d-%m-%Y %H:%M") if r.delay_upto else "—",
            "delay_duration": round(r.delay_duration or 0, 2),
            "delay_desc":     r.delay_desc or "—",
            "user_entered":   r.user_entered or "—",
            "timestamp":      r.timestamp.strftime("%d-%m-%Y %H:%M") if r.timestamp else "—",
        } for r in rows],
    }


# ── GET /api/reports/chart ────────────────────────────────
@router.get("/chart")
def chart_data(
    shop_code: Optional[int] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date:   Optional[str] = Query(None),
    group_by:  str           = Query("agency", enum=["agency", "shop", "equipment"]),
    db:        Session       = Depends(get_db),
    _                        = Depends(get_current_user)
):
    """Returns aggregated count + total hours grouped by agency / shop / equipment."""
    base = apply_filters(db.query(DelayRecord), shop_code, from_date, to_date)
    ids  = [r.id for r in base.with_entities(DelayRecord.id).all()]

    if group_by == "agency":
        rows = (
            db.query(
                DelayRecord.agency,
                func.count(DelayRecord.id).label("count"),
                func.sum(DelayRecord.delay_duration).label("total_hrs")
            )
            .filter(DelayRecord.id.in_(ids))
            .group_by(DelayRecord.agency)
            .all()
        )
        return [{"label": AGENCY_LABELS.get(r.agency, r.agency),
                 "count": r.count,
                 "total_hrs": round(r.total_hrs or 0, 2)} for r in rows]

    elif group_by == "shop":
        rows = (
            db.query(
                DelayRecord.shop_code,
                DelayRecord.shop_desc,
                func.count(DelayRecord.id).label("count"),
                func.sum(DelayRecord.delay_duration).label("total_hrs")
            )
            .filter(DelayRecord.id.in_(ids))
            .group_by(DelayRecord.shop_code, DelayRecord.shop_desc)
            .all()
        )
        return [{"label": r.shop_desc or f"Shop {r.shop_code}",
                 "count": r.count,
                 "total_hrs": round(r.total_hrs or 0, 2)} for r in rows]

    else:  # equipment
        rows = (
            db.query(
                DelayRecord.eqpt_name,
                func.count(DelayRecord.id).label("count"),
                func.sum(DelayRecord.delay_duration).label("total_hrs")
            )
            .filter(DelayRecord.id.in_(ids))
            .group_by(DelayRecord.eqpt_name)
            .all()
        )
        return [{"label": r.eqpt_name or "Unknown",
                 "count": r.count,
                 "total_hrs": round(r.total_hrs or 0, 2)} for r in rows if r.eqpt_name]


# ── GET /api/reports/summary ──────────────────────────────
@router.get("/summary")
def summary_kpis(
    shop_code: Optional[int] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date:   Optional[str] = Query(None),
    db:        Session       = Depends(get_db),
    _                        = Depends(get_current_user)
):
    """Returns KPI card data: total delays, hours, avg, worst equipment."""
    q       = apply_filters(db.query(DelayRecord), shop_code, from_date, to_date)
    records = q.all()

    total_recs = len(records)
    total_hrs  = sum(r.delay_duration or 0 for r in records)

    # Find equipment with most cumulative delay hours
    eqpt_hrs = {}
    for r in records:
        key = r.eqpt_name or "Unknown"
        eqpt_hrs[key] = eqpt_hrs.get(key, 0) + (r.delay_duration or 0)

    worst_eqpt = max(eqpt_hrs, key=lambda k: eqpt_hrs[k]) if eqpt_hrs else "—"
    worst_hrs  = round(eqpt_hrs.get(worst_eqpt, 0), 2)

    return {
        "total_delays":    total_recs,
        "total_hours":     round(total_hrs, 2),
        "avg_duration":    round(total_hrs / total_recs, 2) if total_recs else 0,
        "worst_equipment": worst_eqpt,
        "worst_eqpt_hrs":  worst_hrs,
    }
