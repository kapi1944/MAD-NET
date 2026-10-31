
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const form=$('availability-form');
 const town=$('availability-town'),street=$('availability-street'),person=$('availability-name');
 const phone=$('availability-phone'),email=$('availability-email'),note=$('availability-comment');
 const feedback=$('availability-feedback'),locText=$('availability-location-description'),locBox=$('availability-location-summary');
 const loadButton=$('availability-map-load'),loader=$('availability-map-loading');
 const clearButton=$('availability-map-clear'),centerButton=$('availability-map-center'),centerPinButton=$('availability-map-pin');
 const geosearchButton=$('availability-address-search'),submitButton=$('availability-submit');
 const interestRoot=$('availability-interests'),summary=$('availability-choice-summary');
 const MAP_CENTER=[54.063203,15.266009];
 const INTEREST_TECHS={FIBER:{name:'Światłowód',symbol:'✦',hint:'Złącze SC/UPC simplex'},LAN:{name:'Kablowy',symbol:'▣',hint:'Ethernet RJ-45'},AIR:{name:'Bezprzewodowy',symbol:'◉',hint:'Sieć radiowa'}};
 const interestState={FIBER:{on:false,packages:new Set()},LAN:{on:false,packages:new Set()},AIR:{on:false,packages:new Set()}};
 let locationPoint=null, map=null, marker=null, mapLoading=false, pinSource=null, lastAddressQuery='';
 let geocoding=false,autoGeoTimer=null, previousGeoTime=0;
 const geocache=new Map();
 let isSubmitting=false;
 const formatPoint=({lat,lng})=>`${lat.toFixed(6)}, ${lng.toFixed(6)}`;
 const termLabel=v=>v==='24'?'24 miesiące':v==='12'?'12 miesięcy':'Bezterminowo';
 const currentTerm=()=>form.querySelector('input[name="umowa"]:checked')?.value||'24';
 const selectedInterests=()=>Object.entries(interestState).filter(([,s])=>s.on).map(([tech,state])=>({tech,packages:[...state.packages]}));
 function setFeedback(text,error=false){feedback.textContent=text;feedback.dataset.error=String(error);}
 function offerPrice(plan,v){
  if(v==='none')return 'cena do uzgodnienia';
  const value=v==='12'?plan.monthly12:plan.monthly24;
  return value==null?'cena do potwierdzenia':value+' zł/mies.';
 }
 function renderInterestControls(){
  interestRoot.innerHTML=Object.entries(INTEREST_TECHS).map(([tech,info])=>{
   const plans=PLAN_DATA[tech];
   return `<section class="availability-tech-item" data-tech="${tech}"><label class="availability-tech-header"><input type="checkbox" class="availability-tech-toggle" data-tech="${tech}" aria-label="Zainteresowanie technologią ${tech}"><span class="tech-symbol">${info.symbol}</span><span><b>${tech} · ${info.name}</b><small>${info.hint}</small></span></label><div class="availability-package-set" data-set="${tech}" hidden><label class="availability-option"><input class="availability-package-all" type="checkbox" data-tech="${tech}" checked>Dowolny pakiet</label>${plans.map(p=>`<label class="availability-option"><input class="availability-package" type="checkbox" data-tech="${tech}" value="${p.id}"><span>${p.id.replace(/M$/,'')}</span></label>`).join('')}</div></section>`;
  }).join('');
  updateInterestUI();
 }
 function updateInterestUI(){
  for(const [tech,state] of Object.entries(interestState)){
   const wrap=interestRoot.querySelector(`[data-tech="${tech}"].availability-tech-item`);
   if(!wrap)continue;
   wrap.classList.toggle('is-checked',state.on);
   wrap.querySelector('.availability-tech-toggle').checked=state.on;
   const set=wrap.querySelector('.availability-package-set');set.hidden=!state.on;
   set.querySelector('.availability-package-all').checked=state.packages.size===0;
   set.querySelectorAll('.availability-package').forEach(c=>c.checked=state.packages.has(c.value));
  }
  const interests=selectedInterests(),v=currentTerm();
  if(!interests.length){summary.textContent='Zaznacz przynajmniej jedną technologię. Pakiety można łączyć między technologiami.';return;}
  const parts=interests.map(({tech,packages})=>{
   if(!packages.length)return `${tech}: dowolny pakiet`;
   return `${tech}: `+packages.map(id=>{
    const p=PLAN_DATA[tech].find(p=>p.id===id);
    return p?`${id.replace(/M$/,'')} (${offerPrice(p,v)})`:id;
   }).join(', ');
  });
  summary.textContent=`Zainteresowanie: ${parts.join(' · ')}. Umowa: ${termLabel(v)}.${v==='12'&&interests.some(i=>i.tech==='FIBER')?' Uwaga: dla FIBER nie opublikowano ceny 12-miesięcznej.':''}`;
 }
 interestRoot.addEventListener('change',ev=>{
  const el=ev.target,tech=el.dataset.tech;
  if(!tech||!interestState[tech])return;
  const state=interestState[tech];
  if(el.classList.contains('availability-tech-toggle')){state.on=el.checked;if(!state.on)state.packages.clear();}
  else if(el.classList.contains('availability-package-all')){state.on=true;state.packages.clear();}
  else if(el.classList.contains('availability-package')){state.on=true;if(el.checked)state.packages.add(el.value);else state.packages.delete(el.value);}
  updateInterestUI();
 });
 form.querySelectorAll('input[name="umowa"]').forEach(el=>el.addEventListener('change',updateInterestUI));
 // Jeżeli użytkownik wybierze pakiet na urządzeniu, dodaj go także do formularza.
 const zoneNode=$('connection-zone');
 zoneNode.addEventListener('click',ev=>{
  const hit=ev.target.closest('[data-port-plan-id],[data-select-plan]');
  if(!hit)return;
  const id=hit.dataset.portPlanId||hit.dataset.selectPlan;
  const tech=id.split('-')[0];
  if(!interestState[tech]||!PLAN_DATA[tech].some(p=>p.id===id))return;
  const state=interestState[tech];state.on=true;state.packages.add(id);updateInterestUI();
 });
 buttonsTerm.forEach(b=>b.addEventListener('click',()=>{
  // Zmiana głównego okresu umowy może wypełnić preferencję formularza.
  const value=b.dataset.term;
  if(!b.disabled&&form.querySelector(`input[name="umowa"][value="${value}"]`)){
   form.querySelector(`input[name="umowa"][value="${value}"]`).checked=true;updateInterestUI();
  }
 }));
 renderInterestControls();
 function setPoint(latlng,source='manual'){
  const lat=Number(latlng.lat),lng=Number(latlng.lng);
  if(!Number.isFinite(lat)||!Number.isFinite(lng))return;
  locationPoint={lat,lng};pinSource=source;
  locText.textContent=`Punkt ${source==='geocode'?'znaleziony po adresie':'zaznaczony ręcznie'}: ${formatPoint(locationPoint)} (orientacyjnie)`;
  locBox.classList.add('has-location');clearButton.disabled=false;
  if(marker)marker.setLatLng(locationPoint);
  else if(map&&window.L){
   marker=L.marker(locationPoint,{draggable:true,icon:L.divIcon({className:'availability-map-pin-icon',html:'<div class="point"></div>',iconSize:[37,42],iconAnchor:[19,39]})}).addTo(map);
   marker.on('dragend',()=>setPoint(marker.getLatLng(),'manual'));
  }
  if(map)map.panTo(locationPoint,{animate:!matchMedia('(prefers-reduced-motion: reduce)').matches});
 }
 function clearPoint(){
  locationPoint=null;pinSource=null;locBox.classList.remove('has-location');
  locText.textContent='Nie wskazano jeszcze miejsca na mapie.';clearButton.disabled=true;
  if(map&&marker){map.removeLayer(marker);marker=null;}
  setFeedback('Znacznik usunięty. Możesz wskazać inny punkt lub wpisać adres.');
 }
 clearButton.addEventListener('click',clearPoint);
 centerButton.addEventListener('click',()=>{
  if(!map){void loadMap();return;}
  map.setView(MAP_CENTER,12,{animate:!matchMedia('(prefers-reduced-motion: reduce)').matches});
 });
 centerPinButton.addEventListener('click',()=>{if(map)setPoint(map.getCenter(),'manual');});
 function loadScript(url){return new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=url;script.async=true;
  script.onload=resolve;script.onerror=()=>{script.remove();reject(new Error('Nie udało się załadować biblioteki mapy.'));};
  document.head.append(script);
 });}
 async function loadMap(){
  if(map)return true;
  if(mapLoading)return false;
  mapLoading=true;loadButton.disabled=true;loadButton.textContent='Ładowanie mapy…';
  try{
   if(!window.L){try{await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');}
    catch{await loadScript('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js');}}
   if(!window.L)throw new Error('leaflet');
   map=L.map('availability-map',{scrollWheelZoom:false,zoomControl:true}).setView(MAP_CENTER,12);
   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    minZoom:7,maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
   }).addTo(map);
   map.on('click',ev=>setPoint(ev.latlng,'manual'));
   if(locationPoint)setPoint(locationPoint,pinSource);
   loader.classList.add('is-hidden');centerPinButton.disabled=false;
   setTimeout(()=>map?.invalidateSize(),120);
   return true;
  }catch(e){
   loadButton.disabled=false;loadButton.textContent='Ponów ładowanie mapy';
   loader.querySelector('span').textContent='Mapa jest niedostępna. Adres i zapytanie można wypełnić bez niej.';
   setFeedback('Mapa wymaga połączenia z internetem. Pozostała część formularza działa.',true);
   return false;
  }finally{mapLoading=false;}
 }
 loadButton.addEventListener('click',()=>{void loadMap();});
 // Nominatim: tylko wyszukanie ukończonego adresu po zmianie pola lub przyciskiem.
 // Nie implementujemy autocomplete ani zapytań po każdym naciśnięciu klawisza.
 async function geocodeAddress(explicit=false){
  const city=town.value.trim(),road=street.value.trim();
  if(!city){if(explicit){setFeedback('Podaj miejscowość, aby znaleźć ją na mapie.',true);town.focus();}return;}
  if(!explicit&&!road)return;
  const query=[road,city,'Polska'].filter(Boolean).join(', ');
  if(!explicit&&(pinSource==='manual'||query===lastAddressQuery))return;
  if(geocoding)return;
  geocoding=true;geosearchButton.disabled=true;geosearchButton.textContent='⌛ Szukanie lokalizacji…';
  try{
   let result=geocache.get(query);
   if(!result){
    const delay=Math.max(0,1100-(Date.now()-previousGeoTime));
    if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
    previousGeoTime=Date.now();
    const endpoint=new URL('https://nominatim.openstreetmap.org/search');
    endpoint.searchParams.set('format','jsonv2');endpoint.searchParams.set('q',query);
    endpoint.searchParams.set('limit','1');endpoint.searchParams.set('countrycodes','pl');
    const response=await fetch(endpoint.href,{headers:{'Accept':'application/json'}});
    if(!response.ok)throw new Error('Serwis adresów chwilowo nie odpowiada');
    const hits=await response.json();
    if(!Array.isArray(hits)||!hits.length){
     setFeedback('Nie znaleziono dokładnego adresu. Możesz zaznaczyć punkt ręcznie na mapie.',true);
     return;
    }
    result={lat:Number(hits[0].lat),lng:Number(hits[0].lon)};
    geocache.set(query,result);
   }
   lastAddressQuery=query;
   if(!explicit&&pinSource==='manual')return;
   setPoint(result,'geocode');
   setFeedback('');
   if(await loadMap())map.setView(result,Math.min(17,road?16:13));
  }catch(e){setFeedback('Nie udało się znaleźć adresu online. Możesz wskazać punkt na mapie lub podać sam adres.',true);}
  finally{geocoding=false;geosearchButton.disabled=false;geosearchButton.textContent='⌖ Wyszukaj adres na mapie';}
 }
 geosearchButton.addEventListener('click',()=>{void geocodeAddress(true);});
 function addressChanged(){
  clearTimeout(autoGeoTimer);
  autoGeoTimer=setTimeout(()=>void geocodeAddress(false),850);
 }
 town.addEventListener('change',addressChanged);
 street.addEventListener('change',addressChanged);
 function collectData(){
  return {name:person.value.trim(),town:town.value.trim(),street:street.value.trim(),phone:phone.value.trim(),email:email.value.trim(),comment:note.value.trim(),
   term:currentTerm(),interest:selectedInterests(),position:locationPoint?{lat:locationPoint.lat,lng:locationPoint.lng}:null,
   mapSource:pinSource||'none',website:''};
 }
 function validPhone(value){const digits=value.replace(/\D/g,'');return digits.length>=7&&digits.length<=16;}
 function validate(){
  const data=collectData();
  if(!data.interest.length){setFeedback('Zaznacz przynajmniej jedną technologię.',true);interestRoot.scrollIntoView({behavior:'smooth',block:'center'});return false;}
  if(!data.position&&!(data.town&&data.street)){
   setFeedback('Podaj miejscowość i ulicę lub zaznacz punkt na mapie.',true);
   if(!data.town)town.focus();else street.focus();return false;
  }
  if(!data.email&&!data.phone){setFeedback('Podaj numer telefonu lub adres e-mail, abyśmy mogli odpowiedzieć.',true);phone.focus();return false;}
  if(data.email&&!email.checkValidity()){setFeedback('Podaj poprawny adres e-mail.',true);email.focus();return false;}
  if(data.phone&&!validPhone(data.phone)){setFeedback('Podaj poprawny numer telefonu.',true);phone.focus();return false;}
  if(!$('availability-consent').checked){setFeedback('Potwierdź prośbę o kontakt w sprawie zgłoszenia.',true);$('availability-consent').focus();return false;}
  return true;
 }
 function buildRequestText(){
  const d=collectData();
  return [
   'ZAPYTANIE O DOSTĘPNOŚĆ — MAD-NET','',
   'Technologie i pakiety:',...d.interest.map(i=>'• '+i.tech+': '+(i.packages.length?i.packages.map(p=>p.replace(/M$/,'')).join(', '):'dowolny pakiet')),
   'Preferowana umowa: '+termLabel(d.term),'',
   'Miejscowość: '+(d.town||'nie podano'),'Ulica i numer: '+(d.street||'nie podano'),
   'Punkt na mapie: '+(d.position?formatPoint(d.position):'nie wskazano'),
   d.position?'Mapa: https://www.openstreetmap.org/?mlat='+d.position.lat.toFixed(6)+'&mlon='+d.position.lng.toFixed(6)+'#map=16/'+d.position.lat.toFixed(6)+'/'+d.position.lng.toFixed(6):'',
   '','Imię: '+(d.name||'nie podano'),'Telefon: '+(d.phone||'nie podano'),'E-mail: '+(d.email||'nie podano'),
   'Uwagi: '+(d.comment||'brak'),'',
   'Proszę o informację o możliwości podłączenia i dostępnych warunkach.'
  ].filter(s=>s!=='').join('\n');
 }
 $('availability-copy').addEventListener('click',async()=>{
  if(!validate())return;
  try{
   const data=buildRequestText();
   if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(data);
   else{const t=document.createElement('textarea');t.value=data;t.style.cssText='position:fixed;left:-10000px';document.body.appendChild(t);t.select();if(!document.execCommand('copy'))throw new Error('copy');t.remove();}
   setFeedback('Skopiowano dane zgłoszenia. Możesz je wkleić do wiadomości e-mail.');
  }catch{setFeedback('Automatyczne kopiowanie nie zadziałało w tej przeglądarce.',true);}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(isSubmitting||!validate())return;
  if(location.protocol==='file:'){
   setFeedback('To lokalny podgląd HTML — nie wysyła e-maili. Aby wysyłać zapytania i potwierdzenia, uruchom stronę z dołączonym serwerowym modułem SMTP. Możesz na razie skopiować szczegóły.',true);return;
  }
  const d=collectData();isSubmitting=true;submitButton.disabled=true;submitButton.innerHTML='Wysyłanie… <span aria-hidden="true">↗</span>';
  try{
   const response=await fetch('api/zapytanie.php',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify(d),cache:'no-store'
   });
   let answer;try{answer=await response.json();}catch{throw new Error('Serwer nie zwrócił odpowiedzi JSON.');}
   if(!response.ok||!answer.ok)throw new Error(answer.message||'Nie można wysłać zgłoszenia.');
   const thanks=$('availability-thanks');
   thanks.hidden=false;
   thanks.querySelector('p').textContent=d.email?(answer.confirmationSent?
    'Wysłaliśmy potwierdzenie na Twój e-mail. Po weryfikacji warunków podłączenia skontaktujemy się na podany telefon lub e-mail.':
    'Zapytanie dotarło do operatora. Po sprawdzeniu możliwości podłączenia skontaktujemy się na podany telefon lub e-mail. Potwierdzenie e-mail może dotrzeć później.'):
    'Zapytanie dotarło do operatora. Po sprawdzeniu możliwości podłączenia skontaktujemy się na podany numer telefonu.';
   setFeedback('Zapytanie zostało wysłane do biuro@mad-net.pl.');
   thanks.scrollIntoView({behavior:'smooth',block:'center'});
  }catch(e){
   setFeedback('Nie wysłano zapytania. '+(e?.message||'Sprawdź połączenie z serwerem.')+' Możesz skopiować dane i wysłać je ręcznie na biuro@mad-net.pl.',true);
  }finally{isSubmitting=false;submitButton.disabled=false;submitButton.innerHTML='Wyślij zapytanie <span aria-hidden="true">↗</span>';}
 });
 $('availability-new').addEventListener('click',()=>{
  $('availability-thanks').hidden=true;
  form.reset();clearPoint();Object.values(interestState).forEach(s=>{s.on=false;s.packages.clear();});
  updateInterestUI();setFeedback('Możesz przygotować nowe zapytanie.');
  interestRoot.scrollIntoView({behavior:'smooth',block:'start'});
 });
})();

