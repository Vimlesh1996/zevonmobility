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
