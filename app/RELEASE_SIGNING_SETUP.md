# ZEVON Android release signing — existing key continuity

## Important: do not replace the existing release key

The published v1.0.7 and v1.0.8 APKs were inspected. Both use the same release signing certificate:

`A37023520C83251D22A5EF560041AD78A380ED0266DF9B550685155B82990453`

The v1.0.8 app was installed over the existing app as an Android update. The next release must use the same keystore and alias. **Do not uninstall the current app and do not generate a new signing key for routine updates.**

The old public-repository key-generation workflow has been removed because it packaged a keystore and plaintext password in an artifact. The installed signing key has not been rotated.

## Required GitHub Actions secrets

The signed release workflow reads:

- `ANDROID_KEYSTORE_BASE64`: Base64 encoding of the existing `zevon-release.keystore`.
- `ANDROID_KEY_ALIAS`: the alias inside that keystore.
- `ANDROID_KEYSTORE_PASSWORD`: the existing keystore password.

The original key-generation workflow explicitly set `KEY_PASS="$STORE_PASS"`. The private-key password is therefore the same as the store password; the release workflow uses `ANDROID_KEYSTORE_PASSWORD` for both Gradle fields. A separate `ANDROID_KEY_PASSWORD` secret is not required.

Never commit or share the keystore, password, service-account JSON, OAuth client secret, access token, customer data or driver data. Keep an encrypted offline backup of the original keystore and password.

## Release verification

The signed workflow:
1. Checks out the exact release tag commit and verifies it belongs to `feature/customer-app-rebuild`.
2. Runs lint and tests before decoding the keystore.
3. Generates the Capacitor Android project and disables Android cloud backup for local enquiry data.
4. Uses the shared release configuration script to set package version, Android versionName/versionCode and signing.
5. Builds the signed APK and verifies package ID, versionName, versionCode, signing certificate, checksum and packaged HTML/service worker.
6. Creates a Draft GitHub Release with the APK, checksum sidecar and `update.json`; it refuses to overwrite an existing release.

A manual dry-run can build and verify an existing tag without creating a release. Publish the draft only after the physical v1.0.8-to-v1.0.9 install-over test passes.

## Key rotation

Do not rotate the signing key as a routine cleanup. Rotation requires an explicit Android signing-lineage migration and a device/install-base plan. The present work preserves the existing signing identity.
