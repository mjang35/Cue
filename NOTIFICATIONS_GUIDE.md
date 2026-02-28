# 🔔 Cue — Phase 3 Setup Guide
### Adding Push Notifications

After following this guide, Cue will:
- Ask users if they want notifications when they open the app
- Send a push notification 3 days, 1 day, and day-of for every expiring item
- Work even when the app is closed on their phone

Estimated time: **45 minutes**

---

## Part A — Generate VAPID Keys

VAPID keys are what allow your app to send push notifications securely.
You only ever do this once.

**1. Open Terminal on your Mac**

**2. Navigate to your project:**
```
cd Desktop/cue
```

**3. Install the web-push tool:**
```
npm install -g web-push
```

**4. Generate your keys:**
```
web-push generate-vapid-keys
```

You'll see output like this:
```
=======================================
Public Key:
BHxyz123...(long string)

Private Key:
abc456....(long string)
=======================================
```

**5. Copy both keys and save them somewhere safe** — you'll need them in the next steps.

---

## Part B — Add VAPID keys to Vercel

1. Go to https://vercel.com → your cue project → Settings → Environment Variables
2. Add these two new variables:

| Key | Value |
|---|---|
| `VITE_VAPID_PUBLIC_KEY` | your Public Key from above |
| `VAPID_PRIVATE_KEY` | your Private Key from above |

Click Save after each one.

---

## Part C — Add VAPID keys to Supabase

Your edge function also needs these keys.

1. Go to https://supabase.com → your project
2. Click **"Edge Functions"** in the left sidebar
3. Click **"Manage secrets"**
4. Add these secrets:

| Name | Value |
|---|---|
| `VAPID_PUBLIC_KEY` | your Public Key |
| `VAPID_PRIVATE_KEY` | your Private Key |

---

## Part D — Create the push_subscriptions table in Supabase

1. Go to Supabase → **SQL Editor** → New query
2. Paste and run this:

```
create table push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  subscription jsonb not null,
  created_at timestamp with time zone default now()
);

alter table push_subscriptions enable row level security;

create policy "Users manage their own subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## Part E — Deploy the Edge Function

This is the code that actually sends notifications every day.

**1. Install Supabase CLI:**
```
brew install supabase/tap/supabase
```
(If you don't have Homebrew, install it first at https://brew.sh)

**2. Login to Supabase:**
```
supabase login
```
A browser window opens — click Allow.

**3. Link your project** (get your project ID from Supabase → General settings):
```
cd Desktop/cue
supabase link --project-ref YOUR_PROJECT_ID
```

**4. Deploy the function:**
```
supabase functions deploy send-notifications
```

---

## Part F — Schedule daily notifications

This makes Supabase run your function automatically every day at 9am.

1. Go to Supabase → **Database** → **Extensions**
2. Search for `pg_cron` and enable it
3. Go to **SQL Editor** → New query and run:

```
select cron.schedule(
  'send-daily-notifications',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-notifications',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  )
  $$
);
```

Replace `YOUR_PROJECT_ID` with your actual project ID and `YOUR_ANON_KEY` with your publishable key.

---

## Part G — Update and deploy your code

**1. Replace these files** from the new zip into your cue project folder:
- `src/App.jsx`
- `src/NotificationsPanel.jsx` (new file — just copy it in)
- `src/hooks/useNotifications.js` (new file — create a `hooks` folder inside `src` first)
- `public/sw.js`

**2. Push to GitHub:**
```
cd Desktop/cue
git add .
git commit -m "Add push notifications"
git push
```

---

## ✅ Test it works

1. Open your Vercel URL on your phone
2. Tap the 🔔 bell icon in the top right
3. Tap **"Turn on notifications"**
4. Allow when your phone asks
5. To test immediately, go to Supabase → Edge Functions → send-notifications → click **"Invoke"**
6. You should receive a notification on your phone within seconds! 🎉

---

## Troubleshooting

**"Notifications not configured yet" message**
→ The VAPID public key isn't set in Vercel. Double check the environment variable name is exactly `VITE_VAPID_PUBLIC_KEY`

**Notifications not arriving**
→ Make sure you're testing on your Vercel URL, not localhost. Push notifications don't work on localhost.

**iOS not showing notifications**
→ iPhone requires the app to be installed (added to home screen) first. Push notifications on iOS only work for installed PWAs.

---

## What's next

**Phase 4 — Stripe paywall**
Charge users $3–5/month or $15/year for unlimited reminders. This is what turns Cue into a real business.
