# PR-E — Repository governance and production website isolation

## Scope and safety boundary

This change is intentionally limited to governance documentation and read-only CI checks. It does not change GitHub repository settings, the GitHub Pages source, the live website, DNS, Firebase, signing secrets, release tags, or the `main` branch.

- Repository: `Vimlesh1996/zevonmobility`
- Default branch: `main`
- Production domain in the repository's root `CNAME`: `zevonmobility.com`
- Production site files are at the repository root (`index.html`, `404.html`, `robots.txt`, `sitemap.xml`, and site assets).
- Customer app implementation and Android CI remain on `feature/customer-app-rebuild`.
- PR-E branch is isolated from the feature branch and targets that feature branch. It does not target `main`.

## Verified GitHub state (2026-11-23)

### Main branch ruleset

The repository currently has a ruleset named `main`:

- Ruleset ID: `27551879`
- Target: branch
- Enforcement: **disabled**
- Ref include/exclude patterns: both empty (the ruleset is not scoped to `main`)
- Existing rules: prevent deletion, prevent non-fast-forward updates, and require a pull request with zero required approvals.
- Required status checks: none.
- Required conversation resolution: false.
- Bypass actors: none.

The branch-protection read endpoint returned HTTP 403, `Resource not accessible by integration`. The connected GitHub integration therefore cannot inspect or administer classic branch protection. The ruleset resource itself was readable, and no settings were changed.

### GitHub Pages

The repository reports Pages enabled (`has_pages=true`), and the root contains `CNAME` with `zevonmobility.com` plus the static site entry files. No Pages deployment workflow is present in the inspected workflow directory on `main`.

The Pages settings endpoint was not available through the connected GitHub integration. Consequently, the currently selected Pages source branch/folder has **not** been independently verified. Do not assume the Pages source is correct until the owner checks Settings → Pages.

### Branch and commit separation

- Current `main` head at inspection: `9204c5af5efc2ef75733b8080dba9cdc855c93f3`.
- PR-D merge / feature branch head: `6ee499a53b7fa6c8c7a77507957599271700fbca`.
- PR-D and PR-E do not modify `main`; no production deployment was initiated.

## CI guard added by PR-E

### `.github/workflows/main-governance.yml`

- Runs for pull requests and pushes targeting `main` and `feature/customer-app-rebuild`, plus manual dispatch.
- Uses read-only `contents: read` permissions.
- Runs actionlint across the repository's GitHub Actions YAML files.
- Runs the production deployment boundary script.
- The required check's job name is exactly **Main branch governance**. After this workflow has been merged into `main` and observed passing there, configure that exact check as required by the `main` ruleset.

### `.github/scripts/check-production-deployment-boundary.py`

The script fails if required root website files are missing, if `CNAME` no longer equals `zevonmobility.com`, or if a workflow introduces a GitHub Pages Actions deployment path (the `actions/deploy-pages` action, `peaceiris/actions-gh-pages`, or a `pages: write` permission).

This deliberately preserves a single production publishing model: GitHub Pages publishes the repository root from `main`. The guard does not have access to GitHub's Pages settings and cannot prevent an administrator from changing those settings; the owner-side Pages configuration below remains mandatory.

## Exact owner-side GitHub configuration

These steps require repository administration access in the GitHub web UI. The connected integration was denied the branch-protection administration endpoint, so no API mutation was attempted.

### A. Verify / set the GitHub Pages production source

1. Open the repository: <https://github.com/Vimlesh1996/zevonmobility>.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, inspect **Source**.
4. Select **Deploy from a branch**.
5. Set **Branch** to `main` and **Folder** to `/(root)`, then Save.
6. Confirm the custom domain is `zevonmobility.com` and that GitHub's domain/DNS checks are healthy.
7. Do not select `feature/customer-app-rebuild` as the Pages source. Do not switch to a GitHub Actions deployment workflow unless a separately reviewed and owner-approved migration is planned.

If the current source is GitHub Actions or a different branch/folder, stop and report the current setting before changing it; avoid an unplanned production-site interruption.

### B. Activate and scope the existing main ruleset

1. Open **Settings → Rules → Rulesets**.
2. Edit the existing ruleset named **main** (ID `27551879`); avoid creating a conflicting duplicate.
3. Set **Enforcement status** to **Active**.
4. Under target branches, add the include pattern `main` (GitHub's branch pattern for `refs/heads/main`). Ensure the include list is not empty.
5. Keep deletion prevention enabled.
6. Enable **Block force pushes** / non-fast-forward updates.
7. Enable **Require a pull request before merging**.
8. Enable **Require conversation resolution before merging**.
9. Enable **Require status checks to pass** and add the exact check **Main branch governance**. Enable strict/up-to-date checks if offered.
10. Allow **Squash** merging only for this protected branch (the project uses squash merges).
11. Keep the bypass list empty; do not add routine admin bypass actors.

**Approval count:** Set one required approval only if a second trusted GitHub collaborator is available to review and approve. Gemini's external technical audit is valuable but does not count as a GitHub review approval. If the owner is the only collaborator, a one-approval rule can deadlock the owner's own PRs; in that case keep the approval count at zero while still requiring PRs, the governance check, and resolved conversations. The owner must continue to provide explicit project authorization for merges.

### C. Apply the rules in the safe order

1. Review and merge PR-E into `feature/customer-app-rebuild` only after its CI and independent review are green.
2. Do not enable `Main branch governance` as a required check on `main` until the workflow has been promoted to `main` through a separate, explicitly owner-authorized PR and has completed successfully on `main`.
3. After that check is visible and green on a PR targeting `main`, activate the ruleset configuration above.
4. Verify by opening a test PR targeting `main`: direct pushes should be blocked, the governance check should be required, and merge should remain blocked until all required conditions pass.
5. Do not use a test that changes production website files or deploys the website. Use a harmless documentation-only test PR.

## Operational policy

- Website production source: `main` + repository root only.
- Customer app development/CI: `feature/customer-app-rebuild`.
- Signed APK release workflow: tag-triggered, with its own signing and provenance gates; it is not a website deployment mechanism.
- Never merge feature work into `main`, create a production tag, change Pages settings, or deploy the website without explicit Project Owner authorization.
- Keep GitHub Actions permissions least-privilege. A website deployment workflow, if ever introduced, requires a separate review, protected environment, explicit deployment permissions, and owner approval.
- PR-E's workflow guard is a CI safeguard, not a substitute for the GitHub Pages setting or active branch ruleset.

## Validation still required

- CI must pass on the PR-E head.
- Gemini should review the workflow and guard script.
- Owner must verify Pages source and activate the existing ruleset in GitHub Settings.
- Physical-device updater validation and production release gates remain separate from PR-E.
