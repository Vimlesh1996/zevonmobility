# ZEVON direct APK updater plugin

Android-only Capacitor plugin. It checks the Android per-app install permission and downloads HTTPS GitHub Release APK assets into the app cache, then opens the Android package installer using FileProvider. Android always controls the final install confirmation.

The app must be signed with the same private release key for every update. Never use a debug APK as an upgrade over a differently signed production APK.
