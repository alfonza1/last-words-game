# Dead Keys Cost-Efficiency Audit

**Reviewed:** June 25, 2026  
**Scope:** Client, Spring Boot API, Neon Postgres usage, Cloud Run deployment, Cloudflare Pages, logging, and CI/CD  
**Constraint:** Findings only. No cost-efficiency logic or infrastructure changes were made as part of this audit.

## Executive summary

Dead Keys is already inexpensive at its current scale:

- Cloudflare Pages serves the client as static files.
- The client does not poll the API while a player sits idle.
- Guest play stays in local storage and does not use the API.
- Cloud Run is configured with zero minimum instances and one maximum instance.
- Player data is one compact profile aggregate, not an ever-growing run-history table.
- Each leaderboard is capped at 20 rows.
- Gameplay rendering, audio, timers, and input handling run in the browser.

The highest-value savings are logic and operations improvements that do not alter gameplay:

1. Stop scanning every profile during every server cold start.
2. Bound and expire the in-memory rate-limit map.
3. Make the standard health endpoint database-free.
4. Reduce routine successful-request log volume if traffic grows.
5. Measure and right-size the database connection pool.
6. Add Artifact Registry cleanup and avoid rebuilding the same release image twice.

## Current cost-efficient behavior worth keeping

| Area | Current behavior | Assessment |
| --- | --- | --- |
| Idle client | No API polling is present; profile bootstrap happens on identity change and leaderboard data loads when its screen opens. | Keep. An open browser tab should not continuously invoke Cloud Run from application code. |
| Guest users | Guest progress and purchases are local. | Keep. Guest play has effectively no API/database cost. |
| Static hosting | The Vite client is deployed to Cloudflare Pages and is code-split by screen. | Keep. Static asset requests on Pages are free and unlimited when they do not invoke Functions. |
| Cloud Run | `min-instances=0`, `max-instances=1`, `concurrency=40`, 1 CPU, and 512 MiB memory. | Strong cost cap for the current stage. Keep until metrics show capacity pressure. |
| Profile storage | One profile row contains current stats and inventory. No per-run history is stored. | Efficient at current data size. Do not normalize or split this solely for cost. |
| Leaderboards | Only the top 20 entries per board are retained. | Excellent hard storage bound. |
| Public leaderboard | Responses include a 30-second public cache policy with 60 seconds of stale-while-revalidate. | Useful browser caching; shared edge caching requires the API to pass through a cache-capable proxy/CDN. |

## Prioritized findings

### 1. Remove the cold-start full-profile scan

**Priority:** High  
**Expected benefit:** Lower cold-start latency, database reads, database wake time, and migration write traffic as the user count grows  
**Gameplay risk:** None

`LegacyProfileDataCleaner` is an `ApplicationRunner` and calls `profiles.findAll()` every time the server starts. It then parses every stored profile and writes profiles that still contain retired weak-word data.

This cleanup is appropriate as a one-time migration, but it should not remain in the normal startup path permanently. Cloud Run can cold start repeatedly, so the cost changes from constant to proportional to the total number of users.

**Recommendation**

- Confirm the legacy field has been removed from production and UAT data.
- Replace the startup component with either:
  - a one-time, explicitly run migration; or
  - a versioned migration record that guarantees the scan runs once per database.
- If a large migration is ever needed, process profiles in pages rather than loading the full table.
- Remove the cleaner after verification.

**Code evidence**

- `server/src/main/java/com/deadkeys/persistence/LegacyProfileDataCleaner.java:14`
- `server/src/main/java/com/deadkeys/persistence/LegacyProfileDataCleaner.java:28`

### 2. Bound the in-memory rate-limit map

**Priority:** High  
**Expected benefit:** Prevent gradual memory growth and avoid unnecessary 512 MiB instance pressure  
**Gameplay risk:** None if expiry is longer than the rate-limit window

`RateLimitFilter` stores one bucket per observed IP address in a `ConcurrentHashMap`, but old IPs are never removed. Normal traffic may grow it slowly; hostile traffic can grow it quickly.

**Recommendation**

- Replace the raw map with a bounded cache that expires entries after inactivity, for example:
  - maximum size appropriate to expected traffic; and
  - expiry after 1–5 minutes, safely above the 10-second rate window.
- Retain the current request limit behavior.
- Keep this origin limiter even if an edge limiter is added.

**Code evidence**

- `server/src/main/java/com/deadkeys/security/RateLimitFilter.java:29`
- `server/src/main/java/com/deadkeys/security/RateLimitFilter.java:60`

### 3. Split liveness from database readiness

**Priority:** High  
**Expected benefit:** Fewer database queries and fewer avoidable Neon wakeups from deployment checks or external uptime monitors  
**Gameplay risk:** None

Both `/health` and `/api/health` currently count profile and leaderboard rows. Every health request therefore executes two database queries. Deployment smoke tests call `/api/health`, and future monitoring may call it repeatedly.

**Recommendation**

- Make `/health` a shallow liveness response containing only process status and version.
- Add a separate `/ready` or `/api/ready` endpoint for an intentional database check.
- Do not return table row counts in routine health responses.
- Use shallow health for frequent uptime checks.
- Use readiness during deployment only when verifying database connectivity is specifically required.

**Code evidence**

- `server/src/main/java/com/deadkeys/controller/ApiController.java:48`
- `server/src/main/java/com/deadkeys/controller/ApiController.java:51`
- `.github/workflows/deploy-uat.yml:108`
- `.github/workflows/deploy-production.yml:116`

### 4. Control successful access-log volume

**Priority:** Medium now; High after traffic growth  
**Expected benefit:** Lower Cloud Logging ingestion and easier incident searches  
**Gameplay risk:** None

Every `/api/` request is logged at `INFO`, including successful health checks and leaderboard reads. This is useful at low volume and likely remains inside Google Cloud's free logging allotment, but it scales directly with traffic.

**Recommendation**

- Continue logging errors, authentication failures, rate limits, purchases, rewards, and profile mutations.
- Sample routine successful `GET /api/leaderboard` requests.
- Stop application-level logging for frequent successful health checks.
- Alternatively, apply a `_Default` log-sink exclusion for selected low-value success logs.
- Review actual monthly log ingestion before changing behavior; do not reduce useful security or error evidence blindly.

Google currently includes the first 50 GiB per project per month for most Cloud Logging storage, then charges by ingested volume. Sink exclusion filters can prevent selected logs from being stored in the destination bucket.

**Code evidence**

- `server/src/main/java/com/deadkeys/security/RequestLogFilter.java:40`
- `server/src/main/resources/application.properties:47`

### 5. Measure and right-size the Hikari connection pool

**Priority:** Medium  
**Expected benefit:** Fewer database connections and potentially less Neon active time  
**Gameplay risk:** Low only after UAT load testing; an undersized pool can increase latency

No Hikari pool limits are configured. HikariCP's documented defaults are a maximum pool size of 10 and a minimum idle value equal to the maximum. For this application, Cloud Run is capped at one 1-vCPU instance and most requests perform short database work.

Do not change this based on theory alone. Cloud Run can retain open database connections while an instance is idle, and Neon scales inactive compute to zero. The useful question is whether the current pool measurably keeps Neon active or uses more connections than necessary.

**Recommendation**

1. Record current Neon compute-active time, connection count, Cloud Run p95 latency, and request concurrency.
2. In UAT, test a smaller maximum pool such as 4–5 and a low minimum idle value.
3. Compare cold-start and warm-request latency under realistic concurrent requests.
4. Adopt the smaller pool only if latency and errors remain unchanged.

This is deliberately a measured change, not an automatic recommendation to set the pool to zero.

**Code evidence**

- `server/src/main/resources/application.properties:10`
- `.github/workflows/deploy-uat.yml:104`
- `.github/workflows/deploy-uat.yml:106`

### 6. Put shared caching and abuse controls in front of the API when traffic warrants it

**Priority:** Medium  
**Expected benefit:** Fewer Cloud Run invocations and better protection against automated origin traffic  
**Gameplay risk:** None when authenticated routes are never cached

The public leaderboard sends a cacheable response, but the configured API base is a direct Cloud Run service URL unless a custom proxy has been added outside this repository. Browser caching helps an individual client; it does not provide a shared cache across users.

The origin rate limiter also runs only after a request has already reached Cloud Run, so it protects application work but cannot prevent the invocation itself.

**Recommendation**

- When public traffic becomes meaningful, route a custom API hostname through Cloudflare.
- Cache only the public `GET /api/leaderboard` route for roughly 30 seconds.
- Never cache authenticated profile, purchase, reward, or run-submission routes.
- Add a conservative edge rate limit for API abuse, initially in log or challenge mode.
- Keep the current application limiter as defense in depth.

**Code evidence**

- `server/src/main/java/com/deadkeys/controller/ApiController.java:164`
- `server/src/main/java/com/deadkeys/controller/ApiController.java:170`
- `server/src/main/java/com/deadkeys/security/RateLimitFilter.java:47`

### 7. Add Artifact Registry cleanup policies

**Priority:** Medium  
**Expected benefit:** Prevent unbounded container-image storage growth  
**Gameplay risk:** None

Every deployment publishes an image tagged by commit SHA. No repository-managed cleanup policy is present in source, and the existing setup checklist still marks cleanup rules as unfinished.

**Recommendation**

- First create a dry-run cleanup policy.
- Keep images currently deployed to UAT and production.
- Keep a practical recent rollback window, such as the newest 10–20 versions.
- Delete older untagged or obsolete commit images after the dry-run output is verified.

**Code evidence**

- `.github/workflows/deploy-uat.yml:61`
- `.github/workflows/deploy-production.yml:69`
- `docs/REMAINING_SETUP.md:172`

### 8. Promote a validated server image instead of rebuilding it for production

**Priority:** Medium/Low  
**Expected benefit:** Fewer CI minutes, build-cache writes, registry layers, and release variance  
**Gameplay risk:** None

UAT and production both build the server image. If a production release points to the exact commit already validated in UAT, rebuilding the container repeats work and produces a second artifact rather than promoting the tested artifact.

**Recommendation**

- If environment isolation permits, promote or copy the exact UAT image digest into the production registry.
- Deploy production by immutable digest, not a mutable tag.
- If UAT and production must build in separate trust boundaries, keep the current process and treat this as a low-priority tradeoff.

GitHub-hosted Actions minutes are metered for private repositories after plan allowances, so this matters mainly when deployment frequency grows.

**Code evidence**

- `.github/workflows/deploy-uat.yml:84`
- `.github/workflows/deploy-production.yml:92`

### 9. Keep profile persistence simple for now

**Priority:** No immediate change  
**Expected benefit:** Avoid unnecessary engineering and operational overhead  
**Gameplay risk:** A redesign would create more risk than current cost justifies

Each user currently has:

- one profile row containing stats, wallet, upgrades, maps, cosmetics, expression, and current loadout;
- at most one leaderboard row on each of the two boards; and
- no stored run history or weak-word history.

The application reads and writes the full profile aggregate for mutations. That is acceptable while the document remains small. Splitting every field into normalized tables, adding Redis, or introducing event sourcing would increase complexity and likely cost more than it saves.

**Recommendation**

- Keep the current aggregate until profile payload size or write contention becomes measurable.
- Add a lightweight profile-size metric or periodic query before considering a redesign.
- Revisit only if typical profile JSON becomes large, concurrent writes are lost, or specific fields need indexed queries.

**Code evidence**

- `server/src/main/java/com/deadkeys/persistence/ProfileEntity.java:21`
- `server/src/main/java/com/deadkeys/persistence/ProfileStore.java:65`
- `server/src/main/java/com/deadkeys/persistence/ProfileStore.java:28`

### 10. Review tracing before enabling paid monitoring volume

**Priority:** Low  
**Expected benefit:** Avoid unnecessary third-party trace volume  
**Gameplay risk:** None

Sentry is disabled when no DSN is configured. If enabled later, the current trace sample rate is 10%.

**Recommendation**

- Start production tracing at a lower percentage if traffic is significant.
- Keep 100% error capture while sampling successful transactions.
- Use separate UAT and production projects and quotas.

**Code evidence**

- `server/src/main/resources/application.properties:42`

## Changes that are not recommended for cost reasons

- Do not keep Cloud Run permanently warm solely to remove cold starts. It directly increases idle cost.
- Do not add Redis solely for the 20-row leaderboards or compact profiles.
- Do not defer completed-run saves in a way that risks losing player progress.
- Do not reduce browser render rate, audio quality, zombie counts, game logic, or input responsiveness.
- Do not remove authentication or server-authoritative purchase/run checks.
- Do not increase `max-instances` until demand or availability data requires it.
- Do not over-optimize static assets; the current code splitting and Cloudflare Pages deployment are already appropriate.

## Suggested implementation order

1. Remove or permanently gate `LegacyProfileDataCleaner` after verifying the migration.
2. Add expiry and a size limit to rate-limit buckets.
3. Split shallow health from database readiness.
4. Configure Artifact Registry cleanup in dry-run mode.
5. Measure logging, Neon active time, database connections, and Cloud Run latency for at least one representative period.
6. Based on measurements, tune logs and the connection pool.
7. Add shared edge caching/rate limiting only when public API traffic justifies the infrastructure work.
8. Promote immutable images when the production release process is ready for it.

## Cost guardrails to monitor

Track these monthly before making larger architecture changes:

- Cloud Run request count, instance time, cold starts, p50/p95 latency, and 4xx/5xx rates.
- Neon compute-active time, storage, connection count, and slow queries.
- Cloud Logging ingestion volume.
- Artifact Registry storage growth.
- GitHub Actions minutes and cache storage.
- Profile row count and average/max profile JSON size.
- Leaderboard request volume and cache hit ratio after an edge proxy exists.

## Official references

- [Cloud Run billing settings](https://docs.cloud.google.com/run/docs/configuring/billing-settings)
- [Cloud Run minimum instances](https://docs.cloud.google.com/run/docs/configuring/min-instances)
- [Cloud Run autoscaling and idle instances](https://docs.cloud.google.com/run/docs/about-instance-autoscaling)
- [Cloudflare Pages pricing](https://developers.cloudflare.com/pages/functions/pricing/)
- [Cloudflare rate-limiting rules](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- [Google Cloud Observability pricing](https://cloud.google.com/products/observability/pricing)
- [Cloud Logging routing and exclusion filters](https://docs.cloud.google.com/logging/docs/routing/overview)
- [Artifact Registry cleanup policies](https://docs.cloud.google.com/artifact-registry/docs/repositories/cleanup-policy)
- [Neon connection latency and scale to zero](https://neon.com/docs/connect/connection-latency)
- [Neon production connection-pooling guidance](https://neon.com/docs/get-started/production-checklist)
- [HikariCP configuration defaults](https://github.com/brettwooldridge/HikariCP#gear-configuration-knobs-baby)
- [GitHub Actions billing](https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
