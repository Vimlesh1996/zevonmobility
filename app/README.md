# ZEVON Mobility App

Separate customer-facing app and Android wrapper. The existing production website and its GitHub Pages root remain separate.

## Modules

- Customer: `www/` — enquiry-first booking using the existing Apps Script customer endpoint.
- Admin: `www/admin/` — public-safe locked workspace shell. The separate Apps Script staging portal provides an admin-only synthetic assignment console; it is not yet wired into this app page.
- Driver: `www/driver/` — public-safe locked workspace shell. The separate Apps Script staging portal provides allowlisted driver sign-in and synthetic trip workflow; it is not yet wired into this app page.

## Current backend integration

The customer module uses the currently deployed Apps Script Web App URL already present in the public website. It uses the existing `booking` POST and `ack` receipt polling contract.

The customer module uses the currently deployed production Apps Script endpoint. A separate staging Apps Script implementation is included at `backend/apps-script-staging/` for Google OAuth allowlisting, short-lived sessions, Admin assignment and Driver trip status tests against a separate staging spreadsheet. It is deliberately isolated from production and is not connected to the static `www/admin/` and `www/driver/` shells yet. Do not expose the private Google Sheet or add admin/driver secrets to frontend code.

## URLs after GitHub Pages deployment

- App entry: `https://zevonmobility.com/app/`
- Customer app: `https://zevonmobility.com/app/www/`
- Admin workspace: `https://zevonmobility.com/app/www/admin/`
- Driver workspace: `https://zevonmobility.com/app/www/driver/`
- Existing website: `https://zevonmobility.com/`

## Android and direct APK updates

- Android app checks the latest public GitHub Release on app launch (six-hour cache).
- When a newer signed APK is published, an in-app update notice appears.
- The native updater downloads the HTTPS GitHub Release asset, verifies its SHA-256 digest, then opens the Android installer. Android confirmation is required.
- Signed release builds are tag-triggered by `.github/workflows/zevon-signed-apk-release.yml`.
- One-time keystore creation and GitHub Actions secret configuration: `ANDROID-DIRECT-UPDATE-SETUP.md`.
- The permanent signing key is essential. Do not lose it, rotate it, or commit it.

## Android

- Application ID: `com.zevon.mobility`
- Display name: `ZEVON Mobility`
- Web assets: `www/`

Build a debug APK locally:

```bash
cd app
npm install
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

A signed Play Store AAB requires a release keystore and GitHub Actions secrets. Never commit signing keys or passwords.

## Release safety

- Use `zevon-final-v1` as the integrated release-candidate branch; keep `main` as production.
- Review and merge via pull request.
- Do not edit root website files, `CNAME`, sitemap, robots.txt, pricing scripts, or GitHub Pages settings as part of app work.
- Do not switch GitHub Pages deployment settings in this phase.
- Test a clearly marked enquiry and verify its receipt in the private Bookings sheet.
- Keep Admin and Driver actions disabled until secure backend endpoints are deployed and tested in staging.
