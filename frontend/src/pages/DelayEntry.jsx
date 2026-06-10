// frontend/src/pages/DelayEntry.jsx — Dark Industrial Redesign
import { useState, useEffect } from "react";
import { getShops, getEquipment, getSubEquipment, createDelay } from "../utils/api";
import { Card, Input, Select, Textarea, PrimaryBtn, GhostBtn, Flash, PageHeader, SectionTitle } from "../components/UI";

const AGENCIES = [
  {value:"O",label:"Operations"},{value:"M",label:"Mechanical"},
  {value:"E",label:"Electrical"},{value:"SD",label:"Shutdown"},
  {value:"C",label:"Crane"},{value:"ID",label:"Idle"},{value:"MIS",label:"Miscellaneous"},
];

const EMPTY = { shop_code:"",eqpt_name:"",sub_eqpt_name:"",agency:"",delay_from:"",delay_upto:"",delay_desc:"" };

function calcDuration(from, upto) {
  if (!from || !upto) return null;
  const diff = (new Date(upto) - new Date(from)) / 3600000;
  if (diff <= 0) return null;
  const h = Math.floor(diff), m = Math.round((diff-h)*60);
  return { text: m > 0 ? `${h}h ${m}m` : `${h}h`, hrs: diff.toFixed(2) };
}

export default function DelayEntry() {
  const [form,     setForm]    = useState(EMPTY);
  const [shops,    setShops]   = useState([]);
  const [eqpts,    setEqpts]   = useState([]);
  const [subs,     setSubs]    = useState([]);
  const [msg,      setMsg]     = useState(null);
  const [loading,  setLoading] = useState(false);
  const [recent,   setRecent]  = useState([]);

  useEffect(() => { getShops().then(setShops).catch(()=>{}); }, []);
  useEffect(() => {
    if (!form.shop_code) { setEqpts([]); setSubs([]); return; }
    setForm(f => ({...f, eqpt_name:"", sub_eqpt_name:""}));
    getEquipment(form.shop_code).then(setEqpts).catch(()=>{});
  }, [form.shop_code]);
  useEffect(() => {
    if (!form.shop_code || !form.eqpt_name) { setSubs([]); return; }
    setForm(f => ({...f, sub_eqpt_name:""}));
    getSubEquipment(form.shop_code, form.eqpt_name).then(setSubs).catch(()=>{});
  }, [form.eqpt_name]);

  const dur = calcDuration(form.delay_from, form.delay_upto);

  function onChange(e) { setForm(f => ({...f, [e.target.name]: e.target.value})); }

  async function handleSubmit(e) {
    e.preventDefault(); setMsg(null);
    if (!form.shop_code) return setMsg({type:"error",text:"Please select a shop."});
    if (!form.agency)    return setMsg({type:"error",text:"Please select an agency."});
    if (!dur)            return setMsg({type:"error",text:"Delay Upto must be after Delay From."});
    setLoading(true);
    try {
      const result = await createDelay({
        shop_code: parseInt(form.shop_code), eqpt_name: form.eqpt_name||null,
        sub_eqpt_name: form.sub_eqpt_name||null, agency: form.agency,
        delay_from: form.delay_from, delay_upto: form.delay_upto, delay_desc: form.delay_desc||null,
      });
      setMsg({type:"success",text:`Record #${result.id} saved — ${dur.text} delay recorded.`});
      setRecent(r => [{...result, durText: dur.text}, ...r].slice(0,5));
      setForm(EMPTY); setEqpts([]); setSubs([]);
    } catch(err) { setMsg({type:"error",text:err.message}); }
    finally { setLoading(false); }
  }

  return (
    <div style={{padding:"28px", maxWidth:"1100px", margin:"0 auto", animation:"fadeIn 0.4s ease"}}>
      <PageHeader title="Delay Entry" subtitle="Record equipment delays across all production departments" />

      <div style={{display:"grid", gridTemplateColumns:"1fr 340px", gap:"20px"}}>
        {/* Main form */}
        <Card>
          <SectionTitle accent>New Delay Record</SectionTitle>
          <Flash msg={msg} />
          <form onSubmit={handleSubmit}>
            {/* Row 1 */}
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px", marginBottom:"16px"}}>
              <Select label="Shop Description *" name="shop_code" value={form.shop_code} onChange={onChange} required>
                <option value="">— Select Shop —</option>
                {shops.map(s => <option key={s.shop_code} value={s.shop_code}>{s.shop_desc}</option>)}
              </Select>
              <Select label="Equipment Name" name="eqpt_name" value={form.eqpt_name} onChange={onChange} disabled={!eqpts.length}>
                <option value="">— Select Equipment —</option>
                {eqpts.map(e => <option key={e} value={e}>{e}</option>)}
              </Select>
              <Select label="Sub Equipment" name="sub_eqpt_name" value={form.sub_eqpt_name} onChange={onChange} disabled={!subs.length}>
                <option value="">— Select Sub Equipment —</option>
                {subs.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>

            {/* Row 2 */}
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"16px", marginBottom:"16px"}}>
              <Select label="Agency *" name="agency" value={form.agency} onChange={onChange} required>
                <option value="">— Select —</option>
                {AGENCIES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </Select>
              <Input label="Delay From *" name="delay_from" type="datetime-local" value={form.delay_from} onChange={onChange} required />
              <Input label="Delay Upto *" name="delay_upto" type="datetime-local" value={form.delay_upto} onChange={onChange} required />
              {/* Duration — disabled, auto-calculated */}
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={{fontSize:"11px",color:"var(--text-muted)",fontFamily:"var(--font-display)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:"600"}}>
                  Duration
                </label>
                <div style={{background:"var(--bg-base)",border:"1px solid var(--border-dim)",borderRadius:"8px",padding:"10px 14px",fontFamily:"var(--font-mono)",fontSize:"14px",color: dur ? "var(--accent-green)" : "var(--text-muted)",display:"flex",alignItems:"center",gap:"8px"}}>
                  {dur ? <><span style={{color:"var(--accent-green)"}}>✓</span>{dur.text}</> : <span style={{fontSize:"12px"}}>auto-calculated</span>}
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{marginBottom:"20px"}}>
              <Textarea label="Delay Description" name="delay_desc" value={form.delay_desc} onChange={onChange} placeholder="Describe the cause of delay…" />
            </div>

            {/* Duration display card */}
            {dur && (
              <div style={{marginBottom:"16px",padding:"12px 16px",background:"#22c55e10",border:"1px solid #22c55e30",borderRadius:"8px",display:"flex",alignItems:"center",gap:"12px",animation:"fadeIn 0.3s ease"}}>
                <span style={{fontSize:"20px"}}>⏱</span>
                <div>
                  <div style={{fontFamily:"var(--font-display)",fontSize:"18px",fontWeight:"700",color:"var(--accent-green)"}}>{dur.text}</div>
                  <div style={{fontSize:"11px",color:"var(--text-muted)"}}>{dur.hrs} decimal hours</div>
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:"12px",justifyContent:"flex-end"}}>
              <GhostBtn type="button" onClick={() => {setForm(EMPTY);setMsg(null);setEqpts([]);setSubs([]);}}>Clear</GhostBtn>
              <PrimaryBtn loading={loading} type="submit">Submit Record</PrimaryBtn>
            </div>
          </form>
        </Card>

        {/* Recent entries sidebar */}
        <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
          <Card style={{padding:"20px"}}>
            <SectionTitle accent>Recent Entries</SectionTitle>
            {recent.length === 0
              ? <div style={{color:"var(--text-muted)",fontSize:"12px",textAlign:"center",padding:"20px 0"}}>
                  No entries yet this session.
                </div>
              : <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                  {recent.map((r,i) => (
                    <div key={i} style={{padding:"10px 12px",background:"var(--bg-elevated)",borderRadius:"8px",borderLeft:"2px solid var(--accent-primary)"}}>
                      <div style={{fontFamily:"var(--font-display)",fontSize:"13px",color:"var(--text-primary)",fontWeight:"600"}}>
                        #{r.id} · {r.eqpt_name||r.shop_desc}
                      </div>
                      <div style={{fontSize:"11px",color:"var(--accent-primary)",marginTop:"2px",fontFamily:"var(--font-mono)"}}>{r.durText}</div>
                    </div>
                  ))}
                </div>
            }
          </Card>

          {/* Agency quick-ref */}
          <Card style={{padding:"20px"}}>
            <SectionTitle>Agency Codes</SectionTitle>
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              {AGENCIES.map(a => (
                <div key={a.value} style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",borderRadius:"5px",background:"var(--bg-elevated)"}}>
                  <span style={{fontFamily:"var(--font-mono)",color:"var(--accent-primary)",fontSize:"12px",fontWeight:"700"}}>{a.value}</span>
                  <span style={{fontSize:"12px",color:"var(--text-secondary)"}}>{a.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
