// frontend/src/components/UI.jsx
// Shared dark industrial design system components

export function Card({ children, style = {}, glow = false }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-dim)",
      borderRadius: "12px",
      padding: "24px",
      boxShadow: glow ? "var(--glow-orange), inset 0 1px 0 #ffffff08" : "inset 0 1px 0 #ffffff08",
      ...style,
    }}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, accent = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
      {accent && <div style={{ width: "3px", height: "20px", background: "var(--accent-primary)", borderRadius: "2px" }} />}
      <h2 style={{
        fontFamily: "var(--font-display)",
        fontSize: "18px",
        fontWeight: "700",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: accent ? "var(--text-primary)" : "var(--text-secondary)",
      }}>
        {children}
      </h2>
    </div>
  );
}

export function StatCard({ label, value, sub, icon, color = "var(--accent-primary)", trend }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-dim)",
      borderRadius: "12px",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
      transition: "border-color 0.2s, transform 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-dim)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Background glow */}
      <div style={{ position: "absolute", top: 0, right: 0, width: "80px", height: "80px",
        background: color, opacity: 0.06, borderRadius: "0 12px 0 80px", filter: "blur(10px)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.1em",
            textTransform: "uppercase", fontFamily: "var(--font-display)", marginBottom: "8px" }}>
            {label}
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", fontFamily: "var(--font-display)",
            color: "var(--text-primary)", lineHeight: 1, animation: "countUp 0.5s ease" }}>
            {value}
          </div>
          {sub && <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{sub}</div>}
        </div>
        <div style={{ fontSize: "28px", opacity: 0.7 }}>{icon}</div>
      </div>
      {trend !== undefined && (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-dim)",
          fontSize: "12px", color: trend >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last week
        </div>
      )}
    </div>
  );
}

export function Badge({ label, color = "orange" }) {
  const map = {
    orange:   { bg: "#f9731620", border: "#f9731640", text: "#f97316" },
    blue:     { bg: "#38bdf820", border: "#38bdf840", text: "#38bdf8" },
    green:    { bg: "#22c55e20", border: "#22c55e40", text: "#22c55e" },
    red:      { bg: "#ef444420", border: "#ef444440", text: "#ef4444" },
    yellow:   { bg: "#eab30820", border: "#eab30840", text: "#eab308" },
    gray:     { bg: "#4a556820", border: "#4a556840", text: "#8899aa" },
  };
  const c = map[color] || map.gray;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "700",
      fontFamily: "var(--font-display)",
      letterSpacing: "0.06em",
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
    }}>
      {label}
    </span>
  );
}

export function RiskBadge({ level }) {
  const map = { CRITICAL: "red", HIGH: "orange", MEDIUM: "yellow", WARNING: "yellow", LOW: "green" };
  return <Badge label={level} color={map[level] || "gray"} />;
}

export function Input({ label, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && <label style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-display)",
        textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "600" }}>{label}</label>}
      <input
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-bright)",
          borderRadius: "8px",
          padding: "10px 14px",
          color: "var(--text-primary)",
          fontSize: "14px",
          transition: "border-color 0.2s",
          width: "100%",
        }}
        {...props}
      />
    </div>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && <label style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-display)",
        textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "600" }}>{label}</label>}
      <select
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-bright)",
          borderRadius: "8px",
          padding: "10px 14px",
          color: "var(--text-primary)",
          fontSize: "14px",
          cursor: "pointer",
          width: "100%",
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Textarea({ label, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && <label style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-display)",
        textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "600" }}>{label}</label>}
      <textarea
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-bright)",
          borderRadius: "8px",
          padding: "10px 14px",
          color: "var(--text-primary)",
          fontSize: "14px",
          resize: "vertical",
          fontFamily: "var(--font-body)",
          minHeight: "90px",
          width: "100%",
        }}
        {...props}
      />
    </div>
  );
}

export function PrimaryBtn({ children, loading, ...props }) {
  return (
    <button
      style={{
        background: loading ? "var(--bg-elevated)" : "linear-gradient(135deg, #f97316, #ea580c)",
        color: loading ? "var(--text-muted)" : "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "11px 28px",
        fontSize: "13px",
        fontWeight: "700",
        fontFamily: "var(--font-display)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow: loading ? "none" : "var(--glow-orange)",
        transition: "all 0.2s",
      }}
      disabled={loading}
      {...props}
    >
      {loading ? "Processing…" : children}
    </button>
  );
}

export function GhostBtn({ children, ...props }) {
  return (
    <button
      style={{
        background: "transparent",
        color: "var(--text-secondary)",
        border: "1px solid var(--border-bright)",
        borderRadius: "8px",
        padding: "11px 20px",
        fontSize: "13px",
        fontWeight: "600",
        fontFamily: "var(--font-display)",
        letterSpacing: "0.06em",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--text-secondary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-bright)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
      {...props}
    >
      {children}
    </button>
  );
}

export function Flash({ msg }) {
  if (!msg) return null;
  const isOk = msg.type === "success";
  return (
    <div style={{
      padding: "12px 16px",
      borderRadius: "8px",
      border: `1px solid ${isOk ? "#22c55e40" : "#ef444440"}`,
      background: isOk ? "#22c55e10" : "#ef444410",
      color: isOk ? "var(--accent-green)" : "var(--accent-red)",
      fontSize: "13px",
      marginBottom: "16px",
      animation: "fadeIn 0.3s ease",
    }}>
      {isOk ? "✓  " : "⚠  "}{msg.text}
    </div>
  );
}

export function DataTable({ columns, rows, emptyMsg = "No records found." }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid var(--border-dim)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
        <thead>
          <tr style={{ background: "var(--bg-elevated)" }}>
            {columns.map(c => (
              <th key={c.key} style={{
                padding: "11px 14px",
                textAlign: "left",
                fontSize: "10px",
                fontFamily: "var(--font-display)",
                fontWeight: "700",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                borderBottom: "1px solid var(--border-bright)",
                whiteSpace: "nowrap",
              }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: "36px", textAlign: "center",
                color: "var(--text-muted)", fontStyle: "italic" }}>
                {emptyMsg}
              </td>
            </tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{
              borderBottom: "1px solid var(--border-dim)",
              transition: "background 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {columns.map(c => (
                <td key={c.key} style={{
                  padding: "11px 14px",
                  fontSize: "13px",
                  color: "var(--text-primary)",
                  maxWidth: "180px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: "700",
          letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-primary)",
          lineHeight: 1.2 }}>
          {title}
        </h1>
        {subtitle && <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "13px" }}>{subtitle}</p>}
      </div>
      {children && <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>{children}</div>}
    </div>
  );
}
