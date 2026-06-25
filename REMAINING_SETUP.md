# Dead Keys Remaining Setup Checklist

Last reviewed: June 25, 2026

This is the consolidated list of work that still requires your accounts,
credentials, dashboard access, provider approval, or a product decision. It is
based on the current code rather than older planning documents.

The repository now contains:

- pull request CI in `.github/workflows/ci.yml`;
- automatic UAT workflow wiring in `.github/workflows/deploy-uat.yml`;
- release-branch production workflow wiring in
  `.github/workflows/deploy-production.yml`;
- weekly Dependabot updates in `.github/dependabot.yml`; and
- the full architecture and command guide in
  [`CI_CD_PIPELINE.md`](CI_CD_PIPELINE.md).

Cloud deployment is intentionally disabled until the required accounts and
secrets exist. Set this repository variable only after setup is complete:

```text
CD_DEPLOYMENTS_ENABLED=true
```

## 1. Choose the GitHub repository plan

- [ ] Decide whether `alfonza1/dead-keys` will be public.
- [ ] If it stays private, choose a production approval compromise or GitHub
      Enterprise.

The exact no-cost design requires a public repository. GitHub Free can protect
public branches and require production environment reviewers. For private
repositories, branch protection requires Pro/Team/Enterprise, and GitHub's
built-in required environment reviewer gate requires Enterprise.

## 2. Configure GitHub branch protection

These settings cannot be committed as normal repository files.

### `develop`

- [ ] Open **GitHub > Repository Settings > Branches**.
- [ ] Add a protection rule for `develop`.
- [ ] Require pull requests before merging.
- [ ] Require status checks named `client` and `server`.
- [ ] Require branches to be up to date.
- [ ] Require conversation resolution.
- [ ] Block force pushes and deletion.
- [ ] Apply the rule to administrators/bypass users.
- [ ] If another trusted collaborator exists, require one approval.

The `client` and `server` check names become selectable after CI runs once.

### `release/*`

- [ ] Add a protection rule for `release/*`.
- [ ] Require `client` and `server` checks for release fixes.
- [ ] Require pull requests for changes after a release branch is created.
- [ ] Block force pushes and deletion during the rollback window.

## 3. Create GitHub environments

### UAT

- [ ] Create an environment named `uat`.
- [ ] Allow deployment only from `develop`.
- [ ] Do not require approval.

### Production

- [ ] Create an environment named `production`.
- [ ] Allow deployment only from `release/*`.
- [ ] Add a required reviewer.
- [ ] Enable **Prevent self-review** if another reviewer is available.
- [ ] Disable administrator bypass.

If the repository plan cannot enforce required reviewers, keep cloud deployment
disabled until you deliberately choose a manual approval substitute.

## 4. Create Google Cloud resources

- [ ] Create or select a Google Cloud account.
- [ ] Create one project, for example `dead-keys-platform`.
- [ ] Attach a billing account. Cloud Run has a free allowance but requires
      billing and can charge beyond it.
- [ ] Configure budget alerts at `$1`, `$5`, and `$10`.
- [ ] Install and authenticate the `gcloud` CLI locally.
- [ ] Enable Cloud Run, Artifact Registry, IAM Credentials, Security Token
      Service, and Secret Manager APIs.
- [ ] Create Artifact Registry Docker repository `dead-keys`.
- [ ] Configure image cleanup for old commit images.
- [ ] Create Cloud Run service `dead-keys-api-uat`.
- [ ] Create Cloud Run service `dead-keys-api-prod`.
- [ ] Set minimum instances to `0` and initially cap maximum instances at `1`.
- [ ] Create separate UAT and production runtime service accounts.
- [ ] Create separate UAT and production deployment service accounts.
- [ ] Configure GitHub Workload Identity Federation.
- [ ] Restrict the identity provider to `alfonza1/dead-keys`.
- [ ] Grant only Artifact Registry write, Cloud Run deploy, and runtime
      service-account impersonation permissions.
- [ ] Record the Workload Identity provider path.
- [ ] Record both deployment service-account email addresses.
- [ ] Record both stable Cloud Run URLs after first deployment.

Do not create or upload a long-lived Google service-account JSON key.

## 5. Create Cloudflare Pages hosting

- [ ] Create a Cloudflare account.
- [ ] Create Direct Upload Pages project `dead-keys-uat`.
- [ ] Create Direct Upload Pages project `dead-keys-prod`.
- [ ] Record the Cloudflare account ID.
- [ ] Create a narrowly scoped API token that can deploy Pages.
- [ ] Record the two Pages URLs.
- [ ] Add custom domains later if desired.

Use Direct Upload, not Cloudflare Git integration. GitHub Actions should remain
the only deployment path.

## 6. Create isolated Postgres databases

- [ ] Create a Neon account.
- [ ] Create Neon project `dead-keys-uat`.
- [ ] Create Neon project `dead-keys-prod`.
- [ ] Record each JDBC URL, username, and password.
- [ ] Store credentials in Google Secret Manager.
- [ ] Attach UAT credentials only to the UAT Cloud Run service.
- [ ] Attach production credentials only to the production service.
- [ ] Confirm data survives a Cloud Run revision replacement.

The server already supports Postgres through:

```text
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
```

Before destructive schema changes, add Flyway or Liquibase. The current
`ddl-auto=update` setting is acceptable only for the initial low-risk rollout.

## 7. Create isolated Firebase projects

- [ ] Create or confirm a Firebase project for UAT.
- [ ] Create a separate Firebase project for production.
- [ ] Create a web application in each project.
- [ ] Enable Google sign-in in each project.
- [ ] Add the UAT Pages domain to UAT authorized domains.
- [ ] Add the production Pages/custom domain to production authorized domains.
- [ ] Record each project's web configuration.
- [ ] Set each Cloud Run service's `FIREBASE_PROJECT_ID`.

The application already verifies Firebase tokens server-side. The current
verifier uses Google's public signing keys and does not need a Firebase
service-account key.

## 8. Add GitHub variables and secrets

Create these variables in both `uat` and `production`, using matching values:

| Environment variable |
|---|
| `GCP_PROJECT_ID` |
| `GCP_REGION` |
| `GCP_ARTIFACT_REPOSITORY` |
| `GCP_CLOUD_RUN_SERVICE` |
| `GCP_WIF_PROVIDER` |
| `GCP_DEPLOYER_SERVICE_ACCOUNT` |
| `CLOUDFLARE_ACCOUNT_ID` |
| `CLOUDFLARE_PAGES_PROJECT` |
| `API_BASE` |
| `WEB_URL` |
| `VITE_FIREBASE_API_KEY` |
| `VITE_FIREBASE_AUTH_DOMAIN` |
| `VITE_FIREBASE_PROJECT_ID` |
| `VITE_FIREBASE_STORAGE_BUCKET` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `VITE_FIREBASE_APP_ID` |
| `VITE_FIREBASE_MEASUREMENT_ID` |

Create this secret in both environments:

| Environment secret | Purpose |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Deploy the matching Pages project |

After every required value is configured, create this repository variable:

| Repository variable | Value |
|---|---|
| `CD_DEPLOYMENTS_ENABLED` | `true` |

Firebase browser values and `API_BASE` are public build configuration, not
secrets. Database passwords, Stripe secrets, and cloud credentials must never
use a `VITE_*` variable.

## 9. Configure Cloud Run runtime values

Set matching values on each Cloud Run service:

```text
ALLOWED_ORIGINS
FIREBASE_PROJECT_ID
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
SENTRY_DSN
DEADKEYS_REWARD_COINS
```

- [ ] UAT allows only the UAT frontend origin.
- [ ] Production allows only the production frontend origin.
- [ ] UAT uses test/sandbox third-party credentials.
- [ ] Production uses production credentials.

## 10. Enable monitoring and uptime

- [ ] Create a Sentry account and organization.
- [ ] Create a Spring Boot project and record its DSN.
- [ ] Set `SENTRY_DSN` on UAT and production.
- [ ] Create a React project and record its DSN.
- [ ] Ask Codex to install `@sentry/react` and activate
      `client/src/lib/monitoring.ts`; this code is still a placeholder.
- [ ] Add `VITE_SENTRY_DSN` to client builds after activation.
- [ ] Create alert rules for new issues and error-rate spikes.
- [ ] Create an UptimeRobot or Better Stack account.
- [ ] Monitor both UAT and production `/api/health` endpoints.
- [ ] Configure email or another alert channel.

## 11. Finish Stripe coin packs

This integration is not complete. The checkout endpoint currently returns
`501 Not Implemented` after basic configuration checks.

- [ ] Create and verify a Stripe account.
- [ ] Use Stripe test mode for UAT.
- [ ] Obtain a test secret key and webhook signing secret.
- [ ] Ask Codex to add the Stripe Java SDK and Checkout Session creation.
- [ ] Ask Codex to add a signed, idempotent
      `checkout.session.completed` webhook.
- [ ] Add an orders/payment-events table for idempotency and audit history.
- [ ] Store Stripe keys in Google Secret Manager.
- [ ] Configure and test the UAT webhook.
- [ ] Obtain live keys only after UAT succeeds.
- [ ] Configure the production webhook.
- [ ] Set `VITE_STRIPE_ENABLED=true` only after the backend is ready.

Never credit coins from a browser redirect or client request. Only a verified,
idempotent Stripe webhook should grant purchased coins.

## 12. Finish ads and rewarded video

Banner support exists, but provider approval and configuration are still
required. Rewarded video remains a simulated three-second placeholder.

### Banner ads

- [ ] Create a Google AdSense account.
- [ ] Deploy a public production site with real content.
- [ ] Submit the site for AdSense approval.
- [ ] Record the publisher ID and ad-slot ID.
- [ ] Set `VITE_ADSENSE_CLIENT` and `VITE_ADSENSE_SLOT`.
- [ ] Set `VITE_ADS_ENABLED=true` only after approval.

### Rewarded video

- [ ] Apply to CrazyGames, Poki, or another selected portal; or enable Google
      Ad Manager/AdSense for Games.
- [ ] Obtain the provider SDK and test credentials.
- [ ] Ask Codex to replace the placeholder in `client/src/lib/ads.ts`.
- [ ] Verify completion before calling the server reward endpoint.
- [ ] Confirm cancelled and failed ads do not grant coins.

## 13. Optional domain and CDN work

- [ ] Purchase or select a domain.
- [ ] Point the production frontend domain to Cloudflare Pages.
- [ ] Optionally create a dedicated API subdomain.
- [ ] Add domains to Firebase authorized domains.
- [ ] Update Cloud Run `ALLOWED_ORIGINS`.
- [ ] Update GitHub `WEB_URL` and `API_BASE`.
- [ ] Configure long-lived caching for hashed `/assets/*`.
- [ ] Keep `index.html` revalidated/no-cache.
- [ ] Never edge-cache authenticated `/api/profile/**` responses.

## 14. Activate and test the pipeline

- [ ] Push these workflow files to the remote feature branch.
- [ ] Open a pull request into `develop`.
- [ ] Confirm `client` and `server` CI checks pass.
- [ ] Configure branch protection using those exact check names.
- [ ] Merge the pull request.
- [ ] Keep `CD_DEPLOYMENTS_ENABLED` unset and confirm UAT validation passes while
      deployment is skipped.
- [ ] Finish all UAT cloud variables and secrets.
- [ ] Set `CD_DEPLOYMENTS_ENABLED=true`.
- [ ] Manually run **Deploy UAT** once.
- [ ] Test API health, sign-in, saved progress, map purchases, and a full run.
- [ ] Create a release branch from the tested `develop` commit.
- [ ] Confirm production validation succeeds.
- [ ] Approve the production environment deployment.
- [ ] Confirm production smoke tests.
- [ ] Tag the deployed commit.
- [ ] Test API and frontend rollback procedures.

## Already implemented - do not redo

These items appear as future work in older planning documents but are present:

- Firebase Google sign-in on the client.
- Server-side Firebase ID-token verification.
- Profiles keyed to authenticated Firebase user IDs.
- Postgres persistence through Spring Data JPA.
- Server-authoritative coins, upgrades, maps, cosmetics, and powerups.
- Run-stat sanity caps and API rate limiting.
- Guest transfer restricted to newly created accounts.
- UAT and production workflow definitions.

## Recommended execution order

1. GitHub visibility/plan and branch protection.
2. Google Cloud, Cloudflare, Neon, and Firebase UAT resources.
3. GitHub UAT variables/secrets and first UAT deployment.
4. Production resources and approval controls.
5. Sentry and uptime monitoring.
6. Stripe implementation and account verification.
7. Ads/portal approval.
8. Custom domain and final launch checks.
