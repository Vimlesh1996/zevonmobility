# ZEVON Driver Authentication — Google Apps Script OAuth2 staging

This isolated prototype uses the Google-maintained Apps Script OAuth2 library and authorization-code flow. It does not call or modify the production Apps Script, production spreadsheet, booking API, or live website.

## Prerequisites
- A separate, private, empty staging spreadsheet.
- Apps Script project bound to that staging spreadsheet.
- OAuth2 library added with identifier OAuth2. Library Script ID: 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF.
- Script Properties:
  - ZEVON_OAUTH_CLIENT_ID — public Web OAuth client ID.
  - ZEVON_OAUTH_CLIENT_SECRET — secret; never commit or share.
- OAuth client's authorized redirect URI: https://script.google.com/macros/d/<SCRIPT_ID>/usercallback.

## How the flow works
1. Apps Script creates a random one-time flow ID and a uniquely named OAuth2 service.
2. The browser is sent to Google's OAuth authorization page using the Apps Script /usercallback redirect.
3. Apps Script OAuth2 library completes the authorization-code callback.
4. The server calls Google's OpenID Connect userinfo endpoint using the short-lived access token and checks sub, email, and email_verified.
5. The OAuth token is reset immediately. No OAuth refresh token is requested or retained.
6. Verified email is matched against an active row in the private Drivers tab.
7. A random app session token is issued; only its SHA-256 hash is stored in Driver_Sessions.
8. A unique OAuth2 service name per flow prevents concurrent drivers from overwriting each other's temporary OAuth properties. The flow ID expires after 10 minutes.

## Important deployment model
Deploy the web app as Execute as: Me and Who has access: Anyone only for controlled staging, if the account policy allows it. The backend must never trust a driver ID supplied by the browser; it derives the driver from Google's verified email and the active allowlist. Keep the staging spreadsheet private. Keep the OAuth consent screen in Testing mode and add test users.

## Setup
1. In the separate staging spreadsheet, open Extensions → Apps Script.
2. Replace Code.gs with this folder's Code.gs.
3. Replace Index.html with this folder's Index.html.
4. Add a new HTML file named Callback and paste Callback.html.
5. Confirm the OAuth2 library is present with identifier OAuth2.
6. In Project Settings → Script Properties, confirm ZEVON_OAUTH_CLIENT_ID and ZEVON_OAUTH_CLIENT_SECRET exist. Do not reveal their values.
7. Run setupDriverAuthStaging once from the editor, if not already run. It adds only the auth tabs to the bound staging spreadsheet.
8. Run logDriverAuthRedirectUri and check the execution log matches the redirect URI registered in Google Cloud.
9. Add a test row to Drivers: Driver_ID=DRV-STAGE-001, Display_Name=Staging Test Driver, Email=<test account email>, Active=TRUE, timestamps as appropriate.
10. Keep OAuth Audience in Testing mode and add that account under Test users.
11. Deploy → New deployment → Web app. Execute as: Me. Access: Anyone. Open the new /exec URL.
12. Test an approved account and an unapproved test account. Approved should receive a staging session; unapproved must be denied.

## Tabs
- Drivers: Driver_ID, Display_Name, Email, Active, Created_At, Updated_At
- Driver_Sessions: Token_Hash, Driver_ID, Google_Sub, Created_At, Expires_At, Revoked_At
- Driver_Audit: Audit_ID, Driver_ID, Event_Type, Event_At, Detail

## Security and scope
- OAuth access token is used only to fetch Google userinfo and is immediately reset.
- No OAuth refresh token is requested (access_type=online).
- App session token is 32 bytes of random UUID material; only its SHA-256 hash is stored.
- Session lifetime is four hours; driver active status is checked on profile reads.
- This is a staging identity proof-of-concept, not a production driver trip API. No trips, assignments, status changes, customer data, or production spreadsheet access are included.
- Apps Script quotas, execution limits, and OAuth app user limits apply. Monitor before any real rollout.
