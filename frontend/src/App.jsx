// frontend/src/App.jsx
// Root application shell
// Handles login state, sidebar navigation, and role-based page visibility

import { useState } from "react";
import Login          from "./pages/Login";
import DelayEntry     from "./pages/DelayEntry";
import UserManagement from "./pages/UserManagement";
import Reports        from "./pages/Reports";
import { getUser, clearAuth } from "./utils/api";

// Navigation items with role-based access control
const NAV = [
  {
    id:    "delay",
    label: "Delay Entry",
    icon:  "➕",
    roles: ["sys_admin", "dept_admin", "dept_user"],
  },
  {
    id:    "reports",
    label: "Delay Reports",
    icon:  "📊",
    roles: ["sys_admin", "dept_admin", "dept_user", "ppm_admin", "ppm_user"],
  },
  {
    id:    "users",
    label: "User Management",
    icon:  "👥",
    roles: ["sys_admin"],
  },
];

export default function App() {
  const saved = getUser();
  const [user,   setUser]  = useState(saved.token ? saved : null);
  const [active, setActive]= useState("delay");

  function handleLogin(data) {
    setUser(data);
    setActive("delay");
  }

  function handleLogout() {
    clearAuth();
    setUser(null);
  }

  // Show login page if not authenticated
  if (!user) return <Login onLogin={handleLogin} />;

  // Filter nav items based on logged-in user's role
  const visibleNav = NAV.filter(n => n.roles.includes(user.role));

  return (
    <div style={S.shell}>

      {/* ── Sidebar ── */}
      <aside style={S.sidebar}>

        {/* Brand */}
        <div style={S.brand}>
          <span style={S.brandIcon}>⚙️</span>
          <div>
            <div style={S.brandName}>Vizag Steel</div>
            <div style={S.brandSub}>Delay Analysis System</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={S.nav}>
          {visibleNav.map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              style={{
                ...S.navItem,
                ...(active === item.id ? S.navActive : {}),
              }}
            >
              <span style={S.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* User info + Logout */}
        <div style={S.sideFooter}>
          <div style={S.userRow}>
            <div style={S.avatar}>
              {(user.emp_name || "U").charAt(0).toUpperCase()}
            </div>
            <div style={S.userInfo}>
              <div style={S.userName}>{user.emp_name}</div>
              <div style={S.userRole}>{user.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={S.logoutBtn}>
            ⬅ Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={S.main}>
        {active === "delay"   && <DelayEntry />}
        {active === "reports" && <Reports />}
        {active === "users"   && <UserManagement />}
      </main>

    </div>
  );
}

const S = {
  shell:     { display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Tahoma, Geneva, sans-serif", background: "#f1f5f9" },

  // Sidebar
  sidebar:   { width: "230px", minWidth: "230px", background: "#0f3460", display: "flex", flexDirection: "column", minHeight: "100vh", position: "sticky", top: 0, height: "100vh" },
  brand:     { display: "flex", alignItems: "center", gap: "12px", padding: "22px 18px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" },
  brandIcon: { fontSize: "30px" },
  brandName: { color: "#ffffff", fontWeight: "700", fontSize: "14px", lineHeight: 1.3 },
  brandSub:  { color: "rgba(255,255,255,0.45)", fontSize: "10px", lineHeight: 1.3 },
  nav:       { padding: "14px 10px", display: "flex", flexDirection: "column", gap: "3px" },
  navItem:   { display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "9px", border: "none", background: "transparent", color: "rgba(255,255,255,0.65)", fontSize: "13px", fontWeight: "500", cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.15s ease" },
  navActive: { background: "rgba(255,255,255,0.16)", color: "#ffffff", fontWeight: "600" },
  navIcon:   { fontSize: "16px", width: "20px", textAlign: "center" },

  // Sidebar footer
  sideFooter:{ padding: "14px 14px 18px" },
  userRow:   { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
  avatar:    { width: "36px", height: "36px", borderRadius: "50%", background: "#e94560", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "15px", flexShrink: 0 },
  userInfo:  { overflow: "hidden" },
  userName:  { color: "#ffffff", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  userRole:  { color: "rgba(255,255,255,0.45)", fontSize: "10px" },
  logoutBtn: { width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)", borderRadius: "8px", padding: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "500" },

  // Main
  main:      { flex: 1, overflow: "auto", background: "#f1f5f9" },
};
