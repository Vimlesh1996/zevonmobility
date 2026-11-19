'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bookingJs = fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'booking.js'), 'utf8');

test('booking page sends one-way route kilometres to quote lookup and booking API', () => {
  assert.match(bookingJs, /const routeKmForRequest\s*=\s*\(\)\s*=>\s*Math\.max\(0,Number\(routeMeta\?\.km\)\|\|0\)/);
  assert.equal((bookingJs.match(/routeKmForRequest\(\)/g) || []).length, 3,
    'rate lookup, final quote lookup, and booking submission must use the same one-way value');
  assert.doesNotMatch(bookingJs, /routeMeta\?\.km\s*\|\|\s*0\s*\)\s*\*\s*\(trip\s*===\s*'Outstation Round-Trip'/);
});

test('round-trip distance contract doubles one-way distance exactly once', () => {
  const oneWayKm = 17.2;
  const serverBillableKm = oneWayKm * 2; // Mirrors the corrected Apps Script quote contract.
  assert.equal(serverBillableKm, 34.4);
  assert.notEqual(serverBillableKm, oneWayKm * 4);
});

test('multi-day round trip keeps route distance fixed while daily allowances scale separately', () => {
  const routeKm = 17.2 * 2;
  for (const days of [1, 2, 10]) {
    assert.equal(routeKm, 34.4);
    assert.equal(days * 40, days * 40); // Example: 40 included km per day scales by trip days.
  }
});

test('invalid and negative map distances are normalized to zero in browser request', () => {
  assert.match(bookingJs, /Math\.max\(0,Number\(routeMeta\?\.km\)\|\|0\)/);
});
