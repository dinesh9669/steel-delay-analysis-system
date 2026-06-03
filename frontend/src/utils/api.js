// frontend/src/utils/api.js
// Centralized API helper — attaches JWT token to every request automatically

const BASE_URL = "http://localhost:8000";

// ── Token helpers ─────────────────────────────────────────
export function getToken()   { return localStorage.getItem("token");    }
export function getUser()    {
  return {
    token:    localStorage.getItem("token"),
    role:     localStorage.getItem("role"),
    emp_name: localStorage.getItem("emp_name"),
    emp_no:   localStorage.getItem("emp_no"),
  };
}

export function saveAuth(data) {
  localStorage.setItem("token",    data.access_token);
  localStorage.setItem("role",     data.role);
  localStorage.setItem("emp_name", data.emp_name);
  localStorage.setItem("emp_no",   data.emp_no);
}

export function clearAuth() {
  ["token", "role", "emp_name", "emp_no"].forEach(k => localStorage.removeItem(k));
}

// ── Generic fetch wrapper with auth header ─────────────────
async function req(method, path, body = null) {
  const token   = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res  = await fetch(BASE_URL + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

// ── Auth ──────────────────────────────────────────────────
export const login = (emp_no, password) => {
  // OAuth2 form requires x-www-form-urlencoded, not JSON
  const form = new URLSearchParams({ username: emp_no, password });
  return fetch(`${BASE_URL}/api/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    form,
  }).then(async r => {
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || "Login failed");
    return d;
  });
};

// ── Masters (dropdown data) ───────────────────────────────
export const getShops        = ()                    => req("GET", "/api/masters/shops");
export const getEquipment    = (shop_code)           => req("GET", `/api/masters/equipment?shop_code=${shop_code}`);
export const getSubEquipment = (shop_code, eqpt)     => req("GET", `/api/masters/sub-equipment?shop_code=${shop_code}&eqpt_code=${encodeURIComponent(eqpt)}`);

// ── Delays ────────────────────────────────────────────────
export const createDelay = (payload)             => req("POST",   "/api/delays/",      payload);
export const listDelays  = (params = {})         => req("GET",    "/api/delays/?"     + new URLSearchParams(params));
export const deleteDelay = (id)                  => req("DELETE", `/api/delays/${id}`);

// ── Users ─────────────────────────────────────────────────
export const listUsers    = ()                   => req("GET",   "/api/users/");
export const createUser   = (payload)            => req("POST",  "/api/users/",         payload);
export const updateRole   = (id, role)           => req("PATCH", `/api/users/${id}/role`,   { role });
export const updateStatus = (id, active)         => req("PATCH", `/api/users/${id}/status`, { active });

// ── Reports ───────────────────────────────────────────────
export const getTabular = (params = {})          => req("GET", "/api/reports/tabular?" + new URLSearchParams(params));
export const getChart   = (params = {})          => req("GET", "/api/reports/chart?"   + new URLSearchParams(params));
export const getSummary = (params = {})          => req("GET", "/api/reports/summary?" + new URLSearchParams(params));
