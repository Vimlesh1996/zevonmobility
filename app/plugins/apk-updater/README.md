# ZEVON direct APK updater

Android-only Capacitor plugin. It supports the legacy in-app update action and FCM-triggered background updates.

## Update flow

- Subscribes to the Firebase topic `zevon-app-updates` when the default Firebase app is configured.
- Receives data-only FCM release events.
- Schedules an expedited WorkManager download with network connectivity required.
- Shows download progress in an Android notification.
- Verifies the GitHub Release SHA-256 digest, package ID, and APK signing certificate against the installed app.
- Posts an **Install update** notification and opens Android's package installer when tapped.
- Requests Android 13+ notification permission through the Capacitor method `requestNotificationPermission()`.

Android always requires the user to confirm installation; silent installation is not supported for an ordinary app.

## Firebase setup

Register Android package `com.zevon.mobility` in Firebase and add the downloaded `google-services.json` at `app/google-services.json`. The signed release workflow applies the Google Services Gradle plugin when this file exists.

Add a Firebase service account JSON as the GitHub Actions secret `FCM_SERVICE_ACCOUNT_JSON`. The release workflow uses it to send the version, GitHub Release APK URL, and SHA-256 digest to the `zevon-app-updates` topic. Never place the service-account JSON or release keystore in the Android app or commit either credential.

If Firebase configuration is missing, the app does not subscribe to FCM and the workflow skips sending notifications when the service-account secret is absent.

## APK signing

Every update must use the same application ID (`com.zevon.mobility`) and the same private release signing key as the installed app. Never publish a debug-signed APK as an update to a release-signed installation. Keep signing credentials in GitHub Actions secrets; never commit a keystore or passwords.
