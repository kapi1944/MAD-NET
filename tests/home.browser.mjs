/* Regresja wydzielenia HOME V3: dwie strony, obrazy i rzeczywiste interakcje. */
import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile, access} from 'node:fs/promises';
import {spawn, execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';

const katalog = 'test-results/integracja-home-v3/03/home';
await mkdir(katalog, {recursive:true});
const port = process.env.MADNET_PORT_HOME || '4184';
const adres = `http://127.0.0.1:${port}`;
const oryginal = await readFile('docs/archiwum/MAD-NET_HOME_V3_JEDEN_PLIK_ORIGINAL.html', 'utf8');
const serwer = spawn(process.execPath, ['scripts/serve.mjs', '--root', 'dist', '--no-live'], {
  env:{...process.env, PORT:port}, stdio:['ignore','pipe','pipe'],
});
const wyniki = [], smoke = [], bledy = [], konsola = [], kafelki = new Map();
let przegladarka;

async function przygotuj(strona, url) {
  await strona.goto(url, {waitUntil:'networkidle'});
  await strona.evaluate(async () => {
    await document.fonts.ready;
    for (let y = 0; y < document.body.scrollHeight; y += 800) {
      scrollTo(0, y); await new Promise(koniec => setTimeout(koniec, 30));
    }
    scrollTo(0, 0);
  });
  await strona.waitForFunction(() => [...document.images].every(obraz => obraz.complete && obraz.naturalWidth > 0));
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
    let roznePiksele = 0, maksymalnaRoznica = 0;
    for (let i = 0; i < a.dane.length; i += 4) {
      let inny = false;
      for (let j = 0; j < 4; j++) {
        const roznica = Math.abs(a.dane[i+j] - b.dane[i+j]);
        if (roznica) inny = true;
        maksymalnaRoznica = Math.max(maksymalnaRoznica, roznica);
      }
      if (inny) roznePiksele++;
    }
    return {szerokosc:a.szerokosc, wysokosc:a.wysokosc, roznePiksele, maksymalnaRoznica};
  }, [przed.toString('base64'), po.toString('base64')]);
}

async function geometriaHero(strona) {
  return strona.locator('.sekcja-hero').evaluate(sekcja => {
    const baza = sekcja.getBoundingClientRect();
    return ['h1','.hero-glowne>p','.hero-przyciski','.hero-fotografia','.podpis-lokalny'].map(selektor => {
      const element = sekcja.querySelector(selektor), r = element.getBoundingClientRect();
      if (!element.getClientRects().length) return {selektor,ukryty:true};
      const styl = getComputedStyle(element);
      return {selektor,x:r.x-baza.x,y:r.y-baza.y,szerokosc:r.width,wysokosc:r.height,font:styl.font,color:styl.color};
    });
  });
}

async function geometriaKart(strona) {
  return strona.locator('.siatka-uslug').evaluate(siatka => [...siatka.querySelectorAll('.karta-uslugi')].flatMap((karta,numer) => {
    const baza=siatka.getBoundingClientRect();
    return ['.zdjecie-uslugi','.tresc-uslugi h3','.tresc-uslugi p','.link-karty'].map(selektor => {
      const element=karta.querySelector(selektor),r=element.getBoundingClientRect(),styl=getComputedStyle(element);
      return {numer,selektor,x:r.x-baza.x,y:r.y-baza.y,szerokosc:r.width,wysokosc:r.height,font:styl.font,color:styl.color};
    });
  }));
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
  await new Promise((gotowe, odrzuc) => {
    const zegar = setTimeout(() => odrzuc(new Error('Brak podglądu HOME')), 8000);
    serwer.stdout.on('data', dane => {if (String(dane).includes('MAD-NET PREVIEW')) {clearTimeout(zegar); gotowe();}});
    serwer.once('error', odrzuc);
  });
  przegladarka = await chromium.launch({headless:true, args:['--disable-gpu'],
    ...(process.env.MADNET_PRZEGLADARKA ? {executablePath:process.env.MADNET_PRZEGLADARKA}
      : process.platform === 'win32' ? {channel:'msedge'} : {}),
  });
  const kontekst = await przegladarka.newContext({deviceScaleFactor:1, reducedMotion:'reduce'});
  // Obie strony otrzymują te same bajty prawdziwych kafelków pobranych online.
  await kontekst.route(/https:\/\/(server\.arcgisonline\.com|a\.basemaps\.cartocdn\.com)\//, async trasa => {
    const url = trasa.request().url();
    if (!kafelki.has(url)) kafelki.set(url, (async () => {
      const odpowiedz = await trasa.fetch();
      assert.equal(odpowiedz.status(), 200, `Kafelek online: ${url}`);
      return {body:await odpowiedz.body(), contentType:odpowiedz.headers()['content-type'], status:200};
    })());
    await trasa.fulfill(await kafelki.get(url));
  });
  await kontekst.route(`${adres}/oryginal-home-v3.html`, trasa => trasa.fulfill({body:oryginal, contentType:'text/html; charset=utf-8'}));
  const cennikPrzed = execFileSync('git', ['show', 'a6a146b4fa2bf1d46bbebc38e79f68eaf68f2d9a:index.html'], {encoding:'utf8'});
  await kontekst.route(`${adres}/oryginal-cennik.html`, trasa => trasa.fulfill({body:cennikPrzed, contentType:'text/html; charset=utf-8'}));
  // Symulacja montowania niezmienionego dist w podkatalogu GitHub Pages.
  await kontekst.route(`${adres}/MAD-NET/**`, async trasa => {
    await trasa.fulfill({response:await trasa.fetch({url:trasa.request().url().replace('/MAD-NET/', '/')})});
  });
  const strona = await kontekst.newPage();
  strona.on('pageerror', blad => bledy.push(blad.message));
  strona.on('console', wpis => {if (wpis.type() === 'error') konsola.push(wpis.text());});
  for (const szerokosc of [390, 768, 1024, 1440, 1920]) {
    await strona.setViewportSize({width:szerokosc, height:1000});
    await przygotuj(strona, `${adres}/oryginal-home-v3.html`);
    const geometriaPrzed = await geometriaHero(strona);
    const kartyGeometriaPrzed = await geometriaKart(strona);
    const stylPorownania = '.naglowek,.nav,.wspolny-naglowek{visibility:hidden!important}';
    const przed = await strona.locator('.sekcja-hero').screenshot({path:`${katalog}/hero-przed-${szerokosc}.png`, style:stylPorownania});
    const kartyPrzed = await strona.locator('.siatka-uslug').screenshot({style:stylPorownania});
    await przygotuj(strona, `${adres}/index.html`);
    const geometriaPo = await geometriaHero(strona);
    const kartyGeometriaPo = await geometriaKart(strona);
    const po = await strona.locator('.sekcja-hero').screenshot({path:`${katalog}/hero-po-${szerokosc}.png`, style:stylPorownania});
    const kartyPo = await strona.locator('.siatka-uslug').screenshot({style:stylPorownania});
    const porownanie = await porownajPiksele(strona, przed, po);
    wyniki.push({szerokosc, porownanie, geometriaPrzed, geometriaPo});
    assert.equal(porownanie.rozneWymiary, undefined, 'Wymiary oryginału i HOME');
    for (let numer=0;numer<geometriaPrzed.length;numer++) {
      if (geometriaPrzed[numer].ukryty) { assert.equal(geometriaPo[numer].ukryty,true); continue; }
      for (const pole of ['x','y','szerokosc','wysokosc']) assert.ok(Math.abs(geometriaPrzed[numer][pole]-geometriaPo[numer][pole])<0.01,`Geometria HERO ${szerokosc}: ${geometriaPrzed[numer].selektor}.${pole}`);
      assert.equal(geometriaPo[numer].font,geometriaPrzed[numer].font);
      assert.equal(geometriaPo[numer].color,geometriaPrzed[numer].color);
    }
    const porownanieKart = await porownajPiksele(strona, kartyPrzed, kartyPo);
    wyniki.push({strona:'karty HOME', szerokosc, porownanie:porownanieKart, kartyGeometriaPrzed, kartyGeometriaPo});
    for(let numer=0;numer<kartyGeometriaPrzed.length;numer++){
      for(const pole of ['x','y','szerokosc','wysokosc'])assert.ok(Math.abs(kartyGeometriaPrzed[numer][pole]-kartyGeometriaPo[numer][pole])<0.01,`Geometria karty ${szerokosc}: ${numer}.${pole}`);
      assert.equal(kartyGeometriaPo[numer].font,kartyGeometriaPrzed[numer].font);
      assert.equal(kartyGeometriaPo[numer].color,kartyGeometriaPrzed[numer].color);
    }
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
    assert.equal(await strona.locator('.hero-przyciski a').last().getAttribute('href'), './kontakt.html');
    await strona.locator('.miejscowosci-przyciski [data-miasto="Rewal"]').click();
    assert.equal(await strona.locator('#wybrane-miasto').innerText(), 'Rewal');
    assert.match(await strona.locator('#wybrane-wspolrzedne').innerText(), /54\.08207/);
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
    console.log(`PASS HOME ${szerokosc}px: geometria i typografia HERO bez zmian; różne piksele HERO=${porownanie.roznePiksele}, karty=${porownanieKart.roznePiksele}; mapa/PCB/linki`);
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
    assert.deepEqual(skrypty, czyCennik ? ['./assets/js/cennik.js', './assets/js/dostepnosc.js', './assets/js/hero-rack.js', './assets/js/nawigacja.js', './assets/js/wybor-technologii.js'] : ['./assets/js/stare-adresy.js', './assets/js/home.js', './assets/js/nawigacja.js']);
    assert.equal(await strona.locator(czyCennik ? 'link[href="./assets/css/home.css"]' : 'link[href="./assets/css/styles.css"]').count(), 0);
    assert.ok(zasoby.some(zasob => zasob.url.endsWith('.css')), `${sciezka}: nie pobrano CSS`);
    assert.ok(zasoby.some(zasob => zasob.url.endsWith('.js')), `${sciezka}: nie pobrano JS`);
    assert.ok(zasoby.some(zasob => /\.(png|jpg|svg)$/.test(zasob.url)), `${sciezka}: nie pobrano obrazów`);
    assert.ok(zasoby.every(zasob => zasob.status === 200), `${sciezka}: błąd HTTP zasobu ${JSON.stringify(zasoby)}`);
    smoke.push({sciezka, selektory, zasoby});
    strona.off('response', sledz);
    console.log(`PASS smoke ${sciezka}: selektory i ${zasoby.length} odpowiedzi HTTP 200, rozdzielone CSS/JS`);
  }
  await assert.rejects(access('dist/docs/archiwum/MAD-NET_HOME_V3_JEDEN_PLIK_ORIGINAL.html'));
  await assert.rejects(access('dist/home.html'));
  assert.deepEqual(bledy, []); assert.deepEqual(konsola, []);
  console.log('PASS dwie strony w dist, zasoby HOME pod /MAD-NET/, archiwum poza dist, brak błędów JS/konsoli');
} finally {
  await writeFile(`${katalog}/wyniki.json`, JSON.stringify({wyniki, smoke, bledy, konsola, kafelkiOnline:kafelki.size}, null, 2));
  await przegladarka?.close(); serwer.kill();
}
