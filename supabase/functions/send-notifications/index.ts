import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async () => {
  try {
    const vapidPublicKey  = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!

    webpush.setVapidDetails('mailto:cue.helpcontact@gmail.com', vapidPublicKey, vapidPrivateKey)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const results = []

    // Check all possible notification windows (0-14 days)
    for (const daysAhead of [0, 1, 2, 3, 5, 7, 14]) {
      const target = new Date(today)
      target.setDate(target.getDate() + daysAhead)
      const dateStr = target.toISOString().split('T')[0]

      const { data: items } = await supabase
        .from('items').select('id, name, user_id').eq('expiry_date', dateStr)
      if (!items?.length) continue

      const userIds = [...new Set(items.map(i => i.user_id))]

      // Get subscriptions AND user preferences together
      const [{ data: subs }, { data: prefs }] = await Promise.all([
        supabase.from('push_subscriptions').select('user_id, subscription').in('user_id', userIds),
        supabase.from('profiles').select('id, notification_days').in('id', userIds),
      ])
      if (!subs?.length) continue

      const subMap  = Object.fromEntries(subs.map(s => [s.user_id, s.subscription]))
      // Default to [0,1,3] if user hasn't set preferences
      const prefMap = Object.fromEntries((prefs || []).map(p => [p.id, p.notification_days || [0, 1, 3]]))

      for (const item of items) {
        const sub = subMap[item.user_id]
        if (!sub) continue

        // Check if this user wants notifications for this many days ahead
        const userDays = prefMap[item.user_id] || [0, 1, 3]
        if (!userDays.includes(daysAhead)) continue

        const body =
          daysAhead === 0  ? `"${item.name}" is due today!` :
          daysAhead === 1  ? `"${item.name}" is due tomorrow` :
          daysAhead === 7  ? `"${item.name}" is due in 1 week` :
          daysAhead === 14 ? `"${item.name}" is due in 2 weeks` :
                             `"${item.name}" is due in ${daysAhead} days`

        try {
          await webpush.sendNotification(sub, JSON.stringify({ title: 'Cue Reminder', body }))
          results.push({ item: item.name, daysAhead, ok: true })
        } catch (e) {
          results.push({ item: item.name, daysAhead, ok: false, error: e.message })
        }
      }
    }

    return new Response(
      JSON.stringify({ sent: results.filter(r => r.ok).length, results }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
