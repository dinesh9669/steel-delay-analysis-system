// frontend/src/utils/api.js
const BASE = "http://localhost:8000";

export const getToken    = ()   => localStorage.getItem("token");
export const getUser     = ()   => ({
  token:    localStorage.getItem("token"),
  role:     localStorage.getItem("role"),
  emp_name: localStorage.getItem("emp_name"),
  emp_no:   localStorage.getItem("emp_no"),
});
export const saveAuth    = d    => {
  localStorage.setItem("token",    d.access_token);
  localStorage.setItem("role",     d.role);
  localStorage.setItem("emp_name", d.emp_name);
  localStorage.setItem("emp_no",   d.emp_no);
};
export const clearAuth = () =>
  ["token","role","emp_name","emp_no"].forEach(k => localStorage.removeItem(k));

async function req(method, path, body = null) {
  const token   = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(BASE + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

// Auth
export const login = (emp_no, password) => {
  const form = new URLSearchParams({ username: emp_no, password });
  return fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.detail); return d; });
};

// Masters
export const getShops        = ()           => req("GET", "/api/masters/shops");
export const getEquipment    = (sc)         => req("GET", `/api/masters/equipment?shop_code=${sc}`);
export const getSubEquipment = (sc, eq)     => req("GET", `/api/masters/sub-equipment?shop_code=${sc}&eqpt_code=${encodeURIComponent(eq)}`);

// Delays
export const createDelay = (p)             => req("POST",   "/api/delays/", p);
export const listDelays  = (p = {})        => req("GET",    "/api/delays/?" + new URLSearchParams(p));
export const deleteDelay = (id)            => req("DELETE", `/api/delays/${id}`);

// Users
export const listUsers    = ()             => req("GET",   "/api/users/");
export const createUser   = (p)            => req("POST",  "/api/users/", p);
export const updateRole   = (id, role)     => req("PATCH", `/api/users/${id}/role`,   { role });
export const updateStatus = (id, active)   => req("PATCH", `/api/users/${id}/status`, { active });

// Reports
export const getTabular  = (p = {})        => req("GET", "/api/reports/tabular?"  + new URLSearchParams(p));
export const getChart    = (p = {})        => req("GET", "/api/reports/chart?"    + new URLSearchParams(p));
export const getSummary  = (p = {})        => req("GET", "/api/reports/summary?"  + new URLSearchParams(p));

// Dashboard (new)
export const getLiveKPIs      = ()          => req("GET", "/api/dashboard/live");
export const getShiftAnalysis = (p = {})    => req("GET", "/api/dashboard/shift-analysis?" + new URLSearchParams(p));
export const getTopEquipment  = (p = {})    => req("GET", "/api/dashboard/top-equipment?"  + new URLSearchParams(p));
export const getTrend         = (p = {})    => req("GET", "/api/dashboard/trend?"          + new URLSearchParams(p));
export const getAlerts        = (p = {})    => req("GET", "/api/dashboard/alerts?"         + new URLSearchParams(p));

export const exportExcel = (p = {}) => {
  const token = getToken();
  const url   = `${BASE}/api/dashboard/export-excel?` + new URLSearchParams(p);
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(async r => {
      if (!r.ok) throw new Error("Export failed");
      const blob = await r.blob();
      const a    = document.createElement("a");
      a.href     = URL.createObjectURL(blob);
      a.download = `delays_${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
    });
};

