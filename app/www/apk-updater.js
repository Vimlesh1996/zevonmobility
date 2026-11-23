(() => {
'use strict';
const REPO='Vimlesh1996/zevonmobility';
const UPDATE_MANIFEST='https://github.com/'+REPO+'/releases/latest/download/update.json';
const CACHE_KEY='zevon_release_check_v3';
const manifestContract=window.ZevonReleaseManifest;
const banner=document.createElement('section');
banner.id='zevon-update-banner';
banner.className='update-banner';
banner.hidden=true;
banner.innerHTML='<div class="update-copy"><span class="update-kicker">ZEVON UPDATE</span><b id="update-title">A new version is ready</b><small id="update-detail"></small><small id="update-message" role="status" aria-live="polite"></small></div><button type="button" id="update-action">Update now</button><button type="button" id="update-dismiss" aria-label="Dismiss update">×</button>';
document.querySelector('.topbar')?.insertAdjacentElement('afterend',banner);
const title=banner.querySelector('#update-title'),detail=banner.querySelector('#update-detail'),message=banner.querySelector('#update-message'),action=banner.querySelector('#update-action'),dismiss=banner.querySelector('#update-dismiss');
let release=null;
const plugin=()=>window.Capacitor?.Plugins?.ApkUpdater||null;
const isNative=()=>Boolean(window.Capacitor?.isNativePlatform?.());
function semanticCode(version){return manifestContract?manifestContract.versionCode(version):0;}
function newer(remote,local,remoteCode,localCode){
 const r=Number(remoteCode)||semanticCode(remote),l=Number(localCode)||semanticCode(local);
 return r>0&&l>=0&&r>l;
}
async function purgeNativeCaches(){
 if(!isNative())return;
 try{
  const p=plugin();
  const installed=p?await p.getAppVersion():{};
  const identity=String(installed.versionCode||installed.version||'unknown');
  const marker='zevon_native_cache_purged_v1_'+identity;
  if(localStorage.getItem(marker)==='1')return;
  const registrations='serviceWorker'in navigator?await navigator.serviceWorker.getRegistrations():[];
  const cacheNames='caches'in window?await caches.keys():[];
  await Promise.all(registrations.map(registration=>registration.unregister()));
  await Promise.all(cacheNames.map(name=>caches.delete(name)));
  localStorage.setItem(marker,'1');
  if(registrations.length||cacheNames.length){
   console.info('ZEVON removed stale native web caches; reloading once.');
   window.location.reload();
   return true;
  }
  return false;
 }catch(error){console.warn('ZEVON native cache cleanup:',error.message);return false;}
}
async function installedVersion(){
 const p=plugin();
 if(!p)return {version:'0.0.0',versionCode:0};
 const value=await p.getAppVersion();
 return {version:String(value.version||'0.0.0'),versionCode:Number(value.versionCode)||0};
}
function show(r,current){
 release=r;
 banner.hidden=false;
 title.textContent='Version '+r.version+' is available';
 detail.textContent='Installed version: '+current+'. '+(r.notes||'A ZEVON update is ready.').slice(0,180);
 message.textContent='Official ZEVON release · package and signing certificate will be checked before install.';
 action.hidden=false;
 dismiss.hidden=false;
}
async function check(force=false){
 if(!isNative())return;
 try{
  const installed=await installedVersion();
  const label=document.querySelector('#app-version-value');
  if(label)label.textContent='Version '+installed.version;
  let cached=null;
  try{cached=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');}catch(_){}
  if(!force&&cached&&Date.now()-cached.checkedAt<6*60*60*1000){
   if(cached.release&&newer(cached.release.version,installed.version,cached.release.versionCode,installed.versionCode))show(cached.release,installed.version);
   return;
  }
  const response=await fetch(UPDATE_MANIFEST,{headers:{Accept:'application/json'},cache:'no-store'});
  if(!response.ok)throw new Error('Update service is temporarily unavailable.');
  const data=await response.json();
  if(!manifestContract)throw new Error('The update manifest validator is unavailable.');
  const validated=manifestContract.validate(data);
  const record={version:validated.version,versionCode:validated.versionCode,url:validated.apkUrl,name:validated.fileName,sha256:validated.sha256,signerSha256:validated.signerSha256,notes:validated.notes};
  localStorage.setItem(CACHE_KEY,JSON.stringify({checkedAt:Date.now(),release:record}));
  if(newer(record.version,installed.version,record.versionCode,installed.versionCode))show(record,installed.version);
  else banner.hidden=true;
 }catch(error){console.warn('ZEVON update check:',error.message);}
}
dismiss.addEventListener('click',()=>{banner.hidden=true;});
action.addEventListener('click',async()=>{
 if(!release)return;
 const p=plugin();
 if(!p){message.textContent='Updater is not available in this installed build.';return;}
 action.disabled=true;action.textContent='Preparing…';
 try{
  let permission=await p.canInstallPackages();
  if(!permission.allowed){
   message.textContent='Allow ZEVON to install updates in Android settings. Return here after enabling it.';
   await p.requestInstallPermission();
   permission=await p.canInstallPackages();
   if(!permission.allowed)throw new Error('Install permission was not granted.');
  }
  action.textContent='Downloading…';
  message.textContent='Downloading APK and checking package, version, signer and checksum…';
  await p.downloadAndInstall({url:release.url,fileName:release.name,sha256:release.sha256,signerSha256:release.signerSha256,version:release.version,versionCode:release.versionCode});
  message.textContent='APK verified. Android installer opened. Confirm the update to finish.';
 }catch(error){message.textContent=error.message||'Could not start the update. Please try again later.';}
 finally{action.disabled=false;action.textContent='Try again';}
});
window.addEventListener('load',async()=>{if(!(await purgeNativeCaches()))await check();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check(true);});
})();
