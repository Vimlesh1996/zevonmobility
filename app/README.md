# ZEVON Mobility Customer App

Android-first customer app. The production website root and live Apps Script deployment remain separate from this project branch.

## Current status

- Capacitor 7 customer app; Android application ID: `com.zevon.mobility`.
- Six enquiry trip types and five-tab navigation (Home, Book, My Requests, Offers, More).
- Existing requestId + Apps Script acknowledgement submission contract retained. An enquiry is not a confirmed booking.
- My Requests stores up to the last 20 server-confirmed enquiry references locally on this device; it is not a live backend status feed.
- Native Capacitor builds do not register the browser service worker. The updater removes stale native service-worker/cache state once per installed version.
- The More screen reads the installed Android version from the native plugin; the HTML version is only a readable web fallback.
- The updater reads the latest published `update.json` release asset, pins downloads to this repository, and verifies APK checksum, package ID, versionCode and signing certificate before opening Android's installer.
- Android always requires the user to confirm installation. Silent install is not supported for ordinary apps.
- No FCM background APK download is included in the Phase 0 release.

## GitHub Actions validation

Every relevant pull request and push to `feature/customer-app-rebuild` runs:
- JavaScript lint for `app.js` and `apk-updater.js`
- Node contract and regression tests
- Native JUnit policy tests for updater URL, checksum, package, signer and versionCode checks
- Capacitor Android project generation
- Generated manifest hardening (`android:allowBackup=false`)
- Debug APK build
- Temporary-key signed release build with v1.0.9 metadata assertions

The CI-only key is generated on the runner and is not the production signing key.

## Signed release workflow

The signed workflow lives on `main` because that branch hosts the production website and Actions workflows; the app source remains on `feature/customer-app-rebuild`. Do not merge the app directory into `main`, because GitHub Pages deploys the website from the root of that branch.

A release tag must point to a commit that is already on `feature/customer-app-rebuild`. The workflow checks tag/commit parity and branch ancestry before building.

Required GitHub Actions repository secrets:
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEYSTORE_PASSWORD`

The original signing-key generator set the private-key password equal to the keystore password. The workflow therefore uses `ANDROID_KEYSTORE_PASSWORD` for both Gradle password fields; a separate `ANDROID_KEY_PASSWORD` secret is not required.

A tag push builds and creates a **Draft GitHub Release** only after APK verification. The workflow also supports manual dry-run for an existing tag; with dry-run enabled it builds and verifies but creates no release. Review the draft, test install-over on a physical phone, then publish it manually. Existing releases/assets are never overwritten.

## Signing-key continuity

The v1.0.7 and v1.0.8 APKs were inspected and share the release certificate fingerprint:

`A37023520C83251D22A5EF560041AD78A380ED0266DF9B550685155B82990453`

Keep the existing release keystore; do not generate a replacement for routine releases. Never commit or share the keystore, password, service-account JSON, access tokens or customer data. Keep a secure offline encrypted backup. Key rotation requires a deliberate migration plan because installed apps depend on signing continuity.

## Backend boundary

The existing production Apps Script requestId/ack integration is retained. Do not change the live deployment, spreadsheet permissions, endpoint or data model without a separately scoped owner-approved change. Fare quotes, live vehicle inventory, offers and server-side request status are later milestones and must use server-provided data only.
