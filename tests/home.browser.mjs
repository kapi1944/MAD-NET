/* Regresja wydzielenia HOME V3: dwie strony, obrazy i rzeczywiste interakcje. */
import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile, access} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright-core';

const katalog = 'test-results/integracja-home-v3/01';
await mkdir(katalog, {recursive:true});
const port = process.env.MADNET_PORT_HOME || '4184';
const adres = `http://127.0.0.1:${port}`;
const oryginal = await readFile('docs/archiwum/MAD-NET_HOME_V3_JEDEN_PLIK_ORIGINAL.html', 'utf8');
const serwer = spawn(process.execPath, ['scripts/serve.mjs', '--root', 'dist', '--no-live'], {
  env:{...process.env, PORT:port}, stdio:['ignore','pipe','pipe'],
});
const wyniki = [], bledy = [], konsola = [], kafelki = new Map();
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
  // Symulacja montowania niezmienionego dist w podkatalogu GitHub Pages.
  await kontekst.route(`${adres}/MAD-NET/**`, async trasa => {
    await trasa.fulfill({response:await trasa.fetch({url:trasa.request().url().replace('/MAD-NET/', '/')})});
  });
  const strona = await kontekst.newPage();
  strona.on('pageerror', blad => bledy.push(blad.message));
  strona.on('console', wpis => {if (wpis.type() === 'error') konsola.push(wpis.text());});
  for (const szerokosc of [390, 768, 1440, 1920]) {
    await strona.setViewportSize({width:szerokosc, height:1000});
    await przygotuj(strona, `${adres}/oryginal-home-v3.html`);
    const przed = await strona.screenshot({path:`${katalog}/przed-${szerokosc}.png`, fullPage:true});
    await przygotuj(strona, `${adres}/home.html`);
    const po = await strona.screenshot({path:`${katalog}/po-${szerokosc}.png`, fullPage:true});
    const porownanie = await porownajPiksele(strona, przed, po);
    wyniki.push({szerokosc, porownanie});
    assert.equal(porownanie.rozneWymiary, undefined, 'Wymiary oryginału i HOME');
    assert.equal(porownanie.roznePiksele, 0, `Różnice obrazu ${szerokosc}px`);
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
    for (const usluga of ['monitoring', 'it', 'www', 'anteny']) {
      const przycisk = strona.locator(`button[data-usluga="${usluga}"]`).first();
      await przycisk.click();
      assert.equal(await strona.locator('#modal-tlo').isVisible(), true);
      assert.match(await strona.locator('#modal-mail').getAttribute('href'), /^mailto:biuro@mad-net\.pl\?subject=/);
      await strona.keyboard.press('Shift+Tab');
      assert.equal(await strona.evaluate(() => document.activeElement === document.querySelector('.modal-przyciski a:last-child')), true);
      await strona.keyboard.press('Escape');
      assert.equal(await strona.locator('#modal-tlo').isVisible(), false);
    }
    await strona.locator('[data-otworz-kontakt]').click();
    assert.match(await strona.locator('#modal-tytul').innerText(), /Zgłoś awarię/);
    await strona.locator('#modal-zamknij').click();
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
    console.log(`PASS HOME ${szerokosc}px: 0 różnych pikseli, 5 kart, menu/modale, mapa/satelita/zoom, impulsy PCB i reduced motion`);
  }
  await przygotuj(strona, `${adres}/MAD-NET/home.html`);
  assert.equal(await strona.locator('html').getAttribute('lang'), 'pl');
  assert.ok(await strona.locator('.podpis-lokalny img').evaluate(obraz => obraz.currentSrc.includes('/MAD-NET/assets/img/home/')));
  await strona.goto(`${adres}/index.html`);
  assert.equal(await strona.locator('[data-rack-tech]').count(), 3);
  assert.equal(await strona.locator('#availability-form').count(), 1);
  await assert.rejects(access('dist/docs/archiwum/MAD-NET_HOME_V3_JEDEN_PLIK_ORIGINAL.html'));
  assert.deepEqual(bledy, []); assert.deepEqual(konsola, []);
  console.log('PASS dwie strony w dist, zasoby HOME pod /MAD-NET/, archiwum poza dist, brak błędów JS/konsoli');
} finally {
  await writeFile(`${katalog}/wyniki.json`, JSON.stringify({wyniki, bledy, konsola, kafelkiOnline:kafelki.size}, null, 2));
  await przegladarka?.close(); serwer.kill();
}
