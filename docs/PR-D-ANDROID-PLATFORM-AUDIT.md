# PR-D — Android platform integration audit

## Verified source baseline

- Feature base: 77a1da8d3018a81016de042489c647909cdefddc (PR #18 merge).
- Capacitor packages resolved by app/package-lock.json: @capacitor/android and @capacitor/core 7.6.10.
- Capacitor 7.6.10 upstream Android template:
  - Declares androidx.core.content.FileProvider.
  - Uses authority ${applicationId}.fileprovider, android:exported=false, and android:grantUriPermissions=true.
  - References @xml/file_paths.
  - Default file_paths.xml exposes both the entire external storage root and the entire app cache root.
- ZEVON native updater uses authority <applicationId>.fileprovider and writes to Context.getCacheDir(). The generated Capacitor provider authority matches, but the default paths file is broader than required.
- The updater launches ACTION_VIEW with an APK MIME type and FLAG_GRANT_READ_URI_PERMISSION; Android's package installer remains responsible for final user-confirmed installation.
- The source app has no Firebase Messaging / Capacitor Push Notifications dependency or active FCM receiver implementation in its package manifest. FCM nudges therefore remain disabled.

## Changes introduced on this isolated PR-D branch

1. Add scripts/configure-android-platform.py, run after npx cap add android:
   - Fails closed unless exactly one expected app FileProvider exists.
   - Enforces non-exported provider and temporary URI grants.
   - Keeps the existing @xml/file_paths metadata binding.
   - Narrows FileProvider exposure to only cache/apk-updates/; removes broad external-storage and whole-cache mappings.
   - Declares POST_NOTIFICATIONS for API 33+ readiness. This declaration does not grant permission or display a prompt; runtime request flow remains intentionally inactive until push notification integration is separately reviewed.
2. Native updater writes the APK to the dedicated cache/apk-updates/ directory, validates the canonical parent directory, and adds a ClipData URI alongside the read grant for installer handoff.
3. Installer handoff response is renamed to installerLaunched to avoid implying that Android installation completed. Android still presents its own confirmation UI.
4. Android CI verifies the merged debug manifest contains the expected provider, resolved authority, permissions and metadata; validates the source paths XML and uploads the merged manifest/path XML as review evidence.
5. Add fixture tests for the manifest configuration script, including missing/duplicate provider fail-closed behavior.

## Remaining validation / explicit limitations

- CI can validate the generated/merged manifest and compile the Android app, but cannot prove OEM installer behavior or user confirmation on physical devices.
- Test the content://com.zevon.mobility.fileprovider/... URI resolution on Android 12, 13 and 14/15 devices and verify the receiving installer can read the APK.
- Verify the system installer opens, displays the expected package/version, requires explicit user confirmation, and returns to ZEVON correctly. A successful intent launch is not an install-success signal.
- Android 8+ unknown-app-source permission remains separate from Android 13+ notification permission. The updater's existing canRequestPackageInstalls() and settings handoff must be tested on-device.
- POST_NOTIFICATIONS is declared but no runtime request is triggered. A future push integration must request permission contextually on API 33+ and handle denial; do not enable FCM nudges until that and updater device tests pass.
- Do not add Firebase/push dependencies or enable FCM as part of this PR-D scope.
- No production release, Firebase setting, website deployment, signing key or main branch change is authorized.