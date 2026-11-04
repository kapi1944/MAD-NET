import {wybierzPort,poczekajNaSerwer,uruchomPrzegladarke} from './srodowisko.mjs';
/* Regresja sprzętu SC/APC: rzeczywisty ruch, punkty styku i gesty Chromium. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright-core';

const katalog='test-results/fiber/po';
await mkdir(katalog,{recursive:true});
const publiczny=process.env.MADNET_ADRES;
const port=publiczny?null:await wybierzPort('MADNET_PORT_TESTOW_FIBER');
const adres=publiczny?new URL('cennik.html',publiczny).href:`http://127.0.0.1:${port}/cennik.html`;
const serwer=publiczny?null:spawn(process.execPath,['scripts/serve.mjs','--root','dist','--no-live'],{env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});
const bledy=[],pomiary=[],przebiegi=[];
let przegladarka;
const portFiber=id=>`[data-port-plan-id="FIBER-${id}M"]`;
const kartaFiber=id=>`[data-select-plan="FIBER-${id}M"]`;
async function stan(strona,oczekiwany){
 await strona.waitForFunction(oczekiwany=>document.querySelector('#connection-zone').dataset.fiberState===oczekiwany,oczekiwany,{timeout:10000});
}
async function uspokojPrzewijanie(strona){
 await strona.evaluate(()=>new Promise(zakoncz=>{
  let poprzednie=scrollY,stabilne=0;
  function sprawdz(){
   stabilne=Math.abs(scrollY-poprzednie)<.5?stabilne+1:0;poprzednie=scrollY;
   if(stabilne>=10)zakoncz();else requestAnimationFrame(sprawdz);
  }
  sprawdz();
 }));
}
function sledz(strona){
 strona.on('pageerror',blad=>bledy.push(blad.message));
 strona.on('console',wpis=>{if(wpis.type()==='error'&&!wpis.location().url.startsWith('https://'))bledy.push(wpis.text());});
}
async function rozpocznijPomiar(strona){
 await strona.evaluate(()=>{
  window.probkiFiber=[];window.stanyFiber=[];window.przewodyFiber=[];window.mierzFiber=true;
  window.obserwatorTestowyFiber=new MutationObserver(wpisy=>{
   wpisy.forEach(wpis=>window.stanyFiber.push(wpis.oldValue));
   window.stanyFiber.push(document.querySelector('#connection-zone').dataset.fiberState);
  });
  window.obserwatorTestowyFiber.observe(document.querySelector('#connection-zone'),{attributes:true,attributeFilter:['data-fiber-state'],attributeOldValue:true});
  function zmierz(){
   if(!window.mierzFiber)return;
   const przewod=document.querySelector('#link-active');
   if(przewod.getAttribute('d')&&polaczenieFiber){
    const macierz=przewod.getScreenCTM(),dlugosc=przewod.getTotalLength();
    const poczatek=przewod.getPointAtLength(0),dalej=przewod.getPointAtLength(10);
    const koniec=przewod.getPointAtLength(dlugosc),przed=przewod.getPointAtLength(dlugosc-10);
    const zrodlo=polaczenieFiber.urzadzenie.querySelector('.sc-kabel-punkt').getBoundingClientRect();
    const cel=polaczenieFiber.cel.querySelector('.sc-kabel-punkt').getBoundingClientRect();
    const ekranPoczatku=poczatek.matrixTransform(macierz),ekranKonca=koniec.matrixTransform(macierz);
    const przeszkody=[...document.querySelectorAll('#plans .plan-body,#plans .plan-bottom,#plans .card-terminal-label'),
     ...[...document.querySelectorAll('#plans .plan')].filter(karta=>karta.dataset.planId!==polaczenieFiber.id)].map(element=>element.getBoundingClientRect());
    const zakres=document.createRange();
    for(const element of document.querySelectorAll('#device-guide,.device-hint,.device-foot span')){
     zakres.selectNodeContents(element);przeszkody.push(...zakres.getClientRects());
    }
    let kolizje=0;
    for(let odleglosc=0;odleglosc<=dlugosc;odleglosc+=3){
     const punkt=przewod.getPointAtLength(odleglosc).matrixTransform(macierz);
     if(przeszkody.some(prostokat=>punkt.x>prostokat.left+1&&punkt.x<prostokat.right-1&&punkt.y>prostokat.top+1&&punkt.y<prostokat.bottom-1))kolizje++;
    }
    window.przewodyFiber.push({stan:polaczenieFiber.stan,
     kolizje,
     pionowyPoczatek:Math.abs(dalej.x-poczatek.x)<.1&&dalej.y-poczatek.y>9.9,
     pionowyKoniec:Math.abs(przed.x-koniec.x)<.1&&przed.y-koniec.y>9.9,
     bladPoczatku:Math.hypot(ekranPoczatku.x-zrodlo.x,ekranPoczatku.y-zrodlo.y),
     bladKonca:Math.hypot(ekranKonca.x-cel.x,ekranKonca.y-cel.y)});
   }
   for(const gniazdo of polaczenieFiber?.elementy??[]){
    const oslona=gniazdo.querySelector('.sc-zaslepka'),wtyk=gniazdo.querySelector('.sc-konektor');
    const obrys=wtyk.getBoundingClientRect(),ramka=gniazdo.closest('.mini-interface,.speed-port').getBoundingClientRect();
    window.probkiFiber.push({stan:polaczenieFiber.stan,oslona:Number(getComputedStyle(oslona).opacity),
     wtyk:Number(getComputedStyle(wtyk).opacity),miesciSie:obrys.bottom<=ramka.bottom});
   }
   // Pomiar po klatce kontrolera obejmuje bieżącą pozycję animowanego wtyku.
   requestAnimationFrame(()=>setTimeout(zmierz,0));
  }
  zmierz();
 });
}
async function zakonczPomiar(strona){
 return strona.evaluate(()=>{
  window.mierzFiber=false;window.obserwatorTestowyFiber.disconnect();
  return {stany:window.stanyFiber.filter((stan,numer,lista)=>stan&&stan!==lista[numer-1]),probki:window.probkiFiber,przewody:window.przewodyFiber};
 });
}
function sprawdzPrzebiegPrzewodu(przebieg){
 assert.ok(przebieg.przewody.length>10,'Pomiar przewodu podczas animacji');
 assert.ok(przebieg.przewody.every(probka=>probka.pionowyPoczatek&&probka.pionowyKoniec&&probka.bladPoczatku<1&&probka.bladKonca<1),'Kierunek i kotwice podczas animacji: '+JSON.stringify(przebieg.przewody.filter(probka=>!probka.pionowyPoczatek||!probka.pionowyKoniec||probka.bladPoczatku>=1||probka.bladKonca>=1)));
 assert.ok(przebieg.przewody.every(probka=>probka.kolizje===0),'Kolizje podczas animacji: '+JSON.stringify(przebieg.przewody.filter(probka=>probka.kolizje)));
}
async function sprawdzGeometrie(strona,id){
 await strona.waitForFunction(()=>document.querySelector('#link-active').getAttribute('d')&&Number(getComputedStyle(document.querySelector('#link-active')).opacity)>.8,null,{timeout:5000});
 await strona.evaluate(()=>new Promise(zakoncz=>requestAnimationFrame(()=>requestAnimationFrame(zakoncz))));
 const pomiar=await strona.evaluate(id=>{
  const strefa=document.querySelector('#connection-zone').getBoundingClientRect();
  const przewod=document.querySelector('#link-active');
  const dlugosc=przewod.getTotalLength();
  const cel=document.querySelector(`[data-plan-id="${id}"]`);
  const punkt=cel.querySelector('.sc-kabel-punkt').getBoundingClientRect();
  const koniec=przewod.getPointAtLength(dlugosc),poczatek=przewod.getPointAtLength(0);
  const dalej=przewod.getPointAtLength(10),przedKoncem=przewod.getPointAtLength(dlugosc-10);
  const punktZrodla=document.querySelector(`[data-port-plan-id="${id}"] .sc-kabel-punkt`).getBoundingClientRect();
  const karty=[...document.querySelectorAll('#plans .plan')].filter(karta=>karta.dataset.planId!==id);
  const przeszkody=[...karty,...document.querySelectorAll('#plans .plan-body,#plans .plan-bottom,#plans .card-terminal-label')]
   .map(element=>({nazwa:element.className,prostokat:element.getBoundingClientRect()}));
  const zakres=document.createRange();
  for(const element of document.querySelectorAll('#device-guide,.device-hint,.device-foot span')){
   zakres.selectNodeContents(element);
   for(const prostokat of zakres.getClientRects())przeszkody.push({nazwa:element.textContent,prostokat});
  }
  const kolizje=new Set();
  for(let odleglosc=0;odleglosc<=dlugosc;odleglosc+=2){
   const punkt=przewod.getPointAtLength(odleglosc),x=punkt.x+strefa.left,y=punkt.y+strefa.top;
   for(const {nazwa,prostokat} of przeszkody){
    if(x>prostokat.left+1&&x<prostokat.right-1&&y>prostokat.top+1&&y<prostokat.bottom-1)kolizje.add(nazwa);
   }
  }
  const adapter=cel.querySelector('.sc-simplex').getBoundingClientRect(),wtyk=cel.querySelector('.sc-konektor').getBoundingClientRect(),tor=cel.querySelector('.sc-wtyk-tor').getBoundingClientRect();
  // Przód ferruli zajmuje pierwsze 13/112 wysokości modelu; po wsunięciu jest schowany za wargą adaptera.
  return {szerokosc:innerWidth,id,dlugosc,kolizje:[...kolizje],
   pionowyPoczatek:Math.abs(dalej.x-poczatek.x)<.1&&dalej.y-poczatek.y>9.9,
   pionowyKoniec:Math.abs(przedKoncem.x-koniec.x)<.1&&przedKoncem.y-koniec.y>9.9,
   bladKonca:Math.hypot(koniec.x+strefa.left-punkt.x,koniec.y+strefa.top-punkt.y),
   bladPoczatku:Math.hypot(poczatek.x+strefa.left-punktZrodla.x,poczatek.y+strefa.top-punktZrodla.y),
   bladOsi:Math.abs(wtyk.left+wtyk.width/2-adapter.left-adapter.width/2),
   ferrulaSchowana:wtyk.top+wtyk.height*13/112<=tor.top+1,
   wtykNaZewnatrz:wtyk.bottom>adapter.bottom&&wtyk.width<adapter.width,
   widocznyPrzewod:getComputedStyle(przewod).opacity,
   przepelnienie:document.documentElement.scrollWidth-innerWidth};
 },`FIBER-${id}M`);
 assert.ok(pomiar.dlugosc>50,JSON.stringify(pomiar));
 assert.ok(pomiar.pionowyPoczatek&&pomiar.pionowyKoniec,'Przewód musi wychodzić dołem z obu wtyków: '+JSON.stringify(pomiar));
 assert.ok(pomiar.bladKonca<1&&pomiar.bladPoczatku<1&&pomiar.bladOsi<1,JSON.stringify(pomiar));
 assert.ok(pomiar.ferrulaSchowana&&pomiar.wtykNaZewnatrz,JSON.stringify(pomiar));
 assert.deepEqual(pomiar.kolizje,[],JSON.stringify(pomiar));
 assert.equal(pomiar.przepelnienie,0);
 assert.ok(Number(pomiar.widocznyPrzewod)>.8);
 pomiary.push(pomiar);
}
try{
 if(serwer)await poczekajNaSerwer(serwer);
 przegladarka=await uruchomPrzegladarke(chromium);
 const strona=await przegladarka.newPage({viewport:{width:1440,height:1100}});sledz(strona);
 for(const szerokosc of [320,360,390,430,768,1024,1280,1366,1440,1920]){
  await strona.setViewportSize({width:szerokosc,height:1100});await strona.goto(adres);
  if(szerokosc<=430){
   const instrukcja=await strona.evaluate(()=>{
    const element=document.querySelector('#device-guide'),czcionka=element.style.fontFamily;
    element.style.fontFamily='monospace';setHover(null);const przed=element.getBoundingClientRect().height;
    setHover('FIBER-50M');const po=element.getBoundingClientRect().height;
    setHover(null);element.style.fontFamily=czcionka;return {przed,po};
   });
   assert.equal(instrukcja.po,instrukcja.przed,'Podgląd nie zmienia wysokości instrukcji także przy czcionce zastępczej');
  }
  assert.equal(await strona.locator('.sc-simplex').count(),6);
  assert.equal(await strona.locator('.adapter-szafy-fiber').count(),3);
  await rozpocznijPomiar(strona);
  await strona.locator(portFiber(50)).click();
  await stan(strona,'CONNECTED');
  await sprawdzGeometrie(strona,50);
  assert.equal(await strona.locator('[data-plan-id="FIBER-50M"] .plan-hit').getAttribute('aria-pressed'),'true');
  assert.equal(await strona.locator('[data-port-plan-id="FIBER-50M"]').getAttribute('aria-pressed'),'true');
  assert.match(await strona.locator('#availability-choice-summary').textContent(),/FIBER-50/);
  await strona.locator(kartaFiber(50)).click();await stan(strona,'IDLE');
  const przebieg=await zakonczPomiar(strona);przebiegi.push({szerokosc,...przebieg});
  sprawdzPrzebiegPrzewodu(przebieg);
  const etapy=['OPENING_COVER','COVER_OPEN','CONNECTOR_APPROACH','INSERTING','ROUTING_CABLE','CONNECTED','DISCONNECTING','COVER_OPEN','CLOSING_COVER'];
  assert.deepEqual(przebieg.stany.filter(etap=>etapy.includes(etap)),etapy);
  const wsuwanie=przebieg.probki.filter(probka=>['CONNECTOR_APPROACH','INSERTING','ROUTING_CABLE','CONNECTED','DISCONNECTING'].includes(probka.stan));
  assert.ok(wsuwanie.length>5);
  assert.ok(wsuwanie.every(probka=>probka.oslona<.01&&probka.miesciSie),'Wtyk wymaga odsłoniętego adaptera i miejsca na ruch');
  assert.ok(przebieg.probki.filter(probka=>probka.stan==='CLOSING_COVER').every(probka=>probka.wtyk<.01),'Zaślepka zamyka się po wycofaniu wtyku');
  await strona.waitForFunction(()=>[...document.querySelectorAll('.sc-zaslepka')].every(oslona=>getComputedStyle(oslona).opacity==='1'));
  await strona.waitForFunction(()=>!document.querySelector('#link-active').getAttribute('d'));
  await rozpocznijPomiar(strona);
  await strona.locator('[data-select-plan="FIBER-100M"]').click();await stan(strona,'CONNECTED');
  await sprawdzGeometrie(strona,100);
  const przebiegKarty=await zakonczPomiar(strona);przebiegi.push({szerokosc,zrodlo:'card',...przebiegKarty});sprawdzPrzebiegPrzewodu(przebiegKarty);
  await strona.locator('.device-tech-tabs [data-technology="LAN"]').click();await stan(strona,'IDLE');
  await strona.waitForFunction(()=>!document.querySelector('#link-active').getAttribute('d'));
  assert.equal(await strona.locator('#central-device .jack-rj').count(),5);
  await strona.locator('.device-tech-tabs [data-technology="FIBER"]').click();
  await strona.emulateMedia({reducedMotion:'reduce'});
  // Szeroka czcionka zastępcza przy 430 px zajmuje część domyślnego korytarza w karcie.
  if(szerokosc===430)await strona.addStyleTag({content:`
   .card-terminal-label{letter-spacing:.12em}
   #device-guide,#device-guide b{width:100%}
   #device-guide b{display:inline-block}
  `});
  for(const id of [50,100,300]){
   await strona.locator(`[data-select-plan="FIBER-${id}M"]`).click();await stan(strona,'CONNECTED');
   await sprawdzGeometrie(strona,id);
   await strona.locator(`[data-select-plan="FIBER-${id}M"]`).click();await stan(strona,'IDLE');
  }
  await strona.emulateMedia({reducedMotion:'no-preference'});
  console.log(`PASS SC/APC ${szerokosc}px: urządzenie, karty, sekwencja i geometria`);
 }
 // Najnowsze żądanie wygrywa również podczas otwierania osłon.
 await strona.setViewportSize({width:1440,height:1100});await strona.goto(adres);
 await strona.evaluate(()=>{
  const przyciski=[...document.querySelectorAll('[data-select-plan]')];
  [0,1,2,1,0,2].forEach(numer=>przyciski[numer].click());
 });
 await stan(strona,'ROUTING_CABLE');
 assert.equal(await strona.locator('#link-active').getAttribute('pathLength'),'1');
 await strona.setViewportSize({width:390,height:844});
 await stan(strona,'CONNECTED');
 assert.equal(await strona.locator('#link-active').getAttribute('pathLength'),null);
 assert.equal(await strona.locator('.plan.is-selected').getAttribute('data-plan-id'),'FIBER-300M');
 assert.equal(await strona.locator('.sc-simplex[data-stan-polaczenia="CONNECTED"]').count(),2);
 await sprawdzGeometrie(strona,300);
 console.log('PASS SC/APC szybkie przełączanie');
 await strona.setViewportSize({width:1440,height:1100});
 await strona.locator('[data-term="none"]').click();await stan(strona,'CONNECTED');await sprawdzGeometrie(strona,300);
 assert.equal(await strona.locator('[data-plan-id="FIBER-300M"] .price strong').textContent(),'Wycena indywidualna');
 await strona.locator('#compare-show-all').click();await sprawdzGeometrie(strona,300);
 await strona.locator('[data-table-technology="FIBER"]').click();await sprawdzGeometrie(strona,300);
 await strona.locator(kartaFiber(300)).click();await stan(strona,'IDLE');
 await strona.locator(portFiber(100)).focus();await strona.keyboard.press('Enter');await stan(strona,'CONNECTED');
 await sprawdzGeometrie(strona,100);
 await strona.locator(kartaFiber(100)).focus();await strona.keyboard.press('Space');await stan(strona,'IDLE');
 console.log('PASS SC/APC filtry tabel i klawiatura');
 await strona.locator(kartaFiber(50)).click();await strona.locator('.device-tech-tabs [data-technology="AIR"]').click();await stan(strona,'IDLE');
 assert.equal(await strona.locator('#central-device .sc-simplex,#central-device .jack-rj').count(),0);
 await strona.locator('.device-tech-tabs [data-technology="FIBER"]').click();
 await strona.locator(kartaFiber(100)).click();await strona.locator('#animation-toggle').click();await stan(strona,'CONNECTED');
 await sprawdzGeometrie(strona,100);
 await strona.locator(kartaFiber(100)).click();await stan(strona,'IDLE');
 await strona.locator('#animation-toggle').click();
 await strona.emulateMedia({reducedMotion:'reduce'});
 await rozpocznijPomiar(strona);await strona.locator(kartaFiber(50)).click();await stan(strona,'CONNECTED');
 const ograniczony=await zakonczPomiar(strona);assert.ok(ograniczony.stany.indexOf('OPENING_COVER')<ograniczony.stany.indexOf('INSERTING'));
 assert.equal(await strona.locator('.sc-zaslepka').first().evaluate(element=>getComputedStyle(element).transitionDuration),'0s');
 await sprawdzGeometrie(strona,50);await strona.locator(kartaFiber(50)).click();await stan(strona,'IDLE');
 console.log('PASS SC/APC anulowanie i ograniczony ruch');
 await strona.emulateMedia({reducedMotion:'no-preference'});

 // Materiały do kontroli wizualnej — zrzuty rzeczywistych stanów, bez aranżowania CSS.
 await strona.goto(adres);
 await strona.locator('.rack-box').screenshot({path:`${katalog}/01-panel-rack.png`});
 await strona.locator('[data-select-plan="FIBER-100M"]').click();await stan(strona,'CONNECTOR_APPROACH');
 await strona.locator('[data-plan-id="FIBER-100M"] .card-terminal').screenshot({path:`${katalog}/06-karta-wtyk-przed.png`});
 await stan(strona,'CONNECTED');
 await strona.locator('[data-plan-id="FIBER-100M"]').screenshot({path:`${katalog}/07-karta-polaczona.png`});
 await strona.locator('#cennik').screenshot({path:`${katalog}/08-fiber-desktop.png`,style:'.wspolny-naglowek{visibility:hidden!important}'});
 console.log('PASS SC/APC zrzuty stanów desktop');

 const dotyk=await przegladarka.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});sledz(dotyk);await dotyk.goto(adres);
 const sesja=await dotyk.context().newCDPSession(dotyk);
 await dotyk.evaluate(()=>document.fonts.ready);
 await dotyk.locator(kartaFiber(50)).scrollIntoViewIfNeeded();
 await uspokojPrzewijanie(dotyk);
 const prostokat=await dotyk.locator(kartaFiber(50)).boundingBox();
 const punkt={x:prostokat.x+prostokat.width/2,y:prostokat.y+prostokat.height/2};
 assert.equal(await dotyk.evaluate(punkt=>document.elementFromPoint(punkt.x,punkt.y)?.closest('[data-select-plan]')?.dataset.selectPlan,punkt),'FIBER-50M','Punkt dotyku musi trafiać w przycisk karty');
 await dotyk.evaluate(()=>{
  window.sladDotykuFiber=[];
  for(const nazwa of ['pointerdown','pointermove','pointerup','pointercancel','scroll','contextmenu','focusin','focusout'])document.addEventListener(nazwa,zdarzenie=>window.sladDotykuFiber.push({nazwa,czas:performance.now(),typ:zdarzenie.pointerType,cel:zdarzenie.target?.closest?.('[data-select-plan]')?.dataset.selectPlan,y:scrollY}),{capture:true,passive:true});
 });
 const przewinieciePrzedPrzytrzymaniem=await dotyk.evaluate(()=>scrollY);
 await sesja.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[punkt]});
 try{await dotyk.waitForFunction(()=>document.querySelectorAll('.plan.is-hovered').length===1,null,{timeout:3000});}
 catch(blad){
  const slad=await dotyk.evaluate(()=>({zdarzenia:window.sladDotykuFiber,sesja:touchSession,wybrany:selectedPlanId,podglad:hoveredPlanId,widocznosc:document.visibilityState,fokus:document.hasFocus(),scroll:scrollY}));
  console.error('Diagnostyka long press FIBER:',JSON.stringify(slad));
  await writeFile(katalog+'/dotyk-blad.json',JSON.stringify(slad,null,2));
  await dotyk.screenshot({path:katalog+'/dotyk-blad.png'});throw blad;
 }
 assert.equal(await dotyk.locator('.plan.is-hovered').count(),1);
 assert.equal(await dotyk.evaluate(()=>scrollY),przewinieciePrzedPrzytrzymaniem,'Podgląd nie uruchamia kotwiczenia przewijania');
 assert.equal(await dotyk.locator('#connection-zone').getAttribute('data-fiber-state'),'IDLE');
 assert.equal(await dotyk.locator('.sc-zaslepka').first().evaluate(element=>getComputedStyle(element).opacity),'1');
 await sesja.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await dotyk.waitForTimeout(600);
 assert.equal(await dotyk.locator('.plan.is-hovered').count(),0);assert.equal(await dotyk.locator('.plan.is-selected').count(),0);
 await sesja.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[punkt]});
 await sesja.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:punkt.x,y:punkt.y-85}]});
 await sesja.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await dotyk.waitForTimeout(600);
 assert.equal(await dotyk.locator('.plan.is-selected').count(),0);assert.equal(await dotyk.locator('.plan.is-hovered').count(),0);
 await dotyk.locator(kartaFiber(50)).scrollIntoViewIfNeeded();await uspokojPrzewijanie(dotyk);
 await dotyk.locator(kartaFiber(50)).tap();await stan(dotyk,'CONNECTED');await sprawdzGeometrie(dotyk,50);
 await dotyk.setViewportSize({width:844,height:390});await dotyk.waitForTimeout(150);await sprawdzGeometrie(dotyk,50);
 await dotyk.locator(kartaFiber(50)).tap();await stan(dotyk,'IDLE');
 await dotyk.locator(kartaFiber(100)).scrollIntoViewIfNeeded();await dotyk.locator(kartaFiber(100)).tap();await stan(dotyk,'CONNECTED');
 await sprawdzGeometrie(dotyk,100);
 assert.deepEqual(bledy,[],'Błędy JavaScript/konsoli');
 console.log('PASS szybkie przełączanie, anulowanie, klawiatura, zachowanie tabel, reduced motion, tap/long press/scroll, orientacja i brak błędów JS');
}finally{
 await writeFile(`${katalog}/wyniki.json`,JSON.stringify({pomiary,przebiegi,bledy},null,2));
 await przegladarka?.close();serwer?.kill();
}
