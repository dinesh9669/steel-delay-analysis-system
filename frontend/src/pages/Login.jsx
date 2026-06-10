// frontend/src/pages/Login.jsx — Dark Industrial Redesign
import { useState } from "react";
import { login, saveAuth } from "../utils/api";

export default function Login({ onLogin }) {
  const [empNo,    setEmpNo]   = useState("");
  const [password, setPass]    = useState("");
  const [error,    setError]   = useState("");
  const [loading,  setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await login(empNo.trim().toUpperCase(), password);
      saveAuth(data); onLogin(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={S.page}>
      <div style={S.grid} />
      <div style={S.scanline} />
      <div style={S.wrapper}>
        {/* Left brand panel */}
        <div style={S.brandPanel}>
          <div style={{ fontSize: "60px", marginBottom: "20px", filter: "drop-shadow(0 0 20px #f9731660)" }}>⚙</div>
          <h1 style={S.brandTitle}>VIZAG<br />STEEL</h1>
          <p style={S.brandSub}>RASHTRIYA ISPAT NIGAM LTD.</p>
          <div style={{ height: "1px", background: "var(--border-bright)", margin: "28px 0" }} />
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.7 }}>
            Centralized Delay Analysis System — digitizing equipment delay capture
            across 15 major production departments.
          </p>
          
        </div>

        {/* Right form panel */}
        <div style={S.formPanel}>
          <div style={{ width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔐</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: "700", letterSpacing: "0.12em", color: "var(--text-primary)", marginBottom: "6px" }}>
                SYSTEM ACCESS
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>Enter your credentials to proceed</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {[
                { label: "EMPLOYEE NUMBER", icon: "👤", type: "text",     val: empNo,    set: setEmpNo,   ph: "e.g. ADMIN001" },
                { label: "PASSWORD",        icon: "🔑", type: "password", val: password, set: setPass,    ph: "Enter password" },
              ].map(f => (
                <div key={f.label} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-display)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "700" }}>
                    {f.label}
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <span style={{ position: "absolute", left: "12px", fontSize: "14px" }}>{f.icon}</span>
                    <input
                      style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border-bright)", borderRadius: "8px", padding: "11px 14px 11px 40px", color: "var(--text-primary)", fontSize: "14px", outline: "none" }}
                      type={f.type} placeholder={f.ph} value={f.val}
                      onChange={e => f.set(e.target.value)} required
                      autoFocus={f.label === "EMPLOYEE NUMBER"}
                    />
                  </div>
                </div>
              ))}

              {error && (
                <div style={{ padding: "10px 14px", background: "#ef444410", border: "1px solid #ef444440", borderRadius: "8px", color: "var(--accent-red)", fontSize: "13px" }}>
                  ⚠ {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff", border: "none", borderRadius: "8px", padding: "13px", fontSize: "13px", fontWeight: "700", fontFamily: "var(--font-display)", letterSpacing: "0.1em", cursor: loading ? "not-allowed" : "pointer", boxShadow: "var(--glow-orange)", opacity: loading ? 0.7 : 1 }}>
                {loading ? "AUTHENTICATING…" : "SIGN IN →"}
              </button>
            </form>


          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
  grid: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(var(--border-dim) 1px, transparent 1px), linear-gradient(90deg, var(--border-dim) 1px, transparent 1px)", backgroundSize: "50px 50px", opacity: 0.4 },
  scanline: { position: "absolute", left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, var(--accent-primary), transparent)", opacity: 0.3, animation: "scanline 4s linear infinite", pointerEvents: "none" },
  wrapper: { display: "flex", maxWidth: "900px", width: "100%", margin: "20px", position: "relative", zIndex: 1, borderRadius: "16px", overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px var(--border-dim)" },
  brandPanel: { flex: 1, background: "linear-gradient(160deg, #0f1c2e, #0a1520)", padding: "48px 40px", borderRight: "1px solid var(--border-dim)", display: "flex", flexDirection: "column" },
  brandTitle: { fontFamily: "var(--font-display)", fontSize: "52px", fontWeight: "700", lineHeight: 1, letterSpacing: "0.1em", color: "var(--text-primary)", textShadow: "0 0 40px #f9731620" },
  brandSub: { fontFamily: "var(--font-display)", fontSize: "11px", letterSpacing: "0.2em", color: "var(--accent-primary)", marginTop: "8px", textTransform: "uppercase" },
  formPanel: { width: "380px", flexShrink: 0, background: "var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 36px" },
};
