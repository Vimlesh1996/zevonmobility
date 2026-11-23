'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

const appRoot=path.join(__dirname,'..');
const script=path.join(appRoot,'scripts','configure-android-platform.py');
const androidNs='http://schemas.android.com/apk/res/android';

function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'zevon-android-platform-'));
 const app=path.join(root,'android/app/src/main');
 fs.mkdirSync(path.join(app,'res/xml'),{recursive:true});
 fs.writeFileSync(path.join(app,'AndroidManifest.xml'),\`<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="\${androidNs}">
 <application>
  <provider android:name="androidx.core.content.FileProvider" android:authorities="\${applicationId}.fileprovider" android:exported="false" android:grantUriPermissions="true">
   <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/file_paths"/>
  </provider>
 </application>
 <uses-permission android:name="android.permission.INTERNET"/>
</manifest>\`);
 fs.writeFileSync(path.join(app,'res/xml/file_paths.xml'),\`<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="\${androidNs}">
 <external-path name="my_images" path="."/>
 <cache-path name="my_cache_images" path="."/>
</paths>\`);
 return root;
}

test('Android platform config narrows FileProvider to the dedicated APK cache and declares API 33 notification permission',()=>{
 const root=fixture();
 try{
  execFileSync('python3',[script],{cwd:appRoot,env:{...process.env,APP_ROOT:root},stdio:'pipe'});
  const base=path.join(root,'android/app/src/main');
  const manifest=fs.readFileSync(path.join(base,'AndroidManifest.xml'),'utf8');
  const paths=fs.readFileSync(path.join(base,'res/xml/file_paths.xml'),'utf8');
  assert.match(manifest,/android:authorities="\$\{applicationId\}\.fileprovider"/);
  assert.match(manifest,/android:exported="false"/);
  assert.match(manifest,/android:grantUriPermissions="true"/);
  assert.match(manifest,/android\.permission\.POST_NOTIFICATIONS/);
  assert.match(paths,/<cache-path name="apk_updates" path="apk-updates\/"\s*\/>/);
  assert.doesNotMatch(paths,/<external-path|path="\."|my_cache_images/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('Android platform config fails closed if the expected FileProvider is missing or duplicated',()=>{
 for(const mode of ['missing','duplicate']){
  const root=fixture();
  try{
   const file=path.join(root,'android/app/src/main/AndroidManifest.xml');
   let xml=fs.readFileSync(file,'utf8');
   if(mode==='missing')xml=xml.replace(/\s*<provider[\s\S]*?<\/provider>/,'');
   else xml=xml.replace('</application>',xml.match(/<provider[\s\S]*?<\/provider>/)[0]+'</application>');
   fs.writeFileSync(file,xml);
   assert.throws(()=>execFileSync('python3',[script],{cwd:appRoot,env:{...process.env,APP_ROOT:root},stdio:'pipe'}));
  }finally{fs.rmSync(root,{recursive:true,force:true});}
 }
});
