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
