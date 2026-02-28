# 💳 Cue — Phase 4 Setup Guide
### Adding the Stripe Paywall

After following this guide, Cue will:
- Show a paywall when free users hit 5 reminders
- Accept real credit card payments via Stripe
- Automatically unlock Pro when payment succeeds
- Let users manage/cancel their own subscription

Estimated time: **60 minutes**

---

## Part A — Create your Stripe account

1. Go to https://stripe.com and click **"Start now"**
2. Sign up with your email
3. Verify your email
4. You'll land on the Stripe Dashboard

> ⚠️ You'll start in **Test Mode** (top left toggle). Stay in test mode while setting up — switch to Live Mode only when you're ready to charge real money.

---

## Part B — Create your products in Stripe

1. In Stripe Dashboard, click **"Product catalog"** in the left sidebar
2. Click **"+ Add product"**
3. Fill in:
   - **Name:** `Cue Pro`
   - **Description:** `Unlimited reminders, push notifications, all categories`
4. Under **Pricing**, add two prices:

**Monthly price:**
- Price: `$2.99`
- Billing period: `Monthly`
- Click **Add another price**

**Yearly price:**
- Price: `$19.99`
- Billing period: `Yearly`

5. Click **Save product**

6. **Copy the two Price IDs** — they look like `price_1234abcd...`
   - Click each price to see its ID
   - Save them somewhere — you'll need them soon

price_1T5uNKAWaFp2eXuPEAgwDOZO

19.99.  price_1T5uNKAWaFp2eXuP3GDAlsAs
---

## Part C — Get your Stripe API keys

1. In Stripe Dashboard, click **"Developers"** → **"API keys"**
2. Copy these two keys:
   - **Publishable key** — starts with `pk_test_...`
   - **Secret key** — starts with `sk_test_...` (click Reveal)

pk_test_51T5uA2AWaFp2eXuPcPLp3ITLeewTIZBiZZYlu57y2PiRDvvKoXlPUHNbRyfAkwrdhSPyHINarM5UrWKOgYE6Iaol00mOM2VSJT

sk_test_51T5uA2AWaFp2eXuPF2MKRjg5dVKWjXIuvKhTGqZ1QHeZrjSqBxG4nlGjaHpsI0Y6I8CjTVtz3MXaJPHsHBrXYoX600pOi5qi21

---

## Part D — Add keys to Vercel

Go to vercel.com → your cue project → Settings → Environment Variables

Add these:

| Key | Value |
|---|---|
| `VITE_STRIPE_MONTHLY_PRICE_ID` | your monthly `price_...` ID |
| `VITE_STRIPE_YEARLY_PRICE_ID` | your yearly `price_...` ID |
| `VITE_STRIPE_PUBLISHABLE_KEY` | your `pk_test_...` key |

---

## Part E — Add keys to Supabase secrets

Go to Supabase → Edge Functions → Manage secrets

Add these:

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | your `sk_test_...` key |
| `STRIPE_WEBHOOK_SECRET` | (you'll get this in Part G) |

---

## Part F — Create the profiles table in Supabase

Go to Supabase → SQL Editor → New query, paste and run:

```
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  is_pro boolean default false,
  stripe_customer_id text,
  pro_since timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);
```

---

## Part G — Deploy the Stripe edge functions

In Terminal, from your cue folder:

```
supabase functions deploy create-checkout
supabase functions deploy create-portal
supabase functions deploy stripe-webhook
```

---

## Part H — Set up the Stripe webhook

This tells Stripe to notify your app when a payment succeeds.

1. In Stripe Dashboard → **Developers** → **Webhooks**
2. Click **"+ Add endpoint"**
3. Endpoint URL:
   ```
   https://rzkaqgnymqrgvikewmpe.supabase.co/functions/v1/stripe-webhook
   ```
4. Click **"Select events"** and choose:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
5. Click **"Add endpoint"**
6. Click on your new webhook → **"Reveal signing secret"**
7. Copy the `whsec_...` key
8. Go back to Supabase → Edge Functions → Manage secrets
9. Add `STRIPE_WEBHOOK_SECRET` = your `whsec_...` key

---

## Part I — Update and push your code files

Replace these files from the Phase 4 zip:
- `src/App.jsx`
- `src/PaywallScreen.jsx` (new — copy into `src/`)
- `public/legal.html` (new — copy into `public/`)

Then in Terminal:
```
git add .
git commit -m "Add Stripe paywall"
git push
```

---

## ✅ Test it works

**Test a payment:**
1. Open your app and add 5 reminders
2. Try to add a 6th — the paywall should appear
3. Click a plan and proceed to checkout
4. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g. 12/28)
   - Any 3-digit CVC (e.g. 123)
   - Any name and ZIP
5. Complete the purchase
6. You should be redirected back to Cue as a Pro user ✓

---

## Part J — Going live (when ready)

When you're ready to charge real money:

1. In Stripe Dashboard, toggle from **Test Mode** to **Live Mode**
2. Get your live API keys (same place, different keys)
3. Create the same products again in Live Mode
4. Update all your Stripe keys in Vercel and Supabase with the live versions
5. Create a new webhook for the live endpoint too

---

## Your legal pages

Your Privacy Policy and Terms of Service are already built and live at:
```
https://your-vercel-url.vercel.app/legal.html
```

Update the email addresses in `public/legal.html` to your real email before launching.

---

## 🎉 You're done!

You now have a complete, sellable app:
- ✅ PWA installable on any phone
- ✅ User accounts and cloud sync
- ✅ Push notifications
- ✅ Stripe paywall ($2.99/mo or $19.99/yr)
- ✅ Privacy Policy and Terms of Service

**Next steps to grow:**
- Post a demo video on TikTok or Instagram Reels
- Submit to Product Hunt on a Tuesday
- Share in r/productivity and r/selfhosted on Reddit
- Get your first 10 users to leave reviews
