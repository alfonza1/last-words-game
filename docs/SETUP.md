# Setup guide — turning on the placeholders

Everything below is **wired up and inert until you add the keys/env vars**. Do
them in this order. (Reference: `docs/DEPLOYMENT.md` for hosting + monitoring
strategy and `docs/AUTH_AND_MONETIZATION.md` for the money model.)

Quick map of where env vars go:
- **Server**: real OS env vars on your host (Render/Fly/Railway dashboard), or a
  local shell `export NAME=value` before `java -jar`.
- **Client**: `client/.env` (copy from `client/.env.example`), prefix `VITE_`,
  then rebuild/redeploy the client.

---

## 1. Firebase auth (required — already configured for dev)
You already have a Firebase project (`dead-keys-bd00f`). To run elsewhere/prod:
1. Firebase Console → Project settings → **Your apps → Web** → copy the config
   into `client/.env` (`VITE_FIREBASE_*`).
2. Authentication → **Sign-in method** → enable **Google**.
3. Authentication → Settings → **Authorized domains** → add your prod domain.
4. Server: set `FIREBASE_PROJECT_ID` (defaults to `dead-keys-bd00f`). No secret —
   tokens are verified against Google's public keys.

---

## 2. Database — Postgres (recommended for prod)
Dev runs on embedded H2 automatically (`server/data/…`). For prod durability:
1. Create a Postgres DB. Cheapest good options: **Neon** (neon.tech, free) or
   **Supabase**; or your host's managed Postgres.
2. Grab the connection details and set on the **server**:
   ```
   SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/<dbname>
   SPRING_DATASOURCE_USERNAME=<user>
   SPRING_DATASOURCE_PASSWORD=<password>
   ```
3. Restart the server. Hibernate auto-creates the tables (`ddl-auto=update`).
   The Postgres driver is already bundled — no code change.
> You need: a Postgres instance + its URL/user/password. That's it.

---

## 3. Monitoring — Sentry (errors + logs + email alerts)
1. Create a free account at **sentry.io** → new project.
   - Make a **Spring Boot** project → copy its **DSN**.
   - (Optional) a separate **React** project for the client, or reuse one DSN.
2. **Server**: set `SENTRY_DSN=<dsn>`. Restart. Errors + `ERROR` logs now flow to
   Sentry automatically (the SDK + Logback appender are already bundled).
3. **Client** (optional but recommended):
   - `cd client && npm i @sentry/react`
   - In `src/lib/monitoring.ts`, uncomment the `Sentry.init({ dsn, … })` block.
   - Set `VITE_SENTRY_DSN=<dsn>` in `client/.env`, rebuild.
4. **Email when errors spike**: Sentry → **Alerts → Create Alert → Issues** →
   condition like *"# of events in 1 hour > 25"* → action *"email me / Slack"*.
5. **Uptime**: add **UptimeRobot** (free) monitoring `https://<api>/health`.
6. **Request/access logs** already print to the server console
   (`api.access` logger). To search/retain them, add a log drain from your host
   to **Sentry Logs** or **BetterStack**.
> You need: a Sentry account + DSN. (UptimeRobot account for uptime pings.)

---

## 4. Payments — coin packs via Stripe
Today `POST /api/billing/checkout` returns **503 "coming soon"** until configured.
To go live:
1. Create a **Stripe** account → get your **Secret key** (`sk_…`) and set on the
   server: `STRIPE_SECRET_KEY=sk_live_…` (use `sk_test_…` while testing).
2. Add the Stripe Java SDK to `server/pom.xml` (`com.stripe:stripe-java`).
3. In `ApiController.checkout(...)` (marked `TODO(setup)`), create a **Checkout
   Session** for the requested pack (price comes from `CoinPackCatalog` — never
   trust the client) and return its `url`.
4. Add a **webhook** endpoint for `checkout.session.completed`, verify the
   signature with your **webhook signing secret**, and call
   `ProfileService.grantCoins(profile, pack.coins())`.
5. **Client**: set `VITE_STRIPE_ENABLED=true` in `client/.env`.
> You need: a Stripe account, the secret key, and a webhook signing secret.
> Prices live in two mirrored places: client `data/coinPacks.ts` (display) and
> server `CoinPackCatalog` (charged) — keep them in sync.

---

## 5. Ads — rewarded video + banners
Today the rewarded ad is a 3s placeholder and banners render an empty slot.
1. Pick a provider:
   - **Web portals (best earnings):** publish on **CrazyGames / Poki** and use
     their rewarded-ad SDK.
   - **Your own site:** **Google AdSense for Games / Ad Manager (H5)** for
     rewarded; **AdSense** for banners.
2. **Rewarded:** in `client/src/lib/ads.ts → showRewardedAd()`, call the real SDK
   and resolve when the reward event fires. The server already grants the coins
   securely via `POST /api/profile/reward` (amount = `DEADKEYS_REWARD_COINS`).
3. **Banners:** mount the provider's banner inside `client/src/components/AdBanner.tsx`.
4. Set `VITE_ADS_ENABLED=true` in `client/.env`.
> You need: an approved account with a portal or AdSense/Ad Manager + their SDK
> snippet. (Portals approve games; AdSense needs a site review.)

---

## Env var cheat-sheet
| Feature | Server env | Client `.env` |
|---|---|---|
| Firebase | `FIREBASE_PROJECT_ID` | `VITE_FIREBASE_*` |
| Postgres | `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` | — |
| Monitoring | `SENTRY_DSN` | `VITE_SENTRY_DSN` |
| Payments | `STRIPE_SECRET_KEY` (+ webhook secret) | `VITE_STRIPE_ENABLED=true` |
| Ads | — | `VITE_ADS_ENABLED=true` |
| Reward amount | `DEADKEYS_REWARD_COINS` (default 50) | — |
| CORS | `ALLOWED_ORIGINS` (comma-separated) | — |
| Owner grant | `DEADKEYS_GRANT_USER`, `DEADKEYS_GRANT_COINS` | — |
