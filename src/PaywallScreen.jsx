import { useState } from "react";
import { supabase } from "./lib/supabase";

const BRAND = {
  green:      "#4CC96A",
  greenLight: "#E8F9EE",
  navy:       "#1E2A3A",
  navyLight:  "#2D3F52",
  bg:         "#F4FBF6",
  border:     "#D8EFE0",
  muted:      "#7A9A85",
};

const PLANS = [
  {
    id:       "yearly",
    label:    "Yearly",
    price:    "$19.99",
    per:      "per year",
    monthly:  "$1.67/mo",
    badge:    "Best value",
    coffee:   "☕ Less than one coffee a month",
    priceId:  import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID,
    savings:  "Save $16",
  },
  {
    id:       "monthly",
    label:    "Monthly",
    price:    "$2.99",
    per:      "per month",
    monthly:  null,
    badge:    null,
    coffee:   "☕ Less than one coffee a month",
    priceId:  import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID,
    savings:  null,
  },
];

const FREE_LIMIT = 5;

export default function PaywallScreen({ user, itemCount, onClose, isPro }) {
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const plan = PLANS.find(p => p.id === selectedPlan);

      // Get auth token and call edge function directly
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        "https://rzkaqgnymqrgvikewmpe.supabase.co/functions/v1/create-checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            priceId:   plan.priceId,
            userId:    user.id,
            userEmail: user.email,
            returnUrl: window.location.origin,
          }),
        }
      );
      const data = await res.json();

      if (!res.ok || !data?.url) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleManageBilling() {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("create-portal", {
        body: { userId: user.id, returnUrl: window.location.origin },
      });
      if (data?.url) window.location.href = data.url;
    } catch {}
    setLoading(false);
  }

  // Already pro — show management screen
  if (isPro) {
    return (
      <div style={{ padding: "52px 24px 24px", fontFamily: "'DM Sans', sans-serif" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: BRAND.muted, fontFamily: "'DM Sans',sans-serif", padding: 0, marginBottom: 20 }}>← Back</button>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌟</div>
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, fontWeight: 400, color: BRAND.navy, marginBottom: 8 }}>You're on Cue Pro</h2>
          <p style={{ fontSize: 14, color: BRAND.muted, lineHeight: 1.6 }}>Thank you for supporting Cue! You have unlimited reminders.</p>
        </div>

        <button
          onClick={handleManageBilling}
          disabled={loading}
          style={{ background: BRAND.navy, color: "#fff", border: "none", borderRadius: 12, padding: "14px 24px", fontSize: 15, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, cursor: "pointer", width: "100%", opacity: loading ? 0.5 : 1 }}>
          {loading ? "Loading…" : "Manage billing & subscription"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "52px 24px 24px", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {onClose && (
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: BRAND.muted, fontFamily: "'DM Sans',sans-serif", padding: 0, marginBottom: 20 }}>← Back</button>
      )}

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
        <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 30, fontWeight: 400, color: BRAND.navy, marginBottom: 8, lineHeight: 1.2 }}>
          Unlock <span style={{ fontStyle: "italic", color: BRAND.green }}>Cue Pro</span>
        </h2>
        {itemCount >= FREE_LIMIT && (
          <div style={{ background: "#FDF7EF", border: "1px solid #F0E0BE", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#C47A2A", fontWeight: 500, marginBottom: 16 }}>
            You've reached the 5 reminder limit on the free plan
          </div>
        )}
        <p style={{ fontSize: 14, color: BRAND.muted, lineHeight: 1.6 }}>
          Everything you need to stay on top of your daily life — unlimited reminders, all categories, push notifications.
        </p>
      </div>

      {/* Features list */}
      <div style={{ background: BRAND.greenLight, borderRadius: 16, padding: "16px 20px", marginBottom: 24 }}>
        {[
          { icon: "∞", text: "Unlimited reminders" },
          { icon: "🔔", text: "Push notifications" },
          { icon: "🔄", text: "Recurring tasks" },
          { icon: "📱", text: "Sync across all devices" },
          { icon: "🗂️", text: "All 6 categories" },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: BRAND.green + "30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>
            <span style={{ fontSize: 14, fontWeight: 500, color: BRAND.navy }}>{text}</span>
            <span style={{ marginLeft: "auto", color: BRAND.green, fontSize: 16 }}>✓</span>
          </div>
        ))}
      </div>

      {/* Plan selector */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>Choose your plan</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PLANS.map(plan => (
            <div key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              style={{
                border: `2px solid ${selectedPlan === plan.id ? BRAND.green : BRAND.border}`,
                borderRadius: 14,
                padding: "16px 18px",
                cursor: "pointer",
                background: selectedPlan === plan.id ? BRAND.greenLight : "#fff",
                transition: "all 0.15s",
                position: "relative",
              }}>
              {plan.badge && (
                <div style={{ position: "absolute", top: -10, right: 14, background: BRAND.green, color: BRAND.navy, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                  {plan.badge} {plan.savings && `— ${plan.savings}`}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    border: `2px solid ${selectedPlan === plan.id ? BRAND.green : BRAND.border}`,
                    background: selectedPlan === plan.id ? BRAND.green : "transparent",
                    flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {selectedPlan === plan.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: BRAND.navy }}>{plan.label}</div>
                    {plan.monthly && <div style={{ fontSize: 12, color: BRAND.muted }}>{plan.monthly} billed annually</div>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: BRAND.navy }}>{plan.price}</div>
                  <div style={{ fontSize: 11, color: BRAND.muted }}>{plan.per}</div>
                </div>
              </div>
              {selectedPlan === plan.id && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BRAND.border}`, fontSize: 13, color: BRAND.muted }}>
                  {plan.coffee}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#FDF0EF", border: "1px solid #F0CECE", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#C45B5B" }}>
          {error}
        </div>
      )}

      {/* CTA button */}
      <button
        onClick={handleSubscribe}
        disabled={loading}
        style={{
          background: BRAND.green, color: BRAND.navy, border: "none",
          borderRadius: 12, padding: "16px 24px", fontSize: 16,
          fontFamily: "'DM Sans',sans-serif", fontWeight: 700,
          cursor: "pointer", width: "100%",
          boxShadow: `0 4px 20px ${BRAND.green}55`,
          opacity: loading ? 0.5 : 1,
          marginBottom: 12,
        }}>
        {loading ? "Redirecting to checkout…" : `Start ${selectedPlan === "yearly" ? "Yearly" : "Monthly"} Plan`}
      </button>

      <p style={{ textAlign: "center", fontSize: 12, color: BRAND.muted, lineHeight: 1.6 }}>
        Cancel anytime. Secure payment by Stripe. 🔒
      </p>

      {/* Free plan note */}
      {!onClose && (
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", width: "100%", textAlign: "center", fontSize: 13, color: BRAND.muted, cursor: "pointer", marginTop: 8, fontFamily: "'DM Sans',sans-serif", padding: "8px 0" }}>
          Continue with free plan (5 reminders)
        </button>
      )}
    </div>
  );
}
