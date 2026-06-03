# backend/database.py
# DB engine, session factory, dependency injector, and seed script
# Run directly to initialize: python database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, EquipmentMaster

# ── Database URL ─────────────────────────────────────────
# SQLite for development — change to PostgreSQL for production:
# DATABASE_URL = "postgresql://user:password@localhost/steel_delays"
DATABASE_URL = "sqlite:///./steel_delays.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}   # SQLite only
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── FastAPI dependency ────────────────────────────────────
def get_db():
    """Yields a DB session per request, closes it after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Seed: Shop Master ─────────────────────────────────────
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

# Equipment list per shop  [(eqpt_code, sub_eqpt_code), ...]
EQPT_BY_SHOP = {
    1:  [("GETS",""),("F/C-1",""),("F/C-2",""),("CT-1",""),("CT-2",""),("LOCP","")],
    2:  [("CCM-1",""),("CCM-2",""),("CCM-3",""),("CCM-4",""),("CCM-5",""),
         ("CCM-6",""),("MIXER-1",""),("OT-1",""),("OT-2",""),("OT-3","")],
    3:  [("BATTERY-1",""),("BATTERY-2",""),("BATTERY-3",""),
         ("CPP",""),("BRC",""),("WBRC","")],
    4:  [("MILL","LINE-1"),("MILL","LINE-2")],
    5:  [("CONV-A",""),("CONV-B",""),("CONV-C",""),
         ("M/C-1",""),("M/C-2",""),("BAR MILL","")],
    6:  [("BILLET MIL","")],
    7:  [("MILL","")],
    8:  [("MILL","")],
    9:  [("MILL","")],
    10: [("MILL","")],
    11: [("MILL","")],
    12: [("MILL","")],
    13: [("MILL","")],
    14: [("TG-1",""),("TG-2",""),("TG-3",""),("BOILER-1",""),("BOILER-2","")],
    15: [("CONV-A",""),("CONV-B",""),("WAGON TIPPLER",""),("STOCKYARD","")],
}


def seed_database():
    """Creates all tables and inserts default data on first run."""
    # Create all tables defined in models.py
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── Seed equipment master ──────────────────────────
        if db.query(EquipmentMaster).count() == 0:
            for shop_code, shop_desc in SHOP_MAP.items():
                eqpts = EQPT_BY_SHOP.get(shop_code, [])
                for eqpt, sub in eqpts:
                    db.add(EquipmentMaster(
                        shop_code=shop_code,
                        shop_desc=shop_desc,
                        eqpt_code=eqpt,
                        sub_eqpt_code=sub,
                    ))
            print("  ✓ Equipment master seeded (15 shops)")

        # ── Seed default sys_admin user ────────────────────
        if db.query(User).count() == 0:
            from passlib.context import CryptContext
            pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
            db.add(User(
                emp_no="ADMIN001",
                password=pwd_ctx.hash("admin123"),
                emp_name="System Admin",
                dept="IT",
                designation="Administrator",
                role="sys_admin",
                active=True,
            ))
            print("  ✓ Default admin created  →  emp_no: ADMIN001 | password: admin123")

        db.commit()
        print("✅ Database ready: steel_delays.db")

    finally:
        db.close()


if __name__ == "__main__":
    print("Initializing database …")
    seed_database()
