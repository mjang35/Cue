# 🚀 Cue — Deploy Guide
### From files on your computer → live PWA on the internet

---

## What you have after following this guide
- Cue live at a real URL (e.g. `cue-app.vercel.app` or your custom domain)
- Installable on any phone like a native app
- Works offline
- Ready for push notifications (Phase 3)

Estimated time: **45–60 minutes** (most of it is waiting for installs)

---

## Step 1 — Install the tools you need

You need two things installed on your computer: **Node.js** and **Git**.

### Install Node.js
1. Go to https://nodejs.org
2. Download the **LTS** version (the left button, it says "Recommended")
3. Open the downloaded file and click through the installer
4. When it's done, open **Terminal** (Mac) or **Command Prompt** (Windows)
5. Type this and press Enter to confirm it worked:
   ```
   node --version
   ```
   You should see something like `v20.11.0`. If you do, Node is installed ✓

### Install Git
1. Go to https://git-scm.com/downloads
2. Download for your OS and install it
3. In your terminal, confirm it worked:
   ```
   git --version
   ```
   You should see something like `git version 2.43.0` ✓

---

## Step 2 — Set up the project on your computer

1. Create a folder called `cue-app` somewhere easy to find (Desktop is fine)
2. Copy all the files from this package into that folder. The structure should look like:
   ```
   cue-app/
   ├── index.html
   ├── package.json
   ├── vite.config.js
   ├── src/
   │   ├── main.jsx
   │   └── App.jsx
   └── public/
       ├── manifest.json
       ├── sw.js
       └── icons/        ← you'll add icons here (Step 3)
   ```

3. Open Terminal/Command Prompt and navigate to your folder:
   ```
   cd Desktop/cue-app
   ```
   (adjust the path if you put it somewhere else)

4. Install the project's dependencies:
   ```
   npm install
   ```
   This downloads React and the build tools. It takes 1–2 minutes.

5. Test it runs locally:
   ```
   npm run dev
   ```
   Open http://localhost:5173 in your browser. You should see Cue! ✓
   Press Ctrl+C to stop it when done.

---

## Step 3 — Create your app icons

Your app needs icons to look real on people's phones.

**Quickest option (5 minutes):**
1. Go to https://realfavicongenerator.net
2. Click "Select your Favicon image" and upload any square image
   - Even a simple letter "C" on a dark background works great
   - You can use Canva (free) to make a nice one quickly
3. Scroll down and click "Generate your Favicons and HTML code"
4. Download the package
5. From the downloaded files, copy these into your `cue-app/public/icons/` folder:
   - Rename any 192x192 PNG to `icon-192.png`
   - Rename any 512x512 PNG to `icon-512.png`
   - Rename any 152x152 PNG to `icon-152.png`
   - Rename any 180x180 PNG to `icon-180.png`

---

## Step 4 — Create a GitHub account and push your code

GitHub stores your code online so Vercel can deploy it.

1. Go to https://github.com and create a free account
2. Click the **+** button (top right) → **New repository**
3. Name it `cue-app`, leave everything else default, click **Create repository**
4. GitHub will show you setup commands. In your terminal (in the cue-app folder), run:
   ```
   git init
   git add .
   git commit -m "Initial Cue app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/cue-app.git
   git push -u origin main
   ```
   (Replace `YOUR_USERNAME` with your GitHub username)

5. Refresh the GitHub page — you should see your files there ✓

---

## Step 5 — Deploy to Vercel (free hosting)

1. Go to https://vercel.com and sign up with your GitHub account
2. Click **Add New → Project**
3. Find and click on your `cue-app` repository
4. Vercel auto-detects Vite. The settings should be:
   - Framework: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
5. Click **Deploy**
6. Wait ~1 minute while it builds
7. 🎉 Your app is live! Vercel gives you a URL like `cue-app.vercel.app`

**Every time you change your code:**
```
git add .
git commit -m "describe what you changed"
git push
```
Vercel automatically re-deploys. Usually takes under 30 seconds.

---

## Step 6 — Test the PWA on your phone

1. Open your Vercel URL on your **phone** (in Chrome on Android, or Safari on iPhone)
2. You should see a prompt to "Add to Home Screen"
   - **Android Chrome:** A banner appears at the bottom, or tap the 3-dot menu → "Add to Home Screen"
   - **iPhone Safari:** Tap the Share button (box with arrow) → "Add to Home Screen"
3. Add it, then open from your home screen — it should open fullscreen like a native app ✓

---

## Step 7 (Optional) — Add a custom domain

A custom domain makes the app feel more professional and sellable.

1. Buy a domain at https://namecheap.com or https://porkbun.com (usually $10–15/year)
   - `getcue.app` or `cueapp.io` would be great options
2. In Vercel dashboard: Settings → Domains → Add Domain
3. Follow Vercel's instructions to point your domain's DNS to Vercel
4. Takes up to 24 hours but usually works in under an hour

---

## Troubleshooting

**"command not found: npm"**
→ Node.js isn't installed yet. Go back to Step 1.

**"error: src refspec main does not match any"**
→ Try `git checkout -b main` before the push command.

**App shows blank page on Vercel**
→ In Vercel dashboard, check the "Build Logs" tab for errors. Usually a missing file.

**Icons not showing on phone**
→ Make sure your icons are in `public/icons/` (not `src/icons/`) and are actually PNG files.

**"Add to Home Screen" prompt not appearing**
→ This only works on HTTPS (Vercel gives you this for free). It won't appear on localhost.

---

## What's next after this

Once your app is live, come back and we'll build:

- **Phase 2** — Supabase backend so data syncs across devices and you have user accounts
- **Phase 3** — Push notifications so users actually get reminded
- **Phase 4** — Stripe paywall so you can charge for the app

Each phase builds on the last. You can start charging after Phase 3.
