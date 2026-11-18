# ZEVON workbook mapping (verified export)

This document records the structure observed in the owner-supplied `ZEVON_BACKEND.xlsx` export. It contains schema and aggregate operational observations only; no customer names, phone numbers, emails, addresses, or booking references are copied here.

## Workbook snapshot

The export contains these tabs and non-empty data-row counts (excluding the header row):

| Tab | Data rows | Purpose |
|---|---:|---|
| `Bookings` | 4 | Customer trip enquiries and booking operations |
| `Contact_Leads` | 3 | General contact enquiries |
| `Partner_Leads` | 1 | Partner applications |
| `Admin_Dashboard` | 8 | Existing dashboard layout/metrics |
| `Vehicle_Master` | 6 | Fleet inventory and vehicle readiness |
| `Rate_Card` | 6 | Trip/category/city/fuel pricing |
| `Quick_Offers` | 1 | Coupon/offer configuration |
| `Booking_Status` | 8 | Status lookup |
| `Settings` | 19 | Backend and notification settings |
| `Enquiry_Log` | 9 | Website/admin event log |

This is an exported snapshot, not a live connection. Counts and statuses must be refreshed from the live workbook before production rollout.

## Verified operational observations

- All 4 booking rows in this export have status `NEW`.
- No booking row currently has `Assigned_Vehicle` or `Assigned_Driver` populated.
- All 6 vehicle rows are marked inactive and have availability `To Be Configured`.
- The status lookup contains `NEW`, `REVIEW`, `QUOTED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, and `REJECTED`.
- No dedicated `Drivers`, `Users`, or `Trip_Assignments` tab exists in this export. Driver identity and assignment workflows therefore cannot be enabled safely from the current workbook alone.

## Actual headers

### Bookings (46 columns)

`Created_At`, `Booking_ID`, `Booking_Status`, `Trip_Type`, `Pickup_Date`, `Pickup_Time`, `Pickup_Location`, `Pickup_Lat`, `Pickup_Lng`, `Drop_Location`, `Drop_Lat`, `Drop_Lng`, `Route_Distance_KM`, `Estimated_Duration_Min`, `Return_Date`, `Return_Time`, `Passengers`, `Vehicle_Category`, `Vehicle_Preference`, `Fuel_Preference`, `Customer_Name`, `Customer_Email`, `Customer_Phone`, `Company_Name`, `Special_Requirements`, `Fare_Base`, `Fare_Included_KM`, `Fare_Extra_KM_Rate`, `Fare_Driver_Allowance`, `Fare_Toll_Parking`, `Fare_GST`, `Estimated_Total`, `Final_Quoted_Amount`, `Assigned_Vehicle`, `Assigned_Driver`, `Source`, `Admin_Notes`, `Last_Updated`, `Duration_Value`, `Duration_Unit`, `Luggage`, `Service_Area`, `Offer_Code`, `Fare_Extra_KM`, `Fare_Extra_Hour`, `Discount_Amount`.

**Schema drift vs supplied Apps Script:** the script's `ZEVON.tabs.Bookings` declaration contains 43 headers. The workbook contains those same headers plus `Fare_Included_KM`, `Fare_Extra_KM_Rate`, and `Fare_Toll_Parking`. Preserve these extra columns; do not rebuild or replace the tab from the script declaration.

### Vehicle_Master (21 columns)

`Vehicle_ID`, `Vehicle_Category`, `Make`, `Model`, `Registration_No`, `Fuel_Type`, `Seating_Capacity`, `Luggage_Capacity`, `AC`, `City_or_Zone`, `Ownership_Type`, `Vendor_Name`, `Availability_Status`, `Active`, `Notes`, `Display_Name`, `Image_URL`, `Display_Order`, `Seats`, `Luggage`, `Image_URL (optional)`.

**Schema drift vs supplied Apps Script:** the script declares only 8 basic display/rate fields for this tab. The workbook has a fuller fleet-inventory schema. The app adapter must use the actual inventory columns and must not run a destructive reset or replace this header row.

### Enquiry_Log (7 columns)

`Log_Timestamp`, `Booking_ID`, `Action`, `Changed_By`, `Details`, `Record_ID`, `Record_Type`.

**Schema drift vs supplied Apps Script:** workbook includes the additional `Booking_ID` field. Preserve it.

### Other tabs

- `Contact_Leads`: `Created_At`, `Lead_ID`, `Name`, `Company`, `Email`, `Phone`, `Service_Interest`, `Message`, `Source`, `Lead_Status`, `Admin_Notes`.
- `Partner_Leads`: `Created_At`, `Partner_ID`, `Name`, `Company`, `Email`, `Phone`, `Partner_Type`, `City`, `Fleet_Size`, `Vehicle_Categories`, `Fuel_Types`, `Message`, `Source`, `Partner_Status`, `Admin_Notes`.
- `Rate_Card`: `Trip_Type`, `Vehicle_Category`, `Fuel_Type (optional)`, `City (optional)`, `Base_Fare (INR)`, `Included_KM`, `Extra_KM_Rate`, `Included_Hours`, `Extra_Hour_Rate`, `Driver_Allowance`, `GST_Percent`, `Active`, `Display_Order`, `Notes`, `Effective_From`, `Effective_To`.
- `Quick_Offers`: `Offer_Code`, `Title`, `Description`, `Discount_Type`, `Discount_Value`, `Max_Discount`, `Min_Booking_Amount`, `City (optional)`, `Valid_From`, `Valid_To`, `Active`, `Show_On_Website`, `Display_Order`, `Terms`, `Applicable_Trip_Types`, `Applicable_Vehicle_Categories`.
- `Booking_Status`: `Status_Code`, `Status_Name`, `Description`, `Display_Order`, `Active`.
- `Settings`: `Setting_Key`, `Setting_Value`, `Description`.
- `Admin_Dashboard`: current export is a formatted dashboard, not a simple `Metric` / `Count` header row. The supplied script's refresh routine clears and rebuilds this dashboard; do not invoke it against production as part of schema discovery.

## Implementation mapping

### Admin module

- Dashboard: aggregate from `Bookings`, `Contact_Leads`, `Partner_Leads`, `Vehicle_Master`, and `Rate_Card`; do not return full sheet dumps.
- Booking list/detail: read `Bookings`; redact customer contact details for roles that do not need them.
- Booking update: update `Booking_Status`, `Final_Quoted_Amount`, `Assigned_Vehicle`, `Assigned_Driver`, `Admin_Notes`, and `Last_Updated` only after server-side validation and audit.
- Fleet: use `Vehicle_Master` fields `Vehicle_ID`, `Registration_No`, `Availability_Status`, `Active`, category/fuel/capacity, and city/zone. Registration and vendor details are private; never expose them to unauthenticated clients.
- Leads: use `Contact_Leads` and `Partner_Leads` with role-appropriate access.
- Pricing/offers: keep `Rate_Card` and `Quick_Offers` admin-only. Public app may receive only the intentionally published offer/vehicle display fields already exposed by the existing `bootstrap` handler.

### Driver module

The current workbook is not sufficient for safe driver login or assignment ownership. Before enabling Driver access, add and review a driver registry and immutable assignment identity, e.g. `Drivers` and `Trip_Assignments`, plus append-only trip events/audit records. A driver's phone number or the mutable `Assigned_Driver` display field alone is not an authentication credential. The server must bind a verified driver identity to an immutable driver ID and filter every read/write by that ID.

## Production safety

1. Treat this export as a schema reference only; do not import it over the live spreadsheet.
2. Do not run `setupZevonMasterSheet` or `refreshAdminDashboard` in production as part of this app work. The supplied setup routine can alter formatting/header layout, and the dashboard refresh clears and rebuilds the dashboard.
3. Preserve all existing booking, lead, vehicle, rate, offer, settings, status, and log records.
4. Implement and test against a separate staging copy of the Apps Script deployment and workbook.
5. Keep the current customer API actions backward-compatible. No production deployment, spreadsheet mutation, PR merge, or website deployment is authorised by this mapping document.
