import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────
// Replace these two values with your own from supabase.com → Project Settings → API
const SUPABASE_URL  = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON = "YOUR_ANON_PUBLIC_KEY";
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── GENERIC DB HOOK ─────────────────────────────────────────────────────────
// useTable(tableName, initRows) → [rows, loading, add, update, remove, reload]
function useTable(table, init = []) {
  const [rows, setRows]       = useState(init);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await sb.from(table).select("*").order("id", { ascending: true });
    if (!error && data) setRows(data);
    setLoading(false);
  }, [table]);

  useEffect(() => { load(); }, [load]);

  const add = async (row) => {
    const { data, error } = await sb.from(table).insert([row]).select();
    if (!error && data) setRows(r => [...r, ...data]);
    return { data, error };
  };

  const update = async (id, changes) => {
    const { data, error } = await sb.from(table).update(changes).eq("id", id).select();
    if (!error && data) setRows(r => r.map(x => x.id === id ? data[0] : x));
    return { data, error };
  };

  const remove = async (id) => {
    const { error } = await sb.from(table).delete().eq("id", id);
    if (!error) setRows(r => r.filter(x => x.id !== id));
    return { error };
  };

  return [rows, loading, add, update, remove, load];
}

// ─── FIRM SETTINGS HOOK ───────────────────────────────────────────────────────
function useFirmSettings(defaultFirm) {
  const [firm, setFirmState] = useState(defaultFirm);
  const [firmLoading, setFirmLoading] = useState(true);
  const defaultRef = useRef(defaultFirm);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("firm_settings").select("data").eq("firm_id","default").single();
      if (data?.data && Object.keys(data.data).length > 0) setFirmState(prev => ({...defaultRef.current, ...data.data}));
      setFirmLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveFirm = async (newFirm) => {
    setFirmState(newFirm);
    await sb.from("firm_settings").upsert({ firm_id:"default", data: newFirm, updated_at: new Date().toISOString() });
  };

  return [firm, saveFirm, firmLoading];
}

// ─── LOADING SPINNER ─────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:60, flexDirection:"column", gap:12 }}>
    <div style={{ width:36, height:36, border:"3px solid #e5e7eb", borderTopColor:"#2563eb",
      borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
    <div style={{ fontSize:13, color:"#9ca3af" }}>Loading from database…</div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── ICONS (inline SVG) ───────────────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
  const icons = {
    dashboard: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    clients: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    cash: <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
    tasks: <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
    billing: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    reports: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    documents: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    chevronDown: <polyline points="6 9 12 15 18 9"/>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    arrowUp: <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
    arrowDown: <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

// ─── DATE PICKER ─────────────────────────────────────────────────────────────
const DatePicker = ({ value, onChange, placeholder = "Select date" }) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("days");
  const today = new Date();
  const [current, setCurrent] = useState(value ? new Date(value) : today);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay();

  const renderDays = () => {
    const y = current.getFullYear(), m = current.getMonth();
    const total = getDaysInMonth(y, m), first = getFirstDay(y, m);
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(<div key={`e${i}`} />);
    for (let d = 1; d <= total; d++) {
      const iso = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const sel = value === iso;
      const tod = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
      cells.push(
        <div key={d} onClick={() => { onChange(iso); setOpen(false); }}
          style={{ padding:"6px 0", textAlign:"center", cursor:"pointer", borderRadius:6, fontSize:13,
            background: sel ? "#2563eb" : tod ? "#dbeafe" : "transparent",
            color: sel ? "#fff" : tod ? "#1d4ed8" : "#374151",
            fontWeight: sel || tod ? 700 : 400 }}
          onMouseEnter={e => { if(!sel) e.target.style.background = "#f3f4f6"; }}
          onMouseLeave={e => { if(!sel) e.target.style.background = tod ? "#dbeafe" : "transparent"; }}>
          {d}
        </div>
      );
    }
    return cells;
  };

  return (
    <div ref={ref} style={{ position:"relative", display:"inline-block" }}>
      <div onClick={() => setOpen(!open)}
        style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", border:"1px solid #d1d5db",
          borderRadius:8, cursor:"pointer", background:"#fff", minWidth:160, fontSize:13,
          boxShadow: open ? "0 0 0 3px #dbeafe" : "none" }}>
        <Icon name="calendar" size={14} />
        <span style={{ color: value ? "#111827" : "#9ca3af", flex:1 }}>
          {value || placeholder}
        </span>
        {value && <span onClick={(e)=>{e.stopPropagation();onChange("");}} style={{color:"#9ca3af",lineHeight:1}}><Icon name="close" size={12}/></span>}
      </div>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, background:"#fff", border:"1px solid #e5e7eb",
          borderRadius:12, padding:16, zIndex:1000, boxShadow:"0 10px 40px rgba(0,0,0,0.12)", width:260 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth()-1, 1))}
              style={{ background:"none", border:"none", cursor:"pointer", padding:4, borderRadius:6, color:"#6b7280" }}>‹</button>
            <span style={{ fontWeight:700, fontSize:14, cursor:"pointer" }} onClick={() => setView(v => v==="days"?"months":"days")}>
              {months[current.getMonth()]} {current.getFullYear()}
            </span>
            <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth()+1, 1))}
              style={{ background:"none", border:"none", cursor:"pointer", padding:4, borderRadius:6, color:"#6b7280" }}>›</button>
          </div>
          {view === "days" ? (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
                {days.map(d => <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:"#9ca3af", padding:"4px 0" }}>{d}</div>)}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>{renderDays()}</div>
            </>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
              {months.map((mo, i) => (
                <div key={mo} onClick={() => { setCurrent(new Date(current.getFullYear(), i, 1)); setView("days"); }}
                  style={{ padding:"8px 4px", textAlign:"center", cursor:"pointer", borderRadius:8, fontSize:13,
                    background: current.getMonth()===i ? "#2563eb" : "#f9fafb", color: current.getMonth()===i ? "#fff" : "#374151" }}>
                  {mo}
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid #f3f4f6", display:"flex", gap:8 }}>
            <button onClick={() => { const t=new Date(); onChange(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`); setOpen(false); }}
              style={{ flex:1, padding:"6px 0", background:"#f3f4f6", border:"none", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:600 }}>Today</button>
            <button onClick={() => { onChange(""); setOpen(false); }}
              style={{ flex:1, padding:"6px 0", background:"#fee2e2", border:"none", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:600, color:"#dc2626" }}>Clear</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── DYNAMIC FIELDS EDITOR ───────────────────────────────────────────────────
const DynamicFieldsEditor = ({ fields, setFields, prefix }) => {
  const [newField, setNewField] = useState({ label:"", type:"text" });
  const types = ["text","number","date","email","phone","select","textarea"];
  return (
    <div style={{ background:"#f8fafc", border:"1px dashed #cbd5e1", borderRadius:10, padding:16, marginTop:12 }}>
      <div style={{ fontWeight:700, fontSize:13, color:"#475569", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
        <Icon name="settings" size={14}/> Custom Fields
      </div>
      {fields.map((f, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <div style={{ flex:1, padding:"6px 10px", background:"#fff", border:"1px solid #e2e8f0", borderRadius:6, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontWeight:600, color:"#334155" }}>{f.label}</span>
            <span style={{ background:"#e0f2fe", color:"#0369a1", borderRadius:4, padding:"1px 6px", fontSize:11 }}>{f.type}</span>
          </div>
          <button onClick={() => setFields(fields.filter((_,j) => j!==i))}
            style={{ background:"#fee2e2", border:"none", borderRadius:6, padding:"6px 8px", cursor:"pointer", color:"#dc2626", display:"flex", alignItems:"center" }}>
            <Icon name="trash" size={13}/>
          </button>
        </div>
      ))}
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <input value={newField.label} onChange={e=>setNewField({...newField, label:e.target.value})}
          placeholder="Field name" style={{ flex:1, padding:"7px 10px", border:"1px solid #e2e8f0", borderRadius:6, fontSize:13 }}/>
        <select value={newField.type} onChange={e=>setNewField({...newField, type:e.target.value})}
          style={{ padding:"7px 10px", border:"1px solid #e2e8f0", borderRadius:6, fontSize:13, background:"#fff" }}>
          {types.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={() => { if(newField.label.trim()){ setFields([...fields, newField]); setNewField({label:"",type:"text"}); }}}
          style={{ padding:"7px 14px", background:"#2563eb", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
          <Icon name="plus" size={13}/> Add
        </button>
      </div>
    </div>
  );
};

// ─── SEARCH + FILTER BAR ─────────────────────────────────────────────────────
const SearchFilterBar = ({ search, setSearch, dateFrom, setDateFrom, dateTo, setDateTo, filters=[], activeFilter, setActiveFilter, showDateFilter=true }) => (
  <div style={{ display:"flex", flexWrap:"wrap", gap:10, alignItems:"center", marginBottom:18 }}>
    <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:200, padding:"8px 14px",
      background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      <Icon name="search" size={15}/><input value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="Search..." style={{ border:"none", outline:"none", flex:1, fontSize:13, background:"transparent" }}/>
      {search && <span onClick={()=>setSearch("")} style={{cursor:"pointer",color:"#9ca3af"}}><Icon name="close" size={13}/></span>}
    </div>
    {filters.length>0 && (
      <div style={{ display:"flex", gap:6 }}>
        {filters.map(f=>(
          <button key={f} onClick={()=>setActiveFilter(activeFilter===f?null:f)}
            style={{ padding:"7px 14px", borderRadius:8, border:"1px solid", fontSize:12, fontWeight:600, cursor:"pointer",
              background: activeFilter===f ? "#2563eb" : "#fff",
              borderColor: activeFilter===f ? "#2563eb" : "#e5e7eb",
              color: activeFilter===f ? "#fff" : "#374151" }}>
            {f}
          </button>
        ))}
      </div>
    )}
    {showDateFilter && (
      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
        <span style={{ fontSize:12, color:"#6b7280", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}><Icon name="filter" size={12}/> Date:</span>
        <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From date"/>
        <span style={{ color:"#9ca3af", fontSize:12 }}>–</span>
        <DatePicker value={dateTo} onChange={setDateTo} placeholder="To date"/>
      </div>
    )}
  </div>
);

// ─── MODAL ────────────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, width=560 }) => {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:width, maxHeight:"90vh", overflow:"auto",
        boxShadow:"0 25px 80px rgba(0,0,0,0.2)", animation:"fadeIn 0.2s ease" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:"1px solid #f3f4f6" }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:"#111827" }}>{title}</h3>
          <button onClick={onClose} style={{ background:"#f3f4f6", border:"none", borderRadius:8, padding:6, cursor:"pointer", display:"flex", color:"#6b7280" }}><Icon name="close" size={16}/></button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
};

// ─── BADGE ────────────────────────────────────────────────────────────────────
const Badge = ({ label, color="#2563eb" }) => {
  const colors = {
    blue:["#eff6ff","#1d4ed8"], green:["#f0fdf4","#15803d"], yellow:["#fefce8","#a16207"],
    red:["#fef2f2","#dc2626"], purple:["#faf5ff","#7c3aed"], gray:["#f9fafb","#6b7280"],
    orange:["#fff7ed","#c2410c"]
  };
  const [bg, fg] = colors[color] || colors.blue;
  return <span style={{ background:bg, color:fg, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{label}</span>;
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, sub, icon, color="#2563eb", trend }) => (
  <div style={{ background:"#fff", borderRadius:14, padding:20, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", border:"1px solid #f3f4f6" }}>
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
      <div>
        <div style={{ fontSize:12, fontWeight:600, color:"#9ca3af", marginBottom:6, textTransform:"uppercase", letterSpacing:".05em" }}>{title}</div>
        <div style={{ fontSize:26, fontWeight:900, color:"#111827", lineHeight:1 }}>{value}</div>
        {sub && <div style={{ fontSize:12, color:"#6b7280", marginTop:4 }}>{sub}</div>}
        {trend !== undefined && (
          <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:6, fontSize:12, fontWeight:700, color: trend>=0 ? "#16a34a":"#dc2626" }}>
            <Icon name={trend>=0?"arrowUp":"arrowDown"} size={12}/>{Math.abs(trend)}% vs last month
          </div>
        )}
      </div>
      <div style={{ background:color, borderRadius:12, padding:12, color:"#fff", opacity:.9 }}><Icon name={icon} size={20}/></div>
    </div>
  </div>
);

// ─── FORM FIELD ───────────────────────────────────────────────────────────────
const Field = ({ label, children, required }) => (
  <div style={{ marginBottom:16 }}>
    <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:6, textTransform:"uppercase", letterSpacing:".04em" }}>
      {label}{required && <span style={{ color:"#dc2626" }}> *</span>}
    </label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} style={{ width:"100%", padding:"9px 12px", border:"1px solid #d1d5db", borderRadius:8, fontSize:13,
    outline:"none", boxSizing:"border-box", transition:"border-color .15s", ...props.style }}
    onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
);

const Select = ({ children, ...props }) => (
  <select {...props} style={{ width:"100%", padding:"9px 12px", border:"1px solid #d1d5db", borderRadius:8, fontSize:13,
    outline:"none", boxSizing:"border-box", background:"#fff", ...props.style }}>
    {children}
  </select>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const MODULES = [
  { id:"dashboard", label:"Dashboard", icon:"dashboard" },
  { id:"clients", label:"Clients", icon:"clients" },
  { id:"cash", label:"Cash Management", icon:"cash" },
  { id:"tasks", label:"Tasks & Deadlines", icon:"tasks" },
  { id:"billing", label:"Billing & Invoices", icon:"billing" },
  { id:"documents", label:"Documents", icon:"documents" },
  { id:"reports", label:"Reports", icon:"reports" },
  { id:"setup", label:"Firm Setup", icon:"settings" },
];

const DEFAULT_FIRM = {
  name:"Sharma & Associates", suffix:"Chartered Accountants",
  address:"123, Business Park, Andheri East", city:"Mumbai", state:"Maharashtra", pin:"400069",
  phone:"022-12345678", mobile:"9876543210", email:"info@sharmaassociates.com",
  website:"www.sharmaassociates.com", pan:"AABCS1234D", gstin:"27AABCS1234D1Z5",
  membershipNo:"012345", regNo:"W-1234",
  banks:[
    { id:1, label:"HDFC Current", bankName:"HDFC Bank", accountNo:"12345678901", ifsc:"HDFC0001234", branch:"Andheri East Branch", type:"Current", primary:true },
    { id:2, label:"SBI Savings",  bankName:"State Bank of India", accountNo:"98765432100", ifsc:"SBIN0001234", branch:"Fort Branch", type:"Savings", primary:false },
    { id:3, label:"Axis OD",      bankName:"Axis Bank", accountNo:"11223344556", ifsc:"UTIB0001234", branch:"BKC Branch", type:"OD", primary:false },
    { id:4, label:"Petty Cash",   bankName:"Cash", accountNo:"", ifsc:"", branch:"", type:"Cash", primary:false },
    { id:5, label:"Cash in Hand", bankName:"Cash", accountNo:"", ifsc:"", branch:"", type:"Cash", primary:false },
  ],
  invoicePrefix:"INV", invoiceFooter:"Thank you for your business. Payment due within 30 days.",
  currency:"₹", taxRate:"18",
};

export default function App() {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [firm, saveFirm, firmLoading] = useFirmSettings(DEFAULT_FIRM);

  const allModules = MODULES;

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'DM Sans', system-ui, sans-serif", background:"#f1f5f9", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box; }
        input, select, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:#f1f5f9; }
        ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:3px; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @media print {
          .no-print { display:none !important; }
          body { margin:0; }
        }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: sidebarOpen?240:72, background:"#0f172a", color:"#fff", display:"flex", flexDirection:"column",
        transition:"width .2s", flexShrink:0, overflow:"hidden" }}>
        <div style={{ padding:"20px 16px", borderBottom:"1px solid rgba(255,255,255,.08)", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontWeight:900, fontSize:14 }}>CA</div>
          {sidebarOpen && <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:12, lineHeight:1.3, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{firm.name}</div>
            <div style={{ fontSize:10, color:"#94a3b8", marginTop:1 }}>{firm.suffix}</div>
          </div>}
        </div>
        <nav style={{ flex:1, padding:"12px 8px", overflowY:"auto" }}>
          {allModules.map(m => (
            <button key={m.id} onClick={() => setActiveModule(m.id)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"11px 12px", borderRadius:10, border:"none",
                cursor:"pointer", marginBottom:2, textAlign:"left", transition:"all .15s",
                background: activeModule===m.id ? "rgba(59,130,246,.2)" : "transparent",
                color: activeModule===m.id ? "#93c5fd" : "#94a3b8",
                borderTop: m.id==="setup" ? "1px solid rgba(255,255,255,.06)" : "none",
                marginTop: m.id==="setup" ? 8 : 0 }}>
              <span style={{ flexShrink:0 }}><Icon name={m.icon} size={18}/></span>
              {sidebarOpen && <span style={{ fontSize:13, fontWeight: activeModule===m.id?700:500 }}>{m.label}</span>}
              {sidebarOpen && activeModule===m.id && <div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:"#3b82f6" }}/>}
            </button>
          ))}
        </nav>
        <div style={{ padding:"12px 8px", borderTop:"1px solid rgba(255,255,255,.08)" }}>
          <button onClick={()=>setSidebarOpen(!sidebarOpen)}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, border:"none",
              cursor:"pointer", background:"transparent", color:"#64748b", fontSize:13 }}>
            <span>{sidebarOpen?"◂":"▸"}</span>
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Top bar */}
        <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"0 24px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#111827" }}>{allModules.find(m=>m.id===activeModule)?.label}</h2>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <span style={{ fontSize:12, color:"#6b7280" }}>{new Date().toDateString()}</span>
            <button onClick={()=>setActiveModule("setup")} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:34, height:34, background:"#1d4ed8", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>
                <Icon name="user" size={16}/>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:24 }}>
          {activeModule==="dashboard" && <Dashboard setActiveModule={setActiveModule} firm={firm}/>}
          {activeModule==="clients" && <Clients />}
          {activeModule==="cash" && <CashManagement firm={firm}/>}
          {activeModule==="tasks" && <Tasks />}
          {activeModule==="billing" && <Billing firm={firm}/>}
          {activeModule==="documents" && <Documents />}
          {activeModule==="reports" && <Reports />}
          {activeModule==="setup" && <FirmSetup firm={firm} setFirm={saveFirm} loading={firmLoading}/>}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ setActiveModule, firm }) {
  const stats = [
    { title:"Total Clients", value:"148", sub:"12 new this month", icon:"clients", color:"#2563eb", trend:8 },
    { title:"Outstanding Dues", value:"₹4.2L", sub:"23 pending invoices", icon:"billing", color:"#dc2626", trend:-3 },
    { title:"Cash Balance", value:"₹12.8L", sub:"Across all accounts", icon:"cash", color:"#059669", trend:12 },
    { title:"Pending Tasks", value:"34", sub:"8 due today", icon:"tasks", color:"#d97706", trend:5 },
  ];
  const recentActivity = [
    { text:"Invoice #INV-0089 raised for Mehta Traders", time:"2h ago", type:"billing" },
    { text:"GST filing deadline for Q3 added to tasks", time:"4h ago", type:"tasks" },
    { text:"New client Suresh Patel onboarded", time:"Yesterday", type:"clients" },
    { text:"Cash entry ₹45,000 received from Jain & Co.", time:"Yesterday", type:"cash" },
    { text:"Balance sheet uploaded for Ram Enterprises", time:"2 days ago", type:"documents" },
  ];
  const colorMap = { billing:"#dc2626", tasks:"#d97706", clients:"#2563eb", cash:"#059669", documents:"#7c3aed" };
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16, marginBottom:24 }}>
        {stats.map(s => <StatCard key={s.title} {...s}/>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:"#fff", borderRadius:14, padding:20, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:800, color:"#111827" }}>Recent Activity</h3>
          {recentActivity.map((a, i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, paddingBottom:12, marginBottom:12, borderBottom: i<recentActivity.length-1?"1px solid #f3f4f6":"none" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:colorMap[a.type]||"#6b7280", marginTop:5, flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:"#374151" }}>{a.text}</div>
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background:"#fff", borderRadius:14, padding:20, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:800, color:"#111827" }}>Quick Actions</h3>
          {[
            { label:"Add New Client", icon:"clients", module:"clients", color:"#2563eb" },
            { label:"Record Cash Entry", icon:"cash", module:"cash", color:"#059669" },
            { label:"Create Invoice", icon:"billing", module:"billing", color:"#dc2626" },
            { label:"Add Task", icon:"tasks", module:"tasks", color:"#d97706" },
            { label:"Upload Document", icon:"documents", module:"documents", color:"#7c3aed" },
          ].map(a => (
            <button key={a.label} onClick={()=>setActiveModule(a.module)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:"#f8fafc",
                border:"1px solid #e5e7eb", borderRadius:10, marginBottom:8, cursor:"pointer", textAlign:"left", transition:"all .15s" }}
              onMouseEnter={e=>e.currentTarget.style.background="#eff6ff"}
              onMouseLeave={e=>e.currentTarget.style.background="#f8fafc"}>
              <div style={{ background:a.color, borderRadius:8, padding:8, color:"#fff" }}><Icon name={a.icon} size={14}/></div>
              <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT MANAGEMENT ────────────────────────────────────────────────────────
function Clients() {
  const [clients, loading, addClient, updateClient, removeClient] = useTable("clients");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);
  const [modal, setModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [customFields, setCustomFields] = useState([{ label:"Engagement Type", type:"select" }]);
  const [form, setForm] = useState({ name:"",pan:"",gst:"",type:"Individual",status:"Active",email:"",phone:"",city:"",joined:"" });

  const openAdd = () => { setEditClient(null); setForm({ name:"",pan:"",gst:"",type:"Individual",status:"Active",email:"",phone:"",city:"",joined:"" }); setModal(true); };
  const openEdit = (c) => { setEditClient(c); setForm({...c}); setModal(true); };
  const save = async () => {
    if(!form.name.trim()) return;
    const payload = { name:form.name, pan:form.pan, gst:form.gst, type:form.type, status:form.status,
      email:form.email, phone:form.phone, city:form.city, joined:form.joined||null };
    if(editClient) await updateClient(editClient.id, payload);
    else await addClient(payload);
    setModal(false);
  };
  const del = async (id) => { if(window.confirm("Delete this client?")) await removeClient(id); };

  if(loading) return <Spinner/>;
  const filtered = clients.filter(c => {
    const s = search.toLowerCase();
    const match = !s || c.name.toLowerCase().includes(s) || c.pan?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) || c.city?.toLowerCase().includes(s);
    const typeMatch = !activeFilter || c.type===activeFilter;
    const from = dateFrom ? c.joined >= dateFrom : true;
    const to = dateTo ? c.joined <= dateTo : true;
    return match && typeMatch && from && to;
  });

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:900 }}>Client Management</h2>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#6b7280" }}>{clients.length} total clients · {clients.filter(c=>c.status==="Active").length} active</p>
        </div>
        <button onClick={openAdd} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:"#2563eb", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13 }}>
          <Icon name="plus" size={15}/> Add Client
        </button>
      </div>
      <SearchFilterBar search={search} setSearch={setSearch} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo}
        filters={["Individual","Corporate","Partnership","LLP"]} activeFilter={activeFilter} setActiveFilter={setActiveFilter}/>
      <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ background:"#f8fafc" }}>
            {["Client Name","PAN","Type","City","Status","Joined","Actions"].map(h=>(
              <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:800, color:"#6b7280", textTransform:"uppercase", letterSpacing:".05em", borderBottom:"1px solid #f3f4f6" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} style={{ borderBottom:"1px solid #f9fafb" }}
                onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ fontWeight:700, fontSize:13, color:"#111827" }}>{c.name}</div>
                  <div style={{ fontSize:11, color:"#9ca3af" }}>{c.email}</div>
                </td>
                <td style={{ padding:"12px 16px", fontSize:13, color:"#374151", fontFamily:"monospace" }}>{c.pan}</td>
                <td style={{ padding:"12px 16px" }}><Badge label={c.type} color={c.type==="Corporate"?"blue":c.type==="Partnership"?"purple":"green"}/></td>
                <td style={{ padding:"12px 16px", fontSize:13, color:"#6b7280" }}>{c.city}</td>
                <td style={{ padding:"12px 16px" }}><Badge label={c.status} color={c.status==="Active"?"green":"gray"}/></td>
                <td style={{ padding:"12px 16px", fontSize:13, color:"#6b7280" }}>{c.joined}</td>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={()=>openEdit(c)} style={{ padding:"5px 8px", background:"#eff6ff", border:"none", borderRadius:6, cursor:"pointer", color:"#2563eb", display:"flex" }}><Icon name="edit" size={13}/></button>
                    <button onClick={()=>del(c.id)} style={{ padding:"5px 8px", background:"#fee2e2", border:"none", borderRadius:6, cursor:"pointer", color:"#dc2626", display:"flex" }}><Icon name="trash" size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0 && <tr><td colSpan={7} style={{ padding:40, textAlign:"center", color:"#9ca3af", fontSize:14 }}>No clients found</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title={editClient?"Edit Client":"Add New Client"}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div style={{ gridColumn:"1/-1" }}><Field label="Client Name" required><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full legal name"/></Field></div>
          <Field label="PAN Number"><Input value={form.pan} onChange={e=>setForm({...form,pan:e.target.value.toUpperCase()})} placeholder="ABCDE1234F" maxLength={10}/></Field>
          <Field label="GST Number"><Input value={form.gst} onChange={e=>setForm({...form,gst:e.target.value.toUpperCase()})} placeholder="27ABCDE1234F1Z5"/></Field>
          <Field label="Client Type"><Select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
            {["Individual","Corporate","Partnership","LLP","HUF","Trust"].map(t=><option key={t}>{t}</option>)}
          </Select></Field>
          <Field label="Status"><Select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
            <option>Active</option><option>Inactive</option><option>Prospect</option>
          </Select></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@example.com"/></Field>
          <Field label="Phone"><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="10-digit mobile"/></Field>
          <Field label="City"><Input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="City"/></Field>
          <Field label="Joining Date"><DatePicker value={form.joined} onChange={v=>setForm({...form,joined:v})} placeholder="Select date"/></Field>
        </div>
        {customFields.length>0 && <div style={{ marginTop:8 }}>
          {customFields.map(f=><Field key={f.label} label={f.label}><Input placeholder={`Enter ${f.label}`}/></Field>)}
        </div>}
        <DynamicFieldsEditor fields={customFields} setFields={setCustomFields} prefix="client"/>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
          <button onClick={()=>setModal(false)} style={{ padding:"10px 20px", background:"#f3f4f6", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 }}>Cancel</button>
          <button onClick={save} style={{ padding:"10px 20px", background:"#2563eb", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700 }}>
            {editClient?"Update Client":"Add Client"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─── CASH MANAGEMENT ─────────────────────────────────────────────────────────
function CashManagement({ firm }) {
  const ACCOUNTS = (firm?.banks||[]).map(b=>b.label);
  const [entries, loading, addEntry, updateEntry, removeEntry] = useTable("cash_entries");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);
  const [showServiceCharges, setShowServiceCharges] = useState(true);
  const [modal, setModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [viewEntry, setViewEntry] = useState(null);
  const [form, setForm] = useState({ date:"", type:"Receipt", particulars:"", account:"HDFC Current", amount:"", serviceCharge:"", scAccount:"Cash in Hand", status:"Cleared", ref:"" });
  const [customFields, setCustomFields] = useState([{ label:"Bank Reference No.", type:"text" }]);

  const blankForm = { date:"", type:"Receipt", particulars:"", account:ACCOUNTS[0]||"HDFC Current", amount:"", serviceCharge:"", scAccount:ACCOUNTS[ACCOUNTS.length-1]||"Cash in Hand", status:"Cleared", ref:"" };
  const openEdit = (e) => { setEditEntry(e); setForm({...e, amount:String(e.amount), serviceCharge:String(e.service_charge||e.serviceCharge||0), scAccount:e.sc_account||e.scAccount||""}); setModal(true); };
  const save = async () => {
    if(!form.particulars||!form.amount) return;
    const payload = { date:form.date||null, type:form.type, particulars:form.particulars,
      account:form.account, amount:Number(form.amount), service_charge:Number(form.serviceCharge||0),
      sc_account:form.scAccount||"", status:form.status, ref:form.ref };
    if(editEntry) await updateEntry(editEntry.id, payload);
    else await addEntry(payload);
    setModal(false); setEditEntry(null); setForm(blankForm);
  };
  const del = async id => { if(window.confirm("Delete entry?")) await removeEntry(id); };

  const filtered = entries.filter(e => {
    const s = search.toLowerCase();
    const match = !s || e.particulars.toLowerCase().includes(s) || e.ref?.toLowerCase().includes(s) || e.account?.toLowerCase().includes(s) || e.scAccount?.toLowerCase().includes(s);
    const typeMatch = !activeFilter || e.type===activeFilter;
    const from = dateFrom ? e.date >= dateFrom : true;
    const to = dateTo ? e.date <= dateTo : true;
    return match && typeMatch && from && to;
  });

  if(loading) return <Spinner/>;
  const totalReceipts = filtered.filter(e=>e.type==="Receipt").reduce((s,e)=>s+e.amount,0);
  const totalPayments = filtered.filter(e=>e.type==="Payment").reduce((s,e)=>s+e.amount,0);
  const totalServiceCharges = filtered.reduce((s,e)=>s+(e.service_charge||0),0);
  const netBalance = totalReceipts - totalPayments;

  const fmt = n => "₹" + Number(n).toLocaleString("en-IN");

  // Account-wise breakdown
  const accountSummary = ACCOUNTS.map(acc => {
    const mainIn  = filtered.filter(e=>e.account===acc && e.type==="Receipt").reduce((s,e)=>s+e.amount,0);
    const mainOut = filtered.filter(e=>e.account===acc && e.type==="Payment").reduce((s,e)=>s+e.amount,0);
    const scOut   = filtered.filter(e=>(e.sc_account||e.scAccount)===acc && (e.service_charge||0)>0).reduce((s,e)=>s+(e.service_charge||0),0);
    return { acc, mainIn, mainOut, scOut, net: mainIn - mainOut - scOut };
  }).filter(a => a.mainIn||a.mainOut||a.scOut);

  const tableHeaders = ["Date","Type","Particulars","Main Account","Amount",
    ...(showServiceCharges ? ["Svc. Charge","SC Account","Gross Total"] : []),
    "Status","Ref",""];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:900 }}>Cash Management</h2>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#6b7280" }}>Dual-account tracking — main amount & service charge paid separately</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={()=>setShowServiceCharges(!showServiceCharges)}
            style={{ padding:"9px 16px", background: showServiceCharges?"#f0fdf4":"#f3f4f6", border:"1px solid",
              borderColor: showServiceCharges?"#86efac":"#e5e7eb", borderRadius:10, cursor:"pointer",
              fontWeight:600, fontSize:13, color: showServiceCharges?"#15803d":"#374151" }}>
            {showServiceCharges?"✓ ":""}Service Charges
          </button>
          <button onClick={()=>{setEditEntry(null);setForm({date:"",type:"Receipt",particulars:"",account:"HDFC Current",amount:"",serviceCharge:"",scAccount:"Cash in Hand",status:"Cleared",ref:""});setModal(true);}} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:"#059669", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13 }}>
            <Icon name="plus" size={15}/> New Entry
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:16 }}>
        {[
          { title:"Total Receipts", value:fmt(totalReceipts), color:"#059669" },
          { title:"Total Payments", value:fmt(totalPayments), color:"#dc2626" },
          ...(showServiceCharges ? [{ title:"Service Charges", value:fmt(totalServiceCharges), color:"#d97706" }] : []),
          { title:"Net Balance", value:fmt(netBalance), color: netBalance>=0?"#2563eb":"#dc2626" },
        ].map(s=>(
          <div key={s.title} style={{ background:"#fff", borderRadius:12, padding:16, boxShadow:"0 2px 8px rgba(0,0,0,0.05)", borderLeft:`4px solid ${s.color}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", marginBottom:4 }}>{s.title}</div>
            <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Account-wise summary */}
      {accountSummary.length > 0 && (
        <div style={{ background:"#fff", borderRadius:12, padding:16, marginBottom:16, boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize:12, fontWeight:800, color:"#6b7280", textTransform:"uppercase", letterSpacing:".05em", marginBottom:12 }}>Account-wise Summary</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {accountSummary.map(a => (
              <div key={a.acc} style={{ flex:1, minWidth:160, background:"#f8fafc", borderRadius:10, padding:12, border:"1px solid #e5e7eb" }}>
                <div style={{ fontWeight:800, fontSize:13, color:"#111827", marginBottom:8 }}>{a.acc}</div>
                {a.mainIn>0 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}><span style={{ color:"#6b7280" }}>Receipts:</span><span style={{ color:"#059669", fontWeight:700 }}>{fmt(a.mainIn)}</span></div>}
                {a.mainOut>0 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}><span style={{ color:"#6b7280" }}>Payments:</span><span style={{ color:"#dc2626", fontWeight:700 }}>{fmt(a.mainOut)}</span></div>}
                {a.scOut>0 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}><span style={{ color:"#6b7280" }}>Svc. Charges:</span><span style={{ color:"#d97706", fontWeight:700 }}>{fmt(a.scOut)}</span></div>}
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, paddingTop:6, marginTop:4, borderTop:"1px solid #e5e7eb" }}>
                  <span style={{ fontWeight:800 }}>Net:</span>
                  <span style={{ fontWeight:900, color: a.net>=0?"#2563eb":"#dc2626" }}>{fmt(a.net)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SearchFilterBar search={search} setSearch={setSearch} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo}
        filters={["Receipt","Payment"]} activeFilter={activeFilter} setActiveFilter={setActiveFilter}/>

      <div style={{ background:"#fff", borderRadius:14, overflow:"auto", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
          <thead><tr style={{ background:"#f8fafc" }}>
            {tableHeaders.map(h=>(
              <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:11, fontWeight:800, color:"#6b7280", textTransform:"uppercase", borderBottom:"1px solid #f3f4f6", whiteSpace:"nowrap" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id} style={{ borderBottom:"1px solid #f9fafb" }}
                onMouseEnter={ev=>ev.currentTarget.style.background="#f8fafc"} onMouseLeave={ev=>ev.currentTarget.style.background="#fff"}>
                <td style={{ padding:"11px 14px", fontSize:13, color:"#6b7280", whiteSpace:"nowrap" }}>{e.date}</td>
                <td style={{ padding:"11px 14px" }}><Badge label={e.type} color={e.type==="Receipt"?"green":"red"}/></td>
                <td style={{ padding:"11px 14px", fontSize:13, color:"#111827", maxWidth:180 }}>{e.particulars}</td>
                <td style={{ padding:"11px 14px" }}>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#eff6ff", borderRadius:6, padding:"3px 8px", fontSize:12, fontWeight:600, color:"#1d4ed8" }}>
                    🏦 {e.account}
                  </div>
                </td>
                <td style={{ padding:"11px 14px", fontSize:13, fontWeight:700, color: e.type==="Receipt"?"#059669":"#dc2626", whiteSpace:"nowrap" }}>{fmt(e.amount)}</td>
                {showServiceCharges && <>
                  <td style={{ padding:"11px 14px", fontSize:13, color:"#d97706", fontWeight: e.serviceCharge>0?700:400, whiteSpace:"nowrap" }}>
                    {e.service_charge>0 ? fmt(e.service_charge) : <span style={{ color:"#d1d5db" }}>—</span>}
                  </td>
                  <td style={{ padding:"11px 14px" }}>
                    {e.service_charge>0 && (e.sc_account||e.scAccount) ? (
                      <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#fff7ed", borderRadius:6, padding:"3px 8px", fontSize:12, fontWeight:600, color:"#c2410c" }}>
                        {(e.sc_account||e.scAccount)==="Cash in Hand"||(e.sc_account||e.scAccount)==="Petty Cash"?"💵":"🏦"} {e.sc_account||e.scAccount}
                      </div>
                    ) : <span style={{ color:"#d1d5db", fontSize:13 }}>—</span>}
                  </td>
                  <td style={{ padding:"11px 14px", fontSize:13, fontWeight:700, color:"#374151", whiteSpace:"nowrap" }}>{fmt(e.amount + (e.service_charge||0))}</td>
                </>}
                <td style={{ padding:"11px 14px" }}><Badge label={e.status} color={e.status==="Cleared"?"green":e.status==="Bounced"?"red":"yellow"}/></td>
                <td style={{ padding:"11px 14px", fontSize:12, color:"#9ca3af", fontFamily:"monospace" }}>{e.ref}</td>
                <td style={{ padding:"11px 14px" }}>
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={()=>setViewEntry(e)} style={{ padding:"4px 7px", background:"#eff6ff", border:"none", borderRadius:6, cursor:"pointer", color:"#2563eb", display:"flex" }}><Icon name="eye" size={12}/></button>
                    <button onClick={()=>openEdit(e)} style={{ padding:"4px 7px", background:"#f0fdf4", border:"none", borderRadius:6, cursor:"pointer", color:"#059669", display:"flex" }}><Icon name="edit" size={12}/></button>
                    <button onClick={()=>del(e.id)} style={{ padding:"4px 7px", background:"#fee2e2", border:"none", borderRadius:6, cursor:"pointer", color:"#dc2626", display:"flex" }}><Icon name="trash" size={12}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0 && <tr><td colSpan={12} style={{ padding:40, textAlign:"center", color:"#9ca3af" }}>No entries found</td></tr>}
          </tbody>
          {filtered.length>0 && (
            <tfoot><tr style={{ background:"#f8fafc", borderTop:"2px solid #e5e7eb" }}>
              <td colSpan={4} style={{ padding:"12px 14px", fontWeight:800, fontSize:13 }}>TOTAL</td>
              <td style={{ padding:"12px 14px", fontWeight:900, color:"#111827", whiteSpace:"nowrap" }}>{fmt(filtered.reduce((s,e)=>e.type==="Receipt"?s+e.amount:s-e.amount,0))}</td>
              {showServiceCharges && <>
                <td style={{ padding:"12px 14px", fontWeight:800, color:"#d97706", whiteSpace:"nowrap" }}>{fmt(totalServiceCharges)}</td>
                <td/>
                <td style={{ padding:"12px 14px", fontWeight:900, color: netBalance>=0?"#059669":"#dc2626", whiteSpace:"nowrap" }}>
                  {fmt(filtered.reduce((s,e)=>e.type==="Receipt"?s+e.amount+(e.service_charge||0):s-e.amount,0))}
                </td>
              </>}
              <td colSpan={3}/>
            </tr></tfoot>
          )}
        </table>
      </div>

      {/* Entry Detail Modal */}
      <Modal open={!!viewEntry} onClose={()=>setViewEntry(null)} title="Transaction Detail" width={480}>
        {viewEntry && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden" }}>
              {[
                ["Date", viewEntry.date],
                ["Type", viewEntry.type],
                ["Status", viewEntry.status],
                ["Reference", viewEntry.ref || "—"],
                ["Particulars", viewEntry.particulars, true],
              ].map(([k,v,full]) => (
                <div key={k} style={{ gridColumn: full?"1/-1":"auto", padding:"11px 14px", borderBottom:"1px solid #f3f4f6" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", marginBottom:3 }}>{k}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:14, background:"#f8fafc", borderRadius:10, overflow:"hidden", border:"1px solid #e5e7eb" }}>
              <div style={{ padding:"10px 14px", background:"#f1f5f9", fontWeight:800, fontSize:12, color:"#475569", textTransform:"uppercase" }}>Account Breakdown</div>
              <div style={{ padding:14, display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#eff6ff", borderRadius:8 }}>
                  <div>
                    <div style={{ fontSize:11, color:"#6b7280", fontWeight:700, marginBottom:2 }}>MAIN AMOUNT ACCOUNT</div>
                    <div style={{ fontSize:14, fontWeight:800, color:"#1d4ed8" }}>🏦 {viewEntry.account}</div>
                  </div>
                  <div style={{ fontSize:18, fontWeight:900, color: viewEntry.type==="Receipt"?"#059669":"#dc2626" }}>{fmt(viewEntry.amount)}</div>
                </div>
                {viewEntry.serviceCharge > 0 && (
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#fff7ed", borderRadius:8 }}>
                    <div>
                      <div style={{ fontSize:11, color:"#6b7280", fontWeight:700, marginBottom:2 }}>SERVICE CHARGE ACCOUNT</div>
                      <div style={{ fontSize:14, fontWeight:800, color:"#c2410c" }}>
                        {viewEntry.scAccount==="Cash in Hand"||viewEntry.scAccount==="Petty Cash" ? "💵" : "🏦"} {viewEntry.scAccount || "—"}
                      </div>
                    </div>
                    <div style={{ fontSize:18, fontWeight:900, color:"#d97706" }}>{fmt(viewEntry.serviceCharge)}</div>
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", background:"#f0fdf4", borderRadius:8, borderTop:"2px solid #bbf7d0" }}>
                  <div style={{ fontSize:13, fontWeight:800 }}>GROSS TOTAL</div>
                  <div style={{ fontSize:20, fontWeight:900, color:"#059669" }}>{fmt(viewEntry.amount + (viewEntry.serviceCharge||0))}</div>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
              <button onClick={()=>setViewEntry(null)} style={{ padding:"10px 20px", background:"#f3f4f6", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 }}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Entry Modal */}
      <Modal open={modal} onClose={()=>{setModal(false);setEditEntry(null);}} title={editEntry?"Edit Cash Entry":"New Cash Entry"} width={580}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Field label="Date" required><DatePicker value={form.date} onChange={v=>setForm({...form,date:v})} placeholder="Select date"/></Field>
          <Field label="Transaction Type"><Select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
            <option>Receipt</option><option>Payment</option>
          </Select></Field>
          <div style={{ gridColumn:"1/-1" }}><Field label="Particulars" required><Input value={form.particulars} onChange={e=>setForm({...form,particulars:e.target.value})} placeholder="Details of transaction"/></Field></div>
        </div>

        {/* Two-account section */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, margin:"4px 0 16px" }}>
          {/* Main amount block */}
          <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:12, padding:14 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#1d4ed8", textTransform:"uppercase", marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>🏦 Main Amount Account</div>
            <Field label="Account"><Select value={form.account} onChange={e=>setForm({...form,account:e.target.value})}>
              {ACCOUNTS.map(a=><option key={a}>{a}</option>)}
            </Select></Field>
            <Field label="Amount (₹)" required><Input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00"/></Field>
          </div>
          {/* Service charge block */}
          <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:12, padding:14 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#c2410c", textTransform:"uppercase", marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>💳 Service Charge Account</div>
            <Field label="Paid Via (Cash/Bank)">
              <Select value={form.scAccount} onChange={e=>setForm({...form,scAccount:e.target.value})}>
                {ACCOUNTS.map(a=><option key={a}>{a}</option>)}
              </Select>
            </Field>
            <Field label="Service Charge (₹)"><Input type="number" value={form.serviceCharge} onChange={e=>setForm({...form,serviceCharge:e.target.value})} placeholder="0.00"/></Field>
          </div>
        </div>

        {/* Live total preview */}
        {(form.amount || form.serviceCharge) && (
          <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:14, marginBottom:16, fontSize:13 }}>
            <div style={{ fontWeight:800, fontSize:11, color:"#166534", textTransform:"uppercase", marginBottom:10 }}>Transaction Summary</div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, alignItems:"center" }}>
              <span style={{ color:"#6b7280" }}>Main Amount <span style={{ color:"#1d4ed8", fontWeight:700 }}>({form.account})</span>:</span>
              <strong style={{ color: form.type==="Receipt"?"#059669":"#dc2626" }}>₹{Number(form.amount||0).toLocaleString("en-IN")}</strong>
            </div>
            {Number(form.serviceCharge) > 0 && (
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, alignItems:"center" }}>
                <span style={{ color:"#6b7280" }}>Service Charge <span style={{ color:"#c2410c", fontWeight:700 }}>({form.scAccount})</span>:</span>
                <strong style={{ color:"#d97706" }}>₹{Number(form.serviceCharge||0).toLocaleString("en-IN")}</strong>
              </div>
            )}
            <div style={{ display:"flex", justifyContent:"space-between", paddingTop:10, marginTop:6, borderTop:"1px solid #bbf7d0", alignItems:"center" }}>
              <strong style={{ fontSize:14 }}>Gross Total:</strong>
              <strong style={{ color:"#059669", fontSize:18 }}>₹{(Number(form.amount||0)+Number(form.serviceCharge||0)).toLocaleString("en-IN")}</strong>
            </div>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Field label="Status"><Select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
            <option>Cleared</option><option>Pending</option><option>Bounced</option>
          </Select></Field>
          <Field label="Reference No."><Input value={form.ref} onChange={e=>setForm({...form,ref:e.target.value})} placeholder="CHQ/NEFT/UPI ref"/></Field>
        </div>
        <DynamicFieldsEditor fields={customFields} setFields={setCustomFields} prefix="cash"/>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
          <button onClick={()=>setModal(false)} style={{ padding:"10px 20px", background:"#f3f4f6", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 }}>Cancel</button>
          <button onClick={save} style={{ padding:"10px 20px", background:"#059669", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700 }}>{editEntry?"Update Entry":"Save Entry"}</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── TASKS ───────────────────────────────────────────────────────────────────
function Tasks() {
  const [tasks, loading, addTask, updateTask, removeTask] = useTable("tasks");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);
  const [modal, setModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title:"",client:"",type:"GST Filing",priority:"Medium",due:"",status:"Pending",assigned:"" });
  const [customFields, setCustomFields] = useState([{ label:"Remarks", type:"textarea" }]);

  const openEdit = (t) => { setEditTask(t); setForm({...t}); setModal(true); };
  const del = async (id) => { if(window.confirm("Delete task?")) await removeTask(id); };
  const save = async () => {
    if(!form.title) return;
    const payload = { title:form.title, client:form.client, type:form.type,
      priority:form.priority, due:form.due||null, status:form.status, assigned:form.assigned };
    if(editTask) await updateTask(editTask.id, payload);
    else await addTask(payload);
    setModal(false); setEditTask(null);
    setForm({ title:"",client:"",type:"GST Filing",priority:"Medium",due:"",status:"Pending",assigned:"" });
  };
  const toggleStatus = async (id) => {
    const t = tasks.find(x=>x.id===id);
    if(t) await updateTask(id, { status: t.status==="Completed"?"Pending":"Completed" });
  };

  const filtered = tasks.filter(t => {
    const s = search.toLowerCase();
    const match = !s || t.title.toLowerCase().includes(s) || t.client?.toLowerCase().includes(s);
    const pFilter = !activeFilter || t.priority===activeFilter || t.status===activeFilter;
    const from = dateFrom ? t.due >= dateFrom : true;
    const to = dateTo ? t.due <= dateTo : true;
    return match && pFilter && from && to;
  });

  if(loading) return <Spinner/>;
  const priorityColor = { High:"red", Medium:"yellow", Low:"green" };
  const statusColor = { Completed:"green", "In Progress":"blue", Pending:"gray" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:900 }}>Tasks & Deadlines</h2>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#6b7280" }}>{tasks.filter(t=>t.status!=="Completed").length} pending · {tasks.filter(t=>t.status==="Completed").length} completed</p>
        </div>
        <button onClick={()=>{setEditTask(null);setForm({title:"",client:"",type:"GST Filing",priority:"Medium",due:"",status:"Pending",assigned:""});setModal(true);}} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:"#d97706", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13 }}>
          <Icon name="plus" size={15}/> Add Task
        </button>
      </div>
      <SearchFilterBar search={search} setSearch={setSearch} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo}
        filters={["High","Medium","Low","Completed","Pending","In Progress"]} activeFilter={activeFilter} setActiveFilter={setActiveFilter}/>
      <div style={{ display:"grid", gap:10 }}>
        {filtered.map(t => (
          <div key={t.id} style={{ background:"#fff", borderRadius:12, padding:16, boxShadow:"0 2px 8px rgba(0,0,0,0.05)",
            borderLeft:`4px solid ${t.priority==="High"?"#dc2626":t.priority==="Medium"?"#f59e0b":"#22c55e"}`,
            opacity: t.status==="Completed"?.7:1 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
              <div style={{ display:"flex", gap:12, flex:1 }}>
                <button onClick={()=>toggleStatus(t.id)}
                  style={{ width:22, height:22, borderRadius:"50%", border:"2px solid", marginTop:2, flexShrink:0, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                    borderColor: t.status==="Completed"?"#059669":"#d1d5db", background: t.status==="Completed"?"#059669":"#fff",
                    color:"#fff" }}>
                  {t.status==="Completed" && <Icon name="check" size={12}/>}
                </button>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color: t.status==="Completed"?"#9ca3af":"#111827", textDecoration: t.status==="Completed"?"line-through":"none" }}>{t.title}</div>
                  <div style={{ fontSize:12, color:"#6b7280", marginTop:3 }}>👤 {t.client} · 📅 Due: <strong style={{ color: new Date(t.due)<new Date()&&t.status!=="Completed"?"#dc2626":"#374151" }}>{t.due}</strong> · {t.assigned}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:6, flexShrink:0, alignItems:"center" }}>
                <Badge label={t.priority} color={priorityColor[t.priority]}/>
                <Badge label={t.status} color={statusColor[t.status]}/>
                <Badge label={t.type} color="purple"/>
                <button onClick={()=>openEdit(t)} style={{ padding:"4px 7px", background:"#eff6ff", border:"none", borderRadius:6, cursor:"pointer", color:"#2563eb", display:"flex" }}><Icon name="edit" size={12}/></button>
                <button onClick={()=>del(t.id)} style={{ padding:"4px 7px", background:"#fee2e2", border:"none", borderRadius:6, cursor:"pointer", color:"#dc2626", display:"flex" }}><Icon name="trash" size={12}/></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length===0 && <div style={{ padding:40, textAlign:"center", color:"#9ca3af", background:"#fff", borderRadius:12 }}>No tasks found</div>}
      </div>

      <Modal open={modal} onClose={()=>{setModal(false);setEditTask(null);}} title={editTask?"Edit Task":"Add New Task"}>
        <Field label="Task Title" required><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. GST Return Q4"/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Field label="Client"><Input value={form.client} onChange={e=>setForm({...form,client:e.target.value})} placeholder="Client name"/></Field>
          <Field label="Task Type"><Select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
            {["GST Filing","IT Return","Audit","TDS","ROC Filing","Accounting","Payroll","Other"].map(t=><option key={t}>{t}</option>)}
          </Select></Field>
          <Field label="Priority"><Select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
            <option>High</option><option>Medium</option><option>Low</option>
          </Select></Field>
          <Field label="Status"><Select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
            <option>Pending</option><option>In Progress</option><option>Completed</option>
          </Select></Field>
          <Field label="Due Date"><DatePicker value={form.due} onChange={v=>setForm({...form,due:v})} placeholder="Select due date"/></Field>
          <Field label="Assigned To"><Input value={form.assigned} onChange={e=>setForm({...form,assigned:e.target.value})} placeholder="Staff member"/></Field>
        </div>
        <DynamicFieldsEditor fields={customFields} setFields={setCustomFields} prefix="task"/>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
          <button onClick={()=>setModal(false)} style={{ padding:"10px 20px", background:"#f3f4f6", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 }}>Cancel</button>
          <button onClick={save} style={{ padding:"10px 20px", background:"#d97706", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700 }}>{editTask?"Update Task":"Add Task"}</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── BILLING ─────────────────────────────────────────────────────────────────
function Billing({ firm }) {
  const [invoices, loading, addInvoice, updateInvoice, removeInvoice] = useTable("invoices");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);
  const [modal, setModal] = useState(false);
  const [editInv, setEditInv] = useState(null);
  const [viewInv, setViewInv] = useState(null);
  const [form, setForm] = useState({ no:"", client:"", services:"", date:"", due:"", amount:"", tax:"", status:"Pending" });
  const [customFields, setCustomFields] = useState([{ label:"Payment Mode", type:"select" }]);

  const nextNo = invoices.length===0 ? "INV-0001"
    : `INV-${String(Math.max(...invoices.map(i=>parseInt((i.no||"INV-0000").split("-")[1]||0)))+1).padStart(4,"0")}`;

  const openAdd = () => { setEditInv(null); setForm({ no:nextNo, client:"", services:"", date:"", due:"", amount:"", tax:"", status:"Pending" }); setModal(true); };
  const openEdit = (i) => { setEditInv(i); setForm({...i, amount:String(i.amount), tax:String(i.tax)}); setModal(true); };
  const save = async () => {
    if(!form.client||!form.amount) return;
    const payload = { no:form.no, client:form.client, services:form.services,
      date:form.date||null, due:form.due||null,
      amount:Number(form.amount), tax:Number(form.tax||0), status:form.status };
    if(editInv) await updateInvoice(editInv.id, payload);
    else await addInvoice(payload);
    setModal(false); setEditInv(null);
  };
  const del = async id => { if(window.confirm("Delete invoice?")) await removeInvoice(id); };

  const filtered = invoices.filter(i => {
    const s = search.toLowerCase();
    const match = !s || i.client.toLowerCase().includes(s) || i.no.toLowerCase().includes(s);
    const sf = !activeFilter || i.status===activeFilter;
    const from = dateFrom ? i.date >= dateFrom : true;
    const to = dateTo ? i.date <= dateTo : true;
    return match && sf && from && to;
  });

  if(loading) return <Spinner/>;
  const fmt = n => "₹" + Number(n).toLocaleString("en-IN");
  const statusColor = { Paid:"green", Pending:"yellow", Overdue:"red", Draft:"gray" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:900 }}>Billing & Invoices</h2>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#6b7280" }}>{invoices.filter(i=>i.status==="Pending").length} pending · {invoices.filter(i=>i.status==="Overdue").length} overdue</p>
        </div>
        <button onClick={openAdd} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:"#dc2626", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13 }}>
          <Icon name="plus" size={15}/> New Invoice
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
        {[
          { label:"Total Billed", val: fmt(invoices.reduce((s,i)=>s+i.amount+i.tax,0)), c:"#2563eb" },
          { label:"Received", val: fmt(invoices.filter(i=>i.status==="Paid").reduce((s,i)=>s+i.amount+i.tax,0)), c:"#059669" },
          { label:"Outstanding", val: fmt(invoices.filter(i=>i.status!=="Paid").reduce((s,i)=>s+i.amount+i.tax,0)), c:"#d97706" },
          { label:"Overdue", val: fmt(invoices.filter(i=>i.status==="Overdue").reduce((s,i)=>s+i.amount+i.tax,0)), c:"#dc2626" },
        ].map(s=><div key={s.label} style={{ background:"#fff", borderRadius:12, padding:16, borderLeft:`4px solid ${s.c}`, boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", marginBottom:4 }}>{s.label}</div>
          <div style={{ fontSize:20, fontWeight:900, color:s.c }}>{s.val}</div>
        </div>)}
      </div>

      <SearchFilterBar search={search} setSearch={setSearch} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo}
        filters={["Paid","Pending","Overdue","Draft"]} activeFilter={activeFilter} setActiveFilter={setActiveFilter}/>

      <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ background:"#f8fafc" }}>
            {["Invoice No","Client","Services","Date","Due Date","Amount","GST (18%)","Total","Status",""].map(h=>(
              <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:11, fontWeight:800, color:"#6b7280", textTransform:"uppercase", borderBottom:"1px solid #f3f4f6" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(i => (
              <tr key={i.id} style={{ borderBottom:"1px solid #f9fafb" }}
                onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                <td style={{ padding:"12px 14px", fontFamily:"monospace", fontSize:13, fontWeight:700, color:"#2563eb" }}>{i.no}</td>
                <td style={{ padding:"12px 14px", fontSize:13, fontWeight:600 }}>{i.client}</td>
                <td style={{ padding:"12px 14px", fontSize:12, color:"#6b7280", maxWidth:150 }}>{i.services}</td>
                <td style={{ padding:"12px 14px", fontSize:12, color:"#6b7280" }}>{i.date}</td>
                <td style={{ padding:"12px 14px", fontSize:12, color: new Date(i.due)<new Date()&&i.status!=="Paid"?"#dc2626":"#6b7280", fontWeight: new Date(i.due)<new Date()&&i.status!=="Paid"?700:400 }}>{i.due}</td>
                <td style={{ padding:"12px 14px", fontSize:13, fontWeight:700 }}>{fmt(i.amount)}</td>
                <td style={{ padding:"12px 14px", fontSize:13, color:"#6b7280" }}>{fmt(i.tax)}</td>
                <td style={{ padding:"12px 14px", fontSize:13, fontWeight:900, color:"#111827" }}>{fmt(i.amount+i.tax)}</td>
                <td style={{ padding:"12px 14px" }}><Badge label={i.status} color={statusColor[i.status]}/></td>
                <td style={{ padding:"12px 14px" }}>
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={()=>setViewInv(i)} title="View Invoice" style={{ padding:"4px 7px", background:"#f5f3ff", border:"none", borderRadius:6, cursor:"pointer", color:"#7c3aed", display:"flex" }}><Icon name="eye" size={12}/></button>
                    <button onClick={()=>openEdit(i)} title="Edit" style={{ padding:"4px 7px", background:"#eff6ff", border:"none", borderRadius:6, cursor:"pointer", color:"#2563eb", display:"flex" }}><Icon name="edit" size={12}/></button>
                    <button onClick={()=>del(i.id)} title="Delete" style={{ padding:"4px 7px", background:"#fee2e2", border:"none", borderRadius:6, cursor:"pointer", color:"#dc2626", display:"flex" }}><Icon name="trash" size={12}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0 && <tr><td colSpan={10} style={{ padding:40, textAlign:"center", color:"#9ca3af" }}>No invoices found</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={()=>{setModal(false);setEditInv(null);}} title={editInv?"Edit Invoice":"Create New Invoice"}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Field label="Invoice No."><Input value={form.no} onChange={e=>setForm({...form,no:e.target.value})}/></Field>
          <Field label="Status"><Select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
            <option>Draft</option><option>Pending</option><option>Paid</option>
          </Select></Field>
          <div style={{ gridColumn:"1/-1" }}><Field label="Client Name" required><Input value={form.client} onChange={e=>setForm({...form,client:e.target.value})} placeholder="Client name"/></Field></div>
          <div style={{ gridColumn:"1/-1" }}><Field label="Services"><Input value={form.services} onChange={e=>setForm({...form,services:e.target.value})} placeholder="Description of services"/></Field></div>
          <Field label="Invoice Date"><DatePicker value={form.date} onChange={v=>setForm({...form,date:v})}/></Field>
          <Field label="Due Date"><DatePicker value={form.due} onChange={v=>setForm({...form,due:v})}/></Field>
          <Field label="Amount (₹)" required><Input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value, tax:String(Math.round(Number(e.target.value)*0.18))})} placeholder="Professional fees"/></Field>
          <Field label="GST/Tax (₹)"><Input type="number" value={form.tax} onChange={e=>setForm({...form,tax:e.target.value})} placeholder="18% GST auto-calculated"/></Field>
        </div>
        {form.amount && <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8, padding:14, marginTop:4, fontSize:13 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{color:"#6b7280"}}>Professional Fees:</span><strong>₹{Number(form.amount||0).toLocaleString("en-IN")}</strong></div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{color:"#6b7280"}}>GST @18%:</span><strong>₹{Number(form.tax||0).toLocaleString("en-IN")}</strong></div>
          <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, borderTop:"1px solid #bfdbfe" }}><strong>Invoice Total:</strong><strong style={{fontSize:16,color:"#2563eb"}}>₹{(Number(form.amount||0)+Number(form.tax||0)).toLocaleString("en-IN")}</strong></div>
        </div>}
        <DynamicFieldsEditor fields={customFields} setFields={setCustomFields} prefix="billing"/>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
          <button onClick={()=>{setModal(false);setEditInv(null);}} style={{ padding:"10px 20px", background:"#f3f4f6", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 }}>Cancel</button>
          <button onClick={save} style={{ padding:"10px 20px", background:"#dc2626", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700 }}>{editInv?"Update Invoice":"Create Invoice"}</button>
        </div>
      </Modal>
      {/* Invoice Viewer */}
      {viewInv && <InvoiceViewer inv={viewInv} firm={firm} onClose={()=>setViewInv(null)}/>}
    </div>
  );
}

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
function Documents() {
  const [docs, loading, addDoc, updateDoc, removeDoc] = useTable("documents");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);
  const [modal, setModal] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [form, setForm] = useState({ name:"", client:"", category:"GST", date:"", status:"Draft" });
  const openEditDoc = (d) => { setEditDoc(d); setForm({...d}); setModal(true); };
  const [customFields, setCustomFields] = useState([{ label:"Document Version", type:"text" }]);

  const save = async () => {
    if(!form.name) return;
    const payload = { name:form.name, client:form.client, category:form.category,
      date:form.date||null, status:form.status, size:"—" };
    if(editDoc) await updateDoc(editDoc.id, payload);
    else await addDoc(payload);
    setModal(false); setEditDoc(null);
    setForm({ name:"", client:"", category:"GST", date:"", status:"Draft" });
  };

  const filtered = docs.filter(d => {
    const s = search.toLowerCase();
    const match = !s || d.name.toLowerCase().includes(s) || d.client?.toLowerCase().includes(s);
    const cf = !activeFilter || d.category===activeFilter;
    const from = dateFrom ? d.date >= dateFrom : true;
    const to = dateTo ? d.date <= dateTo : true;
    return match && cf && from && to;
  });

  if(loading) return <Spinner/>;
  const extColor = { pdf:"#dc2626", xlsx:"#059669", docx:"#2563eb", pptx:"#d97706" };
  const ext = name => name.split(".").pop().toLowerCase();

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:900 }}>Documents</h2>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#6b7280" }}>{docs.length} files · All client documents in one place</p>
        </div>
        <button onClick={()=>{setEditDoc(null);setForm({name:"",client:"",category:"GST",date:"",status:"Draft"});setModal(true);}} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:"#7c3aed", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13 }}>
          <Icon name="plus" size={15}/> Upload Doc
        </button>
      </div>
      <SearchFilterBar search={search} setSearch={setSearch} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo}
        filters={["GST","Income Tax","Audit","Financial Statements","ROC"]} activeFilter={activeFilter} setActiveFilter={setActiveFilter}/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
        {filtered.map(d => (
          <div key={d.id} style={{ background:"#fff", borderRadius:12, padding:16, boxShadow:"0 2px 8px rgba(0,0,0,0.05)", border:"1px solid #f3f4f6" }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ width:42, height:42, borderRadius:10, background: extColor[ext(d.name)]||"#6b7280", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:11, flexShrink:0 }}>
                {ext(d.name).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={d.name}>{d.name}</div>
                <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>{d.client}</div>
              </div>
            </div>
            <div style={{ marginTop:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", gap:6 }}>
                <Badge label={d.category} color="purple"/>
                <Badge label={d.status} color={d.status==="Final"?"green":d.status==="Draft"?"gray":"yellow"}/>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button style={{ padding:"5px 7px", background:"#f0fdf4", border:"none", borderRadius:6, cursor:"pointer", color:"#059669", display:"flex" }}><Icon name="download" size={13}/></button>
                <button onClick={()=>openEditDoc(d)} style={{ padding:"5px 7px", background:"#eff6ff", border:"none", borderRadius:6, cursor:"pointer", color:"#2563eb", display:"flex" }}><Icon name="edit" size={13}/></button>
                <button onClick={async()=>{ if(window.confirm("Delete document?")) await removeDoc(d.id); }} style={{ padding:"5px 7px", background:"#fee2e2", border:"none", borderRadius:6, cursor:"pointer", color:"#dc2626", display:"flex" }}><Icon name="trash" size={13}/></button>
              </div>
            </div>
            <div style={{ fontSize:11, color:"#9ca3af", marginTop:8 }}>{d.date} · {d.size}</div>
          </div>
        ))}
        {filtered.length===0 && <div style={{ padding:40, textAlign:"center", color:"#9ca3af", background:"#fff", borderRadius:12, gridColumn:"1/-1" }}>No documents found</div>}
      </div>

      <Modal open={modal} onClose={()=>{setModal(false);setEditDoc(null);}} title={editDoc?"Edit Document":"Upload Document"}>
        <Field label="Document Name" required><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. GST Return Q4 – Client.pdf"/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Field label="Client"><Input value={form.client} onChange={e=>setForm({...form,client:e.target.value})} placeholder="Client name"/></Field>
          <Field label="Category"><Select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
            {["GST","Income Tax","Audit","Financial Statements","ROC","TDS","Payroll","Other"].map(c=><option key={c}>{c}</option>)}
          </Select></Field>
          <Field label="Date"><DatePicker value={form.date} onChange={v=>setForm({...form,date:v})}/></Field>
          <Field label="Status"><Select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
            <option>Draft</option><option>Review</option><option>Final</option>
          </Select></Field>
        </div>
        <div style={{ border:"2px dashed #cbd5e1", borderRadius:10, padding:24, textAlign:"center", background:"#f8fafc", marginTop:8 }}>
          <div style={{ color:"#94a3b8", fontSize:13 }}>📎 Click to select file or drag and drop here</div>
          <div style={{ color:"#cbd5e1", fontSize:11, marginTop:4 }}>PDF, XLSX, DOCX supported (demo only)</div>
        </div>
        <DynamicFieldsEditor fields={customFields} setFields={setCustomFields} prefix="doc"/>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
          <button onClick={()=>setModal(false)} style={{ padding:"10px 20px", background:"#f3f4f6", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 }}>Cancel</button>
          <button onClick={save} style={{ padding:"10px 20px", background:"#7c3aed", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700 }}>{editDoc?"Update Document":"Save Document"}</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function Reports() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeReport, setActiveReport] = useState("revenue");

  const revenueData = [
    { month:"Oct", revenue:185000, collection:160000 },
    { month:"Nov", revenue:210000, collection:195000 },
    { month:"Dec", revenue:175000, collection:175000 },
    { month:"Jan", revenue:220000, collection:200000 },
    { month:"Feb", revenue:195000, collection:185000 },
    { month:"Mar", revenue:240000, collection:210000 },
  ];
  const clientStats = [
    { type:"Corporate", count:42, pct:28 },
    { type:"Individual", count:68, pct:46 },
    { type:"Partnership", count:24, pct:16 },
    { type:"LLP", count:14, pct:10 },
  ];
  const serviceStats = [
    { service:"GST Filing", count:56, amount:840000 },
    { service:"IT Returns", count:43, amount:645000 },
    { service:"Audit", count:12, amount:1080000 },
    { service:"TDS Filing", count:38, amount:380000 },
    { service:"ROC Filing", count:8, amount:240000 },
    { service:"Bookkeeping", count:20, amount:400000 },
  ];

  const fmt = n => "₹" + Number(n).toLocaleString("en-IN");
  const maxRev = Math.max(...revenueData.map(d=>d.revenue));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:900 }}>Reports & Analytics</h2>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From"/>
          <span style={{ color:"#9ca3af" }}>–</span>
          <DatePicker value={dateTo} onChange={setDateTo} placeholder="To"/>
          <button style={{ padding:"9px 14px", background:"#2563eb", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
            <Icon name="download" size={13}/> Export
          </button>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {[["revenue","Revenue Trend"],["clients","Client Stats"],["services","Services"]].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveReport(id)}
            style={{ padding:"8px 18px", borderRadius:8, border:"1px solid", fontSize:13, fontWeight:600, cursor:"pointer",
              background: activeReport===id?"#2563eb":"#fff", borderColor: activeReport===id?"#2563eb":"#e5e7eb", color: activeReport===id?"#fff":"#374151" }}>
            {label}
          </button>
        ))}
      </div>

      {activeReport==="revenue" && (
        <div style={{ background:"#fff", borderRadius:14, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin:"0 0 20px", fontSize:15, fontWeight:800 }}>Monthly Revenue vs Collection</h3>
          <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:200 }}>
            {revenueData.map(d => (
              <div key={d.month} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ width:"100%", display:"flex", gap:3, alignItems:"flex-end", height:160 }}>
                  <div style={{ flex:1, background:"#2563eb", borderRadius:"4px 4px 0 0", height:`${(d.revenue/maxRev)*100}%`, transition:"height .3s" }} title={fmt(d.revenue)}/>
                  <div style={{ flex:1, background:"#bfdbfe", borderRadius:"4px 4px 0 0", height:`${(d.collection/maxRev)*100}%`, transition:"height .3s" }} title={fmt(d.collection)}/>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:"#6b7280" }}>{d.month}</div>
                <div style={{ fontSize:10, color:"#9ca3af" }}>{fmt(d.revenue)}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:20, marginTop:16, justifyContent:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12 }}><div style={{ width:12, height:12, background:"#2563eb", borderRadius:3 }}/> Revenue</div>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12 }}><div style={{ width:12, height:12, background:"#bfdbfe", borderRadius:3 }}/> Collection</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginTop:24 }}>
            {[
              { l:"Total Revenue", v:fmt(revenueData.reduce((s,d)=>s+d.revenue,0)), c:"#2563eb" },
              { l:"Total Collected", v:fmt(revenueData.reduce((s,d)=>s+d.collection,0)), c:"#059669" },
              { l:"Outstanding", v:fmt(revenueData.reduce((s,d)=>s+(d.revenue-d.collection),0)), c:"#dc2626" },
            ].map(s=><div key={s.l} style={{ background:"#f8fafc", borderRadius:10, padding:14, textAlign:"center" }}>
              <div style={{ fontSize:11, color:"#9ca3af", fontWeight:700 }}>{s.l}</div>
              <div style={{ fontSize:20, fontWeight:900, color:s.c, marginTop:4 }}>{s.v}</div>
            </div>)}
          </div>
        </div>
      )}

      {activeReport==="clients" && (
        <div style={{ background:"#fff", borderRadius:14, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin:"0 0 20px", fontSize:15, fontWeight:800 }}>Client Distribution</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            <div>
              {clientStats.map(c => (
                <div key={c.type} style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:6 }}>
                    <span style={{ fontWeight:600 }}>{c.type}</span>
                    <span style={{ color:"#6b7280" }}>{c.count} clients ({c.pct}%)</span>
                  </div>
                  <div style={{ height:10, background:"#f3f4f6", borderRadius:5, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${c.pct}%`, background:"#2563eb", borderRadius:5, transition:"width .5s" }}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {clientStats.map((c,i) => {
                const colors = ["#2563eb","#059669","#d97706","#7c3aed"];
                return <div key={c.type} style={{ background:colors[i]+"15", border:`1px solid ${colors[i]}30`, borderRadius:12, padding:16, textAlign:"center" }}>
                  <div style={{ fontSize:28, fontWeight:900, color:colors[i] }}>{c.count}</div>
                  <div style={{ fontSize:12, color:"#6b7280", marginTop:4 }}>{c.type}</div>
                </div>;
              })}
            </div>
          </div>
        </div>
      )}

      {activeReport==="services" && (
        <div style={{ background:"#fff", borderRadius:14, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin:"0 0 20px", fontSize:15, fontWeight:800 }}>Services Revenue Breakdown</h3>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#f8fafc" }}>
              {["Service","No. of Clients","Revenue","Avg per Client","Share"].map(h=>(
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:800, color:"#6b7280", textTransform:"uppercase", borderBottom:"1px solid #f3f4f6" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {serviceStats.map((s, i) => {
                const total = serviceStats.reduce((x,y)=>x+y.amount,0);
                const pct = Math.round(s.amount/total*100);
                return <tr key={s.service} style={{ borderBottom:"1px solid #f9fafb" }}>
                  <td style={{ padding:"12px 14px", fontWeight:700, fontSize:13 }}>{s.service}</td>
                  <td style={{ padding:"12px 14px", fontSize:13, color:"#6b7280" }}>{s.count}</td>
                  <td style={{ padding:"12px 14px", fontSize:13, fontWeight:700, color:"#059669" }}>{fmt(s.amount)}</td>
                  <td style={{ padding:"12px 14px", fontSize:13, color:"#6b7280" }}>{fmt(Math.round(s.amount/s.count))}</td>
                  <td style={{ padding:"12px 14px", width:120 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ flex:1, height:8, background:"#f3f4f6", borderRadius:4, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:"#2563eb", borderRadius:4 }}/>
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:"#374151", minWidth:32 }}>{pct}%</span>
                    </div>
                  </td>
                </tr>;
              })}
            </tbody>
            <tfoot><tr style={{ borderTop:"2px solid #e5e7eb", background:"#f8fafc" }}>
              <td style={{ padding:"12px 14px", fontWeight:800 }}>TOTAL</td>
              <td style={{ padding:"12px 14px", fontWeight:800 }}>{serviceStats.reduce((s,d)=>s+d.count,0)}</td>
              <td style={{ padding:"12px 14px", fontWeight:900, color:"#2563eb", fontSize:15 }}>{fmt(serviceStats.reduce((s,d)=>s+d.amount,0))}</td>
              <td colSpan={2}/>
            </tr></tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── INVOICE VIEWER ──────────────────────────────────────────────────────────
function InvoiceViewer({ inv, firm, onClose }) {
  const fmt = n => (firm?.currency||"₹") + Number(n).toLocaleString("en-IN");
  const f = firm || {};
  const statusColors = { Paid:"#059669", Pending:"#d97706", Overdue:"#dc2626", Draft:"#6b7280" };
  const sc = statusColors[inv.status] || "#6b7280";

  const handlePrint = () => {
    const win = window.open("","_blank","width=900,height=700");
    win.document.write(`<html><head><title>Invoice ${inv.no}</title>
    <style>
      body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;color:#111;}
      .inv{max-width:800px;margin:30px auto;padding:40px;border:1px solid #e5e7eb;border-radius:12px;}
      .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #1d4ed8;}
      .firm-name{font-size:22px;font-weight:900;color:#1d4ed8;margin:0 0 4px;}
      .firm-sub{font-size:13px;color:#6b7280;margin:0 0 8px;}
      .firm-detail{font-size:12px;color:#374151;line-height:1.7;}
      .inv-title{font-size:32px;font-weight:900;color:#1d4ed8;text-align:right;}
      .inv-meta{text-align:right;font-size:13px;color:#6b7280;margin-top:8px;line-height:1.7;}
      .inv-no{font-size:16px;font-weight:800;color:#111;text-align:right;}
      .status-badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;}
      .bill-to{background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;}
      .bill-to h3{margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;}
      .bill-to .name{font-size:16px;font-weight:800;color:#111;margin:0 0 4px;}
      table{width:100%;border-collapse:collapse;margin-bottom:24px;}
      th{background:#1d4ed8;color:#fff;padding:10px 14px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.04em;}
      td{padding:12px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;}
      .totals{margin-left:auto;width:280px;}
      .tot-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;}
      .tot-row.grand{border-top:2px solid #1d4ed8;padding-top:10px;margin-top:4px;font-size:16px;font-weight:900;color:#1d4ed8;}
      .footer{margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;}
      .bank{margin-top:24px;background:#f8fafc;border-radius:8px;padding:16px;}
      .bank h3{margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;}
      .bank-row{display:flex;gap:40px;font-size:13px;}
      @media print{body{margin:0;}.inv{border:none;margin:0;padding:20px;}}
    </style></head><body>
    <div class="inv">
      <div class="hdr">
        <div>
          <div class="firm-name">${f.name||"Your Firm"}</div>
          <div class="firm-sub">${f.suffix||""}</div>
          <div class="firm-detail">
            ${f.address||""}, ${f.city||""}<br/>
            ${f.state||""} – ${f.pin||""}<br/>
            📞 ${f.phone||""} &nbsp;|&nbsp; 📱 ${f.mobile||""}<br/>
            ✉ ${f.email||""}<br/>
            PAN: ${f.pan||""} &nbsp;|&nbsp; GSTIN: ${f.gstin||""}
          </div>
        </div>
        <div>
          <div class="inv-title">INVOICE</div>
          <div class="inv-no">${inv.no}</div>
          <div class="inv-meta">
            Date: ${inv.date}<br/>
            Due: ${inv.due}<br/>
            <span class="status-badge" style="background:${sc}20;color:${sc}">${inv.status}</span>
          </div>
        </div>
      </div>

      <div class="bill-to">
        <h3>Bill To</h3>
        <div class="name">${inv.client}</div>
      </div>

      <table>
        <thead><tr><th>#</th><th>Description of Services</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>${inv.services||"Professional Services"}</td><td style="text-align:right;font-weight:700">${fmt(inv.amount)}</td></tr>
        </tbody>
      </table>

      <div class="totals">
        <div class="tot-row"><span>Sub Total:</span><span>${fmt(inv.amount)}</span></div>
        <div class="tot-row"><span>GST @ ${f.taxRate||18}%:</span><span>${fmt(inv.tax)}</span></div>
        <div class="tot-row grand"><span>Total Due:</span><span>${fmt(inv.amount+inv.tax)}</span></div>
      </div>

      ${f.bankName ? `<div class="bank">
        <h3>Bank Details for Payment</h3>
        <div class="bank-row">
          <div><strong>Bank:</strong> ${f.bankName}</div>
          <div><strong>A/C No:</strong> ${f.bankAccount}</div>
          <div><strong>IFSC:</strong> ${f.bankIFSC}</div>
          <div><strong>Branch:</strong> ${f.bankBranch}</div>
        </div>
      </div>` : ""}

      <div class="footer">
        <p>${f.invoiceFooter||"Thank you for your business."}</p>
        <p>Membership No: ${f.membershipNo||""} &nbsp;|&nbsp; Firm Reg No: ${f.regNo||""}</p>
      </div>
    </div>
    <script>window.print();window.onafterprint=()=>window.close();</script>
    </body></html>`);
    win.document.close();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:780, maxHeight:"92vh", overflow:"auto",
        boxShadow:"0 30px 100px rgba(0,0,0,0.3)" }}>
        {/* Toolbar */}
        <div className="no-print" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 24px",
          borderBottom:"1px solid #f3f4f6", position:"sticky", top:0, background:"#fff", zIndex:1 }}>
          <div style={{ fontWeight:800, fontSize:15 }}>Invoice Preview — {inv.no}</div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={handlePrint}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 18px", background:"#2563eb", color:"#fff",
                border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>
              🖨️ Print / Save PDF
            </button>
            <button onClick={onClose}
              style={{ padding:"9px 14px", background:"#f3f4f6", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 }}>
              Close
            </button>
          </div>
        </div>

        {/* Invoice body */}
        <div id="invoice-print-area" style={{ padding:"32px 40px", fontFamily:"'DM Sans', sans-serif" }}>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:32, paddingBottom:24, borderBottom:"3px solid #1d4ed8" }}>
            <div>
              <div style={{ fontSize:24, fontWeight:900, color:"#1d4ed8", marginBottom:2 }}>{f.name||"Your Firm"}</div>
              <div style={{ fontSize:13, color:"#6b7280", marginBottom:8 }}>{f.suffix}</div>
              <div style={{ fontSize:12, color:"#374151", lineHeight:1.8 }}>
                {f.address}, {f.city}<br/>
                {f.state} – {f.pin}<br/>
                📞 {f.phone} &nbsp;|&nbsp; 📱 {f.mobile}<br/>
                ✉ {f.email}<br/>
                <span style={{ fontFamily:"monospace" }}>PAN: {f.pan} &nbsp;|&nbsp; GSTIN: {f.gstin}</span>
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:36, fontWeight:900, color:"#1d4ed8", letterSpacing:"-1px" }}>INVOICE</div>
              <div style={{ fontSize:18, fontWeight:800, color:"#111", marginTop:4 }}>{inv.no}</div>
              <div style={{ fontSize:12, color:"#6b7280", marginTop:8, lineHeight:1.8 }}>
                <div>Invoice Date: <strong style={{color:"#111"}}>{inv.date}</strong></div>
                <div>Due Date: <strong style={{color: inv.status==="Overdue"?"#dc2626":"#111"}}>{inv.due}</strong></div>
              </div>
              <div style={{ marginTop:10 }}>
                <span style={{ background:sc+"20", color:sc, borderRadius:20, padding:"4px 14px", fontSize:12, fontWeight:800 }}>{inv.status}</span>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div style={{ background:"#f8fafc", borderRadius:10, padding:16, marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".05em", marginBottom:6 }}>Bill To</div>
            <div style={{ fontSize:18, fontWeight:900, color:"#111" }}>{inv.client}</div>
          </div>

          {/* Services table */}
          <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:24 }}>
            <thead>
              <tr style={{ background:"#1d4ed8", color:"#fff" }}>
                {["#","Description of Services","Amount"].map((h,i)=>(
                  <th key={h} style={{ padding:"11px 14px", textAlign:i===2?"right":"left", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:".04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom:"1px solid #f3f4f6" }}>
                <td style={{ padding:"14px", fontSize:13, color:"#6b7280" }}>1</td>
                <td style={{ padding:"14px", fontSize:13 }}>{inv.services || "Professional Services"}</td>
                <td style={{ padding:"14px", fontSize:14, fontWeight:700, textAlign:"right" }}>{fmt(inv.amount)}</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:32 }}>
            <div style={{ width:280 }}>
              {[
                ["Sub Total", fmt(inv.amount), false],
                [`GST @ ${f.taxRate||18}%`, fmt(inv.tax), false],
                ["Total Due", fmt(inv.amount+inv.tax), true],
              ].map(([l,v,big])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:big?"12px 0 0":"7px 0",
                  borderTop:big?"2px solid #1d4ed8":"none", marginTop:big?6:0,
                  fontSize:big?16:13, fontWeight:big?900:500, color:big?"#1d4ed8":"#374151" }}>
                  <span>{l}</span><span>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bank details */}
          {(f.banks||[]).filter(b=>b.type!=="Cash"&&b.accountNo).length > 0 && (
            <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:10, padding:16, marginBottom:24 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#0369a1", textTransform:"uppercase", letterSpacing:".05em", marginBottom:12 }}>Bank Details for Payment</div>
              {[...(f.banks||[])].sort((a,b)=>b.primary-a.primary).filter(b=>b.type!=="Cash"&&b.accountNo).map(b=>(
                <div key={b.id} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 20px", fontSize:13,
                  marginBottom:10, paddingBottom:10, borderBottom:"1px solid #e0f2fe" }}>
                  <div style={{ gridColumn:"1/-1", display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontWeight:800, color:"#0c4a6e", fontSize:14 }}>🏦 {b.label}</span>
                    {b.primary && <span style={{ background:"#dcfce7", color:"#15803d", borderRadius:4, padding:"1px 7px", fontSize:11, fontWeight:700 }}>Primary</span>}
                  </div>
                  <div><span style={{color:"#6b7280"}}>Bank: </span><strong>{b.bankName}</strong></div>
                  <div><span style={{color:"#6b7280"}}>Branch: </span><strong>{b.branch}</strong></div>
                  <div><span style={{color:"#6b7280"}}>A/C No: </span><strong style={{fontFamily:"monospace"}}>{b.accountNo}</strong></div>
                  <div><span style={{color:"#6b7280"}}>IFSC: </span><strong style={{fontFamily:"monospace"}}>{b.ifsc}</strong></div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop:"1px solid #e5e7eb", paddingTop:16, textAlign:"center", fontSize:12, color:"#9ca3af" }}>
            <div style={{ marginBottom:4 }}>{f.invoiceFooter || "Thank you for your business."}</div>
            {(f.membershipNo||f.regNo) && <div>Membership No: {f.membershipNo} &nbsp;|&nbsp; Firm Reg No: {f.regNo}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FIRM SETUP ───────────────────────────────────────────────────────────────
function FirmSetup({ firm, setFirm, loading }) {
  const [form, setForm] = useState({...firm, banks: firm.banks ? [...firm.banks] : []});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bankModal, setBankModal] = useState(false);
  const [editBank, setEditBank] = useState(null);
  const [bankForm, setBankForm] = useState({ label:"", bankName:"", accountNo:"", ifsc:"", branch:"", type:"Current", primary:false });

  // Sync form when firm loads from DB
  useEffect(() => { setForm({...firm, banks: firm.banks ? [...firm.banks] : []}); }, [firm]);

  const save = async () => {
    setSaving(true);
    await setFirm({...form});
    setSaving(false);
    setSaved(true);
    setTimeout(()=>setSaved(false), 2500);
  };

  const Section = ({ title, children }) => (
    <div style={{ background:"#fff", borderRadius:14, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", marginBottom:16 }}>
      <div style={{ fontSize:13, fontWeight:800, color:"#1d4ed8", textTransform:"uppercase", letterSpacing:".05em", marginBottom:18,
        paddingBottom:12, borderBottom:"2px solid #eff6ff" }}>{title}</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>{children}</div>
    </div>
  );
  const SF = ({ label, fkey, full, placeholder }) => (
    <div style={{ gridColumn: full?"1/-1":"auto" }}>
      <Field label={label}>
        <Input value={form[fkey]||""} onChange={e=>setForm({...form,[fkey]:e.target.value})} placeholder={placeholder||label}/>
      </Field>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:900 }}>Firm Setup</h2>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#6b7280" }}>Configure your firm details — used on invoices, headers & reports</p>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {saved && <span style={{ color:"#059669", fontWeight:700, fontSize:13 }}>✓ Saved successfully!</span>}
          <button onClick={save} disabled={saving} style={{ padding:"10px 24px", background:saving?"#93c5fd":"#2563eb", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:14 }}>
            {saving?"Saving…":"Save Settings"}
          </button>
        </div>
      </div>

      <Section title="🏢 Firm Identity">
        <SF label="Firm Name" fkey="name" full placeholder="e.g. Sharma & Associates"/>
        <SF label="Designation / Suffix" fkey="suffix" full placeholder="e.g. Chartered Accountants"/>
        <SF label="PAN" fkey="pan" placeholder="AABCS1234D"/>
        <SF label="GSTIN" fkey="gstin" placeholder="27AABCS1234D1Z5"/>
        <SF label="Membership No." fkey="membershipNo" placeholder="ICAI Membership No"/>
        <SF label="Firm Reg No." fkey="regNo" placeholder="e.g. W-1234"/>
      </Section>

      <Section title="📍 Contact & Address">
        <SF label="Street Address" fkey="address" full placeholder="Building, Street"/>
        <SF label="City" fkey="city" placeholder="Mumbai"/>
        <SF label="State" fkey="state" placeholder="Maharashtra"/>
        <SF label="PIN Code" fkey="pin" placeholder="400001"/>
        <SF label="Office Phone" fkey="phone" placeholder="022-XXXXXXXX"/>
        <SF label="Mobile" fkey="mobile" placeholder="9XXXXXXXXX"/>
        <SF label="Email" fkey="email" placeholder="info@yourfirm.com"/>
        <SF label="Website" fkey="website" placeholder="www.yourfirm.com"/>
      </Section>

      {/* ── BANK ACCOUNTS MANAGER ── */}
      <div style={{ background:"#fff", borderRadius:14, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:800, color:"#1d4ed8", textTransform:"uppercase", letterSpacing:".05em",
          marginBottom:18, paddingBottom:12, borderBottom:"2px solid #eff6ff", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span>🏦 Bank Accounts & Cash Accounts</span>
          <button onClick={()=>{ setBankForm({label:"",bankName:"",accountNo:"",ifsc:"",branch:"",type:"Current",primary:false}); setEditBank(null); setBankModal(true); }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", background:"#2563eb", color:"#fff",
              border:"none", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700 }}>
            <Icon name="plus" size={13}/> Add Account
          </button>
        </div>

        {/* Bank list */}
        {(form.banks||[]).length === 0 && (
          <div style={{ textAlign:"center", color:"#9ca3af", padding:"24px 0", fontSize:13 }}>No bank accounts added yet</div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {(form.banks||[]).map(b => (
            <div key={b.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
              background: b.primary?"#eff6ff":"#f8fafc", borderRadius:10,
              border:`1px solid ${b.primary?"#bfdbfe":"#e5e7eb"}` }}>
              {/* Icon */}
              <div style={{ width:38, height:38, borderRadius:10, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
                background: b.type==="Cash"?"#fef9c3":b.type==="OD"?"#fef2f2":"#eff6ff" }}>
                {b.type==="Cash"?"💵":b.type==="OD"?"🔄":"🏦"}
              </div>
              {/* Details */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontWeight:800, fontSize:14, color:"#111" }}>{b.label}</span>
                  <span style={{ background:"#e0f2fe", color:"#0369a1", borderRadius:4, padding:"1px 7px", fontSize:11, fontWeight:700 }}>{b.type}</span>
                  {b.primary && <span style={{ background:"#dcfce7", color:"#15803d", borderRadius:4, padding:"1px 7px", fontSize:11, fontWeight:700 }}>Primary</span>}
                </div>
                <div style={{ fontSize:12, color:"#6b7280", marginTop:3 }}>
                  {b.bankName}{b.accountNo ? ` · A/C: ${b.accountNo}` : ""}{b.ifsc ? ` · IFSC: ${b.ifsc}` : ""}{b.branch ? ` · ${b.branch}` : ""}
                </div>
              </div>
              {/* Actions */}
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                {!b.primary && (
                  <button onClick={()=>{ setForm(f=>({...f, banks:f.banks.map(x=>({...x, primary:x.id===b.id}))})); }}
                    title="Set as Primary" style={{ padding:"5px 10px", background:"#f0fdf4", border:"1px solid #bbf7d0",
                      borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:700, color:"#15803d" }}>★ Primary</button>
                )}
                <button onClick={()=>{ setEditBank(b); setBankForm({...b}); setBankModal(true); }}
                  style={{ padding:"5px 8px", background:"#eff6ff", border:"none", borderRadius:6, cursor:"pointer", color:"#2563eb", display:"flex" }}>
                  <Icon name="edit" size={13}/>
                </button>
                <button onClick={()=>{ if(window.confirm("Delete this account?")) setForm(f=>({...f, banks:f.banks.filter(x=>x.id!==b.id)})); }}
                  style={{ padding:"5px 8px", background:"#fee2e2", border:"none", borderRadius:6, cursor:"pointer", color:"#dc2626", display:"flex" }}>
                  <Icon name="trash" size={13}/>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:12, fontSize:12, color:"#9ca3af" }}>
          💡 These accounts appear in Cash Management dropdowns and on invoices. Mark one as Primary for invoices.
        </div>
      </div>

      {/* Bank Modal */}
      <Modal open={bankModal} onClose={()=>setBankModal(false)} title={editBank?"Edit Account":"Add Bank / Cash Account"} width={500}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div style={{ gridColumn:"1/-1" }}>
            <Field label="Display Label (used in dropdowns)" required>
              <Input value={bankForm.label} onChange={e=>setBankForm({...bankForm,label:e.target.value})} placeholder="e.g. HDFC Current, Petty Cash"/>
            </Field>
          </div>
          <Field label="Account Type">
            <Select value={bankForm.type} onChange={e=>setBankForm({...bankForm,type:e.target.value})}>
              {["Current","Savings","OD","FD","Cash","Other"].map(t=><option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Bank Name">
            <Input value={bankForm.bankName} onChange={e=>setBankForm({...bankForm,bankName:e.target.value})} placeholder="e.g. HDFC Bank"/>
          </Field>
          <Field label="Account Number">
            <Input value={bankForm.accountNo} onChange={e=>setBankForm({...bankForm,accountNo:e.target.value})} placeholder="Account number"/>
          </Field>
          <Field label="IFSC Code">
            <Input value={bankForm.ifsc} onChange={e=>setBankForm({...bankForm,ifsc:e.target.value.toUpperCase()})} placeholder="HDFC0001234"/>
          </Field>
          <div style={{ gridColumn:"1/-1" }}>
            <Field label="Branch">
              <Input value={bankForm.branch} onChange={e=>setBankForm({...bankForm,branch:e.target.value})} placeholder="Branch name & city"/>
            </Field>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", userSelect:"none" }}>
              <input type="checkbox" checked={!!bankForm.primary} onChange={e=>setBankForm({...bankForm,primary:e.target.checked})}
                style={{ width:16, height:16, accentColor:"#2563eb" }}/>
              <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Set as Primary account (shown first on invoices)</span>
            </label>
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
          <button onClick={()=>setBankModal(false)} style={{ padding:"10px 20px", background:"#f3f4f6", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 }}>Cancel</button>
          <button onClick={()=>{
            if(!bankForm.label.trim()) return;
            if(editBank) {
              setForm(f=>({...f, banks:f.banks.map(b=>b.id===editBank.id?{...b,...bankForm}:b)}));
            } else {
              const newId = Date.now();
              setForm(f=>({...f, banks:[...(f.banks||[]), {...bankForm, id:newId}]}));
            }
            setBankModal(false); setEditBank(null);
          }} style={{ padding:"10px 20px", background:"#2563eb", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700 }}>
            {editBank?"Update Account":"Add Account"}
          </button>
        </div>
      </Modal>

      <Section title="🧾 Invoice Settings">
        <SF label="Invoice Prefix" fkey="invoicePrefix" placeholder="INV"/>
        <SF label="Tax Rate (%)" fkey="taxRate" placeholder="18"/>
        <SF label="Currency Symbol" fkey="currency" placeholder="₹"/>
        <div style={{ gridColumn:"1/-1" }}>
          <Field label="Invoice Footer Note">
            <textarea value={form.invoiceFooter||""} onChange={e=>setForm({...form,invoiceFooter:e.target.value})}
              placeholder="e.g. Thank you for your business. Payment due within 30 days."
              rows={3} style={{ width:"100%", padding:"9px 12px", border:"1px solid #d1d5db", borderRadius:8, fontSize:13,
                outline:"none", boxSizing:"border-box", fontFamily:"inherit", resize:"vertical" }}/>
          </Field>
        </div>
      </Section>

      {/* Live Preview */}
      <div style={{ background:"#fff", borderRadius:14, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:800, color:"#1d4ed8", textTransform:"uppercase", letterSpacing:".05em", marginBottom:18, paddingBottom:12, borderBottom:"2px solid #eff6ff" }}>
          👁 Sidebar Preview
        </div>
        <div style={{ background:"#0f172a", borderRadius:12, padding:20, display:"flex", alignItems:"center", gap:12, maxWidth:280 }}>
          <div style={{ width:36, height:36, background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontWeight:900, fontSize:14, color:"#fff" }}>CA</div>
          <div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:12 }}>{form.name||"Firm Name"}</div>
            <div style={{ color:"#94a3b8", fontSize:10, marginTop:2 }}>{form.suffix||"Suffix"}</div>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button onClick={save} disabled={saving} style={{ padding:"12px 32px", background:saving?"#93c5fd":"#2563eb", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontWeight:800, fontSize:15 }}>
          {saving?"💾 Saving…":"💾 Save All Settings"}
        </button>
      </div>
    </div>
  );
}
