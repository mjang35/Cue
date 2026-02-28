import { useNotifications } from './hooks/useNotifications'

const BRAND = {
  green:      "#4CC96A",
  greenLight: "#E8F9EE",
  navy:       "#1E2A3A",
  bg:         "#F4FBF6",
  border:     "#D8EFE0",
  muted:      "#7A9A85",
}

export default function NotificationsPanel({ user, onClose }) {
  const { permission, subscribed, loading, requestPermissionAndSubscribe, unsubscribe } = useNotifications(user)

  return (
    <div style={{ padding: "52px 24px 24px" }}>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: BRAND.muted, fontFamily: "'DM Sans',sans-serif", padding: 0, marginBottom: 20 }}>← Back</button>

      <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, fontWeight: 400, color: BRAND.navy, marginBottom: 8 }}>Notifications</h2>
      <p style={{ fontSize: 14, color: BRAND.muted, marginBottom: 32, lineHeight: 1.6 }}>
        Get reminded on your phone when items are due — even when the app is closed.
      </p>

      {/* Status card */}
      <div style={{ background: subscribed ? BRAND.greenLight : "#F5F4F0", borderRadius: 16, padding: 20, marginBottom: 24, border: `1.5px solid ${subscribed ? BRAND.border : "#E8E7E1"}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 32 }}>{subscribed ? "🔔" : "🔕"}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: BRAND.navy }}>
              {subscribed ? "Notifications are on" : "Notifications are off"}
            </div>
            <div style={{ fontSize: 13, color: BRAND.muted, marginTop: 2 }}>
              {subscribed
                ? "You'll be reminded 3 days, 1 day, and day-of"
                : "Turn on to get timely reminders"}
            </div>
          </div>
        </div>
      </div>

      {/* When you'll be notified */}
      {subscribed && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>When you'll be notified</div>
          {[
            { icon: "⚠️", label: "3 days before", desc: "Early heads up" },
            { icon: "⏰", label: "1 day before",  desc: "Time to act" },
            { icon: "🔴", label: "Day of",        desc: "Last reminder" },
          ].map(({ icon, label, desc }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${BRAND.border}` }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: BRAND.navy }}>{label}</div>
                <div style={{ fontSize: 12, color: BRAND.muted }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action button */}
      {permission === "denied" ? (
        <div style={{ background: "#FDF0EF", border: "1px solid #F0CECE", borderRadius: 12, padding: 16, fontSize: 14, color: "#C45B5B", lineHeight: 1.6 }}>
          You've blocked notifications for this site. To enable them, go to your browser settings and allow notifications for this site, then come back here.
        </div>
      ) : subscribed ? (
        <button
          onClick={unsubscribe}
          disabled={loading}
          style={{ background: "transparent", border: `1.5px solid ${BRAND.border}`, borderRadius: 12, padding: "13px 24px", fontSize: 15, fontFamily: "'DM Sans',sans-serif", fontWeight: 500, cursor: "pointer", width: "100%", color: BRAND.navy, opacity: loading ? 0.5 : 1 }}>
          {loading ? "Turning off…" : "Turn off notifications"}
        </button>
      ) : (
        <button
          onClick={requestPermissionAndSubscribe}
          disabled={loading}
          style={{ background: BRAND.green, color: BRAND.navy, border: "none", borderRadius: 12, padding: "14px 24px", fontSize: 15, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, cursor: "pointer", width: "100%", opacity: loading ? 0.5 : 1, boxShadow: `0 4px 20px ${BRAND.green}44` }}>
          {loading ? "Setting up…" : "🔔 Turn on notifications"}
        </button>
      )}
    </div>
  )
}
