# ZEVON Admin & Driver Backend Extension

## Current backend status

The deployed Google Apps Script Web App is already used by the public website and customer app for:
- `booking` POST (customer trip enquiry)
- `quote` GET (public quote lookup)
- `bootstrap` GET (public app data)
- `ack` GET (request receipt verification)

The Apps Script source project is not present in this GitHub repository. The production endpoint must not be replaced or modified blindly. This document is the implementation contract for extending the existing Apps Script project without breaking its current handlers.

## No-SMS-cost driver sign-in decision

Preferred approach for the initial driver rollout: **Google Sign-In using each driver's own Google account**, not SMS OTP.

- No SMS is sent, so there is no per-message SMS-provider charge.
- The driver must have a Google account and ZEVON must register that account's verified email against an active, immutable `Driver_ID` in a private `Drivers` registry.
- The backend must verify the Google ID token (signature, issuer, audience, expiry and verified email) and then look up the email in the private driver registry. Never accept a `Driver_ID` or role supplied by the browser.
- A valid Google account that is not allowlisted, or whose driver record is inactive, must be denied.
- The backend must issue a short-lived app session and enforce driver ownership on every trip read/write.
- Use a Google OAuth web client ID configured in the backend/deployment environment. Do not put client secrets in the app repository.
- This removes SMS OTP costs; it does not make identity verification optional. Google sign-in is not an SMS OTP.

Fallback only if a driver cannot use a Google account: email OTP sent by Apps Script `MailApp` to a verified, pre-registered email. This is subject to Google's daily email quotas (currently 100 recipients/day for consumer accounts and 1,500/day for Workspace accounts) and should have rate limits, expiry, one-time use, and abuse protection. Do not send OTP to an arbitrary email entered by the browser.

Firebase phone authentication is not selected for the no-cost launch: Firebase requires the Blaze billing plan for phone SMS and charges per SMS sent.

## Security requirements (mandatory)

1. Keep the existing customer actions and their request/response shapes backward-compatible.
2. Admin and driver endpoints must be separate from public actions and must require a short-lived authenticated session.
3. Verify Google ID tokens server-side against the configured OAuth audience, issuer, expiry and verified email. Admin emails must be explicitly allowlisted in Script Properties. Driver emails must map to an active immutable driver ID in the private driver registry. Do not trust a role or driver ID sent by the browser.
4. Driver access must use Google Sign-In (preferred) or an approved OTP provider / verified email OTP. Do not treat a phone number alone as authentication.
5. Every request must be authorised server-side. Drivers may read/update only trips assigned to their own immutable driver ID. Admin roles may be split into owner, operations and read-only.
6. Never expose the private Google Sheet, spreadsheet ID, service-account key, Script Properties, OTP secrets or admin tokens to browser code.
7. Validate all fields, enforce state transitions, rate-limit authentication, expire sessions, and write sensitive actions to an append-only audit log.
8. Do not return customer PII to drivers until the relevant assignment is accepted and the data is necessary for that trip.
9. Do not put bearer tokens in query strings or JSONP URLs. Authenticated data operations must use POST bodies and an approved authenticated transport. Public `ack` polling remains only for the existing customer enquiry flow.
10. Use HTTPS only. Configure a real CORS-capable gateway if the Apps Script ContentService deployment cannot safely support the required authenticated browser transport. Do not weaken access controls to work around CORS.

## Suggested private spreadsheet tabs

Create these only after confirming the existing workbook and its headers:
- `Users`: immutable user ID, verified email/phone, role, active flag, created/updated timestamps.
- `Drivers`: immutable driver ID, user ID, verified Google email, verification status, operational status, approved vehicle categories.
- `Vehicles`: vehicle ID, registration, category, fuel, capacity, verification status, active flag.
- `Trip_Assignments`: assignment ID, booking reference, driver ID, vehicle ID, assignment status, assigned timestamp.
- `Trip_Events`: assignment ID, actor ID, event type, event timestamp, location (only when consented/required), notes.
- `Audit_Log`: actor ID, role, action, record ID, timestamp, outcome.

Do not rename or repurpose the existing `Bookings` or `Admin_Dashboard` tabs. Map existing booking columns only after inspecting the real header row. See `WORKBOOK-MAPPING.md` for the exported workbook's actual headers and schema differences.

## API contract to implement

Authenticated Admin:
- `admin.session`: exchange a verified Google identity token for a short-lived session.
- `admin.dashboard`: aggregate counts and operational KPIs.
- `admin.bookings.list`: paginated, filtered booking enquiries.
- `admin.bookings.get`: retrieve a booking by reference with role-appropriate PII.
- `admin.bookings.update`: validate and update enquiry/booking status.
- `admin.assignments.create`: assign a verified driver and vehicle; prevent conflicting active assignments.
- `admin.drivers.list`, `admin.drivers.update`.
- `admin.vehicles.list`, `admin.vehicles.update`.
- `admin.reports.summary`: server-generated aggregates, not raw sheet dumps.

Authenticated Driver:
- `driver.session`: exchange a verified Google identity token for a short-lived driver session.
- `driver.trips.list`: return only that driver's assigned trips.
- `driver.trip.get`: return only the driver's own assignment and minimum required trip details.
- `driver.trip.event`: accept only allowed state transitions (assigned → accepted → arrived → started → completed; cancellation/rejection only through defined rules).
- `driver.profile.get`: return the driver's own profile and operational status.

All endpoints must return a consistent envelope with `ok`, `requestId`, `data` or a safe `error` code. Use server-side idempotency for state-changing actions. Do not return stack traces or internal spreadsheet errors.

## Frontend modules

- `../www/admin/`: Admin workspace shell. It deliberately displays no private data and keeps actions disabled until secure Admin APIs exist.
- `../www/driver/`: Driver workspace shell with Google Identity Services loaded using the public Web Client ID. The callback is an identity-handshake smoke test only: it does not persist, decode, or transmit the credential, and it does not enable driver access. Trip data and actions remain disabled until secure backend verification and driver allowlisting exist.
- `../www/modules.css`: shared module styling.

## Release gates

1. Configure a Google OAuth web client ID and approved driver Google emails.
2. Review actual Apps Script source and existing sheet headers before writing the adapter.
3. Add and test the extension in a staging copy of the Apps Script deployment and spreadsheet.
4. Test owner, operations, read-only, active driver, inactive driver, wrong-driver, expired-session and unauthenticated cases.
5. Verify no private data is returned by public `quote`, `bootstrap`, `ack` or customer `booking` actions.
6. Test concurrent driver assignments and duplicate status requests.
7. Keep the current customer API actions backward-compatible.
8. Keep the production deployment version unchanged until all checks pass and the owner approves rollout.

## Official pricing and quota references

- Firebase phone authentication SMS is billed per SMS and requires the Blaze plan: https://firebase.google.com/pricing/
- Firebase FAQ confirms SMS phone authentication requires a Cloud Billing account: https://firebase.google.com/docs/auth/faq-and-troubleshooting
- Apps Script email quotas (for optional email OTP fallback): https://developers.google.com/apps-script/guides/services/quotas


## Google Sign-In staging checkpoint (18 Nov 2026)

- Google OAuth Web Client ID is configured in `app/www/driver/google-auth.js` as a public browser identifier. It is not a secret.
- The configured JavaScript origin is `https://vimlesh1996.github.io`. The owner must save this origin in Google Auth Platform before testing.
- The current driver page uses Google Identity Services popup UX and renders Google's official sign-in button.
- The callback intentionally discards the credential. It does not log, decode, persist, or send the ID token. The page only reports that a Google identity response was received.
- This is **not** ZEVON driver authentication. No driver session is issued and no driver data/actions are enabled.
- The OAuth app is in Testing mode; add test accounts under Audience → Test users.
- Do not publish this branch through the repository's existing GitHub Pages configuration until its deployment source and custom-domain mapping are checked. The repository contains a root `CNAME` for the production domain; a Pages branch switch could affect the live website.
- Never commit a Client Secret or downloaded OAuth client JSON. The previously exposed secret should be rotated/revoked in Google Cloud Console; the replacement secret must remain private and is not needed by this browser-only GIS test.

### Next implementation gate

Build a staging-only backend endpoint that verifies the Google ID token server-side (issuer, audience, signature, expiry and verified email), maps the email to an active immutable Driver_ID, and issues a short-lived session. Only after that endpoint and a staging driver registry are tested may the UI exchange the credential and show driver data.
