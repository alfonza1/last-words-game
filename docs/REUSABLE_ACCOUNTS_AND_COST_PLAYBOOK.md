# Reusable Accounts & Cost-Efficiency Playbook

**Purpose:** Hand this to a new project (or a new AI/dev) so it can stand up on the
**same low-cost stack** Dead Keys uses, **reuse the accounts that already exist**,
and apply the same cost-efficiency patterns from day one.

> Conventions: values below are **non-secret identifiers** (project IDs, org names,
> hostnames). Real secrets (DB passwords, API/secret keys, auth tokens) live in
> **GCP Secret Manager** / **GitHub Actions secrets** and are **never** in a repo.
> For a *new* app you keep the same **accounts** but create **new resources**
> (new repo, new Cloud Run service, new DB, new Pages project, new Sentry project).

---

## 1. Reusable accounts (the stack)

| Service | This project's account/IDs | What it does | Free-tier note | How to reuse for a new app |
| --- | --- | --- | --- | --- |
| **GitHub** | account `alfonza1` | Source + Actions CI/CD | Public repos: free Actions. Private: monthly minutes allowance | New repo under same account; copy the workflow pattern. Auths to GCP via OIDC (no keys). |
| **Google Cloud** | project `dead-keys-platform`, region `us-east4` | Hosts the API + supporting services | Generous always-free tiers below | Reuse the same project (separate services) **or** a new project. |
| ↳ Cloud Run | service `dead-keys-api-(uat\|prod)` | Serverless container API | Free monthly requests/CPU/mem; **scale-to-zero** | New Cloud Run service; `min-instances=0`, capped `max-instances`. |
| ↳ Artifact Registry | repo `dead-keys` (Docker, us-east4) | Container images | Storage billed after free tier | New image path; **add a cleanup policy** (see §4). |
| ↳ Secret Manager | e.g. `PROD_SPRING_DATASOURCE_PASSWORD` | Holds secrets | First few secrets/versions free | New secrets per app; grant the runtime SA `secretAccessor`. |
| ↳ Workload Identity Federation | `vars.GCP_WIF_PROVIDER` + deployer SA | Keyless GitHub→GCP auth | Free | Reuse the pool/provider (add the new repo to its attribute condition) or make a new one. **No long-lived JSON keys.** |
| ↳ Cloud Logging | — | Logs/metrics | **50 GiB/project/month free**, then per-GiB | Reuse; control volume (see §4). |
| ↳ IAM service accounts | deployer SA; runtime `dead-keys-prod-runtime@…` | Deploy vs. run identities | Free | Same two-SA pattern (least privilege). |
| **Neon** | org `dead-keys` (Postgres) | Serverless Postgres | Free tier: **scale-to-zero compute**, storage cap, branches | New database **or** Neon branch; new pooled connection string. |
| **Cloudflare** | account (`vars.CLOUDFLARE_ACCOUNT_ID`) | Static hosting + edge | Pages static = free/unlimited | New **Pages** project for the SPA; optional WAF/rate-limit/cache in front of the API later. |
| **Firebase** | project `dead-keys-bd00f` | **Auth** (ID-token verification) | Spark plan: generous auth, free | Share this project's Auth **or** new Firebase project. Server verifies tokens against Google public keys (no secret). |
| **Sentry** | org `dead-keys`, project `dead-keys-api` | Error + perf monitoring | Free monthly error/transaction quota | **New Sentry project per app** (own DSN + quota), same org. |
| **Stripe** | account (placeholder, not active) | Payments | Pay-per-transaction | Same account, new product/keys when monetizing. |

---

## 2. Secrets vs. non-secrets (what may live in the repo)

| Safe in repo / workflow (non-secret) | Must be a secret (Secret Manager / GH secret) |
| --- | --- |
| GCP project ID, region, Artifact Registry repo, service names | DB password |
| Neon **host / database / username**, `?sslmode=require` | Neon **password** |
| Firebase **web config** (API key, authDomain, projectId — public client IDs) | — (Firebase Auth needs no server secret) |
| Sentry **DSN** (write-only ingest key) and `environment` | Sentry **auth token** (source-context upload) |
| Cloud Run flags, `SENTRY_ENVIRONMENT`, feature flags | Stripe **secret key**, webhook signing secret |

Rule of thumb: connection *identifiers* are fine in version control; anything that
*authenticates* is a secret. (DSNs and Firebase web keys look secret but aren't.)

---

## 3. Why this stack is cheap (architecture)

- **Static SPA on Cloudflare Pages** — no server to run the front end; static requests are free/unlimited.
- **Serverless API on Cloud Run, `min-instances=0`** — pay only while serving; a small `max-instances` is a hard cost ceiling. Cold starts are the tradeoff (acceptable at low scale).
- **Serverless DB on Neon, scale-to-zero** — no idle DB cost. **But Neon bills compute-active time**, so the #1 cost lever is *minimizing wakeups* (don't touch the DB on health checks, cold-start scans, or idle polling).
- **Guests stay client-side** — anonymous play lives in `localStorage`; no API/DB cost until sign-in.
- **No idle polling** — an open tab must not call the API on a loop; load on demand (e.g. when a screen opens) and cache public reads.
- **Compact data model** — one aggregate row per user; bounded leaderboards (top N); **no unbounded run-history table.** Don't normalize/add Redis until metrics justify it.
- **Keyless CI (OIDC/WIF)** — no service-account JSON keys to store or rotate.
- **Env-driven config** — DB URL, Sentry DSN, etc. come from env per environment, so **dev/CI stay inert** (no DB/monitoring cost) and each deployed env activates only what it needs.

---

## 4. Cost playbook — apply these to the new app

**Build in from day one**
- Cloud Run `min-instances=0` + small `max-instances`; right-size CPU/memory (start 1 vCPU / 512 MiB–1 GiB).
- Static front end on Pages; code-split by screen.
- Neon pooled connection (`…-pooler…`), `sslmode=require`; let Hibernate `ddl-auto=update` create the schema.
- Health: a **shallow** `/health` (no DB) for uptime checks + a separate `/ready` for the intentional DB check. Point frequent monitors at the shallow one.
- Bound every in-memory cache (size cap + idle expiry) so it fits a small instance.
- Gate one-time migrations behind a flag or a versioned record — **never scan the whole table on every cold start.**

**Operational fixes (cheap, do early)**
- **Artifact Registry cleanup policy** (dry-run first): keep newest ~20 versions, delete old/untagged — bounds image storage.
  ```bash
  gcloud artifacts repositories set-cleanup-policies <REPO> \
    --project=<PROJECT> --location=<REGION> --policy=cleanup-policy.json --dry-run
  ```
- **Log volume:** keep errors/auth-failures/rate-limits/mutations; **don't log frequent successful health checks**; sample high-volume success logs. Stay under the 50 GiB/month free logging tier.
- **Monitoring:** keep 100% error capture, **low/zero** transaction sampling (`sentry.traces-sample-rate`), `send-default-pii=false` unless needed; separate Sentry project per environment.

**Measure first (don't tune on theory)**
- DB connection pool (HikariCP) — measure Neon active-time + p95 latency before shrinking from defaults.

**When traffic grows**
- Put **Cloudflare** in front of the API: cache only public `GET` routes (~30s), **never** authenticated routes; add an edge rate-limit (start in log/challenge mode). Keep the app-level limiter as defense in depth.
- Promote a **validated image by digest** from staging→prod instead of rebuilding (saves CI minutes); deploy by immutable digest.

---

## 5. Cost guardrails to monitor (monthly)

- Cloud Run: requests, instance time, cold starts, p50/p95 latency, 4xx/5xx.
- Neon: **compute-active time**, storage, connection count, slow queries.
- Cloud Logging ingestion (GiB).
- Artifact Registry storage growth.
- GitHub Actions minutes + cache storage.
- DB row count + average/max aggregate JSON size.

---

## 6. Anti-patterns (don't)

- Don't keep Cloud Run **warm** (`min-instances>0`) just to dodge cold starts — that's a constant idle bill.
- Don't add **Redis** for small/bounded data.
- Don't raise `max-instances` before demand data requires it.
- Don't store **service-account JSON keys** — use Workload Identity Federation.
- Don't set `DEADKEYS_GRANT_USER=*` (or any "grant to everyone" flag) in production.
- Don't hardcode the DB password — Secret Manager + `--update-secrets`.
- Don't poll the API from an idle client.

---

## 7. New-service config checklist

Per deployed environment (UAT/prod), set on the Cloud Run service (env or secret):

| Key | Type | Example |
| --- | --- | --- |
| `SPRING_DATASOURCE_URL` | env | `jdbc:postgresql://<neon-pooler-host>/<db>?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | env | `neondb_owner` |
| `SPRING_DATASOURCE_PASSWORD` | **secret** | `--update-secrets=…=<SECRET_NAME>:latest` |
| `SENTRY_DSN` | env (non-secret) | `https://<key>@<org>.ingest.<region>.sentry.io/<project>` |
| `SENTRY_ENVIRONMENT` | env | `production` / `uat` |
| `FIREBASE_PROJECT_ID` | env | only if not using the default |

Deploy flags: `--allow-unauthenticated --min-instances=0 --max-instances=<n> --cpu=1 --memory=512Mi`.
GitHub→GCP auth: OIDC via `google-github-actions/auth` (WIF provider + deployer SA), no keys.
