import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AuthScreen from './AuthScreen.jsx'
import { supabase } from './lib/supabase.js'

function Root() {
  const [user, setUser]         = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setChecking(false)
    })

    // Listen for login / logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  // Still checking if user is logged in
  if (checking) {
    return (
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#F4FBF6",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ color: "#7A9A85", fontSize: 15 }}>Loading…</div>
      </div>
    )
  }

  // Not logged in → show auth screen
  if (!user) return <AuthScreen />

  // Logged in → show app
  return <App user={user} onSignOut={handleSignOut} />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW failed:', err))
  })
}
