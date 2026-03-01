import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

// Safely get notification permission without crashing
function getPermission() {
  try {
    if (typeof Notification === 'undefined') return 'unsupported'
    return Notification.permission
  } catch {
    return 'unsupported'
  }
}

export function useNotifications(user) {
  const [permission, setPermission] = useState(getPermission())
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    // Check if push notifications are supported
    // Be permissive — try even if PushManager check fails, as some browsers
    // report it differently when installed as PWA
    const hasServiceWorker = 'serviceWorker' in navigator
    const hasNotification  = typeof Notification !== 'undefined'
    const isSupported = hasServiceWorker && hasNotification
    setSupported(isSupported)
    if (isSupported && user) checkExistingSubscription()
  }, [user])

  async function checkExistingSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    } catch {}
  }

  async function requestPermissionAndSubscribe() {
    if (!supported) {
      alert('Push notifications are not supported in this browser. Try installing the app to your home screen first.')
      return
    }
    if (!VAPID_PUBLIC_KEY) {
      alert('Notifications not configured yet. Please complete the Phase 3 setup.')
      return
    }

    setLoading(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result !== 'granted') {
        setLoading(false)
        return
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({ user_id: user.id, subscription: sub.toJSON() }, { onConflict: 'user_id' })

      if (!error) setSubscribed(true)
    } catch (err) {
      console.error('Failed to subscribe:', err)
    }
    setLoading(false)
  }

  async function unsubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      await supabase.from('push_subscriptions').delete().eq('user_id', user.id)
      setSubscribed(false)
    } catch {}
    setLoading(false)
  }

  return { permission, subscribed, loading, supported, requestPermissionAndSubscribe, unsubscribe }
}
