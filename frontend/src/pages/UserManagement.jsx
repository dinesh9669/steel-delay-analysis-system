// frontend/src/pages/UserManagement.jsx
// Page 3 — User Management
// Add users, modify role (dropdown), toggle active/inactive status
// Roles are hardcoded: sys_admin | dept_user | dept_admin | ppm_user | ppm_admin
// Status is hardcoded: Active | Inactive (toggled via button)

import { useState, useEffect } from "react";
import { listUsers, createUser, updateRole, updateStatus } from "../utils/api";

// Hardcoded roles (as per project spec)
const ROLES = ["sys_admin", "dept_admin", "dept_user", "ppm_admin", "ppm_user"];

const ROLE_BADGE = {
  sys_admin:  { bg: "#fef3c7", color: "#92400e" },
  dept_admin: { bg: "#dbeafe", color: "#1e40af" },
  dept_user:  { bg: "#dcfce7", color: "#166534" },
  ppm_admin:  { bg: "#ede9fe", color: "#5b21b6" },
  ppm_user:   { bg: "#f0fdf4", color: "#14532d" },
};

const EMPTY = { emp_no: "", password: "", emp_name: "", dept: "", designation: "", role: "dept_user" };

export default function UserManagement() {
  const [users,    setUsers]   = useState([]);
  const [showAdd,  setShowAdd] = useState(false);
  const [form,     setForm]    = useState(EMPTY);
  const [msg,      setMsg]     = useState(null);
  const [saving,   setSaving]  = useState(false);
  const [search,   setSearch]  = useState("");

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  }

  function onChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await createUser({ ...form, emp_no: form.emp_no.trim().toUpperCase() });
      setMsg({ type: "success", text: `✅ User ${form.emp_no.toUpperCase()} added successfully.` });
      setForm(EMPTY);
      setShowAdd(false);
      fetchUsers();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(user, newRole) {
    try {
      await updateRole(user.id, newRole);
      fetchUsers();
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  }

  async function handleToggle(user) {
    try {
      await updateStatus(user.id, !user.active);
      fetchUsers();
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  }

  const filtered = users.filter(u =>
    u.emp_no.toLowerCase().includes(search.toLowerCase()) ||
    u.emp_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <div>
          <h2 style={S.title}>User Management</h2>
          <p style={S.subtitle}>Manage system users, roles and access status</p>
        </div>
        <button onClick={() => { setShowAdd(!showAdd); setMsg(null); }}
                style={S.btnPrimary}>
          {showAdd ? "✕ Cancel" : "+ Add User"}
        </button>
      </div>

      {/* Flash message */}
      {msg && (
        <div style={{
          ...S.flash,
          background:  msg.type === "success" ? "#f0fdf4" : "#fef2f2",
          borderColor: msg.type === "success" ? "#86efac" : "#fca5a5",
          color:       msg.type === "success" ? "#166534" : "#dc2626",
        }}>
          {msg.text}
        </div>
      )}

      {/* ── Add User Form ── */}
      {showAdd && (
        <div style={S.formCard}>
          <h3 style={S.formTitle}>Add New User</h3>
          <form onSubmit={handleAdd}>
            <div style={S.grid3}>
              <div style={S.field}>
                <label style={S.label}>Employee No *</label>
                <input name="emp_no" value={form.emp_no} onChange={onChange}
                       style={S.input} placeholder="e.g. EMP1001" required />
              </div>
              <div style={S.field}>
                <label style={S.label}>Password *</label>
                <input name="password" type="password" value={form.password}
                       onChange={onChange} style={S.input} placeholder="Set password" required />
              </div>
              <div style={S.field}>
                <label style={S.label}>Full Name *</label>
                <input name="emp_name" value={form.emp_name} onChange={onChange}
                       style={S.input} placeholder="Employee full name" required />
              </div>
              <div style={S.field}>
                <label style={S.label}>Department</label>
                <input name="dept" value={form.dept} onChange={onChange}
                       style={S.input} placeholder="e.g. Blast Furnace" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Designation</label>
                <input name="designation" value={form.designation} onChange={onChange}
                       style={S.input} placeholder="e.g. Junior Manager" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Role *</label>
                {/* Hardcoded role list */}
                <select name="role" value={form.role} onChange={onChange} style={S.select} required>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button type="submit"
                      style={{ ...S.btnPrimary, opacity: saving ? 0.7 : 1 }}
                      disabled={saving}>
                {saving ? "Saving…" : "Save User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search bar ── */}
      <div style={{ marginBottom: "12px" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...S.input, maxWidth: "300px", fontSize: "13px" }}
          placeholder="🔍  Search by emp no or name…"
        />
      </div>

      {/* ── Users Table ── */}
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              {["Emp No", "Name", "Department", "Designation", "Role", "Status", "Actions"].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => {
              const rb = ROLE_BADGE[u.role] || { bg: "#f3f4f6", color: "#374151" };
              return (
                <tr key={u.id} style={{ ...S.tr, background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={{ ...S.td, fontWeight: "600" }}>{u.emp_no}</td>
                  <td style={S.td}>{u.emp_name}</td>
                  <td style={S.td}>{u.dept}</td>
                  <td style={S.td}>{u.designation}</td>

                  {/* Role — inline dropdown (hardcoded options) */}
                  <td style={S.td}>
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u, e.target.value)}
                      style={{
                        background: rb.bg, color: rb.color,
                        border: "none", borderRadius: "20px",
                        padding: "3px 10px", fontSize: "12px",
                        fontWeight: "600", cursor: "pointer",
                      }}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>

                  {/* Status — hardcoded Active / Inactive badge */}
                  <td style={S.td}>
                    <span style={{
                      background:   u.active ? "#dcfce7" : "#fee2e2",
                      color:        u.active ? "#166534" : "#dc2626",
                      borderRadius: "20px",
                      padding:      "3px 12px",
                      fontSize:     "12px",
                      fontWeight:   "600",
                    }}>
                      {u.active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Toggle active status */}
                  <td style={S.td}>
                    <button
                      onClick={() => handleToggle(u)}
                      style={{
                        background:   u.active ? "#fee2e2" : "#dcfce7",
                        color:        u.active ? "#dc2626" : "#166534",
                        border:       "none", borderRadius: "6px",
                        padding:      "5px 14px", fontSize: "12px",
                        fontWeight:   "600", cursor: "pointer",
                      }}
                    >
                      {u.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "#9ca3af", fontSize: "14px" }}>
                  {search ? "No users match your search." : "No users found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: "10px", fontSize: "12px", color: "#9ca3af" }}>
        {filtered.length} user{filtered.length !== 1 ? "s" : ""} shown
      </p>
    </div>
  );
}

const S = {
  page:      { padding: "28px", maxWidth: "1100px", margin: "0 auto" },
  header:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  title:     { margin: "0 0 4px", fontSize: "22px", fontWeight: "700", color: "#111827" },
  subtitle:  { margin: 0, fontSize: "13px", color: "#6b7280" },
  flash:     { padding: "12px 16px", border: "1px solid", borderRadius: "9px", fontSize: "14px", marginBottom: "16px" },
  formCard:  { background: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.08)" },
  formTitle: { margin: "0 0 16px", fontSize: "16px", fontWeight: "600", color: "#111827" },
  grid3:     { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" },
  field:     { display: "flex", flexDirection: "column", gap: "5px" },
  label:     { fontSize: "12px", fontWeight: "600", color: "#374151" },
  input:     { padding: "8px 12px", border: "1.5px solid #d1d5db", borderRadius: "7px", fontSize: "14px", color: "#111827", outline: "none" },
  select:    { padding: "8px 12px", border: "1.5px solid #d1d5db", borderRadius: "7px", fontSize: "14px", background: "#fff", color: "#111827", outline: "none" },
  btnPrimary:{ background: "#0f3460", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 22px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  tableWrap: { background: "#fff", borderRadius: "12px", boxShadow: "0 1px 6px rgba(0,0,0,0.08)", overflow: "hidden" },
  table:     { width: "100%", borderCollapse: "collapse" },
  th:        { background: "#f8fafc", padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" },
  tr:        { borderBottom: "1px solid #f3f4f6" },
  td:        { padding: "12px 14px", fontSize: "13px", color: "#374151" },
};
