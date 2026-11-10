import {wybierzPort,poczekajNaSerwer,uruchomPrzegladarke} from './srodowisko.mjs';
/* HOME V5: technologie, usługi, mapa i ścisła regresja sekcji poza zakresem. */
import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile, access} from 'node:fs/promises';
import {spawn, execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';

const katalog = 'test-results/home-v5';
await mkdir(katalog, {recursive:true});
const port=await wybierzPort('MADNET_PORT_HOME');
const adres = `http://127.0.0.1:${port}`;
const bazaHero = '201931a';
const oryginal = execFileSync('git', ['show', bazaHero + ':index.html'], {encoding:'utf8'}).replace('./assets/css/home.css', './assets/css/oryginal-home.css').replace('./assets/css/hero.css','./assets/css/oryginal-hero.css');
const oryginalnyCss = execFileSync('git', ['show', bazaHero + ':assets/css/home.css'], {encoding:'utf8'});
const serwer = spawn(process.execPath, ['scripts/serve.mjs', '--root', 'dist', '--no-live'], {
  env:{...process.env, PORT:port}, stdio:['ignore','pipe','pipe'],
});
const wyniki = [], smoke = [], bledy = [], konsola = [], kafelki = new Map(), pomiaryZrzutow=[];
let przegladarka;
let argumentyPrzegladarki=[];

async function przygotuj(strona, url) {
  await strona.goto(url, {waitUntil:'networkidle'});
  await strona.mouse.move(0,0);
  await strona.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach(obraz=>obraz.loading='eager');
    await document.fonts.ready;
    for (let y = 0; y < document.body.scrollHeight; y += 800) {
      scrollTo({top:y,left:0,behavior:'instant'}); await new Promise(koniec => setTimeout(koniec, 30));
    }
    scrollTo({top:0,left:0,behavior:'instant'});
  });
  await strona.waitForFunction(() => [...document.images].every(obraz => obraz.complete && obraz.naturalWidth > 0));
  await strona.evaluate(()=>Promise.all([...document.images].map(obraz=>obraz.decode())));
}

async function porownajPiksele(strona, przed, po) {
  return strona.evaluate(async ([pierwszy, drugi]) => {
    const odczytaj = async kod => {
      const obraz = await createImageBitmap(await (await fetch(`data:image/png;base64,${kod}`)).blob());
      const plotno = document.createElement('canvas'); plotno.width = obraz.width; plotno.height = obraz.height;
      const kontekst = plotno.getContext('2d'); kontekst.drawImage(obraz, 0, 0);
      return {szerokosc:obraz.width, wysokosc:obraz.height, dane:kontekst.getImageData(0, 0, obraz.width, obraz.height).data};
    };
    const a = await odczytaj(pierwszy), b = await odczytaj(drugi);
    if (a.szerokosc !== b.szerokosc || a.wysokosc !== b.wysokosc) return {rozneWymiary:true};
    let roznePiksele = 0, maksymalnaRoznica = 0, lewo=a.szerokosc, prawo=0, gora=a.wysokosc, dol=0;
    for (let i = 0; i < a.dane.length; i += 4) {
      let inny = false;
      for (let j = 0; j < 4; j++) {
        const roznica = Math.abs(a.dane[i+j] - b.dane[i+j]);
        if (roznica) inny = true;
        maksymalnaRoznica = Math.max(maksymalnaRoznica, roznica);
      }
      if (inny) {
        roznePiksele++;const x=(i/4)%a.szerokosc,y=Math.floor(i/4/a.szerokosc);
        lewo=Math.min(lewo,x);prawo=Math.max(prawo,x);gora=Math.min(gora,y);dol=Math.max(dol,y);
      }
    }
    return {szerokosc:a.szerokosc, wysokosc:a.wysokosc, roznePiksele, maksymalnaRoznica,obszar:roznePiksele?{lewo,prawo,gora,dol}:null};
  }, [przed.toString('base64'), po.toString('base64')]);
}

async function zrzutSekcji(strona, selektor) {
  // Ten sam stan wejścia i położenie viewportu w obu porównywanych dokumentach.
  await strona.mouse.move(0,0);
  const cel=await strona.locator(selektor).evaluate(element=>{
    const cel=Math.min(Math.floor(element.getBoundingClientRect().top+scrollY),Math.max(0,document.documentElement.scrollHeight-innerHeight));
    scrollTo({top:cel,left:0,behavior:'instant'});return cel;
  });
  await strona.evaluate(()=>new Promise(koniec=>requestAnimationFrame(()=>requestAnimationFrame(koniec))));
  const pomiar=await strona.locator(selektor).evaluate(element=>{
    const r=element.getBoundingClientRect();
    return {przewiniecie:scrollY,x:r.x,y:r.y,szerokosc:r.width,wysokosc:r.height,zachowanieScroll:getComputedStyle(document.documentElement).scrollBehavior,
      hover:[...document.querySelectorAll(':hover')].map(wezel=>wezel.tagName+'#'+wezel.id+'.'+wezel.className),
      aktywnyElement:document.activeElement?.id||document.activeElement?.tagName};
  });
  assert.ok(Math.abs(pomiar.przewiniecie-cel)<1,'Ustalony viewport zrzutu '+selektor);
  pomiaryZrzutow.push({adres:strona.url(),selektor,cel,...pomiar});
  return strona.locator(selektor).screenshot({animations:'disabled',
    // Mapa online ma niezależną kontrolę geometrii, CSS, treści i interakcji.
    ...(selektor==='.sekcja-obszar'?{mask:[strona.locator('.mapa-otoczenie'),strona.locator('.mapa-ramka')]}:{}),
  });
}

async function zrzutyPozaHero(kontekst,html,szerokosc,styl,selektory,wariant){
  const strona=await kontekst.newPage();
  strona.on('pageerror',blad=>bledy.push(blad.message));
  strona.on('console',wpis=>{if(wpis.type()==='error')konsola.push(wpis.text());});
  try{
    await strona.setViewportSize({width:szerokosc,height:1000});
    const url=`${adres}/porownanie-home-${wariant}.html`;
    // Dotychczasowa normalizacja działa od pierwszego renderowania, bez historii wysokości HERO.
    await strona.route(url,trasa=>trasa.fulfill({body:html.replace('</head>',`<style>${styl}</style></head>`),contentType:'text/html; charset=utf-8'}));
    await przygotuj(strona,url);
    const obrazy=[];
    for(const selektor of selektory)obrazy.push(await zrzutSekcji(strona,selektor));
    return obrazy;
  }finally{await strona.close();}
}

async function geometriaHero(strona) {
  return strona.locator('.sekcja-hero').evaluate(sekcja => {
    const baza = sekcja.getBoundingClientRect();
    return ['h1','.hero-glowne>p','.hero-przyciski','.hero-fotografia','.hero-obraz'].map(selektor => {
      const element = sekcja.querySelector(selektor), r = element.getBoundingClientRect();
      if (!element.getClientRects().length) return {selektor,ukryty:true};
      const styl = getComputedStyle(element);
      return {selektor,x:r.x-baza.x,y:r.y-baza.y,szerokosc:r.width,wysokosc:r.height,font:styl.font,color:styl.color};
    });
  });
}

async function sprawdzHero(strona, szerokosc) {
  const pomiary = await strona.locator('.sekcja-hero').evaluate(sekcja => {
    const prostokat = element => {const r=element.getBoundingClientRect();return {x:r.x,y:r.y,prawa:r.right,dol:r.bottom,szerokosc:r.width,wysokosc:r.height};};
    const tekst=sekcja.querySelector('.hero-glowne'),obraz=sekcja.querySelector('.hero-obraz'),zdjecie=sekcja.querySelector('.hero-latarnia');
    const elementy=[...sekcja.querySelectorAll('h1,.hero-glowne>p,.hero-przyciski a,.zaleta')];
    return {tekst:prostokat(tekst),obraz:prostokat(obraz),zdjecie:{plik:zdjecie.getAttribute('src'),zaladowane:zdjecie.complete&&zdjecie.naturalWidth>0},
      elementy:elementy.map(element=>({...prostokat(element),przewija:element.scrollWidth>element.clientWidth+1})),
      animacja:getComputedStyle(sekcja.querySelector('.pcb-puls')).animationName};
  });
  const kolizja=(a,b)=>a.x<b.prawa&&a.prawa>b.x&&a.y<b.dol&&a.dol>b.y;
  assert.ok(!kolizja(pomiary.tekst,pomiary.obraz),'Fotografia i dekoracje poza tekstem/CTA');
  if(szerokosc<=600)assert.ok(pomiary.obraz.y>=pomiary.tekst.dol,'Na telefonie tekst i CTA przed fotografią');
  assert.equal(pomiary.zdjecie.plik,'./assets/img/home/latarnia-hero.jpg');assert.ok(pomiary.zdjecie.zaladowane);assert.equal(pomiary.animacja,'none');
  for(const element of pomiary.elementy){assert.ok(element.x>=0&&element.prawa<=szerokosc+1,'HERO poza ekranem');assert.ok(!element.przewija,'Tekst/CTA przycięte');}
  for(let numer=1;numer<pomiary.elementy.length;numer++)assert.ok(!kolizja(pomiary.elementy[numer-1],pomiary.elementy[numer]),'Kolizja treści HERO');
  assert.equal(await strona.locator('.hero-boczny,.podpis-lokalny').count(),0);
  assert.equal(await strona.locator('.zaleta').count(),5);
  await strona.locator('.hero-przyciski a').first().focus();
  await strona.keyboard.press('Tab');
  assert.equal(await strona.evaluate(()=>document.activeElement.getAttribute('href')),'./cennik.html#cennik');
  await strona.emulateMedia({reducedMotion:'no-preference'});
  assert.equal(await strona.locator('.sciezki-hero .pcb-puls').evaluate(element=>getComputedStyle(element).animationName),'hero-sygnal');
  const przed=await strona.locator('.sciezki-hero .pcb-puls').evaluate(element=>getComputedStyle(element).strokeDashoffset);
  await strona.waitForTimeout(100);
  assert.notEqual(await strona.locator('.sciezki-hero .pcb-puls').evaluate(element=>getComputedStyle(element).strokeDashoffset),przed);
  await strona.emulateMedia({reducedMotion:'reduce'});
}

async function geometriaCennika(strona) {
  return strona.locator('main').evaluate(main => {
    const baza=main.getBoundingClientRect();
    return ['.hero','.rack-box','#hero-tech-panel','#connection-zone','.device-logo','#plans','#comparison-panel','#availability-form'].map(selektor=>{
      const element=main.querySelector(selektor),r=element.getBoundingClientRect(),styl=getComputedStyle(element);
      return {selektor,x:r.x-baza.x,y:r.y-baza.y,szerokosc:r.width,wysokosc:r.height,font:styl.font,color:styl.color};
    });
  });
}

try {
  await poczekajNaSerwer(serwer);
  przegladarka = await uruchomPrzegladarke(chromium,{args:['--disable-gpu','--disable-skia-runtime-opts','--enable-automation']});
  const sesjaPrzegladarki=await przegladarka.newBrowserCDPSession();
  argumentyPrzegladarki=(await sesjaPrzegladarki.send('Browser.getBrowserCommandLine')).arguments.filter(argument=>['--disable-gpu','--disable-skia-runtime-opts','--enable-automation'].includes(argument));
  await sesjaPrzegladarki.detach();
  const kontekst = await przegladarka.newContext({deviceScaleFactor:1, reducedMotion:'reduce'});
  // Obie strony otrzymują te same bajty prawdziwych kafelków pobranych online.
  await kontekst.route(/https:\/\/(server\.arcgisonline\.com|a\.basemaps\.cartocdn\.com)\//, async trasa => {
    const url = trasa.request().url();
    if (!kafelki.has(url)) kafelki.set(url, (async () => {
      const odpowiedz = await trasa.fetch({maxRetries:2});
      assert.equal(odpowiedz.status(), 200, `Kafelek online: ${url}`);
      return {body:await odpowiedz.body(), contentType:odpowiedz.headers()['content-type'], status:200};
    })());
    await trasa.fulfill(await kafelki.get(url));
  });
  await kontekst.route(`${adres}/assets/css/oryginal-hero.css`, trasa => trasa.fulfill({body:execFileSync('git',['show',bazaHero+':assets/css/hero.css'],{encoding:'utf8'}),contentType:'text/css'}));
  await kontekst.route(`${adres}/assets/css/oryginal-home.css`, trasa => trasa.fulfill({body:oryginalnyCss, contentType:'text/css'}));
  await kontekst.route(`${adres}/oryginal-home-v3.html`, trasa => trasa.fulfill({body:oryginal, contentType:'text/html; charset=utf-8'}));
  // Wzorzec migracji używa aktualnych skryptów: uwzględnia zatwierdzony sprzęt Etapu 05.
  const aktualnyCennik = await readFile('cennik.html','utf8');
  const cennikPrzed = execFileSync('git', ['show', 'a6a146b4fa2bf1d46bbebc38e79f68eaf68f2d9a:index.html'], {encoding:'utf8'})
    .replace(/<link[^>]+href="https:\/\/unpkg.com\/leaflet@1.9.4\/dist\/leaflet.css"[^>]*>/,'<link rel="stylesheet" href="./assets/vendor/leaflet/leaflet.css">')
    .replace('<script src="./assets/js/cennik.js">','<script src="./assets/js/sprzet-fiber.js"></script><script src="./assets/js/cennik.js">')
    .replace('</head>','<link rel="stylesheet" href="./assets/css/sprzet-fiber.css"></head>')
    .replaceAll('SC/UPC','SC/APC')
    .replace(/<p class="compare-sub">[\s\S]*?<\/p>/,aktualnyCennik.match(/<p class="compare-sub">[\s\S]*?<\/p>/)[0]);
  await kontekst.route(`${adres}/oryginal-cennik.html`, trasa => trasa.fulfill({body:cennikPrzed, contentType:'text/html; charset=utf-8'}));
  // Symulacja montowania niezmienionego dist w podkatalogu GitHub Pages.
  await kontekst.route(`${adres}/MAD-NET/**`, async trasa => {
    await trasa.fulfill({response:await trasa.fetch({url:trasa.request().url().replace('/MAD-NET/', '/')})});
  });
  const strona = await kontekst.newPage();
  strona.on('pageerror', blad => bledy.push(blad.message));
  strona.on('console', wpis => {if (wpis.type() === 'error') konsola.push(wpis.text());});
  for (const szerokosc of [320,360,390,430,768,1024,1366,1440,1920]) {
    await strona.setViewportSize({width:szerokosc,height:1000});
    await przygotuj(strona, adres+'/oryginal-home-v3.html');
    await strona.screenshot({path:katalog+'/przed-'+szerokosc+'.png',fullPage:true,animations:'disabled'});
    await przygotuj(strona,adres+'/index.html');
    const kolizjePodpisow=await strona.locator('.napis-mapy').evaluateAll(elementy=>{
      const podpisy=elementy.map(element=>({nazwa:element.textContent,r:element.getBoundingClientRect()}));
      const kolizje=[];
      for(let a=0;a<podpisy.length;a++)for(let b=a+1;b<podpisy.length;b++){
        const pierwszy=podpisy[a].r,drugi=podpisy[b].r;
        if(pierwszy.left<drugi.right&&pierwszy.right>drugi.left&&pierwszy.top<drugi.bottom&&pierwszy.bottom>drugi.top)kolizje.push([podpisy[a].nazwa,podpisy[b].nazwa]);
      }
      return kolizje;
    });
    assert.deepEqual(kolizjePodpisow,[],'Brak kolizji podpisów mapy '+szerokosc);
    assert.ok(await strona.locator('.mapa-gps-badge').evaluate(element=>{
      const podpis=element.getBoundingClientRect(),kontrolki=document.querySelector('.mapa-kontrolki').getBoundingClientRect();
      return podpis.right<=kontrolki.left||podpis.left>=kontrolki.right||podpis.bottom<=kontrolki.top||podpis.top>=kontrolki.bottom;
    }),'Oznaczenie GPS poza przyciskami mapy');
    await sprawdzHero(strona,szerokosc);
    await strona.evaluate(()=>document.activeElement?.blur());
    const geometriaPo=await geometriaHero(strona);
    wyniki.push({strona:'HOME V5',szerokosc,geometriaPo});
    await strona.screenshot({path:katalog+'/po-'+szerokosc+'.png',fullPage:true,animations:'disabled'});
    await strona.locator('.sekcja-hero').screenshot({path:katalog+'/hero-'+szerokosc+'.png',animations:'disabled'});
    const stylSekcji='.wspolny-naglowek{visibility:hidden!important}.sekcja-hero,.sekcja-technologie,.sekcja-uslugi,.sekcja-obszar{display:none!important}';
    for(const selektor of ['.sekcja-powody','.sekcja-proces','.sekcja-relacje','.sekcja-kontakt','.wspolna-stopka']){
      const [przed]=await zrzutyPozaHero(kontekst,oryginal,szerokosc,stylSekcji,[selektor],'v4');
      const [po]=await zrzutyPozaHero(kontekst,await readFile('dist/index.html','utf8'),szerokosc,stylSekcji,[selektor],'v5');
      const porownanie=await porownajPiksele(strona,przed,po);
      assert.equal(porownanie.rozneWymiary,undefined,selektor);
      assert.equal(porownanie.roznePiksele,0,selektor+' regresja '+szerokosc);
      wyniki.push({strona:selektor,szerokosc,porownanie});
      if(szerokosc===1440&&selektor==='.sekcja-powody'){
        const [kontrola]=await zrzutyPozaHero(kontekst,await readFile('dist/index.html','utf8'),szerokosc,stylSekcji+'.sekcja-powody h2{color:#00ff00!important}',[selektor],'kontrola');
        assert.ok((await porownajPiksele(strona,przed,kontrola)).roznePiksele>0,'Porównanie wykrywa zmianę koloru treści');
      }
    }
    assert.equal(await strona.locator('.technologia-karta').count(),3);
    assert.equal(await strona.locator('.hero-infrastruktura,.hero-panel,[data-home-technologia],[data-rack-technologia]').count(),0,'HOME bez RACK i panelu technologii');
    const kolizje=await strona.locator('.technologia-karta,.karta-uslugi').evaluateAll(karty=>karty.flatMap(karta=>{
      const obszar=karta.getBoundingClientRect();
      return [...karta.querySelectorAll('h3,p,a')].filter(element=>{
        const r=element.getBoundingClientRect();return r.left<obszar.left-1||r.right>obszar.right+1||element.scrollWidth>element.clientWidth+1;
      }).map(element=>element.textContent);
    }));
    assert.deepEqual(kolizje,[],'Czytelne karty '+szerokosc);
    assert.equal(await strona.locator('.karta-uslugi').count(), 5);
    assert.equal(await strona.evaluate(() => document.documentElement.scrollWidth), szerokosc);
    assert.equal(await strona.locator('.pcb-ornament').count(), 6);
    assert.ok(await strona.locator('.pcb-iskra').evaluateAll(elementy => elementy.every(element => getComputedStyle(element).animationName === 'none')));
    assert.ok(await strona.locator('.pcb-ornament').evaluateAll(elementy => elementy.every(element => getComputedStyle(element).pointerEvents === 'none')));
    if (szerokosc < 781) {
      await strona.locator('#otworz-menu').focus(); await strona.keyboard.press('Enter');
      assert.equal(await strona.locator('#otworz-menu').getAttribute('aria-expanded'), 'true');
      await strona.keyboard.press('Escape');
      assert.equal(await strona.locator('#otworz-menu').getAttribute('aria-expanded'), 'false');
    }
    const celeKart = ['internet.html','monitoring-alarmy.html','sieci-it.html','strony-www-hosting.html','instalacje-tv-sat.html'];
    for (let numer = 0; numer < celeKart.length; numer++) {
      const karta = strona.locator('.karta-uslugi').nth(numer);
      assert.equal(await karta.locator('.zdjecie-uslugi').getAttribute('href'), `./${celeKart[numer]}`);
      assert.equal(await karta.locator('.link-karty').getAttribute('href'), `./${celeKart[numer]}`);
    }
    assert.equal(await strona.locator('#modal-tlo').count(), 0);
    assert.equal(await strona.locator('.hero-przyciski a').last().getAttribute('href'), './cennik.html#cennik');
    await strona.locator('.miejscowosci-przyciski [data-miasto="Rewal"]').click();
    assert.equal(await strona.locator('#wybrane-miasto').innerText(), 'Rewal');
    assert.match(await strona.locator('#wybrane-wspolrzedne').innerText(), /54\.08207/);
    for(const miasto of ['Trzebiatów','Mrzeżyno','Rogowo','Rewal','Niechorze','Pogorzelica','Pobierowo']){
      const przycisk=strona.locator('.miejscowosci-przyciski [data-miasto="'+miasto+'"]');
      await przycisk.focus();await strona.keyboard.press('Enter');
      assert.equal(await strona.locator('#wybrane-miasto').innerText(),miasto);
      assert.equal(await przycisk.getAttribute('aria-pressed'),'true');
    }
    await strona.locator('#mapa-dark').click();
    await strona.waitForFunction(() => [...document.querySelectorAll('.mapa-kafelek')].every(obraz => obraz.complete && obraz.naturalWidth > 0));
    assert.equal(await strona.locator('#mapa-dark').getAttribute('aria-pressed'), 'true');
    assert.match(await strona.locator('.mapa-kafelek').first().getAttribute('src'), /cartocdn/);
    await strona.locator('#mapa-satelita').click();
    await strona.waitForFunction(() => [...document.querySelectorAll('.mapa-kafelek')].every(obraz => obraz.complete && obraz.naturalWidth > 0));
    assert.equal(await strona.locator('#mapa-satelita').getAttribute('aria-pressed'), 'true');
    const pozycja = () => strona.locator('[data-mapa-miasto="Trzebiatów"]').getAttribute('style');
    const przedZoom = await pozycja();
    await strona.locator('#mapa-przybliz').click(); assert.notEqual(await pozycja(), przedZoom);
    await strona.locator('#mapa-oddal').click(); await strona.locator('#mapa-widok').click();
    await strona.emulateMedia({reducedMotion:'no-preference'});
    const impuls = strona.locator('.pcb-iskra').first();
    assert.equal(await impuls.evaluate(element => getComputedStyle(element).animationName), 'pcb-przeplyw');
    const przedRuchem = await impuls.evaluate(element => getComputedStyle(element).strokeDashoffset);
    await strona.waitForTimeout(150);
    assert.notEqual(await impuls.evaluate(element => getComputedStyle(element).strokeDashoffset), przedRuchem);
    await strona.emulateMedia({reducedMotion:'reduce'});
    console.log(`PASS HOME ${szerokosc}px: HOME V5 bez kolizji; 5 sekcji zgodnych pikselowo; technologie/mapa/PCB/linki`);
  }
  for (const szerokosc of [390, 768, 1024, 1440, 1920]) {
    await strona.setViewportSize({width:szerokosc, height:1000});
    await strona.mouse.move(0, 0);
    await przygotuj(strona, `${adres}/oryginal-cennik.html`);
    // Świadoma korekta geometrii HERO obowiązuje także historyczny wzorzec.
    // Porównanie nadal jest ścisłe dla wszystkich wymiarów i reszty cennika.
    await strona.addStyleTag({content:`
      @media(max-width:1230px){
        .hero-tech-panel{height:auto;min-height:236px;overflow:visible}
        .hero-tech-panel-content{min-height:min-content;grid-template-rows:42px minmax(min-content,1fr) auto}
        .hero-tech-panel p{min-height:4.95em}
      }
      @media(max-width:800px){.hero-tech-panel{min-height:274px}}
      @media(min-width:1231px){.hero-tech-panel p{min-height:6.4em}.hero-tech-facts strong{min-height:2.8em}}
      #plans .specs{display:flex;flex-wrap:wrap}
      #plans .specs>.spec{flex:1 0 auto;min-width:min-content}
    `});
    const geometriaPrzed=await geometriaCennika(strona);
    const przed = await strona.locator('main').screenshot({path:`${katalog}/cennik-przed-${szerokosc}.png`, animations:'disabled', style:'.nav,.wspolny-naglowek,.foot,.wspolna-stopka{visibility:hidden!important}'});
    await przygotuj(strona, `${adres}/cennik.html`);
    const geometriaPo=await geometriaCennika(strona);
    const po = await strona.locator('main').screenshot({path:`${katalog}/cennik-po-${szerokosc}.png`, animations:'disabled', style:'.nav,.wspolny-naglowek,.foot,.wspolna-stopka{visibility:hidden!important}'});
    const porownanie = await porownajPiksele(strona, przed, po);
    wyniki.push({strona:'cennik', szerokosc, porownanie, geometriaPrzed, geometriaPo});
    assert.equal(porownanie.rozneWymiary, undefined);
    for(let numer=0;numer<geometriaPrzed.length;numer++){
      for(const pole of ['x','y','szerokosc','wysokosc'])assert.ok(Math.abs(geometriaPrzed[numer][pole]-geometriaPo[numer][pole])<0.01,`Geometria cennika ${szerokosc}: ${geometriaPrzed[numer].selektor}.${pole}`);
      assert.equal(geometriaPo[numer].font,geometriaPrzed[numer].font);
      assert.equal(geometriaPo[numer].color,geometriaPrzed[numer].color);
    }
    console.log(`PASS cennik ${szerokosc}px: geometria i typografia bez zmian, różne piksele=${porownanie.roznePiksele}`);
  }
  for (const sciezka of ['/', '/index.html', '/cennik.html', '/MAD-NET/', '/MAD-NET/index.html', '/MAD-NET/cennik.html']) {
    const zasoby = [];
    const sledz = odpowiedz => {
      if (odpowiedz.url().startsWith(adres)) zasoby.push({url:odpowiedz.url(), status:odpowiedz.status()});
    };
    strona.on('response', sledz);
    const odpowiedz = await strona.goto(`${adres}${sciezka}`, {waitUntil:'networkidle'});
    assert.equal(odpowiedz.status(), 200, sciezka);
    const czyCennik = sciezka.endsWith('cennik.html');
    const selektory = czyCennik ? ['#hero-rack-stage', '#cennik', '#oplaty', '#availability-form'] : ['#tytul-glowny', '#nawigacja', '#mapa-ramka', '.karta-uslugi'];
    for (const selektor of selektory) assert.ok(await strona.locator(selektor).count(), `${sciezka}: brak selektora ${selektor}`);
    const skrypty = await strona.locator('script[src]').evaluateAll(elementy => elementy.map(element => element.getAttribute('src')));
    assert.deepEqual(skrypty, czyCennik ? ['./assets/js/sprzet-fiber.js', './assets/js/cennik.js', './assets/js/dostepnosc.js', './assets/js/hero-rack.js', './assets/js/nawigacja.js', './assets/js/wybor-technologii.js'] : ['./assets/js/stare-adresy.js', './assets/js/home.js', './assets/js/nawigacja.js']);
    assert.equal(await strona.locator(czyCennik ? 'link[href="./assets/css/home.css"]' : 'link[href="./assets/css/styles.css"]').count(), 0);
    assert.ok(zasoby.some(zasob => zasob.url.endsWith('.css')), `${sciezka}: nie pobrano CSS`);
    assert.ok(zasoby.some(zasob => zasob.url.endsWith('.js')), `${sciezka}: nie pobrano JS`);
    assert.ok(zasoby.some(zasob => /\.(png|jpg|svg)$/.test(zasob.url)), `${sciezka}: nie pobrano obrazów`);
    assert.ok(zasoby.every(zasob => zasob.status === 200), `${sciezka}: błąd HTTP zasobu ${JSON.stringify(zasoby)}`);
    smoke.push({sciezka, selektory, zasoby});
    strona.off('response', sledz);
    console.log(`PASS smoke ${sciezka}: selektory i ${zasoby.length} odpowiedzi HTTP 200, rozdzielone CSS/JS`);
  }
  await przygotuj(strona, adres+'/index.html');
  await strona.locator('.hero-przyciski a').first().focus();await strona.keyboard.press('Enter');
  await strona.waitForURL('**/cennik.html#kontakt');
  assert.equal(await strona.locator('#availability-form').count(),1,'Pierwsze CTA prowadzi do formularza');
  await strona.waitForTimeout(900);
  assert.ok(await strona.locator('#kontakt').evaluate(element=>element.getBoundingClientRect().top>=document.querySelector('.wspolny-naglowek').getBoundingClientRect().bottom-1),'Hash kontaktu uwzględnia nagłówek');
  await przygotuj(strona, adres+'/index.html');
  await strona.locator('.hero-przyciski a').last().click();await strona.waitForURL('**/cennik.html#cennik');
  assert.equal(await strona.locator('#cennik').count(),1,'Drugie CTA prowadzi do pakietów');
  await strona.waitForTimeout(900);
  assert.ok(await strona.locator('#cennik').evaluate(element=>element.getBoundingClientRect().top>=document.querySelector('.wspolny-naglowek').getBoundingClientRect().bottom-1),'Hash cennika uwzględnia nagłówek');
  for(const technologia of ['LAN','FIBER','AIR']){
    await przygotuj(strona,adres+'/index.html');
    await strona.locator('.technologia-karta>a[href*="technologia='+technologia+'"]').click();
    await strona.waitForURL('**/cennik.html?technologia='+technologia+'#cennik');
    assert.equal(await strona.locator('.device-tech-tabs [data-technology='+technologia+']').getAttribute('aria-pressed'),'true');
  }
  const dotyk=await przegladarka.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const telefon=await dotyk.newPage();
  telefon.on('pageerror',blad=>bledy.push(blad.message));
  await przygotuj(telefon,adres+'/index.html');
  assert.equal(await telefon.locator('.medium-air rect').count(),0,'AIR bez portów');
  assert.equal(await telefon.locator('.mapa-podklad').evaluate(element=>getComputedStyle(element).touchAction),'pan-y');
  await telefon.locator('.hero-fotografia').scrollIntoViewIfNeeded();
  const przedPrzewijaniem=await telefon.evaluate(()=>scrollY);
  const pole=await telefon.locator('.hero-fotografia').boundingBox();
  const sesjaDotyku=await dotyk.newCDPSession(telefon);
  const x=Math.round(pole.x+pole.width/2),y=Math.round(pole.y+pole.height/2);
  await sesjaDotyku.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let krok=1;krok<=12;krok++){
    await sesjaDotyku.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-krok*15}]});
    await telefon.waitForTimeout(20);
  }
  await sesjaDotyku.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await telefon.waitForTimeout(400);
  assert.ok(await telefon.evaluate(()=>scrollY)>przedPrzewijaniem);
  await sesjaDotyku.detach();
  await dotyk.close();
  console.log('PASS CTA HERO: klawiatura → dostępność internetu; kliknięcie → pakiety');
  await assert.rejects(access('dist/docs/archiwum/MAD-NET_HOME_V3_JEDEN_PLIK_ORIGINAL.html'));
  await assert.rejects(access('dist/home.html'));
  assert.deepEqual(bledy, []); assert.deepEqual(konsola, []);
  console.log('PASS dwie strony w dist, zasoby HOME pod /MAD-NET/, archiwum poza dist, brak błędów JS/konsoli');
} finally {
  await writeFile(`${katalog}/wyniki.json`, JSON.stringify({wyniki, smoke, bledy, konsola, pomiaryZrzutow, argumentyPrzegladarki, kafelkiOnline:kafelki.size}, null, 2));
  await przegladarka?.close(); serwer.kill();
}
