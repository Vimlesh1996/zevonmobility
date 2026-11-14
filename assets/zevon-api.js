/* ZEVON public API client. GET returns only public rates/offers; POST accepts validated forms. */
(()=>{
 const ENDPOINT='https://script.google.com/macros/s/AKfycbzlXJuFReuz1ywj4_KORsBMM7fSs_k5zb4euNA-5pOLEMGF9Pq2Bz3pkcspSs0AxhIx/exec';
 function jsonp(params){return new Promise((resolve,reject)=>{const cb='zevonCb_'+Math.random().toString(36).slice(2);const script=document.createElement('script');let timer=setTimeout(()=>{cleanup();reject(new Error('ZEVON data service timed out'))},12000);function cleanup(){clearTimeout(timer);delete window[cb];script.remove()}window[cb]=data=>{cleanup();resolve(data)};script.onerror=()=>{cleanup();reject(new Error('ZEVON data service unavailable'))};script.src=ENDPOINT+'?'+new URLSearchParams({...params,callback:cb}).toString();document.head.appendChild(script)})}
 async function get(action,params={}){return jsonp({action,...params})}
 async function post(payload){const body={...payload,website:payload.website||''};await fetch(ENDPOINT,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)});return{queued:true,verified:false}}
 window.ZEVON_API={ENDPOINT,get,post,bootstrap:()=>get('bootstrap')};
 document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('form[data-zevon-form]').forEach(form=>form.addEventListener('submit',async ev=>{
   ev.preventDefault();const type=form.dataset.zevonForm,btn=form.querySelector('[type="submit"]'),status=form.querySelector('[data-form-status]');const data=Object.fromEntries(new FormData(form).entries());data.action=type;
   if(btn){btn.disabled=true;btn.dataset.label=btn.textContent;btn.textContent='Submitting…'}if(status)status.textContent='Submitting to ZEVON…';
   try{await post(data);if(status)status.textContent='Your request has been sent to the ZEVON intake service. Please allow the team to review it; submission is not a confirmation. The team will contact you on the details provided.';form.reset()}
   catch(err){if(status)status.textContent='We could not send this request. Please retry or contact ZEVON directly.'}
   finally{if(btn){btn.disabled=false;btn.textContent=btn.dataset.label||'Submit'}}
  }));
 });
})();
