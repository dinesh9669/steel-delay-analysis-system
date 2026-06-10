# backend/database.py  (UPDATED)
# Only the seed_database() function changes — 4 new users added.
# Engine, SessionLocal, get_db, SHOP_MAP, EQPT_BY_SHOP are all identical to v1.

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, EquipmentMaster

DATABASE_URL = "sqlite:///./steel_delays.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


SHOP_MAP = {
    1:  "Blast Furnace",
    2:  "Steel Melt Shop",
    3:  "Coke Ovens",
    4:  "Sinter Plant",
    5:  "Wire Rod Mill",
    6:  "Bar Mill",
    7:  "Medium Merchant Mill",
    8:  "Light Merchant Mill",
    9:  "Structural Mill",
    10: "Rail & Structural Mill",
    11: "Plate Mill",
    12: "Hot Strip Mill",
    13: "Cold Rolling Mill",
    14: "Power Plant",
    15: "Raw Materials Handling",
}

EQPT_BY_SHOP = {
    1:  [("GETS",""),("F/C-1",""),("F/C-2",""),("CT-1",""),("CT-2",""),("LOCP","")],
    2:  [("CCM-1",""),("CCM-2",""),("CCM-3",""),("CCM-4",""),("CCM-5",""),
         ("CCM-6",""),("MIXER-1",""),("OT-1",""),("OT-2",""),("OT-3","")],
    3:  [("BATTERY-1",""),("BATTERY-2",""),("BATTERY-3",""),("CPP",""),("BRC",""),("WBRC","")],
    4:  [("MILL","LINE-1"),("MILL","LINE-2")],
    5:  [("CONV-A",""),("CONV-B",""),("CONV-C",""),("M/C-1",""),("M/C-2",""),("BAR MILL","")],
    6:  [("BILLET MIL","")],
    7:  [("MILL","")], 8:  [("MILL","")], 9:  [("MILL","")],
    10: [("MILL","")], 11: [("MILL","")], 12: [("MILL","")],
    13: [("MILL","")],
    14: [("TG-1",""),("TG-2",""),("TG-3",""),("BOILER-1",""),("BOILER-2","")],
    15: [("CONV-A",""),("CONV-B",""),("WAGON TIPPLER",""),("STOCKYARD","")],
}

# ─────────────────────────────────────────────────────────
#  ALL 5 USERS (1 existing admin + 4 new)
# ─────────────────────────────────────────────────────────
DEFAULT_USERS = [
    # ── 1. System Admin (existing — unchanged) ──────────
    {
        "emp_no":      "ADMIN001",
        "password":    "admin123",
        "emp_name":    "System Admin",
        "dept":        "IT Department",
        "designation": "System Administrator",
        "role":        "sys_admin",
    },
    # ── 2. Department Admin — Steel Melt Shop ───────────
    # Can: Dashboard, Delay Entry, Reports, Export Excel, Delete delays
    # Cannot: User Management (no access to /api/users/)
    {
        "emp_no":      "SMS001",
        "password":    "sms@2024",
        "emp_name":    "Rajesh Kumar",
        "dept":        "Steel Melt Shop",
        "designation": "Junior Manager (Operations)",
        "role":        "dept_admin",
    },
    # ── 3. Department User — Blast Furnace ──────────────
    # Can: Dashboard, Delay Entry, Reports
    # Cannot: User Management, Export Excel, Delete delays
    {
        "emp_no":      "BF001",
        "password":    "bf@2024",
        "emp_name":    "Venkata Rao",
        "dept":        "Blast Furnace",
        "designation": "Shift Operator",
        "role":        "dept_user",
    },
    # ── 4. PPM Admin — Production Planning ──────────────
    # Can: Dashboard, Reports, Export Excel
    # Cannot: Delay Entry, User Management, Delete
    {
        "emp_no":      "PPM001",
        "password":    "ppm@2024",
        "emp_name":    "Suresh Babu",
        "dept":        "Production Planning & Management",
        "designation": "PPM Manager",
        "role":        "ppm_admin",
    },
    # ── 5. PPM User — Production Planning ───────────────
    # Can: Dashboard, Reports only
    # Cannot: Delay Entry, User Management, Export Excel, Delete
    {
        "emp_no":      "PPM002",
        "password":    "ppm@2024",
        "emp_name":    "Lakshmi Devi",
        "dept":        "Production Planning & Management",
        "designation": "PPM Analyst",
        "role":        "ppm_user",
    },
]


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # ── Seed equipment master ──────────────────────
        if db.query(EquipmentMaster).count() == 0:
            for shop_code, shop_desc in SHOP_MAP.items():
                for eqpt, sub in EQPT_BY_SHOP.get(shop_code, []):
                    db.add(EquipmentMaster(
                        shop_code=shop_code, shop_desc=shop_desc,
                        eqpt_code=eqpt, sub_eqpt_code=sub,
                    ))
            print("  ✓ Equipment master seeded (15 shops)")

        # ── Seed all 5 users (skip existing ones) ─────
        from passlib.context import CryptContext
        pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

        added = 0
        for u in DEFAULT_USERS:
            if not db.query(User).filter(User.emp_no == u["emp_no"]).first():
                db.add(User(
                    emp_no      = u["emp_no"],
                    password    = pwd_ctx.hash(u["password"]),
                    emp_name    = u["emp_name"],
                    dept        = u["dept"],
                    designation = u["designation"],
                    role        = u["role"],
                    active      = True,
                ))
                added += 1

        db.commit()
        print(f"  ✓ {added} user(s) seeded")
        print("✅ Database ready: steel_delays.db")
        print()
        print("  Credentials:")
        for u in DEFAULT_USERS:
            print(f"    {u['emp_no']:10s} / {u['password']:12s}  ({u['role']})")

    finally:
        db.close()


if __name__ == "__main__":
    print("Initializing database …")
    seed_database()
