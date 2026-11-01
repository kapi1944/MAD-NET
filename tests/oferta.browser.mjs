/* Etap 04: rzeczywiste CTA, sześć szerokości, dotyk, klawiatura i ruch. */
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright-core';

const katalog='test-results/integracja-home-v3/04';
await mkdir(katalog,{recursive:true});
const port=process.env.MADNET_PORT_OFERTY||'4187';
const adres=`http://127.0.0.1:${port}`;
const strony=['internet','monitoring-alarmy','sieci-it','strony-www-hosting','instalacje-tv-sat'];
const wyniki=[],bledy=[],konsola=[],zasoby=[],cele=[];
const serwer=spawn(process.execPath,['scripts/serve.mjs','--root','dist','--no-live'],{env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});
let przegladarka;
const obserwuj=strona=>{
  strona.on('pageerror',blad=>bledy.push(blad.message));
  strona.on('console',wpis=>{if(wpis.type()==='error')konsola.push(wpis.text())});
  strona.on('response',odpowiedz=>{if(odpowiedz.url().startsWith(adres)&&odpowiedz.status()>=400)zasoby.push({url:odpowiedz.url(),status:odpowiedz.status()})});
};
try{
  await new Promise((gotowe,odrzuc)=>{
    const zegar=setTimeout(()=>odrzuc(new Error('Brak podglądu oferty')),8000);
    serwer.stdout.on('data',dane=>{if(String(dane).includes('MAD-NET PREVIEW')){clearTimeout(zegar);gotowe()}});
    serwer.stderr.on('data',dane=>{clearTimeout(zegar);odrzuc(new Error(String(dane)))});
    serwer.once('error',odrzuc);
  });
  przegladarka=await chromium.launch({headless:true,...(process.env.MADNET_PRZEGLADARKA?{executablePath:process.env.MADNET_PRZEGLADARKA}:process.platform==='win32'?{channel:'msedge'}:{})});
  const kontekst=await przegladarka.newContext({deviceScaleFactor:1,reducedMotion:'reduce'});
  await kontekst.route(`${adres}/MAD-NET/**`,async trasa=>trasa.fulfill({response:await trasa.fetch({url:trasa.request().url().replace('/MAD-NET/','/')})}));
  const strona=await kontekst.newPage();obserwuj(strona);
  const tytuly=new Set(),opisy=new Set();
  for(const plik of strony){
    for(const szerokosc of [320,390,768,1024,1440,1920]){
      await strona.setViewportSize({width:szerokosc,height:1000});
      assert.equal((await strona.goto(`${adres}/${plik}.html`,{waitUntil:'networkidle'})).status(),200);
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
      await strona.goto(`${adres}/${plik}.html`);
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
    await strona.goto(`${adres}/MAD-NET/${plik}.html`,{waitUntil:'networkidle'});
    assert.equal(await strona.locator('.oferta-hero').count(),1);
    assert.ok(await strona.locator('img').evaluateAll(elementy=>elementy.every(obraz=>obraz.complete&&obraz.naturalWidth>0)));
    console.log(`PASS ${plik}: 6 szerokości, FAQ/klawiatura, animacja/reduced motion, CTA, /MAD-NET/`);
  }
  assert.equal(tytuly.size,5);assert.equal(opisy.size,5);
  for(const wartosc of ['BRAK','lan','<script>']){
    await strona.goto(`${adres}/cennik.html?technologia=${encodeURIComponent(wartosc)}`);
    assert.equal(await strona.locator('.device-tech-tabs button[data-technology="FIBER"]').getAttribute('aria-pressed'),'true','Nieznana technologia zachowuje wybór domyślny');
  }
  const dotyk=await przegladarka.newContext({viewport:{width:390,height:650},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const telefon=await dotyk.newPage();obserwuj(telefon);
  for(const plik of strony){
    await telefon.goto(`${adres}/${plik}.html`);
    await telefon.locator('#otworz-menu').tap();await telefon.locator('.rozwijanie-uslug').tap();
    assert.equal(await telefon.locator('.rozwijanie-uslug').getAttribute('aria-expanded'),'true');
    const r=await telefon.locator('#nawigacja').boundingBox();assert.ok(r.y+r.height<=651);
    await telefon.locator('#otworz-menu').tap();
    await telefon.locator('summary').first().tap();
    assert.equal(await telefon.locator('details').first().evaluate(element=>element.open),true);
    await telefon.locator('.oferta-hero .wspolne-cta').tap();
    await telefon.waitForURL(new URL(plik==='internet'?'./cennik.html#cennik':'./kontakt.html',`${adres}/${plik}.html`).href);
  }
  await dotyk.close();
  assert.deepEqual(bledy,[]);assert.deepEqual(konsola,[]);assert.deepEqual(zasoby,[]);
  console.log('PASS pięć stron: 30 układów, dotyk/klawiatura, CTA, brak błędów JS/konsoli/HTTP');
}finally{
  await writeFile(`${katalog}/wyniki.json`,JSON.stringify({wyniki,cele,bledy,konsola,zasoby},null,2));
  await przegladarka?.close();serwer.kill();
}
