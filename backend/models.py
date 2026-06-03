# backend/models.py
# All SQLAlchemy ORM table definitions for the Delay Analysis System

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


# ─────────────────────────────────────────────────────────
#  TABLE A  –  Users
#  Stores all system users with roles and active status
# ─────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id          = Column(Integer, primary_key=True, index=True)
    emp_no      = Column(String(20),  unique=True,  nullable=False, index=True)
    password    = Column(String(200), nullable=False)               # bcrypt hash
    emp_name    = Column(String(100), nullable=False)
    dept        = Column(String(50))
    designation = Column(String(50))
    # Hardcoded roles: sys_admin | dept_user | dept_admin | ppm_user | ppm_admin
    role        = Column(String(20),  nullable=False, default="dept_user")
    active      = Column(Boolean, default=True)
    created_at  = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<User emp_no={self.emp_no} role={self.role}>"


# ─────────────────────────────────────────────────────────
#  TABLE B  –  Equipment Master
#  Master list of all shops and their critical equipment
# ─────────────────────────────────────────────────────────
class EquipmentMaster(Base):
    __tablename__ = "equipment_master"

    id            = Column(Integer, primary_key=True, index=True)
    shop_code     = Column(Integer, nullable=False, index=True)
    shop_desc     = Column(String(100), nullable=False)
    eqpt_code     = Column(String(50),  default="")
    sub_eqpt_code = Column(String(50),  default="")

    def __repr__(self):
        return f"<EquipmentMaster shop={self.shop_code} eqpt={self.eqpt_code}>"


# ─────────────────────────────────────────────────────────
#  TABLE C  –  Delays Data
#  All captured delay records from all departments
# ─────────────────────────────────────────────────────────
class DelayRecord(Base):
    __tablename__ = "delays_data"

    id              = Column(Integer, primary_key=True, index=True)
    shop_code       = Column(Integer, nullable=False, index=True)
    shop_desc       = Column(String(100))
    eqpt_name       = Column(String(50))
    sub_eqpt_name   = Column(String(50))
    # Agency: O=Operations | M=Mechanical | E=Electrical | SD=Shutdown | etc.
    agency          = Column(String(30))
    delay_from      = Column(DateTime, index=True)
    delay_upto      = Column(DateTime)
    delay_duration  = Column(Float)                 # in decimal hours
    delay_desc      = Column(Text)
    user_entered    = Column(String(50))
    timestamp       = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<DelayRecord id={self.id} shop={self.shop_code} dur={self.delay_duration}h>"
