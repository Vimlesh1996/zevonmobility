# ZEVON Mobility App

A separate customer-facing web app and Android wrapper. The existing production website and its GitHub Pages root remain separate.

## Current phase

Phase 1 implements customer trip enquiries using the existing Google Apps Script Web App endpoint already used by the ZEVON website. It sends the same booking fields and verifies receipt using the existing `ack` JSONP action and request ID pattern.

The app does **not** claim that an enquiry is a confirmed booking, does not expose the private Google Sheet, and does not display sample fares as approved quotations.

## URLs

- App entry: `https://zevonmobility.com/app/` (redirects to the web app shell)
- Static web app: `https://zevonmobility.com/app/www/`
- Existing website: `https://zevonmobility.com/`

The app folder is served as a subdirectory by the existing GitHub Pages root deployment after this branch is merged.

## Android

- Application ID: `com.zevon.mobility`
- Display name: `ZEVON Mobility`
- Web assets: `www/`

Build a debug APK locally:

```bash
cd app
npm ci
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

The debug APK is created at `app/android/app/build/outputs/apk/debug/app-debug.apk`.

A signed Play Store AAB requires a release keystore and GitHub Actions secrets. Do not commit signing keys or passwords.

## Existing backend contract

The app uses the currently deployed Apps Script URL configured in `www/app.js`. It uses:
- POST action `booking`
- Existing request fields: trip, pickup, destination, date, time, passengers, vehicle, name, phone, email, company, notes, fuel and website
- GET JSONP action `ack` with `rid` to verify receipt

The backend URL is already public in the existing website's client-side code. Never add service-account credentials, private sheet IDs, or admin tokens to this frontend.

## Admin and driver modules

The existing website documentation says admin booking management remains inside the private Google Sheet. No authenticated admin or driver API contract is present in the website repository. Those modules must wait until server-side Apps Script endpoints are designed with authentication, role checks, and least-privilege data access. Do not read the private sheet from browser code.

## Release safety

- Develop on `zevon-app-v1`.
- Review and merge via pull request.
- Do not edit root website files, `CNAME`, sitemap, robots.txt, or existing pricing scripts as part of app work.
- Do not switch GitHub Pages deployment settings in this phase.
- Test an enquiry in a controlled manner and verify the matching receipt in the private Bookings sheet before announcing the app as live.