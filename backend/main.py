# backend/main.py
# FastAPI application entry point
# Run: uvicorn main:app --reload --port 8000
# Docs: http://localhost:8000/docs

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import seed_database
from routes.auth    import router as auth_router
from routes.masters import router as masters_router
from routes.delays  import router as delays_router
from routes.users   import router as users_router
from routes.reports import router as reports_router

# ── Initialize DB on startup ──────────────────────────────
seed_database()

# ── App instance ──────────────────────────────────────────
app = FastAPI(
    title="Vizag Steel Plant – Centralized Delay Analysis System",
    description="Captures and analyses equipment delays across all major departments of RINL Vizag Steel.",
    version="1.0.0",
)

# ── CORS (allow React dev server) ─────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount all routers ─────────────────────────────────────
app.include_router(auth_router)
app.include_router(masters_router)
app.include_router(delays_router)
app.include_router(users_router)
app.include_router(reports_router)


@app.get("/", tags=["root"])
def root():
    return {
        "system":  "Centralized Delay Analysis System",
        "plant":   "RINL – Vizag Steel Plant, Visakhapatnam",
        "version": "1.0.0",
        "docs":    "/docs",
        "status":  "running",
    }
