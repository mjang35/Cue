# 🗄️ Cue — Phase 2 Setup Guide
### Adding user accounts + cloud sync (Supabase)

After following this guide, Cue will have:
- A login / sign up screen
- Each user's reminders saved to the cloud
- Data that syncs across all their devices
- A real user database you can see and manage

Estimated time: **30–45 minutes**

---

## Part A — Create your Supabase account and project

**1. Sign up for Supabase**
- Go to https://supabase.com
- Click **"Start your project"**
- Sign up with GitHub (easiest) or email

**2. Create a new project**
- Click **"New project"**
- Fill in:
  - **Name:** `cue-app`
  - **Database Password:** make a strong password and save it somewhere safe
  - **Region:** pick the one closest to you (e.g. US East)
- Click **"Create new project"**
- Wait about 2 minutes while it sets up

---

## Part B — Create the database table

Your app needs a table called `items` to store reminders.

**1. Go to the SQL Editor**
- In your Supabase project, click **"SQL Editor"** in the left sidebar

**2. Run this command**
- Click **"New query"**
- Copy and paste ALL of this text into the box:

```sql
-- Create the items table
create table items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text not null default 'task',
  expiry_date date not null,
  recurrence_days integer,
  notes text,
  created_at timestamp with time zone default now()
);

-- Make sure users can only see their own items (security)
alter table items enable row level security;

create policy "Users can view their own items"
  on items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own items"
  on items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own items"
  on items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own items"
  on items for delete
  using (auth.uid() = user_id);
```

- Click the green **"Run"** button
- You should see "Success. No rows returned" — that means it worked ✓

---

## Part C — Get your Supabase keys

**1. Go to Project Settings**
- Click the ⚙️ **Settings** icon in the left sidebar
- Click **"API"**

**2. Copy these two values** (you'll need them in Part D):
- **Project URL** — looks like `https://abcdefgh.supabase.co`
- **anon public key** — a long string starting with `eyJ...`

Keep this browser tab open — you'll need to paste these shortly.

---

## Part D — Add keys to Vercel

This tells your live website how to connect to Supabase.

**1. Go to your Vercel dashboard**
- https://vercel.com/dashboard
- Click on your **cue** project

**2. Go to Settings → Environment Variables**
- Click **"Settings"** tab at the top
- Click **"Environment Variables"** in the left menu

**3. Add the first variable**
- **Key:** `VITE_SUPABASE_URL`
- **Value:** paste your Project URL from Supabase
- Click **"Save"**

**4. Add the second variable**
- **Key:** `VITE_SUPABASE_ANON_KEY`
- **Value:** paste your anon public key from Supabase
- Click **"Save"**

---

## Part E — Update your code files

**1. Download and unzip** the new `cue-app-phase2.zip` file

**2. Replace these files** in your existing `cue` project folder
   (drag from new folder → your Desktop/cue folder, click Replace):

| New file | Replace in |
|---|---|
| `src/App.jsx` | `cue/src/` |
| `src/main.jsx` | `cue/src/` |
| `src/AuthScreen.jsx` | `cue/src/` (NEW — just copy it in) |
| `src/lib/supabase.js` | `cue/src/lib/` (create the `lib` folder first if it doesn't exist) |
| `package.json` | `cue/` |

**3. Open Terminal and run:**
```
cd Desktop/cue
npm install
```
This installs the Supabase library. Takes about 30 seconds.

---

## Part F — Push to GitHub and redeploy

In Terminal:
```
git add .
git commit -m "Add Supabase auth and cloud sync"
git push
```

Vercel will automatically redeploy. Wait 60 seconds, then refresh your site.

---

## Part G — Enable email confirmation (important!)

By default Supabase requires users to confirm their email before logging in.
This is good for a real app. But while you're testing, you may want to turn it off.

**To turn off email confirmation (for testing):**
1. In Supabase, go to **Authentication → Providers → Email**
2. Toggle off **"Confirm email"**
3. Click Save

**Turn it back on before you launch to real users.**

---

## ✅ Test it works

1. Open your Vercel URL
2. You should see a **Cue login screen**
3. Click **"Sign up"** and create a test account
4. Add a reminder — it should save and appear
5. Open the URL on your phone — sign in with the same account
6. Your reminder should appear there too! 🎉

---

## Troubleshooting

**"Invalid API key" error**
→ Double-check the environment variables in Vercel. Make sure there are no spaces before/after the values.

**Blank screen after deploying**
→ Check Vercel build logs. Usually means a missing file.

**"Email not confirmed" error when signing in**
→ Either confirm the email, or turn off email confirmation in Supabase (see Part G).

**Items not saving**
→ Go to Supabase → Table Editor → items. Check if the table exists. If not, run the SQL from Part B again.

---

## What's next

Once this is working, we'll build:
- **Phase 3** — Push notifications (users get reminded even when the app is closed)
- **Phase 4** — Stripe paywall (charge $3–5/month for unlimited reminders)
