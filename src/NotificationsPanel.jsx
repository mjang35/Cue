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
    await supabase
      .from('profiles')
      .upsert({ id: user.id, notification_days: selectedDays })
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
    <div style={{ padding: "52px 24px 40px", fontFamily: "'DM Sans', sans-serif" }}>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: BRAND.muted, fontFamily: "'DM Sans',sans-serif", padding: 0, marginBottom: 20 }}>← Back</button>

      <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, fontWeight: 400, color: BRAND.navy, marginBottom: 8 }}>Notifications</h2>
      <p style={{ fontSize: 14, color: BRAND.muted, marginBottom: 32, lineHeight: 1.6 }}>
        Get reminded on your phone when items are due — even when the app is closed.
      </p>

      {/* Not supported */}
      {!supported && (
        <div style={{ background: "#FDF7EF", border: "1px solid #F0E0BE", borderRadius: 12, padding: 16, fontSize: 14, color: "#C47A2A", lineHeight: 1.7, marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>📲 Install the app first</div>
          Push notifications require the app to be installed on your home screen.<br /><br />
          <strong>On iPhone:</strong> Tap Share in Safari → "Add to Home Screen"<br />
          <strong>On Android:</strong> Tap menu in Chrome → "Add to Home Screen"<br /><br />
          Then open Cue from your home screen and come back here.
        </div>
      )}

      {/* Status card */}
      {supported && (
        <div style={{ background: subscribed ? BRAND.greenLight : "#F5F4F0", borderRadius: 16, padding: 20, marginBottom: 24, border: `1.5px solid ${subscribed ? BRAND.border : "#E8E7E1"}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 32 }}>{subscribed ? "🔔" : "🔕"}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: BRAND.navy }}>
                {subscribed ? "Notifications are on" : "Notifications are off"}
              </div>
              <div style={{ fontSize: 13, color: BRAND.muted, marginTop: 2 }}>
                {subscribed ? "Sent daily at 9:00 AM based on your schedule" : "Turn on to get timely reminders"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification schedule picker */}
      {supported && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>
            Notify me
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DAY_OPTIONS.map(({ value, label }) => (
              <div key={value}
                onClick={() => toggleDay(value)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                  background: selectedDays.includes(value) ? BRAND.greenLight : "#fff",
                  border: `1.5px solid ${selectedDays.includes(value) ? BRAND.green : BRAND.border}`,
                  transition: "all 0.15s",
                }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4,
                  background: selectedDays.includes(value) ? BRAND.green : "transparent",
                  border: `2px solid ${selectedDays.includes(value) ? BRAND.green : BRAND.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {selectedDays.includes(value) && <span style={{ color: BRAND.navy, fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: BRAND.navy }}>{label}</span>
              </div>
            ))}
          </div>

          <div style={{ background:"#F4FBF6", border:`1px solid ${BRAND.border}`, borderRadius:12, padding:"14px 16px", fontSize:13, color:BRAND.muted, lineHeight:1.7, marginBottom:12 }}>
            <div style={{ fontWeight:600, color:BRAND.navy, marginBottom:8 }}>📬 How notifications work</div>
            <div style={{ marginBottom:6 }}>🕘 <strong style={{color:BRAND.navy}}>Daily digest</strong> — sent every day at <strong style={{color:BRAND.navy}}>9:00 AM</strong> for items matching your schedule above</div>
            <div>⏰ <strong style={{color:BRAND.navy}}>Exact time</strong> — if you add a time to a reminder (e.g. 3:30 PM), you'll get a separate notification at that exact moment on the due date</div>
          </div>
          <button
            onClick={savePrefs}
            disabled={savingPrefs}
            style={{
              marginTop: 16, background: savedMsg ? BRAND.green : BRAND.navy,
              color: "#fff", border: "none", borderRadius: 12,
              padding: "12px 24px", fontSize: 14, fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600, cursor: "pointer", width: "100%",
              opacity: savingPrefs ? 0.5 : 1, transition: "background 0.3s",
            }}>
            {savedMsg ? "✓ Saved!" : savingPrefs ? "Saving…" : "Save schedule"}
          </button>
        </div>
      )}

      {/* Toggle notifications */}
      {supported && (
        permission === "denied" ? (
          <div style={{ background: "#FDF0EF", border: "1px solid #F0CECE", borderRadius: 12, padding: 16, fontSize: 14, color: "#C45B5B", lineHeight: 1.6 }}>
            You've blocked notifications. Go to your browser settings, find this site, and allow notifications.
          </div>
        ) : subscribed ? (
          <button onClick={unsubscribe} disabled={loading}
            style={{ background: "transparent", border: `1.5px solid ${BRAND.border}`, borderRadius: 12, padding: "13px 24px", fontSize: 15, fontFamily: "'DM Sans',sans-serif", fontWeight: 500, cursor: "pointer", width: "100%", color: BRAND.navy, opacity: loading ? 0.5 : 1 }}>
            {loading ? "Turning off…" : "Turn off notifications"}
          </button>
        ) : (
          <button onClick={requestPermissionAndSubscribe} disabled={loading}
            style={{ background: BRAND.green, color: BRAND.navy, border: "none", borderRadius: 12, padding: "14px 24px", fontSize: 15, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, cursor: "pointer", width: "100%", opacity: loading ? 0.5 : 1, boxShadow: `0 4px 20px ${BRAND.green}44` }}>
            {loading ? "Setting up…" : "🔔 Turn on notifications"}
          </button>
        )
      )}
    </div>
  )
}
