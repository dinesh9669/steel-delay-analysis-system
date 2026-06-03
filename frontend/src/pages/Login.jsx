// frontend/src/pages/Login.jsx
// Page 1 — Login Page
// Employee number + password → JWT token → redirect to main app

import { useState } from "react";
import { login, saveAuth } from "../utils/api";

export default function Login({ onLogin }) {
  const [empNo,    setEmpNo]   = useState("");
  const [password, setPassword]= useState("");
  const [error,    setError]   = useState("");
  const [loading,  setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!empNo.trim() || !password) return;
    setError("");
    setLoading(true);
    try {
      const data = await login(empNo.trim().toUpperCase(), password);
      saveAuth(data);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.bg}>
      <div style={S.card}>

        {/* Logo + Title */}
        <div style={S.header}>
          <div style={S.logoBox}>⚙️</div>
          <h1 style={S.title}>Vizag Steel Plant</h1>
          <p style={S.subtitle}>Centralized Delay Analysis System</p>
          <p style={S.subtitle2}>RINL · Visakhapatnam</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.field}>
            <label style={S.label}>Employee Number</label>
            <input
              style={S.input}
              type="text"
              placeholder="e.g. ADMIN001"
              value={empNo}
              onChange={e => setEmpNo(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={S.field}>
            <label style={S.label}>Password</label>
            <input
              style={S.input}
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Error message */}
          {error && (
            <div style={S.error}>
              <span>⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            style={{ ...S.btn, opacity: loading ? 0.75 : 1 }}
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={S.hint}>Default: ADMIN001 / admin123</p>
      </div>
    </div>
  );
}

const S = {
  bg: {
    minHeight:      "100vh",
    background:     "linear-gradient(135deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%)",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontFamily:     "'Segoe UI', Tahoma, sans-serif",
    padding:        "16px",
  },
  card: {
    background:   "#ffffff",
    borderRadius: "18px",
    padding:      "44px 40px 32px",
    width:        "100%",
    maxWidth:     "400px",
    boxShadow:    "0 32px 64px rgba(0,0,0,0.4)",
  },
  header: {
    textAlign:    "center",
    marginBottom: "32px",
  },
  logoBox: {
    fontSize:     "52px",
    marginBottom: "12px",
    display:      "block",
  },
  title: {
    margin:     "0 0 6px",
    fontSize:   "22px",
    fontWeight: "700",
    color:      "#0f3460",
  },
  subtitle: {
    margin:   "0",
    fontSize: "13px",
    color:    "#4b5563",
  },
  subtitle2: {
    margin:   "2px 0 0",
    fontSize: "12px",
    color:    "#9ca3af",
  },
  form: {
    display:       "flex",
    flexDirection: "column",
    gap:           "18px",
  },
  field: {
    display:       "flex",
    flexDirection: "column",
    gap:           "6px",
  },
  label: {
    fontSize:   "13px",
    fontWeight: "600",
    color:      "#374151",
  },
  input: {
    padding:      "11px 14px",
    border:       "1.5px solid #d1d5db",
    borderRadius: "9px",
    fontSize:     "14px",
    color:        "#111827",
    outline:      "none",
    transition:   "border-color 0.2s",
  },
  error: {
    display:      "flex",
    alignItems:   "center",
    gap:          "8px",
    background:   "#fef2f2",
    border:       "1px solid #fca5a5",
    color:        "#dc2626",
    borderRadius: "8px",
    padding:      "10px 14px",
    fontSize:     "13px",
  },
  btn: {
    background:   "#0f3460",
    color:        "#ffffff",
    border:       "none",
    borderRadius: "9px",
    padding:      "13px",
    fontSize:     "15px",
    fontWeight:   "600",
    cursor:       "pointer",
    marginTop:    "4px",
  },
  hint: {
    textAlign:  "center",
    fontSize:   "11px",
    color:      "#d1d5db",
    marginTop:  "16px",
    marginBottom: 0,
    background: "#f9fafb",
    borderRadius: "6px",
    padding:    "6px",
  },
};
