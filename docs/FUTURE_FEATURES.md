# Future Features

A running list of features we may build, with design notes that fit the existing
architecture. Nothing here is committed to a timeline — it's a backlog to pull from.

## Guiding principles

- **Server-authoritative rewards.** Anything that grants coins, items, or progress
  is validated and applied on the backend (same trust model as runs and purchases).
  The client never grants itself anything.
- **Cosmetics stay cosmetic.** New skins have no effect on score, economy, or
  gameplay, and are code-drawn (SVG + canvas), matching the current system.
- **UTC for time-based logic.** Any daily/seasonal reset uses UTC so behavior is
  consistent across timezones.

---

## Daily challenges

A rotating daily objective — e.g. "survive 6 waves in Math mode", "get 150 kills in
one run", "clear a wave with no mistakes". Completing it grants coins or a cosmetic.

**Design notes**
- The server picks the day's challenge from a deterministic, UTC-dated seed and
  exposes it via an endpoint; the client only displays it.
- Completion is verified server-side from the submitted run (reuse the existing
  run-validation path), and the reward is granted once per UTC day per user.
- Profile gains a couple of fields (e.g. `lastDailyDate`, `dailyClaimed`).

**Edge cases:** one claim per UTC day; reject client-claimed completion; rollover at
00:00 UTC; what counts as "completed" must be re-checked from the run, not trusted.

---

## Streaks

Consecutive-day play streaks with escalating rewards (e.g. day 3, 7, 14, 30).

**Design notes**
- Track `streakCount` and `lastPlayDate` on the profile. On a qualifying run: if the
  last play was "yesterday" (UTC) increment; if it was "today" no-op; otherwise reset
  to 1.
- Reward tiers are granted server-side as the streak crosses each threshold.
- Define "qualifying" up front — a *completed run*, not just opening the app.

**Edge cases:** UTC day boundary; a missed day resets the streak; consider an optional
one-day "streak freeze" (could be a purchasable item later). Pairs naturally with
daily challenges.

---

## Referral rewards

Invite a friend; both earn a reward once the friend signs up and actually plays.

**Design notes**
- Each signed-in user gets a referral code/link. A new user can enter a code at or
  after signup.
- Credit is granted server-side only after the referee hits a real milestone (e.g.
  their first completed run, or N kills) to deter fake-account farming.
- Requires Firebase auth (real accounts) on both sides.

**Edge cases:** block self-referral (same uid/device); one credit per referee; cap
the number of referrals per referrer; make crediting idempotent; handle a referee who
later deletes their account.

---

## Seasonal skins

Limited-time, event-themed cosmetic skins (Halloween, Winter, etc.), in the same vein
as the existing "Exclusive Mythic" set.

**Design notes**
- Reuse the code-drawn cosmetic pipeline (`CharacterAvatar` SVG + `character.ts`
  canvas); add a `season`/availability window to the cosmetic definition and the
  server catalog.
- The server gates purchase/grant by the active UTC date window. Skins already owned
  stay owned and equippable after the window closes.
- Cosmetic-only — no stat, score, or economy effect.

**Edge cases:** availability windows in UTC; decide a re-release policy for past
seasons; out-of-window items can't be bought but remain equippable if owned.

---

## Backlog / ideas

_(Add more here as they come up.)_
