/* Etap 03: rzeczywiste linki, klawiatura, dotyk, warstwy i zgodność dawnych URL. */
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright-core';
const katalog='test-results/integracja-home-v3/03/nawigacja';
await mkdir(katalog,{recursive:true});
const port=process.env.MADNET_PORT_NAWIGACJI||'4185';
const adres=`http://127.0.0.1:${port}`;
const strony=['index.html','cennik.html','uslugi.html','kontakt.html','internet.html','monitoring-alarmy.html','sieci-it.html','strony-www-hosting.html','instalacje-tv-sat.html'];
const wyniki=[],linki=[],przekierowania=[],bledy=[],konsola=[];
const serwer=spawn(process.execPath,['scripts/serve.mjs','--root','dist','--no-live'],{env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});
let przegladarka;
const obserwuj=strona=>{
  strona.on('pageerror',blad=>bledy.push(blad.message));
  strona.on('console',wpis=>{if(wpis.type()==='error')konsola.push(wpis.text())});
};
try{
  await new Promise((gotowe,odrzuc)=>{
    const zegar=setTimeout(()=>odrzuc(new Error('Nie uruchomiono podglądu nawigacji')),8000);
    serwer.stdout.on('data',dane=>{if(String(dane).includes('MAD-NET PREVIEW')){clearTimeout(zegar);gotowe()}});
    serwer.stderr.on('data',dane=>{clearTimeout(zegar);odrzuc(new Error(String(dane)))});
    serwer.once('error',odrzuc);
  });
  przegladarka=await chromium.launch({headless:true,args:['--disable-gpu'],...(process.env.MADNET_PRZEGLADARKA?{executablePath:process.env.MADNET_PRZEGLADARKA}:process.platform==='win32'?{channel:'msedge'}:{})});
  const kontekst=await przegladarka.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',deviceScaleFactor:1});
  await kontekst.route(`${adres}/MAD-NET/**`,async trasa=>trasa.fulfill({response:await trasa.fetch({url:trasa.request().url().replace('/MAD-NET/','/')})}));
  const strona=await kontekst.newPage();obserwuj(strona);
  const pobrane=new Map();
  // Kontrola każdego lokalnego celu i fragmentu na dziewięciu zbudowanych stronach.
  for(const plik of strony){
    await strona.goto(`${adres}/${plik}`,{waitUntil:'networkidle'});
    const odnosniki=await strona.locator('a[href]').evaluateAll(elementy=>elementy.map(element=>({tekst:element.innerText.trim(),href:element.getAttribute('href')})));
    for(const odnosnik of odnosniki){
      assert.notEqual(odnosnik.href,'#',`${plik}: atrapa linku`);
      assert.ok(!odnosnik.href.includes('kapi1944.github.io'),`${plik}: stary host w nawigacji`);
      const cel=new URL(odnosnik.href,`${adres}/${plik}`);
      if(cel.origin!==adres)continue;
      if(!pobrane.has(cel.pathname)){
        const odpowiedz=await kontekst.request.get(`${adres}${cel.pathname}`);
        assert.equal(odpowiedz.status(),200,`${plik}: martwy link ${cel.href}`);
        pobrane.set(cel.pathname,await odpowiedz.text());
      }
      if(cel.hash)assert.ok(pobrane.get(cel.pathname).includes(`id="${decodeURIComponent(cel.hash.slice(1))}"`),`${plik}: brak ${cel.hash}`);
      linki.push({zrodlo:plik,...odnosnik,cel:cel.pathname+cel.hash,status:200});
    }
    assert.equal(await strona.locator('.wspolny-naglowek').count(),1);
    assert.equal(await strona.locator('.wspolna-stopka').count(),1);
    assert.equal(await strona.locator('.wspolne-logo img').first().getAttribute('src'),'./assets/img/mad-net-logo.png');
    if(plik==='kontakt.html')assert.match(await strona.locator('.tymczasowa-informacja').innerText(),/Strona tymczasowa/i);
  }
  console.log(`PASS linki: ${linki.length} lokalnych odnośników, ${pobrane.size} celów HTTP 200 i istniejące fragmenty`);
  for(const szerokosc of [390,768,1440,1920])for(const plik of ['index.html','cennik.html','uslugi.html']){
    await strona.setViewportSize({width:szerokosc,height:1000});
    await strona.goto(`${adres}/${plik}`,{waitUntil:'networkidle'});
    assert.equal(await strona.evaluate(()=>document.documentElement.scrollWidth),szerokosc,`${plik}: overflow`);
    if(plik==='uslugi.html'){
      assert.equal(await strona.locator('.baner-uslugi').count(),5);
      assert.ok(await strona.locator('.katalog-pcb').evaluateAll(elementy=>elementy.every(element=>getComputedStyle(element).pointerEvents==='none')));
      assert.ok(await strona.locator('.impuls-katalogu').evaluateAll(elementy=>elementy.every(element=>getComputedStyle(element).animationName==='none')));
    }
    await strona.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=850){scrollTo(0,y);await new Promise(koniec=>setTimeout(koniec,25))}scrollTo(0,0)});
    await strona.waitForFunction(()=>[...document.images].every(obraz=>obraz.complete&&obraz.naturalWidth>0));
    await strona.screenshot({path:`${katalog}/${plik.replace('.html','')}-${szerokosc}.png`,fullPage:true,animations:'disabled'});
    const mobilne=szerokosc<=900;
    if(mobilne)await strona.locator('#otworz-menu').click();
    else{
      await strona.locator('.menu-uslugi>a').hover();
      assert.equal(await strona.locator('.rozwijanie-uslug').getAttribute('aria-expanded'),'true');
      const trafienie=await strona.locator('.lista-uslug a').first().evaluate(element=>{const r=element.getBoundingClientRect();return element.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))});
      assert.ok(trafienie,`${plik}: dropdown pod warstwą treści`);
      if(plik==='index.html'){
        await strona.locator('#mapa-ramka').evaluate(element=>scrollTo(0,element.getBoundingClientRect().top+scrollY-100));
        assert.ok(await strona.locator('.lista-uslug a').first().evaluate(element=>{const r=element.getBoundingClientRect();return element.contains(document.elementFromPoint(r.x+12,r.y+12))}),'Mapa przykrywa dropdown');
        await strona.evaluate(()=>scrollTo(0,0));
      }
      await strona.keyboard.press('Escape');
      assert.equal(await strona.locator('.rozwijanie-uslug').getAttribute('aria-expanded'),'false','Escape po hover');
    }
    await strona.locator('.menu-glowne>a').first().focus();
    await strona.keyboard.press('Tab');await strona.keyboard.press('Tab');
    assert.equal(await strona.locator('.rozwijanie-uslug').getAttribute('aria-expanded'),'true','Focus na Usługi');
    await strona.keyboard.press('Tab');await strona.keyboard.press('Space');
    assert.equal(await strona.locator('.rozwijanie-uslug').getAttribute('aria-expanded'),'false');
    await strona.keyboard.press('Enter');
    assert.equal(await strona.locator('.rozwijanie-uslug').getAttribute('aria-expanded'),'true');
    await strona.keyboard.press('Tab');
    assert.equal(await strona.evaluate(()=>document.activeElement.closest('.lista-uslug')!==null),true);
    await strona.keyboard.press('Escape');await strona.keyboard.press('Tab');
    assert.equal(await strona.evaluate(()=>document.activeElement.getAttribute('href')),'./index.html#o-nas','Brak pułapki fokusu');
    if(mobilne){await strona.keyboard.press('Escape');assert.equal(await strona.locator('#otworz-menu').getAttribute('aria-expanded'),'false')}
    wyniki.push({plik,szerokosc,klawiatura:true,warstwy:true});
    console.log(`PASS menu ${plik} ${szerokosc}px: hover/focus/Tab/Enter/Space/Escape, bez overflow`);
  }
  await strona.goto(`${adres}/uslugi.html`);
  await strona.emulateMedia({reducedMotion:'no-preference'});
  const impuls=strona.locator('.impuls-katalogu').first();
  const przed=await impuls.evaluate(element=>getComputedStyle(element).strokeDashoffset);
  await strona.waitForTimeout(180);
  assert.notEqual(await impuls.evaluate(element=>getComputedStyle(element).strokeDashoffset),przed);
  await strona.emulateMedia({reducedMotion:'reduce'});
  await strona.locator('.menu-uslugi>a').hover();
  await strona.locator('.menu-uslugi>a').click();
  await strona.waitForURL(`${adres}/uslugi.html`);
  await strona.locator('.menu-glowne>a[href="./kontakt.html"]').click();
  await strona.waitForURL(`${adres}/kontakt.html`);
  assert.match(await strona.locator('.tymczasowa-informacja').innerText(),/Strona tymczasowa/i);
  for(const baza of ['/','/index.html','/MAD-NET/','/MAD-NET/index.html'])for(const fragment of ['cennik','oplaty','kontakt']){
    await strona.goto(`${adres}${baza}#${fragment}`,{waitUntil:'commit'});
    const cel=`${adres}${baza.startsWith('/MAD-NET/')?'/MAD-NET':''}/cennik.html#${fragment}`;
    await strona.waitForURL(cel);await strona.waitForLoadState('networkidle');
    assert.equal(await strona.locator(`#${fragment}`).count(),1);
    przekierowania.push({zrodlo:baza+'#'+fragment,cel:new URL(cel).pathname+'#'+fragment});
  }
  for(const fragment of ['o-nas','nieznany-fragment']){
    await strona.goto(`${adres}/MAD-NET/index.html#${fragment}`,{waitUntil:'networkidle'});
    assert.equal(new URL(strona.url()).pathname,'/MAD-NET/index.html');
  }
  await strona.goto(`${adres}/index.html`);await strona.evaluate(()=>{location.hash='oplaty'});
  await strona.waitForURL(`${adres}/cennik.html#oplaty`);
  console.log('PASS stare URL: 12 przekierowań pod / i /MAD-NET/, hashchange; inne hashe bez przekierowania');
  const dotyk=await przegladarka.newContext({viewport:{width:390,height:480},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const telefon=await dotyk.newPage();obserwuj(telefon);
  await telefon.goto(`${adres}/uslugi.html`);
  await telefon.locator('#otworz-menu').tap();
  const prostokat=await telefon.locator('.menu-uslugi>a').boundingBox();
  const sesja=await dotyk.newCDPSession(telefon);
  const punkt={x:prostokat.x+25,y:prostokat.y+15};
  await sesja.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[punkt]});
  await sesja.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:punkt.x,y:punkt.y-65}]});
  await sesja.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal(await telefon.locator('.rozwijanie-uslug').getAttribute('aria-expanded'),'false','Scroll nie otwiera dropdownu');
  await telefon.locator('.rozwijanie-uslug').tap();
  assert.equal(await telefon.locator('.rozwijanie-uslug').getAttribute('aria-expanded'),'true');
  const granice=await telefon.locator('#nawigacja').boundingBox();
  assert.ok(granice.y+granice.height<=481,'Menu mobilne wykracza poza wysokość ekranu');
  await telefon.screenshot({path:`${katalog}/menu-dotyk-390.png`});
  await telefon.locator('.lista-uslug a[href="./instalacje-tv-sat.html"]').tap();
  await telefon.waitForURL(`${adres}/instalacje-tv-sat.html`);
  assert.equal(await telefon.locator('.oferta-hero h1').count(),1);
  for(const plik of ['index.html','cennik.html']){
    await telefon.goto(`${adres}/${plik}`);
    await telefon.locator('#otworz-menu').tap();await telefon.locator('.rozwijanie-uslug').tap();
    const r=await telefon.locator('#nawigacja').boundingBox();
    assert.ok(r.y+r.height<=481,`${plik}: menu poza niskim ekranem`);
  }
  console.log('PASS dotyk: tap, scroll bez otwierania, niskie menu HOME/cennika/katalogu, działający link usługi');
  await dotyk.close();
  assert.deepEqual(bledy,[]);assert.deepEqual(konsola,[]);
}finally{
  await writeFile(`${katalog}/wyniki.json`,JSON.stringify({wyniki,linki,przekierowania,bledy,konsola},null,2));
  await przegladarka?.close();serwer.kill();
}
