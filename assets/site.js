/* ZEVON MOBILITY — shared site script (header/footer, data, renderers) */
const CFG={wa:'917503303350',phone:'+91 96484 96425',mail:'info@zevonmobility.com',site:'zevonmobility.com'}; // Confirm these contact details before launch.
const D={
sol:[
{id:'corporate',ic:'🏢',t:'Corporate Mobility & ETS',s:'Employee transportation, scheduled commute, dedicated vehicles, airport transfers and managed mobility programmes for organisations.',f:['Employee pickup and drop programmes','Dedicated or pooled vehicle deployment','Shift-wise route and trip coordination','Service-level and reporting arrangements']},
{id:'rentals',ic:'🚘',t:'Car Rentals & Chauffeur Services',s:'Local, airport, outstation, hourly and executive travel with suitable vehicle options sourced from owned and verified partner fleets.',f:['Local and point-to-point rentals','Airport pickup and drop','Outstation one-way and round trips','Hourly and executive travel']},
{id:'bus',ic:'🚌',t:'Bus & Coach Transportation',s:'Group transportation for employee commute, events, tours and institutional requirements, subject to city and vehicle availability.',f:['Staff buses and employee shuttles','Tourist buses and coaches','Event and group transportation','Route-based or project-based deployment']},
{id:'fleet',ic:'🚗',t:'Fleet & Vendor Management',s:'Vehicle sourcing, partner coordination, driver deployment and fleet operations support for businesses with changing transportation needs.',f:['Own and partner fleet sourcing','Vendor and driver coordination','Vehicle attachment enquiries','Operational reporting and coordination']},
{id:'ev',ic:'⚡',t:'EV & Sustainable Mobility',s:'Electric vehicle deployment and sustainable transport options for customers and organisations looking to introduce lower-emission journeys.',f:['EV car rental options where available','Corporate EV deployment enquiries','EV fleet transition planning','Sustainability-focused mobility options']},
{id:'airport',ic:'✈️',t:'Airport Transfers',s:'Pre-arranged airport pickup and drop services for individual travellers, executives, guests and corporate teams.',f:['Airport pickup and drop','Meet-and-greet requests on confirmation','Sedan, SUV and premium options subject to availability','Flight and pickup coordination']}
],
ind:[
{id:'it-ites',ic:'💻',tag:'CORPORATE',t:'IT & ITES',s:'Employee commute and shift-based transportation',sol:['corporate','fleet','airport']},
{id:'banking',ic:'🏦',tag:'ENTERPRISE',t:'Banking & Financial Services',s:'Employee movement and executive travel',sol:['corporate','rentals','fleet']},
{id:'healthcare',ic:'🏥',tag:'HEALTHCARE',t:'Healthcare',s:'Staff, visitor and scheduled transport needs',sol:['corporate','rentals','bus']},
{id:'hospitality',ic:'🏨',tag:'HOSPITALITY',t:'Hotels & Hospitality',s:'Guest transfers and group movement',sol:['airport','rentals','bus']},
{id:'manufacturing',ic:'🏭',tag:'INDUSTRIAL',t:'Manufacturing & Industrial Parks',s:'Shift commute and workforce transportation',sol:['corporate','bus','fleet']},
{id:'education',ic:'🎓',tag:'INSTITUTIONS',t:'Education & Institutions',s:'Staff, student and event transportation enquiries',sol:['bus','rentals','fleet']},
{id:'events',ic:'🎪',tag:'EVENTS',t:'Events & Group Travel',s:'Guest, crew and group transportation',sol:['bus','rentals','fleet']},
{id:'airports',ic:'✈️',tag:'AIRPORTS',t:'Airports & Travel',s:'Passenger and corporate airport transfers',sol:['airport','rentals','fleet']}
],
why:[
{ic:'🤝',t:'One Mobility Partner',s:'A single point of contact for car rentals, employee transportation, buses, coaches and EV mobility enquiries.'},
{ic:'🚘',t:'Flexible Fleet Options',s:'Vehicle sourcing can combine ZEVON-managed vehicles and verified transport partners, subject to availability.'},
{ic:'🛡️',t:'Verification-led Operations',s:'Vehicle, permit, insurance and driver checks are part of the proposed partner onboarding and service confirmation process.'},
{ic:'📊',t:'Clear Service Coordination',s:'Defined trip details, agreed scope, service contacts and reporting expectations for each confirmed engagement.'}],
steps:[
{ic:'📋',t:'Share Requirement',s:'Tell us the service, city, route, date, passenger count and vehicle category you need.'},
{ic:'🔎',t:'Availability Check',s:'Our team checks suitable own-fleet and partner options, route feasibility and commercial terms.'},
{ic:'🧾',t:'Receive a Quote',s:'We share an indicative or confirmed proposal based on verified availability and agreed inclusions.'},
{ic:'🤝',t:'Confirm Service',s:'Once the booking or contract is accepted, the vehicle and service details are reconfirmed.'},
{ic:'🚗',t:'Travel & Support',s:'The trip proceeds with the agreed pickup details and support contact.'}],
vis:[
{ic:'🚘',t:'Multi-category Fleet',s:'Hatchback, sedan, SUV, MUV, premium vehicles, vans, buses and coaches can be requested.'},
{ic:'🌐',t:'Partner Network',s:'A partner-led sourcing model helps evaluate vehicle options across service locations.'},
{ic:'⚡',t:'EV Options',s:'Electric mobility remains an important dedicated service vertical within the wider ZEVON portfolio.'},
{ic:'📍',t:'City-wise Availability',s:'Services are confirmed location by location after checking vehicle and vendor availability.'},
{ic:'📱',t:'Digital Enquiry',s:'Customers can submit requirements through the website and continue via WhatsApp or email.'},
{ic:'📑',t:'Business Proposals',s:'Corporate enquiries can be scoped around employee count, shifts, routes, fleet type and contract duration.'}],
faq:[
['What services does ZEVON offer?','ZEVON accepts enquiries for corporate employee transportation, car rentals, airport transfers, outstation travel, hourly rentals, buses, coaches, fleet sourcing and EV mobility. Availability is confirmed for each location and requirement.'],
['Does ZEVON provide only electric vehicles?','No. ZEVON is positioned as a complete mobility and transportation partner. Vehicle options may include EV, CNG, petrol and diesel, depending on the category, city and verified availability.'],
['Does ZEVON operate its own fleet?','ZEVON uses an own-fleet and partner-fleet model. Specific vehicle ownership, sourcing and availability are confirmed when a requirement is evaluated.'],
['Can I book a bus or coach?','You can submit a bus or coach enquiry with the city, route, date, passenger count and trip duration. Our team will check availability and share a quotation.'],
['Are the website fares final?','No. The current fare calculator contains sample figures for demonstration and must not be treated as a live commercial offer. Final rates require ZEVON approval and confirmation of vehicle availability, route, inclusions and applicable taxes.'],
['What additional charges may apply?','Depending on the confirmed quotation, tolls, parking, state taxes, permits, driver allowance, waiting, night charges or extra distance may apply. These should be disclosed in the final quote.'],
['How can a vehicle owner become a partner?','Use the Partner With Us page to share your city, vehicle category, fleet size and contact details. Vehicle and document verification is required before any deployment.'],
['How do I get a corporate proposal?','Use the Corporate Mobility enquiry form and share your locations, employee count, shift timings, vehicle requirement and expected contract duration.']]}

/* reviews: add real client reviews here, e.g. {q:'Great service…',n:'Name, Company',r:'Airport client'} — the section stays hidden while empty */
D.reviews=[];
D.ins=[
{id:'airport-mobility-planning',tag:'Airports',m:3,t:'Planning reliable airport ground transportation',s:'A practical checklist for coordinating passenger and crew movement.',b:['Airport movement depends on arrival patterns, shift changes, pickup locations, passenger needs and vehicle availability. Start by mapping the service windows and passenger volumes.','Confirm vehicle categories, permits, pickup instructions, dispatch contacts, waiting rules and escalation procedures before the operation begins.','A well-defined operating plan helps customers, drivers and coordinators understand their responsibilities and reduces last-minute confusion.']},
{id:'corporate-commute',tag:'Enterprise',m:3,t:'What to define in an employee transportation programme',s:'Key questions for organisations planning recurring staff commute.',b:['A reliable employee commute programme starts with accurate employee counts, pickup zones, shift timings, route feasibility and a realistic vehicle mix.','Agree on driver and vehicle verification, attendance methods, service contacts, escalation processes, reporting frequency and billing rules before launch.','Review service performance regularly and update routes as headcount, shifts or office locations change.']},
{id:'fleet-sourcing',tag:'Fleet',m:2,t:'How to evaluate a transport fleet partner',s:'A checklist for businesses comparing vehicle and vendor options.',b:['Start with the service requirement: passenger capacity, route, schedule, operating city, contract period and service expectations.','Check the vehicle documents, permits, insurance, fitness, pollution certificate where applicable, driver credentials, backup arrangements and escalation contacts.','Compare the full commercial scope, including included kilometres, duty hours, tolls, parking, taxes, waiting, cancellation and extra-distance charges.']}];
const PARTNER=['Attach cars / SUVs','Attach bus / coach','Fleet or transport vendor','City operating partner','Other partnership'];
/* ================= PRICING — EDIT THESE NUMBERS BEFORE GOING LIVE =================
   Everything below is SAMPLE data so the fare mechanism works. Replace the rates,
   vehicles, airports, routes (city, city, km) and notes with your real ones, then set
   confirmed:true — the amber "Sample rates" tag disappears from the site.
   How fares are calculated:
   One-way   = km × rate + driver allowance
   Round-trip= max(2 × km, minKmDay × days) × rate + allowance × days
   Airport   = airport base fare × vehicle multiplier
   Hourly    = hr[package] per vehicle (4h/40km, 8h/80km, 12h/120km) */
const PRICING={confirmed:false,
 vehicles:[
  {id:'hatch',category:'Hatchback',fuel:['Petrol','CNG','EV'],ic:'🚗',n:'Hatchback',seat:'4 seats',bag:'2 bags',rate:11,allow:250,mult:1,hr:[1499,2699,3799]},
  {id:'sedan',category:'Sedan',fuel:['Petrol','Diesel','CNG','EV'],ic:'🚘',n:'Sedan',seat:'4 seats',bag:'3 bags',rate:13,allow:300,mult:1.2,hr:[1799,3199,4499]},
  {id:'suv',category:'SUV / MUV',fuel:['Petrol','Diesel','CNG','EV'],ic:'🚙',n:'SUV / MUV',seat:'6-7 seats',bag:'4 bags',rate:17,allow:400,mult:1.6,hr:[2399,4299,5999]},
  {id:'premium',category:'Premium / Luxury',fuel:['Petrol','Diesel','EV'],ic:'🚖',n:'Premium / Luxury',seat:'4-5 seats',bag:'3 bags',rate:24,allow:500,mult:2,hr:[3499,5999,8499]},
  {id:'van',category:'Van',fuel:['Diesel','CNG','EV'],ic:'🚐',n:'Van / Traveller',seat:'9-17 seats',bag:'8 bags',rate:28,allow:600,mult:2.4,hr:[3999,6999,9999]},
  {id:'bus',category:'Bus / Coach',fuel:['Diesel','CNG','EV'],ic:'🚌',n:'Bus / Coach',seat:'18-50+ seats',bag:'Group luggage',rate:42,allow:900,mult:3.5,hr:[6999,11999,16999]}],
 pk:[{h:4,km:40},{h:8,km:80},{h:12,km:120}],
 minKmDay:250,
 airport:{'Delhi NCR':899,'Mumbai':999,'Bengaluru':1199,'Hyderabad':999,'Chennai':899,'Pune':949},
 hourlyCities:['Delhi NCR','Mumbai','Bengaluru','Hyderabad','Chennai','Pune','Jaipur','Ahmedabad','Kolkata'],
 routes:[['Delhi','Agra',230],['Delhi','Jaipur',280],['Delhi','Chandigarh',245],['Delhi','Haridwar',220],['Delhi','Mathura',150],['Mumbai','Pune',150],['Bengaluru','Mysuru',145],['Chennai','Puducherry',155],['Ahmedabad','Vadodara',110],['Bhubaneswar','Puri',60]],
 notes:['Fares shown are indicative; the final fare is confirmed when you book.','Tolls, parking and state taxes are extra where applicable.','Distance or hours beyond the package are charged at the standard rate.','For EV journeys, charging requirements and stops must be checked for the specific vehicle and route.','Route not listed? Ask for a custom quote on WhatsApp.']};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const here=(location.pathname.split('/').pop()||'index.html').replace('solution.html','solutions.html').replace('insight.html','insights.html').replace('book.html','fares.html');
const NAV=[['index.html','Home'],['solutions.html','Services'],['corporate.html','Corporate'],['vehicles.html','Vehicles'],['fares.html','Book / Fares'],['industries.html','Industries'],['partner.html','Partner'],['about.html','About'],['contact.html','Contact']];
const logo='<a href="index.html" class="logo"><i></i><span><b>ZEVON</b><small>MOBILITY</small></span></a>';

document.body.insertAdjacentHTML('afterbegin',`<div class="prog" id="prog"></div><header id="hd"><div class="wrap hd">${logo}
<nav class="menu" id="menu">${NAV.map(([h,t])=>`<a href="${h}"${h===here?' class="on" aria-current="page"':''}>${t}</a>`).join('')}</nav>
<div class="hd-cta"><button class="sbtn" id="sbtn" aria-label="Search (Ctrl+K)">🔍</button><a href="contact.html" class="btn btn-red">Get a Quote</a><button class="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button></div></div></header>`);
document.body.insertAdjacentHTML('beforeend',`<footer><div class="wrap"><div class="ft">
<div>${logo}<p style="margin-top:18px;max-width:320px">Complete mobility and transportation solutions for businesses, travellers and partners. Smart. Reliable. Sustainable. Always ON.</p></div>
<div><h5>Solutions</h5><ul>${D.sol.map(s=>`<li><a href="solution.html?s=${s.id}">${s.t}</a></li>`).join('')}</ul></div>
<div><h5>Company</h5><ul>${NAV.map(([h,t])=>`<li><a href="${h}">${t}</a></li>`).join('')}<li><a href="insights.html">Insights</a></li></ul></div>
<div><h5>Contact</h5><ul><li>${CFG.mail}</li><li>${CFG.phone}</li><li>${CFG.site}</li><li><a href="https://wa.me/${CFG.wa}">WhatsApp</a> &nbsp;·&nbsp; <a href="mailto:${CFG.mail}">Email</a></li></ul></div></div>
<div class="fb"><div>© ${new Date().getFullYear()} ZEVON MOBILITY. All rights reserved.</div><div>Smart Mobility. <b>Always ON.</b></div></div></div></footer>
<a class="wa" href="https://wa.me/${CFG.wa}" aria-label="Chat on WhatsApp">💬 <span>Chat on WhatsApp</span></a>
<button class="totop" aria-label="Back to top">↑</button><div class="toast" id="toast" role="status"></div>`);

const card=(x,extra='')=>`<div class="card rv"><div class="ic">${x.ic}</div><h3>${x.t}</h3><p>${x.s}</p>${extra}</div>`;
const R={
sol:el=>{el.className='cards';el.innerHTML=D.sol.map(s=>`<a class="card rv" href="solution.html?s=${s.id}"><div class="ic">${s.ic}</div><h3>${s.t}</h3><p>${s.s}</p><span class="more">Explore solution →</span></a>`).join('')},
why:el=>{el.className='cards';el.style.gridTemplateColumns='repeat(2,1fr)';el.innerHTML=D.why.map(x=>card(x)).join('')},
vis:el=>{el.className='cards';el.innerHTML=D.vis.map(x=>card(x)).join('')},
ind:el=>{const full=el.dataset.full,tg=full?'div':'a';el.className='cards';
  el.innerHTML=D.ind.map(x=>`<${tg} class="card ind rv" id="${x.id}"${full?'':` href="industries.html#${x.id}"`}><div class="ic">${x.ic}</div><small>${x.tag}</small><h3>${x.t}</h3><p>${x.s}</p>${full?`<div class="chips">${x.sol.map(i=>`<a href="solution.html?s=${i}">${D.sol.find(z=>z.id===i).t}</a>`).join('')}</div>`:'<span class="more">See solutions →</span>'}</${tg}>`).join('')},
steps:el=>{let i=0;el.className='flow rv';
  el.innerHTML=`<div class="flow-list">${D.steps.map((s,k)=>`<button data-k="${k}"><span>${s.ic}</span>${s.t}</button>`).join('')}</div><div class="flow-panel"><div class="fp-ic"></div><small></small><h3></h3><p></p><div class="bar"><i></i></div></div>`;
  const set=k=>{i=k;$$('button',el).forEach((b,j)=>b.classList.toggle('on',j===k));const s=D.steps[k];$('.fp-ic',el).textContent=s.ic;$('small',el).textContent=`Step ${k+1} of ${D.steps.length}`;$('h3',el).textContent=s.t;$('p',el).textContent=s.s;const b=$('.bar i',el);b.style.animation='none';b.offsetWidth;b.style.animation=''};
  el.onclick=e=>{const b=e.target.closest('button');if(b){el.classList.add('hold');set(+b.dataset.k)}};
  set(0);setInterval(()=>{if(!el.classList.contains('hold')&&!reduce)set((i+1)%D.steps.length)},4200)},
faq:el=>{el.innerHTML='<h3>Frequently asked questions</h3>'+D.faq.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')},
opts:el=>{el.innerHTML='<option value="">Select a service...</option>'+(el.dataset.list==='partner'?PARTNER:[...D.sol.map(s=>s.t),'Partnership / Investment']).map(t=>`<option>${t}</option>`).join('');
  const v=new URLSearchParams(location.search).get('service');if(v&&[...el.options].some(o=>o.value===v))el.value=v},
detail:el=>{const id=new URLSearchParams(location.search).get('s'),k=D.sol.findIndex(s=>s.id===id);
  if(k<0){el.innerHTML='<div class="sh"><h2>Solution not found</h2><p>Choose one from our solutions list.</p><a class="btn btn-red" href="solutions.html">View all solutions</a></div>';return}
  const s=D.sol[k],p=D.sol[(k+5)%6],n=D.sol[(k+1)%6],rel=D.ind.filter(x=>x.sol.includes(s.id));
  document.title=`${s.t} — ZEVON MOBILITY`;$('#dt').textContent=s.t;$('#dl').textContent=s.s;$('#dc').textContent=s.t;
  el.innerHTML=`<div class="sd"><div><h2>What you get</h2><ul class="ticks">${s.f.map(f=>`<li>${f}</li>`).join('')}</ul>
  <h3 style="margin:36px 0 0">Who it's for</h3><div class="chips">${rel.map(x=>`<a href="industries.html#${x.id}">${x.ic} ${x.t}</a>`).join('')}</div>
  <div class="pn"><a href="solution.html?s=${p.id}">← ${p.t}</a><a href="solution.html?s=${n.id}">${n.t} →</a></div></div>
  <aside class="side card"><div class="ic">${s.ic}</div><h3>Interested in ${s.t}?</h3><p>Tell us your requirement and our team will respond within 24 hours.</p><a class="btn btn-red" style="width:100%;margin-top:18px" href="contact.html?service=${encodeURIComponent(s.t)}">Request this solution</a></aside></div>`}};

const inr=n=>'₹'+Math.round(n).toLocaleString('en-IN'),rnd=n=>Math.round(n/10)*10;
const addDays=n=>new Date(Date.now()+n*864e5).toISOString().slice(0,10),today=()=>addDays(0),tmr=()=>addDays(1);
const smp=()=>PRICING.confirmed?'':'<span class="smp" title="Sample rates — replace with approved rates before launch">Sample rates</span>';
const cityList=[...new Set(PRICING.routes.flatMap(r=>[r[0],r[1]]))].sort();
const dests=f=>PRICING.routes.filter(r=>r[0]===f||r[1]===f).map(r=>r[0]===f?r[1]:r[0]);
const kmOf=(a,b)=>{const r=PRICING.routes.find(r=>(r[0]===a&&r[1]===b)||(r[0]===b&&r[1]===a));return r?r[2]:0};
const dayDiff=(a,b)=>Math.max(1,Math.round((new Date(b)-new Date(a))/864e5)+1);
const qs=o=>'book.html?'+new URLSearchParams(o);
function fares(q){const t=q.type,km=kmOf(q.from,q.to),k=PRICING.pk[+q.pkg||0];
  if((t==='airport'&&!PRICING.airport[q.city])||(t==='hourly'&&!k)||((t==='oneway'||t==='round')&&!km))return null;
  return PRICING.vehicles.filter(v=>(!q.vehicle||q.vehicle==='any'||v.category===q.vehicle)&&(!q.fuel||q.fuel==='any'||v.fuel.includes(q.fuel))).map(v=>{let p,note;
    if(t==='airport'){p=PRICING.airport[q.city]*v.mult;note='Flat fare · '+(q.dir||'To airport')}
    else if(t==='hourly'){p=v.hr[+q.pkg||0];note=`${k.h} hours · ${k.km} km included`}
    else if(t==='oneway'){p=km*v.rate+v.allow;note=`${km} km · one way`}
    else{const d=q.rdate&&q.date?dayDiff(q.date,q.rdate):1,b=Math.max(km*2,PRICING.minKmDay*d);p=b*v.rate+v.allow*d;note=`${b} km billed · ${d} day${d>1?'s':''}`}
    return{v,p:rnd(p),note}})}
const low=q=>Math.min(...fares(q).map(x=>x.p));
const fcard=(href,t,sub,q)=>`<a class="rc" href="${href}"><div class="rt">${t}</div><small>${sub}</small><div class="pr"><small>Starting from</small><b>${inr(low(q))}</b></div><span class="more">Book now →</span></a>`;
const rCards=n=>PRICING.routes.slice(0,n||99).map(([a,b,km])=>fcard(qs({type:'oneway',from:a,to:b,date:tmr(),time:'09:00'}),`${a} <i>→</i> ${b}`,`${km} km · one way`,{type:'oneway',from:a,to:b})).join('');
const aCards=()=>Object.keys(PRICING.airport).map(c=>fcard(qs({type:'airport',dir:'To airport',city:c,date:tmr(),time:'09:00'}),`${c} Airport`,'Pickup &amp; drop transfer',{type:'airport',city:c})).join('');
const hCards=n=>PRICING.hourlyCities.slice(0,n||99).map(c=>fcard(qs({type:'hourly',city:c,pkg:0,date:tmr(),time:'09:00'}),c,`${PRICING.pk[0].h} hours · ${PRICING.pk[0].km} km`,{type:'hourly',pkg:0})).join('');
R.routes=el=>{el.className='rcs';el.innerHTML=rCards(+el.dataset.n)};
R.air=el=>{el.className='rcs';el.innerHTML=aCards()};
R.hourly=el=>{el.className='rcs';el.innerHTML=hCards(+el.dataset.n)};
R.notes=el=>{el.innerHTML=`<h3>How pricing works ${smp()}</h3><ul class="ticks">${PRICING.notes.map(n=>`<li>${n}</li>`).join('')}</ul>`};
R.pop=el=>{const n=+el.dataset.n||6,T=[['Outstation',()=>rCards(n)],['Airport',aCards],['Hourly Rental',()=>hCards(n)]];
  el.innerHTML=`<div class="pop-t">${T.map((t,i)=>`<button data-i="${i}">${t[0]}</button>`).join('')}</div><div class="rcs"></div><div class="cta"><a class="btn btn-red" href="fares.html">View all fares →</a></div>`;
  const g=$('.rcs',el),draw=i=>{$$('.pop-t button',el).forEach((b,j)=>b.classList.toggle('on',j===i));g.innerHTML=T[i][1]()};
  el.onclick=e=>{const b=e.target.closest('.pop-t button');if(b)draw(+b.dataset.i)};draw(0)};
const FD={sel:(f,v)=>`<select name="${f.n}">${f.o.map(o=>{const a=Array.isArray(o)?o:[o,o];return `<option value="${a[0]}"${String(v)===String(a[0])?' selected':''}>${a[1]}</option>`}).join('')}</select>`,
  txt:(f,v)=>`<input name="${f.n}" value="${v||''}" placeholder="${f.p||''}">`,
  date:(f,v)=>`<input name="${f.n}" type="date" min="${today()}" value="${v||(f.n==='rdate'?addDays(2):tmr())}" required>`,
  time:(f,v)=>`<input name="${f.n}" type="time" value="${v||'09:00'}" required>`};
const dt={n:'date',l:'Departure',t:'date'},tm={n:'time',l:'Pickup time',t:'time'};
const fr={n:'from',l:'From',t:'sel',o:cityList,w:1,d:'Delhi'},to={n:'to',l:'To',t:'sel',o:[],w:1};
const fleetFields=[{n:'vehicle',l:'Vehicle category',t:'sel',o:[['any','Any suitable category'],['Hatchback','Hatchback'],['Sedan','Sedan'],['SUV / MUV','SUV / MUV'],['Premium / Luxury','Premium / Luxury'],['Van','Van'],['Bus / Coach','Bus / Coach']],w:1,d:'any'},{n:'fuel',l:'Fuel preference',t:'sel',o:[['any','Any suitable fuel'],['EV','Electric'],['CNG','CNG'],['Petrol','Petrol'],['Diesel','Diesel']],w:1,d:'any'}];
const TT=[
 {k:'airport',l:'Airport',t:'Airport Transfer',f:[{n:'dir',l:'Trip',t:'sel',o:['To airport','From airport'],w:1},{n:'city',l:'City',t:'sel',o:Object.keys(PRICING.airport),w:1},{n:'addr',l:'Pickup / drop address',t:'txt',p:'Address',w:1},{...dt,l:'Date'},tm,...fleetFields]},
 {k:'oneway',l:'One-Way',t:'Outstation One-Way',f:[fr,to,dt,tm,...fleetFields]},
 {k:'round',l:'Round-Trip',t:'Outstation Round-Trip',f:[fr,to,dt,{n:'rdate',l:'Return',t:'date'},tm,...fleetFields]},
 {k:'hourly',l:'Hourly',t:'Hourly Rental',f:[{n:'city',l:'City',t:'sel',o:PRICING.hourlyCities,w:1},{n:'pkg',l:'Package',t:'sel',o:PRICING.pk.map((k,i)=>[i,`${k.h} hrs · ${k.km} km`]),w:1},{...dt,l:'Date'},tm,...fleetFields]}];
R.book=el=>{const P=Object.fromEntries(new URLSearchParams(location.search));let cur=Math.max(0,TT.findIndex(t=>t.k===P.type));
  el.innerHTML=`<div class="bk"><div class="bk-t" role="tablist">${TT.map((t,i)=>`<button type="button" role="tab" data-i="${i}" title="${t.t}">${t.t}</button>`).join('')}</div><form class="bk-f"></form><p class="bk-n">${smp()} Sample calculator only. All prices are unapproved examples; request a confirmed quotation before booking.</p></div>`;
  const f=$('.bk-f',el),fill=p=>{const d=dests(f.elements.from.value);f.elements.to.innerHTML=d.map(x=>`<option${x===p?' selected':''}>${x}</option>`).join('')};
  const draw=i=>{cur=i;const T=TT[i],V=n=>P.type===T.k?P[n]:undefined;$$('.bk-t button',el).forEach((b,j)=>{b.classList.toggle('on',j===i);b.setAttribute('aria-selected',j===i)});
    f.innerHTML=`<div class="bk-g">${T.f.map(x=>`<div${x.w?' class="full"':''}><label>${x.l}</label>${FD[x.t](x,V(x.n)||x.d)}</div>`).join('')}</div><button class="btn btn-red go">Go — see fares</button><a class="alt-q" target="_blank" rel="noopener" href="https://wa.me/${CFG.wa}?text=${encodeURIComponent('Hello ZEVON, I need a custom quote for a route that is not listed.')}">Route not listed? Get a custom quote</a>`;
    if(f.elements.from){fill(V('to'));f.elements.from.onchange=()=>fill()}};
  f.onsubmit=e=>{e.preventDefault();const T=TT[cur],o={type:T.k};T.f.forEach(x=>o[x.n]=f.elements[x.n].value);
    if(o.rdate&&o.rdate<o.date)return toast('Return date must be on or after departure.');location.href=qs(o)};
  el.onclick=e=>{const b=e.target.closest('.bk-t button');if(b)draw(+b.dataset.i)};draw(cur)};
R.results=el=>{const q=Object.fromEntries(new URLSearchParams(location.search));
  if(!q.type){el.innerHTML='<p class="empty">Choose your trip above and press <b>Go</b> to see fares.</p>';return}
  const L=fares(q),T=TT.find(t=>t.k===q.type)||TT[0],pk=PRICING.pk[+q.pkg]||PRICING.pk[0];
  const title={airport:`${q.dir||'To airport'} · ${q.city}`,oneway:`${q.from} → ${q.to}`,round:`${q.from} ⇄ ${q.to}`,hourly:`${q.city} · ${pk.h}-hour package`}[q.type]||'Your trip';
  const when=`${q.date||''}${q.time?' · '+q.time:''}${q.rdate?' → return '+q.rdate:''}`;
  const custom=`<a class="btn btn-out" target="_blank" rel="noopener" href="https://wa.me/${CFG.wa}?text=${encodeURIComponent(`Hello ZEVON, I need a custom quote.\nService: ${T.t}\nTrip: ${title}\nDate: ${when}`)}">Get a custom quote on WhatsApp</a>`;
  const head=`<div class="rh"><small>${T.t} ${smp()}</small><h2>${title}</h2><p>${when}</p></div>`;
  if(!L||!L.length){el.innerHTML=head+`<p class="empty">We don’t have a standard fare for this route or vehicle preference yet. Our team will check availability and quote it for you.</p><div style="text-align:center">${custom}</div>`;return}
  el.innerHTML=head+`<div class="fl">${L.map((x,i)=>`<div class="fc" data-i="${i}"><div class="fi"><div class="vi">${x.v.ic}</div><div><h3>${x.v.n}</h3><small>${x.v.category} · ${x.v.fuel.join(' / ')} · ${x.v.seat} · ${x.v.bag}</small><p>${x.note}</p></div></div>
  <div class="fp"><b>${inr(x.p)}</b><small>sample fare — not a live offer</small><button class="btn btn-red" data-b="1">Book now</button></div>
  <form class="fbk" hidden><div class="fg"><div><label>Full name *</label><input name="name" required autocomplete="name"></div><div><label>Phone *</label><input name="phone" type="tel" required autocomplete="tel"></div><div class="full"><label>Pickup address</label><input name="addr" value="${q.addr||''}" autocomplete="street-address"></div></div>
  <div class="row"><button class="btn btn-red" data-via="wa">Confirm on WhatsApp</button><button class="btn btn-out" data-via="mail">Email</button></div></form></div>`).join('')}</div>
  <div class="notes"><h3>How pricing works</h3><ul class="ticks">${PRICING.notes.map(n=>`<li>${n}</li>`).join('')}</ul><div style="margin-top:24px">${custom}</div></div>`;
  el.onclick=e=>{const b=e.target.closest('[data-b]');if(!b)return;const fm=b.closest('.fc').querySelector('.fbk');fm.hidden=!fm.hidden;b.textContent=fm.hidden?'Book now':'Close'};
  el.onsubmit=e=>{e.preventDefault();const x=L[+e.target.closest('.fc').dataset.i],f=e.target.elements;
    sendMsg(`Hello ZEVON, I'd like to book.\nService: ${T.t}\nTrip: ${title}\nDate/Time: ${when}\nVehicle: ${x.v.n}\nSample calculator amount (not a quote): ${inr(x.p)}\nName: ${f['name'].value}\nPhone: ${f['phone'].value}\nPickup address: ${f['addr'].value||'-'}`,'Booking request — '+title,e.submitter.dataset.via==='mail')}};
R.ins=el=>{el.className='cards';el.innerHTML=D.ins.map(a=>`<a class="card rv" href="insight.html?a=${a.id}"><span class="tg">${a.tag}</span><h3 style="margin-top:14px">${a.t}</h3><p>${a.s}</p><span class="more">Read · ${a.m} min →</span></a>`).join('')};
R.insd=el=>{const a=D.ins.find(x=>x.id===new URLSearchParams(location.search).get('a'));
  if(!a){el.innerHTML='<div class="sh"><h2>Article not found</h2><a class="btn btn-red" href="insights.html">All insights</a></div>';return}
  document.title=a.t+' — ZEVON MOBILITY';$('#dt').textContent=a.t;$('#dl').textContent=a.s;$('#dc').textContent=a.tag;
  el.innerHTML=`<article class="art">${a.b.map(p=>`<p>${p}</p>`).join('')}<div class="cband" style="border-radius:20px;padding:40px;margin-top:40px"><h2 style="font-size:26px">Plan your EV mobility with ZEVON</h2><p>Share your requirement and get a tailored quote.</p><a class="btn" href="contact.html">Talk to our team →</a></div></article>`};
R.reviews=el=>{if(!D.reviews.length){el.remove();return}$('.rg',el).innerHTML=D.reviews.map(r=>`<div class="card rv"><p>“${r.q}”</p><h4 style="margin-top:16px">${r.n}</h4><small>${r.r||''}</small></div>`).join('')};
function sendMsg(t,subj,mail){if(mail)location.href=`mailto:${CFG.mail}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(t)}`;else open(`https://wa.me/${CFG.wa}?text=${encodeURIComponent(t)}`,'_blank','noopener');toast(mail?'Your email app is opening — press send.':'WhatsApp is opening — press send.')}
$$('[data-r]').forEach(el=>R[el.dataset.r](el));

/* behaviours */
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),4200)};
const menu=$('#menu'),bg=$('.burger');
bg.onclick=()=>bg.setAttribute('aria-expanded',menu.classList.toggle('open'));
$$('.menu a').forEach(a=>a.onclick=()=>menu.classList.remove('open'));
const up=$('.totop');up.onclick=()=>scrollTo({top:0,behavior:reduce?'auto':'smooth'});
const onScroll=()=>{const h=document.documentElement,y=scrollY;$('#prog').style.width=(y/(h.scrollHeight-innerHeight||1)*100)+'%';$('#hd').classList.toggle('sc',y>10);up.classList.toggle('show',y>600)};
addEventListener('scroll',onScroll,{passive:true});onScroll();
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1});
$$('.rv').forEach(el=>io.observe(el));
const cio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;cio.unobserve(e.target);const el=e.target,n=+el.dataset.count,suf=el.dataset.suf||'',t0=performance.now();
  const f=t=>{const p=Math.min((t-t0)/1600,1);el.textContent=Math.round(n*(1-Math.pow(1-p,3)))+suf;if(p<1)requestAnimationFrame(f)};reduce?el.textContent=n+suf:requestAnimationFrame(f)}),{threshold:.5});
$$('[data-count]').forEach(el=>cio.observe(el));
$$('[data-rot]').forEach(el=>{const w=el.dataset.rot.split('|');let i=0;if(reduce)return;
  setInterval(()=>{el.classList.add('out');setTimeout(()=>{i=(i+1)%w.length;el.innerHTML=w[i];el.classList.remove('out')},300)},2400)});
if(location.hash)setTimeout(()=>$(location.hash)?.scrollIntoView(),50);

/* enquiry form -> WhatsApp or email (no backend needed) */
function enquiry(e){e.preventDefault();const f=e.target,v=n=>f.elements[n].value.trim();
  const t=`Hello ZEVON, I'd like to enquire.\nName: ${v('name')}\nCompany: ${v('company')}\nEmail: ${v('email')}\nPhone: ${v('phone')||'-'}\nService: ${v('service')||'-'}\nMessage: ${v('message')||'-'}`;
  const mail=e.submitter&&e.submitter.dataset.via==='mail';
  if(mail)location.href=`mailto:${CFG.mail}?subject=${encodeURIComponent('Enquiry — '+(v('service')||'ZEVON'))}&body=${encodeURIComponent(t)}`;
  else open(`https://wa.me/${CFG.wa}?text=${encodeURIComponent(t)}`,'_blank','noopener');
  toast(mail?'Your email app is opening — press send.':'WhatsApp is opening — press send.');f.reset()}

/* mobile action bar, WhatsApp links, search palette (Ctrl/Cmd+K) */
document.body.insertAdjacentHTML('beforeend',`<nav class="mbar" aria-label="Quick actions"><a href="tel:${CFG.phone.replace(/\s/g,'')}">📞 Call</a><a data-wa="Hello ZEVON, I'd like to know more.">💬 WhatsApp</a><a href="contact.html" class="q">Get Quote</a></nav>
<div class="srch" id="srch" hidden><div class="sbox" role="dialog" aria-label="Search"><input id="sq" placeholder="Search solutions, industries, insights, FAQs…" autocomplete="off"><ul id="sr"></ul><small>Esc to close · Enter opens the first result</small></div></div>`);
$$('[data-wa]').forEach(a=>{a.href=`https://wa.me/${CFG.wa}?text=${encodeURIComponent(a.dataset.wa)}`;a.target='_blank';a.rel='noopener'});
const IDX=[...PRICING.routes.map(([a,b])=>({t:`${a} to ${b} car rental`,h:qs({type:'oneway',from:a,to:b,date:tmr(),time:'09:00'}),k:'Fare'})),{t:'Fares & booking',h:'fares.html',k:'Page',x:'airport transfer outstation hourly rental price'},...NAV.map(([h,t])=>({t,h,k:'Page'})),...D.sol.map(s=>({t:s.t,h:'solution.html?s='+s.id,k:'Solution',x:s.s})),...D.ind.map(s=>({t:s.t,h:'industries.html#'+s.id,k:'Industry',x:s.s})),...D.ins.map(s=>({t:s.t,h:'insight.html?a='+s.id,k:'Insight',x:s.s})),...D.faq.map(([q,a])=>({t:q,h:'contact.html',k:'FAQ',x:a}))];
const sm=$('#srch'),sq=$('#sq'),sr=$('#sr');
const sFind=()=>{const q=sq.value.trim().toLowerCase(),r=(q?IDX.filter(i=>(i.t+' '+(i.x||'')).toLowerCase().includes(q)):IDX.slice(0,8)).slice(0,8);
  sr.innerHTML=r.length?r.map(i=>`<li><a href="${i.h}"><b>${i.t}</b><span>${i.k}</span></a></li>`).join(''):'<li class="none">No results — try “airport” or “fleet”.</li>'};
const sOpen=()=>{sm.hidden=false;sq.value='';sFind();sq.focus()},sClose=()=>{sm.hidden=true};
$('#sbtn').onclick=sOpen;sq.oninput=sFind;sm.onclick=e=>{if(e.target===sm)sClose()};
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();sOpen()}else if(e.key==='Escape')sClose();else if(e.key==='Enter'&&!sm.hidden){const a=$('#sr a');if(a)location.href=a.href}});
