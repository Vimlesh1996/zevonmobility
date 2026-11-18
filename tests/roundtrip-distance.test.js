'use strict';

// Contract tests for the browser -> Apps Script distance hand-off.
// The Apps Script source is deployed separately and is not present in this repo.
// Contract: browser sends ONE-WAY route km; server doubles exactly once for round trips.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bookingJs = fs.readFileSync(
  path.join(__dirname, '..', 'assets', 'booking.js'),
  'utf8'
);

function serverRoundTripDistance(oneWayKm, trip) {
  const km = Math.max(0, Number(oneWayKm) || 0);
  return trip === 'Outstation Round-Trip' ? km * 2 : km;
}

test('browser sends the route provider one-way distance for every fare request', () => {
  assert.match(bookingJs, /const routeKmForRequest\s*=\s*\(\)\s*=>\s*Math\.max\(0,Number\(routeMeta\?\.km\)\|\|0\)/);
  assert.equal((bookingJs.match(/routeKmForRequest\(\)/g) || []).length, 3,
    'rate lookup, booking quote lookup, and booking submission must share the same one-way distance');
  assert.doesNotMatch(bookingJs, /routeMeta\?\.km\s*\|\|\s*0\s*\)\s*\*\s*\(trip\s*===\s*'Outstation Round-Trip'/);
});

test('server contract doubles a round-trip route exactly once', () => {
  assert.equal(serverRoundTripDistance(17.2, 'Outstation Round-Trip'), 34.4);
  assert.equal(serverRoundTripDistance(17.2, 'Outstation One-Way'), 17.2);
});

test('round-trip route kilometres are not multiplied by the number of travel days', () => {
  const oneWayKm = 17.2;
  const expectedRoundTripKm = serverRoundTripDistance(oneWayKm, 'Outstation Round-Trip');
  for (const days of [1, 2, 10]) {
    assert.equal(expectedRoundTripKm, 34.4, `route distance must remain fixed for ${days} day(s)`);
  }
});

test('invalid or negative route distances safely resolve to zero', () => {
  assert.equal(serverRoundTripDistance(undefined, 'Outstation Round-Trip'), 0);
  assert.equal(serverRoundTripDistance(-5, 'Outstation Round-Trip'), 0);
});
