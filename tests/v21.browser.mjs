import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
const katalog='test-results/v21';await mkdir(katalog+'/po',{recursive:true});await mkdir(katalog+'/przed',{recursive:true});
const port=process.env.MADNET_PORT_TESTOW_V21 || '4182';
const serwer=spawn(process.execPath,['scripts/serve.mjs','--root','dist','--no-live'],{env:{...process.env,PORT:port}});
let przegladarka;
try{
 await new Promise((ok,blad)=>{serwer.stdout.once('data',ok);serwer.once('error',blad)});
 przegladarka=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'msedge'}:{})});
 const strona=await przegladarka.newPage();const bledy=[];strona.on('pageerror',e=>bledy.push(e.message));
 for(const szerokosc of [360,390,430,768,1024,1280,1440,1920]){
 await strona.setViewportSize({width:szerokosc,height:1100});
 if([390,1440].includes(szerokosc)){
 for(const plik of ['index.html','assets/css/styles.css','assets/js/cennik.js','assets/js/dostepnosc.js']){const zawartosc=execFileSync('git',['show','f759900:'+plik],{encoding:'utf8'});await strona.route('**/'+(plik==='index.html'?'cennik.html':plik),r=>r.fulfill({body:zawartosc,contentType:plik.endsWith('.css')?'text/css':plik.endsWith('.js')?'text/javascript':'text/html'}));}
 await strona.goto(`http://127.0.0.1:${port}/cennik.html`);await strona.locator('.compare-block').scrollIntoViewIfNeeded();await strona.screenshot({path:`${katalog}/przed/tabele-${szerokosc}.png`});await strona.unrouteAll();
 }
 await strona.goto(`http://127.0.0.1:${port}/cennik.html`);
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
 assert.equal(await strona.locator('.compare-head-port button,.compare-head-port [tabindex]').count(),0);
 for(const technologia of ['FIBER','LAN','AIR']){
 const okresy=await strona.locator(`#comparison-${technologia} .compare-head-port`).evaluateAll(e=>e.map(t=>parseFloat(getComputedStyle(t).getPropertyValue('--pulse-ms'))));assert.ok(okresy.every((v,i)=>v>0&&(!i||v<okresy[i-1])));
 }
 await strona.locator('.compare-block').scrollIntoViewIfNeeded();await strona.screenshot({path:`${katalog}/po/tabele-${szerokosc}.png`});
 await strona.locator('.availability-contract-options label').nth(1).click();assert.equal(await strona.locator('input[name=umowa]:checked').inputValue(),'12');
 await strona.waitForTimeout(250);if([390,1440].includes(szerokosc)){await strona.locator('.availability-contract').scrollIntoViewIfNeeded();await strona.screenshot({path:`${katalog}/po/formularz-${szerokosc}.png`});}
 console.log('PASS V21 '+szerokosc+'px / 8 kombinacji / 13 miniportów');
 }
 await strona.locator('#compare-clear').click();await strona.locator('#compare-show-all').focus();await strona.keyboard.press('Enter');assert.equal(await strona.locator('.compare-tech-panel').count(),3);
 await strona.locator('[data-table-technology=LAN]').focus();await strona.keyboard.press('Space');assert.equal(await strona.locator('.compare-tech-panel').count(),2);
 await strona.locator('#compare-show-all').click();await strona.locator('#animation-toggle').click();assert.equal(await strona.locator('.compare-head-port .port-leds i:last-child').first().evaluate(e=>getComputedStyle(e).animationName),'none');
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
 const pozycja=await pinezka.boundingBox();
 await strona.mouse.move(pozycja.x+19,pozycja.y+20);await strona.mouse.down();await strona.mouse.move(pozycja.x+65,pozycja.y+50,{steps:10});await strona.mouse.up();
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
 
 await strona.emulateMedia({reducedMotion:'reduce'});assert.equal(await strona.locator('.compare-head-port .port-leds i:last-child').first().evaluate(e=>getComputedStyle(e).animationName),'none');
 assert.deepEqual(bledy,[]);console.log('PASS V21 geokodowanie, mapa, przeciąganie, status, dane zapytania, awaria mapy, reduced motion, brak wyjątków JS');
}finally{await przegladarka?.close();serwer.kill()}
