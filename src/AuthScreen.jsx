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

export default function AuthScreen() {
  const [mode, setMode]       = useState("login"); // login | signup | forgot
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: "error"|"success", text }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage({ type: "error", text: error.message });
    setLoading(false);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Check your email for a confirmation link, then come back and log in!" });
    }
    setLoading(false);
  }

  async function handleForgot(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Password reset email sent! Check your inbox." });
    }
    setLoading(false);
  }

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: BRAND.bg,
      minHeight: "100vh",
      maxWidth: 430,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${BRAND.bg}; }
        input { font-family: 'DM Sans', sans-serif; }
        .auth-input { width: 100%; border: 1.5px solid ${BRAND.border}; border-radius: 12px; padding: 14px 16px; font-size: 15px; background: #fff; color: ${BRAND.navy}; outline: none; transition: border 0.15s; }
        .auth-input:focus { border-color: ${BRAND.green}; }
        .btn-green { background: ${BRAND.green}; color: ${BRAND.navy}; border: none; border-radius: 12px; padding: 15px 24px; font-size: 15px; font-family: 'DM Sans', sans-serif; font-weight: 700; cursor: pointer; width: 100%; transition: opacity 0.15s; }
        .btn-green:hover { opacity: 0.88; }
        .btn-green:disabled { opacity: 0.5; cursor: not-allowed; }
        .link-btn { background: none; border: none; color: ${BRAND.green}; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: underline; padding: 0; }
      `}</style>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: BRAND.green, color: BRAND.navy, fontWeight: 700, fontSize: 20, padding: "8px 18px", borderRadius: 12 }}>Cue</div>
        </div>
        <div style={{ marginTop: 10, fontSize: 14, color: BRAND.muted }}>timely reminders for your daily life</div>
      </div>

      {/* Card */}
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, border: `1.5px solid ${BRAND.border}` }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, fontWeight: 400, color: BRAND.navy, marginBottom: 6 }}>
          {mode === "login"  ? "Welcome back" :
           mode === "signup" ? "Create account" :
           "Reset password"}
        </h2>
        <p style={{ fontSize: 14, color: BRAND.muted, marginBottom: 24 }}>
          {mode === "login"  ? "Sign in to access your reminders" :
           mode === "signup" ? "Start tracking what matters" :
           "We'll email you a reset link"}
        </p>

        {/* Message */}
        {message && (
          <div style={{
            padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14,
            background: message.type === "error" ? "#FDF0EF" : BRAND.greenLight,
            color:      message.type === "error" ? "#C45B5B" : "#2D7A4A",
            border: `1px solid ${message.type === "error" ? "#F0CECE" : BRAND.border}`,
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.muted, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Email</label>
            <input className="auth-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          {mode !== "forgot" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.muted, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Password</label>
              <input className="auth-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
          )}

          <button className="btn-green" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? "Please wait…" :
             mode === "login"  ? "Sign in" :
             mode === "signup" ? "Create account" :
             "Send reset link"}
          </button>
        </form>

        {/* Mode switchers */}
        <div style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: BRAND.muted, display: "flex", flexDirection: "column", gap: 10 }}>
          {mode === "login" && (
            <>
              <div>Don't have an account? <button className="link-btn" onClick={() => { setMode("signup"); setMessage(null); }}>Sign up</button></div>
              <div><button className="link-btn" onClick={() => { setMode("forgot"); setMessage(null); }}>Forgot password?</button></div>
            </>
          )}
          {mode === "signup" && (
            <div>Already have an account? <button className="link-btn" onClick={() => { setMode("login"); setMessage(null); }}>Sign in</button></div>
          )}
          {mode === "forgot" && (
            <div><button className="link-btn" onClick={() => { setMode("login"); setMessage(null); }}>← Back to sign in</button></div>
          )}
        </div>
      </div>
    </div>
  );
}
