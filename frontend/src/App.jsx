// frontend/src/App.jsx  (UPDATED — role-based nav + restricted page guard)
//
// Permission rules enforced in the frontend:
//
//  sys_admin  → Dashboard, Delay Entry, Reports, User Management
//  dept_admin → Dashboard, Delay Entry, Reports          (no User Management)
//  dept_user  → Dashboard, Delay Entry, Reports          (no User Management, no Export btn)
//  ppm_admin  → Dashboard, Reports                       (no Delay Entry, no User Management)
//  ppm_user   → Dashboard, Reports                       (no Delay Entry, no User Management, no Export btn)
//
// If a user somehow navigates to a restricted page directly, <AccessDenied> is shown.
// The backend also blocks all restricted API calls independently (defence in depth).

import { useState } from "react";
import Login          from "./pages/Login";
import Dashboard      from "./pages/Dashboard";
import DelayEntry     from "./pages/DelayEntry";
import Reports        from "./pages/Reports";
import UserManagement from "./pages/UserManagement";
import { getUser, clearAuth } from "./utils/api";

// ── Navigation definition with role gates ─────────────────
const NAV = [
  {
    id:    "dashboard",
    label: "Dashboard",
    icon:  "▣",
    roles: ["sys_admin","dept_admin","dept_user","ppm_admin","ppm_user"],
  },
  {
    id:    "delay",
    label: "Delay Entry",
    icon:  "＋",
    // ppm_admin and ppm_user are NOT in this list — they cannot enter delays
    roles: ["sys_admin","dept_admin","dept_user"],
  },
  {
    id:    "reports",
    label: "Reports",
    icon:  "◈",
    roles: ["sys_admin","dept_admin","dept_user","ppm_admin","ppm_user"],
  },
  {
    id:    "users",
    label: "User Management",
    icon:  "◉",
    // Only sys_admin can manage users
    roles: ["sys_admin"],
  },
];

// ── Access denied screen shown if a user navigates to a blocked page ──
function AccessDenied({ page, role }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:"60vh", gap:"16px",
      padding:"40px", animation:"fadeIn 0.4s ease",
    }}>
      <div style={{ fontSize:"64px", opacity:0.3 }}>🔒</div>
      <h2 style={{
        fontFamily:"var(--font-display)", fontSize:"24px", fontWeight:"700",
        letterSpacing:"0.08em", textTransform:"uppercase",
        color:"var(--text-primary)", margin:0,
      }}>
        Access Denied
      </h2>
      <p style={{ color:"var(--text-muted)", fontSize:"14px", textAlign:"center", maxWidth:"360px", lineHeight:1.6 }}>
        Your role <span style={{ color:"var(--accent-primary)", fontFamily:"var(--font-mono)" }}>{role}</span> does
        not have permission to access <strong>{page}</strong>.
      </p>
      <div style={{
        padding:"12px 20px",
        background:"var(--bg-card)",
        border:"1px solid var(--border-bright)",
        borderRadius:"8px",
        fontSize:"12px",
        color:"var(--text-secondary)",
        fontFamily:"var(--font-mono)",
        lineHeight:1.8,
      }}>
        {role === "dept_user"  && "✓ Dashboard  ✓ Delay Entry  ✓ Reports\n✗ User Management  ✗ Export  ✗ Delete"}
        {role === "ppm_admin"  && "✓ Dashboard  ✓ Reports  ✓ Export\n✗ Delay Entry  ✗ User Management  ✗ Delete"}
        {role === "ppm_user"   && "✓ Dashboard  ✓ Reports\n✗ Delay Entry  ✗ User Management  ✗ Export  ✗ Delete"}
        {role === "dept_admin" && "✓ Dashboard  ✓ Delay Entry  ✓ Reports  ✓ Export  ✓ Delete\n✗ User Management"}
      </div>
    </div>
  );
}

// ── Role badge colours ────────────────────────────────────
const ROLE_COLORS = {
  sys_admin:  { bg:"#f9731620", border:"#f9731640", text:"#f97316" },
  dept_admin: { bg:"#38bdf820", border:"#38bdf840", text:"#38bdf8" },
  dept_user:  { bg:"#22c55e20", border:"#22c55e40", text:"#22c55e" },
  ppm_admin:  { bg:"#a855f720", border:"#a855f740", text:"#a855f7" },
  ppm_user:   { bg:"#eab30820", border:"#eab30840", text:"#eab308" },
};

export default function App() {
  const saved = getUser();
  const [user,   setUser]  = useState(saved.token ? saved : null);
  const [active, setActive]= useState("dashboard");

  function handleLogin(data) { setUser(data); setActive("dashboard"); }
  function handleLogout()    { clearAuth(); setUser(null); }

  if (!user) return <Login onLogin={handleLogin} />;

  // Filter nav to only items this role can see
  const visibleNav = NAV.filter(n => n.roles.includes(user.role));
  const rc = ROLE_COLORS[user.role] || ROLE_COLORS.dept_user;

  // Check if the currently active page is permitted
  const activeNavItem   = NAV.find(n => n.id === active);
  const isPagePermitted = activeNavItem?.roles.includes(user.role) ?? false;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg-base)" }}>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside style={{
        width:"220px", minWidth:"220px",
        background:"var(--bg-surface)",
        borderRight:"1px solid var(--border-dim)",
        display:"flex", flexDirection:"column",
        height:"100vh", position:"sticky", top:0,
      }}>

        {/* Brand */}
        <div style={{ padding:"22px 20px 18px", borderBottom:"1px solid var(--border-dim)" }}>
          <div style={{ height:"2px", background:"linear-gradient(90deg,#f97316,#38bdf8)", borderRadius:"2px", marginBottom:"16px" }}/>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <span style={{ fontSize:"26px", filter:"drop-shadow(0 0 6px #f9731650)" }}>⚙</span>
            <div>
              <div style={{ fontFamily:"var(--font-display)", fontWeight:"700", fontSize:"15px",
                letterSpacing:"0.08em", color:"var(--text-primary)", lineHeight:1.2 }}>
                VIZAG STEEL
              </div>
              <div style={{ fontSize:"9px", color:"var(--text-muted)", letterSpacing:"0.12em",
                textTransform:"uppercase", marginTop:"2px" }}>
                Delay Analysis v2
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding:"12px 10px", flex:1, display:"flex", flexDirection:"column", gap:"2px" }}>
          {visibleNav.map(item => {
            const isActive = active === item.id;
            return (
              <button key={item.id} onClick={() => setActive(item.id)}
                style={{
                  display:"flex", alignItems:"center", gap:"10px",
                  padding:"10px 12px", borderRadius:"8px", border:"none",
                  background: isActive ? "var(--accent-primary)20" : "transparent",
                  color: isActive ? "var(--accent-primary)" : "var(--text-muted)",
                  fontSize:"13px", fontWeight: isActive ? "700" : "500",
                  fontFamily:"var(--font-display)", letterSpacing:"0.04em",
                  cursor:"pointer", textAlign:"left", width:"100%",
                  transition:"all 0.15s",
                  borderLeft: isActive ? "2px solid var(--accent-primary)" : "2px solid transparent",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background="var(--bg-hover)"; e.currentTarget.style.color="var(--text-secondary)"; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--text-muted)"; }}}
              >
                <span style={{ fontSize:"15px", width:"20px", textAlign:"center" }}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <div style={{ marginLeft:"auto", width:"5px", height:"5px", borderRadius:"50%", background:"var(--accent-primary)" }}/>}
              </button>
            );
          })}
        </nav>

        {/* System status */}
        <div style={{ padding:"10px 14px", borderTop:"1px solid var(--border-dim)",
          borderBottom:"1px solid var(--border-dim)", margin:"0 10px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"4px" }}>
            <span style={{ fontSize:"9px", color:"var(--text-muted)", fontFamily:"var(--font-display)",
              letterSpacing:"0.12em", textTransform:"uppercase" }}>System</span>
            <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
              <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"var(--accent-green)",
                animation:"pulse-glow 2s infinite" }}/>
              <span style={{ fontSize:"9px", color:"var(--accent-green)", fontFamily:"var(--font-mono)" }}>ONLINE</span>
            </div>
          </div>
          <div style={{ fontSize:"10px", color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>API: localhost:8000</div>
        </div>

        {/* User info */}
        <div style={{ padding:"14px 14px 18px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
            <div style={{
              width:"36px", height:"36px", borderRadius:"8px",
              background:"linear-gradient(135deg,#f97316,#ea580c)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"var(--font-display)", fontWeight:"700", fontSize:"16px",
              color:"#fff", flexShrink:0,
            }}>
              {(user.emp_name||"U").charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontFamily:"var(--font-display)", fontSize:"12px", fontWeight:"700",
                color:"var(--text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {user.emp_name}
              </div>
              <div style={{ fontSize:"9px", color:"var(--text-muted)", fontFamily:"var(--font-mono)",
                letterSpacing:"0.04em", marginTop:"1px" }}>
                {user.emp_no}
              </div>
            </div>
          </div>

          {/* Role badge */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:"5px",
            padding:"3px 10px", borderRadius:"20px", fontSize:"10px",
            fontWeight:"700", fontFamily:"var(--font-display)", letterSpacing:"0.08em",
            background: rc.bg, border:`1px solid ${rc.border}`, color: rc.text,
            marginBottom:"10px",
          }}>
            <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:"currentColor" }}/>
            {user.role}
          </div>

          <button onClick={handleLogout}
            style={{
              width:"100%", background:"transparent",
              border:"1px solid var(--border-bright)", color:"var(--text-muted)",
              borderRadius:"7px", padding:"8px", fontSize:"11px",
              fontFamily:"var(--font-display)", letterSpacing:"0.08em", cursor:"pointer",
              transition:"all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent-red)"; e.currentTarget.style.color="var(--accent-red)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border-bright)"; e.currentTarget.style.color="var(--text-muted)"; }}
          >
            ⬅ LOGOUT
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <main style={{ flex:1, overflowY:"auto", background:"var(--bg-base)" }}>

        {/* Topbar */}
        <div style={{
          padding:"13px 28px",
          borderBottom:"1px solid var(--border-dim)",
          background:"var(--bg-surface)",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          position:"sticky", top:0, zIndex:10,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ color:"var(--text-muted)", fontSize:"12px", fontFamily:"var(--font-display)",
              letterSpacing:"0.08em", textTransform:"uppercase" }}>
              {activeNavItem?.label || ""}
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
            {/* Department label */}
            {user.dept && (
              <span style={{ fontSize:"11px", color:"var(--text-muted)", fontFamily:"var(--font-display)",
                letterSpacing:"0.04em", padding:"3px 10px", background:"var(--bg-elevated)",
                borderRadius:"20px", border:"1px solid var(--border-dim)" }}>
                {user.dept}
              </span>
            )}
            <span style={{ fontSize:"11px", color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>
              {new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
            </span>
            {/* Role badge in topbar */}
            <div style={{
              padding:"4px 12px", borderRadius:"20px",
              background: rc.bg, border:`1px solid ${rc.border}`,
              fontSize:"10px", fontWeight:"700",
              fontFamily:"var(--font-display)", letterSpacing:"0.08em",
              color: rc.text,
            }}>
              {user.role.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Page content — show AccessDenied if page is not permitted */}
        <div style={{ minHeight:"calc(100vh - 57px)" }}>
          {!isPagePermitted ? (
            <AccessDenied page={activeNavItem?.label || active} role={user.role} />
          ) : (
            <>
              {active === "dashboard" && <Dashboard />}
              {/* Pass role so Reports can hide Export button for dept_user/ppm_user */}
              {active === "reports"   && <Reports userRole={user.role} />}
              {active === "delay"     && <DelayEntry />}
              {active === "users"     && <UserManagement />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
