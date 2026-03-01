import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export function useNotifications(user) {
  const [permission, setPermission] = useState('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  // Always show as supported — let the browser tell us if it fails
  const supported = true

  useEffect(() => {
    try {
      if (typeof Notification !== 'undefined') {
        setPermission(Notification.permission)
      }
    } catch {}
    if (user) checkExistingSubscription()
  }, [user])

  async function checkExistingSubscription() {
    try {
      if (!('serviceWorker' in navigator)) return
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    } catch {}
  }

  async function requestPermissionAndSubscribe() {
    setLoading(true)
    try {
      // Request notification permission
      let perm = 'denied'
      if (typeof Notification !== 'undefined') {
        perm = await Notification.requestPermission()
        setPermission(perm)
      }

      if (perm !== 'granted') {
        setLoading(false)
        return
      }

      if (!('serviceWorker' in navigator)) {
        alert('Push notifications are not supported in this browser. Please try Safari on iPhone or Chrome on Android.')
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
      console.error('Notification error:', err)
      alert(`Could not enable notifications: ${err.message}`)
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
