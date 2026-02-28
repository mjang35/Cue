import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Your VAPID public key — replace this after running the setup guide
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export function useNotifications(user) {
  const [permission, setPermission] = useState(Notification.permission)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkExistingSubscription()
  }, [user])

  async function checkExistingSubscription() {
    if (!('serviceWorker' in navigator) || !user) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    } catch {}
  }

  async function requestPermissionAndSubscribe() {
    if (!('Notification' in window)) {
      alert('Your browser does not support notifications.')
      return
    }
    if (!VAPID_PUBLIC_KEY) {
      alert('Notifications not configured yet. Please complete the Phase 3 setup.')
      return
    }

    setLoading(true)
    try {
      // Ask user for permission
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result !== 'granted') {
        setLoading(false)
        return
      }

      // Subscribe to push
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Save subscription to Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: sub.toJSON(),
        }, { onConflict: 'user_id' })

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

      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)

      setSubscribed(false)
    } catch {}
    setLoading(false)
  }

  return { permission, subscribed, loading, requestPermissionAndSubscribe, unsubscribe }
}
