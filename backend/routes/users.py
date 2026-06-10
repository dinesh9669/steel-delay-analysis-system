# backend/routes/users.py
# User Management API (Page 3)
#
# GET    /api/users/              list all users   (sys_admin only)
# POST   /api/users/              add new user     (sys_admin only)
# PATCH  /api/users/{id}/role     update role      (sys_admin only)
# PATCH  /api/users/{id}/status   toggle active    (sys_admin only)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models import User
from routes.auth import get_current_user

router  = APIRouter(prefix="/api/users", tags=["Users"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hardcoded valid roles (as per project spec)
VALID_ROLES = ("sys_admin", "dept_user", "dept_admin", "ppm_user", "ppm_admin")


# ── Pydantic schemas ──────────────────────────────────────
class UserCreate(BaseModel):
    emp_no:      str
    password:    str
    emp_name:    str
    dept:        Optional[str] = None
    designation: Optional[str] = None
    role:        str


class RoleUpdate(BaseModel):
    role: str


class StatusUpdate(BaseModel):
    active: bool



# ── Helper: model → dict (no password) ───────────────────
def to_dict(u: User) -> dict:
    return {
        "id":          u.id,
        "emp_no":      u.emp_no,
        "emp_name":    u.emp_name,
        "dept":        u.dept        or "—",
        "designation": u.designation or "—",
        "role":        u.role,
        "active":      u.active,
        "created_at":  u.created_at.isoformat() if u.created_at else None,
    }


# ── Admin-only guard ──────────────────────────────────────
def admin_only(user: User = Depends(get_current_user)):
    if user.role != "sys_admin":
        raise HTTPException(status_code=403, detail="sys_admin role required for user management")
    return user


# ── GET /api/users/ ───────────────────────────────────────
@router.get("/")
def list_users(
    db: Session = Depends(get_db),
    _           = Depends(admin_only)
):
    return [to_dict(u) for u in db.query(User).order_by(User.emp_no).all()]


# ── POST /api/users/ ──────────────────────────────────────
@router.post("/", status_code=201)
def add_user(
    payload: UserCreate,
    db:      Session = Depends(get_db),
    _               = Depends(admin_only)
):
    if db.query(User).filter(User.emp_no == payload.emp_no).first():
        raise HTTPException(status_code=400, detail=f"Employee number '{payload.emp_no}' already exists")
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {VALID_ROLES}")

    user = User(
        emp_no      = payload.emp_no.strip().upper(),
        password    = pwd_ctx.hash(payload.password),
        emp_name    = payload.emp_name.strip(),
        dept        = payload.dept,
        designation = payload.designation,
        role        = payload.role,
        active      = True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return to_dict(user)


# ── PATCH /api/users/{id}/role ────────────────────────────
@router.patch("/{user_id}/role")
def update_role(
    user_id: int,
    payload: RoleUpdate,
    db:      Session = Depends(get_db),
    _               = Depends(admin_only)
):
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {VALID_ROLES}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = payload.role
    db.commit()
    return to_dict(user)


# ── PATCH /api/users/{id}/status ─────────────────────────
