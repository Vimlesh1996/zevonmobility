'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.ZevonReleaseManifest=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const PACKAGE_NAME='com.zevon.mobility';
  const REPOSITORY='Vimlesh1996/zevonmobility';
  const VERSION=/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
  function versionCode(version){
    const m=String(version||'').match(VERSION);
    if(!m)return 0;
    const major=Number(m[1]),minor=Number(m[2]),patch=Number(m[3]);
    if(minor>999||patch>999)return 0;
    const code=major*1000000+minor*1000+patch;
    return Number.isSafeInteger(code)&&code>0&&code<=2147483647?code:0;
  }
  function validate(data){
    if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Update manifest must be a JSON object.');
    const version=String(data.version||'');
    const code=versionCode(version);
    if(!code||!Number.isInteger(data.versionCode)||data.versionCode!==code)throw new Error('Update manifest version and versionCode do not match.');
    if(data.packageName!==PACKAGE_NAME)throw new Error('Update manifest package name is invalid.');
    const file='ZEVON-Mobility-v'+version+'.apk';
    const url='https://github.com/'+REPOSITORY+'/releases/download/v'+version+'/'+file;
    if(data.apkUrl!==url)throw new Error('Update manifest APK URL does not match its version.');
    if(typeof data.sha256!=='string'||! /^[a-f0-9]{64}$/i.test(data.sha256))throw new Error('Update manifest APK SHA-256 is invalid.');
    if(typeof data.signerSha256!=='string'||! /^[a-f0-9]{64}$/i.test(data.signerSha256))throw new Error('Update manifest signer fingerprint is invalid.');
    if(data.notes!==undefined&&typeof data.notes!=='string')throw new Error('Update manifest notes must be text.');
    return {version,versionCode:code,packageName:PACKAGE_NAME,apkUrl:url,fileName:file,sha256:data.sha256.toLowerCase(),signerSha256:data.signerSha256.toUpperCase(),notes:String(data.notes||'').slice(0,1000)};
  }
  return {versionCode,validate};
});
