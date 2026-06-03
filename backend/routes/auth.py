# backend/routes/auth.py
# Login endpoint + JWT token generation + current-user dependency

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from pydantic import BaseModel

from database import get_db
from models import User

router    = APIRouter(prefix="/api/auth", tags=["Auth"])
pwd_ctx   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2    = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ── JWT config ────────────────────────────────────────────
SECRET_KEY   = "VIZAG_STEEL_SECRET_KEY_CHANGE_IN_PROD"
ALGORITHM    = "HS256"
TOKEN_EXPIRY = 60 * 8      # 8 hours


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str
    role:         str
    emp_name:     str
    emp_no:       str


def create_token(emp_no: str, role: str) -> str:
    payload = {
        "sub":  emp_no,
        "role": role,
        "exp":  datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRY),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── Shared dependency: validates JWT, returns User object ─
def get_current_user(
    token: str          = Depends(oauth2),
    db:    Session      = Depends(get_db)
) -> User:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        emp_no  = payload.get("sub")
        if not emp_no:
            raise exc
    except JWTError:
        raise exc

    user = db.query(User).filter(User.emp_no == emp_no).first()
    if not user or not user.active:
        raise exc
    return user


# ── POST /api/auth/login ──────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db:   Session                   = Depends(get_db)
):
    user = db.query(User).filter(User.emp_no == form.username).first()
    if not user or not pwd_ctx.verify(form.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect employee number or password")
    if not user.active:
        raise HTTPException(status_code=403, detail="Account is inactive. Contact sys_admin.")

    return TokenResponse(
        access_token=create_token(user.emp_no, user.role),
        token_type="bearer",
        role=user.role,
        emp_name=user.emp_name,
        emp_no=user.emp_no,
    )


# ── GET /api/auth/me ──────────────────────────────────────
@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "emp_no":      current_user.emp_no,
        "emp_name":    current_user.emp_name,
        "dept":        current_user.dept,
        "designation": current_user.designation,
        "role":        current_user.role,
        "active":      current_user.active,
    }
