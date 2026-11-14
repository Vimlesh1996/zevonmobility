ZEVON MOBILITY 2.1 — MULTI-PAGE WEBSITE + GOOGLE SHEETS BOOKING ENQUIRY

IMPORTANT: This package preserves the approved ZEVON Mobility 2.0 multi-page website structure. It does NOT collapse the site into a single index.html.

PAGES INCLUDED
- index.html (homepage)
- airport.html
- book.html
- buses.html
- corporate.html
- ev.html
- fares.html
- fleet.html
- rentals.html
- vehicles.html
- about.html
- contact.html
- industries.html
- insight.html
- insights.html
- partner.html
- solution.html
- solutions.html
- 404.html

BOOKING CONNECTION
- The existing fare/trip selection flow remains in assets/site.js.
- The customer booking details form now has a Submit enquiry action that POSTs to the user's existing Apps Script Web App endpoint.
- It sends the fields expected by the existing doPost(): trip, pickup, destination, date, time, passengers, vehicle, name, phone, plus optional return date, email, company, fuel preference and notes.
- WhatsApp and Email fallback buttons remain available.
- Submissions are enquiry-only. The website does not claim instant confirmation or verified live availability.
- The Apps Script endpoint uses a no-cors browser request, so the browser cannot read the server response. Verify each test in the Bookings sheet.

ADMIN
- Admin booking management remains in the existing Google Sheet (Bookings and Admin_Dashboard tabs).
- Do not expose the Google Sheet publicly or add public read access.

PRESERVATION
- CNAME, sitemap.xml, robots.txt, assets/site.css, all existing HTML pages and shared site.js are retained.
- No production GitHub push, DNS update, or live deployment has been performed.

BEFORE DEPLOYMENT
1. Test one clearly marked enquiry in a staging copy.
2. Confirm it appears in Bookings with Booking_Status = NEW.
3. Confirm the admin dashboard counts update.
4. Delete the test row after verification.
5. Keep sample calculator prices clearly labelled as samples until approved commercial rates are entered.
