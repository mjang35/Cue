// Supabase Edge Function — create-portal
// Creates a Stripe billing portal session so users can manage their subscription

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
  try {
    const { userId, returnUrl } = await req.json()

    // Get the Stripe customer ID for this user
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (!profile?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'No billing account found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   profile.stripe_customer_id,
      return_url: returnUrl,
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
