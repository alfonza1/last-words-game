# Dead Keys Low-Cost System Architecture Roadmap

Last reviewed: June 25, 2026

## Recommendation

Keep Dead Keys as a **modular monolith** for now:

- one React frontend;
- one Spring Boot API deployed to Cloud Run;
- one Postgres database per environment;
- Firebase Authentication for identity;
- Cloudflare for DNS, TLS, static hosting, caching, WAF, and edge rate limits;
- Cloud Tasks for background work when asynchronous jobs are needed; and
- separate deployable services only after a domain has a proven scaling,
  security, ownership, or reuse requirement.

This gives the project most of the operational benefits associated with a
larger architecture without paying the financial and engineering cost of
Kubernetes, a service mesh, Kafka, or many independently deployed services.

An API gateway is useful later, but it is not the first missing component.
Cloudflare plus the existing Firebase token verification already covers the
initial public edge. Add Google Cloud API Gateway when Dead Keys has multiple
backend services, third-party API consumers, API-key quotas, or a strong need
for centralized OpenAPI routing and analytics.

## Current architecture

```text
Browser
  |
  +-- Cloudflare Pages: React/Vite application
  |
  +-- Firebase Authentication: sign-in and ID tokens
  |
  `-- Spring Boot API
        |
        +-- Firebase token verification
        +-- profile, progression, shop, rewards, billing, leaderboard
        `-- JPA -> H2 locally / Postgres in hosted environments
```

The current design is appropriate for an early game, but the server has several
concentrated responsibilities:

- `ApiController` exposes most of the API from one controller.
- `ProfileService` handles account creation, guest import, runs, rewards,
  purchases, inventory, character configuration, and profile normalization.
- most profile state is serialized into one JSON database column;
- the leaderboard is relational, but profile-owned data is not;
- rate limiting is stored in memory and therefore is not shared by multiple
  Cloud Run instances;
- the custom health endpoint does not provide standard readiness, liveness,
  metrics, or dependency health;
- schema changes currently rely on Hibernate rather than versioned migrations;
- payment orders, webhook events, idempotency records, and an event outbox do
  not exist yet; and
- background work has no durable queue.

These are reasons to improve boundaries and reliability inside the application,
not reasons to split every domain into a network service.

## Target low-cost architecture

```text
                                  +----------------------+
                                  | Firebase Auth        |
                                  | identity provider    |
                                  +----------+-----------+
                                             |
+---------+       +---------------------------v-------------------------+
| Browser | ----> | Cloudflare                                      |
+---------+       | Pages + DNS/TLS + CDN + WAF + edge rate limiting |
                  +---------------------------+-------------------------+
                                              |
                            optional later: Google API Gateway
                                              |
                  +---------------------------v-------------------------+
                  | Cloud Run: Spring Boot modular monolith            |
                  |                                                     |
                  | identity | profile | gameplay | store | billing    |
                  | rewards  | catalog | leaderboard | operations      |
                  +-----------+-------------------+---------------------+
                              |                   |
                    +---------v---------+   +-----v------------------+
                    | Neon Postgres     |   | Cloud Tasks           |
                    | separate UAT/prod |   | durable async jobs    |
                    +-------------------+   +-----+------------------+
                                                    |
                                      +-------------v--------------+
                                      | authenticated worker route |
                                      | or worker Cloud Run service |
                                      +----------------------------+

Logs, metrics, traces, errors:
Cloud Logging + Spring Actuator/Micrometer + OpenTelemetry + Sentry
```

Google API Gateway is intentionally shown as optional. Do not add another
network hop until it enforces a requirement the existing edge and application
do not cover.

## 1. Create module boundaries before microservices

Refactor the Java package structure around business capabilities instead of
technical layers. A practical target is:

```text
com.deadkeys
  identity/
  profile/
  gameplay/
  catalog/
  store/
  leaderboard/
  rewards/
  billing/
  operations/
  shared/
```

Each module should own its controllers, application services, domain types,
repositories, and tests. Other modules should call its public interface rather
than its repository or internal classes.

Suggested responsibilities:

| Module | Owns |
|---|---|
| `identity` | authenticated-user context and authorization helpers |
| `profile` | account lifecycle, display name, preferences, guest import |
| `gameplay` | run validation, anti-cheat rules, and recorded results |
| `catalog` | maps, upgrades, cosmetics, powerups, and coin-pack definitions |
| `store` | purchases, inventory, equipment, and coin-ledger operations |
| `leaderboard` | ranking writes, queries, and pruning |
| `rewards` | ad rewards, cooldowns, verification, and grant history |
| `billing` | checkout, orders, Stripe webhooks, payment events, refunds |
| `operations` | health, readiness, administrative jobs, and audit queries |

Keep `shared` small. It should contain stable cross-cutting primitives, not
business logic that avoids choosing a real owner.

[Spring Modulith](https://docs.spring.io/spring-modulith/reference/index.html)
can verify module boundaries, run module-focused integration tests, publish
domain events, and generate architecture documentation while the system remains
one deployable application. It is useful here but not mandatory for the first
package split.

### First refactor

1. Split `ApiController` into domain controllers.
2. Split `ProfileService` into application services owned by the modules above.
3. Keep one database and local Java method calls.
4. Add tests that prevent modules from reaching into another module's
   repository.
5. Add Spring Modulith verification after the package boundaries are stable.

This is a low-risk refactor because it does not introduce distributed
transactions, new deployments, or new infrastructure.

## 2. Use the edge before adding a dedicated gateway

### Add now: Cloudflare

Use Cloudflare as the public edge for:

- DNS and TLS;
- static asset caching;
- managed WAF rules;
- coarse IP-based rate limiting;
- security headers; and
- a stable `api` subdomain that points to Cloud Run.

Cloudflare's WAF is available across its plans. The free plan has fewer rules
and controls, but it is enough to establish a basic edge policy. Keep the
application's rate limiter as a second layer for user- and operation-specific
limits.

Do not trust arbitrary `X-Forwarded-For` values. Configure forwarded-header
handling for the actual trusted proxy path, and derive the client address only
from headers supplied by Cloudflare/Cloud Run.

### Add later: Google Cloud API Gateway

Add an API gateway when at least one of these is true:

- more than one backend service must share one public API hostname;
- a mobile client, partner, or third party needs API keys and quotas;
- the OpenAPI contract must enforce routing and authentication centrally;
- service-specific Cloud Run URLs must remain private;
- centralized API usage analytics are needed; or
- API versions need controlled traffic routing.

Google currently lists the first two million API Gateway calls per month at no
charge, followed by usage-based pricing. The financial cost can be low, but
every gateway still adds configuration, latency, another failure point, and
another place where CORS and authentication can be misconfigured.

An API gateway should not cache authenticated profiles. It can cache public,
safe GET responses such as immutable catalog data or a short-lived public
leaderboard response.

## 3. Improve the database before splitting it

Use one Postgres database per environment until independent services actually
exist. Multiple databases now would make profile purchases and coin updates
harder to keep atomic.

### Add versioned migrations

Add Flyway before the first production schema change:

- check SQL migrations into the repository;
- validate migrations in CI against an empty Postgres database;
- stop using `ddl-auto=update` in UAT and production;
- back up production before destructive migrations; and
- document forward-fix and restore procedures.

Flyway applies versioned migrations in order and tracks them in a schema history
table.

### Normalize data based on access and integrity needs

The current profile JSON column is convenient, but it makes constraints,
queries, partial updates, concurrent writes, and auditing harder. Migrate
incrementally rather than rewriting the entire persistence model at once.

Recommended relational tables:

| Table | Reason |
|---|---|
| `profiles` | account identity, display name, timestamps, version |
| `profile_stats` | queryable counters and personal bests |
| `inventory_items` | owned maps, cosmetics, upgrades, and powerups |
| `coin_ledger` | append-only grants and spends with a reason/reference |
| `orders` | Stripe Checkout and order state |
| `payment_events` | webhook idempotency and audit history |
| `run_results` | optional retained run history for anti-cheat/analytics |
| `outbox_events` | durable events to publish after a transaction commits |

Keep flexible cosmetic configuration or low-value preferences as JSON if they
do not need relational constraints or queries.

### Add integrity controls

- use transactions around coin and inventory changes;
- add unique constraints for provider event IDs and idempotency keys;
- add optimistic locking/version columns to mutable aggregates;
- make coin balances derivable from or reconcilable with the ledger;
- limit the Cloud Run instance count until concurrent-write behavior is tested;
- use a bounded connection pool appropriate for the Neon connection limit; and
- test database restore procedures, not only backups.

## 4. Add durable asynchronous work

Use [Cloud Tasks](https://cloud.google.com/tasks/pricing) first. It provides
durable delivery, retries, scheduling, and authenticated HTTP targets, and
Google currently lists the first one million operations per month at no charge.

Good first tasks:

- reconcile or retry payment processing;
- process a verified reward-provider callback;
- send account or purchase notifications;
- clean expired idempotency records;
- recompute or repair leaderboard materializations;
- retry non-critical third-party calls; and
- run scheduled retention/cleanup work.

The HTTP request should commit the primary business transaction, write an outbox
event in the same transaction, and return. A dispatcher can then enqueue the
task. This transactional outbox avoids the failure where the database commits
but publishing the job fails.

Use [Pub/Sub](https://cloud.google.com/pubsub/pricing) only when one event needs
multiple independent consumers or high-throughput event streaming. Google
currently provides a free monthly throughput allowance. Do not introduce it
for one producer and one worker when Cloud Tasks expresses the workflow more
directly.

## 5. Make writes idempotent

Network retries and duplicate browser submissions are normal. Every operation
that grants value or spends currency should be safe to repeat.

Add an `Idempotency-Key` header or server-issued operation ID for:

- completed run submissions;
- rewarded-ad grants;
- map, cosmetic, upgrade, and powerup purchases;
- Stripe Checkout creation; and
- Stripe webhook events.

Store the key, authenticated user, operation type, request fingerprint, final
status, and response reference. A duplicate request should return the original
result or a conflict, never apply the value twice.

Firebase authentication answers who made the request; it does not provide
idempotency.

## 6. Add standard observability

Add [Spring Boot Actuator](https://docs.spring.io/spring-boot/reference/actuator/index.html)
and expose only the endpoints required by the platform:

- liveness: the process can run;
- readiness: the application can serve traffic and reach required dependencies;
- metrics: request rate, latency, status codes, JVM, database pool, and jobs;
- build information: deployed commit/version; and
- health details secured from public access.

Then add:

- a request/correlation ID returned in each response and included in every log;
- structured JSON logs with route, status, duration, user ID when available,
  request ID, and deployed revision;
- Micrometer metrics and alerts for error rate and latency;
- Sentry for client and server exceptions; and
- [OpenTelemetry Java instrumentation](https://opentelemetry.io/docs/zero-code/java/)
  when traces are needed across the API, database, tasks, gateway, or external
  providers.

Start with a small alert set:

- production health check unavailable;
- elevated HTTP 5xx rate;
- p95 latency above the chosen objective;
- database connection exhaustion;
- task retry/dead-letter growth;
- failed Stripe webhook processing; and
- unusual coin grants or purchase failures.

## 7. Cache only data that is safe to be stale

Caching can reduce requests and cost, but profile data is not the best first
candidate because it changes after runs, purchases, rewards, and equipment
changes.

### Good cache candidates

- hashed JavaScript, CSS, image, audio, and font assets: long-lived CDN cache;
- map/cosmetic/upgrade catalog definitions: long TTL with versioned keys;
- public leaderboard responses: short TTL such as 15-60 seconds;
- Firebase public signing keys: honor provider cache headers; and
- server-side catalog lookups: small in-process cache.

### Do not edge-cache

- authenticated profile responses;
- coin balances;
- inventory ownership;
- payment/order state;
- reward eligibility; or
- personalized bootstrap responses.

For the client, keep one in-memory profile query/cache and invalidate or update
it after successful mutations. Use conditional requests with `ETag` or a
profile version when refresh behavior needs optimization. Do not use a long TTL
that can display a stale balance after a purchase.

Do not add Redis only because caching is expected in a typical architecture.
Add a managed Redis-compatible service when there is a proven need for shared
rate-limit state, distributed locks, ephemeral cross-instance state, or a cache
whose hit rate materially improves cost or latency.

## 8. Security and API design

Add these controls before adding more services:

- API versioning, for example `/api/v1`;
- an OpenAPI contract checked in with the code;
- Jakarta Bean Validation on request DTOs;
- explicit request and response DTOs instead of untyped maps;
- least-privilege runtime and deployment service accounts;
- secrets in Google Secret Manager, never repository or browser variables;
- strict UAT and production CORS allowlists;
- CSP, HSTS, MIME-sniffing protection, and frame restrictions;
- route-specific limits for login/bootstrap, runs, rewards, and checkout;
- audit records for grants, spends, payment changes, and administrative actions;
- outbound HTTP connect/read timeouts;
- retries only for idempotent operations; and
- dependency and container vulnerability scanning in CI.

Circuit breakers become useful when external providers such as Stripe or an ad
network can make the API unhealthy. They are not needed around local module
calls.

## 9. Future microservices

A module should become a separate service only if it has at least one strong
reason:

- it needs independent scaling;
- it has a distinct security or compliance boundary;
- failures must be isolated from gameplay;
- it has an independent release cadence or owner;
- more than one application genuinely reuses it;
- its data has a clear independent owner; or
- its runtime requirements differ substantially from the main API.

### Sensible extraction order

| Candidate | When extraction makes sense | Recommendation now |
|---|---|---|
| Billing/webhook worker | payments are live; webhook retries and secrets need isolation | Build as a module first; likely first extracted service |
| Notifications | email/push is used by multiple products and should not delay requests | Queue-backed module, then a small worker |
| Analytics/event ingestion | event volume or reporting work affects gameplay traffic | Publish events asynchronously; extract only at real volume |
| Leaderboard | public read traffic greatly exceeds profile traffic or ranking becomes specialized | Keep in the monolith; cache public reads |
| Admin/operations API | internal tools require stronger access controls and a separate attack surface | Separate controller/security boundary first |

### Keep in the monolith for now

- identity integration;
- profile and progression;
- catalog;
- inventory and the in-game store;
- gameplay run processing; and
- rewards that directly change the player's coin balance.

These operations share transactions and data. Splitting them now would replace
simple database transactions with distributed consistency, retries, duplicate
event handling, and reconciliation.

For reusable code, prefer a module or library first. A reusable network service
is justified only when multiple independent clients need it and its data and
availability can be owned independently.

## 10. What not to add yet

Do not add these until a concrete requirement justifies them:

- Kubernetes or GKE;
- a service mesh;
- Kafka;
- Elasticsearch/OpenSearch;
- a separate database for every package;
- Redis with no measured cache or coordination need;
- GraphQL only to replace a small REST API;
- event sourcing for all player state;
- a dedicated configuration server;
- a custom identity service; or
- many synchronous microservices in the profile request path.

Cloud Run, Postgres, Cloud Tasks, managed authentication, and an edge proxy can
support substantial traffic while remaining understandable and inexpensive.

## 11. Implementation order

### Priority 0: before production

- [ ] Split the controller and service into business modules.
- [ ] Add Flyway and a baseline migration.
- [ ] Set production schema management to migration validation, not automatic
      Hibernate updates.
- [ ] Add Actuator readiness, liveness, and build information.
- [ ] Add request IDs and structured logs.
- [ ] Add an OpenAPI specification and typed validated DTOs.
- [ ] Configure Cloudflare managed WAF rules and coarse rate limits.
- [ ] Correctly configure trusted forwarded-header handling.
- [ ] Add idempotency to run, reward, and purchase writes.
- [ ] Define backup and restore procedures.

### Priority 1: before enabling payments

- [ ] Create the billing module.
- [ ] Add `orders`, `payment_events`, `coin_ledger`, and `outbox_events`.
- [ ] Verify Stripe webhook signatures.
- [ ] Make webhook processing idempotent.
- [ ] Grant coins only from a committed, verified payment event.
- [ ] Add Cloud Tasks for retry/reconciliation work.
- [ ] Add billing audit queries and alerts.
- [ ] Use separate UAT and production Stripe credentials.

### Priority 2: after traffic data exists

- [ ] Review p95 latency, error rate, database load, and Cloud Run scaling.
- [ ] Cache immutable catalogs and short-lived public leaderboard reads.
- [ ] Add OpenTelemetry traces if logs and metrics cannot explain latency.
- [ ] Add shared rate-limit storage only if multiple instances make the
      in-memory limiter ineffective.
- [ ] Add API Gateway only when the gateway criteria above are met.
- [ ] Add Pub/Sub only for genuine event fan-out.
- [ ] Extract a module only after documenting its trigger and ownership.

## 12. Architecture documentation to maintain

Keep lightweight records in the repository:

- a C4 context diagram for users and external providers;
- a C4 container diagram for frontend, API, database, queue, and workers;
- one short architecture decision record for each major choice;
- data ownership and transaction boundaries for every module;
- recovery procedures and service-level objectives; and
- a cost review based on actual monthly usage.

Suggested first decisions:

1. modular monolith instead of microservices;
2. Cloudflare edge before API Gateway;
3. Cloud Tasks before Pub/Sub;
4. one Postgres database until service extraction;
5. transactional outbox for asynchronous side effects; and
6. authenticated profile data is not edge-cached.

## Cost-aware service choices

| Capability | Start with | Upgrade trigger |
|---|---|---|
| Frontend/CDN | Cloudflare Pages | bandwidth/build or organizational requirements |
| API compute | Cloud Run, min instances `0` | cold-start objective or sustained traffic |
| Edge security | Cloudflare WAF/rate limits | advanced rules, bot controls, or compliance |
| API management | application + Cloudflare | multiple services/consumers, quotas, centralized routing |
| Database | one Neon Postgres per environment | measured capacity, availability, or data-boundary need |
| Async jobs | Cloud Tasks | event fan-out or streaming needs |
| Event bus | none | multiple independent event consumers |
| Cache | browser/CDN/in-process | measured need for shared cross-instance state |
| Monitoring | Cloud logs + Sentry + uptime check | larger retention, tracing, or SLO needs |

Prices and free allowances change. Verify them before provisioning and configure
budget alerts even when the expected cost is zero.

## References

- [Google Cloud API Gateway overview](https://docs.cloud.google.com/api-gateway/docs/about-api-gateway)
- [Google Cloud API Gateway pricing](https://cloud.google.com/api-gateway/pricing)
- [Google Cloud Tasks pricing](https://cloud.google.com/tasks/pricing)
- [Google Cloud Pub/Sub pricing](https://cloud.google.com/pubsub/pricing)
- [Google Cloud Run pricing](https://cloud.google.com/run/pricing)
- [Cloudflare Web Application Firewall](https://developers.cloudflare.com/waf/)
- [Cloudflare rate-limiting rules](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- [Spring Modulith reference](https://docs.spring.io/spring-modulith/reference/index.html)
- [Spring Modulith verification](https://docs.spring.io/spring-modulith/reference/verification.html)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/reference/actuator/index.html)
- [OpenTelemetry Java zero-code instrumentation](https://opentelemetry.io/docs/zero-code/java/)
- [Flyway migrations](https://documentation.red-gate.com/fd/migrations-271585107.html)
