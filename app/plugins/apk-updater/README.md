# ZEVON direct APK updater

Android-only Capacitor plugin. It downloads an APK from the official ZEVON GitHub Releases repository and opens Android's package installer only after native verification. Android always requires the user to confirm installation; silent installation is not supported for an ordinary app.

## Update trust checks

The web layer reads the published `update.json` asset and passes the expected values to this plugin. The native plugin then:

1. Accepts only HTTPS release URLs under `github.com/Vimlesh1996/zevonmobility/releases/download/`.
2. Downloads the APK into the app's private cache.
3. Verifies the SHA-256 checksum from the release manifest.
4. Parses the APK and verifies package ID `com.zevon.mobility`.
5. Verifies the APK signing certificate matches both the manifest fingerprint and the currently installed app.
6. Verifies the APK versionCode exactly matches the manifest and is greater than the installed version.
7. Opens Android's package installer using Capacitor's existing FileProvider.

The installed app's signing key must remain the same across in-place updates. Never publish a debug-signed APK as an update to a release-signed installation.

## Native cache recovery

The updater script is intentionally not part of the service-worker precache. It can therefore run on an older installed build, unregister stale native service workers, delete Cache Storage once per installed version identity, and reload once. Native Capacitor builds no longer register the browser service worker.

## Development and tests

- JavaScript syntax is checked by `npm run lint`.
- Node tests cover URL pinning, manifest fields, version ordering, native cache cleanup and app contract behavior.
- Android CI builds a temporary signed release APK with a short-lived CI-only key to exercise the generated Gradle signing configuration. It does not use the production release key.
- A physical install-over test and WebView cache inspection are still required before publishing a production update.
