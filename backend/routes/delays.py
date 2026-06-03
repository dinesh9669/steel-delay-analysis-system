# backend/routes/delays.py
# CRUD operations for delay records (Page 2 – Delay Entry)
#
# POST   /api/delays/         create new delay
# GET    /api/delays/         list with filters + pagination
# GET    /api/delays/{id}     single record
# DELETE /api/delays/{id}     admin only

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database import get_db
from models import DelayRecord, EquipmentMaster, User
from routes.auth import get_current_user

router = APIRouter(prefix="/api/delays", tags=["Delays"])

# Full agency label map
AGENCY_LABELS = {
    "O":   "Operations",
    "M":   "Mechanical",
    "E":   "Electrical",
    "SD":  "Shutdown",
    "C":   "Crane",
    "CR":  "Crane",
    "ID":  "Idle",
    "MIS": "Miscellaneous",
    "MS":  "Miscellaneous",
    "S":   "Structural",
    "I":   "Internal",
    "P":   "Process",
    "R":   "Raw Material",
    "IR":  "Industrial Relations",
}


# ── Pydantic schema for POST body ─────────────────────────
class DelayCreate(BaseModel):
    shop_code:     int
    eqpt_name:     Optional[str] = None
    sub_eqpt_name: Optional[str] = None
    agency:        str
    delay_from:    datetime
    delay_upto:    datetime
    delay_desc:    Optional[str] = None


# ── Helper: model → dict ──────────────────────────────────
def to_dict(d: DelayRecord) -> dict:
    return {
        "id":             d.id,
        "shop_code":      d.shop_code,
        "shop_desc":      d.shop_desc or "",
        "eqpt_name":      d.eqpt_name or "—",
        "sub_eqpt_name":  d.sub_eqpt_name or "—",
        "agency":         AGENCY_LABELS.get(d.agency, d.agency),
        "agency_code":    d.agency,
        "delay_from":     d.delay_from.isoformat()   if d.delay_from  else None,
        "delay_upto":     d.delay_upto.isoformat()   if d.delay_upto  else None,
        "delay_duration": round(d.delay_duration, 2) if d.delay_duration else 0,
        "delay_desc":     d.delay_desc or "—",
        "user_entered":   d.user_entered or "—",
        "timestamp":      d.timestamp.isoformat()    if d.timestamp   else None,
    }


# ── POST /api/delays/ ─────────────────────────────────────
@router.post("/", status_code=201)
def create_delay(
    payload: DelayCreate,
    db:      Session = Depends(get_db),
    user:    User    = Depends(get_current_user)
):
    if user.role not in ("sys_admin", "dept_admin", "dept_user"):
        raise HTTPException(status_code=403, detail="Not authorized to enter delays")

    # Auto-calculate duration in hours
    duration = (payload.delay_upto - payload.delay_from).total_seconds() / 3600
    if duration <= 0:
        raise HTTPException(status_code=400, detail="Delay Upto must be after Delay From")

    # Look up shop description
    shop = db.query(EquipmentMaster.shop_desc)\
             .filter(EquipmentMaster.shop_code == payload.shop_code).first()

    record = DelayRecord(
        shop_code     = payload.shop_code,
        shop_desc     = shop.shop_desc if shop else "",
        eqpt_name     = payload.eqpt_name,
        sub_eqpt_name = payload.sub_eqpt_name,
        agency        = payload.agency,
        delay_from    = payload.delay_from,
        delay_upto    = payload.delay_upto,
        delay_duration= round(duration, 4),
        delay_desc    = payload.delay_desc,
        user_entered  = user.emp_no,
        timestamp     = datetime.utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return to_dict(record)


# ── GET /api/delays/ ──────────────────────────────────────
@router.get("/")
def list_delays(
    shop_code:  Optional[int] = Query(None),
    from_date:  Optional[str] = Query(None, description="YYYY-MM-DD"),
    to_date:    Optional[str] = Query(None, description="YYYY-MM-DD"),
    page:       int           = Query(1, ge=1),
    page_size:  int           = Query(50, ge=1, le=500),
    db:         Session       = Depends(get_db),
    _:          User          = Depends(get_current_user)
):
    q = db.query(DelayRecord)

    if shop_code:
        q = q.filter(DelayRecord.shop_code == shop_code)
    if from_date:
        q = q.filter(DelayRecord.delay_from >= datetime.fromisoformat(from_date))
    if to_date:
        q = q.filter(DelayRecord.delay_from <= datetime.fromisoformat(to_date + "T23:59:59"))

    total   = q.count()
    records = (
        q.order_by(DelayRecord.delay_from.desc())
         .offset((page - 1) * page_size)
         .limit(page_size)
         .all()
    )
    return {
        "total":   total,
        "page":    page,
        "records": [to_dict(r) for r in records],
    }


# ── GET /api/delays/{id} ──────────────────────────────────
@router.get("/{delay_id}")
def get_delay(
    delay_id: int,
    db:       Session = Depends(get_db),
    _:        User    = Depends(get_current_user)
):
    record = db.query(DelayRecord).filter(DelayRecord.id == delay_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Delay record not found")
    return to_dict(record)


# ── DELETE /api/delays/{id} ───────────────────────────────
@router.delete("/{delay_id}")
def delete_delay(
    delay_id: int,
    db:       Session = Depends(get_db),
    user:     User    = Depends(get_current_user)
):
    if user.role not in ("sys_admin", "dept_admin"):
        raise HTTPException(status_code=403, detail="Only admins can delete delay records")

    record = db.query(DelayRecord).filter(DelayRecord.id == delay_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    db.delete(record)
    db.commit()
    return {"message": f"Delay record {delay_id} deleted successfully"}
