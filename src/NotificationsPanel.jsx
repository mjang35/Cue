import { useState, useEffect } from 'react'
import { useNotifications } from './hooks/useNotifications'
import { supabase } from './lib/supabase'

const BRAND = {
  green:      "#4CC96A",
  greenLight: "#E8F9EE",
  navy:       "#1E2A3A",
  bg:         "#F4FBF6",
  border:     "#D8EFE0",
  muted:      "#7A9A85",
}

const DAY_OPTIONS = [
  { value: 0,  label: "Day of" },
  { value: 1,  label: "1 day before" },
  { value: 2,  label: "2 days before" },
  { value: 3,  label: "3 days before" },
  { value: 5,  label: "5 days before" },
  { value: 7,  label: "1 week before" },
  { value: 14, label: "2 weeks before" },
]

export default function NotificationsPanel({ user, onClose }) {
  const { permission, subscribed, loading, supported, requestPermissionAndSubscribe, unsubscribe } = useNotifications(user)
  const [selectedDays, setSelectedDays] = useState([0, 1, 3])
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)

  useEffect(() => {
    if (user) loadPrefs()
  }, [user])

  async function loadPrefs() {
    const { data } = await supabase
      .from('profiles')
      .select('notification_days')
      .eq('id', user.id)
      .single()
    if (data?.notification_days) setSelectedDays(data.notification_days)
  }

  async function savePrefs() {
    setSavingPrefs(true)
    await supabase.from('profiles').upsert({ id: user.id, notification_days: selectedDays })
    setSavingPrefs(false)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  function toggleDay(val) {
    setSelectedDays(prev =>
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val].sort((a,b) => a-b)
    )
  }

  return (
    <div style={{ padding: "44px 20px 40px", fontFamily: "'DM Sans', sans-serif", overflowY: "auto", minHeight: "100vh" }}>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: BRAND.muted, fontFamily: "'DM Sans',sans-serif", padding: 0, marginBottom: 12 }}>← Back</button>

      <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 24, fontWeight: 400, color: BRAND.navy, marginBottom: 4 }}>Notifications</h2>
      <p style={{ fontSize: 13, color: BRAND.muted, marginBottom: 16, lineHeight: 1.5 }}>
        Get reminded when items are due.
      </p>

      {/* Toggle button — show first and prominent */}
      {supported && (
        permission === "denied" ? (
          <div style={{ background: "#FDF0EF", border: "1px solid #F0CECE", borderRadius: 12, padding: 14, fontSize: 13, color: "#C45B5B", lineHeight: 1.6, marginBottom: 16 }}>
            Notifications are blocked. Go to your phone Settings → Notifications → Cue and allow them.
          </div>
        ) : subscribed ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background: BRAND.greenLight, border:`1.5px solid ${BRAND.green}`, borderRadius:12, padding:"12px 16px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:22 }}>🔔</span>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:BRAND.navy }}>Notifications on</div>
                <div style={{ fontSize:12, color:BRAND.muted }}>Daily at 9:00 AM</div>
              </div>
            </div>
            <button onClick={unsubscribe} disabled={loading}
              style={{ background:"transparent", border:`1px solid ${BRAND.border}`, borderRadius:8, padding:"6px 12px", fontSize:12, fontFamily:"'DM Sans',sans-serif", fontWeight:500, cursor:"pointer", color:BRAND.navy, opacity:loading?0.5:1 }}>
              {loading ? "…" : "Turn off"}
            </button>
          </div>
        ) : (
          <button onClick={requestPermissionAndSubscribe} disabled={loading}
            style={{ background:BRAND.green, color:BRAND.navy, border:"none", borderRadius:12, padding:"14px 24px", fontSize:15, fontFamily:"'DM Sans',sans-serif", fontWeight:700, cursor:"pointer", width:"100%", opacity:loading?0.5:1, boxShadow:`0 4px 20px ${BRAND.green}44`, marginBottom:16 }}>
            {loading ? "Setting up…" : "🔔 Turn on notifications"}
          </button>
        )
      )}

      {/* Schedule picker — compact chips instead of tall rows */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: BRAND.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>Notify me</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {DAY_OPTIONS.map(({ value, label }) => (
            <div key={value} onClick={() => toggleDay(value)}
              style={{
                padding:"8px 14px", borderRadius:20, cursor:"pointer", fontSize:13, fontWeight:500,
                background: selectedDays.includes(value) ? BRAND.navy : "#fff",
                color: selectedDays.includes(value) ? "#fff" : BRAND.navy,
                border: `1.5px solid ${selectedDays.includes(value) ? BRAND.navy : BRAND.border}`,
                transition:"all 0.15s",
              }}>
              {selectedDays.includes(value) ? "✓ " : ""}{label}
            </div>
          ))}
        </div>
      </div>

      <button onClick={savePrefs} disabled={savingPrefs}
        style={{
          background: savedMsg ? BRAND.green : BRAND.navy, color:"#fff", border:"none",
          borderRadius:12, padding:"12px 24px", fontSize:14, fontFamily:"'DM Sans',sans-serif",
          fontWeight:600, cursor:"pointer", width:"100%", opacity:savingPrefs?0.5:1,
          marginBottom:16, transition:"background 0.3s",
        }}>
        {savedMsg ? "✓ Saved!" : savingPrefs ? "Saving…" : "Save schedule"}
      </button>

      {/* How it works — compact */}
      <div style={{ background:"#F4FBF6", border:`1px solid ${BRAND.border}`, borderRadius:10, padding:"12px 14px", fontSize:12, color:BRAND.muted, lineHeight:1.6 }}>
        <div style={{ fontWeight:600, color:BRAND.navy, marginBottom:6 }}>📬 How it works</div>
        <div>🕘 <strong style={{color:BRAND.navy}}>Daily digest</strong> at 9:00 AM for items matching your schedule</div>
        <div style={{marginTop:4}}>⏰ <strong style={{color:BRAND.navy}}>Exact time</strong> — set a time on a reminder to get notified at that moment</div>
      </div>
    </div>
  )
}
