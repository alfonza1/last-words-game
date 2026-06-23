# Deployment, Monitoring & Ads

Practical, cheap-first guide for shipping Dead Keys (`client/` static SPA +
`server/` Spring Boot API) and making money from it.

---

## 1. Deployment strategy

### Architecture
- **client/** builds to static files (`npm run build` → `dist/`). Host on a CDN.
- **server/** is a Spring Boot jar. Host on a small always-on container/VM.
- The client talks to the server over HTTPS at `/api`. In prod, point the client
  at the API with `VITE_API_BASE` (build-time) or a same-origin reverse proxy.

### Recommended cheap setup
| Piece | Service | Cost |
|------|---------|------|
| Client (static) | **Cloudflare Pages** or **Netlify** / **Vercel** | Free |
| API (server) | **Render** / **Railway** / **Fly.io** (Docker) | Free–$5/mo |
| DB (when you add real accounts) | **Neon** or **Supabase** Postgres | Free tier |
| CDN / WAF / DDoS | **Cloudflare** in front of everything | Free |
| Auth | **Firebase Authentication** (already wired) | Free at indie scale |

### Steps
1. **Client**
   - Set `VITE_API_BASE=https://api.yourdomain.com` (or use a proxy so `/api`
     is same-origin and you can leave it blank).
   - `cd client && npm ci && npm run build`, deploy `dist/`.
2. **Server**
   - Containerize with the existing `server/Dockerfile` and deploy to Render/Fly.
   - Set env: `PORT` (platform-provided), `ALLOWED_ORIGINS=https://yourdomain.com`,
     and **do NOT** set `DEADKEYS_DEV` (keeps the dev coin-grant disabled).
   - Persist `dk-data.json` on a mounted volume **or** migrate to Postgres before
     real traffic (the JSON file won't survive container redeploys otherwise).
3. **Firebase**
   - Add your production domain under Authentication → Settings → **Authorized domains**.
4. **Cloudflare** (strongly recommended)
   - Proxy the domain (orange cloud) for free TLS, caching, and DDoS protection.
   - Add a rate-limiting rule on `/api/*` as a second layer to the app's limiter.

### Security already in place (this repo)
- Per-IP **rate limiting** on `/api/*` (`RateLimitFilter`).
- **CORS allowlist** via `ALLOWED_ORIGINS` (locked down in prod).
- The **dev coin-grant is disabled** unless `DEADKEYS_DEV=true`.
- Basic security headers (`X-Content-Type-Options`, `Referrer-Policy`).

### Security still to do before "real money"
- **Verify the Firebase ID token in the server** and key each profile to the
  token's `uid` so a player can only modify *their own* profile. Today the API
  trusts the `guestId` from the client — fine for launch/leaderboards, **required**
  before purchases involve real money. (See `AUTH_AND_MONETIZATION.md`, Phase 1.)
- Move from the JSON file to **Postgres** (transactions + durability).
- Server-side sanity caps on `/run` (max plausible score/coins) to stop spoofed runs.

---

## 2. Monitoring (cheap / free)

### ⭐ Recommended budget AIO: **Sentry**
For "monitor errors + logs + get an email when errors spike," **Sentry** is the
best single tool on a budget — its free tier covers error tracking (client +
server, with stack traces), **logs**, performance traces, and **email/Slack
alerts with thresholds**, all in one dashboard. It's already wired in:

- **Server** — the Sentry Spring Boot starter + Logback appender are bundled.
  They stay **disabled until you set `SENTRY_DSN`**. Once set, every `ERROR` log
  (and unhandled exception) becomes a Sentry event.
- **Client** — `src/lib/monitoring.ts` is the single init point. To finish:
  `npm i @sentry/react`, set `VITE_SENTRY_DSN`, and uncomment the init block.

**Email-on-threshold setup (Sentry):** Dashboard → **Alerts → Create Alert →
Issues** → condition e.g. *"number of events in 1 hour > 25"* → action *"send
email to me / Slack"*. Add a second metric alert on the error *rate* if you want
spike detection. Free plan includes alerting.

**Request/access logs:** the server now logs every API call
(`api.access` logger: method, path, status, uid, duration) and all purchases.
On Render/Fly/Railway these go to the platform log stream — add a **log drain**
to Sentry Logs or **BetterStack** to search/retain them and alert on patterns.

| Need | Service | Free tier |
|------|---------|-----------|
| **Errors + logs + alerts (AIO)** | **Sentry** ⭐ | errors, logs, perf + email/Slack threshold alerts |
| **Uptime / "is it down?"** | **UptimeRobot** or **BetterStack** | ping `/health` every 1–5 min, alert by email/SMS |
| **Log search / retention** | **BetterStack (Logtail)** or **Grafana Loki** | ship server stdout via a log drain |
| **Web analytics** | **Cloudflare Web Analytics** or **Plausible** | free / cheap |

**Minimum to start:** set `SENTRY_DSN` (errors + logs + email alerts) +
**UptimeRobot** on `/health`. That covers "is it up, is it erroring, email me
when it spikes" for $0.

---

## 3. Ads — what actually makes the most money

For a browser typing game, **distribution is the revenue**. The biggest, easiest
money is usually from **HTML5 game portals**, not self-served ads.

### Best earners, in order
1. **Game portals — Poki, CrazyGames, Y8, GameMonetize.** You publish the game on
   their site; they handle ads (incl. **rewarded video**) and pay rev-share. They
   bring the *audience*, which is the hard part. Rewarded ads here pay far better
   per view than banner ads, and integrate cleanly with our "watch ad → server
   grants coins/revive" flow. **This is the highest-ROI path for a web game.**
2. **Rewarded video on your own site — Google AdSense for Games / Google Ad
   Manager (H5)**, or networks like **Playwire / Snigel / AdinPlay** once you have
   traffic (they often need a traffic minimum). Rewarded > interstitial > banner
   for both revenue and player goodwill.
3. **Banner / display — Google AdSense.** Easy to add around the canvas, but low
   revenue for a game. Fine as a baseline.
4. **If you wrap it as a mobile app later (Capacitor): Google AdMob** rewarded
   ads are the standard and pay well — but the app stores take 15–30% of any IAP.

### Recommendation
- **Phase 1:** launch on the web + **submit to CrazyGames and Poki** and use their
  rewarded-ad SDK. Tie rewards to the server (a verified nonce → grant coins) so
  it can't be faked.
- **Phase 2:** add **coin packs via Stripe** (~3% fees, web) for players who'd
  rather pay than watch ads — usually your highest revenue-per-user.
- Keep purchases **cosmetic / convenience, never pay-to-win** (better retention,
  avoids loot-box rules).

> Net: portals (rewarded ads) for reach + Stripe coin packs for whales =
> the most money for the least platform tax on the web.

### What's already built (placeholders to finish)
These are wired into the UI/flow now and degrade gracefully until configured:

- **Rewarded ad after every match** — Game Over shows an optional *"Watch ad for
  +50 coins"* button. It runs a placeholder ad (`src/lib/ads.ts → showRewardedAd`)
  then calls the **server-authoritative** `POST /api/profile/reward` (20s
  cooldown, configurable via `DEADKEYS_REWARD_COINS`). To go live: drop the real
  rewarded SDK into `showRewardedAd()` and set `VITE_ADS_ENABLED=true`.
- **Banner ads** — `<AdBanner/>` renders an empty labelled slot only when
  `VITE_ADS_ENABLED=true`; mount the real AdSense/portal banner there.
- **Coin packs (Stripe)** — the Store shows packs (`src/data/coinPacks.ts` ↔
  server `CoinPackCatalog`). `POST /api/billing/checkout` returns **503 "coming
  soon"** until you set `STRIPE_SECRET_KEY`. To finish: in that endpoint create a
  Stripe Checkout Session for the pack and return its `url`; add a webhook that
  calls `ProfileService.grantCoins(...)` after `checkout.session.completed`
  (verify the webhook signature). Keep the price server-side (never trust the
  client).

### Setup checklist (env vars to flip these on)
| Feature | Server env | Client env |
|---------|-----------|-----------|
| Postgres | `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` | — |
| Coin packs | `STRIPE_SECRET_KEY` (+ webhook secret) | `VITE_STRIPE_ENABLED=true` |
| Ads (rewarded + banner) | — | `VITE_ADS_ENABLED=true` |
| Error monitoring | `SENTRY_DSN` | `VITE_SENTRY_DSN` |
| Rewarded coin amount | `DEADKEYS_REWARD_COINS` (default 50) | — |
| CORS allowlist | `ALLOWED_ORIGINS` | — |
