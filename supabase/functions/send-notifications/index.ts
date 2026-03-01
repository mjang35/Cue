import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

function getLocalDateStr(utcDate: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(utcDate)
  } catch {
    return utcDate.toISOString().split('T')[0]
  }
}

function getLocalHourMinute(utcDate: Date, timezone: string): { hour: number, minute: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(utcDate)
    const hour   = parseInt(parts.find(p => p.type === 'hour')?.value   || '0')
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
    return { hour, minute }
  } catch {
    return { hour: utcDate.getUTCHours(), minute: utcDate.getUTCMinutes() }
  }
}

Deno.serve(async () => {
  try {
    const vapidPublicKey  = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
    webpush.setVapidDetails('mailto:cue.helpcontact@gmail.com', vapidPublicKey, vapidPrivateKey)

    const now = new Date()
    const results = []

    // Get all users with push subscriptions
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('user_id, subscription')

    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0, results: [] }), { headers: { 'Content-Type': 'application/json' } })
    }

    const userIds = subs.map(s => s.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, notification_days, timezone')
      .in('id', userIds)

    const subMap     = Object.fromEntries(subs.map(s => [s.user_id, s.subscription]))
    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))

    // Process each user individually using their timezone
    for (const userId of userIds) {
      const sub      = subMap[userId]
      const profile  = profileMap[userId] || {}
      const timezone = profile.timezone || 'America/New_York'
      const userDays = profile.notification_days || [0, 1, 3]

      const { hour: localHour, minute: localMinute } = getLocalHourMinute(now, timezone)
      const localDateStr = getLocalDateStr(now, timezone)
      const isDigestTime = localHour === 9 && localMinute < 5

      // ── Daily digest at 9am user's local time ──
      if (isDigestTime) {
        for (const daysAhead of userDays) {
          const target = new Date(now)
          target.setDate(target.getDate() + daysAhead)
          const targetDateStr = getLocalDateStr(target, timezone)

          const { data: items } = await supabase
            .from('items')
            .select('id, name, due_time')
            .eq('user_id', userId)
            .eq('expiry_date', targetDateStr)

          for (const item of items || []) {
            if (daysAhead === 0 && item.due_time) continue // handled by exact-time

            const body =
              daysAhead === 0  ? `"${item.name}" is due today!` :
              daysAhead === 1  ? `"${item.name}" is due tomorrow` :
              daysAhead === 7  ? `"${item.name}" is due in 1 week` :
              daysAhead === 14 ? `"${item.name}" is due in 2 weeks` :
                                 `"${item.name}" is due in ${daysAhead} days`

            try {
              await webpush.sendNotification(sub, JSON.stringify({ title: 'Cue Reminder', body }))
              results.push({ user: userId.slice(0,8), item: item.name, daysAhead, type: 'digest', ok: true })
            } catch (e) {
              results.push({ user: userId.slice(0,8), item: item.name, daysAhead, type: 'digest', ok: false, error: e.message })
            }
          }
        }
      }

      // ── Exact-time reminders ──
      const { data: timedItems } = await supabase
        .from('items')
        .select('id, name, due_time')
        .eq('user_id', userId)
        .eq('expiry_date', localDateStr)
        .not('due_time', 'is', null)

      for (const item of timedItems || []) {
        if (!item.due_time) continue
        const [itemHour, itemMinute] = item.due_time.split(':').map(Number)

        // Fire if within 1 minute of the set time
        if (itemHour !== localHour || Math.abs(itemMinute - localMinute) > 1) continue

        const hour12 = itemHour % 12 || 12
        const ampm   = itemHour >= 12 ? 'PM' : 'AM'
        const timeStr = `${hour12}:${String(itemMinute).padStart(2,'0')} ${ampm}`

        try {
          await webpush.sendNotification(sub, JSON.stringify({ title: '⏰ Cue Reminder', body: `"${item.name}" is due now! (${timeStr})` }))
          results.push({ user: userId.slice(0,8), item: item.name, type: 'exact-time', ok: true })
        } catch (e) {
          results.push({ user: userId.slice(0,8), item: item.name, type: 'exact-time', ok: false, error: e.message })
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
