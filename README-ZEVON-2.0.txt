# ZEVON Mobility 2.0

Complete Mobility & Transportation website source.

## Included
- Responsive homepage and shared navigation/footer
- Corporate mobility, car rentals, bus & coach, fleet, EV, airport and vehicle category pages
- Existing fares/booking mechanism retained and extended with vehicle category and fuel preference selectors
- B2B/B2C enquiry flows and partner enquiry page
- Updated sitemap, robots.txt and CNAME

## Critical before production
1. `assets/site.js` contains SAMPLE pricing values. Do not set `PRICING.confirmed` to true until every rate, route distance, allowance, airport price, package and commercial note is approved by ZEVON.
2. Confirm the official WhatsApp destination number in `CFG.wa`, phone number in `CFG.phone`, and email in `CFG.mail`. The current code retains the previously supplied values; the WhatsApp destination and displayed phone may differ and must be reconciled.
3. Verify each service/city and partner availability before advertising it as operational. The copy is deliberately written as enquiry/availability subject to confirmation.
4. Confirm legal business details, GSTIN (if applicable), privacy policy, terms, cancellation policy and data handling before collecting customer information.
5. Do not claim live tracking, AI dispatch, 24x7 control room, guaranteed fleet size or customer reviews unless these are genuinely operational and evidenced.

## GitHub Pages deployment
Upload the contents of this folder to the repository root (not the containing folder). Keep `assets/` as a folder. Keep `CNAME` in the repository root. Check Settings → Pages → Deploy from branch → main → /(root).

## Pricing engine
Edit the `PRICING` object near the top of `assets/site.js`. The visible Sample rates label is intentional. Current values are demonstration data only, not commercial quotations.
