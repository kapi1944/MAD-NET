import {wybierzPort,poczekajNaSerwer,uruchomPrzegladarke} from './srodowisko.mjs';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
const katalog='test-results/v21';await mkdir(katalog+'/po',{recursive:true});await mkdir(katalog+'/przed',{recursive:true});
const port=await wybierzPort('MADNET_PORT_TESTOW_V21');
const serwer=spawn(process.execPath,['scripts/serve.mjs','--root','dist','--no-live'],{env:{...process.env,PORT:port}});
const adres=`http://127.0.0.1:${port}/cennik.html`;
const selektorAnimacjiTabel='.compare-head-port :is(.port-leds i:last-child,.wifi-arc)';
async function sprawdzOgraniczonyRuchTabel(strona){
 const animacje=await strona.locator(selektorAnimacjiTabel).evaluateAll(elementy=>elementy.map(element=>getComputedStyle(element).animationName));
 assert.equal(animacje.length,23);
 assert.ok(animacje.every(nazwa=>nazwa==='none'),JSON.stringify(animacje));
}
async function odczytajPolaczenie(strona){
 return strona.evaluate(()=>({
  technologia:technology,pakiet:selectedPlanId,podglad:hoveredPlanId,
  stan:zone.dataset.fiberState,aktywny:activePath.getAttribute('d'),podgladPrzewodu:hoverPath.getAttribute('d'),
  formularz:document.querySelector('#availability-choice-summary').textContent
 }));
}
let przegladarka;
try{
 await poczekajNaSerwer(serwer);
 przegladarka=await uruchomPrzegladarke(chromium);
 const strona=await przegladarka.newPage();const bledy=[];strona.on('pageerror',e=>bledy.push(e.message));
 for(const szerokosc of [320,360,390,430,768,1024,1280,1366,1440,1920]){
 await strona.setViewportSize({width:szerokosc,height:1100});
 if([390,1440].includes(szerokosc)){
 for(const plik of ['index.html','assets/css/styles.css','assets/js/cennik.js','assets/js/dostepnosc.js']){const zawartosc=execFileSync('git',['show','f759900:'+plik],{encoding:'utf8'});await strona.route('**/'+(plik==='index.html'?'cennik.html':plik),r=>r.fulfill({body:zawartosc,contentType:plik.endsWith('.css')?'text/css':plik.endsWith('.js')?'text/javascript':'text/html'}));}
 await strona.goto(`http://127.0.0.1:${port}/cennik.html`);await strona.locator('.compare-block').scrollIntoViewIfNeeded();await strona.screenshot({path:`${katalog}/przed/tabele-${szerokosc}.png`});await strona.unrouteAll();
 }
 await strona.goto(adres);
 const poczatek=await strona.locator('.device-tech-tabs [aria-pressed=true]').getAttribute('data-technology');
 for(let maska=0;maska<8;maska++){
 if(await strona.locator('#compare-clear').isEnabled())await strona.locator('#compare-clear').click();
 const wybrane=['FIBER','LAN','AIR'].filter((_,i)=>maska&(1<<i));
 for(const technologia of wybrane)await strona.locator(`[data-table-technology=${technologia}]`).click();
 assert.deepEqual(await strona.locator('.compare-tech-panel').evaluateAll(e=>e.map(t=>t.dataset.tech)),wybrane);
 assert.equal(await strona.locator('#compare-chip').textContent(),wybrane.length+' z 3 technologii');
 assert.equal(await strona.locator('.compare-empty').count(),maska?0:1);
 assert.equal(await strona.locator('.device-tech-tabs [aria-pressed=true]').getAttribute('data-technology'),poczatek);
 assert.equal(await strona.evaluate(()=>document.documentElement.scrollWidth),szerokosc);
 }
 assert.equal(await strona.locator('.compare-head-port').count(),13);
 const blednePorty=await strona.locator('.compare-head-port').evaluateAll(porty=>porty.flatMap(port=>{
  const bledy=[];
  const naglowek=port.closest('th').getBoundingClientRect();
  const obrys=port.getBoundingClientRect(),nazwa=port.nextElementSibling.getBoundingClientRect();
  const interakcje='button,[role="button"],[tabindex],[aria-pressed],[data-link],[data-stan-polaczenia],.sc-konektor,.sc-kabel-punkt,.rj-plug';
  if(port.tagName!=='SPAN'||port.getAttribute('aria-hidden')!=='true'||port.matches(interakcje)||port.querySelector(interakcje)||getComputedStyle(port).cursor==='pointer')bledy.push('interaktywność');
  if(naglowek.height>110||obrys.height>56)bledy.push('wysokość');
  if(obrys.left<nazwa.right&&obrys.right>nazwa.left&&obrys.top<nazwa.bottom&&obrys.bottom>nazwa.top)bledy.push('kolizja portu z nazwą');
  if([obrys,nazwa].some(prostokat=>prostokat.left<naglowek.left||prostokat.right>naglowek.right||prostokat.top<naglowek.top||prostokat.bottom>naglowek.bottom))bledy.push('wyjście poza komórkę');
  return bledy.map(blad=>port.dataset.ledPakiet+' '+blad);
 }));
 assert.deepEqual(blednePorty,[]);
 for(const technologia of ['FIBER','LAN','AIR']){
  const pakiety=await strona.locator(`#comparison-${technologia} .compare-head-port`).evaluateAll(porty=>porty.map(port=>{
   const predkosc=Number(port.dataset.portSpeed);
   const wskazniki=port.querySelectorAll('.port-leds i:last-child,.wifi-arc');
   const link=port.querySelector('.port-leds i:first-child');
   const wiersze=[...port.closest('table').tBodies[0].rows].map(wiersz=>wiersz.cells[port.closest('th').cellIndex].textContent);
   return {id:port.dataset.ledPakiet,nazwa:port.nextElementSibling.textContent,wiersze,
    oczekiwany:link?Math.round(1000/(blinkHz(predkosc)*1.5)):radioPeriod(predkosc),
    okresy:[...wskazniki].map(element=>element.getAnimations()[0]?.effect.getTiming().duration),
    link:link?getComputedStyle(link).backgroundColor:null,
    jasnosc:link?getComputedStyle(link.parentElement).filter:null};
  }));
  const dane=await strona.evaluate(technologia=>PLAN_DATA[technologia],technologia);
  for(const [numer,pakiet] of pakiety.entries()){
   const {id,down,up,monthly24,monthly12}=dane[numer];
   assert.equal(pakiet.id,id);
   assert.equal(pakiet.nazwa,id.replace(/M$/,''));
   assert.deepEqual(pakiet.wiersze,[`${down} Mbit/s`,`${up} Mbit/s`,...(monthly12===null?[]:[`${monthly12} zł`]),`${monthly24} zł`,'Wycena indywidualna']);
   assert.deepEqual(pakiet.okresy,Array(technologia==='AIR'?3:1).fill(pakiet.oczekiwany));
   assert.equal(pakiet.link,technologia==='AIR'?null:'rgb(41, 74, 52)');
   assert.equal(pakiet.jasnosc,technologia==='AIR'?null:'brightness(0.7)');
  }
  assert.ok(pakiety.every((pakiet,numer)=>!numer||pakiet.oczekiwany<pakiety[numer-1].oczekiwany));
  if(szerokosc<=390){
   const przewinieto=await strona.locator(`#comparison-${technologia} .compare-scroll`).evaluate(element=>{
    element.scrollLeft=element.scrollWidth;
    const po=element.scrollLeft; element.scrollLeft=0; return po;
   });
   assert.ok(przewinieto>0);
  }
  if([390,1440].includes(szerokosc))await strona.locator(`#comparison-${technologia}`).screenshot({path:`${katalog}/po/${technologia}-${szerokosc}.png`,style:'.wspolny-naglowek{visibility:hidden!important}'});
 }
 await strona.locator('.compare-block').scrollIntoViewIfNeeded();await strona.screenshot({path:`${katalog}/po/tabele-${szerokosc}.png`});
 await strona.locator('.availability-contract-options label').nth(1).click();assert.equal(await strona.locator('input[name=umowa]:checked').inputValue(),'12');
 await strona.waitForTimeout(250);if([390,1440].includes(szerokosc)){await strona.locator('.availability-contract').scrollIntoViewIfNeeded();await strona.screenshot({path:`${katalog}/po/formularz-${szerokosc}.png`});}
 console.log('PASS V21 '+szerokosc+'px / 8 kombinacji / 13 miniportów');
 }
 await strona.locator('#compare-clear').click();await strona.locator('#compare-show-all').focus();await strona.keyboard.press('Enter');assert.equal(await strona.locator('.compare-tech-panel').count(),3);
 await strona.locator('[data-table-technology=LAN]').focus();await strona.keyboard.press('Space');assert.equal(await strona.locator('.compare-tech-panel').count(),2);
 await strona.locator('#compare-show-all').click();
 const porty=strona.locator('.compare-head-port');
 const stanPrzed=await odczytajPolaczenie(strona);
 for(const port of await porty.all()){
  await port.scrollIntoViewIfNeeded();
  const prostokat=await port.boundingBox();
  const x=prostokat.x+prostokat.width/2,y=prostokat.y+prostokat.height/2;
  await strona.mouse.move(x,y);
  await strona.evaluate(()=>new Promise(zakoncz=>requestAnimationFrame(zakoncz)));
  assert.deepEqual(await odczytajPolaczenie(strona),stanPrzed);
  await strona.mouse.click(x,y);
  assert.deepEqual(await odczytajPolaczenie(strona),stanPrzed);
  assert.equal(await port.evaluate(element=>{element.focus();return element===document.activeElement;}),false);
 }
 await strona.locator('#comparison-FIBER .compare-scroll').focus();
 await strona.keyboard.press('Tab');
 assert.equal(await strona.locator('#comparison-LAN .compare-scroll').evaluate(element=>element===document.activeElement),true);
 const dotyk=await przegladarka.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 dotyk.on('pageerror',e=>bledy.push(e.message));
 await dotyk.goto(adres);
 await dotyk.locator('.device-tech-tabs [data-technology="AIR"]').click();
 await dotyk.locator('#compare-show-all').click();
 const sesjaDotyku=await dotyk.context().newCDPSession(dotyk);
 const stanDotyku=await odczytajPolaczenie(dotyk);
 for(const technologia of ['FIBER','LAN','AIR']){
  const port=dotyk.locator(`#comparison-${technologia} .compare-head-port`).first();
  await port.scrollIntoViewIfNeeded();
  const prostokat=await port.boundingBox();
  await dotyk.touchscreen.tap(prostokat.x+prostokat.width/2,prostokat.y+prostokat.height/2);
  assert.deepEqual(await odczytajPolaczenie(dotyk),stanDotyku);
  const tabela=dotyk.locator(`#comparison-${technologia} .compare-scroll`);
  const obrys=await tabela.boundingBox();
  const x=obrys.x+obrys.width-20,y=prostokat.y+prostokat.height/2;
  const poprzedni=await tabela.evaluate(element=>element.scrollLeft);
  await sesjaDotyku.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(const odleglosc of [30,60,90,120])await sesjaDotyku.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-odleglosc,y}]});
  await sesjaDotyku.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await dotyk.waitForFunction(({technologia,poprzedni})=>document.querySelector(`#comparison-${technologia} .compare-scroll`).scrollLeft>poprzedni,{technologia,poprzedni});
  assert.deepEqual(await odczytajPolaczenie(dotyk),stanDotyku);
 }
 await dotyk.close();
 await strona.locator('#animation-toggle').click();await sprawdzOgraniczonyRuchTabel(strona);
 // Wyszukiwanie jest deterministyczne; mapa zachowuje prawdziwą bibliotekę Leaflet.
 await strona.route('**/nominatim.openstreetmap.org/search?**',r=>r.fulfill({json:[{lat:'54.063203',lon:'15.266009'}]}));
 await strona.locator('#availability-town').fill('Trzebiatów');
 await strona.locator('#availability-street').fill('Kołobrzeska 12');
 await strona.locator('#availability-street').dispatchEvent('change');
 await strona.waitForFunction(()=>document.querySelector('#availability-location-summary').classList.contains('has-location'));
 await strona.waitForFunction(()=>!document.querySelector('#availability-map-pin').disabled);
 assert.match(await strona.locator('#availability-location-description').innerText(),/znaleziony po adresie: 54.063203, 15.266009/);
 assert.equal(await strona.locator('.lokalizacja-reczna').count(),0);
 assert.equal(await strona.locator('#availability-location-summary').count(),1);
 assert.equal(await strona.locator('#availability-location-summary').evaluate(e=>e.previousElementSibling.contains(document.querySelector('#availability-address-search'))),true);
 assert.equal(await strona.locator('#availability-feedback').innerText(),'');
 for(const szerokosc of [390,768,1440]){
  await strona.setViewportSize({width:szerokosc,height:1100});
  await strona.locator('#availability-address-search').scrollIntoViewIfNeeded();
  await strona.screenshot({path:katalog+'/po/lokalizacja-'+szerokosc+'.png'});
  assert.equal(await strona.evaluate(()=>document.documentElement.scrollWidth),szerokosc);
 }
 await strona.locator('#availability-map').click({position:{x:110,y:100}});
 assert.match(await strona.locator('#availability-location-description').innerText(),/zaznaczony ręcznie.*orientacyjnie/);
 const pinezka=strona.locator('.availability-map-pin-icon');
 const przed=await strona.locator('#availability-location-description').innerText();
 // Kliknięcie mapy uruchamia panTo; przed gestem poczekaj na stabilny cel.
 await pinezka.hover();
 const pozycja=await pinezka.boundingBox();
 await strona.mouse.move(pozycja.x+19,pozycja.y+20);await strona.mouse.down();await strona.mouse.move(pozycja.x+65,pozycja.y+50,{steps:10});
 await strona.evaluate(()=>new Promise(koniec=>requestAnimationFrame(koniec)));await strona.mouse.up();
 await strona.waitForFunction(przed=>document.querySelector('#availability-location-description').innerText!==przed,przed);
 assert.notEqual(await strona.locator('#availability-location-description').innerText(),przed);
 assert.match(await strona.locator('#availability-location-description').innerText(),/orientacyjnie/);
 await strona.locator('#availability-map-pin').click();
 await strona.locator('.availability-tech-toggle[data-tech=LAN]').check();
 await strona.locator('#availability-phone').fill('608123456');
 await strona.locator('#availability-consent').check();
 const zapytania=[];
 await strona.route('**/api/zapytanie.php',r=>{zapytania.push(r.request().postDataJSON());return r.fulfill({json:{ok:true,confirmationSent:false}})});
 await strona.locator('#availability-submit').click();
 await strona.waitForFunction(()=>!document.querySelector('#availability-thanks').hidden);
 assert.equal(zapytania[0].mapSource,'manual');
 const status=await strona.locator('#availability-location-description').innerText();
 assert.ok(status.includes(zapytania[0].position.lat.toFixed(6))&&status.includes(zapytania[0].position.lng.toFixed(6)));
 await strona.locator('#availability-map-clear').click();
 assert.ok(await strona.locator('#availability-map-clear').isDisabled());
 assert.equal(await strona.locator('#availability-location-summary').evaluate(e=>e.classList.contains('has-location')),false);
 assert.match(await strona.locator('#availability-location-description').innerText(),/Nie wskazano/);
 await strona.route('**/nominatim.openstreetmap.org/search?**',r=>r.fulfill({json:[]}));
 await strona.locator('#availability-street').fill('Nieznana 999');
 await strona.locator('#availability-address-search').click();
 await strona.waitForFunction(()=>document.querySelector('#availability-feedback').dataset.error==='true');
 assert.match(await strona.locator('#availability-feedback').innerText(),/Nie znaleziono/);
 await strona.route('**/leaflet.js',r=>r.abort());await strona.route('**/leaflet@*/**/*.js',r=>r.abort());
 await strona.reload();
 await strona.locator('#availability-map-load').click();await strona.waitForFunction(()=>document.querySelector('#availability-map-load').textContent.includes('Ponów'));
 await strona.locator('#availability-town').fill('Trzebiatów');await strona.locator('#availability-street').fill('Kołobrzeska 12');
 await strona.locator('.availability-tech-toggle[data-tech=LAN]').check();await strona.locator('#availability-phone').fill('608123456');await strona.locator('#availability-consent').check();
 await strona.locator('#availability-submit').click();await strona.waitForFunction(()=>!document.querySelector('#availability-thanks').hidden);
 assert.equal(zapytania[1].position,null);assert.equal(zapytania[1].town,'Trzebiatów');
 
 await strona.locator('#compare-show-all').click();
 await strona.emulateMedia({reducedMotion:'reduce'});await sprawdzOgraniczonyRuchTabel(strona);
 assert.deepEqual(bledy,[]);console.log('PASS V21 geokodowanie, mapa, przeciąganie, status, dane zapytania, awaria mapy, reduced motion, brak wyjątków JS');
}finally{await przegladarka?.close();serwer.kill()}
