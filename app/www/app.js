(() => {
'use strict';
const ENDPOINT='https://script.google.com/macros/s/AKfycbzlXJuFReuz1ywj4_KORsBMM7fSs_k5zb4euNA-5pOLEMGF9Pq2Bz3pkcspSs0AxhIx/exec';
const form=document.getElementById('booking-form'),statusBox=document.getElementById('form-status'),submitButton=document.getElementById('submit-btn'),submitLabel=submitButton.querySelector('.submit-label');
const dateInput=document.getElementById('travel-date'),returnWrap=document.getElementById('return-date-wrap'),returnInput=document.getElementById('return-date'),durationWrap=document.getElementById('duration-wrap'),durationInput=document.getElementById('duration'),durationLabel=document.getElementById('duration-label'),durationHint=document.getElementById('duration-hint');
const localToday=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
dateInput.min=localToday;dateInput.value=localToday;returnInput.min=localToday;document.getElementById('year').textContent=new Date().getFullYear();
function setTrip(value){
 document.getElementById('trip').value=value;
 document.querySelectorAll('[data-trip]').forEach(b=>b.classList.toggle('active',b.dataset.trip===value));
 const round=value==='Outstation Round-Trip',units={'Hourly Rental':['Hours','Enter required hours'],'Daily Rental':['Days','Enter number of days'],'Monthly Rental':['Months','Enter number of months']};
 returnWrap.hidden=!round;returnInput.required=round;
 durationWrap.hidden=!units[value];
 if(units[value]){durationLabel.textContent=units[value][0];durationHint.textContent=units[value][1];durationInput.value='1';}
 if(!round)returnInput.value='';
}
document.querySelectorAll('[data-trip]').forEach(b=>b.addEventListener('click',()=>setTrip(b.dataset.trip)));setTrip('Airport transfer');
function validPhone(value){
 const raw=String(value||'').trim();if(!raw||/[^0-9+\s\-().]/.test(raw)||raw.lastIndexOf('+')>0)return'';
 let d=raw.replace(/\D/g,'');
 if(raw[0]==='+'){if(d.startsWith('91'))return/^91[6-9]\d{9}$/.test(d)&&!/^(\d)\1+$/.test(d.slice(2))?'+'+d:'';return d.length>=8&&d.length<=15?'+'+d:'';}
 if(d.length===12&&d.startsWith('91'))d=d.slice(2);else if(d.length===11&&d[0]==='0')d=d.slice(1);
 return/^[6-9]\d{9}$/.test(d)&&!/^(\d)\1{9}$/.test(d)?'+91'+d:'';
}
function jsonp(params){return new Promise((resolve,reject)=>{
 const cb='zevonApp_'+Math.random().toString(36).slice(2),script=document.createElement('script');
 const timer=setTimeout(()=>{cleanup();reject(new Error('Receipt check timed out'));},10000);
 function cleanup(){clearTimeout(timer);delete window[cb];script.remove();}
 window[cb]=data=>{cleanup();resolve(data);};script.onerror=()=>{cleanup();reject(new Error('Receipt service unavailable'));};
 script.src=ENDPOINT+'?'+new URLSearchParams({...params,callback:cb,_:Date.now()}).toString();document.head.appendChild(script);
});}
function requestId(){const b=new Uint8Array(24);crypto.getRandomValues(b);return btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');}
const wait=ms=>new Promise(r=>setTimeout(r,ms)),payloadHash=p=>JSON.stringify(Object.keys(p).sort().map(k=>[k,p[k]]));
async function submitEnquiry(payload){
 const hash=payloadHash(payload);let pending=null;try{pending=JSON.parse(sessionStorage.getItem('zevonPendingEnquiry')||'null');}catch(_){}
 const rid=pending&&pending.hash===hash?pending.rid:requestId();sessionStorage.setItem('zevonPendingEnquiry',JSON.stringify({hash,rid}));
 const request={...payload,requestId:rid};let postSent=false;
 for(let attempt=0;attempt<8;attempt++){
  if(!postSent||attempt===3||attempt===6){try{await fetch(ENDPOINT,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(request)});postSent=true;}catch(_){}}
  await wait(attempt===0?900:1300);
  try{
   const receipt=await jsonp({action:'ack',rid});
   if(receipt&&receipt.found){
    if(receipt.ok===true&&receipt.id){sessionStorage.removeItem('zevonPendingEnquiry');return receipt;}
    if(receipt.ok===false&&!receipt.retryable){sessionStorage.removeItem('zevonPendingEnquiry');throw new Error(receipt.error||'ZEVON could not accept this enquiry. Please check the details.');}
   }
  }catch(error){if(error.message&&!['Receipt check timed out','Receipt service unavailable'].includes(error.message))throw error;}
 }
 throw new Error('Your request may have reached ZEVON, but confirmation is taking longer than expected. Please do not submit it again yet. Call +91 96484 96425 so our team can check it.');
}
form.addEventListener('submit',async e=>{
 e.preventDefault();statusBox.className='form-status show';statusBox.textContent='';
 const data=Object.fromEntries(new FormData(form).entries()),phone=validPhone(data.phone);
 if(!phone){statusBox.className='form-status show error';statusBox.textContent='Please enter a valid mobile number, for example +91 98765 43210.';document.getElementById('phone').focus();return;}
 if(data.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)){statusBox.className='form-status show error';statusBox.textContent='Please check the email address and try again.';return;}
 if(data.returnDate&&data.returnDate<data.date){statusBox.className='form-status show error';statusBox.textContent='Return date must be on or after the travel date.';return;}
 if(!durationWrap.hidden&&(!Number.isInteger(Number(data.duration))||Number(data.duration)<1||Number(data.duration)>365)){statusBox.className='form-status show error';statusBox.textContent='Please enter a valid trip duration.';durationInput.focus();return;}
 // The honeypot must remain empty. A previous hard-coded website value made the backend reject every app enquiry as spam.
 data.phone=phone;data.action='booking';delete data.website;
 data.durationUnit=durationWrap.hidden?'':({'Hourly Rental':'Hours','Daily Rental':'Days','Monthly Rental':'Months'}[data.trip]||'');
 data.distanceKm='';data.durationMin='';
 submitButton.disabled=true;submitLabel.textContent='Sending securely…';
 statusBox.className='form-status show pending';statusBox.textContent='Sending your enquiry to ZEVON and waiting for a verified receipt. Please keep this page open.';
 try{
  const receipt=await submitEnquiry(data);statusBox.className='form-status show success';
  statusBox.textContent='Enquiry received successfully. Your reference is '+receipt.id+'. This is not a confirmed booking; the ZEVON team will review availability and contact you.';
  form.reset();dateInput.value=localToday;returnInput.value='';setTrip('Airport transfer');statusBox.scrollIntoView({behavior:'smooth',block:'center'});
 }catch(error){statusBox.className='form-status show error';statusBox.textContent=error.message||'We could not confirm receipt. Please contact ZEVON before trying again.';}
 finally{submitButton.disabled=false;submitLabel.textContent='Send trip enquiry';}
});
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();

// ZEVON direct APK updater: checks public GitHub Releases and verifies SHA-256
// before handing an APK to Android's package installer.
const UPDATE_REPO='Vimlesh1996/zevonmobility';
const UPDATE_CACHE_KEY='zevon_release_check_v1';
const updateBanner=document.createElement('section');
updateBanner.id='zevon-update-banner';
updateBanner.className='update-banner';
updateBanner.hidden=true;
updateBanner.innerHTML='<div class="update-copy"><span class="update-kicker">ZEVON UPDATE</span><b id="update-title">A new version is ready</b><small id="update-detail"></small><div id="update-progress" class="update-progress" hidden><span></span></div><small id="update-message" role="status" aria-live="polite"></small></div><button type="button" id="update-action">Update now</button><button type="button" id="update-dismiss" aria-label="Dismiss update">×</button>';
document.querySelector('.topbar')?.insertAdjacentElement('afterend',updateBanner);
const updateTitle=updateBanner.querySelector('#update-title');
const updateDetail=updateBanner.querySelector('#update-detail');
const updateMessage=updateBanner.querySelector('#update-message');
const updateAction=updateBanner.querySelector('#update-action');
const updateDismiss=updateBanner.querySelector('#update-dismiss');
let availableRelease=null;
function versionParts(v){return String(v||'0').replace(/^v/i,'').split(/[.+-]/).slice(0,3).map(x=>parseInt(x,10)||0);}
function isNewer(remote,local){const a=versionParts(remote),b=versionParts(local);for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i];}return false;}
async function nativeUpdater(){return window.Capacitor?.Plugins?.ApkUpdater||null;}
async function checkForAppUpdate(force=false){
 if(!window.Capacitor?.isNativePlatform?.())return;
 const now=Date.now();let cached=null;
 try{cached=JSON.parse(localStorage.getItem(UPDATE_CACHE_KEY)||'null');}catch(_){}
 if(!force&&cached&&now-cached.checkedAt<6*60*60*1000){
  if(cached.release&&cached.currentVersion&&isNewer(cached.release.version,cached.currentVersion))showAvailableUpdate(cached.release,cached.currentVersion);
  return;
 }
 try{
  const plugin=await nativeUpdater();if(!plugin)return;
  const installed=await plugin.getAppVersion();
  const response=await fetch('https://api.github.com/repos/'+UPDATE_REPO+'/releases/latest',{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
  if(!response.ok)throw new Error('Update service unavailable');
  const release=await response.json();
  const apk=(release.assets||[]).find(a=>/^ZEVON-Mobility-v[0-9]+\.[0-9]+\.[0-9]+\.apk$/i.test(a.name));
  const digest=String(apk?.digest||'').replace(/^sha256:/i,'');
  const remoteVersion=String(release.tag_name||'').replace(/^v/i,'');
  const record=apk&&digest.length===64?{version:remoteVersion,url:apk.browser_download_url,name:apk.name,sha256:digest,notes:String(release.body||'').slice(0,1200),html:release.html_url}:null;
  localStorage.setItem(UPDATE_CACHE_KEY,JSON.stringify({checkedAt:now,currentVersion:installed.version,release:record}));
  if(record&&isNewer(record.version,installed.version))showAvailableUpdate(record,installed.version);
 }catch(error){console.warn('ZEVON update check:',error.message);}
}
function showAvailableUpdate(release,current){
 availableRelease=release;updateBanner.hidden=false;updateTitle.textContent='Version '+release.version+' is available';updateDetail.textContent='You have '+current+'. '+(release.notes||'New features and improvements are ready.').slice(0,220);
 updateAction.hidden=false;updateDismiss.hidden=false;updateMessage.textContent='Verified official ZEVON GitHub release.';
}
updateDismiss.addEventListener('click',()=>{updateBanner.hidden=true;});
updateAction.addEventListener('click',async()=>{
 if(!availableRelease)return;
 const plugin=await nativeUpdater();
 if(!plugin){updateMessage.textContent='Native updater is not available in this app build.';return;}
 updateAction.disabled=true;updateAction.textContent='Preparing update…';updateBanner.querySelector('#update-progress').hidden=false;
 try{
  const permission=await plugin.canInstallPackages();
  if(!permission.allowed){updateMessage.textContent='Allow ZEVON to install updates in Android settings. Return here and tap Update now.';await plugin.requestInstallPermission();const again=await plugin.canInstallPackages();if(!again.allowed)throw new Error('Install permission was not granted.');}
  updateAction.textContent='Downloading…';updateMessage.textContent='Downloading and verifying the official APK. Keep ZEVON open.';
  await plugin.downloadAndInstall({url:availableRelease.url,fileName:availableRelease.name,sha256:availableRelease.sha256});
  updateMessage.textContent='APK verified. Android installer opened; confirm installation there.';
 }catch(error){updateMessage.textContent=error.message||'Update could not be started. Try again later.';}
 finally{updateAction.disabled=false;updateAction.textContent='Try update again';}
});
if(document.readyState==='complete')checkForAppUpdate();else window.addEventListener('load',()=>checkForAppUpdate());
