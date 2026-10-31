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
 for(const plik of ['index.html','assets/css/styles.css','assets/js/cennik.js','assets/js/dostepnosc.js']){const zawartosc=execFileSync('git',['show','f759900:'+plik],{encoding:'utf8'});await strona.route('**/'+(plik==='index.html'?'':plik),r=>r.fulfill({body:zawartosc,contentType:plik.endsWith('.css')?'text/css':plik.endsWith('.js')?'text/javascript':'text/html'}));}
 await strona.goto(`http://127.0.0.1:${port}/`);await strona.locator('.compare-block').scrollIntoViewIfNeeded();await strona.screenshot({path:`${katalog}/przed/tabele-${szerokosc}.png`});await strona.unrouteAll();
 }
 await strona.goto(`http://127.0.0.1:${port}/`);
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
 await strona.locator('#lokalizacja-szerokosc').fill('54,063203');await strona.locator('#lokalizacja-dlugosc').fill('15.266009');await strona.locator('#lokalizacja-zapisz').click();assert.match(await strona.locator('#availability-location-description').innerText(),/54.063203/);
 await strona.locator('#availability-map-clear').click();assert.ok(await strona.locator('#availability-map-clear').isDisabled());
 await strona.route('**/leaflet.js',r=>r.abort());await strona.route('**/leaflet@*/**/*.js',r=>r.abort());await strona.locator('#availability-map-load').click();await strona.waitForFunction(()=>document.querySelector('#availability-map-load').textContent.includes('Ponów'));
 await strona.locator('#lokalizacja-zapisz').click();assert.match(await strona.locator('#availability-location-description').innerText(),/54.063203/);
 
 await strona.emulateMedia({reducedMotion:'reduce'});assert.equal(await strona.locator('.compare-head-port .port-leds i:last-child').first().evaluate(e=>getComputedStyle(e).animationName),'none');
 assert.deepEqual(bledy,[]);console.log('PASS V21 ręczny punkt, awaria mapy, reduced motion, brak wyjątków JS');
}finally{await przegladarka?.close();serwer.kill()}
