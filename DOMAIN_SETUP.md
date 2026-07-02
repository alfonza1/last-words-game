# Custom Domain Setup — infra checklist

> Draft checklist. Replace `playlastwords.com` with your real domain.
> Stack: Cloudflare Pages (frontend) · Google Cloud Run (API) · Firebase Auth · Neon (DB).
>
> ⭐ = the two steps that already broke sign-in / API before. Do them **before**
> pointing anyone at the new domain.

## Reference — current prod infra
| Piece | Value |
|-------|-------|
| Frontend (Pages project) | `dead-keys-prod` → `dead-keys-prod.pages.dev` |
| API (Cloud Run) | `dead-keys-api-prod`, region `us-east4` |
| Firebase project (prod) | `play-last-words` |
| CORS knob | `ALLOWED_ORIGINS` env var on the Cloud Run service (comma-separated) |
| GitHub prod vars | `WEB_URL`, `API_BASE` / `VITE_API_BASE` |

---

## 1. Get DNS onto Cloudflare
- Bought via **Cloudflare Registrar** → already done.
- Bought elsewhere → add the site in Cloudflare and switch the registrar's
  **nameservers** to Cloudflare's. Gives free SSL + one-click Pages hookup.

## 2. Attach domain to the frontend (Cloudflare Pages)
- Cloudflare → **Workers & Pages → `dead-keys-prod` → Custom domains → Set up a custom domain**
- Add `playlastwords.com` and `www.playlastwords.com`.
- Cloudflare auto-creates DNS + cert (few min). Pick apex as canonical; redirect `www → apex`.
- No rebuild needed (DNS/cert only).
- *(Optional)* same for `dead-keys-uat` → `uat.playlastwords.com`.

## 3. ⭐ Firebase Authentication — authorize the domain
- Firebase Console → **`play-last-words`** → **Authentication → Settings → Authorized domains**
- Add `playlastwords.com`, `www.playlastwords.com` (+ uat subdomain if used).
- Skip this → Google sign-in fails with `auth/unauthorized-domain`.

## 4. ⭐ Server CORS — add the new origin
API reads `ALLOWED_ORIGINS` (comma-separated) from `CorsConfig.java`. Update on Cloud Run:
```bash
gcloud run services update dead-keys-api-prod --region us-east4 \
  --update-env-vars "ALLOWED_ORIGINS=https://playlastwords.com,https://www.playlastwords.com,https://dead-keys-prod.pages.dev"
```
- Include apex + www; keep `dead-keys-prod.pages.dev` during transition.
- https, no trailing slash. This **replaces** the current value — list every origin you still need.
- Skip this → browser blocks all API calls from the new domain (CORS preflight fails).

## 5. (Optional) Custom API subdomain — `api.playlastwords.com`
Only if you don't want the raw `*.run.app` URL:
- Map via **Cloud Run domain mapping** (or a GCLB) → it gives DNS records to add in Cloudflare.
- Update prod **`API_BASE` / `VITE_API_BASE`** GitHub var → `https://api.playlastwords.com`.
- **Rebuild the client** (Vite bakes the API base at build time). Keep run.app URL alive during cutover.
- CORS = browser origin (frontend), not API host → step 4 unchanged.

## 6. Update env vars + redeploy
- `WEB_URL` (prod GitHub var) → `https://playlastwords.com`.
- Did step 5? Trigger a prod client rebuild so the new `VITE_API_BASE` ships.
- Step 2 (frontend domain) needs no rebuild.

## 7. Verify
On `https://playlastwords.com`:
- [ ] Page loads
- [ ] Google sign-in succeeds (Firebase authorized domain ✓)
- [ ] Play a run / open leaderboard — no CORS errors in DevTools Network (CORS ✓)
- [ ] http→https and www→apex redirects work

## 8. Housekeeping
- Update README architecture/highlights with the real domain.
- Add the domain to Sentry allowed URLs if configured.
