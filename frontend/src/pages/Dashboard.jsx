// frontend/src/pages/Dashboard.jsx — Live Dashboard
import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getLiveKPIs, getTrend, getShiftAnalysis, getAlerts, getTopEquipment } from "../utils/api";
import { StatCard, Card, SectionTitle, RiskBadge, PageHeader } from "../components/UI";

const SHIFT_COLORS = ["#38bdf8","#f97316","#a855f7"];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border-bright)", borderRadius:"8px", padding:"10px 14px" }}>
      <p style={{ color:"var(--text-muted)", fontSize:"11px", marginBottom:"4px" }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color:p.color, fontSize:"13px", fontFamily:"var(--font-mono)" }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function Dashboard() {
  const [kpis,  setKpis]  = useState(null);
  const [trend, setTrend] = useState([]);
  const [shifts,setShifts]= useState([]);
  const [alerts,setAlerts]= useState([]);
  const [topEq, setTopEq] = useState([]);

  const load = useCallback(async () => {
    try {
      const [k,t,s,a,e] = await Promise.all([
        getLiveKPIs(), getTrend({days:30}), getShiftAnalysis(),
        getAlerts({threshold_hrs:50}), getTopEquipment({limit:8})
      ]);
      setKpis(k); setTrend(t); setShifts(s); setAlerts(a); setTopEq(e);
    } catch(err) { console.error(err); }
  }, []);

  useEffect(() => { load(); const id = setInterval(load, 60000); return () => clearInterval(id); }, [load]);

  return (
    <div style={{ padding:"28px", maxWidth:"1400px", margin:"0 auto", animation:"fadeIn 0.4s ease" }}>
      <PageHeader title="Live Dashboard" subtitle={`Updated: ${kpis?.last_updated||"—"} · Auto-refreshes every 60s`}>
        <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
          <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"var(--accent-green)", animation:"pulse-glow 2s infinite" }} />
          <span style={{ fontSize:"11px", color:"var(--accent-green)", fontFamily:"var(--font-display)", letterSpacing:"0.08em" }}>LIVE</span>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px", marginBottom:"24px" }}>
        <StatCard label="Total Records"  value={kpis?.total_all?.toLocaleString()||"—"} icon="📊" color="var(--accent-blue)" />
        <StatCard label="Today's Delays" value={kpis?.total_today||"0"} sub={`${kpis?.hrs_today||0} hrs`} icon="⚠️" color="var(--accent-primary)" />
        <StatCard label="This Week"      value={kpis?.total_week||"0"}  sub={`${kpis?.hrs_week||0} hrs`}  icon="📅" color="var(--accent-yellow)" />
        <StatCard label="Month Hrs"      value={`${kpis?.hrs_month||0}`} sub="delay hours" icon="⏱" color="var(--accent-green)" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"20px", marginBottom:"20px" }}>
        {/* Trend chart */}
        <Card>
          <SectionTitle accent>30-Day Delay Trend</SectionTitle>
          {trend.length === 0
            ? <div style={{ height:"220px", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-muted)", fontSize:"13px" }}>Import CSV data to see trends</div>
            : <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{top:5,right:10,left:-20,bottom:0}}>
                  <defs>
                    <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d"/>
                  <XAxis dataKey="date" tick={{fontSize:10,fill:"#4a5568"}}/>
                  <YAxis tick={{fontSize:10,fill:"#4a5568"}}/>
                  <Tooltip content={<Tip/>}/>
                  <Area type="monotone" dataKey="count" name="Delays" stroke="#f97316" fill="url(#gr)" strokeWidth={2} dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
          }
        </Card>

        {/* Shift Analysis */}
        <Card>
          <SectionTitle accent>Shift-wise Delays</SectionTitle>
          {shifts.length === 0
            ? <div style={{color:"var(--text-muted)",textAlign:"center",padding:"40px 0"}}>No shift data</div>
            : <>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={shifts} margin={{top:5,right:0,left:-25,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d"/>
                    <YAxis tick={{fontSize:10,fill:"#4a5568"}}/>
                    <Tooltip content={<Tip/>}/>
                    <Bar dataKey="count" name="Delays" radius={[4,4,0,0]}>
                      {shifts.map((_,i) => <Cell key={i} fill={SHIFT_COLORS[i]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{display:"flex",flexDirection:"column",gap:"6px",marginTop:"12px"}}>
                  {shifts.map((s,i) => (
                    <div key={s.shift} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:"var(--bg-elevated)",borderRadius:"6px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                        <div style={{width:"8px",height:"8px",borderRadius:"2px",background:SHIFT_COLORS[i]}}/>
                        <span style={{fontSize:"11px",color:"var(--text-secondary)"}}>{s.shift.split(" ")[0]}</span>
                      </div>
                      <div style={{display:"flex",gap:"12px"}}>
                        <span style={{fontFamily:"var(--font-mono)",fontSize:"12px",color:SHIFT_COLORS[i]}}>{s.count}</span>
                        <span style={{fontSize:"11px",color:"var(--text-muted)"}}>{s.total_hrs}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
          }
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px"}}>
        {/* Alerts */}
        <Card>
          <SectionTitle accent>⚡ Maintenance Alerts</SectionTitle>
          {alerts.length === 0
            ? <div style={{color:"var(--accent-green)",textAlign:"center",padding:"24px 0",fontSize:"13px"}}>✓ No equipment exceeding threshold in last 30 days</div>
            : <div style={{display:"flex",flexDirection:"column",gap:"8px",maxHeight:"280px",overflowY:"auto"}}>
                {alerts.map((a,i) => (
                  <div key={i} style={{padding:"12px 14px",background:"var(--bg-elevated)",borderRadius:"8px",borderLeft:`3px solid ${a.alert_level==="CRITICAL"?"var(--accent-red)":a.alert_level==="HIGH"?"var(--accent-primary)":"var(--accent-yellow)"}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
                      <span style={{fontFamily:"var(--font-display)",fontWeight:"700",color:"var(--text-primary)",fontSize:"14px"}}>{a.eqpt_name}</span>
                      <RiskBadge level={a.alert_level}/>
                    </div>
                    <div style={{fontSize:"11px",color:"var(--text-muted)"}}>{a.shop_desc} · {a.total_hrs}h in 30 days · {a.frequency} incidents</div>
                  </div>
                ))}
              </div>
          }
        </Card>

        {/* Top Equipment */}
        <Card>
          <SectionTitle accent>Top Delay Equipment</SectionTitle>
          <div style={{display:"flex",flexDirection:"column",gap:"6px",maxHeight:"280px",overflowY:"auto"}}>
            {topEq.length === 0
              ? <div style={{color:"var(--text-muted)",textAlign:"center",padding:"24px 0",fontSize:"13px"}}>Import CSV to populate</div>
              : topEq.map((e,i) => {
                  const pct = (e.total_hrs / (topEq[0]?.total_hrs||1)) * 100;
                  return (
                    <div key={i} style={{padding:"10px 12px",background:"var(--bg-elevated)",borderRadius:"8px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                          <span style={{fontFamily:"var(--font-mono)",fontSize:"11px",color:"var(--text-muted)",width:"20px"}}>#{e.rank}</span>
                          <span style={{fontFamily:"var(--font-display)",fontWeight:"600",color:"var(--text-primary)",fontSize:"13px"}}>{e.eqpt_name}</span>
                        </div>
                        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                          <span style={{fontFamily:"var(--font-mono)",color:"var(--accent-primary)",fontSize:"12px"}}>{e.total_hrs}h</span>
                          <RiskBadge level={e.risk}/>
                        </div>
                      </div>
                      <div style={{height:"3px",background:"var(--border-dim)",borderRadius:"2px"}}>
                        <div style={{height:"100%",width:`${pct}%`,borderRadius:"2px",background:e.risk==="CRITICAL"?"var(--accent-red)":e.risk==="HIGH"?"var(--accent-primary)":"var(--accent-blue)",transition:"width 0.8s ease"}}/>
                      </div>
                      <div style={{fontSize:"10px",color:"var(--text-muted)",marginTop:"4px"}}>{e.shop_desc} · {e.frequency} incidents · avg {e.avg_hrs}h</div>
                    </div>
                  );
                })
            }
          </div>
        </Card>
      </div>
    </div>
  );
}
