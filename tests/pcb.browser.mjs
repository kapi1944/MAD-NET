/* Kontrola rzeczywistej geometrii, ruchu i dostępności dekoracyjnego PCB. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { chromium, firefox, webkit } from 'playwright-core';

const przed = process.argv.includes('--przed');
const nazwaSilnika = process.env.MADNET_SILNIK_PCB || 'chromium';
const silnik = { chromium, firefox, webkit }[nazwaSilnika];
assert.ok(silnik, 'Nieznany silnik przeglądarki');
const katalog = `test-results/pcb-4-1/${przed ? 'przed' : nazwaSilnika === 'chromium' ? 'po' : `po-${nazwaSilnika}`}`;
await mkdir(katalog, { recursive: true });
const port = process.env.MADNET_PORT_PCB || '4183';
const adres = `http://127.0.0.1:${port}`;
const serwer = spawn(process.execPath, ['scripts/serve.mjs', '--root', 'dist', '--no-live'], {
  env: { ...process.env, PORT: port }, stdio: ['ignore', 'pipe', 'pipe'],
});
const bledy = [], pomiary = [];
let wydajnosc;
let przegladarka;

try {
  await new Promise((zakoncz, odrzuc) => {
    const zegar = setTimeout(() => odrzuc(new Error('Brak serwera PCB')), 8000);
    serwer.stdout.on('data', dane => {
      if (String(dane).includes('MAD-NET PREVIEW')) { clearTimeout(zegar); zakoncz(); }
    });
    serwer.once('error', odrzuc);
  });
  przegladarka = await silnik.launch({ headless: true,
    ...(process.env.MADNET_PRZEGLADARKA ? { executablePath: process.env.MADNET_PRZEGLADARKA }
      : process.platform === 'win32' && nazwaSilnika === 'chromium' ? { channel: 'msedge' } : {}),
  });
  const strona = await przegladarka.newPage({ viewport: { width: 1440, height: 1100 } });
  if (przed) for (const plik of ['index.html', 'assets/css/styles.css']) {
    const tresc = execFileSync('git', ['show', `HEAD:${plik}`], { encoding: 'utf8' });
    await strona.route(plik === 'index.html' ? '**/' : `**/${plik}`, trasa => trasa.fulfill({ body: tresc, contentType: plik.endsWith('.css') ? 'text/css' : 'text/html' }));
  }
  strona.on('pageerror', blad => bledy.push(blad.message));
  strona.on('console', wpis => { if (wpis.type() === 'error') bledy.push(wpis.text()); });
  for (const szerokosc of przed ? [390, 1440, 1920, 2560] : [360, 390, 430, 768, 1024, 1280, 1440, 1920, 2560]) {
    await strona.setViewportSize({ width: szerokosc, height: 1100 });
    await strona.goto(adres);
    await strona.evaluate(() => document.fonts.ready);
    await strona.locator('#cennik').evaluate(sekcja => scrollTo({ top: sekcja.offsetTop, behavior: 'instant' }));
    await strona.waitForTimeout(150);
    if (przed) {
      await strona.screenshot({ path: `${katalog}/cennik-${szerokosc}.png` });
      continue;
    }
    const pomiar = await strona.evaluate(() => {
      const plytki = [...document.querySelectorAll('.pcb-tlo')];
      const trasy = plytki.flatMap(plytka => [...plytka.querySelectorAll('.pcb-trasy path')]);
      const odcinki = trasy.flatMap(trasa => {
        const liczby = trasa.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
        const wynik = [];
        for (let i = 2; i < liczby.length; i += 2) wynik.push([liczby[i] - liczby[i - 2], liczby[i + 1] - liczby[i - 1]]);
        return wynik;
      });
      const kolizje = plytki.flatMap(plytka => {
        const odcinki = [...plytka.querySelectorAll('.pcb-trasy path')].flatMap((trasa, numer) => {
          const liczby = trasa.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
          const wynik = [];
          for (let i = 2; i < liczby.length; i += 2) wynik.push({ numer, a: liczby.slice(i - 2, i), b: liczby.slice(i, i + 2) });
          return wynik;
        });
        const wynik = [];
        const iloczyn = (a, b) => a[0] * b[1] - a[1] * b[0];
        for (let i = 0; i < odcinki.length; i++) for (let j = i + 1; j < odcinki.length; j++) {
          const pierwszy = odcinki[i], drugi = odcinki[j];
          if (pierwszy.numer === drugi.numer) continue;
          const wektor = (a, b) => [b[0] - a[0], b[1] - a[1]];
          const a = wektor(pierwszy.a, pierwszy.b), b = wektor(drugi.a, drugi.b), c = wektor(pierwszy.a, drugi.a);
          const mianownik = iloczyn(a, b);
          if (mianownik) {
            const t = iloczyn(c, b) / mianownik, u = iloczyn(c, a) / mianownik;
            if (t >= 0 && t <= 1 && u >= 0 && u <= 1 && ((t > 0 && t < 1) || (u > 0 && u < 1))) wynik.push([pierwszy.numer, drugi.numer]);
          } else if (!iloczyn(c, a)) {
            const os = a[0] ? 0 : 1;
            const zakres = odcinek => [Math.min(odcinek.a[os], odcinek.b[os]), Math.max(odcinek.a[os], odcinek.b[os])];
            const x = zakres(pierwszy), y = zakres(drugi);
            if (Math.min(x[1], y[1]) > Math.max(x[0], y[0])) wynik.push([pierwszy.numer, drugi.numer]);
          }
        }
        return wynik;
      });
      const animacje = [...document.querySelectorAll('.pcb-led animateMotion')];
      return {
        szerokosc: innerWidth, przepelnienie: document.documentElement.scrollWidth - innerWidth,
        liczbaPlytek: plytki.length, liczbaTras: trasy.length,
        poprawneTrasy: trasy.every(trasa => trasa.getTotalLength() > 0 && /^M[\d .L-]+$/.test(trasa.getAttribute('d'))),
        skosy: odcinki.filter(([x, y]) => x && y).length,
        poprawneKaty: odcinki.every(([x, y]) => (!x && y) || (x && !y) || (Math.abs(x) === Math.abs(y) && x !== 0)),
        proporcje: plytki.every(plytka => {
          const macierz = plytka.getScreenCTM();
          return Math.abs(macierz.a - macierz.d) < .00001 && macierz.b === 0 && macierz.c === 0;
        }),
        rozdzieloneKadry: plytki.every(plytka => plytka.getBoundingClientRect().height <= document.querySelector('#cennik').clientHeight / 3 + 1),
        kolizje,
        niezalezneDiody: new Set(animacje.map(animacja => animacja.getAttribute('dur'))).size === 5 && new Set(animacje.map(animacja => animacja.getAttribute('begin'))).size === 5,
        bezPrzechwytywania: plytki.every(plytka => getComputedStyle(plytka).pointerEvents === 'none'),
        diody: [...document.querySelectorAll('.pcb-led')].filter(dioda => getComputedStyle(dioda).display !== 'none').length,
      };
    });
    pomiary.push(pomiar);
    assert.equal(pomiar.przepelnienie, 0);
    assert.equal(pomiar.liczbaPlytek, 3);
    assert.ok(pomiar.liczbaTras >= 36 && pomiar.skosy >= 36 && pomiar.poprawneTrasy && pomiar.poprawneKaty);
    assert.ok(pomiar.proporcje && pomiar.bezPrzechwytywania && pomiar.rozdzieloneKadry);
    assert.deepEqual(pomiar.kolizje, [], 'Niepołączone ścieżki nie mogą się przecinać');
    assert.ok(pomiar.niezalezneDiody);
    assert.equal(pomiar.diody, szerokosc <= 600 ? 3 : 5);

    // SMIL jest próbkowany na osi czasu SVG, następnie obserwowany w czasie rzeczywistym.
    const ruch = await strona.evaluate(async () => {
      const plytka = document.querySelector('.pcb-tlo');
      const dioda = plytka.querySelector('.pcb-led');
      const trasa = document.querySelector(dioda.querySelector('mpath').getAttribute('href'));
      const polozenie = () => new DOMPoint(0, 0).matrixTransform(dioda.getScreenCTM()).matrixTransform(plytka.getScreenCTM().inverse());
      const naTrasie = punkt => {
        let odleglosc = Infinity;
        for (let i = 0; i <= trasa.getTotalLength(); i += .5) {
          const p = trasa.getPointAtLength(i);
          odleglosc = Math.min(odleglosc, Math.hypot(p.x - punkt.x, p.y - punkt.y));
        }
        return odleglosc < 1;
      };
      plytka.pauseAnimations();
      const punkty = [1, 3, 5, 7].map(czas => { plytka.setCurrentTime(czas); return polozenie(); });
      plytka.unpauseAnimations();
      const poczatek = polozenie();
      await new Promise(zakoncz => setTimeout(zakoncz, 180));
      const koniec = polozenie();
      return { naTrasie: punkty.every(naTrasie), przesuniecie: Math.hypot(koniec.x - poczatek.x, koniec.y - poczatek.y) };
    });
    assert.ok(ruch.naTrasie && ruch.przesuniecie > 1, `Rzeczywisty ruch LED ${szerokosc}: ${JSON.stringify(ruch)}`);
    const trafienie = await strona.locator('.device-tech-tabs [data-technology="LAN"]').evaluate(przycisk => {
      const r = przycisk.getBoundingClientRect();
      return przycisk.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    });
    // Na telefonie przycisk może leżeć poniżej widoku; click dodatkowo sprawdza obsługę trafienia.
    if (szerokosc >= 768) assert.ok(trafienie);
    await strona.locator('.device-tech-tabs [data-technology="LAN"]').click();
    assert.equal(await strona.locator('#plans .plan').count(), 5);
    await strona.locator('#animation-toggle').click();
    assert.ok(await strona.locator('.pcb-impulsy').evaluateAll(grupy => grupy.every(grupa => getComputedStyle(grupa).display === 'none')));
    assert.ok(await strona.locator('.pcb-trasy').evaluateAll(grupy => grupy.every(grupa => getComputedStyle(grupa).display !== 'none')));
    await strona.locator('.device-tech-tabs [data-technology="FIBER"]').click();
    await strona.mouse.move(1, 100);
    await strona.locator('#cennik').evaluate(sekcja => scrollTo({ top: sekcja.offsetTop, behavior: 'instant' }));
    await strona.waitForTimeout(200);
    if ([390, 1440, 1920, 2560].includes(szerokosc)) await strona.screenshot({ path: `${katalog}/statyczne-${szerokosc}.png` });
    await strona.locator('#animation-toggle').click();
    await strona.emulateMedia({ reducedMotion: 'reduce' });
    assert.ok(await strona.locator('.pcb-impulsy').evaluateAll(grupy => grupy.every(grupa => getComputedStyle(grupa).display === 'none')));
    await strona.emulateMedia({ reducedMotion: 'no-preference' });
    await strona.locator('#cennik').evaluate(sekcja => scrollTo({ top: sekcja.offsetTop, behavior: 'instant' }));
    if ([390, 1440, 1920, 2560].includes(szerokosc)) {
      await strona.evaluate(() => document.querySelectorAll('.pcb-tlo').forEach(plytka => { plytka.pauseAnimations(); plytka.setCurrentTime(3); }));
      await strona.screenshot({ path: `${katalog}/aktywne-${szerokosc}.png` });
      if ([390, 1440].includes(szerokosc)) await strona.locator('#cennik').screenshot({ path: `${katalog}/caly-cennik-${szerokosc}.png` });
      await strona.evaluate(() => document.querySelectorAll('.pcb-tlo').forEach(plytka => plytka.unpauseAnimations()));
    }
    console.log(`PASS PCB ${szerokosc}px: geometria, proporcje, ruch LED, przełącznik, reduced motion, kliknięcie`);
  }
  if (!przed) {
    wydajnosc = await strona.evaluate(() => new Promise(zakoncz => {
      const odstepy = [];
      let poprzedni;
      const klatka = czas => {
        if (poprzedni) odstepy.push(czas - poprzedni);
        poprzedni = czas;
        if (odstepy.length < 60) requestAnimationFrame(klatka);
        else {
          odstepy.sort((a, b) => a - b);
          zakoncz({ medianaMs: odstepy[30], p95Ms: odstepy[57], klatkiPonad50ms: odstepy.filter(czas => czas > 50).length });
        }
      };
      requestAnimationFrame(klatka);
    }));
    // Wysokość zmienia się po wyborze technologii i otwarciu wszystkich tabel V21.
    for (const technologia of ['LAN', 'AIR', 'FIBER']) {
      await strona.locator(`.device-tech-tabs [data-technology="${technologia}"]`).click();
      if (await strona.locator('#compare-show-all').isEnabled()) await strona.locator('#compare-show-all').click();
      assert.ok(await strona.locator('.pcb-tlo').evaluateAll(plytki => plytki.every(plytka => {
        const m = plytka.getScreenCTM();
        return Math.abs(m.a - m.d) < .00001 && plytka.getBoundingClientRect().height <= document.querySelector('#cennik').clientHeight / 3 + 1;
      })));
    }
  }
  assert.deepEqual(bledy, []);
  if (!przed && process.argv.includes('--nagranie')) {
    const kontekst = await przegladarka.newContext({ viewport: { width: 1440, height: 1000 }, recordVideo: { dir: katalog, size: { width: 1440, height: 1000 } } });
    const pokaz = await kontekst.newPage();
    await pokaz.goto(adres);
    await pokaz.evaluate(() => document.fonts.ready);
    await pokaz.locator('#cennik').evaluate(sekcja => scrollTo({ top: sekcja.offsetTop, behavior: 'instant' }));
    await pokaz.waitForTimeout(12000);
    const nagranie = pokaz.video();
    await kontekst.close();
    await nagranie.saveAs(`${katalog}/impulsy-led.webm`);
    await nagranie.delete();
  }
  await writeFile(`${katalog}/wyniki.json`, JSON.stringify({ baza: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), silnik: nazwaSilnika, bledy, wydajnosc, pomiary }, null, 2));
} finally {
  await przegladarka?.close();
  serwer.kill();
}
