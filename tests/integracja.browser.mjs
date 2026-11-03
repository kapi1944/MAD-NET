/* Wspólna kontrola dziewięciu stron lokalnie i pod rzeczywistym adresem Pages. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {wybierzPort,poczekajNaSerwer,uruchomPrzegladarke} from './srodowisko.mjs';

const publiczny=process.env.MADNET_ADRES;
const katalog=`test-results/integracja/${publiczny?'produkcja':'lokalnie'}`;
const strony=['index.html','cennik.html','uslugi.html','kontakt.html','internet.html','monitoring-alarmy.html','sieci-it.html','strony-www-hosting.html','instalacje-tv-sat.html'];
const szerokosci=publiczny?[390,768,1440,1920]:[320,390,768,1024,1440,1920];
const port=publiczny?null:await wybierzPort('MADNET_PORT_INTEGRACJI');
const adres=publiczny||`http://127.0.0.1:${port}/`;
const serwer=publiczny?null:spawn(process.execPath,['scripts/serve.mjs','--root','dist','--no-live'],{env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});
const wyniki=[],bledy=[],zasoby=new Map(),zadania=[];
let przegladarka;
await mkdir(katalog,{recursive:true});
const skrot=bajty=>createHash('sha256').update(bajty).digest('hex');
const normalizuj=(bajty,plik)=>/\.(html|css|js|svg)$/.test(plik)?Buffer.from(bajty.toString().replaceAll('\r\n','\n')):bajty;
try{
 if(serwer)await poczekajNaSerwer(serwer);
 przegladarka=await uruchomPrzegladarke();
 const kontekst=await przegladarka.newContext({deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
 const strona=await kontekst.newPage();
 strona.on('pageerror',blad=>bledy.push({typ:'JS',tresc:blad.message}));
 strona.on('console',wpis=>{if(wpis.type()==='error')bledy.push({typ:'konsola',tresc:wpis.text(),url:wpis.location().url});});
 strona.on('requestfailed',zadanie=>bledy.push({typ:'sieć',url:zadanie.url(),blad:zadanie.failure()?.errorText}));
 strona.on('response',odpowiedz=>{
  if(!odpowiedz.url().startsWith(adres))return;
  const plik=decodeURIComponent(new URL(odpowiedz.url()).pathname.slice(new URL(adres).pathname.length));
  if(!plik||zasoby.has(plik))return;
  zasoby.set(plik,{status:odpowiedz.status()});
  zadania.push((async()=>{
   assert.equal(odpowiedz.status(),200,plik);
   const pobrane=normalizuj(await odpowiedz.body(),plik),lokalne=normalizuj(await readFile('dist/'+plik),plik);
   assert.equal(skrot(pobrane),skrot(lokalne),'Wersja opublikowanego zasobu: '+plik);
   zasoby.set(plik,{status:200,sha256:skrot(pobrane),cache:odpowiedz.headers()['cache-control']||null});
  })().catch(blad=>bledy.push({typ:'zasób',plik,tresc:blad.message})));
 });
 for(const plik of strony)for(const szerokosc of szerokosci){
  await strona.setViewportSize({width:szerokosc,height:1000});
  assert.equal((await strona.goto(adres+plik,{waitUntil:'networkidle'})).status(),200,plik);
  await strona.evaluate(()=>document.fonts.ready);
  await strona.evaluate(async()=>{
   for(let y=0;y<document.documentElement.scrollHeight;y+=800){
    scrollTo({top:y,behavior:'instant'});await new Promise(zakoncz=>setTimeout(zakoncz,30));
   }
   scrollTo({top:0,behavior:'instant'});
  });
  await strona.waitForFunction(()=>[...document.images].every(obraz=>obraz.complete&&obraz.naturalWidth>0));
  assert.equal(await strona.locator('.wspolny-naglowek').count(),1,plik);
  assert.equal(await strona.locator('.wspolna-stopka').count(),1,plik);
  assert.equal(await strona.evaluate(()=>document.documentElement.scrollWidth),szerokosc,`${plik} ${szerokosc}: overflow`);
  const wystajace=await strona.locator('main h1,main h2,main h3,main p').evaluateAll(elementy=>elementy.filter(element=>{
   const r=element.getBoundingClientRect();if(r.width<=1)return false;
   const zakres=document.createRange();zakres.selectNodeContents(element);
   return [r,...zakres.getClientRects()].some(fragment=>fragment.left<-.5||fragment.right>innerWidth+.5);
  }).map(element=>element.textContent.trim().slice(0,100)));
  assert.deepEqual(wystajace,[],`${plik} ${szerokosc}: przycięta treść`);
  assert.ok(await strona.locator('main .wspolne-cta').evaluateAll(elementy=>elementy.every(element=>{
   const r=element.getBoundingClientRect(),zakres=document.createRange();zakres.selectNodeContents(element);
   return [...zakres.getClientRects()].every(tekst=>tekst.left>=r.left-1&&tekst.right<=r.right+1&&tekst.top>=r.top-1&&tekst.bottom<=r.bottom+1);
  })),`${plik} ${szerokosc}: tekst CTA poza przyciskiem`);
  await strona.mouse.move(0,0);
  if(szerokosc<=768){
   await strona.locator('#otworz-menu').focus();await strona.keyboard.press('Enter');
   assert.equal(await strona.locator('#otworz-menu').getAttribute('aria-expanded'),'true');
   await strona.keyboard.press('Escape');
   assert.equal(await strona.locator('#otworz-menu').getAttribute('aria-expanded'),'false');
  }
  await strona.screenshot({path:`${katalog}/${plik.replace('.html','')}-${szerokosc}.png`,animations:'disabled'});
  wyniki.push({plik,szerokosc,status:'PASS'});
  console.log('PASS dziewięć stron:',plik,szerokosc);
 }
 await Promise.all(zadania);
 assert.deepEqual(bledy,[],'Błędy JS, sieci lub niezgodne zasoby');
}finally{
 await writeFile(katalog+'/wyniki.json',JSON.stringify({adres,wyniki,bledy,zasoby:Object.fromEntries(zasoby)},null,2));
 await przegladarka?.close();serwer?.kill();
}
