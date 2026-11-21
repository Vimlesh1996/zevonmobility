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
const updater=fs.readFileSync(path.join(root,'www','apk-updater.js'),'utf8');
const nativeUpdater=fs.readFileSync(path.join(root,'plugins','apk-updater','android','src','main','java','com','zevon','mobility','updater','ApkUpdaterPlugin.java'),'utf8');
const nativePolicy=fs.readFileSync(path.join(root,'plugins','apk-updater','android','src','main','java','com','zevon','mobility','updater','ApkUpdatePolicy.java'),'utf8');

test('customer app has five primary navigation destinations',()=>{
 for(const name of ['home','book','requests','offers','more'])assert.match(html,new RegExp('data-nav="'+name+'"'));
});
test('home offers all six supported trip types',()=>{
 for(const trip of ['Airport transfer','Outstation One-Way','Outstation Round-Trip','Hourly Rental','Daily Rental','Monthly Rental'])assert.ok(html.includes('data-trip="'+trip+'"'),trip);
});
test('ZEVON brand tokens and light surfaces are present',()=>{
 assert.match(css,/--red:#DA0B17/);assert.match(css,/--navy:#08142E/);assert.match(css,/color-scheme:light/);
});
test('no CDN fonts or insecure updater implementation',()=>{
 assert.doesNotMatch(html,/fonts\.googleapis|fonts\.gstatic/);
 assert.doesNotMatch(css,/fonts\.googleapis|fonts\.gstatic/);
 assert.doesNotMatch(js,/fonts\.googleapis|fonts\.gstatic/);
 assert.ok(updater.includes('releases/latest'));
 assert.match(updater,/sha256/);
 assert.match(nativeUpdater,/MessageDigest/);
 assert.match(nativeUpdater,/REQUEST_INSTALL_PACKAGES|canRequestPackageInstalls/);
 assert.match(nativeUpdater,/ApkUpdatePolicy\.isOfficialReleaseUrl/);
 assert.ok(nativePolicy.includes('Vimlesh1996/zevonmobility/releases/download'));
 assert.match(nativeUpdater,/getPackageArchiveInfo/);
 assert.match(nativeUpdater,/signerFingerprint/);
 assert.match(nativeUpdater,/ApkUpdatePolicy\.isNewerExpectedVersion/);
 assert.match(nativePolicy,/isMatchingSigner/);
 assert.match(nativePolicy,/isExpectedPackage/);
 assert.match(updater,/data\.packageName!=='com\.zevon\.mobility'/);
 assert.match(updater,/versionCode:release\.versionCode/);
 assert.equal(pkg.dependencies['@zevon/apk-updater'],'file:plugins/apk-updater');
 assert.ok(html.includes('apk-updater.js'));
});
test('customer app applies a restrictive content security policy',()=>{
 assert.match(html,/http-equiv="Content-Security-Policy"/);
 assert.match(html,/object-src 'none'/);
 assert.match(html,/script-src 'self' https:\/\/script\.google\.com/);
});
test('customer app excludes admin and driver portal links',()=>{
 assert.doesNotMatch(html,/admin\/|driver\//i);
});
test('enquiry contract keeps requestId and verified acknowledgement flow',()=>{
 assert.match(js,/function requestId\(\)/);assert.match(js,/action:'ack'/);assert.match(js,/receipt\.ok===true&&receipt\.id/);
});
test('My Requests stores only server-confirmed enquiry references locally',()=>{
 assert.match(html,/id="request-list"/);
 assert.match(js,/REQUESTS_KEY='zevon_customer_requests_v1'/);
 assert.match(js,/saveRequest\(data,receipt\)/);
 assert.match(js,/window\.renderZevonRequests=renderRequests/);
 assert.match(js,/Enquiry received/);
});
test('native Capacitor app never registers a service worker',()=>{
 assert.match(js,/!window\.Capacitor\?\.isNativePlatform\?\.\(\).*serviceWorker/);
 assert.match(updater,/purgeNativeCaches/);
 assert.match(updater,/getRegistrations/);
 assert.match(updater,/caches\.delete/);
 assert.match(updater,/zevon_native_cache_purged_v1_/);
});
test('updater uses a pinned release manifest and dynamic native app version',()=>{
 assert.match(updater,/releases\/latest\/download\/update\.json/);
 assert.match(updater,/app-version-value/);
 assert.match(updater,/signerSha256/);
 assert.match(updater,/semanticCode/);
});
test('web service worker cache namespace is bumped',()=>{
 const sw=fs.readFileSync(path.join(root,'www','sw.js'),'utf8');
 assert.match(sw,/zevon-app-shell-v3/);
});
test('customer app version is incremented for this update test',()=>{
 assert.equal(pkg.version,'1.0.1');
 assert.match(html,/id="app-version-value">Version 1\.0\.1/);
});
