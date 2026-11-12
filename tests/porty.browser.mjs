import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {wybierzPort,poczekajNaSerwer,uruchomPrzegladarke} from './srodowisko.mjs';

// Ten sam kadr i faza ACT umożliwiają porównanie sprzętu przed i po zmianie.
const etap=process.env.MADNET_ETAP_PORTOW||'po';
const katalog=`test-results/porty-led/${etap}`;
const port=await wybierzPort('MADNET_PORT_PORTY');
const serwer=spawn(process.execPath,['scripts/serve.mjs','--root',process.env.MADNET_KATALOG_PORTOW||'dist','--no-live'],{env:{...process.env,PORT:port}});
const bledy=[],pomiary=[];
let przegladarka;
await mkdir(katalog,{recursive:true});
try{
 await poczekajNaSerwer(serwer);
 przegladarka=await uruchomPrzegladarke(chromium);
 for(const szerokosc of etap==='przed'?[390,1440]:[320,360,390,430,768,1024,1366,1440,1920]){
  const strona=await przegladarka.newPage({viewport:{width:szerokosc,height:1100},hasTouch:szerokosc<768});
  strona.on('pageerror',blad=>bledy.push(blad.message));
  strona.on('console',wpis=>{if(wpis.type()==='error'&&!wpis.location().url.startsWith('https://'))bledy.push(wpis.text());});
  await strona.goto(`http://127.0.0.1:${port}/cennik.html`);
  await strona.evaluate(()=>document.fonts.ready);
  for(const technologia of ['LAN','FIBER']){
   await strona.locator(`.device-tech-tabs [data-technology="${technologia}"]`).click();
   await strona.locator(`#plans .plan[data-technology="${technologia}"]`).first().waitFor();
   if(await strona.locator('#compare-show-all').isEnabled())await strona.locator('#compare-show-all').click();
   await strona.mouse.move(0,0);
   const pomiar=await strona.evaluate(({technologia,etap})=>{
    const rozmiar=selektor=>{
     const element=document.querySelector(selektor);
     if(!element)throw new Error('Brak elementu do pomiaru: '+selektor);
     const styl=getComputedStyle(element);
     return {szerokosc:parseFloat(styl.width),wysokosc:parseFloat(styl.height)};
    };
    const klasa=technologia==='LAN'?'.jack-rj':'.sc-simplex';
    const porty=[...document.querySelectorAll('#central-device .speed-port')];
    const kolizje=[];
    for(const port of porty){
     const obrys=port.getBoundingClientRect(),gniazdo=port.querySelector(klasa).getBoundingClientRect(),etykieta=port.querySelector('.speed-label').getBoundingClientRect();
     if(gniazdo.left<obrys.left||gniazdo.right>obrys.right||gniazdo.top<obrys.top||gniazdo.bottom>obrys.bottom)kolizje.push('Port poza ramką '+port.dataset.portPlanId);
     if(gniazdo.left<etykieta.right&&gniazdo.right>etykieta.left&&gniazdo.top<etykieta.bottom&&gniazdo.bottom>etykieta.top)kolizje.push('Port zasłania prędkość');
    }
    for(const dioda of document.querySelectorAll('#central-device .port-leds i,#plans .port-leds i,.compare-head-port .port-leds i')){
     const obrys=dioda.getBoundingClientRect(),ramka=dioda.closest('.jack-rj,.mini-interface,.speed-port,.compare-head-port').getBoundingClientRect();
     if(obrys.left<ramka.left||obrys.right>ramka.right||obrys.top<ramka.top||obrys.bottom>ramka.bottom)kolizje.push('Dioda poza obudową');
    }
    if(etap!=='przed')for(const port of document.querySelectorAll('.compare-head-port--FIBER')){
     const adapter=port.querySelector('.adapter-tabeli-fiber').getBoundingClientRect();
     const diody=[...port.querySelectorAll('.port-leds i')];
     if(diody.length!==2||diody.some(dioda=>dioda.getBoundingClientRect().bottom>adapter.top))kolizje.push('Kontrolki tabeli FIBER poza górnym pasem');
    }
    // Obrys zawartości SVG obejmuje całą bitmapę; mierzymy widoczne, przycięte okno portu.
    const portySzafy=[...document.querySelectorAll('.porty-szafy-lan svg')].map(element=>{
     const macierz=element.parentNode.getScreenCTM();
     const poczatek=new DOMPoint(element.x.baseVal.value,element.y.baseVal.value).matrixTransform(macierz);
     const koniec=new DOMPoint(element.x.baseVal.value+element.width.baseVal.value,element.y.baseVal.value+element.height.baseVal.value).matrixTransform(macierz);
     return {left:poczatek.x,right:koniec.x};
    });
    const przeskalowanePorty=[...document.querySelectorAll('#central-device '+klasa+',#plans '+klasa)].filter(element=>{
     const macierz=new DOMMatrixReadOnly(getComputedStyle(element).transform);
     return macierz.a!==1||macierz.d!==1;
    }).length;
    if(portySzafy.some((obrys,numer)=>numer&&obrys.left<portySzafy[numer-1].right))kolizje.push('Porty RACK nachodzą na siebie');
    const wys=selektor=>{const e=document.querySelector(selektor);return e?e.getBoundingClientRect().height:null;};
    const wysokosci={port:wys('#central-device .speed-port--'+technologia),mini:wys('#plans .mini-interface--'+technologia),urzadzenie:wys('#central-device .device-shell'),terminal:wys('#plans .card-terminal')};
    return {szerokosc:innerWidth,technologia,wysokosci,centralny:rozmiar('#central-device '+klasa),karta:rozmiar('#plans '+klasa),tabela:rozmiar(`#comparison-${technologia} .compare-head-port`),dioda:rozmiar('#central-device .port-leds i'),portySzafy:portySzafy.length,przeskalowanePorty,kolizje,przepelnienie:document.documentElement.scrollWidth-innerWidth};
   },{technologia,etap});
   pomiary.push(pomiar);
   if(etap!=='przed'){
    // Regresja proporcji: FIBER nie wraca do 164/120/154 px ani nie rozciąga urządzenia ponad LAN.
    const w=pomiar.wysokosci;
    if(technologia==='FIBER'){
     assert.ok(w.port<=120&&w.mini<=60&&w.terminal<=150&&w.urzadzenie<=270,'Nadmierne wysokosci FIBER: '+JSON.stringify(w));
     const lan=pomiary.find(p=>p.technologia==='LAN'&&p.szerokosc===pomiar.szerokosc).wysokosci;
     assert.ok(Math.abs(w.port-lan.port)/lan.port<=.1,`Ramka portu FIBER/LAN przy ${szerokosc}px: ${w.port}/${lan.port}`);
     assert.ok(Math.abs(w.mini-lan.mini)/lan.mini<=.1,`Ramka karty FIBER/LAN przy ${szerokosc}px: ${w.mini}/${lan.mini}`);
    }
   }
   if(etap!=='przed'){
    assert.deepEqual(pomiar.kolizje,[],JSON.stringify(pomiar));assert.equal(pomiar.przepelnienie,0);
    assert.equal(pomiar.portySzafy,5);
    assert.equal(pomiar.przeskalowanePorty,0,'Wymiary portów nie są pomniejszane przez stare scale()');
    assert.deepEqual(pomiar.karta,technologia==='LAN'?{szerokosc:42,wysokosc:39}:{szerokosc:45,wysokosc:38});
    if(szerokosc>=768)assert.deepEqual(pomiar.centralny,technologia==='LAN'?{szerokosc:50,wysokosc:45}:{szerokosc:50,wysokosc:42});
   }
   if([390,1440].includes(szerokosc)){
    const id=technologia==='LAN'?'LAN-40M':'FIBER-100M';
    for(const stan of ['nieaktywny','aktywny']){
     if(stan==='aktywny'){
      await strona.locator(`[data-select-plan="${id}"]`).click();
      await strona.waitForFunction(id=>document.querySelector(`[data-port-plan-id="${id}"]`).dataset.link==='connected',id);
      await strona.waitForTimeout(300);
     }
     await strona.evaluate(()=>{
      for(const element of document.querySelectorAll('.port-leds i:last-child,.rj-link,.fiber-activity'))for(const animacja of element.getAnimations()){animacja.pause();animacja.currentTime=Number(animacja.effect.getTiming().duration)*.9;}
     });
     for(const [nazwa,selektor] of Object.entries({urzadzenie:'#central-area',karta:`[data-plan-id="${id}"] .card-terminal`,tabela:`#comparison-${technologia} .plan-head:has([data-led-pakiet="${id}"])`,rack:'.rack-box'})){
      await strona.locator(selektor).first().screenshot({path:`${katalog}/${technologia}-${szerokosc}-${stan}-${nazwa}.png`});
     }
    }
    await strona.locator('.device-tech-tabs [data-technology="AIR"]').click();
    await strona.waitForFunction(()=>!document.querySelector('[data-link="connected"]'));
   }
  }
  await strona.close();
 }
 assert.deepEqual(bledy,[]);
}finally{
 await writeFile(`${katalog}/pomiary.json`,JSON.stringify({pomiary,bledy},null,2)+'\n');
 await przegladarka?.close();serwer.kill();
}
console.log(`PASS porty ${etap}: ${pomiary.length} pomiarów, porównania LAN/FIBER, karty, tabele i RACK`);
