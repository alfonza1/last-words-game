# Free CI/CD Pipeline for Dead Keys

Last verified: June 25, 2026

This guide defines a CI/CD design for this repository with these release rules:

- `develop` can only change through a pull request.
- Every pull request must pass client and server validation.
- Merging a pull request into `develop` automatically deploys UAT.
- UAT uses the same deployment topology as production, but isolated services,
  databases, authentication configuration, and third-party keys.
- A branch named `release/<version>` deploys the exact UAT-tested commit to
  production.
- Production deployment pauses for a required human approval.

## Important GitHub Free limitation

The exact controls above are free only when the GitHub repository is **public**.

GitHub Free supports protected branches and deployment protection rules in
public repositories. For private repositories:

- protected branches require GitHub Pro, Team, or Enterprise;
- environments require GitHub Pro, Team, or Enterprise; and
- required environment reviewers are only available for public repositories on
  GitHub Free, Pro, and Team. A private repository needs GitHub Enterprise for
  GitHub's built-in required-reviewer gate.

Therefore, choose one of these paths before implementation:

1. **Recommended $0 path:** make the repository public, keep all credentials in
   GitHub environment secrets, and use the controls in this guide.
2. **Exact private path:** use GitHub Enterprise Cloud so both protected
   branches and required production reviewers are enforced.
3. **Private Pro/Team compromise:** protected branches and environments are
   available, but the production approval must be implemented outside GitHub's
   built-in required-reviewer rule or reduced to a manual trigger.
4. **Private $0 compromise:** use GitHub Free Actions with manual
   `workflow_dispatch` production deployment. This does not truly prevent direct
   pushes to `develop` and does not provide a separately enforced approval gate.
   It is a convention, not a security control.

Do not treat a workflow that merely fails after a direct push as branch
protection. By then the protected branch has already changed.

## Recommended free-tier architecture

| Component | UAT | Production | Free-tier notes |
|---|---|---|---|
| Source and CI/CD | GitHub Actions | GitHub Actions | Public repositories use standard hosted runners for free. Private GitHub Free repositories receive 2,000 minutes/month. |
| React client | Cloudflare Pages project `dead-keys-uat` | Cloudflare Pages project `dead-keys-prod` | Free plan currently allows 500 deployments/month. |
| Spring Boot API | Cloud Run service `dead-keys-api-uat` | Cloud Run service `dead-keys-api-prod` | Configure request-based billing, minimum instances `0`, and maximum instances `1` initially. Usage beyond the monthly free tier can cost money. |
| Container images | Artifact Registry repository `dead-keys` | Same repository | First 0.5 GiB-month is free. Use cleanup policies so old Java images do not accumulate. |
| Postgres | Neon project `dead-keys-uat` | Neon project `dead-keys-prod` | Neon Free currently includes independent project allowances and scales idle compute to zero. |
| Authentication | Firebase project `dead-keys-uat` | Firebase project `dead-keys-prod` | Separate projects prevent UAT accounts and authorized domains from mixing with production. |
| Errors | Sentry project/environment `uat` | Sentry project/environment `production` | Optional; keep the environment label separate. |

This is a free-tier design, not a promise of unlimited zero cost. Cloud Run
requires a Google Cloud billing account, and usage beyond its free allowance is
billable. Configure budgets, maximum instances, and quota alerts before making
production public.

## Target flow

```text
feature/* or fix/*
        |
        | pull request + required CI
        v
     develop  --------------------> automatic UAT deployment
        |
        | create release/v1.2.0 at the tested develop SHA
        v
 release/v1.2.0
        |
        | validation succeeds
        | production environment approval
        v
   production deployment
        |
        v
 optional immutable tag v1.2.0
```

The production workflow verifies that the release commit is contained in
`origin/develop`. This prevents someone from creating a release branch from
unreviewed code and using it to reach production.

## Repository branch rules

Configure these in GitHub under **Settings > Branches > Add branch protection
rule**.

### Protect `develop`

Use branch name pattern:

```text
develop
```

Enable:

- Require a pull request before merging.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Require conversation resolution before merging.
- Dismiss stale pull request approvals when new commits are pushed.
- Do not allow bypassing the above settings.
- Block force pushes.
- Block deletions.

Require these status checks after the first CI workflow has run:

```text
client
server
```

For a solo repository, requiring a pull request and passing checks is practical,
but requiring one approving review means a second collaborator must approve the
author's pull request. If another trusted collaborator is available, require one
approval as well.

### Protect release branches

Use branch name pattern:

```text
release/*
```

Enable:

- Require a pull request before merging for any later release fix.
- Require the `client` and `server` checks.
- Require conversation resolution.
- Do not allow bypassing the above settings.
- Block force pushes.
- Block deletions until the release and rollback window are complete.

The initial release branch should point directly at a commit already deployed to
UAT from `develop`. Do not add unreviewed commits directly to a release branch.

## GitHub environments

Configure these in **Settings > Environments**.

### Environment: `uat`

Deployment branches:

```text
Selected branches and tags
develop
```

No approval is required. A merge into `develop` should deploy automatically.

### Environment: `production`

Deployment branch pattern:

```text
release/*
```

Enable:

- Required reviewers: at least one trusted person.
- Prevent self-review, if a second person is available.
- Disable administrator bypass.

The production job can run validation before approval, but it must not receive
production secrets or deploy anything until the environment is approved.

## Environment variables and secrets

Create the following values in both GitHub environments. Values named `vars`
are configuration; values named `secrets` are credentials.

The committed deployment workflows also require this repository-level variable:

| Name | Value |
|---|---|
| `CD_DEPLOYMENTS_ENABLED` | Set to `true` only after both environments are fully configured |

Until that variable is enabled, validation runs but deployment jobs are safely
skipped.

### GitHub environment variables

| Name | UAT example | Production example |
|---|---|---|
| `GCP_PROJECT_ID` | `dead-keys-platform` | `dead-keys-platform` |
| `GCP_REGION` | `us-central1` | `us-central1` |
| `GCP_ARTIFACT_REPOSITORY` | `dead-keys` | `dead-keys` |
| `GCP_CLOUD_RUN_SERVICE` | `dead-keys-api-uat` | `dead-keys-api-prod` |
| `GCP_WIF_PROVIDER` | Full Workload Identity provider path | Full Workload Identity provider path |
| `GCP_DEPLOYER_SERVICE_ACCOUNT` | UAT deployer email | Production deployer email |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | Cloudflare account ID |
| `CLOUDFLARE_PAGES_PROJECT` | `dead-keys-uat` | `dead-keys-prod` |
| `API_BASE` | Stable UAT Cloud Run URL | Stable production Cloud Run URL |
| `WEB_URL` | `https://dead-keys-uat.pages.dev` | `https://dead-keys-prod.pages.dev` |
| `VITE_FIREBASE_API_KEY` | UAT Firebase value | Production Firebase value |
| `VITE_FIREBASE_AUTH_DOMAIN` | UAT Firebase domain | Production Firebase domain |
| `VITE_FIREBASE_PROJECT_ID` | UAT Firebase project | Production Firebase project |
| `VITE_FIREBASE_STORAGE_BUCKET` | UAT Firebase bucket | Production Firebase bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | UAT Firebase value | Production Firebase value |
| `VITE_FIREBASE_APP_ID` | UAT Firebase value | Production Firebase value |
| `VITE_FIREBASE_MEASUREMENT_ID` | UAT Firebase value | Production Firebase value |

Firebase web configuration and `VITE_API_BASE` are shipped in browser JavaScript
and are not secrets.

### GitHub environment secrets

| Name | Purpose |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Token limited to Pages deployment for the relevant account. |

Prefer Google Cloud Workload Identity Federation for Google authentication. Do
not store a long-lived Google service-account JSON key in GitHub.

Application runtime secrets such as the Neon database password, Stripe keys,
and webhook secrets should be stored in Google Secret Manager and attached to
the Cloud Run service. They should not be copied into workflow YAML.

## One-time hosting setup

### 1. Create two Neon databases

Create separate Neon projects:

```text
dead-keys-uat
dead-keys-prod
```

For each project, record the JDBC URL, username, and password. Configure the
corresponding Cloud Run service with:

```text
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
```

Keep UAT and production data isolated. Do not clone real player data into UAT
unless it has been anonymized.

The application currently uses `spring.jpa.hibernate.ddl-auto=update`. That is
acceptable for an initial low-risk deployment, but a reliable release pipeline
should eventually add Flyway or Liquibase migrations. The same migration must
run in UAT before it is allowed into production.

### 2. Create two Firebase projects

Create separate Firebase projects and web applications for UAT and production.
Enable Google sign-in in both.

Add the Cloudflare Pages domains to the corresponding Firebase authorized
domains:

```text
dead-keys-uat.pages.dev
dead-keys-prod.pages.dev
```

Set each Cloud Run service's `FIREBASE_PROJECT_ID` to its matching Firebase
project.

### 3. Create Cloudflare Pages projects

Create two Direct Upload projects:

```text
dead-keys-uat
dead-keys-prod
```

Use Direct Upload rather than Cloudflare's Git integration so GitHub Actions is
the only deployment authority.

Create a Cloudflare API token with only the permissions needed to deploy Pages.
Store it as `CLOUDFLARE_API_TOKEN` in both GitHub environments.

#### Restrict UAT to the operator

Protect `https://dead-keys-uat.pages.dev` with Cloudflare Access so an anonymous
visitor cannot load the client:

1. In Cloudflare, open **Workers & Pages > dead-keys-uat > Settings > General**
   and enable the Access policy.
2. Open **Zero Trust > Access controls > Applications**, select the generated
   Pages application, and choose **Configure**.
3. In **Public hostname**, remove the wildcard (`*`) from the subdomain so the
   application protects the root hostname `dead-keys-uat.pages.dev`. Rename the
   application if Cloudflare reports a duplicate-name conflict.
4. Add an **Allow** policy whose Include selector is **Emails** and set it to the
   operator's exact email address. Do not use an `Everyone` or whole-domain
   selector for private UAT.
5. Select an identity method the operator can complete, such as Google or an
   emailed one-time PIN, then verify the URL in a private browser window.
6. If deployment preview URLs must also remain private, return to the Pages
   project and enable its preview Access policy again. Cloudflare should then
   show separate applications for the root hostname and
   `*.dead-keys-uat.pages.dev`.

This Access gate is configured in Cloudflare and survives normal Pages
deployments. It does not replace Firebase authorization or API-side security.

### 4. Create Google Cloud resources

Use one Google Cloud project for the initial free-tier implementation. It
contains:

- one Artifact Registry Docker repository;
- `dead-keys-api-uat`;
- `dead-keys-api-prod`;
- separate runtime secrets for each service; and
- separate least-privilege deployer service accounts.

The shared project is intentional: UAT builds the immutable server image tagged
with the commit SHA, and production promotes that exact image without rebuilding
it. The Cloud Run services, databases, Firebase projects, configuration, and
runtime secrets remain environment-specific.

Use the same region for Cloud Run and Artifact Registry:

```powershell
$env:GCP_PROJECT_ID = "your-google-cloud-project"
$env:GCP_REGION = "us-central1"

gcloud config set project $env:GCP_PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com iamcredentials.googleapis.com sts.googleapis.com

gcloud artifacts repositories create dead-keys `
  --repository-format=docker `
  --location=$env:GCP_REGION `
  --description="Dead Keys deployment images"
```

Configure Artifact Registry cleanup policies to retain a small number of tagged
release images and delete old untagged images. The current Spring Boot image can
consume the 0.5 GiB free storage allowance quickly if every commit is retained.

### 5. Configure keyless GitHub-to-Google authentication

Use Google's Workload Identity Federation setup from
`google-github-actions/auth`. Restrict the provider to this repository:

```powershell
$env:GITHUB_REPOSITORY = "alfonza1/dead-keys"
$env:POOL_ID = "github"
$env:PROVIDER_ID = "dead-keys"
$env:DEPLOYER_SA = "github-deployer"

$env:PROJECT_NUMBER = gcloud projects describe $env:GCP_PROJECT_ID --format="value(projectNumber)"

gcloud iam service-accounts create $env:DEPLOYER_SA `
  --display-name="GitHub Actions deployer"

gcloud iam workload-identity-pools create $env:POOL_ID `
  --location="global" `
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc $env:PROVIDER_ID `
  --location="global" `
  --workload-identity-pool=$env:POOL_ID `
  --issuer-uri="https://token.actions.githubusercontent.com" `
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" `
  --attribute-condition="assertion.repository=='$env:GITHUB_REPOSITORY'"

gcloud iam service-accounts add-iam-policy-binding `
  "$env:DEPLOYER_SA@$env:GCP_PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/iam.workloadIdentityUser" `
  --member="principalSet://iam.googleapis.com/projects/$env:PROJECT_NUMBER/locations/global/workloadIdentityPools/$env:POOL_ID/attribute.repository/$env:GITHUB_REPOSITORY"
```

Grant only the permissions needed to push images and deploy Cloud Run:

```powershell
gcloud projects add-iam-policy-binding $env:GCP_PROJECT_ID `
  --member="serviceAccount:$env:DEPLOYER_SA@$env:GCP_PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $env:GCP_PROJECT_ID `
  --member="serviceAccount:$env:DEPLOYER_SA@$env:GCP_PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/run.admin"
```

Also grant `roles/iam.serviceAccountUser` on the Cloud Run runtime service
account, rather than project-wide, so the deployer can attach that identity to
new revisions.

Store these non-secret values in both GitHub environments:

```text
GCP_WIF_PROVIDER=projects/<number>/locations/global/workloadIdentityPools/github/providers/dead-keys
GCP_DEPLOYER_SERVICE_ACCOUNT=github-deployer@<project>.iam.gserviceaccount.com
```

For stricter separation, create one deployer service account and one Workload
Identity provider per environment. Restrict the production provider's
`attribute.ref` to `refs/heads/release/` in addition to restricting the
repository.

### 6. Configure Cloud Run runtime settings

Start both services with:

```text
CPU: 1
Memory: 512 MiB
Minimum instances: 0
Maximum instances: 1
Request-based billing: enabled
Unauthenticated access: enabled
```

Attach environment-specific settings:

```text
ALLOWED_ORIGINS=https://dead-keys-uat.pages.dev
FIREBASE_PROJECT_ID=<uat-project-id>
SENTRY_DSN=<optional>
```

Production uses the production Pages domain and production Firebase project.
When custom domains are added, update `ALLOWED_ORIGINS`.

After the first deployment, put each stable Cloud Run URL in the corresponding
GitHub environment variable named `API_BASE`.

## Workflow 1: Pull request CI

The committed files under `.github/workflows/` are the source of truth. The
examples below explain their structure.

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches:
      - develop
      - "release/**"

permissions:
  contents: read

jobs:
  client:
    name: client
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: client
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: client/package-lock.json

      - run: npm ci
      - run: npm test
      - run: npm run build

  server:
    name: server
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: server
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "17"
          cache: maven

      - run: chmod +x mvnw
      - run: ./mvnw -B test
      - run: ./mvnw -B -DskipTests package
```

Do not expose deployment secrets to this pull request workflow. Pull request CI
should need only source code and public package registries.

## Workflow 2: Automatic UAT deployment

Create `.github/workflows/deploy-uat.yml`:

```yaml
name: Deploy UAT

on:
  push:
    branches:
      - develop

permissions:
  contents: read
  id-token: write

concurrency:
  group: deploy-uat
  cancel-in-progress: true

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: client/package-lock.json

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "17"
          cache: maven

      - name: Test and build client
        working-directory: client
        run: |
          npm ci
          npm test
          npm run build

      - name: Test server
        working-directory: server
        run: |
          chmod +x mvnw
          ./mvnw -B test

  deploy:
    needs: validate
    runs-on: ubuntu-latest
    environment:
      name: uat
      url: ${{ vars.WEB_URL }}
    env:
      IMAGE: ${{ vars.GCP_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/${{ vars.GCP_ARTIFACT_REPOSITORY }}/server:${{ github.sha }}
    steps:
      - uses: actions/checkout@v4

      - id: google-auth
        uses: google-github-actions/auth@v3
        with:
          token_format: access_token
          workload_identity_provider: ${{ vars.GCP_WIF_PROVIDER }}
          service_account: ${{ vars.GCP_DEPLOYER_SERVICE_ACCOUNT }}

      - uses: docker/login-action@v3
        with:
          registry: ${{ vars.GCP_REGION }}-docker.pkg.dev
          username: oauth2accesstoken
          password: ${{ steps.google-auth.outputs.access_token }}

      - uses: docker/build-push-action@v6
        with:
          context: ./server
          push: true
          tags: ${{ env.IMAGE }}

      - id: deploy-api
        uses: google-github-actions/deploy-cloudrun@v3
        with:
          service: ${{ vars.GCP_CLOUD_RUN_SERVICE }}
          region: ${{ vars.GCP_REGION }}
          image: ${{ env.IMAGE }}
          flags: >-
            --allow-unauthenticated
            --cpu=1
            --memory=512Mi
            --min-instances=0
            --max-instances=1
            --concurrency=40

      - name: Smoke-test API
        run: curl --fail --retry 8 --retry-delay 5 "${{ steps.deploy-api.outputs.url }}/api/health"

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: client/package-lock.json

      - name: Build UAT client
        working-directory: client
        env:
          VITE_API_BASE: ${{ vars.API_BASE }}
          VITE_FIREBASE_API_KEY: ${{ vars.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ vars.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ vars.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ vars.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ vars.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ vars.VITE_FIREBASE_APP_ID }}
          VITE_FIREBASE_MEASUREMENT_ID: ${{ vars.VITE_FIREBASE_MEASUREMENT_ID }}
        run: |
          npm ci
          npm run build

      - name: Deploy UAT client
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy client/dist --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }} --branch=main
```

The merge commit is tested again after merge. This avoids deploying a merge
result that differs from the pull request's previously tested head commit.

## Workflow 3: Approval-gated production deployment

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy Production

on:
  push:
    branches:
      - "release/**"

permissions:
  contents: read
  id-token: write

concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Require a UAT-tested develop commit
        run: |
          git fetch origin develop:refs/remotes/origin/develop
          git merge-base --is-ancestor "$GITHUB_SHA" origin/develop

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: client/package-lock.json

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "17"
          cache: maven

      - name: Validate client
        working-directory: client
        run: |
          npm ci
          npm test
          npm run build

      - name: Validate server
        working-directory: server
        run: |
          chmod +x mvnw
          ./mvnw -B test

  deploy:
    needs: validate
    runs-on: ubuntu-latest
    environment:
      name: production
      url: ${{ vars.WEB_URL }}
    env:
      IMAGE: ${{ vars.GCP_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/${{ vars.GCP_ARTIFACT_REPOSITORY }}/server:${{ github.sha }}
    steps:
      - uses: actions/checkout@v4

      - id: google-auth
        uses: google-github-actions/auth@v3
        with:
          workload_identity_provider: ${{ vars.GCP_WIF_PROVIDER }}
          service_account: ${{ vars.GCP_DEPLOYER_SERVICE_ACCOUNT }}

      - id: deploy-api
        uses: google-github-actions/deploy-cloudrun@v3
        with:
          service: ${{ vars.GCP_CLOUD_RUN_SERVICE }}
          region: ${{ vars.GCP_REGION }}
          image: ${{ env.IMAGE }}
          flags: >-
            --allow-unauthenticated
            --cpu=1
            --memory=512Mi
            --min-instances=0
            --max-instances=1
            --concurrency=40

      - name: Smoke-test API
        run: curl --fail --retry 8 --retry-delay 5 "${{ steps.deploy-api.outputs.url }}/api/health"

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: client/package-lock.json

      - name: Build production client
        working-directory: client
        env:
          VITE_API_BASE: ${{ vars.API_BASE }}
          VITE_FIREBASE_API_KEY: ${{ vars.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ vars.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ vars.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ vars.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ vars.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ vars.VITE_FIREBASE_APP_ID }}
          VITE_FIREBASE_MEASUREMENT_ID: ${{ vars.VITE_FIREBASE_MEASUREMENT_ID }}
        run: |
          npm ci
          npm run build

      - name: Deploy production client
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy client/dist --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }} --branch=main
```

The `validate` job runs before approval and does not reference the production
environment. The `deploy` job references `production`, so GitHub pauses it before
granting access to production variables and secrets.

Production deliberately reuses the server image tagged with the release commit
SHA that UAT built. If the image does not exist, deployment fails instead of
silently building untested server bytes. The client is rebuilt from the exact
same commit because its `VITE_*` configuration is environment-specific.

## Release procedure

After a `develop` deployment has passed UAT:

```powershell
git fetch origin
git switch develop
git pull --ff-only origin develop
git switch -c release/v1.2.0
git push -u origin release/v1.2.0
```

Then:

1. Confirm the production workflow validation passes.
2. Review the commit SHA and UAT test evidence.
3. Approve the `production` environment deployment in GitHub.
4. Run production smoke tests.
5. Tag the deployed commit:

```powershell
git tag -a v1.2.0 -m "Dead Keys v1.2.0"
git push origin v1.2.0
```

Do not merge a release branch back into `develop` if it contains no additional
commits. If an emergency fix is needed, make the fix through a pull request,
merge it into `develop`, verify UAT again, and create a new release branch or
release candidate.

## Rollback

Keep the previous known-good server image and Cloud Run revision.

For the API:

```powershell
gcloud run revisions list `
  --service=dead-keys-api-prod `
  --region=us-central1

gcloud run services update-traffic dead-keys-api-prod `
  --region=us-central1 `
  --to-revisions=<known-good-revision>=100
```

For the client, use Cloudflare Pages deployment history to roll back to the
previous production deployment.

Database changes require a separate rollback strategy. Prefer backward-compatible
expand-and-contract migrations:

1. add new columns/tables without removing old ones;
2. deploy code that can use both schemas;
3. migrate data;
4. remove old schema only in a later release.

## Cost and security guardrails

- Set Cloud Run minimum instances to `0`.
- Initially cap each API service at one instance.
- Configure a Google Cloud budget alert at `$1`, `$5`, and `$10`.
- Configure Artifact Registry cleanup policies.
- Do not upload build artifacts unless they are needed; GitHub Free artifact
  storage is limited.
- Pin third-party actions to full commit SHAs after the initial setup is working.
- Keep workflow `permissions` minimal.
- Never run deployment workflows for pull requests from forks.
- Never put Stripe keys, database passwords, service-account JSON, or Cloudflare
  tokens in repository files or `VITE_*` values.
- Use Stripe test keys in UAT and live keys only in production.
- Use separate Neon projects and Firebase projects for UAT and production.
- Add UptimeRobot or another free monitor to both `/api/health` endpoints.

## Implementation order

1. Decide whether the repository will be public or use GitHub Enterprise for
   the exact same controls on a private repository.
2. Create the UAT and production Neon projects.
3. Create the UAT and production Firebase projects.
4. Create the two Cloudflare Pages Direct Upload projects.
5. Create Artifact Registry, Cloud Run services, runtime secrets, and Workload
   Identity Federation.
6. Add GitHub environments, variables, and secrets.
7. Add `ci.yml` and merge it first so its check names become selectable.
8. Protect `develop` and require the `client` and `server` checks.
9. Add and test `deploy-uat.yml`.
10. Protect `release/*`.
11. Configure the production required reviewer.
12. Add and test `deploy-production.yml` with a harmless release candidate.
13. Document rollback revision names and owner responsibilities.

## Definition of done

- A direct push to `develop` is rejected.
- A pull request with a failing client or server check cannot merge.
- A successful merge to `develop` deploys both UAT services.
- UAT uses separate authentication and database resources.
- A release branch from an unreviewed commit fails validation.
- A valid release branch waits for production approval.
- Production secrets are unavailable before approval.
- The deployed API passes `/api/health`.
- A previous Cloud Run revision and Cloudflare Pages deployment can be restored.

## Official references

- [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub deployment environments and required reviewers](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- [GitHub Actions billing and free allowances](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [Google Cloud Run pricing](https://cloud.google.com/run/pricing)
- [Google GitHub Actions authentication](https://github.com/google-github-actions/auth)
- [Google Cloud Run deployment action](https://github.com/google-github-actions/deploy-cloudrun)
- [Artifact Registry pricing](https://cloud.google.com/artifact-registry/pricing)
- [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Cloudflare Pages CI direct upload](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)
- [Cloudflare Wrangler GitHub Action](https://github.com/cloudflare/wrangler-action)
- [Neon Free plan](https://neon.com/docs/introduction/plans)
- [Neon database branching](https://neon.com/docs/introduction/branching)
