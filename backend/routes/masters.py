# backend/routes/masters.py
# Cascading dropdown data for Delay Entry form:
#   Shop → Equipment → Sub-Equipment

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import EquipmentMaster
from routes.auth import get_current_user

router = APIRouter(prefix="/api/masters", tags=["Masters"])


# ── GET /api/masters/shops ────────────────────────────────
@router.get("/shops")
def get_shops(
    db: Session = Depends(get_db),
    _           = Depends(get_current_user)
):
    """Returns all distinct shops for the first dropdown."""
    rows = (
        db.query(EquipmentMaster.shop_code, EquipmentMaster.shop_desc)
        .distinct()
        .order_by(EquipmentMaster.shop_code)
        .all()
    )
    return [{"shop_code": r.shop_code, "shop_desc": r.shop_desc} for r in rows]


# ── GET /api/masters/equipment?shop_code=2 ────────────────
@router.get("/equipment")
def get_equipment(
    shop_code: int     = Query(..., description="Shop code to filter equipment"),
    db:        Session = Depends(get_db),
    _                  = Depends(get_current_user)
):
    """Returns equipment list for a given shop."""
    rows = (
        db.query(EquipmentMaster.eqpt_code)
        .filter(
            EquipmentMaster.shop_code == shop_code,
            EquipmentMaster.eqpt_code != ""
        )
        .distinct()
        .all()
    )
    return [r.eqpt_code for r in rows]


# ── GET /api/masters/sub-equipment?shop_code=2&eqpt_code=CCM-1 ──
@router.get("/sub-equipment")
def get_sub_equipment(
    shop_code: int     = Query(...),
    eqpt_code: str     = Query(...),
    db:        Session = Depends(get_db),
    _                  = Depends(get_current_user)
):
    """Returns sub-equipment list for a given shop + equipment."""
    rows = (
        db.query(EquipmentMaster.sub_eqpt_code)
        .filter(
            EquipmentMaster.shop_code    == shop_code,
            EquipmentMaster.eqpt_code    == eqpt_code,
            EquipmentMaster.sub_eqpt_code != ""
        )
        .distinct()
        .all()
    )
    return [r.sub_eqpt_code for r in rows]
