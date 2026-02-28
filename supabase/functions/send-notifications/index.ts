// Supabase Edge Function — send-notifications
// This runs automatically every day and sends push notifications
// to users whose items are expiring soon

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async () => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find items expiring in 0, 1, or 3 days
    const checkDays = [0, 1, 3]
    const results = []

    for (const daysAhead of checkDays) {
      const targetDate = new Date(today)
      targetDate.setDate(targetDate.getDate() + daysAhead)
      const dateStr = targetDate.toISOString().split('T')[0]

      // Get all items expiring on this date, with their push subscriptions
      const { data: items, error } = await supabase
        .from('items')
        .select(`
          id,
          name,
          category,
          expiry_date,
          user_id,
          push_subscriptions!inner(subscription)
        `)
        .eq('expiry_date', dateStr)

      if (error) continue

      for (const item of items || []) {
        const subscription = item.push_subscriptions?.subscription
        if (!subscription) continue

        let message = ''
        if (daysAhead === 0) message = `"${item.name}" is due today!`
        if (daysAhead === 1) message = `"${item.name}" is due tomorrow`
        if (daysAhead === 3) message = `"${item.name}" is due in 3 days`

        // Send the push notification
        const pushed = await sendPushNotification(subscription, {
          title: 'Cue Reminder',
          body: message,
          tag: `cue-${item.id}`,
          url: '/',
        })

        results.push({ item: item.name, daysAhead, success: pushed })
      }
    }

    return new Response(
      JSON.stringify({ sent: results.length, results }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function sendPushNotification(subscription: any, payload: any) {
  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!

    const body = JSON.stringify(payload)

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
      },
      body,
    })

    return response.ok
  } catch {
    return false
  }
}
