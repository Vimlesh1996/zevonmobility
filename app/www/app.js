(() => {
'use strict';
const ENDPOINT='https://script.google.com/macros/s/AKfycbzlXJuFReuz1ywj4_KORsBMM7fSs_k5zb4euNA-5pOLEMGF9Pq2Bz3pkcspSs0AxhIx/exec';
const form=document.getElementById('booking-form'),statusBox=document.getElementById('form-status'),submitButton=document.getElementById('submit-btn'),submitLabel=submitButton.querySelector('.submit-label');
const dateInput=document.getElementById('travel-date'),returnWrap=document.getElementById('return-date-wrap'),returnInput=document.getElementById('return-date'),durationWrap=document.getElementById('duration-wrap'),durationInput=document.getElementById('duration'),durationLabel=document.getElementById('duration-label'),durationHint=document.getElementById('duration-hint');
const REQUESTS_KEY='zevon_customer_requests_v1';
function readRequests(){try{const rows=JSON.parse(localStorage.getItem(REQUESTS_KEY)||'[]');return Array.isArray(rows)?rows:[];}catch(_){return[];}}
function saveRequest(payload,receipt){
 const rows=readRequests();
 rows.unshift({id:String(receipt.id),trip:String(payload.trip||'Trip'),pickup:String(payload.pickup||''),destination:String(payload.destination||''),date:String(payload.date||''),createdAt:new Date().toISOString()});
 localStorage.setItem(REQUESTS_KEY,JSON.stringify(rows.slice(0,20)));
 renderRequests();
}
function renderRequests(){
 const host=document.getElementById('request-list');if(!host)return;
 const rows=readRequests();host.replaceChildren();
 if(!rows.length){const empty=document.createElement('div');empty.className='empty-card';empty.innerHTML='<span class="empty-symbol">▤</span><b>No saved requests yet</b><p>Your confirmed enquiry references from this device will appear here.</p><button class="secondary-button" type="button" data-go-home>Plan a journey</button>';host.appendChild(empty);empty.querySelector('[data-go-home]').addEventListener('click',()=>document.querySelector('[data-nav="home"]').click());return;}
 rows.forEach(item=>{
  const card=document.createElement('article');card.className='request-card';
  const top=document.createElement('div');top.className='request-card-top';
  const trip=document.createElement('b');trip.textContent=item.trip;
  const state=document.createElement('span');state.className='request-status';state.textContent='Enquiry received';
  top.append(trip,state);
  const route=document.createElement('p');route.className='request-route';route.textContent=(item.pickup||'Pickup not saved')+' → '+(item.destination||'Destination not saved');
  const meta=document.createElement('div');meta.className='request-meta';meta.textContent='Reference: '+item.id+' · Travel date: '+(item.date||'Not specified');
  const note=document.createElement('small');note.textContent='Submitted successfully. Booking and availability are not yet confirmed.';
  card.append(top,route,meta,note);host.appendChild(card);
 });
}
const localToday=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
dateInput.min=localToday;dateInput.value=localToday;returnInput.min=localToday;const yearNode=document.getElementById('year');if(yearNode)yearNode.textContent=new Date().getFullYear();
function setTrip(value){
 document.getElementById('trip').value=value;
 document.querySelectorAll('[data-trip]').forEach(b=>b.classList.toggle('active',b.dataset.trip===value));
 const round=value==='Outstation Round-Trip',units={'Hourly Rental':['Hours','Enter required hours'],'Daily Rental':['Days','Enter number of days'],'Monthly Rental':['Months','Enter number of months']};
 returnWrap.hidden=!round;returnInput.required=round;
 durationWrap.hidden=!units[value];
 if(units[value]){durationLabel.textContent=units[value][0];if(durationHint)durationHint.textContent=units[value][1];durationInput.value='1';}
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
  const receipt=await submitEnquiry(data);saveRequest(data,receipt);statusBox.className='form-status show success';
  statusBox.textContent='Enquiry received successfully. Your reference is '+receipt.id+'. This is not a confirmed booking; the ZEVON team will review availability and contact you.';
  form.reset();dateInput.value=localToday;returnInput.value='';setTrip('Airport transfer');statusBox.scrollIntoView({behavior:'smooth',block:'center'});
 }catch(error){statusBox.className='form-status show error';statusBox.textContent=error.message||'We could not confirm receipt. Please contact ZEVON before trying again.';}
 finally{submitButton.disabled=false;submitLabel.textContent='Send trip enquiry';}
});
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();

renderRequests();
document.querySelectorAll('[data-nav]').forEach(button=>button.addEventListener('click',()=>{
 const name=button.dataset.nav;
 if(name==='requests')renderRequests();
 document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen===name));
 document.querySelectorAll('[data-nav]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 window.scrollTo({top:0,behavior:'smooth'});
}));
document.querySelectorAll('[data-go-home]').forEach(button=>button.addEventListener('click',()=>document.querySelector('[data-nav="home"]').click()));
document.querySelectorAll('[data-trip]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-trip]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});
}));
if(window.Capacitor?.isNativePlatform?.()){
 document.addEventListener('backbutton',()=>{
  const current=document.querySelector('.screen.active')?.dataset.screen||'home';
  if(current!=='home')document.querySelector('[data-nav="home"]').click();
  else if(window.Capacitor?.Plugins?.App?.minimizeApp)window.Capacitor.Plugins.App.minimizeApp();
 });
}
