import {wybierzPort,poczekajNaSerwer,uruchomPrzegladarke} from './srodowisko.mjs';
import {chromium} from 'playwright-core';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const port=await wybierzPort('MADNET_PORT_LED');
const serwer=spawn(process.execPath,['scripts/serve.mjs','--root','dist','--no-live'],{env:{...process.env,PORT:port}});
const wyniki=[],bledy=[];
let przegladarka;
async function sprawdzWspolnyStan(strona,id){
 const stany=await strona.locator('[data-link="connected"]').evaluateAll(elementy=>elementy.map(element=>element.dataset.portPlanId||element.dataset.planId||element.dataset.ledPakiet||element.dataset.gniazdoPakiet));
 assert.ok(stany.length>=4,JSON.stringify(stany));
 assert.ok(stany.every(wartosc=>wartosc===id),JSON.stringify(stany));
 for(const selektor of [`[data-port-plan-id="${id}"]`,`.plan[data-plan-id="${id}"]`,`.grafika-hybrydowa [data-led-pakiet="${id}"]`,`.compare-head-port[data-led-pakiet="${id}"],.compare-head-port[data-gniazdo-pakiet="${id}"]`])assert.equal(await strona.locator(selektor).getAttribute('data-link'),'connected');
}
await mkdir('test-results/fiber/led',{recursive:true});
try{
 await poczekajNaSerwer(serwer);
 przegladarka=await uruchomPrzegladarke(chromium);
 await mkdir('test-results/fiber/led',{recursive:true});
 for(const szerokosc of [320,390,1440]){
  const strona=await przegladarka.newPage({viewport:{width:szerokosc,height:1100},hasTouch:szerokosc<768});
  strona.on('pageerror',blad=>bledy.push(blad.message));
  strona.on('console',wpis=>{if(wpis.type()==='error'&&!wpis.location().url.startsWith('https://'))bledy.push(wpis.text());});
  await strona.goto(`http://127.0.0.1:${port}/cennik.html`);
  await strona.locator('#compare-show-all').click();
  for(const technologia of ['LAN','FIBER']){
   await strona.locator(`.device-tech-tabs [data-technology="${technologia}"]`).click();
   assert.equal(await strona.locator('[data-link="connected"]').count(),0);
   assert.equal(await strona.locator('.sc-simplex .port-leds,.adapter-szafy-fiber .port-leds').count(),0,'Pasywny adapter nie zawiera LED');
   const okresy=await strona.locator('.speed-port .port-leds i:last-child').evaluateAll(elementy=>elementy.map(element=>parseFloat(getComputedStyle(element).animationDuration)));
   assert.ok(okresy.every((okres,numer)=>okres>0&&(!numer||okres<okresy[numer-1])),'ACT przyspiesza wraz z nominalną prędkością');
   const id=technologia==='LAN'?'LAN-40M':'FIBER-100M';
   const selektor=`[data-port-plan-id="${id}"]`;
   assert.equal(await strona.locator(selektor+' .port-leds i:first-child').evaluate(element=>getComputedStyle(element).backgroundColor),'rgb(24, 33, 27)');
   const przed=await strona.evaluate(id=>{
    const nalezy=element=>(element.dataset.portPlanId||element.dataset.planId||element.dataset.ledPakiet||element.dataset.gniazdoPakiet)===id;
    const reprezentacje=[...document.querySelectorAll('[data-link]')].filter(nalezy);
    window.animacjeActTest=reprezentacje.map(element=>element.querySelector('.port-leds i:last-child,.rj-link,.fiber-activity')).map(element=>({element,animacja:element.getAnimations()[0]}));
    window.probkiLink=[];window.mierzLink=true;
    function zmierz(){if(!window.mierzLink)return;window.probkiLink.push({stan:document.querySelector('#connection-zone').dataset.fiberState,link:document.querySelector(`[data-port-plan-id="${id}"]`).dataset.link});requestAnimationFrame(zmierz);}
    zmierz();
    return window.animacjeActTest.map(({element,animacja})=>({okres:getComputedStyle(element).animationDuration,czas:animacja?.currentTime,kolor:getComputedStyle(element).backgroundColor}));
   },id);
   assert.ok(przed.length>=4&&przed.every(wpis=>wpis.czas!==null&&wpis.czas!==undefined));
   assert.ok(przed.some(wpis=>wpis.kolor==='rgb(221, 160, 68)'));
   await strona.locator(`[data-select-plan="${id}"]`).click();
   await strona.waitForFunction(id=>document.querySelector(`[data-port-plan-id="${id}"]`).dataset.link==='connected',id);
   await sprawdzWspolnyStan(strona,id);
   await strona.waitForFunction(selektor=>getComputedStyle(document.querySelector(selektor+' .port-leds i:first-child')).backgroundColor==='rgb(112, 201, 123)',selektor);
   assert.ok(await strona.locator(selektor+' .port-leds').evaluate(element=>Number(getComputedStyle(element).filter.match(/[0-9.]+/)[0])>.95));
   const po=await strona.evaluate(()=>window.animacjeActTest.map(({element,animacja})=>({taSama:element.getAnimations()[0]===animacja,okres:getComputedStyle(element).animationDuration,czas:animacja.currentTime,kolor:getComputedStyle(element).backgroundColor})));
   po.forEach((wpis,numer)=>{assert.ok(wpis.taSama);assert.equal(wpis.okres,przed[numer].okres);assert.equal(wpis.kolor,przed[numer].kolor);assert.ok(wpis.czas>przed[numer].czas);});
   await strona.locator(`[data-select-plan="${id}"]`).click();
   await strona.waitForFunction(()=>!document.querySelector('[data-link="connected"]'));
   if(technologia==='FIBER'){
    await strona.waitForFunction(()=>document.querySelector('#connection-zone').dataset.fiberState==='IDLE');
    const probki=await strona.evaluate(()=>{window.mierzLink=false;return window.probkiLink;});
    for(const stan of ['CONNECTOR_APPROACH','INSERTING']){const etap=probki.filter(probka=>probka.stan===stan);assert.ok(etap.length>0);assert.ok(etap.every(probka=>probka.link==='disconnected'));}
    const rozlaczanie=probki.filter(probka=>probka.stan==='DISCONNECTING');assert.ok(rozlaczanie.length>0&&rozlaczanie.every(probka=>probka.link==='connected'));
   }else await strona.evaluate(()=>window.mierzLink=false);
   const pierwszy=technologia==='LAN'?'LAN-10M':'FIBER-50M';
   const ostatni=technologia==='LAN'?'LAN-80M':'FIBER-300M';
   await strona.locator(`[data-select-plan="${pierwszy}"]`).click();await strona.locator(`[data-select-plan="${ostatni}"]`).click();
   await strona.waitForFunction(id=>document.querySelector(`[data-port-plan-id="${id}"]`).dataset.link==='connected',ostatni);await sprawdzWspolnyStan(strona,ostatni);
   await strona.locator('.device-tech-tabs [data-technology="AIR"]').click();
   assert.equal(await strona.locator('[data-link="connected"]').count(),0);assert.equal(await strona.locator('#central-device .port-leds,#central-device .sc-simplex,#central-device .jack-rj').count(),0);
   await strona.locator(`.device-tech-tabs [data-technology="${technologia}"]`).click();
   await strona.locator(`[data-select-plan="${pierwszy}"]`).click();
   await strona.locator('.device-tech-tabs [data-technology="AIR"]').click();
   assert.equal(await strona.locator('[data-link="connected"]').count(),0,'Anulowanie gasi LINK');
   await strona.locator(`.device-tech-tabs [data-technology="${technologia}"]`).click();
   await strona.emulateMedia({reducedMotion:'reduce'});
   await strona.locator(`[data-select-plan="${id}"]`).click();await strona.waitForFunction(id=>document.querySelector(`[data-port-plan-id="${id}"]`).dataset.link==='connected',id);await sprawdzWspolnyStan(strona,id);
   assert.ok(await strona.locator('.port-leds i:last-child').evaluateAll(elementy=>elementy.every(element=>getComputedStyle(element).animationName==='none')));
   await strona.emulateMedia({reducedMotion:'no-preference'});
   await strona.locator('#central-area').screenshot({path:`test-results/fiber/led/${technologia}-${szerokosc}.png`});
   wyniki.push({szerokosc,technologia,przed,po});console.log('PASS LINK/ACT',szerokosc,technologia,'cztery reprezentacje, sekwencja, ciągłość ACT, anulowanie i reduced-motion');
  }
  await strona.close();
 }
 assert.deepEqual(bledy,[]);
}finally{await writeFile('test-results/fiber/led/wyniki.json',JSON.stringify({wyniki,bledy},null,2));await przegladarka?.close();serwer.kill();}
