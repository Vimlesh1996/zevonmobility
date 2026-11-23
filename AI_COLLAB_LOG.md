# ZEVON Mobility — AI Collaboration Log

**Project Owner:** Vimlesh Yadav  
**Lead Developer / Implementation Partner:** ChatGPT (OpenAI)  
**Independent Technical Reviewer:** Google Gemini  
**Repository:** https://github.com/Vimlesh1996/zevonmobility  
**Coordination issue:** https://github.com/Vimlesh1996/zevonmobility/issues/14

> This file is the durable project record. The coordination issue is the discussion and approval trail. Update this log with commit-pinned source references and verifiable test evidence.

## 1. Release status

**Status: NOT READY FOR PRODUCTION RELEASE.**

No production merge or release until the release gates in section 7 are satisfied and the Project Owner has approved the release.

## 2. Repository baseline — audit snapshot 23 November 2026

| Area | Snapshot |
|---|---|
| Production/default branch | `main` — `9204c5af5efc2ef75733b8080dba9cdc855c93f3` |
| Android app work | `feature/customer-app-rebuild` — `63a14de10a4e3e6eed875d08c5a0e67fc1b4882c` |
| PR #2 | Open, draft — `zevon-final-v1` → `main` |
| PR #3 | Open, draft — `feature/direct-apk-auto-update` → `zevon-final-v1` |
| PR #4 | Closed, not merged; historical/rejected updater implementation |
| Latest known Android feature CI | Run [44892459107](https://github.com/Vimlesh1996/zevonmobility/actions/runs/44892459107), success on feature SHA above; used temporary CI signing material |
| Latest known Pages deploy | [Run 44892481516](https://github.com/Vimlesh1996/zevonmobility/actions/runs/44892481516), success on main SHA above |
| Latest known published release | [v1.0.8](https://github.com/Vimlesh1996/zevonmobility/releases/tag/v1.0.8); audit found no `update.json` asset in that release |

These are dated audit observations, not claims that the refs or statuses remain unchanged. Recheck GitHub before each implementation or release decision.

## 3. Approved architecture and constraints

- Retain the interactive in-app updater and FCM notification-nudge architecture.
- FCM tells the user an update is available; the user opens ZEVON and initiates the in-app update.
- The updater validates the release manifest, APK integrity, package identity, version policy and signing identity before handing off to Android's user-confirmed package installer.
- Do not revive PR #4's background APK download / receiver-triggered installer flow.
- Preserve the production website at https://zevonmobility.com.
- Keep Android app changes isolated from website routes and production deployment paths until reviewed and approved.
- Never commit keystores, private signing keys, tokens, passwords or other secrets.

## 4. Commit-pinned source map for independent review

All links below refer to feature commit `63a14de10a4e3e6eed875d08c5a0e67fc1b4882c`.

### Native updater and client integration

- [ApkUpdaterPlugin.java](https://github.com/Vimlesh1996/zevonmobility/blob/63a14de10a4e3e6eed875d08c5a0e67fc1b4882c/app/plugins/apk-updater/android/src/main/java/com/zevon/mobility/updater/ApkUpdaterPlugin.java)
- [ApkUpdatePolicy.java](https://github.com/Vimlesh1996/zevonmobility/blob/63a14de10a4e3e6eed875d08c5a0e67fc1b4882c/app/plugins/apk-updater/android/src/main/java/com/zevon/mobility/updater/ApkUpdatePolicy.java)
- [Updater AndroidManifest.xml](https://github.com/Vimlesh1996/zevonmobility/blob/63a14de10a4e3e6eed875d08c5a0e67fc1b4882c/app/plugins/apk-updater/android/src/main/AndroidManifest.xml)
- [Web updater](https://github.com/Vimlesh1996/zevonmobility/blob/63a14de10a4e3e6eed875d08c5a0e67fc1b4882c/app/www/apk-updater.js)
- [Updater README](https://github.com/Vimlesh1996/zevonmobility/blob/63a14de10a4e3e6eed875d08c5a0e67fc1b4882c/app/plugins/apk-updater/README.md)
- [Direct update setup guide](https://github.com/Vimlesh1996/zevonmobility/blob/63a14de10a4e3e6eed875d08c5a0e67fc1b4882c/app/ANDROID-DIRECT-UPDATE-SETUP.md)

### GitHub Actions

- [Android CI workflow](https://github.com/Vimlesh1996/zevonmobility/blob/63a14de10a4e3e6eed875d08c5a0e67fc1b4882c/.github/workflows/zevon-android.yml)
- [Signed APK release workflow](https://github.com/Vimlesh1996/zevonmobility/blob/63a14de10a4e3e6eed875d08c5a0e67fc1b4882c/.github/workflows/zevon-signed-apk-release.yml)
- [Signing-key generation workflow](https://github.com/Vimlesh1996/zevonmobility/blob/63a14de10a4e3e6eed875d08c5a0e67fc1b4882c/.github/workflows/zevon-generate-signing-key.yml)

## 5. Independent audit findings to resolve

1. **Repository governance:** protect `main`, require appropriate CI checks/reviews, and guard production website deployment.
2. **Release manifest:** generate and publish `update.json` with versionName, versionCode, APK URL and SHA-256; verify every field against the actual signed release asset.
3. **Workflow permissions:** use least privilege; keep `contents: write` only on the release-publishing job if needed.
4. **Action maintenance:** inspect Node runtime/deprecation annotations; upgrade compatible actions and pin third-party actions to immutable commit SHAs.
5. **Download hardening:** enforce a maximum APK size (initial proposal: 100 MiB, subject to confirming actual app package size), strict HTTPS and redirect host policy, and safe handling of partial/interrupted downloads.
6. **Concurrency:** prevent parallel downloads (for example, an atomic single-flight guard) and reliably release the lock on every success/failure path.
7. **Android behavior:** verify notification permission handling where applicable, `canRequestPackageInstalls()`, FileProvider authority/path configuration, and current signing certificate / key-rotation semantics.
8. **Regression coverage:** tampered checksum, wrong signer, wrong package, downgrade and same-version rejection, oversized APK, redirect rejection, interrupted transfer and rapid repeated taps.
9. **Physical-device proof:** upgrade an already-installed v1.0.8 build to a new APK signed with the permanent production key, without uninstalling, on Android 12, 13 and 14/15 devices. Record device model, Android version, installed/candidate version codes, signer fingerprint, outcome and relevant logs (with secrets/personal data removed).

## 6. Collaboration and change-control protocol

- **ChatGPT:** prepare plans, inspect repository code, implement approved scoped changes on isolated branches, open PRs, report exact paths/line ranges and attach CI/test evidence.
- **Gemini:** independently review source and diffs, identify severity and exact references, challenge assumptions, and provide explicit pass/block recommendations.
- **Project Owner:** approve scope-sensitive changes, production merges, signing-key operations, release publication and production deployment.
- Keep PRs small and focused. Prefer additive documentation and isolated feature branches.
- Do not change signing identity, regenerate or replace production keys, alter production Firebase settings, merge to `main`, publish releases, or deploy the website without explicit approval for that action.
- A successful CI run is not a substitute for permanent-key physical-device upgrade testing.

## 7. Production release gates

- [ ] Main branch protection and required checks are enabled and verified.
- [ ] Production website deployment is protected and path isolation is tested.
- [ ] Signed-release workflow permissions are least-privilege.
- [ ] Release workflow publishes a correct `update.json` and matching APK/SHA-256 assets.
- [ ] Native updater hardening and regression tests pass.
- [ ] Permanent production signing identity is confirmed without exposing private key material.
- [ ] Physical-device upgrade tests pass on Android 12, 13 and 14/15 without uninstalling.
- [ ] Gemini has reviewed the final implementation and recorded explicit sign-off.
- [ ] Project Owner has approved the production merge and release.

## 8. Change history

### 2026-11-23 — Collaboration workspace initialized

- Project Owner authorized creation of a shared GitHub collaboration workspace and repository inspection.
- Created coordination issue #14: https://github.com/Vimlesh1996/zevonmobility/issues/14
- Created this log on a dedicated documentation branch to avoid direct changes to `main` or the Android feature branch.
- No application code, production configuration, secrets, signing keys, release assets or website deployment settings were changed.
- No merge or release was performed.

---

## Update entry template

### YYYY-MM-DD — Short change title

- **Owner/role:**
- **Scope:**
- **Branch / commit:**
- **Files changed:**
- **PR:**
- **Tests and CI evidence:**
- **Gemini review:** Pending / Approved / Changes requested
- **Project Owner decision:**
- **Remaining risks / follow-ups:**


## 9. Gemini line-by-line audit — Part 1 and Part 2 (23 November 2026)

**Audited source snapshot:** `63a14de10a4e3e6eed875d08c5a0e67fc1b4882c`  
**Reviewer:** Google Gemini  
**Disposition:** Findings accepted for remediation planning. Acceptance here does not mean code has been changed or that every proposed implementation detail is final; implementation must preserve the controls and tests below.

### Findings register

| ID | Severity | Finding | Disposition / planned treatment |
|---|---|---|---|
| 1 | High | No maximum APK download size | Blocking. Add a configurable hard cap (100 MiB provisional; confirm against real release APK sizes), enforce while streaming before writing further bytes, delete partial file and reject. |
| 2 | High | Automatic HTTP redirects are not validated | Blocking. Disable automatic redirects; manually follow a small bounded number of redirects and validate HTTPS plus exact allowed hosts on every hop. Initial candidate hosts: `github.com`, `objects.githubusercontent.com`, `release-assets.githubusercontent.com`; verify actual GitHub release redirect chain before finalizing. |
| 3 | Medium | No single-flight download guard | Blocking for release. Add an atomic concurrency guard; reject a second request and release the guard on every terminal path, including exceptions and thread-start failure. |
| 4 | Medium | FileProvider cache path and Android 13+ notification permission need verification | Blocking for enabling FCM notifications / installer handoff. Inspect the merged app manifest and provider paths, test cache URI resolution, and implement runtime notification permission handling for API 33+ where needed. Do not add permissions blindly to a library manifest without checking merge behavior. |
| 5 | Medium | Android CI contains hardcoded v1.0.9 / 1000009 assertions | Non-blocking for the audited v1.0.9 configuration; fix before next version bump. Establish one version source and derive both versionName and versionCode dynamically. |
| 6 | Low | Java and JavaScript manifest/version validation differ | Fix alongside manifest contract work. Align strict semantic version rules and ensure tag version equals APK filename version before presenting the banner. |
| 7 | Critical | Signed release workflow omits update.json | Critical release blocker. Generate manifest from the actual signed APK and certificate, validate required fields and attach it to the same GitHub Release as APK and SHA-256. Required fields identified by reviewer: `apkUrl`, `sha256`, `signerSha256`, `version`, `versionCode`, `packageName`. Verify exact schema against current JS/native consumers before implementation. |
| 8 | High | Workflow-wide contents:write and no production approval gate | Blocking. Default to `contents: read`; isolate release publication with `contents: write` only where required. Add a protected GitHub Environment approval gate before the release job can access production signing secrets or publish. |
| 9 | High | Mutable action tags and npm install without lockfile | Blocking for release workflow. Pin third-party actions to verified immutable full SHAs (reuse vetted pins from Android CI where compatible); use `npm ci` and require a committed lockfile. |
| 10 | Medium | Keystore cleanup and signing-key lifecycle controls are weak | Blocking until lifecycle is confirmed. Add best-effort cleanup of decoded keystore on all job exits; recognize hosted runners are ephemeral and secure deletion cannot be guaranteed by `shred`. Do not disable/delete the key-generation workflow until the owner confirms the permanent production keystore is backed up offline, its fingerprint is verified, and GitHub secrets contain the matching key. Add a strong manual confirmation / environment gate or retire the workflow after that confirmation. Treat the one-time artifact as highly sensitive; verify its access and whether it was ever downloaded. |
| 11 | Low | Release tag parser accepts leading zeros and unbounded minor/patch values | Fix with shared strict version parsing. Reject leading zeros and enforce the versionCode encoding limits (minor and patch <= 999) before signing. |

### Scoped implementation PR plan

Work in this order. Keep each PR narrowly scoped and based on a freshly checked feature branch head. Do not merge or release automatically.

#### PR-A — Native APK download hardening (Findings 1–3)

- Add a maximum byte count during streaming, with early abort and partial-file cleanup.
- Replace automatic redirects with bounded manual redirect handling; require HTTPS and exact allowlisted hosts at each hop.
- Add an atomic single-download guard with complete reset behavior.
- Add unit/instrumentation coverage for oversized streams, rejected HTTP/non-allowlisted redirects, valid release CDN redirects, rapid double taps, and lock reset after failure.
- Keep package, version, checksum and signer verification in the existing trust chain.

#### PR-B — Manifest contract and version consistency (Findings 5–7, 11)

- Confirm the exact manifest schema consumed by `app/www/apk-updater.js` and the native Java policy.
- Create `update.json` from the built signed APK: semantic version, encoded versionCode, package name, canonical release APK URL, SHA-256 and signing-certificate SHA-256.
- Upload the manifest with APK and checksum in the same release operation; fail the workflow if any field or asset is missing/mismatched.
- Align JS and Java validation, including strict version syntax, tag/filename agreement and versionCode bounds.
- Replace hardcoded CI version assertions with derived values from a single version source; add parser/schema tests.
- Test the manifest-generation logic without publishing a production release.

#### PR-C — Signed-release workflow security (Findings 8–10)

- Set least-privilege workflow defaults and isolate publication permissions to the release-publishing job.
- Add a protected production-release environment approval gate before production signing secrets are made available.
- Pin checkout/setup actions to verified full commit SHAs; use `npm ci` with the checked-in lockfile.
- Add cleanup handling for the decoded keystore and temporary signing files; never print secret values.
- Audit artifact access and key-generation workflow lifecycle. Do not run key generation or rotate keys as part of this PR.
- Confirm the existing permanent production key and fingerprint before any release attempt.

#### PR-D — Android platform integration and notification readiness (Finding 4)

- Inspect generated/merged Android manifest and actual FileProvider XML configuration.
- Verify the FileProvider authority and cache-path access with instrumentation tests.
- Verify `canRequestPackageInstalls()` and user-confirmed installer handoff across supported Android versions.
- Add and request `POST_NOTIFICATIONS` appropriately for Android 13+ before enabling FCM notification nudges.
- Keep FCM nudges disabled until updater/release tests and device validation pass.

#### PR-E — Repository governance and production deployment protection

- Enable `main` branch rules requiring relevant CI and review; block direct unreviewed changes.
- Add production website deployment environment/path guards and verify that Android-only changes cannot unintentionally alter website routes or trigger production deployment.
- Verify permissions and required check names against actual workflow runs before enforcing rules.
- This may require repository administration permissions; if unavailable, provide exact settings and request owner/admin action rather than claiming completion.

### Test and acceptance matrix

- [ ] Oversized APK aborts at the configured cap, partial file is removed, updater rejects.
- [ ] HTTP downgrade and untrusted redirect host are rejected; expected HTTPS GitHub release CDN redirects succeed.
- [ ] Concurrent second download is rejected; lock resets after success, exception and thread-start failure.
- [ ] Manifest schema is validated; APK URL, checksum, signer fingerprint, package, version and versionCode match the actual signed APK.
- [ ] Java and JS reject malformed versions, leading zeros, mismatched tag/filename and invalid versionCode ranges.
- [ ] Release workflow waits for production environment approval before accessing signing secrets / publishing.
- [ ] Release workflow uses least privilege, immutable action SHAs and `npm ci`.
- [ ] Keystore cleanup runs on success and failure; signing key lifecycle and artifact access are confirmed.
- [ ] FileProvider cache URI and installer handoff work on physical Android devices.
- [ ] Notification permission flow is verified on Android 13+ before FCM nudge activation.
- [ ] Main branch protection and production deployment guard are verified.
- [ ] Permanent-key upgrade succeeds on Android 12, 13 and 14/15 without uninstalling the existing app.

### Important implementation cautions

- The 100 MiB limit is provisional until actual APK sizes and expected growth are measured.
- Redirect allowlisting must use exact hostnames, not a broad suffix such as `githubusercontent.com`; validate scheme, host, port and hop count on every redirect.
- The FCM notification permission requirement is relevant to notification display/permission behavior on Android 13+, not a reason to enable FCM before the updater is production-safe.
- A GitHub Environment gate should protect the job that receives production signing secrets, not merely a later publishing job after secrets have already been exposed.
- Removing a keystore file on an ephemeral hosted runner is cleanup hygiene, not a substitute for secure secret storage or key lifecycle management.
- Do not generate a new signing key, overwrite GitHub signing secrets, disable the key-generation workflow, create a production tag, or publish a release until the current permanent key's custody and fingerprint are confirmed.

### 2026-11-23 — Gemini Part 2 received and reconciled

- Gemini reported all 11 findings across the seven audited files.
- Added the scoped PR-A through PR-E remediation plan and acceptance matrix.
- No application code, workflow, branch protection, secrets, signing keys, Firebase configuration, release assets or production website settings were changed by this reconciliation.
- Next action: inspect current source and test infrastructure again, then implement PR-A on an isolated branch after confirming the feature branch has not advanced. Gemini should review the resulting diff before merge.


### 2026-11-23 — PR-A merged; PR-B implementation started

- **Owner/role:** Project Owner authorized merge after CI success; ChatGPT implemented the approved merge sequence; Gemini provided conditional final approval.
- **Scope:** PR #16 native APK updater download hardening (findings 1–3).
- **Branch / commit:** `fix/apk-updater-download-hardening` at `b825f946b172229b7cf577b2e4eb9cbb78cb75a1`; squash-merged into `feature/customer-app-rebuild` as `68c951c2dfe85ef6dea6932c8aeadeadb3934c9c`.
- **Files changed:** `ApkUpdatePolicy.java`, `ApkUpdaterPlugin.java`, `ApkUpdatePolicyTest.java`.
- **PR:** [#16](https://github.com/Vimlesh1996/zevonmobility/pull/16) — merged.
- **Tests and CI evidence:** [Android CI run #45151277811](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45151277811) completed successfully; build job `137612998123` completed with conclusion `success`.
- **Gemini review:** Approved for merge contingent on CI #45151277811 success; condition satisfied.
- **Project Owner decision:** Explicitly authorized marking PR #16 ready and merging after successful CI.
- **Remaining risks / follow-ups:** Live release redirect verification and physical-device signed upgrade validation remain production-release gates. The 100 MiB download cap remains provisional pending APK size/growth confirmation. PR-A merge does not authorize production release.
- **PR-B started:** Created isolated branch `feat/update-manifest-contract` from updated `feature/customer-app-rebuild` at merge commit `68c951c2dfe85ef6dea6932c8aeadeadb3934c9c`. Scope: manifest schema alignment, signed-release `update.json` generation, strict version parsing and dynamic CI assertions.


### 2026-11-23 — PR-B opened for independent review

- **Owner/role:** ChatGPT prepared the scoped PR-B implementation; Project Owner retains merge approval; Gemini independent review pending.
- **Scope:** Findings 5–7 and 11: shared manifest schema, signed-APK `update.json` generation, JavaScript/native version agreement, strict versionCode bounds and dynamic CI assertions.
- **Branch / commit:** `feat/update-manifest-contract` at `811624a8e90ad8f2c7afe97b2b7d6bfea0b92666` when PR #17 was opened; branch continues to receive CI-driven fixes if needed.
- **Files changed:** `.github/workflows/zevon-android.yml`; `.github/workflows/zevon-signed-apk-release.yml`; `app/www/update-manifest.js`; `app/www/apk-updater.js`; `app/www/index.html`; `app/scripts/generate-update-manifest.py`; `app/plugins/apk-updater/android/src/main/java/com/zevon/mobility/updater/ApkUpdatePolicy.java`; `ApkUpdaterPlugin.java`; JVM/Node tests; updater README.
- **PR:** [#17](https://github.com/Vimlesh1996/zevonmobility/pull/17) — open draft, targeting `feature/customer-app-rebuild`.
- **Tests and CI evidence:** Android CI run [#45152571060](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45152571060) started for PR #17; Android SDK setup was in progress at the time of this entry. No success claim yet.
- **Gemini review:** Pending.
- **Project Owner decision:** PR-B scope authorized; no merge or production release approval implied.
- **Remaining risks / follow-ups:** Await CI and Gemini review. Confirm real signed release APK metadata and signer fingerprint before first production release. PR-C workflow security controls and PR-D Android platform validation remain separate workstreams.

- **CI update:** Android CI run [#45152571060](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45152571060) completed with `success` on PR #17 head `811624a8e90ad8f2c7afe97b2b7d6bfea0b92666`. All workflow steps passed, including Node lint/tests, dynamic version derivation, Gradle debug/temporary signed APK build, and artifact upload. PR #17 remains open, draft, and unmerged pending Gemini's line-by-line review and Project Owner approval.


### 2026-11-23 — PR-B approved and merged; PR-C branch opened

- **Owner/role:** Project Owner explicitly authorized PR #17 merge. Gemini completed the line-by-line audit and approved the reviewed head.
- **Scope:** PR-B manifest contract and version consistency (findings 5–7 and 11).
- **Branch / reviewed commit:** `feat/update-manifest-contract` at `811624a8e90ad8f2c7afe97b2b7d6bfea0b92666`.
- **PR:** [#17](https://github.com/Vimlesh1996/zevonmobility/pull/17) — marked ready and squash-merged into `feature/customer-app-rebuild`.
- **Merge commit:** `6a396a124b73c8aa34c722367e8c3d7d761bce93`.
- **Tests and CI evidence:** [Android CI run #45152571060](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45152571060) completed successfully on the reviewed head.
- **Gemini review:** Final line-by-line sign-off: APPROVED FOR MERGE, subject to Project Owner authorization. Schema parity, native version/tag/filename checks, dynamic CI assertions, and signed-release manifest generation were verified.
- **Project Owner decision:** Explicit approval received in chat; PR #17 merged only into `feature/customer-app-rebuild`. No merge to `main`, production release, website deployment, Firebase change, or signing-key operation was authorized or performed.
- **Remaining risks / follow-ups:** PR-C must address least-privilege workflow permissions, production environment approval gate, immutable action SHA pins, `npm ci`, keystore cleanup and signing-key lifecycle safeguards. Permanent production signing identity, live redirect chain, and physical-device signed upgrade remain release gates.
- **PR-C isolated branch:** Created `feat/pr-c-signed-release-security` from merge commit `6a396a124b73c8aa34c722367e8c3d7d761bce93`; no PR-C code changes have been made yet.


### 2026-11-23 — PR-C opened for signed-release workflow security

- **Owner/role:** Project Owner authorized proceeding to PR-C after PR-B merge; ChatGPT implemented the initial scoped workflow hardening. Gemini review and PR-C merge authorization are pending.
- **Scope:** Gemini findings 8–10: least-privilege release workflow permissions, production environment gate, immutable action pins, locked npm installation, and decoded-keystore cleanup.
- **Branch / commit:** `feat/pr-c-signed-release-security` at `53dee129f8bfde282d63d9c8c6aa1e0ab43f6e2f` (current PR head at opening).
- **Files changed:** `.github/workflows/zevon-signed-apk-release.yml`; `.github/workflows/zevon-android.yml` (PR path filter); `docs/PR-C-RELEASE-GATE-SETUP.md`.
- **PR:** [#18](https://github.com/Vimlesh1996/zevonmobility/pull/18) — open draft, targeting `feature/customer-app-rebuild`.
- **Tests and CI evidence:** Android CI run [#45163116561](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45163116561) was observed in progress for head `53dee129f8bfde282d63d9c8c6aa1e0ab43f6e2f`; no success claim yet.
- **Gemini review:** Pending.
- **Project Owner decision:** Authorized starting PR-C only. PR #18 is intentionally draft and unmerged; no production tag/release, `main` merge, website deployment, Firebase change, or key rotation occurred.
- **Remaining risks / follow-ups:** The workflow references GitHub Environment `zevon-production-release`, but required reviewers and environment-level signing secrets must be configured and verified by a repository owner before any production tag is pushed. The existing key-generation workflow was deliberately left unchanged and not dispatched: it packages a keystore and credential material in an Actions artifact. Its artifact visibility/history and permanent-key custody need a separate owner-led audit before any redesign or retirement. The PR-C documentation records these safeguards and manual steps.

### 2026-11-23 — PR-C approved, CI passed, and merged

- **Owner/role:** Project Owner explicitly authorized marking PR #18 ready and squash-merging it. Gemini completed the line-by-line security audit and issued final approval contingent on CI success and owner authorization.
- **Scope:** Signed-release workflow security: least-privilege token permissions, protected environment placement before secret injection, immutable action pins, deterministic `npm ci`, keystore cleanup, Android CI path coverage, and manual release-gate documentation.
- **Branch / reviewed commit:** `feat/pr-c-signed-release-security` at `53dee129f8bfde282d63d9c8c6aa1e0ab43f6e2f`.
- **PR:** [#18](https://github.com/Vimlesh1996/zevonmobility/pull/18) — marked ready and squash-merged into `feature/customer-app-rebuild` only.
- **Merge commit:** `77a1da8d3018a81016de042489c647909cdefddc`.
- **Tests and CI evidence:** Android CI run [#45163116561](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45163116561) completed with conclusion `success` on the exact reviewed head `53dee129f8bfde282d63d9c8c6aa1e0ab43f6e2f`.
- **Gemini review:** Final line-by-line audit: APPROVED FOR MERGE. Verified workflow-level `contents: read`, release-job-only `contents: write`, environment gate before secret injection, immutable SHA pins matching Android CI, `npm ci`, and EXIT-trap cleanup.
- **Project Owner decision:** Explicit approval received; PR #18 was marked ready and squash-merged into `feature/customer-app-rebuild`. No merge to `main`, production tag/release, website deployment, Firebase change, or signing-key rotation was performed.
- **Remaining risks / follow-ups:** GitHub Environment required reviewers and environment-level signing secrets still require manual owner configuration and verification before any production tag. The existing key-generation workflow and its artifact/key custody remain subject to separate audit. Production release gates remain open, including live redirect verification and physical-device signed upgrade validation.
- **PR-D started:** Fresh isolated branch `feat/pr-d-android-platform-integration` created from the updated feature head `77a1da8d3018a81016de042489c647909cdefddc`. Scope: inspect merged Android manifest and FileProvider cache-path resolution; verify installer handoff and unknown-app-source flow; assess Android 13+ `POST_NOTIFICATIONS` permission behavior. FCM notification nudges remain disabled until device tests pass.

### 2026-11-23 — PR-D opened: Android FileProvider and installer integration

- **Owner/role:** ChatGPT began the next scoped remediation on an isolated branch after PR-C merge. Gemini review and Project Owner merge authorization remain pending.
- **Base / branch:** Created `feat/pr-d-android-platform-integration` from PR-C merge commit `77a1da8d3018a81016de042489c647909cdefddc`.
- **PR:** [#19](https://github.com/Vimlesh1996/zevonmobility/pull/19) — open draft, targeting `feature/customer-app-rebuild`; current reviewed implementation head at this log update: `879375633e352203ff296c76cbe734c8bf49c46e`.
- **Verified platform baseline:** The app lockfile resolves Capacitor Android/Core 7.6.10. The matching upstream Android template declares a non-exported `${applicationId}.fileprovider` with URI grants and `@xml/file_paths`, but its default paths XML exposes the whole external-storage root and whole app cache. ZEVON's updater saves to `getCacheDir()`, matching the broad cache mapping but not requiring broad access.
- **Implementation:** Added `app/scripts/configure-android-platform.py` to validate the generated FileProvider and narrow shareable paths to `cache/apk-updates/`; declared `POST_NOTIFICATIONS`; moved APK output to that dedicated directory; added canonical-parent validation and ClipData URI grant; renamed the native result to `installerLaunched`; updated docs; added fixture tests; extended Android CI to validate the merged manifest and upload audit evidence.
- **Notification status:** `POST_NOTIFICATIONS` is declared for API 33+ readiness, but no runtime permission prompt is triggered and no FCM/push dependency is enabled in this PR. A declaration does not grant permission. FCM nudges remain disabled until the permission flow and updater behavior pass device testing.
- **Installer status:** Existing code checks `canRequestPackageInstalls()` on Android 8+ and launches `Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES` when needed. The new handoff remains `ACTION_VIEW` with APK MIME type, temporary read grant and ClipData. Intent launch is not installation success.
- **Tests and CI evidence:** PR #19 was opened as draft. No CI run had yet appeared for its current head at the time of this entry; do not claim CI success. Android CI is extended to build and inspect the actual merged debug manifest and upload the manifest/path XML.
- **Gemini review:** Pending.
- **Project Owner decision:** PR-D scope authorized by the collaboration roadmap; PR #19 intentionally remains draft and unmerged pending CI, Gemini review and explicit owner approval.
- **Remaining risks / follow-ups:** Validate the exact merged manifest and resource XML from CI. Test FileProvider URI resolution, unknown-app-source permission return, installer UI and explicit confirmation on physical Android 12, 13 and 14/15 devices. A runtime notification permission request and FCM activation are deliberately not part of this PR. No production release, Firebase configuration, signing key, website deployment or `main` change occurred.

- **PR-D CI update:** Android CI run [#45164494826](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45164494826) started on current PR head `879375633e352203ff296c76cbe734c8bf49c46e`. At the latest check, setup/checkout/toolchain steps had passed and dependency installation was in progress; no CI success claim is made. The workflow includes merged-manifest verification and evidence artifact upload after the build.

### PR-D follow-up — CI passed on initial head; signed-release parity fix queued

- Android CI run [#45164494826](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45164494826) completed `success` on initial PR-D head `879375633e352203ff296c76cbe734c8bf49c46e`. It passed tests, Android build, merged debug manifest verification and audit artifact upload.
- Gemini's requested workflow parity review exposed a gap: the signed production release workflow generated Android but did not run the new FileProvider/POST_NOTIFICATIONS configuration step. This would have left signed builds using the broad Capacitor default FileProvider paths.
- Fixed `.github/workflows/zevon-signed-apk-release.yml` on the PR-D branch: it now runs `python3 scripts/configure-android-platform.py` immediately after `npx cap add android`, and verifies the merged **release** manifest and restricted source paths after `assembleRelease`.
- Updated PR #19 head: `3af87846a87d767b27ae02783a6ac8b04c69e81d`. New Android CI run [#45164817463](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45164817463) was queued for this exact head. The earlier green run does not satisfy the latest-head gate.
- PR #19 remains draft/unmerged. Share final diff/changed-files links for Gemini's line-by-line audit only after run #45164817463 completes successfully.
- FCM remains disabled: no Firebase/Push Notifications dependency or runtime POST_NOTIFICATIONS prompt has been introduced; the permission is declaration-only for readiness.


### 2026-11-23 — PR-D final approval, CI success, and merge

- **Gemini final review:** APPROVED FOR MERGE on exact head 3af87846a87d767b27ae02783a6ac8b04c69e81d, contingent on CI success and Project Owner authorization. Audit covered all 8 changed files, fail-closed FileProvider configuration, dedicated private cache and canonical-parent enforcement, ClipData/read-URI grant, debug/signed-release parity, and confirmation that FCM runtime prompts/nudges remain disabled.
- **CI gate:** Android CI run [#45164817463](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45164817463) completed with conclusion success on the exact reviewed head 3af87846a87d767b27ae02783a6ac8b04c69e81d. Successful job: Build Android debug APK. Artifacts generated and available: zevon-mobility-debug-apk and zevon-android-platform-manifest.
- **Project Owner authorization:** Explicit contingent approval received; condition was satisfied by the successful latest-head CI run.
- **PR:** [#19](https://github.com/Vimlesh1996/zevonmobility/pull/19) was marked ready for review and squash-merged into feature/customer-app-rebuild only.
- **Merge commit:** 6ee499a53b7fa6c8c7a77507957599271700fbca.
- **Safety boundary:** No merge to main, no production release/tag, no website deployment, no Firebase configuration change, and no signing-key operation was performed. FCM runtime prompts and nudges remain disabled; POST_NOTIFICATIONS is declaration-only.
- **Remaining validation:** Physical-device verification remains mandatory for Android 12, 13 and 14/15, including FileProvider URI resolution, unknown-app-source settings return, installer handoff, displayed package/version, explicit confirmation, and successful install-over. Production release gates remain separate.
- **Next scope:** PR-E begins on an isolated branch: repository governance for main (branch protection/required checks) and production website deployment path isolation/guards. If repository administration APIs are unavailable, record exact owner-facing GitHub settings steps; do not weaken existing settings or deploy production.


### 2026-11-23 — PR-E opened: main governance and production Pages isolation

- **PR-D closeout:** PR #19 squash merge `6ee499a53b7fa6c8c7a77507957599271700fbca` is on `feature/customer-app-rebuild`; latest-head CI #45164817463 succeeded on the reviewed commit and Gemini final review approved. No `main` or production release/deployment changes.
- **PR-E branch / base:** `docs/pr-e-repository-governance` created from feature head `6ee499a53b7fa6c8c7a77507957599271700fbca`.
- **PR:** [#20](https://github.com/Vimlesh1996/zevonmobility/pull/20), draft, targeting `feature/customer-app-rebuild`; reviewed head at opening `1236890ea1f7d585835bc5e37cd51fde857adba9`.
- **Scope:** Added `.github/workflows/main-governance.yml` with read-only permissions, actionlint across workflow YAML, and a `Main branch governance` job; added `.github/scripts/check-production-deployment-boundary.py` to verify root site files and `CNAME=zevonmobility.com` and reject a parallel Pages Actions deployment path; added `docs/PR-E-REPOSITORY-GOVERNANCE.md` with exact admin UI steps and safe staged activation order.
- **Repository findings:** Existing ruleset `main` ID `27551879` is `disabled`, has empty include/exclude ref patterns, no required status checks, zero required approvals, and no required conversation resolution. Branch-protection administration endpoint returned HTTP 403 `Resource not accessible by integration`; no settings mutation was attempted. Repository reports Pages enabled and root `CNAME` is `zevonmobility.com`; Pages source branch/folder could not be read via this integration, so owner must verify Settings → Pages.
- **Production isolation:** Recommended Pages source is Deploy from a branch → `main` → `/(root)`. New CI guard does not grant Pages permissions or deploy anything; it checks static site invariants and rejects introducing a Pages Actions deployment workflow. This cannot replace the owner-side Pages setting or active ruleset.
- **CI:** Governance workflow run [#45165855943](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45165855943) triggered for PR #20 on exact head `1236890ea1f7d585835bc5e37cd51fde857adba9`; status was `in_progress` at the time of this log update. PR remains draft/unmerged pending CI and Gemini audit.
- **Safety:** No `main` changes, no Pages settings change, no production website deployment, no Firebase/signing secret changes, and no release tag. Owner-side steps are documented; enable ruleset only after the governance workflow has been promoted to `main` and its check observed green there.


- **PR-E CI follow-up:** Initial governance run [#45165855943](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45165855943) failed because actionlint's ShellCheck reported existing style issue SC2129 in `.github/workflows/zevon-android.yml` (separate app-version output redirects). Grouped the three GitHub output writes into one redirected block without changing values or build behavior. Latest PR-E head is `5da0df4ebe86431e7c6028dbb169b47c1ef51b66`.
- **Latest-head CI:** Governance run [#45166030161](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45166030161) completed `success` on exact head `5da0df4ebe86431e7c6028dbb169b47c1ef51b66`. Both `Validate all GitHub Actions workflows` and `Validate production website deployment boundary` passed.
- PR #20 remains draft/unmerged pending Gemini line-by-line review and owner decision. The earlier failed run is retained as transparent history; the latest-head success is the current gate evidence.


- **PR-E final CI update for current head:** Clarified the ruleset target statement in the PR-E admin document: the API snapshot has empty include/exclude arrays, so the owner must explicitly add `main` and verify the target in the UI. Current PR #20 head is `fc262569415f0e56490c7624f20b814b6e1660f1`. Governance run [#45166228530](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45166228530) completed `success` on that exact head; both actionlint and the production deployment boundary check passed. A duplicate run [#45166228346](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45166228346) was still in progress at the latest check; the successful run already validates the exact current head. PR #20 remains draft/unmerged pending Gemini review and explicit Project Owner authorization.


### 2026-11-23 — PR-E (#20) final Gemini approval and merge

- **Gemini final line-by-line sign-off:** APPROVED FOR MERGE into `feature/customer-app-rebuild` on exact PR head `fc262569415f0e56490c7624f20b814b6e1660f1`. Audit covered all 4 changed files: production Pages boundary guard, governance workflow triggers/least-privilege permissions/pinned actions/check name, Android CI ShellCheck-only formatting correction, and staged administrator rollout instructions.
- **CI evidence:** Governance run [#45166228530](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45166228530) completed `success` on exact reviewed head `fc262569415f0e56490c7624f20b814b6e1660f1`. Both `Validate all GitHub Actions workflows` and `Validate production website deployment boundary` passed. A duplicate run #45166228346 was still in progress at last observation; successful run #45166228530 is the recorded gate.
- **Project Owner authorization:** Explicit approval received to mark PR #20 ready and squash-merge into `feature/customer-app-rebuild` only.
- **PR:** [#20](https://github.com/Vimlesh1996/zevonmobility/pull/20) marked ready for review and squash-merged.
- **Merge commit:** `c5601aa279aa72b599123fd65d122ed7a609bec4`.
- **Scope / safety:** PR-E is the fifth scoped remediation (PR-A through PR-E) now merged into the feature branch. No merge to `main`, no GitHub Pages settings change, no production website deployment, no release/tag, no Firebase change, and no signing-key or secret operation occurred. `main` remains at the previously recorded head until a separate owner-authorized promotion.
- **Remaining Project Owner gates:** (1) GitHub Settings → Pages: verify `Deploy from a branch`, branch `main`, folder `/(root)`, custom domain `zevonmobility.com`, and DNS/domain health; do not change unexpectedly without checking current source. (2) GitHub Settings → Rules → Rulesets: activate existing ruleset ID `27551879`, explicitly target `main`, require PRs, block deletion/force-push, require `Main branch governance` only after the workflow is promoted to `main` in a separate owner-authorized PR and passes there, require conversation resolution, keep bypass list empty; choose approval count based on availability of a second trusted collaborator to avoid owner lockout. (3) GitHub Actions environment `zevon-production-release`: configure required reviewers and production signing secrets, verify environment protection before any tag/release. (4) Physical-device updater testing on Android 12, 13, 14 and 15 with the production signing identity: FileProvider URI resolution, unknown-app-source settings round-trip, installer handoff, package/version shown, explicit user confirmation, and successful in-place upgrade; verify no background install behavior. These remain mandatory before production release.


### 2026-11-23 — PR #21: isolated promotion of main governance workflow

- **Project Owner request:** Prepare a minimal isolated PR to place the existing governance workflow and deployment-boundary guard on `main`; do not modify live website files or merge without separate owner authorization.
- **PR:** [#21](https://github.com/Vimlesh1996/zevonmobility/pull/21), base `main`, head branch `promote/main-governance-to-main`, reviewed head `40e70d7d59387dbccad026c38ee34f22a96b5dad`.
- **Exact diff:** 2 added files only — `.github/workflows/main-governance.yml` and `.github/scripts/check-production-deployment-boundary.py`; 89 additions, 0 deletions. Both files copied from the reviewed feature branch. No root website files, app source, release workflow, Firebase configuration, signing material, Pages settings, secrets, environment settings, or rulesets were changed.
- **CI:** [Run #45167376796](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45167376796) completed `success` on exact head `40e70d7d59387dbccad026c38ee34f22a96b5dad`. The `Main branch governance` job passed both `Validate all GitHub Actions workflows` and `Validate production website deployment boundary`.
- **Important distinction:** This success is on the PR targeting `main`; the workflow has not yet executed on a post-merge `push` to the actual `main` branch. That requires the PR to be merged, which has not been authorized or performed.
- **Settings readable through integration:** Repository metadata confirms default branch `main`, Pages feature enabled (`has_pages=true`), and linked GitHub permission reports admin. Ruleset ID `27551879` is readable and remains `disabled`, with empty `ref_name.include` and `exclude` arrays, no required status checks, and existing deletion/non-fast-forward/PR rules. Branch `main` reports unprotected. Pages configuration and Environment `zevon-production-release` details/secrets/reviewers are not exposed by the supported read endpoints; no changes were made.
- **Owner authorization boundary:** PR #21 remains open and unmerged pending independent Gemini review and explicit Project Owner merge approval. After merge, verify a successful `push`-triggered `Main branch governance` run on the resulting `main` commit before activating ruleset #27551879 to require that check.


### 2026-11-23 — PR #21 approved and merged to main; post-merge governance green

- **Independent review:** Gemini approved PR #21 at exact head `40e70d7d59387dbccad026c38ee34f22a96b5dad`, confirming only the two governance files (89 additions, 0 deletions), no website root changes, `contents: read`, and successful PR CI #45167376796.
- **Project Owner authorization:** Explicitly granted to mark ready and squash-merge PR #21 into `main`.
- **Merge:** PR #21 [merged](https://github.com/Vimlesh1996/zevonmobility/pull/21) by squash at `886fde756d16e80b35bcc284ece8168e619ab379` on 2026-11-23T11:46:26Z. PR had already been marked ready (draft=false) before merge.
- **Exact merged diff:** Only `.github/scripts/check-production-deployment-boundary.py` and `.github/workflows/main-governance.yml`; 2 files, 89 additions, 0 deletions. No production website root files, app source, release workflows, Firebase config, signing material or settings changed by the PR.
- **Post-merge push verification:** [Run #45168184087](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45168184087) triggered by `push` on actual `main`, exact head `886fde756d16e80b35bcc284ece8168e619ab379`, completed `success`. Job `Main branch governance` passed both actionlint and production website deployment-boundary validation.
- **Current main:** `886fde756d16e80b35bcc284ece8168e619ab379`.
- **Owner next steps:** Complete GitHub UI verification/configuration. Environment `zevon-production-release` must contain all four environment-scoped secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEY_ALIAS`, `ANDROID_KEYSTORE_PASSWORD`, and `ANDROID_KEY_PASSWORD`; configure required reviewer(s). Verify Pages source is Deploy from a branch → `main` → `/(root)`, custom domain `zevonmobility.com`. Then activate ruleset #27551879 with include pattern `main` and required status check `Main branch governance`, preserving no bypass actors.
- **Boundary:** No ruleset, Pages, environment, secret, reviewer, Firebase, signing key, production release or deploy settings were changed by the integration. Physical Android 12–15 signed upgrade testing remains pending.

### 2026-11-23 — PR #22 approved and promoted: protected signed dry-run APK workflow

- **Project Owner:** Explicit authorization received to mark PR #22 ready and squash-merge it into `main`.
- **Independent review:** Gemini returned **APPROVED** for exact head `5c06de7734cb6d6a5415b29fa9871f5c526d3332`, noting that the raw YAML diff should be captured in this log.
- **PR:** [#22](https://github.com/Vimlesh1996/zevonmobility/pull/22), `test/android-signed-dry-run-artifact` → `main`; one changed file only: `.github/workflows/zevon-signed-apk-release.yml`. No website root files changed.
- **Latest-head CI:** [Workflow validation #45173035644](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45173035644) succeeded (actionlint); [Main branch governance #45173035614](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45173035614) succeeded. The signed APK workflow's PR validation run [#45173035768](https://github.com/Vimlesh1996/zevonmobility/actions/runs/45173035768) also completed successfully; this was validation only, not a signed build or release.
- **Key YAML controls reviewed (excerpt):**

```yaml
permissions:
  contents: read

jobs:
  signed-release:
    if: github.event_name != 'pull_request'
    environment:
      name: zevon-production-release
    permissions:
      contents: read
    # ... signing secrets are mapped only inside this protected job ...

  publish-release:
    if: github.event_name == 'push'
    needs: signed-release
    permissions:
      contents: write
    # ... creates the GitHub Release only for tag-push events ...
```

- **Manual dispatch safeguards (excerpt):**

```yaml
on:
  workflow_dispatch:
    inputs:
      test_version:
        required: true
        default: "1.0.9"
        type: string
      dry_run:
        required: true
        default: true
        type: boolean

# In the manual-dispatch provenance check:
if [ "${{ inputs.dry_run }}" != "true" ]; then
  echo "::error::This manual workflow is artifact-only. dry_run must remain true."
  exit 1
fi
```

- **Dry-run output:** Manual dispatch checks out the current `feature/customer-app-rebuild` head, validates all four environment-scoped signing secrets, uses the existing signing identity, verifies package/version/versionCode/SHA-256/signer fingerprint, and uploads the APK plus verification metadata as a 7-day Actions artifact. It does not create a tag, GitHub Release, or production update manifest.
- **Production path:** Only a tag-push event enters the `publish-release` job with `contents: write`; production manifest generation and release publication remain on that path.
- **Project Owner decision:** Authorized PR #22 to be marked ready and squash-merged into `main`. No production release or website deployment was authorized.
- **Test device:** Samsung Galaxy A16 5G, Android 16; ZEVON is not installed. Planned physical sequence: install signed v1.0.8 baseline, verify launch/version, then install signed v1.0.9 over it without uninstalling.
- **Remaining gates:** Trigger `ZEVON Signed Direct APK Release` from `main` with `test_version=1.0.9` and `dry_run=true`; approve the `zevon-production-release` Environment gate; verify artifact metadata and signer before device installation. A GitHub Actions artifact alone does not provide an unauthenticated updater URL; end-to-end in-app update testing still requires a separate controlled staging manifest and HTTPS APK host. No production release until the remaining release gates and explicit owner approval are satisfied.

- **Merge completed:** PR #22 was marked ready (`draft=false`) and squash-merged into `main` at `05983375a6f45494de89b4804aae83c341c43d61` on 2026-11-23T12:24:15Z. The merge used the reviewed expected head `5c06de7734cb6d6a5415b29fa9871f5c526d3332`.
- **Post-merge scope:** The merged PR changes only `.github/workflows/zevon-signed-apk-release.yml`; it does not change website root files or create a tag, Release, APK, or production update manifest.
- **Workflow availability:** The workflow file is now present on `main`. The GitHub connector in this session does not expose a workflow-dispatch action, so the Project Owner must start the manual run in GitHub Actions UI. No manual build has been started by this integration.
