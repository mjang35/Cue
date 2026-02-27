import { useState, useEffect } from "react";

const CATEGORIES = {
  food: { label: "Food & Drinks", icon: "🥛", color: "#D4A853" },
  pet: { label: "Pet Care", icon: "🐾", color: "#7BAE8A" },
  home: { label: "Home", icon: "🏠", color: "#8B9BB4" },
  health: { label: "Health", icon: "💊", color: "#C47A7A" },
  subscription: { label: "Subscriptions", icon: "💳", color: "#A78BCA" },
  task: { label: "Tasks", icon: "✓", color: "#888" },
};

const RECURRENCE_OPTIONS = [
  { label: "No recurrence", value: null },
  { label: "Every week", value: 7 },
  { label: "Every 2 weeks", value: 14 },
  { label: "Every month", value: 30 },
  { label: "Every 2 months", value: 60 },
  { label: "Every 3 months", value: 90 },
  { label: "Every 6 months", value: 180 },
  { label: "Every year", value: 365 },
];

function getDaysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function getUrgencyLevel(days) {
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 3) return "soon";
  if (days <= 7) return "upcoming";
  return "ok";
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const SAMPLE_ITEMS = [
  { id: 1, name: "Clean cat litter", category: "pet", expiryDate: addDays(todayStr(), 2), recurrence: 7, notes: "" },
  { id: 2, name: "Replace AC filter", category: "home", expiryDate: addDays(todayStr(), 12), recurrence: 90, notes: "16x20 size" },
  { id: 3, name: "Milk", category: "food", expiryDate: addDays(todayStr(), 3), recurrence: null, notes: "" },
  { id: 4, name: "Vitamins", category: "health", expiryDate: addDays(todayStr(), -1), recurrence: null, notes: "Need to restock" },
  { id: 5, name: "Netflix", category: "subscription", expiryDate: addDays(todayStr(), 18), recurrence: 30, notes: "" },
  { id: 6, name: "Clean kitchen cabinets", category: "home", expiryDate: addDays(todayStr(), 6), recurrence: 14, notes: "" },
];

export default function App() {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("cue_items");
      return saved ? JSON.parse(saved) : SAMPLE_ITEMS;
    } catch { return SAMPLE_ITEMS; }
  });
  const [view, setView] = useState("home");
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [form, setForm] = useState({ name: "", category: "home", expiryDate: addDays(todayStr(), 7), recurrence: null, notes: "" });
  const [sortedItems, setSortedItems] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    try { localStorage.setItem("cue_items", JSON.stringify(items)); } catch {}
  }, [items]);

  useEffect(() => {
    const filtered = filterCat === "all" ? items : items.filter(i => i.category === filterCat);
    const sorted = [...filtered].sort((a, b) => getDaysUntil(a.expiryDate) - getDaysUntil(b.expiryDate));
    setSortedItems(sorted);
  }, [items, filterCat]);

  const overdueCount = items.filter(i => getDaysUntil(i.expiryDate) < 0).length;
  const soonCount = items.filter(i => { const d = getDaysUntil(i.expiryDate); return d >= 0 && d <= 3; }).length;

  function addItem() {
    if (!form.name.trim()) return;
    setItems(prev => [...prev, { ...form, id: Date.now() }]);
    setForm({ name: "", category: "home", expiryDate: addDays(todayStr(), 7), recurrence: null, notes: "" });
    setView("home");
  }

  function updateItem() {
    setItems(prev => prev.map(i => i.id === selectedItem.id ? { ...form, id: i.id } : i));
    setSelectedItem({ ...form, id: selectedItem.id });
    setEditMode(false);
  }

  function deleteItem(id) {
    setItems(prev => prev.filter(i => i.id !== id));
    setView("home");
  }

  function completeItem(item) {
    if (item.recurrence) {
      const newDate = addDays(todayStr(), item.recurrence);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, expiryDate: newDate } : i));
      if (selectedItem?.id === item.id) setSelectedItem(prev => ({ ...prev, expiryDate: newDate }));
    } else {
      deleteItem(item.id);
    }
  }

  function openDetail(item) {
    setSelectedItem(item);
    setForm({ name: item.name, category: item.category, expiryDate: item.expiryDate, recurrence: item.recurrence, notes: item.notes });
    setEditMode(false);
    setView("detail");
  }

  function openAdd() {
    setForm({ name: "", category: "home", expiryDate: addDays(todayStr(), 7), recurrence: null, notes: "" });
    setView("add");
  }

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setShowInstallBanner(false);
  }

  const urgencyColor = { overdue: "#C47A7A", today: "#D4A853", soon: "#D4A853", upcoming: "#8B9BB4", ok: "#7BAE8A" };

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#FAFAF8",
      minHeight: "100vh",
      maxWidth: 430,
      margin: "0 auto",
      position: "relative",
      paddingBottom: 80,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FAFAF8; }
        input, select, textarea { font-family: 'DM Sans', sans-serif; }
        .item-row { transition: background 0.15s; cursor: pointer; }
        .item-row:hover { background: #F0EFE9 !important; }
        .btn-primary { background: #1A1A1A; color: #fff; border: none; border-radius: 10px; padding: 14px 24px; font-size: 15px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; width: 100%; transition: opacity 0.15s; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-ghost { background: transparent; border: 1.5px solid #E0DED8; border-radius: 10px; padding: 13px 24px; font-size: 15px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; width: 100%; transition: background 0.15s; color: #1A1A1A; }
        .btn-ghost:hover { background: #F0EFE9; }
        .input-field { width: 100%; border: 1.5px solid #E0DED8; border-radius: 10px; padding: 13px 14px; font-size: 15px; background: #fff; color: #1A1A1A; outline: none; transition: border 0.15s; }
        .input-field:focus { border-color: #1A1A1A; }
        .cat-chip { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1.5px solid transparent; transition: all 0.15s; white-space: nowrap; }
        .slide-in { animation: slideIn 0.2s ease; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Install Banner */}
      {showInstallBanner && (
        <div style={{ background: "#1A1A1A", color: "#fff", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 13 }}>📲 Install <strong>Cue</strong> on your phone</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleInstall} style={{ background: "#fff", color: "#1A1A1A", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Install</button>
            <button onClick={() => setShowInstallBanner(false)} style={{ background: "transparent", color: "#888", border: "none", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
        </div>
      )}

      {/* HOME VIEW */}
      {view === "home" && (
        <div className="slide-in">
          <div style={{ padding: "48px 24px 20px" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 24 }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#1A1A1A", fontStyle: "italic" }}>Cue</span>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#D4A853", display: "inline-block", marginBottom: 3 }}></span>
            </div>

            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 2, color: "#AAA", textTransform: "uppercase", marginBottom: 6 }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, fontWeight: 400, color: "#1A1A1A", lineHeight: 1.2 }}>
              {overdueCount > 0
                ? <>{overdueCount} item{overdueCount > 1 ? "s" : ""} <span style={{ fontStyle: "italic", color: "#C47A7A" }}>overdue</span></>
                : soonCount > 0
                ? <><span style={{ fontStyle: "italic", color: "#D4A853" }}>{soonCount} item{soonCount > 1 ? "s" : ""}</span> need attention</>
                : <>Everything's <span style={{ fontStyle: "italic" }}>on track</span></>}
            </h1>
          </div>

          {(overdueCount > 0 || soonCount > 0) && (
            <div style={{ display: "flex", gap: 8, padding: "0 24px 20px", overflowX: "auto" }}>
              {overdueCount > 0 && <div style={{ background: "#FDF0EF", border: "1px solid #F0CECE", borderRadius: 20, padding: "6px 14px", fontSize: 13, color: "#C47A7A", fontWeight: 500, whiteSpace: "nowrap" }}>⚠ {overdueCount} overdue</div>}
              {soonCount > 0 && <div style={{ background: "#FDF7EF", border: "1px solid #F0E0BE", borderRadius: 20, padding: "6px 14px", fontSize: 13, color: "#D4A853", fontWeight: 500, whiteSpace: "nowrap" }}>⏰ {soonCount} due soon</div>}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, padding: "0 24px 20px", overflowX: "auto" }}>
            {["all", ...Object.keys(CATEGORIES)].map(cat => (
              <div key={cat} className="cat-chip" onClick={() => setFilterCat(cat)}
                style={{ background: filterCat === cat ? "#1A1A1A" : "#F0EFE9", color: filterCat === cat ? "#fff" : "#555" }}>
                {cat === "all" ? "All" : <>{CATEGORIES[cat].icon} {CATEGORIES[cat].label}</>}
              </div>
            ))}
          </div>

          <div style={{ padding: "0 16px" }}>
            {sortedItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px", color: "#AAA" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 15 }}>Nothing to track yet</div>
              </div>
            ) : sortedItems.map(item => {
              const days = getDaysUntil(item.expiryDate);
              const urgency = getUrgencyLevel(days);
              const cat = CATEGORIES[item.category];
              return (
                <div key={item.id} className="item-row" onClick={() => openDetail(item)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 12px", borderRadius: 12, marginBottom: 2 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: cat.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{cat.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "#1A1A1A", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: "#AAA" }}>{formatDate(item.expiryDate)}{item.recurrence && <span style={{ marginLeft: 6, color: "#CCC" }}>· repeats</span>}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, flexShrink: 0, color: urgencyColor[urgency], background: urgencyColor[urgency] + "15", padding: "4px 10px", borderRadius: 20 }}>
                    {urgency === "overdue" ? `${Math.abs(days)}d ago` : urgency === "today" ? "Today" : `${days}d`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD VIEW */}
      {view === "add" && (
        <div className="slide-in">
          <div style={{ padding: "52px 24px 24px" }}>
            <button onClick={() => setView("home")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#AAA", fontFamily: "'DM Sans', sans-serif", padding: 0, marginBottom: 20 }}>← Back</button>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, marginBottom: 28 }}>New reminder</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Name</label>
                <input className="input-field" placeholder="e.g. Clean cat litter" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Category</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <div key={key} className="cat-chip" onClick={() => setForm(f => ({ ...f, category: key }))}
                      style={{ background: form.category === key ? "#1A1A1A" : "#F0EFE9", color: form.category === key ? "#fff" : "#555" }}>
                      {cat.icon} {cat.label}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Expires / Due date</label>
                <input type="date" className="input-field" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Recurrence</label>
                <select className="input-field" value={form.recurrence ?? ""} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value ? Number(e.target.value) : null }))}>
                  {RECURRENCE_OPTIONS.map(o => <option key={o.label} value={o.value ?? ""}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Notes (optional)</label>
                <textarea className="input-field" placeholder="Any details..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ resize: "none" }} />
              </div>
              <button className="btn-primary" onClick={addItem} style={{ marginTop: 8 }}>Add reminder</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL VIEW */}
      {view === "detail" && selectedItem && (
        <div className="slide-in">
          <div style={{ padding: "52px 24px 24px" }}>
            <button onClick={() => setView("home")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#AAA", fontFamily: "'DM Sans', sans-serif", padding: 0, marginBottom: 20 }}>← Back</button>
            {!editMode ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ fontSize: 24 }}>{CATEGORIES[selectedItem.category].icon}</div>
                  <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>{CATEGORIES[selectedItem.category].label}</span>
                </div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, fontWeight: 400, marginBottom: 10, lineHeight: 1.2 }}>{selectedItem.name}</h2>
                {(() => {
                  const days = getDaysUntil(selectedItem.expiryDate);
                  const urgency = getUrgencyLevel(days);
                  return (
                    <div style={{ display: "inline-block", background: urgencyColor[urgency] + "18", color: urgencyColor[urgency], fontWeight: 600, fontSize: 13, padding: "5px 12px", borderRadius: 20, marginBottom: 28 }}>
                      {urgency === "overdue" ? `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue` : urgency === "today" ? "Due today" : `${days} day${days !== 1 ? "s" : ""} remaining`}
                    </div>
                  );
                })()}
                <div style={{ background: "#F5F4F0", borderRadius: 14, padding: 20, marginBottom: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#AAA", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Due date</div>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>{formatDate(selectedItem.expiryDate)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#AAA", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Recurrence</div>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>{selectedItem.recurrence ? RECURRENCE_OPTIONS.find(o => o.value === selectedItem.recurrence)?.label || `Every ${selectedItem.recurrence} days` : "None"}</div>
                    </div>
                  </div>
                  {selectedItem.notes && (
                    <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid #E8E7E1" }}>
                      <div style={{ fontSize: 11, color: "#AAA", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Notes</div>
                      <div style={{ fontSize: 15, color: "#444" }}>{selectedItem.notes}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button className="btn-primary" onClick={() => completeItem(selectedItem)}>
                    {selectedItem.recurrence ? "✓ Mark done & reschedule" : "✓ Mark as done"}
                  </button>
                  <button className="btn-ghost" onClick={() => setEditMode(true)}>Edit</button>
                  <button onClick={() => deleteItem(selectedItem.id)} style={{ background: "none", border: "none", color: "#C47A7A", fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", padding: "10px 0", fontWeight: 500 }}>Delete</button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, marginBottom: 28 }}>Edit reminder</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Name</label>
                    <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Category</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {Object.entries(CATEGORIES).map(([key, cat]) => (
                        <div key={key} className="cat-chip" onClick={() => setForm(f => ({ ...f, category: key }))}
                          style={{ background: form.category === key ? "#1A1A1A" : "#F0EFE9", color: form.category === key ? "#fff" : "#555" }}>
                          {cat.icon} {cat.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Due date</label>
                    <input type="date" className="input-field" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Recurrence</label>
                    <select className="input-field" value={form.recurrence ?? ""} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value ? Number(e.target.value) : null }))}>
                      {RECURRENCE_OPTIONS.map(o => <option key={o.label} value={o.value ?? ""}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Notes</label>
                    <textarea className="input-field" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ resize: "none" }} />
                  </div>
                  <button className="btn-primary" onClick={updateItem} style={{ marginTop: 8 }}>Save changes</button>
                  <button className="btn-ghost" onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      {view === "home" && (
        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430,
          background: "rgba(250,250,248,0.92)", backdropFilter: "blur(12px)",
          borderTop: "1px solid #E8E7E1",
          padding: "12px 24px 28px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#BBB", fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>Tracking</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#1A1A1A" }}>{items.length} items</div>
          </div>
          <button onClick={openAdd} style={{
            background: "#1A1A1A", color: "#fff", border: "none",
            width: 48, height: 48, borderRadius: "50%", fontSize: 24,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}>+</button>
        </div>
      )}
    </div>
  );
}
