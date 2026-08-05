# Contract Research Services — a marketplace demo

A single-page marketplace where research experts apply, an admin verifies them, sponsors hire, and payment is released on delivery. Built with plain **HTML, CSS and JavaScript** — no build step, no backend. All data lives in the browser's `localStorage`, and **payments are simulated** (no real money moves).

## The full loop

1. **Experts apply** — `Offer your expertise` collects specialism, rate, bio and skills. Nothing is public yet.
2. **Admin verifies** — `Viewing as → Admin` (password `admin`) shows the review queue. Approve to give an expert the gold verified seal and put them live.
3. **Sponsors hire** — Browse verified experts, open a profile, and send a project request.
4. **Work happens** — In `Viewing as → Expert dashboard`, the expert accepts the project and marks it complete.
5. **Payment released** — Back in the sponsor dashboard (`My hires`), release payment. A simulated receipt is issued, the expert's earnings update, and the sponsor can leave a rating.

> Tip: because it's a single-person demo, use the **Viewing as** switcher (top right) to move between Sponsor, Expert dashboard and Admin and walk the whole flow yourself.

## Run locally

It's a static site — just open `index.html`, or serve the folder:

```bash
npx serve .
# or
python3 -m http.server 3000
```

## Deploy to Vercel

**Option A — drag & drop:** zip this folder (or push it to GitHub) and import it at [vercel.com/new](https://vercel.com/new). No framework preset needed — Vercel serves it as static output automatically.

**Option B — CLI:**

```bash
npm i -g vercel
vercel        # preview deploy
vercel --prod # production
```

There's no build command and no environment variables. The included `vercel.json` just adds clean URLs and a couple of security headers.

## Reset the demo

Data persists in your browser. To start fresh, clear site data / `localStorage`, or run in the browser console:

```js
localStorage.removeItem("crs_v1"); location.reload();
```

## Files

```
index.html      — markup and all view containers
css/styles.css  — design system (pine + gold palette)
js/app.js       — state, seed data, rendering, project/payment lifecycle
vercel.json     — static hosting config
```
