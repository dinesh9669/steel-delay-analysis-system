// frontend/src/pages/Reports.jsx  (UPDATED — Export button hidden for dept_user and ppm_user)
// receives userRole prop from App.jsx
// CAN_EXPORT = ["sys_admin","dept_admin","ppm_admin"]
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
} from "recharts";
import { getShops, getTabular, getChart, getSummary, exportExcel } from "../utils/api";
import { Card, StatCard, SectionTitle, PageHeader, DataTable } from "../components/UI";

const COLORS = ["#f97316","#38bdf8","#22c55e","#a855f7","#eab308","#ef4444","#06b6d4","#84cc16"];
const CAN_EXPORT = ["sys_admin","dept_admin","ppm_admin"];

const Tip = ({active,payload,label}) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:"var(--bg-elevated)",border:"1px solid var(--border-bright)",borderRadius:"8px",padding:"10px 14px"}}>
      <p style={{color:"var(--text-muted)",fontSize:"11px",marginBottom:"4px"}}>{label}</p>
      {payload.map(p=><p key={p.name} style={{color:p.color,fontSize:"13px",fontFamily:"var(--font-mono)"}}>{p.name}: {p.value}</p>)}
    </div>
  );
};

const COLUMNS = [
  {key:"shop_desc",label:"Shop"},
  {key:"eqpt_name",label:"Equipment"},
  {key:"agency",label:"Agency"},
  {key:"delay_from",label:"From"},
  {key:"delay_upto",label:"Upto"},
  {key:"delay_duration",label:"Hrs",render:v=><span style={{fontFamily:"var(--font-mono)",color:"var(--accent-primary)",fontSize:"12px"}}>{v}h</span>},
  {key:"delay_desc",label:"Description"},
  {key:"user_entered",label:"By"},
];

export default function Reports({ userRole = "" }) {
  const [view,    setView]    = useState("tabular");
  const [shops,   setShops]   = useState([]);
  const [filters, setFilters] = useState({shop_code:"",from_date:"",to_date:""});
  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [summary, setSummary] = useState(null);
  const [chart,   setChart]   = useState({agency:[],shop:[],equipment:[]});
  const [groupBy, setGroupBy] = useState("agency");
  const [loading, setLoading] = useState(false);
  const [exporting,setExp]    = useState(false);

  const canExport = CAN_EXPORT.includes(userRole);

  useEffect(() => { getShops().then(setShops).catch(()=>{}); }, []);
  useEffect(() => { loadData(); }, [filters, page, view]);

  async function loadData() {
    setLoading(true);
    try {
      const p = {page, page_size:100};
      if (filters.shop_code) p.shop_code = filters.shop_code;
      if (filters.from_date) p.from_date = filters.from_date;
      if (filters.to_date)   p.to_date   = filters.to_date;
      const [tab,sum] = await Promise.all([getTabular(p), getSummary(p)]);
      setRows(tab.data||[]); setTotal(tab.total||0); setSummary(sum);
      if (view==="graphical") {
        const [a,s,e] = await Promise.all([
          getChart({...p,group_by:"agency"}),
          getChart({...p,group_by:"shop"}),
          getChart({...p,group_by:"equipment"}),
        ]);
        setChart({agency:a,shop:s,equipment:e});
      }
    } catch(err){console.error(err);} finally{setLoading(false);}
  }

  async function handleExport() {
    if (!canExport) return;
    setExp(true);
    try {
      const p = {};
      if (filters.shop_code) p.shop_code = filters.shop_code;
      if (filters.from_date) p.from_date = filters.from_date;
      if (filters.to_date)   p.to_date   = filters.to_date;
      await exportExcel(p);
    } catch(err){alert(err.message);} finally{setExp(false);}
  }

  const totalPages = Math.ceil(total/100);

  return (
    <div style={{padding:"28px",maxWidth:"1400px",margin:"0 auto",animation:"fadeIn 0.4s ease"}}>
      <PageHeader title="Delay Reports" subtitle="Analyse equipment delays across all departments">

        {/* View toggle */}
        <div style={{display:"flex",gap:"4px",background:"var(--bg-elevated)",borderRadius:"10px",padding:"4px",border:"1px solid var(--border-dim)"}}>
          {["tabular","graphical"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{
              background:view===v?"var(--accent-primary)":"transparent",
              color:view===v?"#fff":"var(--text-muted)",
              border:"none",borderRadius:"7px",padding:"6px 16px",
              fontSize:"12px",fontWeight:"700",fontFamily:"var(--font-display)",
              letterSpacing:"0.06em",cursor:"pointer",textTransform:"uppercase",transition:"all 0.2s",
            }}>
              {v==="tabular"?"Tabular":"Graphical"}
            </button>
          ))}
        </div>

        {/* Export button — hidden for dept_user and ppm_user */}
        {canExport ? (
          <button onClick={handleExport} disabled={exporting} style={{
            background:"#22c55e20",border:"1px solid #22c55e40",
            color:"var(--accent-green)",borderRadius:"8px",
            padding:"8px 16px",fontSize:"12px",fontWeight:"700",
            fontFamily:"var(--font-display)",letterSpacing:"0.06em",
            cursor:"pointer",display:"flex",alignItems:"center",gap:"6px",
          }}>
            {exporting ? "Exporting…" : "⬇ Export Excel"}
          </button>
        ) : (
          /* Show a muted "no export" indicator for roles that can't export */
          <div style={{
            padding:"8px 14px",borderRadius:"8px",fontSize:"11px",
            color:"var(--text-muted)",border:"1px solid var(--border-dim)",
            fontFamily:"var(--font-display)",letterSpacing:"0.04em",
          }}>
            Export: not available for {userRole}
          </div>
        )}
      </PageHeader>

      {/* Filter bar */}
      <div style={{display:"flex",gap:"14px",alignItems:"flex-end",background:"var(--bg-card)",
        borderRadius:"12px",padding:"16px 20px",marginBottom:"20px",border:"1px solid var(--border-dim)"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:"5px"}}>
          <label style={{fontSize:"10px",color:"var(--text-muted)",fontFamily:"var(--font-display)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Shop</label>
          <select value={filters.shop_code} onChange={e=>setFilters(f=>({...f,shop_code:e.target.value}))}
            style={{background:"var(--bg-elevated)",border:"1px solid var(--border-bright)",borderRadius:"8px",padding:"9px 12px",color:"var(--text-primary)",fontSize:"13px"}}>
            <option value="">All Shops</option>
            {shops.map(s=><option key={s.shop_code} value={s.shop_code}>{s.shop_desc}</option>)}
          </select>
        </div>
        {[["from_date","From Date"],["to_date","To Date"]].map(([k,l])=>(
          <div key={k} style={{flex:1,display:"flex",flexDirection:"column",gap:"5px"}}>
            <label style={{fontSize:"10px",color:"var(--text-muted)",fontFamily:"var(--font-display)",textTransform:"uppercase",letterSpacing:"0.1em"}}>{l}</label>
            <input type="date" value={filters[k]} onChange={e=>setFilters(f=>({...f,[k]:e.target.value}))}
              style={{background:"var(--bg-elevated)",border:"1px solid var(--border-bright)",borderRadius:"8px",padding:"9px 12px",color:"var(--text-primary)",fontSize:"13px"}}/>
          </div>
        ))}
        <button onClick={()=>{setPage(1);loadData();}} style={{
          background:"linear-gradient(135deg,#f97316,#ea580c)",color:"#fff",border:"none",
          borderRadius:"8px",padding:"9px 22px",fontSize:"13px",fontWeight:"700",
          fontFamily:"var(--font-display)",letterSpacing:"0.06em",cursor:"pointer",
          alignSelf:"flex-end",boxShadow:"var(--glow-orange)",
        }}>Search</button>
      </div>

      {/* KPI cards */}
      {summary && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px",marginBottom:"20px"}}>
          <StatCard label="Total Delays" value={summary.total_delays?.toLocaleString()||"0"} icon="⚠️" color="var(--accent-primary)"/>
          <StatCard label="Total Hours"  value={`${summary.total_hours||0}h`} icon="⏱" color="var(--accent-blue)"/>
          <StatCard label="Avg Duration" value={`${summary.avg_duration||0}h`} icon="📏" color="var(--accent-yellow)"/>
          <StatCard label="Worst Equip." value={summary.worst_equipment||"—"} sub={`${summary.worst_eqpt_hrs||0}h total`} icon="🔧" color="var(--accent-red)"/>
        </div>
      )}

      {loading && <div style={{textAlign:"center",padding:"40px",color:"var(--text-muted)"}}>Loading…</div>}

      {/* Tabular */}
      {view==="tabular" && !loading && (
        <>
          <Card style={{padding:0,overflow:"hidden"}}>
            <DataTable columns={COLUMNS} rows={rows} emptyMsg="No records found."/>
          </Card>
          {totalPages > 1 && (
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"14px"}}>
              <span style={{fontSize:"12px",color:"var(--text-muted)",fontFamily:"var(--font-mono)"}}>
                Page {page}/{totalPages} · {total.toLocaleString()} records
              </span>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  style={{background:"var(--bg-card)",border:"1px solid var(--border-bright)",color:"var(--text-secondary)",borderRadius:"7px",padding:"7px 16px",cursor:"pointer",fontSize:"13px",fontFamily:"var(--font-display)"}}>← Prev</button>
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                  style={{background:"var(--bg-card)",border:"1px solid var(--border-bright)",color:"var(--text-secondary)",borderRadius:"7px",padding:"7px 16px",cursor:"pointer",fontSize:"13px",fontFamily:"var(--font-display)"}}>Next →</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Graphical */}
      {view==="graphical" && !loading && (
        <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
          <div style={{display:"flex",gap:"8px"}}>
            {["agency","shop","equipment"].map(g=>(
              <button key={g} onClick={()=>setGroupBy(g)} style={{
                background:groupBy===g?"var(--accent-primary)20":"transparent",
                border:`1px solid ${groupBy===g?"var(--accent-primary)":"var(--border-bright)"}`,
                color:groupBy===g?"var(--accent-primary)":"var(--text-secondary)",
                borderRadius:"8px",padding:"6px 16px",fontSize:"12px",fontWeight:"700",
                fontFamily:"var(--font-display)",letterSpacing:"0.06em",cursor:"pointer",
                textTransform:"uppercase",transition:"all 0.2s",
              }}>{g}</button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px"}}>
            <Card>
              <SectionTitle accent>Delay Count by {groupBy}</SectionTitle>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chart[groupBy]} margin={{top:5,right:10,left:-20,bottom:60}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d"/>
                  <XAxis dataKey="label" tick={{fontSize:11,fill:"#4a5568"}} angle={-35} textAnchor="end" interval={0}/>
                  <YAxis tick={{fontSize:11,fill:"#4a5568"}}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="count" name="Delays" radius={[4,4,0,0]}>
                    {chart[groupBy].map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <SectionTitle accent>Total Hours by {groupBy}</SectionTitle>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chart[groupBy]} margin={{top:5,right:10,left:-20,bottom:60}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d"/>
                  <XAxis dataKey="label" tick={{fontSize:11,fill:"#4a5568"}} angle={-35} textAnchor="end" interval={0}/>
                  <YAxis tick={{fontSize:11,fill:"#4a5568"}}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="total_hrs" name="Hours" radius={[4,4,0,0]}>
                    {chart[groupBy].map((_,i)=><Cell key={i} fill={COLORS[(i+3)%COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
          <Card>
            <SectionTitle accent>Agency Share</SectionTitle>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={chart.agency} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={120}
                  label={({label,percent})=>`${label} ${(percent*100).toFixed(0)}%`} labelLine>
                  {chart.agency.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip content={<Tip/>}/>
                <Legend wrapperStyle={{color:"var(--text-secondary)",fontSize:"12px"}}/>
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}
