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

    const now = new Date()

    // Get today's date in UTC
    const todayUTC = now.toISOString().split('T')[0]

    // Current UTC hour and minute
    const currentUTCHour   = now.getUTCHours()
    const currentUTCMinute = now.getUTCMinutes()

    const results = []

    // ── 1. Daily schedule reminders at 9am UTC (2am/5am EST depending on DST) ──
    // We check a range of hours to cover common US timezones:
    // 9am EST = 14:00 UTC, 9am PST = 17:00 UTC, 9am CST = 15:00 UTC
    const digestHours = [13, 14, 15, 16, 17] // covers 9am across all US timezones
    const isDigestTime = digestHours.includes(currentUTCHour) && currentUTCMinute < 5

    if (isDigestTime) {
      for (const daysAhead of [0, 1, 2, 3, 5, 7, 14]) {
        const target = new Date(now)
        target.setUTCDate(target.getUTCDate() + daysAhead)
        const dateStr = target.toISOString().split('T')[0]

        const { data: items } = await supabase
          .from('items').select('id, name, user_id, due_time').eq('expiry_date', dateStr)
        if (!items?.length) continue

        const userIds = [...new Set(items.map(i => i.user_id))]
        const [{ data: subs }, { data: prefs }] = await Promise.all([
          supabase.from('push_subscriptions').select('user_id, subscription').in('user_id', userIds),
          supabase.from('profiles').select('id, notification_days').in('id', userIds),
        ])
        if (!subs?.length) continue

        const subMap  = Object.fromEntries(subs.map(s => [s.user_id, s.subscription]))
        const prefMap = Object.fromEntries((prefs || []).map(p => [p.id, p.notification_days || [0, 1, 3]]))

        for (const item of items) {
          const sub = subMap[item.user_id]
          if (!sub) continue
          const userDays = prefMap[item.user_id] || [0, 1, 3]
          if (!userDays.includes(daysAhead)) continue
          if (daysAhead === 0 && item.due_time) continue // handled by exact-time below

          const body =
            daysAhead === 0  ? `"${item.name}" is due today!` :
            daysAhead === 1  ? `"${item.name}" is due tomorrow` :
            daysAhead === 7  ? `"${item.name}" is due in 1 week` :
            daysAhead === 14 ? `"${item.name}" is due in 2 weeks` :
                               `"${item.name}" is due in ${daysAhead} days`

          try {
            await webpush.sendNotification(sub, JSON.stringify({ title: 'Cue Reminder', body }))
            results.push({ item: item.name, daysAhead, type: 'digest', ok: true })
          } catch (e) {
            results.push({ item: item.name, daysAhead, type: 'digest', ok: false, error: e.message })
          }
        }
      }
    }

    // ── 2. Exact-time reminders ─────────────────────────────────────────────
    // Get all items due today that have a specific time set
    const { data: timedItems } = await supabase
      .from('items')
      .select('id, name, user_id, due_time, expiry_date')
      .eq('expiry_date', todayUTC)
      .not('due_time', 'is', null)

    for (const item of timedItems || []) {
      if (!item.due_time) continue

      // due_time is stored as local time (HH:MM:SS)
      // Convert to UTC by treating it as EST (UTC-5) — covers most US users
      // A better solution would store timezone with the user, but this works for now
      const [itemHour, itemMinute] = item.due_time.split(':').map(Number)

      // Check all common US timezone offsets: EST=-5, CST=-6, MST=-7, PST=-8
      // If any offset matches current UTC time, fire the notification
      const matchesAnyTimezone = [-4, -5, -6, -7, -8].some(offset => {
        const utcHour = (itemHour - offset + 24) % 24
        return utcHour === currentUTCHour && Math.abs(itemMinute - currentUTCMinute) <= 5
      })

      if (!matchesAnyTimezone) continue

      const { data: subData } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', item.user_id)
        .single()

      if (!subData?.subscription) continue

      // Format the time nicely for the notification
      const hour12 = itemHour % 12 || 12
      const ampm   = itemHour >= 12 ? 'PM' : 'AM'
      const timeStr = `${hour12}:${String(itemMinute).padStart(2,'0')} ${ampm}`

      try {
        await webpush.sendNotification(
          subData.subscription,
          JSON.stringify({ title: '⏰ Cue Reminder', body: `"${item.name}" is due now! (${timeStr})` })
        )
        results.push({ item: item.name, type: 'exact-time', ok: true })
      } catch (e) {
        results.push({ item: item.name, type: 'exact-time', ok: false, error: e.message })
      }
    }

    return new Response(
      JSON.stringify({ sent: results.filter(r => r.ok).length, results, utcTime: `${currentUTCHour}:${currentUTCMinute}` }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
