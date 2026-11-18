# ZEVON Mobility App

Separate customer-facing app and Android wrapper. The existing production website and its GitHub Pages root remain separate.

## Modules

- Customer: `www/` — enquiry-first booking using the existing Apps Script customer endpoint.
- Admin: `www/admin/` — operational dashboard shell. Private data and actions remain disabled until secure server-side role authentication is installed.
- Driver: `www/driver/` — driver workspace shell. Trip data and status changes remain disabled until OTP/identity verification and assignment ownership checks are installed.

## Current backend integration

The customer module uses the currently deployed Apps Script Web App URL already present in the public website. It uses the existing `booking` POST and `ack` receipt polling contract.

The deployed Apps Script source is not in this repository. Admin and Driver endpoints are therefore specified in `backend/README.md` and must be implemented against the real script and spreadsheet headers in a staging deployment before enabling those modules. Do not expose the private Google Sheet or add admin/driver secrets to frontend code.

## URLs after GitHub Pages deployment

- App entry: `https://zevonmobility.com/app/`
- Customer app: `https://zevonmobility.com/app/www/`
- Admin workspace: `https://zevonmobility.com/app/www/admin/`
- Driver workspace: `https://zevonmobility.com/app/www/driver/`
- Existing website: `https://zevonmobility.com/`

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

- Develop on `zevon-app-v1`.
- Review and merge via pull request.
- Do not edit root website files, `CNAME`, sitemap, robots.txt, pricing scripts, or GitHub Pages settings as part of app work.
- Do not switch GitHub Pages deployment settings in this phase.
- Test a clearly marked enquiry and verify its receipt in the private Bookings sheet.
- Keep Admin and Driver actions disabled until secure backend endpoints are deployed and tested in staging.
