# ZEVON Driver Portal — isolated staging

This project is bound only to a separate staging spreadsheet. It does not call the production Apps Script, production spreadsheet, booking API, or live website.

## Staging features
- Google OAuth sign-in with verified Google email and separate active Drivers/Admins allowlists.
- Admin-only staging assignment console; admin actions are checked server-side against the Admins allowlist.
- Four-hour app sessions; only SHA-256 session-token hashes are stored.
- Driver dashboard, profile, active trips, trip history and summary counts.
- Server-side filtering by the authenticated Driver_ID.
- Driver trip transitions: ASSIGNED → ACCEPTED → STARTED → COMPLETED; ASSIGNED → REJECTED requires a reason.
- Trip events and driver audit records.

## Prerequisites
- Separate private staging spreadsheet and bound Apps Script project.
- Google OAuth2 library identifier `OAuth2`, library ID `1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF`.
- Script Properties `ZEVON_OAUTH_CLIENT_ID` and `ZEVON_OAUTH_CLIENT_SECRET`. Never share or commit the secret.
- OAuth redirect URI must exactly match `logDriverAuthRedirectUri()` output.
- OAuth consent screen remains Testing; add only controlled test users.

## Install/update in Apps Script
1. In the staging spreadsheet, open Extensions → Apps Script.
2. Copy `Code.gs` from this folder into the Apps Script `Code.gs`.
3. Copy `Index.html` into Apps Script HTML file `Index`.
4. Copy `Callback.html` into Apps Script HTML file `Callback`.
5. Confirm the OAuth2 library and Script Properties are present.
6. Run `setupDriverAuthStaging` again. It adds the new staging tabs and missing headers without clearing existing rows.
7. Confirm the tabs exist: Drivers, Driver_Sessions, Driver_Audit, Trip_Assignments, Trip_Events.
8. Add an Admins test row using your own approved Google test email: Admin_ID=`ADM-STAGE-001`, Display_Name=`Staging Admin`, Email=`<your test email>`, Active=`TRUE`, Created_At/Updated_At=current date/time. Do not use an email unless you control it.
9. Keep the driver test row in Drivers. A Google email listed in Admins signs in to the Admin Console; a Google email listed only in Drivers signs in to Driver Portal.
10. Deploy → Manage deployments → Edit → New version → Deploy. This is staging only.
11. Open the staging /exec URL and sign in using an approved test driver.

## Admin assignment console
The Admins tab is a separate allowlist. Only an active Admins row can open the assignment console or call `createDriverAssignment`. The console creates synthetic staging assignments in Trip_Assignments and writes Trip_Events plus Driver_Audit. It does not read or modify production bookings. Never add a real driver/customer booking to this staging sheet.

## Trip_Assignments schema
`Assignment_ID, Booking_ID, Driver_ID, Trip_Date, Pickup_Time, Pickup_Location, Drop_Location, Passenger_Count, Vehicle_Display, Trip_Status, Assigned_At, Accepted_At, Started_At, Completed_At, Rejected_At, Rejection_Reason, Notes`

Use only synthetic staging records for tests. Example row:
- Assignment_ID: `STAGE-TRIP-001`
- Booking_ID: `STAGE-BOOKING-001`
- Driver_ID: `DRV-STAGE-001`
- Trip_Date: a future test date
- Pickup_Time: `10:00`
- Pickup_Location: `STAGING PICKUP`
- Drop_Location: `STAGING DROP`
- Passenger_Count: `1`
- Vehicle_Display: `Staging vehicle`
- Trip_Status: `ASSIGNED`
- Assigned_At: current date/time
- Leave other event timestamps and Rejection_Reason blank.
Do not put real passenger names, phone numbers, addresses, or production booking IDs in staging.

## Server-side rules
- Driver ID is taken from the verified session, never from a browser-supplied driver ID.
- Every trip read and mutation is filtered by that driver ID.
- ACCEPT is allowed only from ASSIGNED.
- REJECT is allowed only from ASSIGNED and requires a reason.
- START is allowed only from ACCEPTED.
- COMPLETE is allowed only from STARTED.
- Every transition appends a Trip_Events row and Driver_Audit event.
- The portal currently uses synthetic staging assignments only. It is not connected to customer bookings, production assignments, or live vehicle data.

## Not production-ready
This is a staging implementation, not a live dispatch system. Before any production rollout, require security review, role/admin assignment workflow, immutable assignment creation, concurrency and abuse testing, notification strategy, privacy review, operational acceptance, and explicit approval. Do not merge, deploy to production, or connect production data without explicit authorization.
