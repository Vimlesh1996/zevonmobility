/* ZEVON public API client. GET returns only public rates/offers; POST accepts validated forms. */
(()=>{
 const ENDPOINT='https://script.google.com/macros/s/AKfycbzlXJuFReuz1ywj4_KORsBMM7fSs_k5zb4euNA-5pOLEMGF9Pq2Bz3pkcspSs0AxhIx/exec';
 function jsonp(params){return new Promise((resolve,reject)=>{const cb='zevonCb_'+Math.random().toString(36).slice(2);const script=document.createElement('script');let timer=setTimeout(()=>{cleanup();reject(new Error('ZEVON data service timed out'))},12000);function cleanup(){clearTimeout(timer);delete window[cb];script.remove()}window[cb]=data=>{cleanup();resolve(data)};script.onerror=()=>{cleanup();reject(new Error('ZEVON data service unavailable'))};script.src=ENDPOINT+'?'+new URLSearchParams({...params,callback:cb}).toString();document.head.appendChild(script)})}
 async function get(action,params={}){return jsonp({action,...params})}
 /* Same rules as the server (Code.gs phone_). Returns +91XXXXXXXXXX / +CC... or '' when invalid. */
 function phone(v){const s=String(v||'').trim();if(!s||/[^0-9+\s\-().]/.test(s)||s.lastIndexOf('+')>0)return'';let d=s.replace(/\D/g,'');if(s[0]==='+'){if(d.startsWith('91'))return/^91[6-9]\d{9}$/.test(d)&&!/^(\d)\1+$/.test(d.slice(2))?'+'+d:'';return d.length>=8&&d.length<=15?'+'+d:''}if(d.length===12&&d.startsWith('91'))d=d.slice(2);else if(d.length===11&&d[0]==='0')d=d.slice(1);return/^[6-9]\d{9}$/.test(d)&&!/^(\d)\1{9}$/.test(d)?'+91'+d:''}
 const rid=()=>{const b=new Uint8Array(24);crypto.getRandomValues(b);return btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 /* An attempt whose outcome we could not confirm is remembered per form type. Re-submitting the SAME payload reuses its
    requestId (the server then returns the original reference instead of creating a duplicate); a changed payload, or any
    definitive answer (success / rejection), starts a new requestId. */
 const pending={};
 const hashOf=p=>JSON.stringify(Object.keys(p).sort().map(k=>[k,p[k]]));
 async function post(payload){
  const act=payload.action||'booking',base={...payload,website:payload.website||''},h=hashOf(base),prev=pending[act];
  const requestId=prev&&prev.h===h?prev.rid:rid();pending[act]={rid:requestId,h};
  try{await fetch(ENDPOINT,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({...base,requestId})})}catch(_){/* outcome unknown: fall through and poll */}
  for(let i=0;i<10;i++){await wait(i?1500:1000);let r=null;try{r=await get('ack',{rid:requestId})}catch(_){}
   if(r&&r.found){delete pending[act];
    if(r.ok===false){const e=new Error(r.error||'Your request was not accepted.');e.rejected=true;throw e}
    if(r.ok&&r.id)return{verified:true,id:r.id,status:r.status}
    pending[act]={rid:requestId,h};break}}
  const e=new Error('Receipt could not be confirmed');e.unverified=true;throw e}
 window.ZEVON_API={ENDPOINT,get,post,phone,bootstrap:()=>get('bootstrap')};
 document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('form[data-zevon-form]').forEach(form=>form.addEventListener('submit',async ev=>{
   ev.preventDefault();const type=form.dataset.zevonForm,btn=form.querySelector('[type="submit"]'),status=form.querySelector('[data-form-status]');const data=Object.fromEntries(new FormData(form).entries());data.action=type;
   if(data.phone||type==='partner'){const p=phone(data.phone);if(!p){if(status)status.textContent='Please enter a valid 10-digit Indian mobile number (e.g. 98765 43210) or an international number starting with +.';return}data.phone=p}
   if(btn){btn.disabled=true;btn.dataset.label=btn.textContent;btn.textContent='Submitting…'}if(status)status.textContent='Submitting to ZEVON…';
   try{const r=await post(data);if(status)status.textContent='Request received. Your reference is '+r.id+'. This is an enquiry, not a confirmation — the ZEVON team will review it and contact you.';form.reset()}
   catch(err){if(status)status.textContent=err.rejected?err.message:err.unverified?'We could not confirm that your request was received. Please contact ZEVON on WhatsApp or phone before resubmitting.':'We could not send this request. Please retry or contact ZEVON directly.'}
   finally{if(btn){btn.disabled=false;btn.textContent=btn.dataset.label||'Submit'}}
  }));
 });
})();
