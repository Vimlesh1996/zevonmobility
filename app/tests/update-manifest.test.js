'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const script=path.join(__dirname,'..','scripts','generate-update-manifest.py');
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'zevon-manifest-'));
 const apk=path.join(root,'ZEVON-Mobility-v1.0.9.apk');
 fs.writeFileSync(apk,Buffer.from('signed apk fixture bytes'));
 const aapt=path.join(root,'aapt');
 const signer=path.join(root,'apksigner');
 fs.writeFileSync(aapt,'#!/bin/sh\necho "package: name=\'com.zevon.mobility\' versionCode=\'1000009\' versionName=\'1.0.9\'"\n');
 fs.writeFileSync(signer,'#!/bin/sh\necho "Verifies"\necho "Signer #1 certificate SHA-256 digest: A37023520C83251D22A5EF560041AD78A380ED0266DF9B550685155B82990453"\n');
 fs.chmodSync(aapt,0o755);fs.chmodSync(signer,0o755);
 return {root,apk,aapt,signer};
}
test('manifest is generated from the signed APK metadata and exact bytes',()=>{
 const f=fixture();
 try{
  const output=path.join(f.root,'update.json');
  execFileSync('python3',[script,'--apk',f.apk,'--tag','v1.0.9','--output',output,'--aapt',f.aapt,'--apksigner',f.signer],{stdio:'pipe'});
  const data=JSON.parse(fs.readFileSync(output,'utf8'));
  const crypto=require('node:crypto');
  assert.deepEqual(Object.keys(data),['version','versionCode','packageName','apkUrl','sha256','signerSha256','notes']);
  assert.equal(data.version,'1.0.9');
  assert.equal(data.versionCode,1000009);
  assert.equal(data.packageName,'com.zevon.mobility');
  assert.equal(data.apkUrl,'https://github.com/Vimlesh1996/zevonmobility/releases/download/v1.0.9/ZEVON-Mobility-v1.0.9.apk');
  assert.equal(data.sha256,crypto.createHash('sha256').update(fs.readFileSync(f.apk)).digest('hex'));
  assert.equal(data.signerSha256,'A37023520C83251D22A5EF560041AD78A380ED0266DF9B550685155B82990453');
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
test('manifest generator rejects malformed tags and APK metadata mismatches',()=>{
 const f=fixture();
 try{
  const output=path.join(f.root,'update.json');
  assert.throws(()=>execFileSync('python3',[script,'--apk',f.apk,'--tag','v01.0.9','--output',output,'--aapt',f.aapt,'--apksigner',f.signer],{stdio:'pipe'}));
  fs.writeFileSync(f.aapt,'#!/bin/sh\necho "package: name=\'com.attacker.app\' versionCode=\'1000009\' versionName=\'1.0.9\'"\n');
  fs.chmodSync(f.aapt,0o755);
  assert.throws(()=>execFileSync('python3',[script,'--apk',f.apk,'--tag','v1.0.9','--output',output,'--aapt',f.aapt,'--apksigner',f.signer],{stdio:'pipe'}));
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
