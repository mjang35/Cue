import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body      = await req.text()
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      webhookSecret
    )
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    console.error('Secret prefix:', webhookSecret?.substring(0, 10))
    console.error('Signature header:', signature?.substring(0, 30))
    return new Response(
      JSON.stringify({ error: 'Webhook signature verification failed', detail: err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      const userId  = session.metadata?.userId
      if (!userId) break

      await supabase.from('profiles').upsert({
        id:                 userId,
        is_pro:             true,
        stripe_customer_id: session.customer as string,
        pro_since:          new Date().toISOString(),
      })
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice      = event.data.object as Stripe.Invoice
      const customerId   = invoice.customer as string
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()
      if (profile) {
        await supabase
          .from('profiles')
          .update({ is_pro: true })
          .eq('id', profile.id)
      }
      break
    }

    case 'customer.subscription.deleted':
    case 'invoice.payment_failed': {
      const obj        = event.data.object as any
      const customerId = obj.customer as string
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()
      if (profile) {
        await supabase
          .from('profiles')
          .update({ is_pro: false })
          .eq('id', profile.id)
      }
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
