import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AuthScreen from './AuthScreen.jsx'
import { supabase } from './lib/supabase.js'

const BRAND = { green: "#4CC96A", navy: "#1E2A3A", bg: "#F4FBF6", muted: "#7A9A85", border: "#D8EFE0", greenLight: "#E8F9EE" }

function Root() {
  const [user, setUser]         = useState(null)
  const [checking, setChecking] = useState(true)
  const [confirmed, setConfirmed] = useState(false) // show success message after email confirm

  useEffect(() => {
    // Handle email confirmation links — Supabase puts tokens in the URL hash
    const hash = window.location.hash
    if (hash && (hash.includes('access_token') || hash.includes('type=signup') || hash.includes('type=recovery'))) {
      // Let Supabase process the hash — it fires onAuthStateChange automatically
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user)
          setConfirmed(true) // show welcome message
          // Clean up the URL
          window.history.replaceState(null, '', window.location.pathname)
        }
        setChecking(false)
      })
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        setChecking(false)
      })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN' && window.location.hash.includes('type=signup')) {
        setConfirmed(true)
        window.history.replaceState(null, '', window.location.pathname)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (checking) {
    return (
      <div style={{ fontFamily:"'DM Sans',sans-serif", background:BRAND.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:BRAND.muted, fontSize:15 }}>Loading…</div>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return (
    <>
      {/* Email confirmed welcome banner */}
      {confirmed && (
        <div style={{
          position:"fixed", top:0, left:"50%", transform:"translateX(-50%)",
          width:"100%", maxWidth:430, zIndex:999,
          background:BRAND.green, color:BRAND.navy,
          padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between",
          fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600,
        }}>
          <span>🎉 Email confirmed! Welcome to Cue.</span>
          <button onClick={() => setConfirmed(false)}
            style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:BRAND.navy, lineHeight:1 }}>×</button>
        </div>
      )}
      <App user={user} onSignOut={handleSignOut} />
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW failed:', err))
  })
}
