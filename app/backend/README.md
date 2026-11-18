# ZEVON Admin & Driver Backend Extension

## Current backend status

The deployed Google Apps Script Web App is already used by the public website and customer app for:
- `booking` POST (customer trip enquiry)
- `quote` GET (public quote lookup)
- `bootstrap` GET (public app data)
- `ack` GET (request receipt verification)

The Apps Script source project is not present in this GitHub repository. The production endpoint must not be replaced or modified blindly. This document is the implementation contract for extending the existing Apps Script project without breaking its current handlers.

## Security requirements (mandatory)

1. Keep the existing customer actions and their request/response shapes backward-compatible.
2. Admin and driver endpoints must be separate from public actions and must require a short-lived authenticated session.
3. Verify Google ID tokens server-side against the configured OAuth audience, issuer, expiry and verified email. Admin emails must be explicitly allowlisted in Script Properties. Do not trust a role sent by the browser.
4. Driver access must use an approved OTP provider (or another verified identity provider). Do not treat a phone number alone as authentication.
5. Every request must be authorised server-side. Drivers may read/update only trips assigned to their own immutable driver ID. Admin roles may be split into owner, operations and read-only.
6. Never expose the private Google Sheet, spreadsheet ID, service-account key, Script Properties, OTP secrets or admin tokens to browser code.
7. Validate all fields, enforce state transitions, rate-limit authentication, expire sessions, and write sensitive actions to an append-only audit log.
8. Do not return customer PII to drivers until the relevant assignment is accepted and the data is necessary for that trip.
9. Do not put bearer tokens in query strings or JSONP URLs. Authenticated data operations must use POST bodies and an approved authenticated transport. Public `ack` polling remains only for the existing customer enquiry flow.
10. Use HTTPS only. Configure a real CORS-capable gateway if the Apps Script ContentService deployment cannot safely support the required authenticated browser transport. Do not weaken access controls to work around CORS.

## Suggested private spreadsheet tabs

Create these only after confirming the existing workbook and its headers:
- `Users`: immutable user ID, verified email/phone, role, active flag, created/updated timestamps.
- `Drivers`: driver ID, user ID, verification status, operational status, approved vehicle categories.
- `Vehicles`: vehicle ID, registration, category, fuel, capacity, verification status, active flag.
- `Trip_Assignments`: assignment ID, booking reference, driver ID, vehicle ID, assignment status, assigned timestamp.
- `Trip_Events`: assignment ID, actor ID, event type, event timestamp, location (only when consented/required), notes.
- `Audit_Log`: actor ID, role, action, record ID, timestamp, outcome.

Do not rename or repurpose the existing `Bookings` or `Admin_Dashboard` tabs. Map existing booking columns only after inspecting the real header row.

## API contract to implement

Authenticated Admin:
- `admin.session`: exchange a verified Google identity token for a short-lived session.
- `admin.dashboard`: aggregate counts and operational KPIs.
- `admin.bookings.list`: paginated, filtered booking enquiries.
- `admin.bookings.get`: retrieve a booking by reference with role-appropriate PII.
- `admin.bookings.update`: validate and update enquiry/booking status.
- `admin.assignments.create`: assign a verified driver and vehicle; prevent conflicting active assignments.
- `admin.drivers.list`, `admin.drivers.update`.
- `admin.vehicles.list`, `admin.vehicles.update`.
- `admin.reports.summary`: server-generated aggregates, not raw sheet dumps.

Authenticated Driver:
- `driver.session`: exchange a verified OTP result for a short-lived driver session.
- `driver.trips.list`: return only that driver's assigned trips.
- `driver.trip.get`: return only the driver's own assignment and minimum required trip details.
- `driver.trip.event`: accept only allowed state transitions (assigned → accepted → arrived → started → completed; cancellation/rejection only through defined rules).
- `driver.profile.get`: return the driver's own profile and operational status.

All endpoints must return a consistent envelope with `ok`, `requestId`, `data` or a safe `error` code. Use server-side idempotency for state-changing actions. Do not return stack traces or internal spreadsheet errors.

## Frontend modules

- `../www/admin/`: Admin workspace shell. It deliberately displays no private data and keeps actions disabled until secure Admin APIs exist.
- `../www/driver/`: Driver workspace shell. It deliberately displays no trip data and keeps trip actions disabled until OTP and driver ownership checks exist.
- `../www/modules.css`: shared module styling.

## Release gates

- Review actual Apps Script source and existing sheet headers before writing the adapter.
- Add and test the extension in a staging copy of the Apps Script deployment and spreadsheet.
- Test owner, operations, read-only, active driver, inactive driver, wrong-driver, expired-session and unauthenticated cases.
- Verify no private data is returned by public `quote`, `bootstrap`, `ack` or customer `booking` actions.
- Test concurrent driver assignments and duplicate status requests.
- Keep production deployment version unchanged until all checks pass and the owner approves rollout.
