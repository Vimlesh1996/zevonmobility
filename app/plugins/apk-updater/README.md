# ZEVON direct APK updater

Android-only Capacitor plugin. It downloads an APK from the official ZEVON GitHub Releases repository and opens Android's package installer only after native verification. Android always requires the user to confirm installation; silent installation is not supported for an ordinary app.

## Update trust checks

The web layer validates the published `update.json` against the shared `www/update-manifest.js` contract and passes the expected values (including both `version` and `versionCode`) to this plugin. The signed-release workflow generates that manifest from the exact APK after signing and verifies package name, version name, version code and signer fingerprint before attaching it to the same GitHub Release. The manifest schema is:

- `version`: canonical `MAJOR.MINOR.PATCH` (no leading zeroes)
- `versionCode`: `major * 1,000,000 + minor * 1,000 + patch`; minor and patch are each 0–999 and the result must fit a positive Android 32-bit version code
- `packageName`: `com.zevon.mobility`
- `apkUrl`: exact versioned GitHub Release asset URL
- `sha256`: SHA-256 of the exact APK bytes
- `signerSha256`: SHA-256 certificate fingerprint reported by `apksigner`
- `notes`: optional release notes text

The native layer independently checks that the semantic version, encoded versionCode, URL tag and APK filename agree before download. It then:

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
- Node tests cover the shared manifest schema, strict version encoding, generated signed-APK metadata, URL pinning, version ordering, native cache cleanup and app contract behavior.
- Android CI builds a temporary signed release APK with a short-lived CI-only key to exercise the generated Gradle signing configuration. It does not use the production release key.
- A physical install-over test and WebView cache inspection are still required before publishing a production update.
