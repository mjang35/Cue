import { useState } from "react";
import { supabase } from "./lib/supabase";

const BRAND = {
  green:      "#4CC96A",
  greenLight: "#E8F9EE",
  navy:       "#1E2A3A",
  bg:         "#F4FBF6",
  border:     "#D8EFE0",
  muted:      "#7A9A85",
};

const HOW_IT_WORKS = [
  { icon: "➕", title: "Add anything with a date", desc: "Food, meds, subscriptions, filters, pet care — if it expires or repeats, add it to Cue." },
  { icon: "🔔", title: "Get notified at the right time", desc: "Choose to be reminded 1 day, 3 days, or 1 week before. Or set an exact time for precise reminders." },
  { icon: "✅", title: "Mark done & it reschedules", desc: "Tap done and recurring items automatically reset to their next due date. Nothing falls through the cracks." },
];

const EXAMPLES = [
  { icon: "🥛", label: "Milk expires Mar 5" },
  { icon: "💊", label: "Vitamins — weekly" },
  { icon: "🐱", label: "Flea treatment — monthly" },
  { icon: "🔋", label: "Smoke detector battery" },
  { icon: "🚗", label: "Oil change — 3 months" },
  { icon: "📺", label: "Netflix renewal" },
];

export default function AuthScreen() {
  const [mode, setMode]         = useState("landing"); // landing | login | signup | forgot | howItWorks
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage({ type: "error", text: error.message });
    setLoading(false);
  }

  async function handleSignup(e) {
    e.preventDefault();
    if (!agreedToTerms) { setMessage({ type: "error", text: "Please agree to the Terms of Service and Privacy Policy." }); return; }
    setLoading(true); setMessage(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setMessage({ type: "error", text: error.message }); }
    else { setMessage({ type: "success", text: "Check your email for a confirmation link, then come back and log in!" }); }
    setLoading(false);
  }

  async function handleForgot(e) {
    e.preventDefault();
    setLoading(true); setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) { setMessage({ type: "error", text: error.message }); }
    else { setMessage({ type: "success", text: "Password reset email sent! Check your inbox." }); }
    setLoading(false);
  }

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${BRAND.bg}; }
    input { font-family: 'DM Sans', sans-serif; }
    .auth-input { width: 100%; border: 1.5px solid ${BRAND.border}; border-radius: 12px; padding: 14px 16px; font-size: 15px; background: #fff; color: ${BRAND.navy}; outline: none; transition: border 0.15s; }
    .auth-input:focus { border-color: ${BRAND.green}; }
    .btn-green { background: ${BRAND.green}; color: ${BRAND.navy}; border: none; border-radius: 12px; padding: 15px 24px; font-size: 15px; font-family: 'DM Sans', sans-serif; font-weight: 700; cursor: pointer; width: 100%; transition: opacity 0.15s; }
    .btn-green:hover { opacity: 0.88; }
    .btn-green:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-outline { background: transparent; color: ${BRAND.navy}; border: 1.5px solid ${BRAND.border}; border-radius: 12px; padding: 14px 24px; font-size: 15px; font-family: 'DM Sans', sans-serif; font-weight: 600; cursor: pointer; width: 100%; transition: all 0.15s; }
    .btn-outline:hover { border-color: ${BRAND.navy}; }
    .link-btn { background: none; border: none; color: ${BRAND.green}; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: underline; padding: 0; }
  `;

  // ── LANDING PAGE ─────────────────────────────────────────────────────────
  if (mode === "landing") {
    return (
      <div style={{ fontFamily:"'DM Sans',sans-serif", background:BRAND.bg, minHeight:"100vh", maxWidth:430, margin:"0 auto", padding:"48px 24px 60px" }}>
        <style>{styles}</style>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <div style={{ background:BRAND.green, color:BRAND.navy, fontWeight:700, fontSize:22, padding:"8px 20px", borderRadius:12 }}>Cue</div>
          </div>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:30, color:BRAND.navy, lineHeight:1.2, marginBottom:10 }}>
            Timely reminders<br/>for your daily life
          </div>
          <div style={{ fontSize:15, color:BRAND.muted, lineHeight:1.6 }}>
            Never forget what expires, when to restock,<br/>or what needs doing — Cue keeps track.
          </div>
        </div>

        {/* Example chips */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", marginBottom:36 }}>
          {EXAMPLES.map(ex => (
            <div key={ex.label} style={{ background:"#fff", border:`1.5px solid ${BRAND.border}`, borderRadius:20, padding:"7px 14px", fontSize:13, color:BRAND.navy, fontWeight:500 }}>
              {ex.icon} {ex.label}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
          <button className="btn-green" onClick={() => setMode("signup")}>Get started — it's free</button>
          <button className="btn-outline" onClick={() => setMode("login")}>Sign in</button>
        </div>

        {/* How it works link */}
        <div style={{ textAlign:"center" }}>
          <button className="link-btn" onClick={() => setMode("howItWorks")}>How does Cue work? →</button>
        </div>
      </div>
    );
  }

  // ── HOW IT WORKS ─────────────────────────────────────────────────────────
  if (mode === "howItWorks") {
    return (
      <div style={{ fontFamily:"'DM Sans',sans-serif", background:BRAND.bg, minHeight:"100vh", maxWidth:430, margin:"0 auto", padding:"48px 24px 60px" }}>
        <style>{styles}</style>

        <button onClick={() => setMode("landing")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:BRAND.muted, fontFamily:"'DM Sans',sans-serif", padding:0, marginBottom:24 }}>← Back</button>

        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:BRAND.navy, marginBottom:6 }}>How Cue works</div>
        <div style={{ fontSize:14, color:BRAND.muted, marginBottom:32, lineHeight:1.6 }}>Simple reminders for everything with a date.</div>

        {/* Steps */}
        <div style={{ display:"flex", flexDirection:"column", gap:20, marginBottom:36 }}>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} style={{ background:"#fff", border:`1.5px solid ${BRAND.border}`, borderRadius:16, padding:"20px 20px" }}>
              <div style={{ fontSize:28, marginBottom:10 }}>{step.icon}</div>
              <div style={{ fontSize:16, fontWeight:700, color:BRAND.navy, marginBottom:6 }}>{step.title}</div>
              <div style={{ fontSize:14, color:BRAND.muted, lineHeight:1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>

        {/* What you can track */}
        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:12, fontWeight:600, color:BRAND.muted, letterSpacing:0.5, textTransform:"uppercase", marginBottom:14 }}>What people track</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {EXAMPLES.map(ex => (
              <div key={ex.label} style={{ background:"#fff", border:`1.5px solid ${BRAND.border}`, borderRadius:20, padding:"7px 14px", fontSize:13, color:BRAND.navy, fontWeight:500 }}>
                {ex.icon} {ex.label}
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div style={{ background:BRAND.greenLight, border:`1.5px solid ${BRAND.border}`, borderRadius:16, padding:20, marginBottom:32 }}>
          <div style={{ fontSize:16, fontWeight:700, color:BRAND.navy, marginBottom:8 }}>Free to start</div>
          <div style={{ fontSize:14, color:BRAND.muted, lineHeight:1.7 }}>
            Track up to <strong style={{color:BRAND.navy}}>5 reminders for free</strong> — no credit card needed.<br/>
            Upgrade to <strong style={{color:BRAND.navy}}>Cue Pro</strong> for unlimited reminders, push notifications & sync across devices.<br/>
            <strong style={{color:BRAND.navy}}>$2.99/mo</strong> or <strong style={{color:BRAND.navy}}>$19.99/yr</strong>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <button className="btn-green" onClick={() => setMode("signup")}>Get started free</button>
          <button className="btn-outline" onClick={() => setMode("login")}>I already have an account</button>
        </div>
      </div>
    );
  }

  // ── AUTH FORMS (login / signup / forgot) ─────────────────────────────────
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:BRAND.bg, minHeight:"100vh", maxWidth:430, margin:"0 auto", display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px 24px" }}>
      <style>{styles}</style>

      {/* Back button */}
      <button onClick={() => { setMode("landing"); setMessage(null); }}
        style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:BRAND.muted, fontFamily:"'DM Sans',sans-serif", padding:0, marginBottom:24, textAlign:"left" }}>
        ← Back
      </button>

      {/* Logo */}
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:10 }}>
          <div style={{ background:BRAND.green, color:BRAND.navy, fontWeight:700, fontSize:20, padding:"8px 18px", borderRadius:12 }}>Cue</div>
        </div>
        <div style={{ marginTop:10, fontSize:14, color:BRAND.muted }}>timely reminders for your daily life</div>
      </div>

      {/* Card */}
      <div style={{ background:"#fff", borderRadius:20, padding:28, border:`1.5px solid ${BRAND.border}` }}>
        <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:26, fontWeight:400, color:BRAND.navy, marginBottom:6 }}>
          {mode === "login" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
        </h2>
        <p style={{ fontSize:14, color:BRAND.muted, marginBottom:24 }}>
          {mode === "login" ? "Sign in to access your reminders" : mode === "signup" ? "Start tracking what matters" : "We'll email you a reset link"}
        </p>

        {message && (
          <div style={{ padding:"12px 16px", borderRadius:10, marginBottom:20, fontSize:14, background:message.type==="error"?"#FDF0EF":BRAND.greenLight, color:message.type==="error"?"#C45B5B":"#2D7A4A", border:`1px solid ${message.type==="error"?"#F0CECE":BRAND.border}` }}>
            {message.text}
          </div>
        )}

        <form onSubmit={mode==="login"?handleLogin:mode==="signup"?handleSignup:handleForgot}
          style={{ display:"flex", flexDirection:"column", gap:14 }}>

          <div>
            <label style={{ fontSize:12, fontWeight:600, color:BRAND.muted, letterSpacing:0.5, textTransform:"uppercase", display:"block", marginBottom:8 }}>Email</label>
            <input className="auth-input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>

          {mode !== "forgot" && (
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:BRAND.muted, letterSpacing:0.5, textTransform:"uppercase", display:"block", marginBottom:8 }}>Password</label>
              <input className="auth-input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
            </div>
          )}

          {mode === "signup" && (
            <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginTop:4 }}>
              <input type="checkbox" id="terms" checked={agreedToTerms} onChange={e=>setAgreedToTerms(e.target.checked)}
                style={{ marginTop:3, accentColor:BRAND.green, width:16, height:16, flexShrink:0, cursor:"pointer" }} />
              <label htmlFor="terms" style={{ fontSize:13, color:BRAND.muted, lineHeight:1.5, cursor:"pointer" }}>
                I agree to the{" "}
                <a href="/legal.html" target="_blank" style={{ color:BRAND.green, fontWeight:600 }}>Terms of Service</a>
                {" "}and{" "}
                <a href="/legal.html" target="_blank" style={{ color:BRAND.green, fontWeight:600 }}>Privacy Policy</a>
              </label>
            </div>
          )}

          <button className="btn-green" type="submit" disabled={loading||(mode==="signup"&&!agreedToTerms)} style={{ marginTop:8, opacity:(mode==="signup"&&!agreedToTerms)?0.5:1 }}>
            {loading?"Please wait…":mode==="login"?"Sign in":mode==="signup"?"Create account":"Send reset link"}
          </button>
        </form>

        <div style={{ marginTop:20, textAlign:"center", fontSize:14, color:BRAND.muted, display:"flex", flexDirection:"column", gap:10 }}>
          {mode === "login" && (
            <>
              <div>Don't have an account? <button className="link-btn" onClick={()=>{setMode("signup");setMessage(null);}}>Sign up</button></div>
              <div><button className="link-btn" onClick={()=>{setMode("forgot");setMessage(null);}}>Forgot password?</button></div>
            </>
          )}
          {mode === "signup" && (
            <div>Already have an account? <button className="link-btn" onClick={()=>{setMode("login");setMessage(null);}}>Sign in</button></div>
          )}
          {mode === "forgot" && (
            <div><button className="link-btn" onClick={()=>{setMode("login");setMessage(null);}}>← Back to sign in</button></div>
          )}
        </div>
      </div>
    </div>
  );
}
