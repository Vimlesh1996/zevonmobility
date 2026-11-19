'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'www','index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'www','styles.css'),'utf8');
const js=fs.readFileSync(path.join(root,'www','app.js'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('customer app has five primary navigation destinations',()=>{
 for(const name of ['home','book','requests','offers','more'])assert.match(html,new RegExp('data-nav="'+name+'"'));
});
test('home offers all six supported trip types',()=>{
 for(const trip of ['Airport transfer','Outstation One-Way','Outstation Round-Trip','Hourly Rental','Daily Rental','Monthly Rental'])assert.ok(html.includes('data-trip="'+trip+'"'),trip);
});
test('ZEVON brand tokens and light surfaces are present',()=>{
 assert.match(css,/--red:#DA0B17/);assert.match(css,/--navy:#08142E/);assert.match(css,/color-scheme:light/);
});
test('no CDN fonts or direct APK self updater in customer bundle',()=>{
 assert.doesNotMatch(html,/fonts\.googleapis|fonts\.gstatic/);
 assert.doesNotMatch(css,/fonts\.googleapis|fonts\.gstatic/);
 assert.doesNotMatch(js,/ZEVON direct APK updater|releases\/latest|downloadAndInstall/);
 assert.equal(pkg.dependencies['@zevon/apk-updater'],undefined);
});
test('customer app excludes admin and driver portal links',()=>{
 assert.doesNotMatch(html,/admin\/|driver\//i);
});
test('enquiry contract keeps requestId and verified acknowledgement flow',()=>{
 assert.match(js,/function requestId\(\)/);assert.match(js,/action:'ack'/);assert.match(js,/receipt\.ok===true&&receipt\.id/);
});
