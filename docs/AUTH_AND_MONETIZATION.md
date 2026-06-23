# Auth & Monetization Plan

Planning doc for adding **user sign-in** and, later, **ads / rewarded ads /
cosmetic shop / coin packs** to Dead Keys. Nothing here is implemented yet — it's
the agreed direction so we can build it in the right order.

---

## Current architecture (starting point)

```
zombie-text-rush/
  client/   React + TS + Vite SPA. Guest id in localStorage (dk.guestId).
  server/   Spring Boot REST API. In-memory store persisted to a JSON file
            (server/dk-data.json). No auth. No real database.
```

- The server is already **authoritative for progress** (stats, coins, upgrades,
  leaderboard). The client only holds the guest id + device settings.
- There is already a **guest profile** model — sign-in should *upgrade* a guest
  into a real account without losing progress.

### ⚠️ The one prerequisite: a real database

The JSON file is fine for solo testing but **must be replaced before real
accounts or real money**. Coin packs = payments = you need transactions,
durability, idempotency, and an audit trail. Free managed Postgres options:
**Neon**, **Supabase**, **Railway**, **Render**. Auth and DB are effectively one
decision (see Supabase below).

---

## Sign-in options

| Option | $ Cost | Fit with this stack | Verdict |
|---|---|---|---|
| **Firebase Authentication** | Free for email / Google / anonymous at indie scale | Client SDK signs in → sends a JWT; Spring verifies it with the Firebase Admin SDK (Java). Keep your own DB. Built-in **anonymous** auth maps 1:1 onto the current guest model. | **Best for budget + speed.** |
| **Supabase (Auth + Postgres)** | Free tier (~50k MAU **+ a Postgres DB**) | Auth *and* the database you'll need anyway, in one. Spring verifies its JWT via JWKS. | **Best "build for the future"** — solves auth + DB together. |
| **Spring Security OAuth2 ("Sign in with Google")** | Free (just a Google OAuth client) | Native to Spring, no auth vendor. More SPA cookie/CORS plumbing. | Good if you want zero auth vendors. |
| **Roll your own (email + password)** | Free | Most work; you own password security, resets, breaches. | Not worth it. |

### Recommendation
- **Cheapest / fastest:** **Firebase Auth** (anonymous + Google + email) + a free
  managed **Neon** Postgres.
- **One bet that covers everything:** **Supabase** (Auth + Postgres free tier).

Either way the server change is small:
1. Add a **token-verification filter** (verify JWT on each request).
2. Key the `Profile` by the auth **`uid`** instead of the localStorage `guestId`.
3. Add a **guest → account merge** on first sign-in so existing progress carries
   over (merge stats: max for records, sum for totals; keep the higher coins).
4. Keep **anonymous/guest play** working; signing in just claims the profile.

> Server stays authoritative for coins/inventory — never trust the client.

---

## Monetization plan (phased)

### Phase 1 — Accounts + DB + hardening
- Move the store from `dk-data.json` to **Postgres**.
- Add auth (above); profile keyed by `uid`; guest→account merge.
- **Anti-abuse:** server-side sanity checks on `POST /run` (cap plausible
  score/coins per run), rate-limit submissions, tie the "real" leaderboard to
  authenticated accounts. A client can currently POST a fake run — close that.

### Phase 2 — Cosmetic shop (spend coins)
- Cosmetics only — **no pay-to-win** (friendlier, avoids loot-box/regulatory
  issues). Good candidates already exist: maps, weapon sounds, plus new zombie /
  turret skins and name colors.
- Server-side **catalog** + per-profile **inventory** / **entitlements**.
- `POST /api/profile/{id}/purchase { itemId }` → server validates price + that it
  isn't already owned, deducts coins, grants the item.

### Phase 3 — Coin packs (real money)
- **Stripe Checkout** for web (~2.9% + 30¢):
  1. Client asks the server to create a Checkout Session.
  2. Stripe hosts the payment page.
  3. **Stripe webhook → server credits coins** (idempotent by event id; store the
     order). **Never credit coins from the client.**
- Requires the DB (orders + idempotency). Stripe can handle tax.
- (If you later ship a mobile app, you must use store IAP — Apple/Google take
  15–30% — vs Stripe's ~3% on web.)

### Phase 4 — Ads + rewarded ads
- **Honest take:** web ad revenue for a canvas game is best via **game portals**.
  Publishing on **CrazyGames / Poki / Y8** gives you a **rewarded-ad SDK + an
  audience** (they handle ad fill + payment).
- **Rewarded flow:** client plays the ad → on completion, the **server grants the
  reward** (coins / a revive) verified with a one-time nonce so it can't be faked.
- Self-hosted alternative: **Google AdSense / Ad Manager** banners around the
  canvas (low revenue); rewarded on the open web is weak.
- **Mobile** (if wrapped with Capacitor later): **Google AdMob** rewarded ads
  with server-side verification callbacks.

---

## Suggested build order

1. **Auth + Postgres** (Firebase Auth + Neon, or Supabase) + guest→account merge.
2. **Harden** coins/leaderboard (server validation, rate limits).
3. **Cosmetic shop** (coins → items, server-validated).
4. **Coin packs** (Stripe Checkout + webhooks).
5. **Rewarded ads** (portal SDK now, or AdMob if/when you go mobile).

## Default to implement first (when you say go)
**Firebase Auth + Neon Postgres**, starting with sign-in + the guest→account
merge — or **Supabase** if you prefer auth + DB from one vendor.
