# ZEVON Android release signing setup

## Important: signing key continuity

Every APK installed as an update must be signed with the same private key as the currently installed APK. The customer app currently being tested was installed from a GitHub Actions **debug APK**. That debug certificate is generated on the GitHub runner and is not a stable release key. Therefore, the first signed release will require a one-time uninstall of the debug build and installation of the first signed release APK. Back up any local-only app data first; the current My Requests history is stored on the device and will be removed by uninstalling.

After the first signed release is installed, keep the release keystore safe and use it for every later release. Losing or replacing it prevents direct APK updates for existing installs.

## Create the permanent release keystore (one time)

On a trusted computer with Java `keytool` installed, run:

```bash
keytool -genkeypair -v -keystore zevon-release.keystore -alias zevon-release -keyalg RSA -keysize 4096 -validity 10000
```

Use a strong unique password. Keep the keystore and both passwords in a secure password manager and an encrypted backup. Never commit the keystore to GitHub or send it in chat.

## Add GitHub Actions secrets

Open repository Settings → Secrets and variables → Actions → New repository secret and add:

- `ANDROID_KEYSTORE_BASE64`: Base64 encoding of the complete `zevon-release.keystore` file (single line).
- `ANDROID_KEY_ALIAS`: `zevon-release`
- `ANDROID_KEYSTORE_PASSWORD`: the keystore password.
- `ANDROID_KEY_PASSWORD`: the key password.

PowerShell can copy the single-line Base64 value to the clipboard:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("zevon-release.keystore")) | Set-Clipboard
```

Paste that value directly into the `ANDROID_KEYSTORE_BASE64` secret. Do not paste secrets into issues, commits, workflow logs, or chat.

## Release process

The signed release workflow is triggered by a version tag such as `v1.0.2`. It runs tests, builds a signed APK, verifies the APK signature, and publishes a GitHub Release with an APK asset named `ZEVON-Mobility-v1.0.2.apk`. The app's in-app updater checks that release and verifies the asset SHA-256 digest before opening Android's installer.

Before creating the first release, verify all four secrets are present and that the new keystore has been backed up. The first signed release is a migration from the currently installed debug build; uninstall the debug build only after the signed release APK has been built and verified, then install that signed APK. Subsequent updates should be in-place Android updates and retain app data.

Android will always ask the user to confirm installation. The updater does not silently install APKs.
