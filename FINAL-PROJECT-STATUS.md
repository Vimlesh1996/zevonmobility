# ZEVON Final Project — Release Candidate

This branch consolidates the current multi-page ZEVON website, customer enquiry app, Android wrapper, and isolated Apps Script Driver/Admin staging portal into one reviewable release candidate.

## Included
- Existing multi-page public website, original assets, CNAME, sitemap and robots file copied from the production baseline.
- Customer booking page with approved Google Sheets Rate_Card quote lookup and enquiry submission through the existing Apps Script endpoint.
- Browser-side round-trip distance fix: browser sends one-way kilometres; Apps Script quote engine doubles once for Outstation Round-Trip.
- Customer app and Capacitor Android wrapper.
- Admin and Driver app shells remain locked and show no private records.
- Separate Apps Script staging portal with Google OAuth allowlists, short-lived sessions, synthetic assignments, driver-owned trip lists, guarded trip status transitions and audit events.
- Automated Node.js contract tests and Android build workflow.

## Critical architecture boundary
The public customer website/app still uses the existing deployed Apps Script customer endpoint. The separate Driver/Admin Apps Script project is staging-only and is bound to a separate staging spreadsheet. It does not connect to production bookings and is not yet wired into the static Admin and Driver app shells.

Do not add production booking records or real passenger/driver PII to the staging spreadsheet. Use synthetic test data only.

## Fare and route contract
- Map routing returns one-way route kilometres.
- Browser sends that one-way value in rate lookup, final quote lookup and booking enquiry.
- Corrected Apps Script quote engine applies the round-trip multiplier exactly once.
- For multi-day outstation round trips, route kilometres remain fixed; daily included kilometres and per-day allowances scale by trip days.
- GST supports decimal (0.18) or whole percentage (18) inputs in the corrected customer quote script.
- Toll/parking is not automatically calculated by this route contract; quote separately when applicable.

## Run automated checks
From repository root:
```bash
cd app
npm test
```
Tests verify the browser-to-server route distance contract. They do not replace a live Apps Script integration test.

## Build Android debug APK
```bash
cd app
npm install
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```
The GitHub Actions workflow runs Node contract tests before building the Android debug APK and uploads the APK as a short-retention artifact.

## Release gates before production
1. Run the staging Apps Script project against a separate private staging spreadsheet.
2. Verify Google OAuth client configuration and redirect URI; keep client secret in Apps Script Script Properties only.
3. Test active/inactive Admin and Driver accounts, wrong-role access, expired/revoked sessions, wrong-driver assignment access, invalid status transitions, duplicate submissions and concurrent assignments.
4. Connect the app Admin/Driver shells to staging APIs only after secure transport and server-side authorization are complete. Do not place bearer tokens in URL/JSONP.
5. Verify customer enquiry and receipt in a staging copy of the booking workbook.
6. Reconcile legacy sample price display in assets/site.js against the approved Rate_Card before showing it as a live price.
7. Complete accessibility, mobile browser, map fallback and Android device testing.
8. Review GitHub Pages publishing source and custom-domain mapping before website deployment. Only the default branch should be permitted to deploy.
9. Obtain explicit owner approval before merging, publishing, changing DNS or deploying any production Apps Script version.

## Production safety
This is a release candidate, not a production deployment. The main branch, live GitHub Pages website, custom domain and production Apps Script deployment have not been changed by this branch.