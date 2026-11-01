import {wybierzPort,poczekajNaSerwer,uruchomPrzegladarke} from './srodowisko.mjs';
/* Regresja sprzętu SC/APC: rzeczywisty ruch, punkty styku i gesty Chromium. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright-core';

const katalog='test-results/fiber/po';
await mkdir(katalog,{recursive:true});
const port=await wybierzPort('MADNET_PORT_TESTOW_FIBER');
const adres=`http://127.0.0.1:${port}/cennik.html`;
const serwer=spawn(process.execPath,['scripts/serve.mjs','--root','dist','--no-live'],{env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});
const bledy=[],pomiary=[],przebiegi=[];
let przegladarka;
const gniazdo=id=>`[data-gniazdo-pakiet="FIBER-${id}M"]`;
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
  window.probkiFiber=[];window.stanyFiber=[];window.mierzFiber=true;
  window.obserwatorTestowyFiber=new MutationObserver(wpisy=>{
   wpisy.forEach(wpis=>window.stanyFiber.push(wpis.oldValue));
   window.stanyFiber.push(document.querySelector('#connection-zone').dataset.fiberState);
  });
  window.obserwatorTestowyFiber.observe(document.querySelector('#connection-zone'),{attributes:true,attributeFilter:['data-fiber-state'],attributeOldValue:true});
  function zmierz(){
   if(!window.mierzFiber)return;
   const cel=polaczenieFiber?.zrodlo==='table'?polaczenieFiber.cel:null;
   if(cel){
    const pokrywa=cel.querySelector('.sc-pokrywa'),wtyk=cel.querySelector('.sc-konektor');
    const macierz=new DOMMatrixReadOnly(getComputedStyle(pokrywa).transform);
    const os=getComputedStyle(pokrywa).transformOrigin.split(' ').map(parseFloat);
    window.probkiFiber.push({stan:polaczenieFiber.stan,kat:Math.acos(Math.max(-1,Math.min(1,macierz.m22)))*180/Math.PI,wtyk:Number(getComputedStyle(wtyk).opacity),os,lewo:wtyk.getBoundingClientRect().left});
   }
   requestAnimationFrame(zmierz);
  }
  zmierz();
 });
}
async function zakonczPomiar(strona){
 return strona.evaluate(()=>{
  window.mierzFiber=false;window.obserwatorTestowyFiber.disconnect();
  return {stany:window.stanyFiber.filter((stan,numer,lista)=>stan&&stan!==lista[numer-1]),probki:window.probkiFiber};
 });
}
async function sprawdzGeometrie(strona,zrodlo,id){
 await strona.waitForFunction(()=>document.querySelector('#link-active').getAttribute('d')&&Number(getComputedStyle(document.querySelector('#link-active')).opacity)>.8,null,{timeout:5000});
 await strona.evaluate(()=>new Promise(zakoncz=>requestAnimationFrame(()=>requestAnimationFrame(zakoncz))));
 const pomiar=await strona.evaluate(({zrodlo,id})=>{
  const strefa=document.querySelector('#connection-zone').getBoundingClientRect();
  const przewod=document.querySelector('#link-active');
  const dlugosc=przewod.getTotalLength();
  const cel=document.querySelector(zrodlo==='table'?`[data-gniazdo-pakiet="${id}"]`:`[data-plan-id="${id}"]`);
  const punkt=cel.querySelector('.sc-kabel-punkt').getBoundingClientRect();
  const koniec=przewod.getPointAtLength(dlugosc),poczatek=przewod.getPointAtLength(0);
  const punktZrodla=document.querySelector(`[data-port-plan-id="${id}"] .sc-kabel-punkt`).getBoundingClientRect();
  const karty=[...document.querySelectorAll('#plans .plan')].filter(karta=>zrodlo==='table'||karta.dataset.planId!==id).map(karta=>karta.getBoundingClientRect());
  const teksty=[...document.querySelectorAll('#plans .plan-body,#plans .plan-bottom,#device-guide,.device-hint,.device-foot')].map(element=>element.getBoundingClientRect());
  let kolizje=0;
  for(let odleglosc=0;odleglosc<=dlugosc;odleglosc+=2){
   const punkt=przewod.getPointAtLength(odleglosc),x=punkt.x+strefa.left,y=punkt.y+strefa.top;
   if([...karty,...teksty].some(prostokat=>x>prostokat.left+1&&x<prostokat.right-1&&y>prostokat.top+1&&y<prostokat.bottom-1))kolizje++;
  }
  const adapter=cel.querySelector('.sc-simplex').getBoundingClientRect(),wtyk=cel.querySelector('.sc-konektor').getBoundingClientRect(),tor=cel.querySelector('.sc-wtyk-tor').getBoundingClientRect();
  // Przód ferruli zajmuje pierwsze 13/112 wysokości modelu; po wsunięciu jest schowany za wargą adaptera.
  return {szerokosc:innerWidth,zrodlo,id,dlugosc,kolizje,
   bladKonca:Math.hypot(koniec.x+strefa.left-punkt.x,koniec.y+strefa.top-punkt.y),
   bladPoczatku:Math.hypot(poczatek.x+strefa.left-punktZrodla.x,poczatek.y+strefa.top-punktZrodla.y),
   bladOsi:Math.abs(wtyk.left+wtyk.width/2-adapter.left-adapter.width/2),
   ferrulaSchowana:wtyk.top+wtyk.height*13/112<=tor.top+1,
   wtykNaZewnatrz:wtyk.bottom>adapter.bottom&&wtyk.width<adapter.width,
   widocznyPrzewod:getComputedStyle(przewod).opacity,
   przepelnienie:document.documentElement.scrollWidth-innerWidth};
 },{zrodlo,id:`FIBER-${id}M`});
 assert.ok(pomiar.dlugosc>50,JSON.stringify(pomiar));
 assert.ok(pomiar.bladKonca<1&&pomiar.bladPoczatku<1&&pomiar.bladOsi<1,JSON.stringify(pomiar));
 assert.ok(pomiar.ferrulaSchowana&&pomiar.wtykNaZewnatrz,JSON.stringify(pomiar));
 assert.equal(pomiar.kolizje,0,JSON.stringify(pomiar));
 assert.equal(pomiar.przepelnienie,0);
 assert.ok(Number(pomiar.widocznyPrzewod)>.8);
 pomiary.push(pomiar);
}
try{
 await poczekajNaSerwer(serwer);
 przegladarka=await uruchomPrzegladarke(chromium);
 const strona=await przegladarka.newPage({viewport:{width:1440,height:1100}});sledz(strona);
 for(const szerokosc of [320,360,390,430,768,1024,1280,1440,1920]){
  await strona.setViewportSize({width:szerokosc,height:1100});await strona.goto(adres);
  assert.equal(await strona.locator('.sc-simplex').count(),9);
  assert.equal(await strona.locator('.adapter-szafy-fiber').count(),3);
  assert.equal(await strona.locator('.sc-pokrywa').first().evaluate(element=>new DOMMatrixReadOnly(getComputedStyle(element).transform).m22),1);
  const wymiary=await strona.locator('#comparison-FIBER table').evaluate(element=>({tabela:element.getBoundingClientRect().width,kolumna:element.querySelector('.plan-head').getBoundingClientRect().width,cel:element.querySelector('button').getBoundingClientRect().width}));
  assert.ok(wymiary.tabela<=(szerokosc<760?700:szerokosc===768?860:szerokosc===1024?880:szerokosc===1280?1136:1226)+1);
  assert.ok(wymiary.cel>=44&&wymiary.cel<wymiary.kolumna/2);
  await rozpocznijPomiar(strona);
  await strona.locator(gniazdo(50)).click();
  await stan(strona,'CONNECTED');
  await sprawdzGeometrie(strona,'table',50);
  assert.equal(await strona.locator('[data-plan-id="FIBER-50M"] .plan-hit').getAttribute('aria-pressed'),'true');
  assert.equal(await strona.locator('[data-port-plan-id="FIBER-50M"]').getAttribute('aria-pressed'),'true');
  assert.match(await strona.locator('#availability-choice-summary').textContent(),/FIBER-50/);
  await strona.locator(gniazdo(50)).click();await stan(strona,'IDLE');
  const przebieg=await zakonczPomiar(strona);przebiegi.push({szerokosc,...przebieg});
  for(const etap of ['OPENING_COVER','COVER_OPEN','CONNECTOR_APPROACH','INSERTING','CONNECTED','DISCONNECTING','CLOSING_COVER'])assert.ok(przebieg.stany.includes(etap),przebieg.stany.join(','));
  const wsuwanie=przebieg.probki.filter(probka=>['CONNECTOR_APPROACH','INSERTING','CONNECTED','DISCONNECTING'].includes(probka.stan));
  assert.ok(wsuwanie.length>5);
  assert.ok(wsuwanie.every(probka=>probka.kat>=90&&probka.kat<=120&&probka.os[1]===0),'Wtyk wymaga otwartej klapki i górnej osi zawiasu');
  assert.ok(przebieg.probki.filter(probka=>probka.stan==='CLOSING_COVER').every(probka=>probka.wtyk<.01),'Klapka zamyka się dopiero po wycofaniu wtyku');
  const po=await strona.locator(gniazdo(50)).evaluate(element=>({kat:new DOMMatrixReadOnly(getComputedStyle(element.querySelector('.sc-pokrywa')).transform).m22,wtyk:getComputedStyle(element.querySelector('.sc-konektor')).opacity}));
  assert.equal(po.kat,1);assert.equal(po.wtyk,'0');
  await strona.waitForFunction(()=>!document.querySelector('#link-active').getAttribute('d'));
 assert.equal(await strona.locator('#link-active').getAttribute('d'),'');
  await strona.locator('[data-select-plan="FIBER-100M"]').click();await stan(strona,'CONNECTED');
  await sprawdzGeometrie(strona,'card',100);
  await strona.locator('.device-tech-tabs [data-technology="LAN"]').click();await stan(strona,'IDLE');
  assert.equal(await strona.locator('[data-gniazdo-pakiet][data-stan-polaczenia="IDLE"]').count(),3);
  assert.ok(await strona.locator('.sc-pokrywa').evaluateAll(elementy=>elementy.every(element=>new DOMMatrixReadOnly(getComputedStyle(element).transform).m22===1)));
  await strona.waitForFunction(()=>!document.querySelector('#link-active').getAttribute('d'));
 assert.equal(await strona.locator('#link-active').getAttribute('d'),'');
  assert.equal(await strona.locator('#central-device .jack-rj').count(),5);
  console.log(`PASS SC/APC ${szerokosc}px: sekwencja, geometria, 2 trasy, ceny bez zmian`);
 }
 // Najnowsze żądanie wygrywa również podczas otwierania osłon.
 await strona.setViewportSize({width:1440,height:1100});await strona.goto(adres);
 await strona.evaluate(()=>{
  const przyciski=[...document.querySelectorAll('[data-gniazdo-pakiet]')];
  [0,1,2,1,0,2].forEach(numer=>przyciski[numer].click());
 });
 await stan(strona,'CONNECTED');
 assert.equal(await strona.locator('.plan.is-selected').getAttribute('data-plan-id'),'FIBER-300M');
 assert.equal(await strona.locator('.sc-pokrywa').evaluateAll(elementy=>elementy.filter(element=>new DOMMatrixReadOnly(getComputedStyle(element).transform).m22<0).length),1);
 await sprawdzGeometrie(strona,'table',300);
 console.log('PASS SC/APC szybkie przełączanie');
 await strona.setViewportSize({width:390,height:844});
 await strona.locator('#comparison-FIBER .compare-scroll').evaluate(element=>element.scrollLeft=0);
 await strona.waitForFunction(()=>!document.querySelector('#link-active').getAttribute('d'));
 await strona.locator(gniazdo(300)).scrollIntoViewIfNeeded();await sprawdzGeometrie(strona,'table',300);
 await strona.setViewportSize({width:1440,height:1100});
 await strona.locator('[data-term="none"]').click();await stan(strona,'CONNECTED');await sprawdzGeometrie(strona,'table',300);
 assert.equal(await strona.locator('[data-plan-id="FIBER-300M"] .price strong').textContent(),'Wycena indywidualna');
 // Dodanie innej tabeli zachowuje podłączone gniazdo i jego tożsamość.
 await strona.evaluate(()=>window.gniazdoTestowe=document.querySelector('[data-gniazdo-pakiet="FIBER-300M"]'));
 await strona.locator('[data-table-technology="LAN"]').click();
 assert.equal(await strona.evaluate(()=>window.gniazdoTestowe===document.querySelector('[data-gniazdo-pakiet="FIBER-300M"]')),true);
 await sprawdzGeometrie(strona,'table',300);
 await strona.locator('[data-table-technology="FIBER"]').click();await stan(strona,'IDLE');
 await strona.waitForFunction(()=>!document.querySelector('#link-active').getAttribute('d'));
 assert.equal(await strona.locator('#link-active').getAttribute('d'),'');
 await strona.locator('[data-table-technology="FIBER"]').click();
 await strona.locator(gniazdo(100)).focus();await strona.keyboard.press('Enter');await stan(strona,'CONNECTED');
 assert.equal(await strona.locator(gniazdo(100)).evaluate(element=>element===document.activeElement),true);
 await strona.keyboard.press('Space');await stan(strona,'IDLE');
 console.log('PASS SC/APC filtry tabel i klawiatura');
 // Zmiana technologii podczas ruchu anuluje sekwencję, nie pozostawia klapki.
 await strona.locator(gniazdo(50)).click();await strona.locator('.device-tech-tabs [data-technology="AIR"]').click();await stan(strona,'IDLE');
 assert.equal(await strona.locator('#central-device .sc-simplex,#central-device .jack-rj').count(),0);
 // Powrót z tabeli do FIBER oraz zakończenie przejścia po wyłączeniu animacji.
 await strona.locator(gniazdo(100)).click();await strona.locator('#animation-toggle').click();await stan(strona,'CONNECTED');
 await sprawdzGeometrie(strona,'table',100);
 await strona.locator(gniazdo(100)).click();await stan(strona,'IDLE');
 await strona.locator('#animation-toggle').click();
 await strona.emulateMedia({reducedMotion:'reduce'});
 await rozpocznijPomiar(strona);await strona.locator(gniazdo(50)).click();await stan(strona,'CONNECTED');
 const ograniczony=await zakonczPomiar(strona);assert.ok(ograniczony.stany.indexOf('OPENING_COVER')<ograniczony.stany.indexOf('INSERTING'));
 assert.equal(await strona.locator('.sc-pokrywa').first().evaluate(element=>getComputedStyle(element).transitionDuration),'0s');
 await sprawdzGeometrie(strona,'table',50);await strona.locator(gniazdo(50)).click();await stan(strona,'IDLE');
 console.log('PASS SC/APC anulowanie i ograniczony ruch');
 await strona.emulateMedia({reducedMotion:'no-preference'});

 // Materiały do kontroli wizualnej — zrzuty rzeczywistych stanów, bez aranżowania CSS.
 await strona.goto(adres);
 await strona.locator('.rack-box').screenshot({path:`${katalog}/01-panel-rack.png`});
 await strona.locator(gniazdo(50)).screenshot({path:`${katalog}/02-gniazdo-zamkniete.png`,scale:'css'});
 await strona.locator(gniazdo(50)).click();
 await stan(strona,'CONNECTOR_APPROACH');
 await strona.locator(gniazdo(50)).screenshot({path:`${katalog}/03-klapka-otwarta-wtyk-przed.png`});
 await stan(strona,'CONNECTED');
 await strona.locator(gniazdo(50)).screenshot({path:`${katalog}/04-gniazdo-polaczone.png`});
 await strona.locator('#comparison-FIBER').screenshot({path:`${katalog}/05-tabela-desktop.png`});
 await strona.locator('[data-select-plan="FIBER-100M"]').click();await stan(strona,'CONNECTOR_APPROACH');
 await strona.locator('[data-plan-id="FIBER-100M"] .card-terminal').screenshot({path:`${katalog}/06-karta-wtyk-przed.png`});
 await stan(strona,'CONNECTED');
 await strona.locator('[data-plan-id="FIBER-100M"]').screenshot({path:`${katalog}/07-karta-polaczona.png`});
 await strona.locator('#cennik').screenshot({path:`${katalog}/08-fiber-desktop.png`,style:'.wspolny-naglowek{visibility:hidden!important}'});
 console.log('PASS SC/APC zrzuty stanów desktop');

 const dotyk=await przegladarka.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});sledz(dotyk);await dotyk.goto(adres);
 const sesja=await dotyk.context().newCDPSession(dotyk);
 await dotyk.evaluate(()=>document.fonts.ready);
 await dotyk.locator(gniazdo(50)).scrollIntoViewIfNeeded();
 await uspokojPrzewijanie(dotyk);
 const prostokat=await dotyk.locator(gniazdo(50)).boundingBox();
 const punkt={x:prostokat.x+prostokat.width/2,y:prostokat.y+prostokat.height/2};
 assert.equal(await dotyk.evaluate(punkt=>document.elementFromPoint(punkt.x,punkt.y)?.closest('[data-gniazdo-pakiet]')?.dataset.gniazdoPakiet,punkt),'FIBER-50M','Punkt dotyku musi trafiać w odsłonięte gniazdo');
 await dotyk.evaluate(()=>{
  window.sladDotykuFiber=[];
  for(const nazwa of ['pointerdown','pointermove','pointerup','pointercancel','scroll','contextmenu','focusin','focusout'])document.addEventListener(nazwa,zdarzenie=>window.sladDotykuFiber.push({nazwa,czas:performance.now(),typ:zdarzenie.pointerType,cel:zdarzenie.target?.closest?.('[data-gniazdo-pakiet]')?.dataset.gniazdoPakiet,y:scrollY}),{capture:true,passive:true});
 });
 await sesja.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[punkt]});
 try{await dotyk.waitForFunction(()=>document.querySelectorAll('.plan.is-hovered').length===1,null,{timeout:3000});}
 catch(blad){
  const slad=await dotyk.evaluate(()=>({zdarzenia:window.sladDotykuFiber,sesja:touchSession,wybrany:selectedPlanId,podglad:hoveredPlanId,widocznosc:document.visibilityState,fokus:document.hasFocus(),scroll:scrollY}));
  console.error('Diagnostyka long press FIBER:',JSON.stringify(slad));
  await writeFile(katalog+'/dotyk-blad.json',JSON.stringify(slad,null,2));
  await dotyk.screenshot({path:katalog+'/dotyk-blad.png'});throw blad;
 }
 assert.equal(await dotyk.locator('.plan.is-hovered').count(),1);
 assert.equal(await dotyk.locator('#connection-zone').getAttribute('data-fiber-state'),'IDLE');
 assert.equal(await dotyk.locator('.sc-pokrywa').first().evaluate(element=>new DOMMatrixReadOnly(getComputedStyle(element).transform).m22),1);
 await sesja.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await dotyk.waitForTimeout(600);
 assert.equal(await dotyk.locator('.plan.is-hovered').count(),0);assert.equal(await dotyk.locator('.plan.is-selected').count(),0);
 await sesja.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[punkt]});
 await sesja.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:punkt.x,y:punkt.y-85}]});
 await sesja.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await dotyk.waitForTimeout(600);
 assert.equal(await dotyk.locator('.plan.is-selected').count(),0);assert.equal(await dotyk.locator('.plan.is-hovered').count(),0);
 await dotyk.locator(gniazdo(50)).scrollIntoViewIfNeeded();await uspokojPrzewijanie(dotyk);
 await dotyk.locator(gniazdo(50)).tap();await stan(dotyk,'CONNECTED');await sprawdzGeometrie(dotyk,'table',50);
 await dotyk.locator('.compare-block').screenshot({path:`${katalog}/09-tabela-mobile-390.png`,style:'.wspolny-naglowek{visibility:hidden!important}'});
 await dotyk.setViewportSize({width:844,height:390});await dotyk.waitForTimeout(150);await sprawdzGeometrie(dotyk,'table',50);
 await dotyk.locator(gniazdo(50)).tap();await stan(dotyk,'IDLE');
 await dotyk.locator(gniazdo(100)).scrollIntoViewIfNeeded();await dotyk.locator(gniazdo(100)).tap();await stan(dotyk,'CONNECTED');
 await sprawdzGeometrie(dotyk,'table',100);
 await dotyk.locator('#comparison-FIBER .compare-scroll').evaluate(element=>element.scrollLeft=0);await dotyk.waitForTimeout(100);
 if(await dotyk.locator(gniazdo(100)).evaluate(element=>element.getBoundingClientRect().right>element.closest('.compare-scroll').getBoundingClientRect().right))assert.equal(await dotyk.locator('#link-active').getAttribute('d'),'');
 assert.deepEqual(bledy,[],'Błędy JavaScript/konsoli');
 console.log('PASS szybkie przełączanie, anulowanie, klawiatura, zachowanie tabel, reduced motion, tap/long press/scroll, orientacja i brak błędów JS');
}finally{
 await writeFile(`${katalog}/wyniki.json`,JSON.stringify({pomiary,przebiegi,bledy},null,2));
 await przegladarka?.close();serwer.kill();
}
