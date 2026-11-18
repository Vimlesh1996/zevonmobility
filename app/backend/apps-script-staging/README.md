# ZEVON Driver Authentication — Google Apps Script staging prototype

This is an isolated staging prototype. It does not modify or call the existing ZEVON production Apps Script, production spreadsheet, booking endpoint, or live website.

## Files
- Code.gs — staging-only Google identity check, driver allowlist, session hash, profile and logout.
- Index.html — standalone Google Sign-In test page.

## Important verification limitation
The staging prototype calls Google's \`oauth2.googleapis.com/tokeninfo\` endpoint from Apps Script and checks issuer, audience, expiry and verified email. Google documents tokeninfo as a debugging/testing endpoint, not the recommended production verification mechanism. Therefore this implementation is for a controlled staging proof-of-concept only. Do not put real drivers or production access behind it. Before production, replace this verifier with a supported cryptographic ID-token verification service/library or a Google identity architecture with a supported server-side verification path.

## Setup — separate staging only
1. Create a brand-new blank Google Spreadsheet named \`ZEVON Driver Auth — STAGING\`. Do not copy or select the production workbook.
2. In that new sheet, open Extensions → Apps Script.
3. Replace the editor's Code.gs with this folder's Code.gs. Add an HTML file named \`Index\` and paste Index.html.
4. Save. Run \`setupDriverAuthStaging\` once from the editor and authorize it. This creates only Drivers, Driver_Sessions and Driver_Audit tabs in the new staging sheet.
5. In Drivers, add one test row:
   - Driver_ID: DRV-STAGE-001
   - Display_Name: Staging Test Driver
   - Email: the exact Google account email used for testing
   - Active: TRUE
   - Created_At / Updated_At: current date/time
6. In Google Auth Platform → Audience, add that Google account under Test users. Keep app in Testing mode.
7. Deploy → New deployment → Web app. Execute as: Me. Access: Anyone. Copy the /exec URL and open it in a browser.
8. If Google Sign-In reports an origin/JavaScript-origin error, inspect the actual origin shown by the browser and add that exact HTTPS origin in Google Auth Platform → Clients for this OAuth client. Do not guess wildcard origins.
9. Test an approved test account, then an unapproved test account. The approved account should receive a session and see its test Driver ID; unapproved account must be denied.
10. Keep the staging sheet private. Only the Apps Script owner/admin should have access.

## Current scope
This is an identity + allowlist + session smoke test only. It does not read trips, assignments, customer records, or the production workbook. It does not yet provide a GitHub Pages handoff, driver trip APIs, admin driver-management UI, or production-grade token verification.

## Session handling
Only a SHA-256 hash of the random session token is stored in the staging sheet. The raw token is held in the current page's JavaScript memory. Sessions expire after four hours. Logout revokes the matching hash. Driver active status is checked again when the profile is requested.

## Operational note
Apps Script quotas and execution limits apply. This is a low-volume staging test, not a guaranteed high-availability backend.
