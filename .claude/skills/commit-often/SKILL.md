---
name: commit-often
description: Commit code frequently in small, logical units after making changes to the zombie-text-rush (Dead Keys) repo. Use after completing any working change — a feature increment, bugfix, or refactor — or whenever the user asks to commit/save progress. Keeps the history granular so work is never lost.
---

# Commit often (zombie-text-rush / Dead Keys)

The user wants work committed **frequently**, in small logical chunks, as code changes
are made — not batched into one giant commit at the end. Treat this as standing
authorization to commit in this repo without re-asking each time.

Repo layout (commit from the repo root, `zombie-text-rush/`):
- `client/` — React + TypeScript + Vite game client
- `server/` — Spring Boot (Java) backend / REST API

## When to commit

Commit as soon as a change reaches a **coherent, working state**:
- a feature or sub-feature works
- a bug is fixed
- a refactor is complete and compiles
- a meaningful doc/config change is done

One logical change = one commit. Do **not** lump unrelated changes (e.g. a client
feature + an unrelated server fix) into a single commit — split them.

## Before each commit

1. `git status` and `git diff` to see exactly what changed.
2. Make sure nothing secret or generated is being committed — no `.env`, no
   `node_modules/`, no `client/dist/`, no `server/target/` (they should be gitignored;
   if something slips through, fix `.gitignore` instead of committing it).
3. If a quick check is available and relevant to the change, run it before committing
   (e.g. `cd client && npm run build` for client TS changes; `cd server && ./mvnw -q compile`
   for Java changes). Don't block a commit on a long test suite — keep commits flowing.

## Branch safety

- Never commit straight to `main`. If `git rev-parse --abbrev-ref HEAD` is `main`,
  create a feature branch first (`git checkout -b feature/<short-name>`).
- This repo's normal working branch is a `feature/*` branch — staying there is fine.

## Make the commit

```bash
git add <the specific paths you changed>   # prefer explicit paths over `git add -A`
git commit -m "<message>"
```

Message style — imperative, scoped, concise:
- `client: add zombie speed scaling per wave`
- `server: fix leaderboard sort by coins`
- `docs: clarify backend-is-Java rule in README`

End commit messages with:
```
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

## Don't push unless asked

Commit freely; **only `git push` when the user explicitly asks.** Local commits are the
goal here — they keep history granular and recoverable without touching the remote.
