# Centralized Delay Analysis System
### RINL – Vizag Steel Plant, Visakhapatnam
---

## Exact Project Structure

```
steel-delay-system/
├── requirements.txt              ← Python dependencies (install here)
├── README.md
│
├── backend/
│   ├── main.py                   ← FastAPI entry point  →  uvicorn main:app
│   ├── database.py               ← DB engine, session, seed data
│   ├── models.py                 ← SQLAlchemy ORM: User, EquipmentMaster, DelayRecord
│   ├── data_clean.py             ← CSV cleaner + bulk importer
│   └── routes/
│       ├── auth.py               ← POST /api/auth/login, GET /api/auth/me
│       ├── delays.py             ← CRUD  /api/delays/
│       ├── masters.py            ← GET   /api/masters/shops|equipment|sub-equipment
│       ├── users.py              ← CRUD  /api/users/
│       └── reports.py           ← GET   /api/reports/tabular|chart|summary
│
└── frontend/
    └── src/
        ├── App.jsx               ← Sidebar shell + route guard
        ├── utils/
        │   └── api.js            ← All API calls with JWT auth
        └── pages/
            ├── Login.jsx         ← Page 1: Login
            ├── DelayEntry.jsx    ← Page 2: Delay Entry Form
            ├── UserManagement.jsx← Page 3: User Management
            └── Reports.jsx       ← Page 4: Tabular + Graphical Reports
```

---

## Step-by-Step Execution

### STEP 1 — Install Python Dependencies

```powershell
# From the project root (steel-delay-system/)
cd steel-delay-system

python -m venv venv
.\venv\Scripts\Activate        # Windows PowerShell

pip install -r requirements.txt
```

---

### STEP 2 — Initialize the Database

```powershell
cd backend
python database.py
```

Expected output:
```
Initializing database …
  ✓ Equipment master seeded (15 shops)
  ✓ Default admin created  →  emp_no: ADMIN001 | password: admin123
✅ Database ready: steel_delays.db
```

---

### STEP 3 — Start the Backend Server

```powershell
# Still inside backend/, with venv active
uvicorn main:app --reload --port 8000
```

- API runs at:   http://localhost:8000
- Swagger docs:  http://localhost:8000/docs  ← test all endpoints here

---

### STEP 4 — Setup and Start the Frontend

```powershell
# Open a NEW terminal
cd frontend

# If this is your first time (creates React project)
npx create-react-app . --template cra-template

# Install Recharts (for charts on Page 4)
npm install recharts

# Copy our src/ files into the project (already done)
# Start the dev server
npm start
```

App opens at: http://localhost:3000

Login credentials:
- Employee No: `ADMIN001`
- Password:    `admin123`

---

### STEP 5 — Import CSV Historical Data

```powershell
# From backend/ directory with venv active
python data_clean.py --csv "C:\path\to\sampledelay.csv"
```

What happens:
1. Loads 80,532 raw rows
2. Parses dates (DEL_DATE + float hour like 10.3 = 10:30)
3. Normalizes agency codes
4. Drops zero-duration and junk records
5. Bulk imports in batches of 500
6. Saves `cleaned_delays.csv` for your audit

After import → go to Page 4 (Delay Reports) to see all historical data.

---

## Database Tables

| Table              | Purpose                              |
|--------------------|--------------------------------------|
| `users`            | All system users with roles + status |
| `equipment_master` | Shop → Equipment → Sub-equipment tree|
| `delays_data`      | All captured delay records           |

---

## API Quick Reference

| Method | Endpoint                       | Page | Description              |
|--------|--------------------------------|------|--------------------------|
| POST   | /api/auth/login                | 1    | Login → JWT token        |
| GET    | /api/auth/me                   | —    | Current user info        |
| GET    | /api/masters/shops             | 2    | Shop dropdown            |
| GET    | /api/masters/equipment         | 2    | Equipment by shop        |
| GET    | /api/masters/sub-equipment     | 2    | Sub-equip by shop+eqpt   |
| POST   | /api/delays/                   | 2    | Submit delay             |
| GET    | /api/delays/                   | 4    | List delays (filtered)   |
| DELETE | /api/delays/{id}               | —    | Delete (admin only)      |
| GET    | /api/users/                    | 3    | List users               |
| POST   | /api/users/                    | 3    | Add user                 |
| PATCH  | /api/users/{id}/role           | 3    | Change role              |
| PATCH  | /api/users/{id}/status         | 3    | Toggle active            |
| GET    | /api/reports/tabular           | 4    | Table report             |
| GET    | /api/reports/chart             | 4    | Chart data               |
| GET    | /api/reports/summary           | 4    | KPI cards                |

---

## Role Access Matrix

| Role       | Login | Enter Delay | Reports | Manage Users |
|------------|-------|-------------|---------|--------------|
| sys_admin  | ✅    | ✅          | ✅      | ✅           |
| dept_admin | ✅    | ✅          | ✅      | ❌           |
| dept_user  | ✅    | ✅          | ✅      | ❌           |
| ppm_admin  | ✅    | ❌          | ✅      | ❌           |
| ppm_user   | ✅    | ❌          | ✅      | ❌           |

---

Developed for NSRIT Internship · Vizag Steel Plant
