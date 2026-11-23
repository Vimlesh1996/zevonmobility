# ZEVON Direct APK Auto-Update — Setup & Release Guide

## What the app does

- Checks the latest **published GitHub Release** when the Android app opens (cached for up to six hours).
- Shows an in-app update card when the release tag is newer than the installed version.
- Downloads only a GitHub Release APK over HTTPS.
- Requires the release asset's GitHub SHA-256 digest and verifies the downloaded APK before opening Android's installer.
- Requests Android's per-app "Install unknown apps" permission only when needed.
- Android displays the final install confirmation. Silent installation is not supported on ordinary Android devices.

## One-time signing key setup (owner's computer only)

The signing key is the identity of the app. Keep a secure offline backup. Never commit it, upload it to chat, email it, or put it in the repository.

Generate it once on a trusted computer (use a strong unique password and keep it safe):

```bash
keytool -genkeypair -v -keystore zevon-release.keystore -alias zevon-release -keyalg RSA -keysize 4096 -validity 10000
```

Convert it to a single-line Base64 value locally:

- macOS/Linux: `base64 -w 0 zevon-release.keystore`
- macOS without `-w`: `base64 zevon-release.keystore | tr -d '\\n'`
- Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("zevon-release.keystore"))`

In GitHub, open **Settings → Secrets and variables → Actions → New repository secret** and create:

1. `ANDROID_KEYSTORE_BASE64` — the Base64 output (large secret).
2. `ANDROID_KEY_ALIAS` — `zevon-release` (or the alias chosen).
3. `ANDROID_KEYSTORE_PASSWORD` — keystore password.
4. `ANDROID_KEY_PASSWORD` — key password.

Do not paste any of these secret values into ChatGPT or issues/PR comments. Keep an offline backup of the original keystore and passwords. If the key is lost, future APKs cannot update installations signed with it.

## Publish a new version

After the release-candidate changes are reviewed and merged by the owner, update the app's version as needed and push a semantic version tag, e.g.:

```bash
git tag v1.0.1
git push origin v1.0.1
```

The `ZEVON Signed Direct APK Release` workflow then:
1. checks the four signing secrets;
2. generates the Android project and registers the local Capacitor updater plugin;
3. sets Android versionName/versionCode from the tag;
4. builds and verifies a signed release APK;
5. creates a GitHub Release with `ZEVON-Mobility-vX.Y.Z.apk` and its SHA-256 sidecar.

The app checks that public release and offers the update. Do not reuse a tag/versionCode.

## First signed release migration

The existing debug APK is signed with a debug certificate, not this permanent release key. Android will not install a differently signed APK as an in-place update. For the first release-key migration, uninstall the debug build and install the first signed release APK (this removes app-local data). After that, all future releases signed with the same keystore can update in place.

## Security / production gates

- Keep the keystore private; only GitHub Actions secrets are used by CI.
- Do not rotate or replace the release key for routine updates.
- APK is downloaded to private app cache and checksum-verified before installer launch.
- Android user confirmation is always required.
- Release workflow only runs on version tags; it does not deploy the website, change DNS, or modify Google Sheets/Apps Script.
- The current branch is a release candidate. Do not publish a real release until the owner has added signing secrets, tested the first signed APK on a device, and approved release.
