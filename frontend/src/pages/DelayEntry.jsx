// frontend/src/pages/DelayEntry.jsx
// Page 2 — Delay Entry Form
// Cascading dropdowns: Shop → Equipment → Sub-Equipment
// Auto-calculates delay duration from datetime pickers
// Agencies: Operations | Mechanical | Electrical | Shutdown | (+ more)

import { useState, useEffect } from "react";
import { getShops, getEquipment, getSubEquipment, createDelay } from "../utils/api";

// ── Agency dropdown options ───────────────────────────────
const AGENCIES = [
  { value: "O",   label: "Operations"     },
  { value: "M",   label: "Mechanical"     },
  { value: "E",   label: "Electrical"     },
  { value: "SD",  label: "Shutdown"       },
  { value: "C",   label: "Crane"          },
  { value: "ID",  label: "Idle"           },
  { value: "MIS", label: "Miscellaneous"  },
];

const EMPTY_FORM = {
  shop_code: "", eqpt_name: "", sub_eqpt_name: "",
  agency: "", delay_from: "", delay_upto: "", delay_desc: "",
};

// ── Helper: compute duration string from two datetimes ────
function calcDuration(from, upto) {
  if (!from || !upto) return "";
  const diff = (new Date(upto) - new Date(from)) / 3600000;   // ms → hours
  if (diff <= 0) return "Invalid";
  const h = Math.floor(diff);
  const m = Math.round((diff - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function DelayEntry() {
  const [form,       setForm]    = useState(EMPTY_FORM);
  const [shops,      setShops]   = useState([]);
  const [eqpts,      setEqpts]   = useState([]);
  const [subEqpts,   setSubEqpts]= useState([]);
  const [msg,        setMsg]     = useState(null);    // {type, text}
  const [submitting, setSub]     = useState(false);

  // Load shops on mount
  useEffect(() => {
    getShops().then(setShops).catch(() => {});
  }, []);

  // Cascade: shop → equipment
  useEffect(() => {
    if (!form.shop_code) { setEqpts([]); setSubEqpts([]); return; }
    setForm(f => ({ ...f, eqpt_name: "", sub_eqpt_name: "" }));
    setEqpts([]);  setSubEqpts([]);
    getEquipment(form.shop_code).then(setEqpts).catch(() => {});
  }, [form.shop_code]);

  // Cascade: equipment → sub-equipment
  useEffect(() => {
    if (!form.shop_code || !form.eqpt_name) { setSubEqpts([]); return; }
    setForm(f => ({ ...f, sub_eqpt_name: "" }));
    setSubEqpts([]);
    getSubEquipment(form.shop_code, form.eqpt_name).then(setSubEqpts).catch(() => {});
  }, [form.eqpt_name]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    // Validation
    if (!form.shop_code) return setMsg({ type: "error", text: "Please select a shop." });
    if (!form.agency)    return setMsg({ type: "error", text: "Please select an agency." });
    if (!form.delay_from || !form.delay_upto)
      return setMsg({ type: "error", text: "Delay From and Delay Upto are required." });
    if (new Date(form.delay_upto) <= new Date(form.delay_from))
      return setMsg({ type: "error", text: "Delay Upto must be after Delay From." });

    setSub(true);
    try {
      await createDelay({
        shop_code:     parseInt(form.shop_code),
        eqpt_name:     form.eqpt_name     || null,
        sub_eqpt_name: form.sub_eqpt_name || null,
        agency:        form.agency,
        delay_from:    form.delay_from,
        delay_upto:    form.delay_upto,
        delay_desc:    form.delay_desc     || null,
      });
      setMsg({ type: "success", text: "✅ Delay record saved successfully!" });
      handleClear();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSub(false);
    }
  }

  function handleClear() {
    setForm(EMPTY_FORM);
    setEqpts([]);
    setSubEqpts([]);
    setMsg(null);
  }

  const duration = calcDuration(form.delay_from, form.delay_upto);

  return (
    <div style={S.page}>

      {/* Page header */}
      <div style={S.pageHeader}>
        <h2 style={S.title}>Delay Entry</h2>
        <p style={S.subtitle}>Record equipment delays for critical machinery across departments</p>
      </div>

      {/* Flash message */}
      {msg && (
        <div style={{
          ...S.flash,
          background:   msg.type === "success" ? "#f0fdf4" : "#fef2f2",
          borderColor:  msg.type === "success" ? "#86efac" : "#fca5a5",
          color:        msg.type === "success" ? "#166534" : "#dc2626",
        }}>
          {msg.text}
        </div>
      )}

      <div style={S.card}>
        <form onSubmit={handleSubmit}>

          {/* Row 1: Shop + Equipment + Sub-Equipment */}
          <div style={S.row3}>
            <div style={S.field}>
              <label style={S.label}>Shop Description *</label>
              <select name="shop_code" value={form.shop_code} onChange={onChange} style={S.select} required>
                <option value="">— Select Shop —</option>
                {shops.map(s => (
                  <option key={s.shop_code} value={s.shop_code}>{s.shop_desc}</option>
                ))}
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Equipment Name</label>
              <select name="eqpt_name" value={form.eqpt_name} onChange={onChange}
                      style={{ ...S.select, color: eqpts.length ? "#111827" : "#9ca3af" }}
                      disabled={!eqpts.length}>
                <option value="">— Select Equipment —</option>
                {eqpts.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Sub Equipment Name</label>
              <select name="sub_eqpt_name" value={form.sub_eqpt_name} onChange={onChange}
                      style={{ ...S.select, color: subEqpts.length ? "#111827" : "#9ca3af" }}
                      disabled={!subEqpts.length}>
                <option value="">— Select Sub Equipment —</option>
                {subEqpts.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Agency + Delay From + Delay Upto + Duration */}
          <div style={S.row4}>
            <div style={S.field}>
              <label style={S.label}>Agency *</label>
              <select name="agency" value={form.agency} onChange={onChange} style={S.select} required>
                <option value="">— Select Agency —</option>
                {AGENCIES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Delay From *</label>
              <input name="delay_from" type="datetime-local" value={form.delay_from}
                     onChange={onChange} style={S.input} required />
            </div>

            <div style={S.field}>
              <label style={S.label}>Delay Upto *</label>
              <input name="delay_upto" type="datetime-local" value={form.delay_upto}
                     onChange={onChange} style={S.input} required />
            </div>

            <div style={S.field}>
              <label style={S.label}>Delay Duration</label>
              {/* DISABLED — auto-calculated from timestamps */}
              <input
                value={duration || "Auto-calculated"}
                style={{ ...S.input, background: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }}
                disabled
                readOnly
              />
            </div>
          </div>

          {/* Row 3: Delay Description */}
          <div style={S.field}>
            <label style={S.label}>Delay Description</label>
            <textarea
              name="delay_desc"
              value={form.delay_desc}
              onChange={onChange}
              style={S.textarea}
              rows={3}
              placeholder="Describe the reason / cause of the delay…"
            />
          </div>

          {/* Buttons */}
          <div style={S.btnRow}>
            <button type="button" onClick={handleClear} style={S.btnSecondary}>
              Clear
            </button>
            <button type="submit"
                    style={{ ...S.btnPrimary, opacity: submitting ? 0.7 : 1 }}
                    disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

const S = {
  page:       { padding: "28px", maxWidth: "1000px", margin: "0 auto" },
  pageHeader: { marginBottom: "20px" },
  title:      { margin: "0 0 4px", fontSize: "22px", fontWeight: "700", color: "#111827" },
  subtitle:   { margin: 0, fontSize: "13px", color: "#6b7280" },
  flash:      { padding: "12px 16px", border: "1px solid", borderRadius: "9px", fontSize: "14px", marginBottom: "16px" },
  card:       { background: "#ffffff", borderRadius: "14px", padding: "28px", boxShadow: "0 1px 6px rgba(0,0,0,0.08)" },
  row3:       { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "18px", marginBottom: "18px" },
  row4:       { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "18px", marginBottom: "18px" },
  field:      { display: "flex", flexDirection: "column", gap: "6px" },
  label:      { fontSize: "13px", fontWeight: "600", color: "#374151" },
  input:      { padding: "9px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none" },
  select:     { padding: "9px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", color: "#111827", background: "#fff", outline: "none" },
  textarea:   { padding: "9px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none", resize: "vertical", fontFamily: "inherit" },
  btnRow:     { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" },
  btnPrimary: { background: "#0f3460", color: "#fff", border: "none", borderRadius: "8px", padding: "11px 32px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  btnSecondary:{ background: "#f9fafb", color: "#374151", border: "1.5px solid #d1d5db", borderRadius: "8px", padding: "11px 22px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
};
