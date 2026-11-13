// Add the deployed Apps Script Web App URL here before enabling live enquiry capture.
const ZEVON_CONFIG = { bookingEndpoint: 'https://script.google.com/macros/s/AKfycbzlXJuFReuz1ywj4_KORsBMM7fSs_k5zb4euNA-5pOLEMGF9Pq2Bz3pkcspSs0AxhIx/exec' };
const $=s=>document.querySelector(s);const today=new Date();$('#travelDate').min=today.toISOString().slice(0,10);$('#travelDate').value=today.toISOString().slice(0,10);
$('#menuToggle').addEventListener('click',()=>$('#nav').classList.toggle('open'));document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>$('#nav').classList.remove('open')));
document.querySelectorAll('.trip-tabs button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.trip-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#tripType').value=b.dataset.trip;}));
let map, pickupMarker, dropMarker, routeLine;let pickupCoords=null,dropCoords=null,lastRoute=null;
if(window.L && typeof L.maplibreGL==='function'){
  map=L.map('map',{scrollWheelZoom:false,minZoom:1,maxBounds:[[-85,-180],[85,180]],maxBoundsViscosity:1}).setView([28.6139,77.2090],10);
  L.maplibreGL({style:'https://tiles.openfreemap.org/styles/positron'}).addTo(map);
  map.attributionControl.addAttribution('© <a href="https://openfreemap.org/">OpenFreeMap</a> · © <a href="https://openmaptiles.org/">OpenMapTiles</a> · Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>');
  if('ResizeObserver' in window){const mapEl=document.getElementById('map');new ResizeObserver(()=>map.invalidateSize({pan:false})).observe(mapEl);}
  window.addEventListener('load',()=>setTimeout(()=>map.invalidateSize({pan:false}),250));
}else{document.getElementById('map').innerHTML='<div class="map-error">Map library could not load. Check your internet connection and refresh.</div>';}
async function searchPlace(q){if(q.trim().length<3)return[];try{const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q='+encodeURIComponent(q+', India'),{headers:{'Accept-Language':'en'}});if(!r.ok)return[];return await r.json()}catch(e){return[]}}
function attachSearch(inputId,boxId,which){const input=$('#'+inputId),box=$('#'+boxId);let timer;input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(async()=>{const results=await searchPlace(input.value);box.innerHTML='';results.forEach(p=>{const b=document.createElement('button');b.type='button';b.textContent=p.display_name;b.addEventListener('click',()=>{input.value=p.display_name;box.innerHTML='';setPoint(which,[+p.lat,+p.lon]);});box.appendChild(b)});},800)});document.addEventListener('click',e=>{if(!box.contains(e.target)&&e.target!==input)box.innerHTML='';});}
function zevonPin(letter,kind){return L.divIcon({className:'zevon-map-pin-wrap',html:`<span class="zevon-map-pin ${kind}">${letter}</span><i class="zevon-map-pin-shadow"></i>`,iconSize:[34,44],iconAnchor:[17,40],popupAnchor:[0,-38]});}
function setPoint(which,coords){if(which==='pickup'){pickupCoords=coords;if(pickupMarker)map.removeLayer(pickupMarker);pickupMarker=L.marker(coords,{icon:zevonPin('A','pickup-pin')}).addTo(map).bindPopup('<b>ZEVON Pickup</b>');}else{dropCoords=coords;if(dropMarker)map.removeLayer(dropMarker);dropMarker=L.marker(coords,{icon:zevonPin('B','drop-pin')}).addTo(map).bindPopup('<b>ZEVON Destination</b>');}if(pickupCoords&&dropCoords)drawRoute();}
async function drawRoute(){if(!map)return;const url=`https://router.project-osrm.org/route/v1/driving/${pickupCoords[1]},${pickupCoords[0]};${dropCoords[1]},${dropCoords[0]}?overview=full&geometries=geojson`;try{const r=await fetch(url);const j=await r.json();if(!j.routes?.length)throw Error();const rt=j.routes[0];lastRoute={distanceKm:+(rt.distance/1000).toFixed(1),durationMin:Math.round(rt.duration/60)};if(routeLine)map.removeLayer(routeLine);routeLine=L.geoJSON(rt.geometry,{style:{color:'#d71e32',weight:5,opacity:.85}}).addTo(map);map.fitBounds(routeLine.getBounds(),{padding:[25,25]});$('#routeInfo').textContent=lastRoute.distanceKm+' km · approx '+lastRoute.durationMin+' min estimated';$('#routeStatus').textContent='Route preview ready';}catch(e){lastRoute=null;$('#routeInfo').textContent='Try another pickup or destination';$('#routeStatus').textContent='Route preview unavailable';map.fitBounds(L.latLngBounds(pickupCoords,dropCoords),{padding:[25,25]});}}
attachSearch('pickup','pickupSuggestions','pickup');attachSearch('drop','dropSuggestions','drop');$('#fitRoute').addEventListener('click',()=>{if(pickupCoords&&dropCoords)map.fitBounds(L.latLngBounds(pickupCoords,dropCoords),{padding:[25,25]});else map.setView([28.6139,77.2090],10)});
function setFormBusy(busy){const btn=$('#bookingForm button[type="submit"]');btn.disabled=busy;btn.style.opacity=busy?'.65':'1';btn.querySelector('span').textContent=busy?'…':'→';}
$('#bookingForm').addEventListener('submit',async e=>{
  e.preventDefault();const status=$('#formStatus');
  const data={trip:$('#tripType').value,pickup:$('#pickup').value,destination:$('#drop').value,date:$('#travelDate').value,time:$('#travelTime').value,passengers:$('#passengers').value,vehicle:$('#vehicle').value,notes:$('#notes').value,name:$('#customerName').value,email:$('#customerEmail').value,phone:$('#customerPhone').value,company:$('#companyName').value,website:$('#website').value,pickupLat:pickupCoords?.[0]??'',pickupLng:pickupCoords?.[1]??'',dropLat:dropCoords?.[0]??'',dropLng:dropCoords?.[1]??'',distanceKm:lastRoute?.distanceKm??'',durationMin:lastRoute?.durationMin??''};
  if(!ZEVON_CONFIG.bookingEndpoint){status.textContent='Setup pending: add the deployed Apps Script Web App URL in assets/app.js before accepting live enquiries.';return;}
  setFormBusy(true);status.textContent='Sending your enquiry securely…';
  try{
    // Apps Script ContentService does not expose a readable cross-origin response to this static site.
    // no-cors avoids a preflight; server-side validation and logging happen in doPost().
    await fetch(ZEVON_CONFIG.bookingEndpoint,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data)});
    status.textContent='Your enquiry has been submitted for processing. The ZEVON team will review your requirement and contact you to confirm availability and quotation. This is not a confirmed booking.';
    $('#bookingForm').reset();$('#travelDate').value=today.toISOString().slice(0,10);$('#tripType').value='Airport transfer';document.querySelectorAll('.trip-tabs button').forEach((b,i)=>b.classList.toggle('active',i===0));
  }catch(err){status.textContent='We could not send your enquiry right now. Please try again or email info@zevonmobility.com.';}
  finally{setFormBusy(false);}
});
