# Last Words (zombie-text-rush)

An arcade defense game, live at www.playlastwords.com. Desktop modes (Typing,
Riddle, Math, Trivia Defense) plus hold-to-speak voice controls on mobile;
Dead Keys is the flagship zombie mode, Meteor Mania the family-friendly one.

## Layout and stack

- `client/` — React 18 + TypeScript 5 + Vite 5 + Tailwind 3, tests in Vitest.
- `server/` — Java 17 Spring Boot 3 modular monolith, Maven (`mvnw.cmd` on
  Windows). Deployed to Cloud Run (scale-to-zero); Neon Postgres hosted, H2
  locally; Firebase Auth for identity; Cloudflare Pages serves the client.
- `docs/` — the source of truth for architecture, cost, monetization, mobile,
  and cosmetics decisions. Read the relevant doc before changing an area it
  covers, and update it in the same change when behavior diverges from it.

Key docs: `SYSTEM_ARCHITECTURE_ROADMAP.md` (low-cost modular monolith — new
services/network hops need a proven requirement), `COST_EFFICIENCY_AUDIT.md`
(cost invariants), `COSMETIC_CREATION_GUIDE.md` (how cosmetics are built),
`FUTURE_FEATURES.md` (backlog + guiding principles), `AUTH_AND_MONETIZATION.md`,
`MOBILE_IMPLEMENTATION_GUIDE.md`.

## Verify commands

- Client (run in `client/`): `npm run typecheck`, `npm test`, `npm run build`.
- Server (run in `server/`): `.\mvnw.cmd test` (PowerShell on Windows).

Run the checks relevant to what changed before reporting done or committing.

## Game invariants (do not break these)

1. **Server-authoritative value.** Scores, coins, items, purchases, and
   progress are recomputed and authorized on the backend against the verified
   Firebase user. The client never grants itself currency, items, or
   completion — never add an endpoint that trusts a client-claimed total.
2. **Cosmetics stay cosmetic.** Cosmetic work must not touch score, damage,
   speed, WPM, coins, lives, powerups, zombie/boss behavior, difficulty,
   timing, or leaderboard logic. Cosmetics are code-drawn in two renderers —
   `client/src/components/CharacterAvatar.tsx` (SVG preview) and
   `client/src/game/character.ts` (canvas gameplay) — and must be implemented
   in both.
3. **UTC for time-based logic.** Daily/streak/seasonal resets compare UTC
   dates, and reward claims are idempotent per user per UTC day.
4. **Cost discipline.** Preserve scale-to-zero (`min-instances=0`,
   `max-instances=1`): no idle-client polling, no in-process schedulers or
   keep-alive pings, guest play stays in local storage, leaderboards stay
   capped at 20 rows, profile stays one compact aggregate row, and no new
   deployable/gateway/queue without a requirement the docs acknowledge.

# Repository Working Agreement

## Report the active branch

- Begin every user-facing progress update and final response with
  `Branch: <branch-name>.`
- Check the current branch before reporting it, and check again after any operation
  that may change `HEAD`.
- If `HEAD` is detached, report the short commit SHA instead.

## Commit frequently

Treat this as standing authorization to create local Git commits while implementing
requested changes in this repository.

- Commit after each coherent, working increment: a feature slice, bug fix, refactor,
  test addition, or meaningful documentation/configuration change.
- For larger tasks, prefer several small logical commits over one final bulk commit.
- Before committing, review `git status` and the relevant diff, then run targeted
  validation appropriate to the change.
- Stage explicit paths. Never include unrelated or pre-existing user changes.
- Use concise, scoped commit messages consistent with the repository history, such as
  `client: add wave speed scaling` or `server: reject duplicate usernames`.
- Do not commit secrets, generated outputs, dependency directories, or knowingly
  broken code unless the user explicitly requests a checkpoint commit.
- Do not commit directly to `main`; create or use a feature branch.
- Do not push commits or open a pull request unless the user explicitly asks.

## Think about edge cases and trade-offs

Don't just build the happy path. Surface the implications a change creates, even when
the user didn't ask — then proceed with a sensible default rather than blocking.

- Call out second-order effects: balance/fairness (e.g. a mobile-only speed change
  giving solver runs an edge on a shared leaderboard), security, performance, cost,
  data migration, and backwards compatibility.
- Expose the tuning knobs: when behavior hinges on a constant or threshold, name it,
  keep it in one place, and tell the user how to adjust it.
- Consider the boundaries: empty/zero/overflow inputs, first/last item, offline and
  signed-out states, mobile vs desktop, and concurrent or repeated actions.
- State the trade-off and your assumption so the user can course-correct.

## Follow Clean Code best practices

Write code in the spirit of Robert C. "Uncle Bob" Martin's *Clean Code*.

- Intention-revealing names; no magic numbers — name the constant.
- Small functions that do one thing at a single level of abstraction.
- Prefer self-explanatory code over comments; when you do comment, explain the *why*,
  not the *what*.
- DRY — extract real duplication, but don't over-abstract before a second use exists.
- Keep side effects obvious and localized; functions should hold no surprises.
- Leave each file cleaner than you found it (the Boy Scout Rule), matching the
  surrounding style.
