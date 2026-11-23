'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const contract=require('../www/update-manifest.js');
const HASH='a'.repeat(64);
const SIGNER='b'.repeat(64);
function manifest(overrides={}){
 return {version:'1.0.9',versionCode:1000009,packageName:'com.zevon.mobility',apkUrl:'https://github.com/Vimlesh1996/zevonmobility/releases/download/v1.0.9/ZEVON-Mobility-v1.0.9.apk',sha256:HASH,signerSha256:SIGNER,notes:'Release notes',...overrides};
}
test('shared JS contract calculates bounded Android version codes',()=>{
 assert.equal(contract.versionCode('1.0.9'),1000009);
 assert.equal(contract.versionCode('2.3.4'),2003004);
 for(const invalid of ['01.0.9','1.1000.0','1.0.1000','2148.0.0','v1.0.9','1.0',''])assert.equal(contract.versionCode(invalid),0,invalid);
});
test('shared JS contract validates and normalizes every required manifest field',()=>{
 const value=contract.validate(manifest());
 assert.equal(value.version,'1.0.9');
 assert.equal(value.versionCode,1000009);
 assert.equal(value.fileName,'ZEVON-Mobility-v1.0.9.apk');
 assert.equal(value.sha256,HASH);
 assert.equal(value.signerSha256,SIGNER.toUpperCase());
});
test('shared JS contract rejects schema and cross-field mismatches',()=>{
 for(const bad of [
  manifest({versionCode:1000008}),
  manifest({packageName:'com.attacker.app'}),
  manifest({apkUrl:'https://attacker.test/update.apk'}),
  manifest({sha256:'bad'}),
  manifest({signerSha256:'bad'}),
  manifest({version:'01.0.9'}),
  manifest({notes:42})
 ])assert.throws(()=>contract.validate(bad));
});
