# ZEVON Driver Auth — Cloudflare staging backend

This is a **staging-only** authentication service. It is not connected to the production Apps Script, production spreadsheet, or customer booking API.

## What it provides

- Google ID token verification using Google's published RSA signing keys (signature, issuer, audience, expiry, issue time, verified email).
- Active-driver email allowlist in a private Cloudflare D1 database.
- Random opaque session tokens; only SHA-256 token hashes are stored.
- Four-hour default sessions (configurable, clamped to 15 minutes–8 hours).
- Driver-only /me profile, logout/revocation, login attempt throttling and audit events.
- Exact-origin CORS; no wildcard origin.

It does **not** yet provide trips, assignments, status updates, admin management UI, or a connection to the existing ZEVON workbook.

## Required accounts and setup

You need access to a Cloudflare account. GitHub alone cannot host this Worker or create its D1 database.

1. Install Node.js LTS, then run npm install --save-dev wrangler in a local clone.
2. From app/backend/cloudflare-worker, run npx wrangler login.
3. Create staging DB: npx wrangler d1 create zevon-driver-auth-staging.
4. Copy the returned database ID into wrangler.toml (start from wrangler.toml.example).
5. Apply schema: npx wrangler d1 execute zevon-driver-auth-staging --remote --file=./migrations/0001_init.sql.
6. Deploy: npx wrangler deploy.
7. Test GET https://<worker-name>.<your-subdomain>.workers.dev/health from the allowed GitHub Pages origin. A direct browser navigation without an Origin header is intentionally rejected.
8. Add only approved staging drivers to D1. Example SQL (replace all sample values; never commit real driver emails or names):
   INSERT INTO drivers (driver_id,display_name,email,active,created_at,updated_at)
   VALUES ('DRV-STAGE-001','Test Driver','verified-test-driver@gmail.com',1,unixepoch(),unixepoch());
   Run SQL through Cloudflare D1 console or Wrangler; do not put real driver records in Git.
9. Add test Google accounts under Google Auth Platform → Audience → Test users while OAuth remains in Testing mode.

## Environment

wrangler.toml contains only public configuration:
- GOOGLE_CLIENT_ID: public OAuth Web Client ID.
- ALLOWED_ORIGIN: exact GitHub Pages origin (no path or trailing slash).
- SESSION_TTL_SECONDS: default 14400 (4 hours).
- DB: D1 binding.

No Google Client Secret is used or required. Never add one to this repository.

## API

POST /v1/driver/session — JSON body { "credential": "<Google ID token from GIS callback>" }. Only an email matching an active drivers row receives a session. The server does not accept a driver ID or role from the browser.

GET /v1/driver/me — Authorization: Bearer <sessionToken>. Returns only the authenticated driver's own profile.

POST /v1/driver/logout — Authorization: Bearer <sessionToken>. Revokes that session.

## Frontend integration gate

Do not connect the browser callback until:
- Worker is deployed and /health passes from the exact GitHub Pages origin.
- A staging test driver has been allowlisted.
- Positive, unapproved-email, inactive-driver, expired-token, invalid-signature, wrong-audience, expired-session, logout and wrong-origin tests pass.
- The frontend stores the short-lived session only in memory/sessionStorage and never logs credentials. Prefer memory where feasible.

## Security notes / remaining hardening

- This service deliberately has no trip endpoint. Do not display trip data until trip ownership and state transitions are implemented server-side.
- Cloudflare D1 and Worker limits apply; monitor quotas and set an account-level rate limit/WAF rule for POST /v1/driver/session before real driver rollout.
- Periodically purge expired sessions and old auth-attempt rows.
- Add alerting and operational review for audit events.
- Keep OAuth app in Testing mode until owner approval.
- Do not enable GitHub Pages from this feature branch; the repository has a production custom-domain CNAME at its root.
