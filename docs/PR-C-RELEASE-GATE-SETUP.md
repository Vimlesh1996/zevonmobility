# PR-C — Production release environment setup and signing-key safeguards

## Required GitHub Environment configuration

The signed APK release job now references the environment:

`zevon-production-release`

The workflow YAML cannot create reviewer protection by itself. Before any production tag is pushed, a repository owner must configure this environment in **Settings → Environments**:

1. Create or open `zevon-production-release`.
2. Add at least one required reviewer (the Project Owner or a designated release approver).
3. Enable **Prevent self-review** where available.
4. Disable administrator bypass where the repository plan/settings support it.
5. Move these production credentials from repository-level secrets to this environment's secrets:
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_PASSWORD`
6. Verify the environment protection rule is active and that a test workflow targeting the environment pauses for approval before a job starts.

Do not push a production release tag until this configuration has been completed and independently verified. The workflow's environment name alone is not proof that reviewer protection exists.

## Workflow hardening included

- Workflow-level token permission defaults to `contents: read`.
- Only the signed-release job receives `contents: write`.
- The signed-release job is bound to `zevon-production-release`.
- Checkout, setup-node, setup-java and setup-android use immutable full commit SHAs already used by the validated Android CI workflow.
- Dependencies are installed with `npm ci` from the committed `app/package-lock.json`.
- The decoded release keystore is created with restrictive umask/file permissions and removed by an EXIT trap after the combined configure/build/manifest/publish step, including failure paths.
- Release build, signature verification, manifest generation and publication are kept behind the same environment approval gate.

## Signing-key generation workflow — deliberately not changed in PR-C

`.github/workflows/zevon-generate-signing-key.yml` currently creates a ZIP containing the private keystore and credential material, then uploads it as a GitHub Actions artifact. The repository is public. Artifact visibility and any historical artifact/run exposure must be explicitly audited; a one-day retention setting is not a substitute for access control.

Do not dispatch that workflow, generate a replacement key, rotate signing credentials, delete artifacts, or disable the workflow as part of PR-C. First have the Project Owner confirm whether the permanent production key is already backed up offline, verify its public certificate fingerprint against the installed production app, and confirm the matching GitHub secrets. Then redesign or retire the key-generation workflow through a separate owner-approved change that never publishes an unencrypted keystore or passwords in a publicly readable artifact.

## Remaining manual release gates

- [ ] Environment reviewer protection configured and tested.
- [ ] Production signing credentials stored as environment secrets, not general repository secrets.
- [ ] Existing key custody, certificate fingerprint, and any historical key-generation artifacts audited.
- [ ] No production release tag pushed until all above checks pass.
- [ ] Permanent-key upgrade tested on physical Android devices before production release.
