# ZEVON Mobility Customer App

Android-first customer app. The production website root and live Apps Script deployment are not modified by this project branch.

## Current milestone: M1 — Foundation + Home

- Capacitor 7 shell; application ID: `com.zevon.mobility`.
- Responsive customer home with ZEVON navy/red/light visual system.
- Six enquiry trip types and five-tab navigation (Home, Book, My Requests, Offers, More).
- Existing requestId + Apps Script acknowledgement submission contract retained.
- No admin or driver portals in the customer app.
- No direct APK self-updater. Future distribution updates should use Google Play in-app updates for Play builds.
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
