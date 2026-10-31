
'use strict';
// Przepisano z oficjalnego cennika mad-net.pl/cennik.php, odczyt 29.10.2026.
// Wartości miesięczne: 24 m-ce, 12 m-cy, czas nieokreślony = telefonicznie.
const PLAN_DATA = Object.freeze({
 AIR:[
  {id:'AIR-10M',down:10,up:2,monthly24:54,monthly12:59},
  {id:'AIR-20M',down:20,up:2,monthly24:64,monthly12:69},
  {id:'AIR-40M',down:40,up:5,monthly24:74,monthly12:79},
  {id:'AIR-60M',down:60,up:5,monthly24:84,monthly12:89},
  {id:'AIR-80M',down:80,up:10,monthly24:94,monthly12:99}
 ],
 LAN:[
  {id:'LAN-10M',down:10,up:2,monthly24:49,monthly12:54},
  {id:'LAN-20M',down:20,up:2,monthly24:59,monthly12:64},
  {id:'LAN-40M',down:40,up:5,monthly24:64,monthly12:69},
  {id:'LAN-60M',down:60,up:5,monthly24:69,monthly12:74},
  {id:'LAN-80M',down:80,up:10,monthly24:74,monthly12:79}
 ],
 FIBER:[
  {id:'FIBER-50M',down:50,up:20,monthly24:45,monthly12:null},
  {id:'FIBER-100M',down:100,up:40,monthly24:55,monthly12:null},
  {id:'FIBER-300M',down:300,up:80,monthly24:65,monthly12:null}
 ]
});
const FEES=[
 ['Aktywacja usługi','od 10 zł','jednorazowo'],
 ['Zwiększenie pakietu','0 zł','jednorazowo'],
 ['Zmniejszenie pakietu','40 zł','jednorazowo'],
 ['Stały zewnętrzny adres IP','10 zł','m-c'],
 ['Konfiguracja routera klienta','30 zł','jednorazowo'],
 ['Przeniesienie przyłącza','40 zł','jednorazowo'],
 ['Cesja umowy','60 zł','jednorazowo'],
 ['Nieuzasadnione wezwanie serwisanta','30 zł','jednorazowo'],
 ['Uszkodzenie lub nie zwrócenie sprzętu operatora','300 zł','jednorazowo'],
 ['Uszkodzenie lub nie zwrócenie zasilacza','30 zł','jednorazowo'],
 ['Zwiększenie prędkości wysyłania do 5 Mbit/s','16 zł','m-c'],
 ['Zwiększenie prędkości wysyłania do 10 Mbit/s','26 zł','m-c']
];
const TITLES={AIR:'Bezprzewodowy / AIR',LAN:'Kablowy / LAN',FIBER:'Światłowód / FIBER'};
let technology='FIBER';let term='24';let animations=true;
const plansRoot=document.getElementById('plans');
const buttonsTech=[...document.querySelectorAll('[data-technology]')];
const buttonsTerm=[...document.querySelectorAll('[data-term]')];
const escapeText=(s)=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const BLINK_POINTS=Object.freeze([[10,0.2],[50,1],[100,3],[300,6]]);
function blinkHz(mbps){
 if(mbps<=BLINK_POINTS[0][0])return BLINK_POINTS[0][1];
 for(let i=1;i<BLINK_POINTS.length;i++){
  const [upperSpeed,upperHz]=BLINK_POINTS[i];
  const [lowerSpeed,lowerHz]=BLINK_POINTS[i-1];
  if(mbps<=upperSpeed){
   return lowerHz+(mbps-lowerSpeed)/(upperSpeed-lowerSpeed)*(upperHz-lowerHz);
  }
 }
 return BLINK_POINTS[BLINK_POINTS.length-1][1];
}
const emailLink=(id)=>'mailto:biuro@mad-net.pl?subject='+encodeURIComponent('Zapytanie o internet '+id)+'&body='+encodeURIComponent('Dzień dobry,\nProszę o informację o dostępności pakietu '+id+' pod moim adresem:\n\nMiejscowość:\nUlica i numer:\nTelefon kontaktowy:\n');
// V7: Centralne urządzenie jest diagramem ofert, nie specyfikacją sprzętu.
const logoSrc=document.querySelector('.brand img').src;
const centralRoot=document.getElementById('central-device');
const zone=document.getElementById('connection-zone');
const layer=document.getElementById('link-layer');
const hoverPath=document.getElementById('link-hover');
const activePath=document.getElementById('link-active');
const cableUnderlay=document.getElementById('link-casing');
const waveIcon=`<svg viewBox="0 0 64 48" aria-hidden="true"><path class="wifi-arc wifi-arc--middle" d="M18 26 Q32 12 46 26"/><path class="wifi-arc wifi-arc--large" d="M9 18 Q32 -2 55 18"/><path class="wifi-arc wifi-arc--small" d="M25 34 Q32 27 39 34"/><circle cx="32" cy="42" r="3"/></svg>`;
// W AIR nie pokazujemy wielkiego znaku nad urządzeniem. Każdy kanał/kafelek ma własne animowane łuki Wi-Fi.
let selectedPlanId=null;
let hoveredPlanId=null;
let linkPending=false;
let pathTimer=null;
let framePending=false;
let activationSequence=0;
const animationEnabled=()=>animations&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Tempo wizualizacji Wi-Fi jest symboliczne: 10 Mbit/s ≈ 2.4 s, 80 Mbit/s ≈ 0.74 s.
// Łuki (mały -> średni -> duży) przyspieszają wraz z pakietem, zamiast diod ACT.
const radioPeriod=(speed)=>Math.round(Math.max(700,2400/(1+Math.max(0,speed-10)*.032)));
const portName=()=>technology==='FIBER'?'SC/UPC SIMPLEX':technology==='LAN'?'RJ-45':'KANAŁ RADIOWY';
function socketHtml(kind,withCaps=true){
 if(kind==='LAN')return '<span class="jack-rj" aria-hidden="true"><span class="rj-mouth"><span class="rj-plug"><span class="rj-plug-grip"></span></span></span></span>';
 if(kind==='FIBER')return `<span class="sc-simplex" aria-hidden="true"><span class="sc-bays"><i class="sc-bay"></i></span>${withCaps?'<span class="sc-dustcaps"><i class="sc-dustcap"></i></span>':''}</span>`;
 return `<span class="air-virtual" aria-hidden="true">${waveIcon}</span>`;
}
function makeCentralPort(p,i){
 const hz=blinkHz(p.down)*1.5;
 const interval=Math.round(1000/hz);
 const caption=technology==='AIR'?'Wirtualny kanał':'Port '+(i+1);
 const accessibleName=`${caption} ${i+1}, ${p.down} Mbit/s, wybierz pakiet ${p.id}`;
 const indicators=technology==='AIR'?'<span class="signal-tag" aria-hidden="true">RF / TX</span>':'<span class="port-leds" aria-hidden="true"><i></i><i></i></span>';
 return `<button class="speed-port speed-port--${technology}" type="button" data-port-plan-id="${escapeText(p.id)}" data-speed="${p.down}" style="--pulse-ms:${interval}ms;--wifi-period:${radioPeriod(p.down)}ms" title="${escapeText(accessibleName)}" aria-label="${escapeText(accessibleName)}" aria-pressed="false">
   ${indicators}
   ${socketHtml(technology)}
   <span class="speed-label">${p.down}<small>Mb/s</small></span>
   ${technology==='FIBER'?'<span class="port-plug" aria-hidden="true"></span>':''}
  </button>`;
}
function makeCentralDevice(plans){
 const descriptor=technology==='LAN'?'PORTY ETHERNET / RJ-45':technology==='FIBER'?'ADAPTERY SC/UPC SIMPLEX': '5 WIRTUALNYCH KANAŁÓW · BEZ GNIAZD';

 return `<div class="central-unit" style="--wifi-period:${radioPeriod(plans[0].down)}ms"><div class="device-shell" data-technology="${technology}">
  <div class="device-top"><img src="${logoSrc}" class="device-logo" alt="Logo Mad-Net"><div class="device-title">MAD-NET · SWITCH <strong>${technology} / ${String(plans.length).padStart(2,'0')} ${technology==='AIR'?'CH':'PORT'}</strong></div></div>
  <div class="device-mid"><div class="device-power"><i class="power-light" aria-hidden="true"></i><span>PWR</span></div><div class="device-ports" role="group" aria-label="Wybierz prędkość internetu">${plans.map(makeCentralPort).join('')}</div></div>
  <div class="device-foot"><span>${descriptor}</span><span>LINK / ACT · DEMO</span></div>
  </div><div class="device-hint">${plans.length} ${technology==='AIR'?'kanałów do wyboru':plans.length===3?'porty do wyboru':'portów do wyboru'} • JEDNO URZĄDZENIE</div></div>`;
}
function makePlan(p){
 const hz=blinkHz(p.down)*1.5;
 const interval=Math.round(1000/hz);
 const phone=term==='none';
 const price=phone?null:term==='12'?p.monthly12:p.monthly24;
 const priceHtml=phone?'<strong class="individual-label">Wycena indywidualna</strong>':`<strong>${price}</strong><span>zł / mies.</span>`;
 const termText=phone?'Abonament — bezterminowo':`Abonament • ${term==='12'?'1 rok':'2 lata'}`;
 const selected=p.id===selectedPlanId;
 const etykietaPortu=technology==='AIR'?'<strong>WĘZEŁ RADIOWY</strong> <small>/ BEZ KABLA</small>':`<small>1 ×</small> <strong>${technology==='FIBER'?'SC/UPC SIMPLEX':'RJ-45'}</strong>`;
 return `<article class="plan${selected?' is-selected':''}" data-plan-id="${escapeText(p.id)}" data-technology="${technology}" data-speed="${p.down}" data-port-count="1" data-blink-hz="${hz.toFixed(2)}" data-blink-ms="${interval}" aria-label="Pakiet ${escapeText(p.id)}: pobieranie ${p.down}, wysyłanie ${p.up} Mbit/s" style="--pulse-ms:${interval}ms;--wifi-period:${radioPeriod(p.down)}ms">
 <button class="plan-hit" type="button" data-select-plan="${escapeText(p.id)}" aria-pressed="${selected}" aria-label="Wybierz ${escapeText(p.id)}: ${p.down} Mbit/s, ${phone?'wycena indywidualna':price+' zł miesięcznie'}"></button>
 <div class="card-terminal"><span class="card-terminal-label">${etykietaPortu}</span><div class="mini-interface mini-interface--${technology}" data-card-port="${escapeText(p.id)}">${socketHtml(technology,true)}${technology==='FIBER'?'<span class="mini-plug"></span>':''}</div></div>
 <div class="plan-body"><div class="plan-name"><span>● Pakiet MAD-NET</span></div>
 <div class="plan-speed">${technology}-${p.down}</div>
 <div class="specs"><div class="spec"><b class="predkosc-pobierania"><span aria-hidden="true">↓</span> <strong>${p.down}</strong> <small>Mbit/s</small></b><span>POBIERANIE</span></div><div class="spec"><b class="predkosc-wysylania">↑ <strong>${p.up}</strong> Mbit/s</b><span>WYSYŁANIE</span></div></div></div>
 <div class="plan-bottom"><div class="price">${priceHtml}</div><div class="termline">${termText}</div><a class="ask" href="${emailLink(p.id)}">Zapytaj o dostępność <span aria-hidden="true">↗</span></a></div>
 </article>`;
}
// MAD-NET V17 — dwa dopuszczalne wejścia na górnej krawędzi każdego kafelka.
// Routing wspólny dla przewodów LAN/FIBER i strumienia punktów AIR.
// Wnętrze nie-docelowego kafelka jest obszarem zabronionym; kolejne rzędy omijamy ZEWNĘTRZNIE.
function locate(id){
 if(!id)return null;
 const port=[...centralRoot.querySelectorAll('.speed-port')].find(el=>el.dataset.portPlanId===id);
 const card=[...plansRoot.querySelectorAll('.plan')].find(el=>el.dataset.planId===id);
 if(!port||!card)return null;
 const deviceSocket=port.querySelector('.jack-rj,.sc-simplex,.air-virtual')||port;
 const cardSocket=card.querySelector('.mini-interface .jack-rj,.mini-interface .sc-simplex,.mini-interface .air-virtual')||card.querySelector('.mini-interface');
 const cardInterface=card.querySelector('.mini-interface');
 const terminalLabel=card.querySelector('.card-terminal-label');
 if(!cardSocket||!cardInterface)return null;
 const z=zone.getBoundingClientRect();
 const src=deviceSocket.getBoundingClientRect(),dst=cardSocket.getBoundingClientRect();
 const cardRect=card.getBoundingClientRect(),interfaceRect=cardInterface.getBoundingClientRect();
 const pos=(x,y)=>({x:x-z.left,y:y-z.top});
 // Końce połączenia znajdują się POD dolną krawędzią portu (brak wejścia od góry).
 const origin=pos(src.left+src.width/2,src.bottom-2);
 const endpoint=pos(dst.left+dst.width/2,dst.bottom-1);
 // Wskazane na rysunku dwa punkty: połowy odstępów między obrysem portu a obrysem kafelka.
 const entryLeft=(cardRect.left+interfaceRect.left)/2-z.left;
 const entryRight=(interfaceRect.right+cardRect.right)/2-z.left;
 const rects=[...plansRoot.querySelectorAll('.plan')].map(el=>({el,rect:el.getBoundingClientRect()}));
 const rows=[];
 for(const item of rects){
  const top=item.rect.top-z.top;
  // Skalowanie hover/selected zmienia visual bounding rect o kilka px: to ciągle TEN SAM rząd.
  let row=rows.find(row=>Math.abs(row.top-top)<=20);
  if(!row){row={top,bottom:item.rect.bottom-z.top,items:[]};rows.push(row);}
  row.top=Math.min(row.top,top);
  row.bottom=Math.max(row.bottom,item.rect.bottom-z.top);
  row.items.push(item);
 }
 rows.sort((a,b)=>a.top-b.top);
 const targetRow=rows.findIndex(row=>row.items.some(item=>item.el===card));
 if(targetRow<0)return '';
 // Wewnątrz KARTY: po wejściu jednym z dopuszczonych punktów schodzimy,
 // skręcamy pod złączem i wpinamy od dołu, nie przecinając opisu, ceny ani CTA.
 const labelTop=terminalLabel?terminalLabel.getBoundingClientRect().top-z.top:Infinity;
 const insideY=Math.max(endpoint.y+5,Math.min(endpoint.y+11,labelTop-4));
 const firstRowTop=rows[0].top;
 const centralBottom=document.getElementById('central-area').getBoundingClientRect().bottom-z.top;
 // Górny korytarz znajduje się POMIĘDZY urządzeniem a pierwszym rzędem.
 const topLane=centralBottom+Math.max(5,(firstRowTop-centralBottom)*.5);
 const laneForTarget=targetRow===0?topLane:
  rows[targetRow-1].bottom+Math.max(5,(rows[targetRow].top-rows[targetRow-1].bottom)*.5);
 const candidateEntries=[entryLeft,entryRight];
 let best=null;
 for(const entryX of candidateEntries){
  let points;
  if(targetRow===0){
   // Zjazd -> jedna linia pozioma nad rzędem -> wejście przez wybrany punkt.
   points=[origin,{x:origin.x,y:topLane},{x:entryX,y:topLane},
    {x:entryX,y:insideY},{x:endpoint.x,y:insideY},endpoint];
  }else{
   // Przy dolnych rzędach pionowa magistrala idzie OBOK wszystkich wcześniejszych kart,
   // nigdy przez nie ani przez pionowe szczeliny pomiędzy nimi.
   const earlier=rows.slice(0,targetRow).flatMap(row=>row.items.map(item=>item.rect));
   const leftEdge=Math.min(...earlier.map(rect=>rect.left-z.left));
   const rightEdge=Math.max(...earlier.map(rect=>rect.right-z.left));
   const outsideOptions=[leftEdge-14,rightEdge+14];
   for(const outside of outsideOptions){
    const route=[origin,{x:origin.x,y:topLane},{x:outside,y:topLane},
     {x:outside,y:laneForTarget},{x:entryX,y:laneForTarget},
     {x:entryX,y:insideY},{x:endpoint.x,y:insideY},endpoint];
    const penalty=(outside<3||outside>zone.clientWidth-3)?1000:0;
    const distance=route.slice(1).reduce((sum,p,i)=>sum+Math.abs(p.x-route[i].x)+Math.abs(p.y-route[i].y),0);
    const score=distance+penalty;
    if(!best||score<best.score)best={points:route,score};
   }
   continue;
  }
  const score=points.slice(1).reduce((sum,p,i)=>sum+Math.abs(p.x-points[i].x)+Math.abs(p.y-points[i].y),0);
  if(!best||score<best.score)best={points,score};
 }
 return best?roundedCablePath(best.points,6):'';
}
function roundedCablePath(raw,radius){
 const pts=[];
 for(const point of raw){
  if(!Number.isFinite(point.x)||!Number.isFinite(point.y))continue;
  const p={x:Math.round(point.x*10)/10,y:Math.round(point.y*10)/10};
  if(pts.length&&Math.abs(p.x-pts.at(-1).x)<.2&&Math.abs(p.y-pts.at(-1).y)<.2)continue;
  pts.push(p);
 }
 // Usuwanie współliniowych odcinków.
 for(let i=1;i<pts.length-1;){
  const p=pts[i-1],q=pts[i],r=pts[i+1];
  if((Math.abs(p.x-q.x)<.2&&Math.abs(q.x-r.x)<.2)||(Math.abs(p.y-q.y)<.2&&Math.abs(q.y-r.y)<.2))pts.splice(i,1);else i++;
 }
 if(pts.length<2)return '';
 let d=`M ${pts[0].x} ${pts[0].y}`;
 for(let i=1;i<pts.length-1;i++){
  const a=pts[i-1],p=pts[i],b=pts[i+1];
  const incoming=Math.hypot(p.x-a.x,p.y-a.y),outgoing=Math.hypot(b.x-p.x,b.y-p.y);
  if(incoming<.5||outgoing<.5)continue;
  const corner=Math.min(radius,incoming/2,outgoing/2);
  const p1={x:p.x+(a.x-p.x)*corner/incoming,y:p.y+(a.y-p.y)*corner/incoming};
  const p2={x:p.x+(b.x-p.x)*corner/outgoing,y:p.y+(b.y-p.y)*corner/outgoing};
  d+=` L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${p.x} ${p.y} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
 }
 d+=` L ${pts.at(-1).x} ${pts.at(-1).y}`;
 return d;
}
function drawStaticPath(node,id){
 const geometry=locate(id);
 node.setAttribute('d',geometry||'');
 if(node===activePath)cableUnderlay.setAttribute('d',geometry||'');
 node.classList.toggle('is-visible',!!geometry);
 return geometry;
}
function updateLinks(){
 if(!zone.isConnected)return;
 const w=Math.max(zone.clientWidth,1),h=Math.max(zone.clientHeight,1);
 layer.setAttribute('viewBox',`0 0 ${w} ${h}`);
 layer.style.width=w+'px';layer.style.height=h+'px';
 if(selectedPlanId&&!linkPending){
   // Nie przerywaj aktywnego rysowania przewodu podczas odświeżania geometrii.
   const wasAnimating=activePath.classList.contains('is-drawing');
   drawStaticPath(activePath,selectedPlanId);
   if(!wasAnimating){activePath.style.strokeDasharray='';activePath.style.strokeDashoffset='0';}
 }else{activePath.setAttribute('d','');cableUnderlay.setAttribute('d','');activePath.classList.remove('is-visible');}
 drawStaticPath(hoverPath,hoveredPlanId&&hoveredPlanId!==selectedPlanId?hoveredPlanId:null);
}
function scheduleLinks(){
 if(framePending)return;
 framePending=true;
 requestAnimationFrame(()=>{framePending=false;updateLinks();});
}
function animateLink(delay){
 clearTimeout(pathTimer);
 const sequence=activationSequence;
 const geometry=drawStaticPath(activePath,selectedPlanId);
 if(!geometry)return;
 // AIR nie ma przewodu: zamiast stałej linii płyną niebieskie punkty radiowe.
 if(technology==='AIR'){
  activePath.classList.remove('is-drawing');
  activePath.classList.add('is-radio');
  activePath.style.transition='none';
  activePath.style.strokeDasharray='';
  activePath.style.strokeDashoffset='';
  return;
 }
 activePath.classList.remove('is-radio');
 if(!animationEnabled()){
  activePath.classList.remove('is-drawing');activePath.style.transition='none';activePath.style.strokeDasharray='';activePath.style.strokeDashoffset='';return;
 }
 const length=Math.ceil(activePath.getTotalLength());
 activePath.classList.add('is-drawing');
 activePath.style.transition='none';
 activePath.style.strokeDasharray=String(length);
 activePath.style.strokeDashoffset=String(length);
 activePath.getBoundingClientRect();
 pathTimer=setTimeout(()=>{
  if(sequence!==activationSequence)return;
  activePath.style.transition='stroke-dashoffset .8s cubic-bezier(.2,.8,.3,1),opacity .2s';
  requestAnimationFrame(()=>{if(sequence===activationSequence)activePath.style.strokeDashoffset='0';});
 },delay);
 const once=(e)=>{if(e.propertyName!=='stroke-dashoffset')return;activePath.classList.remove('is-drawing');activePath.removeEventListener('transitionend',once);};
 activePath.addEventListener('transitionend',once);
}
function syncStates(){
 centralRoot.querySelectorAll('.speed-port').forEach(btn=>{
  const id=btn.dataset.portPlanId;
  btn.classList.toggle('is-selected',id===selectedPlanId);
  btn.classList.toggle('is-hovered',id===hoveredPlanId);
  btn.setAttribute('aria-pressed',String(id===selectedPlanId));
 });
 plansRoot.querySelectorAll('.plan').forEach(card=>{
  const id=card.dataset.planId;
  card.classList.toggle('is-selected',id===selectedPlanId);
  card.classList.toggle('is-hovered',id===hoveredPlanId);
  card.querySelector('.plan-hit').setAttribute('aria-pressed',String(id===selectedPlanId));
 });
 // Aktywny strumień kropek AIR ma tempo wybranego pakietu; każda ikona portu i karty zachowuje własny okres.
 const signalPlan=PLAN_DATA[technology].find(p=>p.id===(selectedPlanId||hoveredPlanId)) || PLAN_DATA[technology][0];
 if(technology==='AIR' && signalPlan){
  const ms=radioPeriod(signalPlan.down);
  centralRoot.querySelector('.central-unit')?.style.setProperty('--wifi-period',ms+'ms');
  zone.style.setProperty('--wifi-period',ms+'ms');
  zone.dataset.radioPeriodMs=String(ms);
 }else{zone.style.removeProperty('--wifi-period');delete zone.dataset.radioPeriodMs;}
 document.getElementById('device-guide').innerHTML=hoveredPlanId?`<b>${escapeText(hoveredPlanId)}</b> — wskazany port i odpowiadająca mu karta`:selectedPlanId?`<b>${escapeText(selectedPlanId)}</b> — aktywne połączenie`:'Wskaż port kursorem lub przytrzymaj palcem, aby zobaczyć powiązanie ↓';
 scheduleLinks();
}
function setHover(id){
 if(id===hoveredPlanId)return;
 hoveredPlanId=id;
 syncStates();
}
// V10 — dwa niezależne gesty: krótkie tapnięcie = wybór; przytrzymanie = TYMCZASOWY podgląd.
// Ruch palca > 10 px lub przewijanie anuluje podgląd i nie wybiera pakietu.
const HOLD_MS=420;
const MOVE_TOLERANCE=10;
let touchSession=null;
let suppressNativeClickUntil=0;
let lastTouchInteraction=-Infinity;
function touchTarget(event){
 const port=event.target.closest('.speed-port[data-port-plan-id]');
 if(port)return port.dataset.portPlanId;
 const plan=event.target.closest('.plan[data-plan-id]');
 return plan?.dataset.planId||null;
}
function cancelTouch(clearPreview=true){
 if(touchSession){clearTimeout(touchSession.timer);touchSession=null;}
 if(clearPreview)setHover(null);
}
function wireInteractiveHover(){
 centralRoot.querySelectorAll('.speed-port').forEach(el=>{
  el.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')setHover(el.dataset.portPlanId);});
  el.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')setHover(null);});
  el.addEventListener('focus',()=>{if(performance.now()-lastTouchInteraction>900)setHover(el.dataset.portPlanId);});
  el.addEventListener('blur',()=>setHover(null));
 });
 plansRoot.querySelectorAll('.plan').forEach(el=>{
  el.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')setHover(el.dataset.planId);});
  el.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')setHover(null);});
  el.addEventListener('focusin',()=>{if(performance.now()-lastTouchInteraction>900)setHover(el.dataset.planId);});
  el.addEventListener('focusout',e=>{if(!el.contains(e.relatedTarget))setHover(null);});
 });
}
zone.addEventListener('pointerdown',e=>{
 if(e.pointerType!=='touch')return;
 lastTouchInteraction=performance.now();
 cancelTouch();
 const id=touchTarget(e);if(!id)return;
 const data={id,pointerId:e.pointerId,x:e.clientX,y:e.clientY,start:performance.now(),held:false,moved:false,timer:null};
 data.timer=setTimeout(()=>{
  if(touchSession===data&&!data.moved){data.held=true;setHover(id);}
 },HOLD_MS);
 touchSession=data;
},{passive:true});
window.addEventListener('pointermove',e=>{
 const t=touchSession;if(!t||t.pointerId!==e.pointerId)return;
 if(Math.hypot(e.clientX-t.x,e.clientY-t.y)>MOVE_TOLERANCE){
  t.moved=true;clearTimeout(t.timer);setHover(null);
 }
},{passive:true});
window.addEventListener('pointerup',e=>{
 const t=touchSession;
 if(!t||t.pointerId!==e.pointerId)return;
 lastTouchInteraction=performance.now();
 if(t.held||t.moved)suppressNativeClickUntil=performance.now()+550;
 cancelTouch();
},{passive:true});
window.addEventListener('pointercancel',e=>{
 if(touchSession?.pointerId===e.pointerId){suppressNativeClickUntil=performance.now()+550;lastTouchInteraction=performance.now();cancelTouch();}
},{passive:true});
// Scroll / gest dotykowy nigdy nie może skończyć się przypięciem przewodu.
window.addEventListener('scroll',()=>{
 if(touchSession){touchSession.moved=true;clearTimeout(touchSession.timer);setHover(null);}
},{passive:true});
zone.addEventListener('click',e=>{
 if(e.detail!==0&&performance.now()<suppressNativeClickUntil){
  e.preventDefault();e.stopImmediatePropagation();
 }
},true);
zone.addEventListener('contextmenu',e=>{
 if(touchSession?.held||performance.now()-lastTouchInteraction<750){e.preventDefault();}
});
const waitFor=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
async function scrollToSelectedCard(card,sequence){
 if(!card||sequence!==activationSequence)return;
 const navHeight=document.querySelector('.nav')?.getBoundingClientRect().height||75;
 const rect=card.getBoundingClientRect();
 const topBoundary=navHeight+12;
 const bottomBoundary=window.innerHeight-12;
 const visibleHeight=Math.max(1,bottomBoundary-topBoundary);
 // Kafelek w środku DOSTĘPNEGO obszaru, nie tuż pod sticky navbar.
 const desiredCenter=topBoundary+visibleHeight/2;
 const desiredTop=rect.height>visibleHeight?topBoundary:desiredCenter-rect.height/2;
 const maxScroll=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
 const destination=Math.min(maxScroll,Math.max(0,Math.round(window.scrollY+rect.top-desiredTop)));
 if(Math.abs(destination-window.scrollY)<4)return;
 const smooth=animationEnabled();
 window.scrollTo({top:destination,behavior:smooth?'smooth':'instant'});
 if(!smooth)return;
 const started=performance.now();
 await new Promise(resolve=>{
  function check(){
   if(sequence!==activationSequence||Math.abs(window.scrollY-destination)<4||performance.now()-started>1800)return resolve();
   requestAnimationFrame(check);
  }
  requestAnimationFrame(check);
 });
}
async function selectPlan(id,animate=true,source='card'){
 if(!PLAN_DATA[technology].some(p=>p.id===id))return;
 clearTimeout(pathTimer);
 const seq=++activationSequence;
 const fromPort=source==='port'&&animate&&animationEnabled()&&technology!=='AIR';
 linkPending=fromPort;
 selectedPlanId=id;
 centralRoot.querySelectorAll('.speed-port').forEach(el=>el.classList.remove('is-connecting'));
 plansRoot.querySelectorAll('.plan').forEach(el=>el.classList.remove('is-connecting','is-awaiting-cable'));
 const device=[...centralRoot.querySelectorAll('.speed-port')].find(el=>el.dataset.portPlanId===id);
 const card=[...plansRoot.querySelectorAll('.plan')].find(el=>el.dataset.planId===id);
 if(fromPort)card.classList.add('is-awaiting-cable');
 syncStates();
 if(animate&&animationEnabled()){
  void device.offsetWidth;
  device.classList.add('is-connecting');
  if(!fromPort)card.classList.add('is-connecting');
 }
 if(fromPort){
  document.getElementById('connection-state').textContent=id+': podłączanie wtyku do urządzenia…';
  // Odczekaj na zdjęcie zaślepki i wpięcie w urządzeniu, NIE aktywując jeszcze portu kafelka.
  await waitFor(technology==='FIBER'?1050:650);
  if(seq!==activationSequence)return;
  document.getElementById('connection-state').textContent=id+': przejście do wybranego pakietu…';
  await scrollToSelectedCard(card,seq);
  if(seq!==activationSequence)return;
  // Dopiero teraz użytkownik widzi drugie złącze, które zostanie podłączone do karty.
  card.classList.remove('is-awaiting-cable');
  void card.offsetWidth;
  card.classList.add('is-connecting');
  linkPending=false;
  syncStates();
  animateLink(technology==='FIBER'?560:80);
 }else{
  linkPending=false;
  animateLink(technology==='FIBER'&&animate&&animationEnabled()?680:technology==='LAN'?110:0);
 }
 if(seq!==activationSequence)return;
 const description=technology==='FIBER'?'SC/UPC Simplex':technology==='AIR'?'kanał radiowy '+radioPeriod(PLAN_DATA.AIR.find(p=>p.id===id).down)+' ms/cykl':'RJ-45';
 document.getElementById('connection-state').textContent=`${id}: ${description}. Port i kafelek są połączone.`;
}
centralRoot.addEventListener('click',event=>{
 const btn=event.target.closest('.speed-port[data-port-plan-id]');
 if(btn)selectPlan(btn.dataset.portPlanId,true,'port');
});
plansRoot.addEventListener('click',event=>{
 const btn=event.target.closest('.plan-hit[data-select-plan]');
 if(btn)selectPlan(btn.dataset.selectPlan,true,'card');
});
function render(){
 linkPending=false;
 cancelTouch();
 hoveredPlanId=null;
 clearTimeout(pathTimer);
 ++activationSequence;
 document.body.classList.remove('tech-LAN','tech-FIBER','tech-AIR');
 document.body.classList.add('tech-'+technology);
 activePath.classList.toggle('is-radio',technology==='AIR');
 const twelve=buttonsTerm.find(el=>el.dataset.term==='12');
 twelve.disabled=technology==='FIBER';
 twelve.title=twelve.disabled?'Nie opublikowano ceny 12-miesięcznej dla FIBER':'';
 if(twelve.disabled&&term==='12')term='24';
 for(const b of buttonsTech)b.setAttribute('aria-pressed',String(b.dataset.technology===technology));
 for(const b of buttonsTerm)b.setAttribute('aria-pressed',String(b.dataset.term===term));
 const plans=PLAN_DATA[technology];
 document.getElementById('selected-title').textContent=TITLES[technology];
 document.getElementById('selected-count').textContent=plans.length+(plans.length===3?' dostępne pakiety':' dostępnych pakietów');
 document.getElementById('central-count').textContent=plans.length+' WARIANTÓW';
 centralRoot.innerHTML=makeCentralDevice(plans);
 plansRoot.className='cards'+(plans.length===3?' cards-3':'');
 plansRoot.innerHTML=plans.map(makePlan).join('');
 document.getElementById('disclaimer').innerHTML=term==='none'?
  '<strong>Umowa bezterminowa:</strong> wycena indywidualna po kontakcie z MAD-NET. Dostępność zależy od adresu.':
  (technology==='FIBER'?'<strong>Światłowód:</strong> brak opublikowanej ceny 12-miesięcznej; wybierz 24 miesiące albo zapytaj telefonicznie. ':'<strong>Warto wiedzieć:</strong> ')+
  'Dostępność technologii i pakietu zależy od adresu. Urządzenie pokazuje warianty, a nie fizyczną specyfikację sprzętu. Pozostałe opłaty wymieniono poniżej.';
 document.body.classList.toggle('mot-off',!animations);
 wireInteractiveHover();
 renderComparisonTable();
 syncStates();
 scheduleLinks();
}
buttonsTech.forEach(b=>b.addEventListener('click',()=>{
 if(technology!==b.dataset.technology){
  technology=b.dataset.technology;selectedPlanId=null;hoveredPlanId=null;
  document.getElementById('connection-state').textContent='Przytrzymaj, aby podejrzeć połączenie; dotknij krótko, aby podłączyć.';
 }render();
}));
buttonsTerm.forEach(b=>b.addEventListener('click',()=>{if(!b.disabled){term=b.dataset.term;render();}}));
document.getElementById('animation-toggle').addEventListener('click',ev=>{
 animations=!animations;
 const przelacznik=ev.currentTarget;
 przelacznik.setAttribute('aria-checked',String(animations));
 document.body.classList.toggle('mot-off',!animations);
 if(!animations){
  centralRoot.querySelectorAll('.is-connecting').forEach(n=>n.classList.remove('is-connecting'));
  plansRoot.querySelectorAll('.is-connecting').forEach(n=>n.classList.remove('is-connecting'));
  activePath.classList.remove('is-drawing');activePath.style.transition='none';activePath.style.strokeDasharray='';activePath.style.strokeDashoffset='';
 }
 scheduleLinks();
});
window.addEventListener('resize',scheduleLinks,{passive:true});
window.addEventListener('scroll',scheduleLinks,{passive:true});
if(typeof ResizeObserver!=='undefined')new ResizeObserver(scheduleLinks).observe(zone);

const kolejnoscTabel=['FIBER','LAN','AIR'];
const widoczneTechnologieTabel=new Set(['FIBER']);
const listaTabel=document.getElementById('comparison-panel');
const przelacznikiTabel=[...document.querySelectorAll('[data-table-technology]')];
const licznikTabel=document.getElementById('compare-chip');
const opisyTabel={
 FIBER:{name:'Światłowód',medium:'Złącze SC/UPC simplex',symbol:'✦'},
 LAN:{name:'Kablowy',medium:'Ethernet RJ-45',symbol:'▣'},
 AIR:{name:'Bezprzewodowy',medium:'Sieć radiowa',symbol:'◉'}
};
function komorkaCeny(wartosc,pogrubiona=false){return wartosc==null?'<span class="muted">Brak ceny w cenniku</span>':pogrubiona?`<strong>${wartosc} zł</strong>`:`${wartosc} zł`;}
// Miniatury odpowiadają technologii i prędkości pakietu: RJ-45, SC/UPC lub fale radiowe.
// Są dekoracyjne: tylko span, bez przycisk, tabindex i eventów, nie podłączają kabla.
function utworzMiniport(technologia,pakiet){
 const okres=Math.round(1000/(blinkHz(pakiet.down)*1.5));
 const kontrolki=technologia==='AIR'?'':'<span class="port-leds"><i></i><i></i></span>';
 return `<span class="compare-head-port compare-head-port--${technologia}" aria-hidden="true" data-port-speed="${pakiet.down}" data-blink-ms="${okres}" style="--pulse-ms:${okres}ms;--wifi-period:${radioPeriod(pakiet.down)}ms">${kontrolki}${socketHtml(technologia,true)}</span>`;
}
function utworzTabele(technologia){
 const pakiety=PLAN_DATA[technologia],opis=opisyTabel[technologia];
 // Nazwy pakietów pochodzą z PLAN_DATA; wszystkie wiersze są identyczne dla każdej technologii.
 const naglowek='<tr><th class="stub-top" scope="col">Parametr / pakiet</th>'+pakiety.map(pakiet=>`<th class="plan-head" scope="col" aria-label="Pakiet ${escapeText(pakiet.id)}, pobieranie ${pakiet.down} megabitów na sekundę"><span class="compare-package-inner">${utworzMiniport(technologia,pakiet)}<span class="compare-package-name">${escapeText(pakiet.id.replace(/M$/,''))}</span></span></th>`).join('')+'</tr>';
 const wiersze=[
  ['Prędkość pobierania',pakiety.map(pakiet=>`${pakiet.down} Mbit/s`)],
  ['Prędkość wysyłania',pakiety.map(pakiet=>`${pakiet.up} Mbit/s`)],
  ...(technologia==='FIBER'?[]:[['Abonament — 1 rok',pakiety.map(pakiet=>komorkaCeny(pakiet.monthly12))]]),
  ['Abonament — 2 lata',pakiety.map(pakiet=>komorkaCeny(pakiet.monthly24,true))],
  ['Abonament — bezterminowo',pakiety.map(_=>'<span class="muted">Wycena indywidualna</span>')]
 ];
 const zawartosc=wiersze.map(([etykieta,komorki])=>'<tr><th class="stub" scope="row">'+etykieta+'</th>'+komorki.map(komorka=>`<td>${komorka}</td>`).join('')+'</tr>').join('');
 return `<section class="compare-tech-panel" id="comparison-${technologia}" data-tech="${technologia}" aria-labelledby="compare-tech-title-${technologia}"><header class="compare-tech-header"><div><span class="compare-tech-kicker">${opis.symbol} ${technologia} / ${opis.medium}</span><h4 id="compare-tech-title-${technologia}">${opis.name} <small>· ${pakiety.length} ${pakiety.length===3?'pakiety':'pakietów'}</small></h4></div><span class="compare-tech-count">${pakiety.length} wariantów</span></header><div class="compare-scroll" role="region" tabindex="0" aria-label="Przewijalna tabela cen ${opis.name}"><table class="compare-table"><caption class="sr-only">MAD-NET: cennik technologii ${opis.name}; ceny za miesiąc w złotych</caption><thead>${naglowek}</thead><tbody>${zawartosc}</tbody></table></div></section>`;
}
function renderComparisonTable(){
 przelacznikiTabel.forEach(przycisk=>przycisk.setAttribute('aria-pressed',String(widoczneTechnologieTabel.has(przycisk.dataset.tableTechnology))));
 const wybrane=kolejnoscTabel.filter(technologia=>widoczneTechnologieTabel.has(technologia));
 licznikTabel.textContent=wybrane.length+' z 3 '+(wybrane.length===1?'technologii':'technologii');
 listaTabel.innerHTML=wybrane.length?
  wybrane.map(utworzTabele).join(''):
  '<div class="compare-empty" role="status"><span aria-hidden="true">▤</span><strong>Nie wybrano żadnego cennika</strong><p>Zaznacz powyżej jedną lub kilka technologii albo wybierz „Pokaż wszystkie”.</p></div>';
 document.getElementById('compare-show-all').disabled=wybrane.length===kolejnoscTabel.length;
 document.getElementById('compare-clear').disabled=wybrane.length===0;
}
przelacznikiTabel.forEach(przycisk=>{
 przycisk.addEventListener('click',()=>{
  const technologia=przycisk.dataset.tableTechnology;
  if(widoczneTechnologieTabel.has(technologia))widoczneTechnologieTabel.delete(technologia);else widoczneTechnologieTabel.add(technologia);
  renderComparisonTable();
 });
});
document.getElementById('compare-show-all').addEventListener('click',()=>{
 kolejnoscTabel.forEach(technologia=>widoczneTechnologieTabel.add(technologia));
 renderComparisonTable();
});
document.getElementById('compare-clear').addEventListener('click',()=>{
 widoczneTechnologieTabel.clear();renderComparisonTable();
});
const feesBody=document.getElementById('fees-body');
feesBody.innerHTML=FEES.map(row=>'<tr>'+row.map(t=>`<td>${escapeText(t)}</td>`).join('')+'</tr>').join('');
render();
