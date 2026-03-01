import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import NotificationsPanel from "./NotificationsPanel";
import PaywallScreen from "./PaywallScreen";

// ── Brand ─────────────────────────────────────────────────────────────────────
const BRAND = {
  green:      "#4CC96A",
  greenLight: "#E8F9EE",
  greenDark:  "#39B357",
  navy:       "#1E2A3A",
  navyLight:  "#2D3F52",
  bg:         "#F4FBF6",
  surface:    "#FFFFFF",
  border:     "#D8EFE0",
  muted:      "#7A9A85",
};

const CATEGORIES = {
  food:         { label: "Food & Drinks",  icon: "🥛", color: "#E8A838" },
  pet:          { label: "Pet Care",       icon: "🐾", color: "#4CC96A" },
  home:         { label: "Home",           icon: "🏠", color: "#5B8FD4" },
  health:       { label: "Health",         icon: "💊", color: "#D45B6A" },
  subscription: { label: "Subscriptions",  icon: "💳", color: "#9B6BD4" },
  task:         { label: "Tasks",          icon: "✓",  color: "#1E2A3A" },
};

const RECURRENCE_OPTIONS = [
  { label: "No recurrence",  value: null },
  { label: "Every week",     value: 7   },
  { label: "Every 2 weeks",  value: 14  },
  { label: "Every month",    value: 30  },
  { label: "Every 2 months", value: 60  },
  { label: "Every 3 months", value: 90  },
  { label: "Every 6 months", value: 180 },
  { label: "Every year",     value: 365 },
];

const urgencyColor = {
  overdue:  "#D45B6A",
  today:    "#E8A838",
  soon:     "#E8A838",
  upcoming: "#5B8FD4",
  ok:       "#4CC96A",
};

function getDaysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.round((target - today) / (1000*60*60*24));
}
function getUrgencyLevel(days) {
  if (days < 0)   return "overdue";
  if (days === 0) return "today";
  if (days <= 3)  return "soon";
  if (days <= 7)  return "upcoming";
  return "ok";
}
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}
function todayStr() { return new Date().toISOString().split("T")[0]; }
function addDays(dateStr, days) {
  const d = new Date(dateStr); d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ── Shared form ────────────────────────────────────────────────────────────────
function FormFields({ form, setForm }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div>
        <label style={{ fontSize:12, fontWeight:600, color:BRAND.muted, letterSpacing:0.5, textTransform:"uppercase", display:"block", marginBottom:8 }}>Name</label>
        <input className="input-field" placeholder="e.g. Clean cat litter" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} autoFocus />
      </div>
      <div>
        <label style={{ fontSize:12, fontWeight:600, color:BRAND.muted, letterSpacing:0.5, textTransform:"uppercase", display:"block", marginBottom:8 }}>Category</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {Object.entries(CATEGORIES).map(([key,cat]) => (
            <div key={key} className="cat-chip" onClick={() => setForm(f=>({...f,category:key}))}
              style={{ background:form.category===key?BRAND.navy:"#fff", color:form.category===key?"#fff":BRAND.navy, border:`1.5px solid ${form.category===key?BRAND.navy:BRAND.border}` }}>
              {cat.icon} {cat.label}
            </div>
          ))}
        </div>
      </div>
      <div>
        <label style={{ fontSize:12, fontWeight:600, color:BRAND.muted, letterSpacing:0.5, textTransform:"uppercase", display:"block", marginBottom:8 }}>Expires / Due date</label>
        <input type="date" className="input-field" value={form.expiryDate} onChange={e => setForm(f=>({...f,expiryDate:e.target.value}))} />
      </div>
      <div>
        <label style={{ fontSize:12, fontWeight:600, color:BRAND.muted, letterSpacing:0.5, textTransform:"uppercase", display:"block", marginBottom:8 }}>Recurrence</label>
        <select className="input-field" value={form.recurrence??""} onChange={e => setForm(f=>({...f,recurrence:e.target.value?Number(e.target.value):null}))}>
          {RECURRENCE_OPTIONS.map(o => <option key={o.label} value={o.value??""}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize:12, fontWeight:600, color:BRAND.muted, letterSpacing:0.5, textTransform:"uppercase", display:"block", marginBottom:8 }}>Notes (optional)</label>
        <textarea className="input-field" placeholder="Any details..." value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} rows={3} style={{ resize:"none" }} />
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function App({ user, onSignOut }) {
  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [view, setView]                 = useState("home");
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterCat, setFilterCat]       = useState("all");
  const [form, setForm]                 = useState({ name:"", category:"home", expiryDate:addDays(todayStr(),7), recurrence:null, notes:"" });
  const [sortedItems, setSortedItems]   = useState([]);
  const [editMode, setEditMode]         = useState(false);
  const [showNotif, setShowNotif]       = useState(false);
  const [showPaywall, setShowPaywall]   = useState(false);
  const [isPro, setIsPro]               = useState(false);
  const FREE_LIMIT = 5;
  const [saving, setSaving]             = useState(false);
  const [installPrompt, setInstallPrompt]         = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setShowInstallBanner(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Load items from Supabase on mount
  useEffect(() => { fetchItems(); checkProStatus(); }, []);

  async function checkProStatus() {
    const { data } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .single();
    if (data) setIsPro(data.is_pro || false);
  }

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("expiry_date", { ascending: true });
    if (!error && data) {
      // Map snake_case DB columns to camelCase
      setItems(data.map(dbToItem));
    }
    setLoading(false);
  }

  // Convert DB row → app item
  function dbToItem(row) {
    return {
      id:          row.id,
      name:        row.name,
      category:    row.category,
      expiryDate:  row.expiry_date,
      recurrence:  row.recurrence_days,
      notes:       row.notes || "",
    };
  }

  // Convert app item → DB row
  function itemToDb(item) {
    return {
      user_id:         user.id,
      name:            item.name,
      category:        item.category,
      expiry_date:     item.expiryDate,
      recurrence_days: item.recurrence,
      notes:           item.notes || "",
    };
  }

  useEffect(() => {
    const filtered = filterCat === "all" ? items : items.filter(i => i.category === filterCat);
    setSortedItems([...filtered].sort((a,b) => getDaysUntil(a.expiryDate) - getDaysUntil(b.expiryDate)));
  }, [items, filterCat]);

  const overdueCount = items.filter(i => getDaysUntil(i.expiryDate) < 0).length;
  const soonCount    = items.filter(i => { const d=getDaysUntil(i.expiryDate); return d>=0&&d<=3; }).length;

  async function addItem() {
    if (!form.name.trim()) return;
    if (!isPro && items.length >= FREE_LIMIT) { setView("home"); setShowPaywall(true); return; }
    setSaving(true);
    const { data, error } = await supabase
      .from("items")
      .insert([itemToDb(form)])
      .select()
      .single();
    if (!error && data) {
      setItems(prev => [...prev, dbToItem(data)]);
      setForm({ name:"", category:"home", expiryDate:addDays(todayStr(),7), recurrence:null, notes:"" });
      setView("home");
    }
    setSaving(false);
  }

  async function updateItem() {
    setSaving(true);
    const { error } = await supabase
      .from("items")
      .update(itemToDb(form))
      .eq("id", selectedItem.id);
    if (!error) {
      const updated = { ...form, id: selectedItem.id };
      setItems(prev => prev.map(i => i.id === selectedItem.id ? updated : i));
      setSelectedItem(updated);
      setEditMode(false);
    }
    setSaving(false);
  }

  async function deleteItem(id) {
    await supabase.from("items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    setView("home");
  }

  async function completeItem(item) {
    if (item.recurrence) {
      const newDate = addDays(todayStr(), item.recurrence);
      const { error } = await supabase
        .from("items")
        .update({ expiry_date: newDate })
        .eq("id", item.id);
      if (!error) {
        setItems(prev => prev.map(i => i.id===item.id ? {...i,expiryDate:newDate} : i));
        if (selectedItem?.id === item.id) setSelectedItem(prev=>({...prev,expiryDate:newDate}));
      }
    } else {
      await deleteItem(item.id);
    }
  }

  function openDetail(item) {
    setSelectedItem(item);
    setForm({ name:item.name, category:item.category, expiryDate:item.expiryDate, recurrence:item.recurrence, notes:item.notes });
    setEditMode(false); setView("detail");
  }
  function openAdd() {
    setForm({ name:"", category:"home", expiryDate:addDays(todayStr(),7), recurrence:null, notes:"" });
    setView("add");
  }
  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome==="accepted") setShowInstallBanner(false);
  }

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif", background:BRAND.bg, minHeight:"100vh", maxWidth:430, margin:"0 auto", position:"relative", paddingBottom:80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:${BRAND.bg}; }
        input,select,textarea { font-family:'DM Sans',sans-serif; }
        .item-row { transition:background 0.15s; cursor:pointer; }
        .item-row:hover { background:${BRAND.greenLight} !important; }
        .btn-green { background:${BRAND.green}; color:${BRAND.navy}; border:none; border-radius:12px; padding:14px 24px; font-size:15px; font-family:'DM Sans',sans-serif; font-weight:700; cursor:pointer; width:100%; transition:opacity 0.15s; }
        .btn-green:hover { opacity:0.88; }
        .btn-green:disabled { opacity:0.5; cursor:not-allowed; }
        .btn-ghost { background:transparent; border:1.5px solid ${BRAND.border}; border-radius:12px; padding:13px 24px; font-size:15px; font-family:'DM Sans',sans-serif; font-weight:500; cursor:pointer; width:100%; transition:background 0.15s; color:${BRAND.navy}; }
        .btn-ghost:hover { background:${BRAND.greenLight}; }
        .input-field { width:100%; border:1.5px solid ${BRAND.border}; border-radius:12px; padding:13px 14px; font-size:15px; background:#fff; color:${BRAND.navy}; outline:none; transition:border 0.15s; }
        .input-field:focus { border-color:${BRAND.green}; }
        .cat-chip { display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:20px; font-size:13px; font-weight:500; cursor:pointer; border:1.5px solid transparent; transition:all 0.15s; white-space:nowrap; }
        .slide-in { animation:slideIn 0.2s ease; }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { display:none; }
      `}</style>

      {/* Install banner */}
      {showInstallBanner && (
        <div style={{ background:BRAND.navy, color:"#fff", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <div style={{ fontSize:13 }}>📲 Install <strong>Cue</strong> on your phone</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={handleInstall} style={{ background:BRAND.green, color:BRAND.navy, border:"none", borderRadius:6, padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer" }}>Install</button>
            <button onClick={()=>setShowInstallBanner(false)} style={{ background:"transparent", color:"#aaa", border:"none", fontSize:20, cursor:"pointer", lineHeight:1 }}>×</button>
          </div>
        </div>
      )}

      {/* ── HOME ──────────────────────────────────────────────────────────── */}
      {view==="home" && (
        <div className="slide-in">
          <div style={{ padding:"52px 24px 20px" }}>
            {/* Logo + sign out */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ background:BRAND.green, color:BRAND.navy, fontWeight:700, fontSize:17, padding:"6px 16px", borderRadius:10 }}>Cue</div>
                <span style={{ fontSize:13, color:BRAND.muted, fontWeight:500 }}>timely reminders</span>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <button onClick={() => setShowNotif(true)} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", padding:"4px" }}>🔔</button>
              <button onClick={onSignOut} style={{ background:"none", border:"none", fontSize:12, color:BRAND.muted, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", padding:"4px 8px" }}>Sign out</button>
            </div>
            </div>

            <div style={{ fontSize:11, fontWeight:500, letterSpacing:2, color:BRAND.muted, textTransform:"uppercase", marginBottom:6 }}>
              {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
            </div>
            <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:30, fontWeight:400, color:BRAND.navy, lineHeight:1.2 }}>
              {loading ? <span style={{ color:BRAND.muted }}>Loading…</span>
               : overdueCount>0 ? <>{overdueCount} item{overdueCount!==1?"s":""} <span style={{ fontStyle:"italic", color:urgencyColor.overdue }}>overdue</span></>
               : soonCount>0    ? <><span style={{ fontStyle:"italic", color:urgencyColor.soon }}>{soonCount} item{soonCount!==1?"s":""}</span> need attention</>
               :                  <>Everything's <span style={{ fontStyle:"italic", color:BRAND.green }}>on track</span></>}
            </h1>
          </div>

          {!loading && (overdueCount>0||soonCount>0) && (
            <div style={{ display:"flex", gap:8, padding:"0 24px 20px", overflowX:"auto" }}>
              {overdueCount>0 && <div style={{ background:"#FDF0EF", border:"1px solid #F0CECE", borderRadius:20, padding:"6px 14px", fontSize:13, color:urgencyColor.overdue, fontWeight:600, whiteSpace:"nowrap" }}>⚠ {overdueCount} overdue</div>}
              {soonCount>0    && <div style={{ background:"#FDF7EF", border:"1px solid #F0E0BE", borderRadius:20, padding:"6px 14px", fontSize:13, color:urgencyColor.soon,    fontWeight:600, whiteSpace:"nowrap" }}>⏰ {soonCount} due soon</div>}
            </div>
          )}

          <div style={{ display:"flex", gap:8, padding:"0 24px 20px", overflowX:"auto" }}>
            {["all",...Object.keys(CATEGORIES)].map(cat => (
              <div key={cat} className="cat-chip" onClick={()=>setFilterCat(cat)}
                style={{ background:filterCat===cat?BRAND.navy:BRAND.surface, color:filterCat===cat?"#fff":BRAND.navy, border:`1.5px solid ${filterCat===cat?BRAND.navy:BRAND.border}` }}>
                {cat==="all"?"All":<>{CATEGORIES[cat].icon} {CATEGORIES[cat].label}</>}
              </div>
            ))}
          </div>

          <div style={{ padding:"0 16px" }}>
            {loading ? (
              <div style={{ textAlign:"center", padding:"60px 24px", color:BRAND.muted }}>
                <div style={{ fontSize:15 }}>Loading your reminders…</div>
              </div>
            ) : sortedItems.length===0 ? (
              <div style={{ textAlign:"center", padding:"60px 24px", color:BRAND.muted }}>
                <div style={{ fontSize:40, marginBottom:12 }}>✓</div>
                <div style={{ fontSize:15 }}>Nothing to track yet</div>
                <div style={{ fontSize:13, marginTop:6 }}>Tap + to add your first reminder</div>
              </div>
            ) : sortedItems.map(item => {
              const days=getDaysUntil(item.expiryDate);
              const urgency=getUrgencyLevel(days);
              const cat=CATEGORIES[item.category];
              return (
                <div key={item.id} className="item-row" onClick={()=>openDetail(item)}
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 12px", borderRadius:14, marginBottom:2, background:"transparent" }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:cat.color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{cat.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:15, fontWeight:500, color:BRAND.navy, marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.name}</div>
                    <div style={{ fontSize:12, color:BRAND.muted }}>{formatDate(item.expiryDate)}{item.recurrence&&<span style={{ marginLeft:6, color:BRAND.border }}>· repeats</span>}</div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, flexShrink:0, color:urgencyColor[urgency], background:urgencyColor[urgency]+"18", padding:"4px 10px", borderRadius:20 }}>
                    {urgency==="overdue"?`${Math.abs(days)}d ago`:urgency==="today"?"Today":`${days}d`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ADD ───────────────────────────────────────────────────────────── */}
      {view==="add" && (
        <div className="slide-in">
          <div style={{ padding:"52px 24px 24px" }}>
            <button onClick={()=>setView("home")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:BRAND.muted, fontFamily:"'DM Sans',sans-serif", padding:0, marginBottom:20 }}>← Back</button>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, fontWeight:400, color:BRAND.navy, marginBottom:28 }}>New reminder</h2>
            <FormFields form={form} setForm={setForm} />
            <div style={{ marginTop:8 }}>
              <button className="btn-green" onClick={addItem} disabled={saving}>{saving?"Saving…":"Add reminder"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL ────────────────────────────────────────────────────────── */}
      {view==="detail" && selectedItem && (
        <div className="slide-in">
          <div style={{ padding:"52px 24px 24px" }}>
            <button onClick={()=>setView("home")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:BRAND.muted, fontFamily:"'DM Sans',sans-serif", padding:0, marginBottom:20 }}>← Back</button>
            {!editMode ? (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <span style={{ fontSize:26 }}>{CATEGORIES[selectedItem.category].icon}</span>
                  <span style={{ fontSize:13, color:BRAND.muted, fontWeight:500 }}>{CATEGORIES[selectedItem.category].label}</span>
                </div>
                <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:30, fontWeight:400, color:BRAND.navy, marginBottom:10, lineHeight:1.2 }}>{selectedItem.name}</h2>
                {(()=>{
                  const days=getDaysUntil(selectedItem.expiryDate);
                  const urgency=getUrgencyLevel(days);
                  return <div style={{ display:"inline-block", background:urgencyColor[urgency]+"18", color:urgencyColor[urgency], fontWeight:600, fontSize:13, padding:"5px 12px", borderRadius:20, marginBottom:28 }}>
                    {urgency==="overdue"?`${Math.abs(days)} day${Math.abs(days)!==1?"s":""} overdue`:urgency==="today"?"Due today":`${days} day${days!==1?"s":""} remaining`}
                  </div>;
                })()}
                <div style={{ background:BRAND.greenLight, borderRadius:16, padding:20, marginBottom:20 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
                    <div>
                      <div style={{ fontSize:11, color:BRAND.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>Due date</div>
                      <div style={{ fontSize:15, fontWeight:600, color:BRAND.navy }}>{formatDate(selectedItem.expiryDate)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:BRAND.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>Recurrence</div>
                      <div style={{ fontSize:15, fontWeight:600, color:BRAND.navy }}>{selectedItem.recurrence?RECURRENCE_OPTIONS.find(o=>o.value===selectedItem.recurrence)?.label||`Every ${selectedItem.recurrence}d`:"None"}</div>
                    </div>
                  </div>
                  {selectedItem.notes&&(
                    <div style={{ marginTop:18, paddingTop:18, borderTop:`1px solid ${BRAND.border}` }}>
                      <div style={{ fontSize:11, color:BRAND.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>Notes</div>
                      <div style={{ fontSize:15, color:BRAND.navy }}>{selectedItem.notes}</div>
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <button className="btn-green" onClick={()=>completeItem(selectedItem)}>{selectedItem.recurrence?"✓ Mark done & reschedule":"✓ Mark as done"}</button>
                  <button className="btn-ghost" onClick={()=>setEditMode(true)}>Edit</button>
                  <button onClick={()=>deleteItem(selectedItem.id)} style={{ background:"none", border:"none", color:urgencyColor.overdue, fontSize:14, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", padding:"10px 0", fontWeight:500 }}>Delete</button>
                </div>
              </>
            ):(
              <>
                <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, fontWeight:400, color:BRAND.navy, marginBottom:28 }}>Edit reminder</h2>
                <FormFields form={form} setForm={setForm} />
                <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:10 }}>
                  <button className="btn-green" onClick={updateItem} disabled={saving}>{saving?"Saving…":"Save changes"}</button>
                  <button className="btn-ghost" onClick={()=>setEditMode(false)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS */}
      {view==="home" && showNotif && (
        <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:BRAND.bg, minHeight:"100vh", zIndex:100, overflowY:"auto" }}>
          <NotificationsPanel user={user} onClose={() => setShowNotif(false)} />
        </div>
      )}

      {/* Paywall overlay */}
      {showPaywall && (
        <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:BRAND.bg, minHeight:"100vh", zIndex:200, overflowY:"auto" }}>
          <PaywallScreen user={user} itemCount={items.length} isPro={isPro} onClose={() => setShowPaywall(false)} />
        </div>
      )}

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      {view==="home" && (
        <div style={{
          position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
          width:"100%", maxWidth:430,
          background:"rgba(244,251,246,0.94)", backdropFilter:"blur(12px)",
          borderTop:`1px solid ${BRAND.border}`,
          padding:"12px 24px 28px",
          display:"flex", justifyContent:"space-between", alignItems:"center",
        }}>
          <div>
            <div style={{ fontSize:11, color:BRAND.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:1 }}>Tracking</div>
            <div style={{ fontSize:20, fontWeight:700, color:BRAND.navy }}>{items.length}{!isPro ? ` / ${FREE_LIMIT}` : ""} items</div>
            {!isPro && (
              <button onClick={() => setShowPaywall(true)} style={{ background:"none", border:"none", padding:0, fontSize:11, color:BRAND.green, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>
                Upgrade to Pro ✨
              </button>
            )}
          </div>
          <button onClick={openAdd} style={{
            background:BRAND.green, color:BRAND.navy, border:"none",
            width:52, height:52, borderRadius:"50%", fontSize:26,
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 4px 20px ${BRAND.green}66`, fontWeight:700,
          }}>+</button>
        </div>
        <div style={{ textAlign:"center", padding:"4px 0 0", fontSize:11, color:BRAND.muted }}>
          <a href="/legal.html" target="_blank" style={{ color:BRAND.muted, textDecoration:"none" }}>Privacy & Terms</a>
        </div>
      )}
    </div>
  );
}
