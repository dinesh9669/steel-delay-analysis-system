// frontend/src/pages/UserManagement.jsx — Dark Industrial Redesign
import { useState, useEffect } from "react";
import { listUsers, createUser, updateRole, updateStatus } from "../utils/api";
import { Card, PageHeader, SectionTitle, Flash, PrimaryBtn, GhostBtn, RiskBadge, Badge, DataTable } from "../components/UI";

const ROLES = ["sys_admin","dept_admin","dept_user","ppm_admin","ppm_user"];

const ROLE_COLOR = {
  sys_admin:  "red",
  dept_admin: "blue",
  dept_user:  "green",
  ppm_admin:  "orange",
  ppm_user:   "yellow",
};

const EMPTY = { emp_no:"", password:"", emp_name:"", dept:"", designation:"", role:"dept_user" };

export default function UserManagement() {
  const [users,   setUsers]   = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [msg,     setMsg]     = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState("");

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try { setUsers(await listUsers()); }
    catch(e) { setMsg({type:"error", text:e.message}); }
  }

  function onChange(e) { setForm(f => ({...f, [e.target.name]: e.target.value})); }

  async function handleAdd(e) {
    e.preventDefault(); setSaving(true); setMsg(null);
    try {
      await createUser({...form, emp_no: form.emp_no.trim().toUpperCase()});
      setMsg({type:"success", text:`User ${form.emp_no.toUpperCase()} created successfully.`});
      setForm(EMPTY); setShowAdd(false); fetchUsers();
    } catch(err) { setMsg({type:"error", text:err.message}); }
    finally { setSaving(false); }
  }

  async function handleRoleChange(user, newRole) {
    try { await updateRole(user.id, newRole); fetchUsers(); }
    catch(e) { setMsg({type:"error", text:e.message}); }
  }

  async function handleToggle(user) {
    try { await updateStatus(user.id, !user.active); fetchUsers(); }
    catch(e) { setMsg({type:"error", text:e.message}); }
  }

  const filtered = users.filter(u =>
    u.emp_no.toLowerCase().includes(search.toLowerCase()) ||
    u.emp_name.toLowerCase().includes(search.toLowerCase()) ||
    (u.dept||"").toLowerCase().includes(search.toLowerCase())
  );

  const roleStats = ROLES.map(r => ({
    role: r,
    count: users.filter(u => u.role === r).length,
  }));

  return (
    <div style={{padding:"28px", maxWidth:"1200px", margin:"0 auto", animation:"fadeIn 0.4s ease"}}>
      <PageHeader title="User Management" subtitle="Manage system users, roles and access status">
        <button
          onClick={() => { setShowAdd(!showAdd); setMsg(null); }}
          style={{
            background: showAdd ? "transparent" : "linear-gradient(135deg,#f97316,#ea580c)",
            color: showAdd ? "var(--text-secondary)" : "#fff",
            border: showAdd ? "1px solid var(--border-bright)" : "none",
            borderRadius:"8px", padding:"9px 20px",
            fontSize:"13px", fontWeight:"700",
            fontFamily:"var(--font-display)", letterSpacing:"0.06em",
            cursor:"pointer", boxShadow: showAdd ? "none" : "var(--glow-orange)",
            transition:"all 0.2s",
          }}
        >
          {showAdd ? "✕ Cancel" : "+ Add User"}
        </button>
      </PageHeader>

      <Flash msg={msg} />

      {/* Role summary cards */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"12px", marginBottom:"20px"}}>
        {roleStats.map(r => (
          <div key={r.role} style={{
            background:"var(--bg-card)", border:"1px solid var(--border-dim)",
            borderRadius:"10px", padding:"14px 16px",
            display:"flex", flexDirection:"column", gap:"6px",
          }}>
            <Badge label={r.role} color={ROLE_COLOR[r.role]||"gray"} />
            <div style={{fontFamily:"var(--font-display)", fontSize:"24px", fontWeight:"700", color:"var(--text-primary)"}}>
              {r.count}
            </div>
            <div style={{fontSize:"10px", color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em"}}>users</div>
          </div>
        ))}
      </div>

      {/* Add User Form */}
      {showAdd && (
        <Card style={{marginBottom:"20px", borderColor:"var(--accent-primary)40", animation:"slideIn 0.3s ease"}}>
          <SectionTitle accent>New User</SectionTitle>
          <form onSubmit={handleAdd}>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"14px", marginBottom:"14px"}}>
              {[
                {name:"emp_no",      label:"Employee No *",  type:"text",     ph:"e.g. EMP1001",      req:true},
                {name:"password",    label:"Password *",     type:"password", ph:"Set password",       req:true},
                {name:"emp_name",    label:"Full Name *",    type:"text",     ph:"Employee full name", req:true},
                {name:"dept",        label:"Department",     type:"text",     ph:"e.g. Blast Furnace", req:false},
                {name:"designation", label:"Designation",    type:"text",     ph:"e.g. Jr. Manager",  req:false},
              ].map(f => (
                <div key={f.name} style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  <label style={{fontSize:"10px",color:"var(--text-muted)",fontFamily:"var(--font-display)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:"600"}}>{f.label}</label>
                  <input name={f.name} type={f.type} value={form[f.name]} onChange={onChange}
                    placeholder={f.ph} required={f.req}
                    style={{background:"var(--bg-elevated)",border:"1px solid var(--border-bright)",borderRadius:"8px",padding:"10px 14px",color:"var(--text-primary)",fontSize:"14px",outline:"none"}}
                  />
                </div>
              ))}
              {/* Role select */}
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={{fontSize:"10px",color:"var(--text-muted)",fontFamily:"var(--font-display)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:"600"}}>Role *</label>
                <select name="role" value={form.role} onChange={onChange} required
                  style={{background:"var(--bg-elevated)",border:"1px solid var(--border-bright)",borderRadius:"8px",padding:"10px 14px",color:"var(--text-primary)",fontSize:"14px",cursor:"pointer"}}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:"10px"}}>
              <GhostBtn type="button" onClick={()=>{setForm(EMPTY);setShowAdd(false);}}>Cancel</GhostBtn>
              <PrimaryBtn loading={saving} type="submit">Save User</PrimaryBtn>
            </div>
          </form>
        </Card>
      )}

      {/* Search bar */}
      <div style={{marginBottom:"14px",display:"flex",alignItems:"center",gap:"12px"}}>
        <div style={{position:"relative",flex:1,maxWidth:"340px"}}>
          <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)",fontSize:"14px"}}>🔍</span>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by emp no, name, or department…"
            style={{width:"100%",background:"var(--bg-elevated)",border:"1px solid var(--border-bright)",borderRadius:"8px",padding:"9px 14px 9px 38px",color:"var(--text-primary)",fontSize:"13px",outline:"none"}}
          />
        </div>
        <span style={{fontSize:"12px",color:"var(--text-muted)",fontFamily:"var(--font-mono)"}}>
          {filtered.length} / {users.length} users
        </span>
      </div>

      {/* Users table */}
      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{overflowX:"auto", borderRadius:"12px"}}>
          <table style={{width:"100%", borderCollapse:"collapse", minWidth:"800px"}}>
            <thead>
              <tr style={{background:"var(--bg-elevated)"}}>
                {["Emp No","Name","Department","Designation","Role","Status","Actions"].map(h=>(
                  <th key={h} style={{padding:"12px 14px",textAlign:"left",fontSize:"10px",fontFamily:"var(--font-display)",fontWeight:"700",letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--text-muted)",borderBottom:"1px solid var(--border-bright)",whiteSpace:"nowrap"}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u,i) => (
                <tr key={u.id}
                  style={{borderBottom:"1px solid var(--border-dim)",transition:"background 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--bg-hover)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                >
                  <td style={{padding:"12px 14px"}}>
                    <span style={{fontFamily:"var(--font-mono)",color:"var(--accent-primary)",fontSize:"13px",fontWeight:"700"}}>{u.emp_no}</span>
                  </td>
                  <td style={{padding:"12px 14px",fontSize:"13px",color:"var(--text-primary)",fontWeight:"600"}}>{u.emp_name}</td>
                  <td style={{padding:"12px 14px",fontSize:"12px",color:"var(--text-secondary)"}}>{u.dept}</td>
                  <td style={{padding:"12px 14px",fontSize:"12px",color:"var(--text-secondary)"}}>{u.designation}</td>

                  {/* Inline role dropdown */}
                  <td style={{padding:"12px 14px"}}>
                    <select
                      value={u.role}
                      onChange={e=>handleRoleChange(u, e.target.value)}
                      style={{
                        background:"transparent", border:"1px solid var(--border-bright)",
                        borderRadius:"20px", padding:"4px 10px",
                        fontSize:"11px", fontWeight:"700",
                        fontFamily:"var(--font-display)", letterSpacing:"0.06em",
                        cursor:"pointer", color:"var(--text-primary)",
                        outline:"none",
                      }}
                    >
                      {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>

                  {/* Status badge */}
                  <td style={{padding:"12px 14px"}}>
                    <span style={{
                      display:"inline-flex", alignItems:"center", gap:"5px",
                      padding:"4px 10px", borderRadius:"20px", fontSize:"11px", fontWeight:"700",
                      fontFamily:"var(--font-display)", letterSpacing:"0.06em",
                      background: u.active ? "#22c55e20" : "#ef444420",
                      border: `1px solid ${u.active ? "#22c55e40" : "#ef444440"}`,
                      color: u.active ? "var(--accent-green)" : "var(--accent-red)",
                    }}>
                      <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"currentColor",display:"inline-block"}}/>
                      {u.active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Toggle button */}
                  <td style={{padding:"12px 14px"}}>
                    <button
                      onClick={()=>handleToggle(u)}
                      style={{
                        background: u.active ? "#ef444415" : "#22c55e15",
                        border: `1px solid ${u.active ? "#ef444430" : "#22c55e30"}`,
                        color: u.active ? "var(--accent-red)" : "var(--accent-green)",
                        borderRadius:"7px", padding:"5px 14px",
                        fontSize:"11px", fontWeight:"700",
                        fontFamily:"var(--font-display)", letterSpacing:"0.06em",
                        cursor:"pointer", transition:"all 0.2s",
                      }}
                    >
                      {u.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{padding:"40px",textAlign:"center",color:"var(--text-muted)",fontStyle:"italic",fontSize:"13px"}}>
                    {search ? "No users match your search." : "No users found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
