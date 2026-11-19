# ZEVON direct APK updater

Android-only Capacitor plugin. It downloads a signed APK from an official GitHub Release, verifies its SHA-256 digest, then opens Android's package installer through FileProvider. Android always requires the user to confirm installation; silent installation is not supported for an ordinary app.

Every update must use the same application ID (`com.zevon.mobility`) and the same private release signing key as the installed app. Never publish a debug-signed APK as an update to a release-signed installation. Keep signing credentials in GitHub Actions secrets; never commit a keystore or passwords.
