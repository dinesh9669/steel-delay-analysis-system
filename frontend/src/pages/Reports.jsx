// frontend/src/pages/Reports.jsx
// Page 4 — Delay Reports
// Version 1: Tabular format  (table with filters + pagination)
// Version 2: Graphical format (bar charts + pie chart via Recharts)

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { getShops, getTabular, getChart, getSummary } from "../utils/api";

// Chart color palette
const COLORS = ["#0f3460","#e94560","#0d7377","#f5a623","#6c5ce7","#00b894","#fd79a8","#636e72"];

// Table column definitions
const COLUMNS = [
  { key: "shop_desc",      label: "Shop"         },
  { key: "eqpt_name",      label: "Equipment"    },
  { key: "sub_eqpt_name",  label: "Sub Equip."   },
  { key: "agency",         label: "Agency"       },
  { key: "delay_from",     label: "From"         },
  { key: "delay_upto",     label: "Upto"         },
  { key: "delay_duration", label: "Hrs"          },
  { key: "delay_desc",     label: "Description"  },
  { key: "user_entered",   label: "Entered By"   },
];

export default function Reports() {
  const [view,    setView]   = useState("tabular");       // "tabular" | "graphical"
  const [shops,   setShops]  = useState([]);
  const [filters, setFilters]= useState({ shop_code: "", from_date: "", to_date: "" });
  const [rows,    setRows]   = useState([]);
  const [total,   setTotal]  = useState(0);
  const [page,    setPage]   = useState(1);
  const [summary, setSummary]= useState(null);
  const [chart,   setChart]  = useState({ agency: [], shop: [], equipment: [] });
  const [groupBy, setGroupBy]= useState("agency");
  const [loading, setLoading]= useState(false);

  useEffect(() => { getShops().then(setShops).catch(() => {}); }, []);
  useEffect(() => { loadData(); }, [filters, page, view]);

  async function loadData() {
    setLoading(true);
    try {
      const params = { page, page_size: 100 };
      if (filters.shop_code) params.shop_code = filters.shop_code;
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date)   params.to_date   = filters.to_date;

      const [tabRes, sumRes] = await Promise.all([
        getTabular(params),
        getSummary(params),
      ]);
      setRows(tabRes.data  || []);
      setTotal(tabRes.total || 0);
      setSummary(sumRes);

      if (view === "graphical") {
        const [a, s, e] = await Promise.all([
          getChart({ ...params, group_by: "agency"    }),
          getChart({ ...params, group_by: "shop"      }),
          getChart({ ...params, group_by: "equipment" }),
        ]);
        setChart({ agency: a, shop: s, equipment: e });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function onFilter(e) {
    setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
    setPage(1);
  }

  const totalPages = Math.ceil(total / 100);

  return (
    <div style={S.page}>

      {/* Page Header + View Toggle */}
      <div style={S.header}>
        <div>
          <h2 style={S.title}>Delay Reports</h2>
          <p style={S.subtitle}>Analyse equipment delays across all departments and time periods</p>
        </div>
        <div style={S.toggleWrap}>
          <button onClick={() => setView("tabular")}
                  style={view === "tabular" ? S.toggleActive : S.toggleBtn}>
            📋 Tabular
          </button>
          <button onClick={() => setView("graphical")}
                  style={view === "graphical" ? S.toggleActive : S.toggleBtn}>
            📊 Graphical
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div style={S.filterBar}>
        <div style={S.filterField}>
          <label style={S.label}>Shop Desc</label>
          <select name="shop_code" value={filters.shop_code} onChange={onFilter} style={S.select}>
            <option value="">All Shops</option>
            {shops.map(s => <option key={s.shop_code} value={s.shop_code}>{s.shop_desc}</option>)}
          </select>
        </div>
        <div style={S.filterField}>
          <label style={S.label}>From Date</label>
          <input name="from_date" type="date" value={filters.from_date} onChange={onFilter} style={S.input} />
        </div>
        <div style={S.filterField}>
          <label style={S.label}>To Date</label>
          <input name="to_date" type="date" value={filters.to_date} onChange={onFilter} style={S.input} />
        </div>
        <button onClick={loadData} style={S.btnSearch}>Search</button>
      </div>

      {/* ── KPI Summary Cards ── */}
      {summary && (
        <div style={S.kpiRow}>
          {[
            { icon: "⚠️", val: summary.total_delays.toLocaleString(), lbl: "Total Delays"    },
            { icon: "⏱",  val: summary.total_hours.toLocaleString() + " hrs", lbl: "Total Hours" },
            { icon: "📏", val: summary.avg_duration + " hrs",  lbl: "Avg Duration"   },
            { icon: "🔧", val: summary.worst_equipment || "—", lbl: "Worst Equipment",
              sub: summary.worst_eqpt_hrs ? summary.worst_eqpt_hrs + " hrs" : "" },
          ].map((k, i) => (
            <div key={i} style={S.kpiCard}>
              <span style={S.kpiIcon}>{k.icon}</span>
              <div>
                <div style={S.kpiVal}>{k.val}</div>
                <div style={S.kpiLbl}>{k.lbl}</div>
                {k.sub && <div style={S.kpiSub}>{k.sub}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && <div style={S.loading}>Loading data…</div>}

      {/* ═══════════════════════════════════════════════
           VERSION 1 — TABULAR FORMAT
          ═══════════════════════════════════════════════ */}
      {view === "tabular" && !loading && (
        <>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {COLUMNS.map(c => <th key={c.key} style={S.th}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    {COLUMNS.map(c => (
                      <td key={c.key} style={S.td}>
                        {c.key === "delay_duration" ? (
                          <span style={S.durBadge}>{r[c.key]}h</span>
                        ) : r[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: "36px", textAlign: "center", color: "#9ca3af" }}>
                      No records found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={S.pagination}>
              <span style={{ fontSize: "13px", color: "#6b7280" }}>
                Page {page} of {totalPages} · {total.toLocaleString()} records total
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1} style={S.pageBtn}>← Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages} style={S.pageBtn}>Next →</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════
           VERSION 2 — GRAPHICAL FORMAT
          ═══════════════════════════════════════════════ */}
      {view === "graphical" && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Group-by toggle */}
          <div style={{ display: "flex", gap: "10px" }}>
            {["agency", "shop", "equipment"].map(g => (
              <button key={g} onClick={() => setGroupBy(g)}
                      style={groupBy === g ? S.toggleActive : S.toggleBtn}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>

          {/* Bar Chart – Delay Count */}
          <div style={S.chartCard}>
            <h3 style={S.chartTitle}>Number of Delays by {groupBy}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chart[groupBy]} margin={{ top: 10, right: 20, left: 0, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="No. of Delays" fill="#0f3460" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart – Total Hours */}
          <div style={S.chartCard}>
            <h3 style={S.chartTitle}>Total Delay Hours by {groupBy}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chart[groupBy]} margin={{ top: 10, right: 20, left: 0, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total_hrs" name="Total Hours" fill="#e94560" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart – Agency Share */}
          <div style={S.chartCard}>
            <h3 style={S.chartTitle}>Delay Distribution by Agency</h3>
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie
                  data={chart.agency}
                  dataKey="count"
                  nameKey="label"
                  cx="50%" cy="50%"
                  outerRadius={120}
                  label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={true}
                >
                  {chart.agency.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}
    </div>
  );
}

const S = {
  page:        { padding: "28px", maxWidth: "1200px", margin: "0 auto" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  title:       { margin: "0 0 4px", fontSize: "22px", fontWeight: "700", color: "#111827" },
  subtitle:    { margin: 0, fontSize: "13px", color: "#6b7280" },
  toggleWrap:  { display: "flex", gap: "4px", background: "#f3f4f6", borderRadius: "10px", padding: "4px" },
  toggleBtn:   { background: "transparent", border: "none", borderRadius: "7px", padding: "7px 18px", fontSize: "13px", cursor: "pointer", color: "#6b7280" },
  toggleActive:{ background: "#fff", border: "none", borderRadius: "7px", padding: "7px 18px", fontSize: "13px", cursor: "pointer", fontWeight: "600", color: "#0f3460", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  filterBar:   { display: "flex", gap: "14px", alignItems: "flex-end", background: "#fff", borderRadius: "12px", padding: "16px 20px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  filterField: { display: "flex", flexDirection: "column", gap: "5px", flex: 1 },
  label:       { fontSize: "12px", fontWeight: "600", color: "#6b7280" },
  select:      { padding: "8px 10px", border: "1.5px solid #d1d5db", borderRadius: "7px", fontSize: "13px", background: "#fff" },
  input:       { padding: "8px 10px", border: "1.5px solid #d1d5db", borderRadius: "7px", fontSize: "13px" },
  btnSearch:   { background: "#0f3460", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 22px", fontSize: "13px", fontWeight: "600", cursor: "pointer", alignSelf: "flex-end" },
  kpiRow:      { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "20px" },
  kpiCard:     { background: "#fff", borderRadius: "12px", padding: "16px 18px", display: "flex", gap: "14px", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  kpiIcon:     { fontSize: "28px" },
  kpiVal:      { fontWeight: "700", fontSize: "18px", color: "#111827" },
  kpiLbl:      { fontSize: "11px", color: "#9ca3af", marginTop: "2px" },
  kpiSub:      { fontSize: "11px", color: "#6b7280" },
  loading:     { textAlign: "center", padding: "40px", color: "#9ca3af", fontSize: "14px" },
  tableWrap:   { background: "#fff", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "auto" },
  table:       { width: "100%", borderCollapse: "collapse", minWidth: "900px" },
  th:          { background: "#f8fafc", padding: "11px 12px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" },
  td:          { padding: "10px 12px", fontSize: "12px", color: "#374151", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  durBadge:    { background: "#fff7ed", color: "#c2410c", borderRadius: "20px", padding: "2px 9px", fontSize: "11px", fontWeight: "600" },
  pagination:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" },
  pageBtn:     { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "6px 14px", fontSize: "13px", cursor: "pointer" },
  chartCard:   { background: "#fff", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  chartTitle:  { margin: "0 0 16px", fontSize: "15px", fontWeight: "600", color: "#111827" },
};
