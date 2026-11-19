'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const appJs=fs.readFileSync(path.join(__dirname,'..','www','app.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','www','index.html'),'utf8');
test('customer app uses the configured production Apps Script endpoint',()=>{
 assert.match(appJs,/https:\/\/script\.google\.com\/macros\/s\/AKfycbzlXJuFReuz1ywj4_KORsBMM7fSs_k5zb4euNA-5pOLEMGF9Pq2Bz3pkcspSs0AxhIx\/exec/);
});
test('booking app never fills the website honeypot field',()=>{
 assert.match(html,/<input name="website" tabindex="-1" autocomplete="off">/);
 assert.match(appJs,/delete data\.website/);
 assert.doesNotMatch(appJs,/data\.website\s*=\s*['"][^'"]+['"]/);
});
test('booking app polls idempotent server acknowledgement before showing success',()=>{
 assert.match(appJs,/action:'ack',rid/);
 assert.match(appJs,/receipt\.ok===true&&receipt\.id/);
 assert.match(appJs,/do not submit it again yet/);
});
test('trip form includes return date, duration, passenger, luggage and contact fields',()=>{
 for(const field of ['returnDate','duration','passengers','luggage','name','phone','email','notes'])assert.ok(html.includes('name="'+field+'"'),field+' field missing');
});
test('all trip modes are present',()=>{
 for(const trip of ['Airport transfer','Outstation One-Way','Outstation Round-Trip','Hourly Rental','Daily Rental','Monthly Rental'])assert.ok(html.includes('data-trip="'+trip+'"'),trip+' missing');
});
