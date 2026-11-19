# ZEVON Mobility Customer App

Android-first customer app. The production website root and live Apps Script deployment are not modified by this project branch.

## Current milestone: M1 — Foundation + Home

- Capacitor 7 shell; application ID: `com.zevon.mobility`.
- Responsive customer home with ZEVON navy/red/light visual system.
- Six enquiry trip types and five-tab navigation (Home, Book, My Requests, Offers, More).
- Existing requestId + Apps Script acknowledgement submission contract retained.
- No admin or driver portals in the customer app.
- Direct APK update checker restored for Android builds. It checks the latest official GitHub Release, validates the SHA-256 digest, and opens Android's package installer after the user grants permission.
- Android still requires the user to confirm installation; silent background installation is not available to an ordinary app.
- Signed releases must use the same private keystore as the installed app. The release workflow requires `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEY_ALIAS`, `ANDROID_KEYSTORE_PASSWORD`, and `ANDROID_KEY_PASSWORD` GitHub Actions secrets. Never commit these values or the keystore.
- No externally hosted fonts; system font stack is used until licensed local font assets are bundled.

## GitHub Actions build

Every push to `feature/customer-app-rebuild` touching `app/**` or the Android workflow runs lint, contract tests, Capacitor Android project generation, and a debug APK build. The APK is uploaded as a workflow artifact for 14 days.

Open the repository Actions tab, select **ZEVON Android Build**, open the successful run, then download `zevon-mobility-debug-apk`.

## Local development (optional only)

The project can be installed and run with Node 22, npm, Capacitor CLI and Android SDK 35. The owner has requested GitHub Actions as the development/build environment; no local setup is required for the intended workflow.

## Backend

The existing Apps Script requestId/ack integration is retained in the current customer booking flow. Do not change the live deployment, spreadsheet permissions, endpoint or data model without explicit owner approval. Fare quotes, map search, vehicle inventory, and booking status are subsequent milestones and must use server-provided data only.

## Milestones

- M0 Design: approved.
- M1 Foundation + Home: in implementation; CI and device QA pending.
- M2 Location search, map, route and server quote results.
- M3 Passenger details, verified enquiry acknowledgement and My Requests.
- M4 Corporate, Partner/Fleet, Contact, Offers and content.
- M5 Accessibility, performance, Android QA and store preparation.

## Safety

- Work on `feature/customer-app-rebuild`.
- Do not merge to `main`, deploy GitHub Pages, publish an APK release, change DNS, or modify live Apps Script without explicit approval.
- Never commit signing keys, passwords, tokens, customer lists, or spreadsheet IDs.

## Direct APK updates

The customer app checks the latest GitHub Release on launch and when returning to the foreground (with a six-hour cache). Release assets must be named `ZEVON-Mobility-vMAJOR.MINOR.PATCH.apk` and expose a GitHub SHA-256 asset digest. Publishing a tag such as `v1.0.1` runs `.github/workflows/zevon-signed-apk-release.yml`, builds a signed APK, and publishes it as a GitHub Release asset. Before publishing the first update, confirm the four signing secrets above are present and contain the exact same release keystore and alias used to sign the app already installed on the phone. A different signing key cannot update an existing installation.
