# ZEVON Direct APK Update — Release Guide

## How updates work

- The native app reads the published GitHub Release asset `update.json` (not the unauthenticated GitHub Releases API).
- The manifest contains version, Android versionCode, package name, APK URL, SHA-256 and signing certificate fingerprint.
- The updater accepts only APK URLs under `Vimlesh1996/zevonmobility/releases/download/`.
- Before opening Android's installer, the native plugin verifies the APK checksum, package ID, exact expected versionCode and signing certificate against both the manifest and the installed app.
- The native app removes stale service-worker registrations and Cache Storage once per installed version, then reloads once if stale state existed.
- Android may ask the user to allow ZEVON to install unknown apps. Android always displays the final installation confirmation; silent installation is not supported.

## Existing signing key — do not replace

The published v1.0.7 and v1.0.8 APKs were inspected and use the same release certificate, SHA-256:

`A37023520C83251D22A5EF560041AD78A380ED0266DF9B550685155B82990453`

The installed v1.0.8 app already uses this release signing identity. Do not uninstall it and do not generate a new key for the next update. Replacing the key without a planned Android signing-lineage migration would prevent ordinary in-place updates.

The original key-generation workflow set `KEY_PASS="$STORE_PASS"`. Therefore the Gradle private-key password is the same as the keystore password.

## GitHub Actions secrets

Keep only these repository secrets for the signed workflow:

1. `ANDROID_KEYSTORE_BASE64` — Base64 encoding of the existing release keystore.
2. `ANDROID_KEY_ALIAS` — existing alias.
3. `ANDROID_KEYSTORE_PASSWORD` — existing keystore password (also used as the key password).

Never paste secret values into ChatGPT, issues, PR comments or workflow logs. Keep an encrypted offline backup of the original keystore and password.

The old public-repository workflow that generated and uploaded a keystore plus plaintext password artifact has been removed. The signing key has not been rotated.

## Release process

1. Merge and test app-source changes on `feature/customer-app-rebuild`.
2. Create a semantic tag on the exact tested customer-app commit, e.g. `v1.0.9`.
3. The signed release workflow checks that the tag points to the checked-out commit and that the commit is an ancestor of `feature/customer-app-rebuild`.
4. The workflow runs lint/tests, configures version metadata, builds the signed APK, and checks package ID, versionName, versionCode, signer fingerprint, checksum and packaged HTML/service worker.
5. The workflow creates a Draft GitHub Release with the APK, checksum sidecar and `update.json`. It refuses to overwrite an existing release or assets.
6. Install the draft APK over v1.0.8 on a physical phone without uninstalling. Verify Android App Info and the More screen both show 1.0.9, and the update banner is absent.
7. Verify a phone still on v1.0.8 receives one correct update prompt and completes the install.
8. Publish the draft release only after those checks pass.

## Dry-run

From GitHub Actions, run **ZEVON Signed Direct APK Release** manually with an existing customer-app tag and `dry_run=true`. It builds and verifies the APK but creates no GitHub Release. Set `dry_run=false` only when you intend to create a draft release.

Do not reuse tags or versionCodes. The version-code formula is `MAJOR × 1,000,000 + MINOR × 1,000 + PATCH`; MINOR and PATCH must each be 0–999.

## Safety boundaries

- Do not publish the APK before physical install-over validation.
- Do not merge the experimental FCM background-download branch into the v1.0.9 release.
- Do not change production Apps Script, Google Sheets, website Pages settings or DNS as part of APK release work.
- Android user confirmation remains required.


## PR-D platform integration note

The app's generated Capacitor FileProvider must be configured by running `python3 scripts/configure-android-platform.py` after `npx cap add android`. This limits shareable files to `cache/apk-updates/` and declares `POST_NOTIFICATIONS` for Android 13+ readiness. The permission declaration does not grant notification access or request it at runtime. Keep FCM nudges disabled until a reviewed push-permission flow and physical-device tests pass.

The updater checks `canRequestPackageInstalls()` on Android 8+ and can open the per-app unknown-app-sources settings page. This permission is separate from `POST_NOTIFICATIONS`; test both settings return behavior and installer handoff on supported physical devices.
