# ZEVON Direct APK Auto-Update — Setup & Release Guide

## Existing updater

- Android checks the latest published GitHub Release when the app opens and returns to foreground.
- An in-app update card appears when the release is newer than the installed version.
- The user currently taps **Update now** to start the APK download.
- The native updater accepts HTTPS GitHub Release APK URLs and verifies the SHA-256 digest before opening Android's installer.
- Android may ask the user to allow ZEVON to install unknown apps.
- Android displays the final installation confirmation. Silent installation is not supported for ordinary Android apps.

## FCM release-notification pipeline

The signed release workflow now includes an optional post-release FCM notification step. Once configured, each successful version tag sends an Android notification to devices subscribed to the FCM topic `zevon-app-updates`. You can override the topic with the repository Actions variable `FCM_UPDATE_TOPIC`.

One-time Firebase setup:

1. Create/select a Firebase project and register Android package `com.zevon.mobility`.
2. Enable Firebase Cloud Messaging.
3. Create a service account authorized to send FCM messages.
4. Add its complete JSON as GitHub Actions secret `FCM_SERVICE_ACCOUNT_JSON`. Never commit this credential or paste it into chat.
5. Optionally add repository Actions variable `FCM_UPDATE_TOPIC`; default: `zevon-app-updates`.

**Client prerequisite:** The Android app must also include Firebase Messaging, request notification permission on Android 13+, and subscribe to the same topic (or register device tokens). It must handle the `zevon_app_update` message. The repository currently has no Firebase Android config or client-side FCM integration, so adding the Actions secret alone will not make installed apps receive notifications. Add the Firebase project's `google-services.json` and native messaging integration before enabling this in production.

## Automatic download and install prompt

The existing native updater starts downloading only after the in-app button is clicked. FCM notification delivery does not itself download the APK. The remaining Android work is a native WorkManager download worker, persistent progress notification, safe APK validation, and installer handoff.

Target flow:
1. Receive FCM update event.
2. Fetch authoritative latest release metadata and SHA-256 from GitHub.
3. Schedule WorkManager download with network constraints and retry.
4. Verify SHA-256, package identity, and signing certificate.
5. Show a download-complete notification with an **Install** action.
6. Open Android's package installer; the user confirms installation.

Never put Firebase service-account credentials or release signing keys in the Android app.

## One-time signing key setup

Generate the signing key once on a trusted computer and keep an offline backup:

```bash
keytool -genkeypair -v -keystore zevon-release.keystore -alias zevon-release -keyalg RSA -keysize 4096 -validity 10000
```

Create these GitHub Actions secrets:
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_PASSWORD`

Do not paste secrets into ChatGPT, issues, or PR comments. If the key is lost, future APKs cannot update installations signed with it.

## Publish a version

After review and merge, push a unique semantic version tag, for example:

```bash
git tag v1.0.2
git push origin v1.0.2
```

The signed release workflow builds and publishes the APK, then sends the FCM topic notification if `FCM_SERVICE_ACCOUNT_JSON` is configured. A normal branch push does not update installed Android apps. Never reuse a tag/versionCode.

## First signed release migration

The existing debug APK uses a debug certificate. Android will not install a differently signed APK as an in-place update. For the first release-key migration, uninstall the debug build and install the first signed release APK (this removes app-local data). Later releases must use the same application ID and signing key.

## Production gates

- Keep signing keys and Firebase service-account JSON private in GitHub Actions secrets.
- Verify APK checksum and signing identity before install.
- Android user confirmation is always required.
- FCM delivery remains inactive until Firebase config, Actions secret, Android client subscription, and message handling are all configured.
- Do not publish a production release until signed APK installation is tested on a real device.
