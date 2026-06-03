# backend/data_clean.py
# Cleans sampledelay.csv and imports into the database
#
# Usage:
#   python data_clean.py --csv path/to/sampledelay.csv
#   python data_clean.py --csv path/to/sampledelay.csv --no-import   (clean only)
#
# What this does:
#   1. Loads raw CSV  (80,532 rows)
#   2. Parses dates: DEL_DATE (dd-mm-yyyy) + DELAY_FROM/TO (float hours like 10.3 = 10:30)
#   3. Normalizes agency codes (maps '0' → 'MIS', etc.)
#   4. Fills missing delay_duration from datetime difference
#   5. Drops zero-duration, missing-date, and junk test rows
#   6. Maps shop_code → shop_desc
#   7. Bulk-inserts 500 rows at a time into delays_data table
#   8. Exports cleaned_delays.csv for audit

import argparse
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session

from database import SessionLocal, seed_database
from models import DelayRecord

# ── Agency normalization map ──────────────────────────────
AGENCY_NORMALIZE = {
    "O": "O", "M": "M", "E": "E", "SD": "SD",
    "C": "C", "CR": "CR", "ID": "ID", "MIS": "MIS",
    "MS": "MS", "S": "S", "I": "I", "P": "P",
    "R": "R", "IR": "IR",
    "0": "MIS",    # bad data → miscellaneous
}

SHOP_MAP = {
    1: "Blast Furnace",       2: "Steel Melt Shop",
    3: "Coke Ovens",          4: "Sinter Plant",
    5: "Wire Rod Mill",       6: "Bar Mill",
    7: "Medium Merchant Mill",8: "Light Merchant Mill",
    9: "Structural Mill",    10: "Rail & Structural Mill",
   11: "Plate Mill",         12: "Hot Strip Mill",
   13: "Cold Rolling Mill",  14: "Power Plant",
   15: "Raw Materials Handling",
}


def parse_datetime(del_date_str: str, hour_float):
    """
    Converts DEL_DATE (string 'dd-mm-yyyy') + hour float (e.g. 10.3 = 10:30)
    into a Python datetime. Returns None on failure.
    """
    try:
        base  = datetime.strptime(str(del_date_str).strip(), "%d-%m-%Y")
        h     = float(hour_float)
        hours = int(h)
        mins  = int(round((h - hours) * 100))     # 10.3 → h=10, m=30
        if hours >= 24:
            hours = hours % 24
        if mins >= 60:
            mins = 0
        return base.replace(hour=hours, minute=mins, second=0, microsecond=0)
    except Exception:
        return None


def clean_csv(csv_path: str) -> pd.DataFrame:
    print(f"\n📂  Loading: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"    Raw rows loaded: {len(df):,}")

    # ── 1. Drop completely empty rows ─────────────────────
    df.dropna(how="all", inplace=True)

    # ── 2. Parse delay_from and delay_upto datetimes ──────
    print("    Parsing dates …")
    df["delay_from"] = df.apply(
        lambda r: parse_datetime(r["DEL_DATE"], r["DELAY_FROM"]), axis=1
    )
    df["delay_upto"] = df.apply(
        lambda r: parse_datetime(r["DEL_DATE"], r["DELAY_TO"]), axis=1
    )

    # ── 3. Get / compute delay duration ───────────────────
    df["delay_duration"] = pd.to_numeric(df["DELAY_DURN"], errors="coerce")
    missing_dur = df["delay_duration"].isna() | (df["delay_duration"] <= 0)
    computed = (
        (df.loc[missing_dur, "delay_upto"] - df.loc[missing_dur, "delay_from"])
        .dt.total_seconds() / 3600
    )
    df.loc[missing_dur, "delay_duration"] = computed

    # ── 4. Normalize agency code ───────────────────────────
    df["agency"] = (
        df["AGENCY_CODE"]
        .astype(str).str.strip().str.upper()
        .map(AGENCY_NORMALIZE)
        .fillna("MIS")
    )

    # ── 5. Map shop description ───────────────────────────
    df["shop_code"] = pd.to_numeric(df["SHOP_CODE"], errors="coerce").fillna(0).astype(int)
    df["shop_desc"] = df["shop_code"].map(SHOP_MAP).fillna("Unknown Shop")

    # ── 6. Clean text fields ──────────────────────────────
    df["eqpt_name"]     = df["EQPT"].fillna("").astype(str).str.strip()
    df["sub_eqpt_name"] = df["SUB_EQPT"].fillna("").astype(str).str.strip()
    df["delay_desc"]    = df["REMARKS"].fillna("").astype(str).str.strip()

    # ── 7. Drop junk rows ─────────────────────────────────
    before = len(df)
    df = df[df["delay_from"].notna()]                                          # must have start time
    df = df[df["delay_duration"].notna() & (df["delay_duration"] > 0)]        # must have duration
    df = df[~df["delay_desc"].str.contains("don't delete", case=False, na=False)]  # remove test rows
    df = df[df["delay_duration"] < 200]                                        # cap unrealistic durations
    print(f"    Dropped {before - len(df):,} invalid rows → {len(df):,} clean rows remain")

    # ── 8. Final output columns ───────────────────────────
    df["user_entered"] = "CSV_IMPORT"
    df["timestamp"]    = datetime.utcnow()

    keep = [
        "shop_code", "shop_desc", "eqpt_name", "sub_eqpt_name",
        "agency", "delay_from", "delay_upto", "delay_duration",
        "delay_desc", "user_entered", "timestamp"
    ]
    return df[keep].reset_index(drop=True)


def import_to_db(df: pd.DataFrame):
    seed_database()
    db: Session = SessionLocal()
    BATCH = 500
    try:
        print(f"\n💾  Importing {len(df):,} rows (batch size {BATCH}) …")
        for i in range(0, len(df), BATCH):
            chunk = df.iloc[i:i + BATCH]
            objects = [
                DelayRecord(
                    shop_code     = int(r.shop_code),
                    shop_desc     = r.shop_desc,
                    eqpt_name     = r.eqpt_name     or None,
                    sub_eqpt_name = r.sub_eqpt_name or None,
                    agency        = r.agency,
                    delay_from    = r.delay_from,
                    delay_upto    = r.delay_upto,
                    delay_duration= round(float(r.delay_duration), 4),
                    delay_desc    = r.delay_desc    or None,
                    user_entered  = r.user_entered,
                    timestamp     = r.timestamp,
                )
                for _, r in chunk.iterrows()
            ]
            db.bulk_save_objects(objects)
            db.commit()
            done = min(i + BATCH, len(df))
            print(f"    ✓ {done:,} / {len(df):,} rows imported")
        print("\n✅  Import complete! All records are now in delays_data table.")
    except Exception as e:
        db.rollback()
        print(f"\n❌  Import failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Clean and import Vizag Steel delay CSV into the database"
    )
    parser.add_argument("--csv",       required=True, help="Path to sampledelay.csv")
    parser.add_argument("--export",    default="cleaned_delays.csv", help="Output path for cleaned CSV")
    parser.add_argument("--no-import", action="store_true",          help="Only clean, skip DB import")
    args = parser.parse_args()

    # Clean
    df_clean = clean_csv(args.csv)

    # Export cleaned CSV
    df_clean.to_csv(args.export, index=False)
    print(f"\n📄  Cleaned CSV exported → {args.export}")

    # Import to DB
    if not args.no_import:
        import_to_db(df_clean)
    else:
        print("    (DB import skipped — --no-import flag set)")
