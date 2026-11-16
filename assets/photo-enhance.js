/* Adds local, original AI-generated illustrative photography to service pages. No stock-photo hotlinks. */
(() => {
 const pages={
  '/airport/':{img:'assets/images/airport-chauffeur.jpg',title:'Airport journeys, thoughtfully coordinated',copy:'Share your terminal, pickup point, flight timing and passenger requirement. Vehicle options are confirmed for your date and location.'},
  '/rentals/':{img:'assets/images/sedan.jpg',title:'The right ride for the road ahead',copy:'Local, airport, outstation and hourly rental enquiries across suitable vehicle categories.'},
  '/corporate/':{img:'assets/images/city-fleet.jpg',title:'Move teams with a clear operating plan',copy:'Scope employee counts, shift timings, route clusters and vehicle mix with the ZEVON mobility team.'},
  '/buses/':{img:'assets/images/coach.jpg',title:'Group travel starts with the right plan',copy:'Tell us your passenger count, route, dates and coach requirement. Availability is checked before confirmation.'},
  '/fleet/':{img:'assets/images/fleet-lineup.jpg',title:'Flexible fleet and partner options',copy:'Vehicle sourcing and vendor coordination based on your service area, category and operating requirement.'},
  '/vehicles/':{img:'assets/images/van-traveller.jpg',title:'A vehicle category for every journey',copy:'Sedans, SUVs, premium vehicles, vans, buses and coaches can be requested subject to local availability.'},
  '/ev/':{img:'assets/images/suv.jpg',title:'Electric mobility within a wider fleet mix',copy:'EV options can be explored alongside other fuel types, depending on route, charging needs and vehicle availability.'},
  '/partner/':{img:'assets/images/van-traveller.jpg',title:'Build mobility capacity together',copy:'Vehicle owners and transport partners can share their fleet details for review and potential onboarding.'}
 };
 const file=location.pathname.split('/').pop()||'/',item=pages[file],head=document.querySelector('main .phead');
 if(!item||!head)return;
 const section=document.createElement('section');section.className='photo-enhance';
 const wrap=document.createElement('div');wrap.className='wrap';
 const hero=document.createElement('div');hero.className='photo-hero';hero.style.backgroundImage=`url('${item.img}')`;
 const content=document.createElement('div'),tag=document.createElement('span'),title=document.createElement('h2'),copy=document.createElement('p'),link=document.createElement('a');
 tag.className='tag';tag.textContent='ZEVON Mobility';title.textContent=item.title;copy.textContent=item.copy;link.href='/book/';link.className='btn btn-red';link.textContent='Start an Enquiry →';content.append(tag,title,copy,link);hero.append(content);
 const note=document.createElement('p');note.className='photo-disclaimer';note.textContent='Illustrative AI-generated service photography. Images do not represent confirmed ZEVON fleet inventory or live availability.';
 wrap.append(hero,note);section.append(wrap);head.insertAdjacentElement('afterend',section);
})();
