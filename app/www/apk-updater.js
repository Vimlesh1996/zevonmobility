(() => {
'use strict';
const REPO='Vimlesh1996/zevonmobility';
const CACHE_KEY='zevon_release_check_v1';
const banner=document.createElement('section');
banner.id='zevon-update-banner';
banner.className='update-banner';
banner.hidden=true;
banner.innerHTML='<div class="update-copy"><span class="update-kicker">ZEVON UPDATE</span><b id="update-title">A new version is ready</b><small id="update-detail"></small><small id="update-message" role="status" aria-live="polite"></small></div><button type="button" id="update-action">Update now</button><button type="button" id="update-dismiss" aria-label="Dismiss update">×</button>';
document.querySelector('.topbar')?.insertAdjacentElement('afterend',banner);
const title=banner.querySelector('#update-title'),detail=banner.querySelector('#update-detail'),message=banner.querySelector('#update-message'),action=banner.querySelector('#update-action'),dismiss=banner.querySelector('#update-dismiss');
let release=null;
const plugin=()=>window.Capacitor?.Plugins?.ApkUpdater||null;
function parts(v){return String(v||'0').replace(/^v/i,'').split(/[.+-]/).slice(0,3).map(x=>parseInt(x,10)||0);}
function newer(remote,local){const a=parts(remote),b=parts(local);for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i];}return false;}
function show(r,current){release=r;banner.hidden=false;title.textContent='Version '+r.version+' is available';detail.textContent='Installed version: '+current+'. '+(r.notes||'A ZEVON update is ready.').slice(0,180);message.textContent='Official release · SHA-256 checksum available.';action.hidden=false;dismiss.hidden=false;}
async function check(force=false){
 if(!window.Capacitor?.isNativePlatform?.())return;
 let cached=null;try{cached=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');}catch(_){}
 if(!force&&cached&&Date.now()-cached.checkedAt<6*60*60*1000){if(cached.release&&newer(cached.release.version,cached.currentVersion))show(cached.release,cached.currentVersion);return;}
 try{
  const p=plugin();if(!p)return;
  const installed=await p.getAppVersion();
  const response=await fetch('https://api.github.com/repos/'+REPO+'/releases/latest',{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
  if(!response.ok)throw new Error('Update service is temporarily unavailable.');
  const data=await response.json();
  const asset=(data.assets||[]).find(x=>/^ZEVON-Mobility-v[0-9]+\\.[0-9]+\\.[0-9]+\\.apk$/i.test(x.name));
  const digest=String(asset?.digest||'').replace(/^sha256:/i,'');
  const version=String(data.tag_name||'').replace(/^v/i,'');
  const record=asset&&digest.length===64?{version,url:asset.browser_download_url,name:asset.name,sha256:digest,notes:String(data.body||'').slice(0,1000)}:null;
  localStorage.setItem(CACHE_KEY,JSON.stringify({checkedAt:Date.now(),currentVersion:installed.version,release:record}));
  if(record&&newer(record.version,installed.version))show(record,installed.version);
 }catch(e){console.warn('ZEVON update check:',e.message);}
}
dismiss.addEventListener('click',()=>{banner.hidden=true;});
action.addEventListener('click',async()=>{
 if(!release)return;const p=plugin();if(!p){message.textContent='Updater is not available in this installed build.';return;}
 action.disabled=true;action.textContent='Preparing…';
 try{
  let permission=await p.canInstallPackages();
  if(!permission.allowed){message.textContent='Allow ZEVON to install updates in Android settings. Return here after enabling it.';await p.requestInstallPermission();permission=await p.canInstallPackages();if(!permission.allowed)throw new Error('Install permission was not granted.');}
  action.textContent='Downloading…';message.textContent='Downloading and verifying the signed APK. Please keep the app open.';
  await p.downloadAndInstall({url:release.url,fileName:release.name,sha256:release.sha256});
  message.textContent='APK verified. Android installer opened. Confirm the update to finish.';
 }catch(e){message.textContent=e.message||'Could not start the update. Please try again later.';}
 finally{action.disabled=false;action.textContent='Try again';}
});
window.addEventListener('load',()=>check());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check(true);});
})();
