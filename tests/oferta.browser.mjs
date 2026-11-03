import {wybierzPort,poczekajNaSerwer,uruchomPrzegladarke} from './srodowisko.mjs';
/* Etap 04: rzeczywiste CTA, sześć szerokości, dotyk, klawiatura i ruch. */
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {spawn,execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';

const katalog='test-results/integracja-home-v3/04';
await mkdir(katalog,{recursive:true});
const port=await wybierzPort('MADNET_PORT_OFERTY');
const adres=`http://127.0.0.1:${port}`;
const strony=['internet','monitoring-alarmy','sieci-it','strony-www-hosting','instalacje-tv-sat'];
const wyniki=[],bledy=[],konsola=[],zasoby=[],cele=[];
const zdarzeniaSieci=[],aktywne=new Map(),stanStron=new Map();
const faza={plik:null,szerokosc:null,href:null,scenariusz:'start'};
const zapis=(typ,dane={})=>zdarzeniaSieci.push({czas:new Date().toISOString(),typ,...faza,...dane});
const identyfikatory=new WeakMap();let numerZadania=0;
const daneZadania=zadanie=>{
  if(!identyfikatory.has(zadanie))identyfikatory.set(zadanie,++numerZadania);
  return {id:identyfikatory.get(zadanie),url:zadanie.url(),metoda:zadanie.method(),resourceType:zadanie.resourceType()};
};
const serwer=spawn(process.execPath,['scripts/serve.mjs','--root','dist','--no-live'],{env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});
let serwerZakonczony=false;
serwer.stdout.on('data',dane=>zapis('serwer-stdout',{tekst:String(dane)}));
serwer.stderr.on('data',dane=>zapis('serwer-stderr',{tekst:String(dane)}));
serwer.on('exit',(kod,sygnal)=>{serwerZakonczony=true;zapis('serwer-exit',{kod,sygnal});});
serwer.on('error',blad=>{serwerZakonczony=true;zapis('serwer-error',{blad:blad.message});});
let przegladarka,wersjaPrzegladarki;
const obserwuj=(strona,kontekst)=>{
  const stan={kontekst,urlStrony:strona.url(),poprzedniUrl:null,viewport:strona.viewportSize(),zamknieta:false};stanStron.set(strona,stan);
  strona.on('framenavigated',ramka=>{if(ramka===strona.mainFrame()){stan.poprzedniUrl=stan.urlStrony;stan.urlStrony=ramka.url();stan.viewport=strona.viewportSize();zapis('nawigacja',{...stan});}});
  strona.on('close',()=>{stan.zamknieta=true;zapis('strona-close',{...stan});});
  strona.on('request',zadanie=>{
    const dane={...daneZadania(zadanie),...stan,fazaStartu:{...faza}};aktywne.set(zadanie,dane);
    if(process.env.MADNET_DEBUG_NETWORK==='1')zapis('request',dane);
  });
  strona.on('requestfinished',zadanie=>{
    if(process.env.MADNET_DEBUG_NETWORK==='1')zapis('requestfinished',{...aktywne.get(zadanie),...daneZadania(zadanie)});
    aktywne.delete(zadanie);
  });
  strona.on('requestfailed',zadanie=>{zapis('requestfailed',{...aktywne.get(zadanie),...daneZadania(zadanie),blad:zadanie.failure()?.errorText});aktywne.delete(zadanie);});
  strona.on('pageerror',blad=>{bledy.push(blad.message);zapis('pageerror',{...stan,blad:blad.message});});
  strona.on('console',wpis=>{if(wpis.type()==='error'){konsola.push(wpis.text());zapis('console-error',{...stan,tekst:wpis.text(),location:wpis.location()});}});
  strona.on('response',odpowiedz=>{if(odpowiedz.status()>=400){zapis('http-error',{...daneZadania(odpowiedz.request()),status:odpowiedz.status(),kontekst});if(odpowiedz.url().startsWith(adres))zasoby.push({url:odpowiedz.url(),status:odpowiedz.status()});}});
};
const przejdz=async(strona,url,opcje)=>{zapis('goto',{url,poprzedniUrl:strona.url(),viewport:strona.viewportSize(),aktywne:[...aktywne.values()]});return strona.goto(url,opcje);};
try{
  await poczekajNaSerwer(serwer);
  przegladarka=await uruchomPrzegladarke(chromium);
  wersjaPrzegladarki=przegladarka.version();
  const kontekst=await przegladarka.newContext({deviceScaleFactor:1,reducedMotion:'reduce'});
  kontekst.on('close',()=>zapis('kontekst-close',{kontekst:'desktop'}));
  await kontekst.route(`${adres}/MAD-NET/**`,async trasa=>{
    const dane={...daneZadania(trasa.request()),cel:trasa.request().url().replace('/MAD-NET/','/'),kontekst:'desktop'};
    try{const odpowiedz=await trasa.fetch({url:dane.cel});zapis('route-fetch',{...dane,status:odpowiedz.status()});await trasa.fulfill({response:odpowiedz});}
    catch(blad){zapis('route-fetch-failed',{...dane,blad:blad.message});throw blad;}
  });
  const strona=await kontekst.newPage();obserwuj(strona,'desktop');
  await przejdz(strona,`${adres}/cennik.html`,{waitUntil:'networkidle'});
  assert.equal(await strona.locator('link[href="./assets/vendor/leaflet/leaflet.css"]').count(),1,'Biblioteka mapy pochodzi z lokalnego wdrożenia');
  assert.equal(await strona.locator('link[href*="unpkg.com"],link[href*="jsdelivr.net"]').count(),0,'Ładowanie cennika nie wymaga CDN');
  const tytuly=new Set(),opisy=new Set();
  for(const plik of strony){
    for(const szerokosc of [320,390,768,1024,1440,1920]){
      Object.assign(faza,{plik,szerokosc,href:null,scenariusz:'uklad-klawiatura'});
      await strona.setViewportSize({width:szerokosc,height:1000});
      assert.equal((await przejdz(strona,`${adres}/${plik}.html`,{waitUntil:'networkidle'})).status(),200);
      await strona.evaluate(()=>document.fonts.ready);
      assert.equal(await strona.locator('h1').count(),1);
      assert.equal(await strona.locator('html').getAttribute('lang'),'pl');
      assert.equal(await strona.locator('.strona-tymczasowa').count(),0);
      assert.equal(await strona.locator('.wspolny-naglowek').count(),1);
      assert.equal(await strona.locator('.wspolna-stopka').count(),1);
      assert.equal(await strona.evaluate(()=>document.documentElement.scrollWidth),szerokosc,`${plik} ${szerokosc}: overflow`);
      const wystajace=await strona.locator('main :is(h1,h2,h3,p,a,figure,svg,details)').evaluateAll(elementy=>elementy.filter(element=>{
        if(element.classList.contains('katalog-pcb'))return false;
        const r=element.getBoundingClientRect();return r.width>0&&(r.left<-.5||r.right>innerWidth+.5);
      }).map(element=>element.outerHTML.slice(0,150)));
      assert.deepEqual(wystajace,[],`${plik} ${szerokosc}: obcięta treść`);
      assert.ok(await strona.locator('main .wspolne-cta').evaluateAll(elementy=>elementy.every(element=>{
        const r=element.getBoundingClientRect(),zakres=document.createRange();zakres.selectNodeContents(element);
        return [...zakres.getClientRects()].every(tekst=>tekst.left>=r.left-1&&tekst.right<=r.right+1&&tekst.top>=r.top-1&&tekst.bottom<=r.bottom+1);
      })),`${plik} ${szerokosc}: tekst CTA wykracza poza przycisk`);
      assert.ok(await strona.locator('img').evaluateAll(elementy=>elementy.every(obraz=>obraz.complete&&obraz.naturalWidth>0)));
      assert.ok(await strona.locator('.katalog-pcb').evaluate(element=>getComputedStyle(element).pointerEvents==='none'));
      assert.ok(await strona.locator('.sygnal,.impuls-katalogu').evaluateAll(elementy=>elementy.every(element=>getComputedStyle(element).animationName==='none')));
      // Kursor pozostaje poza menu podczas niezależnego scenariusza klawiatury.
      await strona.mouse.move(0,0);
      const pytanie=strona.locator('summary').first();
      await pytanie.focus();
      assert.notEqual(await pytanie.evaluate(element=>getComputedStyle(element).outlineStyle),'none');
      await strona.keyboard.press('Enter');
      assert.equal(await pytanie.evaluate(element=>element.parentElement.open),true);
      await strona.keyboard.press('Space');
      assert.equal(await pytanie.evaluate(element=>element.parentElement.open),false);
      await strona.keyboard.press('Tab');
      assert.equal(await pytanie.evaluate(element=>element===document.activeElement),false,'Tab opuszcza FAQ');
      if(szerokosc<=900){
        await strona.locator('#otworz-menu').focus();await strona.keyboard.press('Enter');
      }
      await strona.locator('.rozwijanie-uslug').focus();
      await strona.keyboard.press('Escape');
      assert.equal(await strona.locator('.rozwijanie-uslug').getAttribute('aria-expanded'),'false');
      await strona.keyboard.press('Space');
      assert.equal(await strona.locator('.rozwijanie-uslug').getAttribute('aria-expanded'),'true');
      await strona.keyboard.press('Tab');
      assert.ok(await strona.locator('.lista-uslug a').first().evaluate(element=>element===document.activeElement));
      await strona.keyboard.press('Escape');
      if(szerokosc<=900)await strona.keyboard.press('Escape');
      await strona.locator('h1').click();
      await strona.evaluate(()=>scrollTo(0,0));
      await strona.screenshot({path:`${katalog}/${plik}-${szerokosc}.png`,fullPage:true,animations:'disabled'});
      wyniki.push({plik,szerokosc,status:'PASS'});
    }
    tytuly.add(await strona.title());opisy.add(await strona.locator('meta[name="description"]').getAttribute('content'));
    await strona.emulateMedia({reducedMotion:'no-preference'});
    const impuls=strona.locator('.sygnal,.impuls-katalogu').first();
    const przed=await impuls.evaluate(element=>getComputedStyle(element).strokeDashoffset);
    await strona.waitForTimeout(180);
    assert.notEqual(await impuls.evaluate(element=>getComputedStyle(element).strokeDashoffset),przed,`${plik}: ruch sygnału`);
    await strona.emulateMedia({reducedMotion:'reduce'});
    // Klikamy każdą treściową drogę wyjścia, nie tylko sprawdzamy href.
    const linki=await strona.locator('main a').evaluateAll(elementy=>[...new Set(elementy.map(element=>element.getAttribute('href')))]);
    for(const href of linki){
      Object.assign(faza,{href,scenariusz:'CTA'});
      await przejdz(strona,`${adres}/${plik}.html`);
      zapis('klik-CTA',{url:strona.url(),href});
      await strona.locator(`main a[href="${href}"]`).first().click();
      const cel=new URL(href,`${adres}/${plik}.html`);
      await strona.waitForURL(cel.href);
      if(cel.hash)assert.equal(await strona.locator(`[id="${cel.hash.slice(1)}"]`).count(),1);
      if(cel.search){
        const technologia=cel.searchParams.get('technologia');
        assert.equal(await strona.locator(`.device-tech-tabs button[data-technology="${technologia}"]`).getAttribute('aria-pressed'),'true');
        assert.equal(await strona.locator('#plans .plan').count(),technologia==='FIBER'?3:5);
      }
      cele.push({plik,href,status:'PASS'});
    }
    faza.scenariusz='prefiks-MAD-NET';
    await przejdz(strona,`${adres}/MAD-NET/${plik}.html`,{waitUntil:'networkidle'});
    assert.equal(await strona.locator('.oferta-hero').count(),1);
    assert.ok(await strona.locator('img').evaluateAll(elementy=>elementy.every(obraz=>obraz.complete&&obraz.naturalWidth>0)));
    console.log(`PASS ${plik}: 6 szerokości, FAQ/klawiatura, animacja/reduced motion, CTA, /MAD-NET/`);
  }
  assert.equal(tytuly.size,5);assert.equal(opisy.size,5);
  for(const wartosc of ['BRAK','lan','<script>']){
    Object.assign(faza,{plik:'cennik',href:wartosc,scenariusz:'nieznana-technologia'});
    await przejdz(strona,`${adres}/cennik.html?technologia=${encodeURIComponent(wartosc)}`);
    assert.equal(await strona.locator('.device-tech-tabs button[data-technology="FIBER"]').getAttribute('aria-pressed'),'true','Nieznana technologia zachowuje wybór domyślny');
  }
  const dotyk=await przegladarka.newContext({viewport:{width:390,height:650},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  dotyk.on('close',()=>zapis('kontekst-close',{kontekst:'mobile'}));
  const telefon=await dotyk.newPage();obserwuj(telefon,'mobile');
  for(const plik of strony){
    Object.assign(faza,{plik,szerokosc:390,href:null,scenariusz:'dotyk'});
    await przejdz(telefon,`${adres}/${plik}.html`);
    await telefon.locator('#otworz-menu').tap();await telefon.locator('.rozwijanie-uslug').tap();
    assert.equal(await telefon.locator('.rozwijanie-uslug').getAttribute('aria-expanded'),'true');
    const r=await telefon.locator('#nawigacja').boundingBox();assert.ok(r.y+r.height<=651);
    await telefon.locator('#otworz-menu').tap();
    await telefon.locator('summary').first().tap();
    assert.equal(await telefon.locator('details').first().evaluate(element=>element.open),true);
    zapis('tap-CTA',{url:telefon.url()});await telefon.locator('.oferta-hero .wspolne-cta').tap();
    await telefon.waitForURL(new URL(plik==='internet'?'./cennik.html#cennik':'./kontakt.html',`${adres}/${plik}.html`).href);
  }
  zapis('zamykanie-mobile',{aktywne:[...aktywne.values()],strony:[...stanStron.values()]});await dotyk.close();
  assert.deepEqual(bledy,[]);assert.deepEqual(konsola,[]);assert.deepEqual(zasoby,[]);
  console.log('PASS pięć stron: 30 układów, dotyk/klawiatura, CTA, brak błędów JS/konsoli/HTTP');
}finally{
  await writeFile(`${katalog}/wyniki.json`,JSON.stringify({wyniki,cele,bledy,konsola,zasoby},null,2));
  faza.scenariusz='sprzatanie';zapis('zamykanie',{aktywne:[...aktywne.values()],strony:[...stanStron.values()],serwerExit:serwer.exitCode});
  await przegladarka?.close();
  const wyjscie=new Promise(zakoncz=>serwerZakonczony?zakoncz():serwer.once('exit',zakoncz));serwer.kill();await wyjscie;
  await mkdir('test-results/finalizacja',{recursive:true});
  await writeFile('test-results/finalizacja/oferta-network.json',JSON.stringify({sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),shaZdarzenia:process.env.GITHUB_SHA||null,platforma:process.platform,wersjaPrzegladarki,zdarzeniaSieci},null,2));
}
