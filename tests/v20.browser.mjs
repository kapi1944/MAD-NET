/* Regresja V20 w prawdziwym Chromium: geometria, obsługa i istniejące oferty. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const katalog = new URL('../test-results/v20/po/', import.meta.url);
await mkdir(katalog, { recursive: true });
const port = process.env.MADNET_PORT_TESTOW || '4181';
const adres = `http://127.0.0.1:${port}`;
const serwer = spawn(process.execPath, ['scripts/serve.mjs', '--root', 'dist', '--no-live'], {
  cwd: new URL('..', import.meta.url), env: { ...process.env, PORT: port }, stdio: ['ignore', 'pipe', 'pipe'],
});
const bledy = [], konsola = [], siec = [], pomiary = [], animacjeKanalow = [];
let przegladarka, liczbaTras = 0;
const oferta = {
  LAN: [[10, 2, 49, 54], [20, 2, 59, 64], [40, 5, 64, 69], [60, 5, 69, 74], [80, 10, 74, 79]],
  FIBER: [[50, 20, 45, null], [100, 40, 55, null], [300, 80, 65, null]],
  AIR: [[10, 2, 54, 59], [20, 2, 64, 69], [40, 5, 74, 79], [60, 5, 84, 89], [80, 10, 94, 99]],
};

function sledzBledy(strona) {
  strona.on('pageerror', blad => bledy.push(blad.message));
  strona.on('console', wpis => { if (wpis.type() === 'error') konsola.push({ tresc: wpis.text(), adres: wpis.location().url }); });
  strona.on('requestfailed', zadanie => siec.push({ adres: zadanie.url(), blad: zadanie.failure()?.errorText }));
}

async function geometria(strona) {
  return strona.evaluate(() => {
    const pobierz = selektor => {
      const prostokat = document.querySelector(selektor).getBoundingClientRect();
      return { x: prostokat.x + scrollX, y: prostokat.y + scrollY, szerokosc: prostokat.width, wysokosc: prostokat.height };
    };
    return { panel: pobierz('#hero-tech-panel'), szafa: pobierz('.rack-box'), przycisk: pobierz('#hero-tech-link'), sekcja: pobierz('.hero') };
  });
}

async function sprawdzWybor(strona, technologia, poczatek) {
  await strona.waitForFunction(technologia => document.querySelector('#hero-tech-panel').dataset.tech === technologia, technologia);
  assert.match(await strona.locator('#hero-tech-title').innerText(), new RegExp(technologia));
  assert.match(await strona.locator('#hero-tech-link').innerText(), new RegExp(technologia));
  assert.equal(await strona.locator('#hero-tech-count').innerText(), technologia === 'FIBER' ? '3 warianty' : '5 wariantów');
  assert.equal(await strona.locator(`[data-rack-tech="${technologia}"]`).getAttribute('aria-pressed'), 'true');
  const po = await geometria(strona);
  for (const [nazwa, prostokat] of Object.entries(poczatek)) {
    for (const [wymiar, liczba] of Object.entries(prostokat)) {
      assert.ok(Math.abs(po[nazwa][wymiar] - liczba) < 1, `Skok ${nazwa}.${wymiar} po wyborze ${technologia}: ${liczba} → ${po[nazwa][wymiar]}`);
    }
  }
}

async function sprawdzPodswietlenie(strona, szerokosc, ograniczonyRuch = false) {
  await strona.setViewportSize({ width: szerokosc, height: 1250 });
  await strona.emulateMedia({ reducedMotion: ograniczonyRuch ? 'reduce' : 'no-preference' });
  await strona.goto(adres);
  await strona.mouse.move(2, 100);
  const odczytaj = urzadzenie => urzadzenie.evaluate(element => {
    const styl = getComputedStyle(element);
    return { tlo: styl.backgroundColor, cien: styl.boxShadow, obrys: element.getBoundingClientRect().toJSON() };
  });
  for (const technologia of ['LAN', 'FIBER', 'AIR']) {
    const urzadzenie = strona.locator(`[data-rack-tech="${technologia}"]`);
    const poczatek = await odczytaj(urzadzenie);
    await urzadzenie.hover();
    await strona.waitForTimeout(350);
    const aktywne = await odczytaj(urzadzenie);
    assert.notEqual(aktywne.cien, poczatek.cien, `Brak podświetlenia ${technologia} po aktualizacji panelu`);
    assert.notEqual(aktywne.tlo, poczatek.tlo);
    assert.deepEqual(aktywne.obrys, poczatek.obrys, 'Podświetlenie nie zmienia geometrii');
    const kolor = await urzadzenie.evaluate((element, technologia) => {
      const kolory = { LAN: '#ff203e', FIBER: '#ff7b19', AIR: '#3fa8ff' };
      const proba = document.createElement('i');
      proba.style.boxShadow = 'inset 0 0 0 2px color-mix(in srgb,' + kolory[technologia] + ' 82%,transparent), inset 0 0 16px color-mix(in srgb,' + kolory[technologia] + ' 19%,transparent)';
      document.body.append(proba);
      const cien = getComputedStyle(proba).boxShadow;
      proba.remove();
      return cien;
    }, technologia);
    assert.equal(aktywne.cien, kolor, 'Kolor podświetlenia technologii');
    await strona.waitForTimeout(1650);
    await strona.screenshot({ path: fileURLToPath(new URL(`hover-2s-${szerokosc}-${technologia}.png`, katalog)) });
    // Próbki w każdej klatce wychwycą przerwy podczas animacji HERO.
    const probki = await urzadzenie.evaluate(element => new Promise(zakoncz => {
      const poczatek = performance.now(), probki = [];
      function zmierz() {
        const styl = getComputedStyle(element);
        probki.push({ czas: performance.now() - poczatek, cien: styl.boxShadow, tlo: styl.backgroundColor });
        if (performance.now() - poczatek >= 5000) zakoncz(probki);
        else requestAnimationFrame(zmierz);
      }
      zmierz();
    }));
    assert.ok(probki.some(probka => probka.czas >= 2000) && probki.at(-1).czas >= 5000);
    assert.ok(probki.every(probka => probka.cien === aktywne.cien && probka.tlo === aktywne.tlo), `Przerwane podświetlenie ${technologia}`);
    await urzadzenie.hover({ position: { x: poczatek.obrys.width * .7, y: poczatek.obrys.height * .65 } });
    assert.equal((await odczytaj(urzadzenie)).cien, aktywne.cien, 'Ruch wewnątrz urządzenia');
    await strona.screenshot({ path: fileURLToPath(new URL(`hover-${szerokosc}-${technologia}${ograniczonyRuch ? '-reduce' : ''}.png`, katalog)) });
    const nastepna = technologia === 'AIR' ? 'LAN' : technologia === 'LAN' ? 'FIBER' : 'AIR';
    await strona.locator(`[data-rack-tech="${nastepna}"]`).hover();
    if (!ograniczonyRuch) {
      await strona.waitForTimeout(100);
      const wygaszanie = await odczytaj(urzadzenie);
      assert.notEqual(wygaszanie.cien, aktywne.cien, 'Wygaszanie rozpoczyna się po wyjściu');
      assert.notEqual(wygaszanie.cien, poczatek.cien, 'Wygaszanie jest płynne');
    }
    await strona.waitForTimeout(450);
    assert.equal((await odczytaj(urzadzenie)).cien, poczatek.cien);
    for (let powtorzenie = 0; powtorzenie < 3; powtorzenie++) {
      await urzadzenie.hover();
      await strona.mouse.move(2, 100);
    }
    await strona.waitForTimeout(450);
    assert.equal((await odczytaj(urzadzenie)).cien, poczatek.cien);
    assert.equal((await odczytaj(urzadzenie)).tlo, poczatek.tlo);
  }
  console.log(`PASS trwałe podświetlenie 2/5 s, ruch i wyjście: ${szerokosc}px, reduced-motion=${ograniczonyRuch}`);
}

try {
  await new Promise((zakoncz, odrzuc) => {
    const zegar = setTimeout(() => odrzuc(new Error('Serwer testowy nie wystartował')), 8000);
    serwer.stdout.on('data', dane => { if (String(dane).includes('MAD-NET PREVIEW')) { clearTimeout(zegar); zakoncz(); } });
    serwer.once('error', odrzuc);
    serwer.once('exit', kod => { clearTimeout(zegar); if (kod) odrzuc(new Error(`Serwer zakończył się kodem ${kod}`)); });
    serwer.stderr.on('data', dane => process.stderr.write(dane));
  });
  przegladarka = await chromium.launch({
    headless: true,
    ...(process.env.MADNET_PRZEGLADARKA ? { executablePath: process.env.MADNET_PRZEGLADARKA }
      : process.platform === 'win32' ? { channel: 'msedge' } : {}),
  });
  const strona = await przegladarka.newPage({ viewport: { width: 1440, height: 1250 } });
  sledzBledy(strona);
  for (const szerokosc of [390, 768, 1024, 1440]) await sprawdzPodswietlenie(strona, szerokosc);
  await sprawdzPodswietlenie(strona, 1440, true);
  await strona.emulateMedia({ reducedMotion: 'no-preference' });
  for (const szerokosc of [360, 390, 430, 760, 768, 1024, 1100, 1280, 1440, 1510, 1920]) {
    await strona.setViewportSize({ width: szerokosc, height: 1250 });
    await strona.goto(adres);
    await strona.evaluate(() => document.fonts.ready);
    await strona.waitForFunction(() => innerWidth <= 1230 || document.querySelector('#hero-tech-panel').style.getPropertyValue('--panel-wysokosc'));
    const poczatek = await geometria(strona);
    for (const technologia of ['LAN', 'FIBER', 'AIR']) {
      await strona.locator(`[data-rack-tech="${technologia}"]`).hover();
      await sprawdzWybor(strona, technologia, poczatek);
      await strona.mouse.move(2, 100);
      assert.equal(await strona.locator('#hero-tech-panel').getAttribute('data-tech'), technologia);
      const pomiar = await strona.evaluate(() => {
        const panel = document.querySelector('#hero-tech-panel'), sciana = document.querySelector('.rack-sidewall');
        const granice = panel.getBoundingClientRect(), tyl = sciana.getBoundingClientRect();
        const krawedz = document.querySelector('.tylna-krawedz').getBoundingClientRect();
        const urzadzenia = [...document.querySelectorAll('.rack-device')];
        return {
          szerokosc: innerWidth, technologia: panel.dataset.tech, wysokoscPanelu: granice.height, wysokoscSciany: tyl.height,
          zakladka: tyl.right - granice.left, gora: granice.top - tyl.top, dol: tyl.bottom - granice.bottom,
          wysokoscTylnejKrawedzi: krawedz.height, goraTylu: granice.top - krawedz.top, dolTylu: krawedz.bottom - granice.bottom,
          lewyBorder: getComputedStyle(panel).borderLeftWidth, przepelnienie: document.documentElement.scrollWidth - innerWidth,
          trescMiesciSie: panel.scrollHeight <= panel.clientHeight,
          szafaMiesciSie: tyl.right <= innerWidth && document.querySelector('.rack-box').getBoundingClientRect().left >= 0,
          portyDostepne: urzadzenia.every(urzadzenie => {
            const obszar = urzadzenie.getBoundingClientRect();
            return urzadzenie.contains(document.elementFromPoint(obszar.right - 20, obszar.top + obszar.height / 2));
          }),
        };
      });
      pomiary.push(pomiar);
      assert.equal(pomiar.przepelnienie, 0);
      assert.ok(pomiar.trescMiesciSie && pomiar.szafaMiesciSie && pomiar.portyDostepne);
      assert.equal(await strona.locator('.hero-rack-hybryda .rack-device').count(), 3);
      assert.equal(await strona.locator('.grafika-hybrydowa [data-speed]').count(), 13);
      assert.equal(await strona.locator('#grafika-szafy').getAttribute('href'), './assets/img/hero-rack.png');
      const zgodnosc = await strona.evaluate(() => {
        const rysunek = document.querySelector('.grafika-hybrydowa');
        const przeliczenie = rysunek.getScreenCTM();
        return [...rysunek.querySelectorAll('[data-speed]')].every(kanal => {
          const wycinek = kanal.querySelector('[clip-path]');
          const rys = wycinek ? document.querySelector(wycinek.getAttribute('clip-path').slice(4, -1)).querySelector('rect').getBBox() : kanal.querySelector('circle').getBBox();
          const punkt = new DOMPoint(rys.x + rys.width / 2, rys.y + rys.height / 2).matrixTransform(przeliczenie);
          const przycisk = document.querySelector('[data-rack-tech="' + kanal.dataset.technologiaKanalu + '"]');
          return przycisk.contains(document.elementFromPoint(punkt.x, punkt.y));
        });
      });
      assert.ok(zgodnosc, 'Kontrolki muszą skalować się razem z obrazem i odpowiadającym im obszarem wyboru');
      if (szerokosc > 1230) {
        assert.ok(pomiar.wysokoscPanelu <= pomiar.wysokoscSciany + 2);
        assert.ok(pomiar.wysokoscPanelu <= pomiar.wysokoscTylnejKrawedzi && pomiar.goraTylu >= 0 && pomiar.dolTylu >= 0);
        assert.ok(pomiar.zakladka >= 24 && pomiar.zakladka <= 44);
        assert.ok(pomiar.gora >= 0 && pomiar.dol >= 0);
        assert.equal(pomiar.lewyBorder, '0px');
        const odslonietaTresc = await strona.evaluate(() => {
          const krawedz = document.querySelector('.tylna-krawedz').getBoundingClientRect();
          return [...document.querySelectorAll('.hero-tech-panel-top,#hero-tech-icon,#hero-tech-title,#hero-tech-description,.hero-tech-facts,#hero-tech-link')].every(element => element.getBoundingClientRect().left > krawedz.right + 8);
        });
        assert.ok(odslonietaTresc, 'Treść panelu musi znajdować się poza boczną ścianką');
      }
    }
    await strona.locator('[data-rack-tech="LAN"]').hover();
    await sprawdzWybor(strona, 'LAN', poczatek);
    await strona.mouse.move(2, 100);
    await strona.waitForTimeout(180);
    await strona.screenshot({ path: fileURLToPath(new URL(`hero-${szerokosc}.png`, katalog)) });
    await strona.locator('#cennik').scrollIntoViewIfNeeded();
    await strona.screenshot({ path: fileURLToPath(new URL(`cennik-${szerokosc}.png`, katalog)) });

    // Przeniesione kontrolki nadal sterują cenami, formularzem i interfejsami.
    await strona.locator('#animation-toggle').click();
    for (const [technologia, pakiety] of Object.entries(oferta)) {
      await strona.locator(`.device-tech-tabs [data-technology="${technologia}"]`).click();
      const dane = await strona.evaluate(technologia => PLAN_DATA[technologia].map(pakiet => [pakiet.down, pakiet.up, pakiet.monthly24, pakiet.monthly12]), technologia);
      assert.deepEqual(dane, pakiety);
      assert.equal(await strona.locator('#plans .plan').count(), pakiety.length);
      assert.equal(await strona.locator('#central-device .speed-port').count(), pakiety.length);
      if (technologia === 'AIR') assert.equal(await strona.locator('#central-device .jack-rj,#central-device .sc-simplex').count(), 0);
      for (const okres of technologia === 'FIBER' ? ['24', 'none'] : ['24', '12', 'none']) {
        await strona.locator(`[data-term="${okres}"]`).click();
        assert.equal(await strona.locator(`[data-term="${okres}"]`).getAttribute('aria-pressed'), 'true');
        assert.equal(await strona.locator('#availability-form input[name="umowa"]:checked').inputValue(), okres);
        assert.deepEqual(await strona.locator('#plans .price strong').allTextContents(), pakiety.map(pakiet => okres === 'none' ? 'Wycena indywidualna' : String(pakiet[okres === '12' ? 3 : 2])));
      }
      assert.equal(await strona.locator('[data-term="12"]').isDisabled(), technologia === 'FIBER');
      if (await strona.locator('#compare-show-all').isEnabled()) await strona.locator('#compare-show-all').click();
      const tabela = await strona.locator('#comparison-panel').innerText();
      for (const pakiet of pakiety) assert.ok(tabela.includes(`${technologia}-${pakiet[0]}`));

      // Pomiar rzeczywistych tras SVG, także wokół kart w kolejnych rzędach.
      const trasy = await strona.evaluate(() => PLAN_DATA[technology].map(pakiet => {
        const warstwa = document.querySelector('#link-layer'), strefa = document.querySelector('#connection-zone').getBoundingClientRect();
        const sciezka = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        sciezka.setAttribute('d', locate(pakiet.id)); warstwa.append(sciezka);
        const dlugosc = sciezka.getTotalLength(), kolizje = new Set();
        const obceKarty = [...document.querySelectorAll('#plans .plan')].filter(karta => karta.dataset.planId !== pakiet.id).map(karta => ({ id: karta.dataset.planId, granice: karta.getBoundingClientRect() }));
        for (let odleglosc = 0; odleglosc <= dlugosc; odleglosc += 2) {
          const punkt = sciezka.getPointAtLength(odleglosc), x = punkt.x + strefa.left, y = punkt.y + strefa.top;
          for (const { id, granice } of obceKarty) {
            if (x > granice.left - 2 && x < granice.right + 2 && y > granice.top - 2 && y < granice.bottom + 2) kolizje.add(id);
          }
        }
        sciezka.remove(); return { pakiet: pakiet.id, dlugosc, kolizje: [...kolizje] };
      }));
      for (const trasa of trasy) { assert.ok(trasa.dlugosc > 0); assert.deepEqual(trasa.kolizje, [], `Kolizja ${szerokosc}px / ${trasa.pakiet}`); liczbaTras++; }
      const kafelki = await strona.locator('#plans .plan').evaluateAll(karty => karty.map(karta => {
        const etykieta = karta.querySelector('.card-terminal-label').getBoundingClientRect();
        const port = karta.querySelector('.mini-interface').getBoundingClientRect();
        const liczba = karta.querySelector('.predkosc-pobierania strong');
        return { nazwa: karta.querySelector('.plan-speed').textContent, oczekiwana: karta.dataset.technology + '-' + karta.dataset.speed,
          numeracja: !!karta.querySelector('.plan-index'), etykietaNad: etykieta.bottom <= port.top,
          rozmiar: parseFloat(getComputedStyle(liczba).fontSize), przepelnienie: karta.scrollWidth > karta.clientWidth + 1 };
      }));
      kafelki.forEach(karta => {
        assert.equal(karta.nazwa, karta.oczekiwana); assert.equal(karta.numeracja, false);
        assert.ok(karta.etykietaNad && !karta.przepelnienie); assert.equal(karta.rozmiar, 42);
      });
      await strona.locator('#central-device .speed-port').last().click();
      await strona.waitForFunction(() => document.querySelector('#link-active').getAttribute('d'));
      assert.equal(await strona.locator('#plans .plan.is-selected').count(), 1);
      assert.match(await strona.locator('#availability-choice-summary').innerText(), new RegExp(technologia));
    }
    console.log(`PASS ${szerokosc}px: HERO, ceny, okresy, tabela i 13 tras`);
  }

  // Rzeczywisty Tab/Enter/Space i szybkie wskazania nie gubią ostatniego wyboru.
  await strona.setViewportSize({ width: 1440, height: 1100 }); await strona.goto(adres);
  const poczatek = await geometria(strona);
  for (let powtorzenie = 0; powtorzenie < 3; powtorzenie++) {
    await strona.locator('[data-rack-tech="LAN"]').focus();
    for (const technologia of ['LAN', 'FIBER', 'AIR']) {
      if (technologia !== 'LAN') await strona.keyboard.press('Tab');
      await strona.keyboard.press(powtorzenie % 2 ? 'Space' : 'Enter');
      await sprawdzWybor(strona, technologia, poczatek);
    }
  }
  await strona.locator('#hero-tech-link').click();
  assert.equal(await strona.locator('.device-tech-tabs [data-technology="AIR"]').getAttribute('aria-pressed'), 'true');
  await strona.locator('#animation-toggle').click();
  const bezRuchu = await strona.evaluate(() => ({
    pcb: getComputedStyle(document.querySelector('.pcb-impulsy')).display,
    dioda: getComputedStyle(document.querySelector('.hero-rack-stage .rj-link')).animationName,
  }));
  assert.deepEqual(bezRuchu, { pcb: 'none', dioda: 'none' });
  assert.equal(await strona.locator('.pcb-hero').count(), 0);
  await strona.locator('[data-rack-tech="FIBER"]').hover();
  assert.equal(await strona.locator('#hero-tech-panel').getAttribute('data-tech'), 'FIBER');
  await strona.locator('#animation-toggle').click();
  assert.ok(await strona.evaluate(() => !document.querySelector('.pcb-tlo').animationsPaused() && getComputedStyle(document.querySelector('.pcb-impulsy')).display !== 'none'));

  // Rzeczywista sekwencja wpięcia działa także z włączonymi animacjami.
  for (const technologia of ['LAN', 'FIBER', 'AIR']) {
    await strona.locator(`.device-tech-tabs [data-technology="${technologia}"]`).click();
    const identyfikator = `${technologia}-${oferta[technologia][0][0]}M`;
    await strona.locator(`[data-port-plan-id="${identyfikator}"]`).click();
    await strona.waitForFunction(identyfikator => document.querySelector('#connection-state').textContent.includes(`${identyfikator}:`) && document.querySelector('#connection-state').textContent.includes('są połączone'), identyfikator);
    await strona.waitForFunction(() => document.querySelector('#link-active').getAttribute('d'));
    assert.equal(await strona.locator(`#plans [data-plan-id="${identyfikator}"]`).getAttribute('data-port-count'), '1');
    assert.equal(await strona.locator('#link-active').evaluate(element => element.getTotalLength() > 0), true);
    if (technologia === 'AIR') assert.equal(await strona.locator('#connection-zone').getAttribute('data-radio-period-ms'), '2400');
    await strona.locator(`[data-rack-tech="${technologia}"]`).hover();
    await sprawdzWybor(strona, technologia, poczatek);
    await strona.waitForFunction(technologia => {
      const kolory = { LAN: 'rgb(255, 32, 62)', FIBER: 'rgb(255, 123, 25)', AIR: 'rgb(63, 168, 255)' };
      return getComputedStyle(document.querySelector('#hero-tech-title')).color === kolory[technologia];
    }, technologia);
    await strona.screenshot({ path: fileURLToPath(new URL(`technologia-${technologia}-1440.png`, katalog)) });
  }

  const oczekiwaneOkresy = { LAN: [5, 2.5, 1.25, .714, .455], FIBER: [1, .333, .167], AIR: [2.4, 1.818, 1.224, .923, .741] };
  for (const technologia of ['LAN', 'FIBER', 'AIR']) {
    const okresy = await strona.locator(`[data-technologia-kanalu="${technologia}"]`).evaluateAll(kanaly => kanaly.map(kanal => parseFloat(getComputedStyle(kanal.querySelector('.rj-link,.fiber-activity,.wi')).animationDuration)));
    assert.equal(okresy.length, oferta[technologia].length);
    assert.deepEqual(okresy, oczekiwaneOkresy[technologia]);
    assert.ok(okresy.every((okres, indeks) => okres > 0 && (!indeks || okres < okresy[indeks - 1])));
  }
  // Każdy kanał AIR nadaje kolejno małym, średnim i dużym łukiem.
  const kolejnoscFal = await strona.locator('[data-technologia-kanalu="AIR"]').evaluateAll(kanaly => kanaly.map(kanal => {
    const luki = [...kanal.querySelectorAll('.wi')];
    const animacje = luki.map(luk => luk.getAnimations()[0]);
    const czasy = animacje.map(animacja => animacja.currentTime);
    const okres = parseFloat(getComputedStyle(luki[0]).animationDuration) * 1000;
    const probki = [0, 1, 2].map(krok => {
      animacje.forEach(animacja => { animacja.currentTime = okres * (1.35 + krok * .22); });
      return luki.map(luk => Number(getComputedStyle(luk).opacity));
    });
    animacje.forEach((animacja, indeks) => { animacja.currentTime = czasy[indeks]; });
    return { liczba: luki.length, probki };
  }));
  kolejnoscFal.forEach(kanal => {
    assert.equal(kanal.liczba, 3);
    kanal.probki.forEach((probka, krok) => assert.ok(probka[krok] > .85 && probka.every((jasnosc, indeks) => indeks === krok || jasnosc < .65), 'Łuki AIR muszą rozbłyskiwać kolejno'));
  });
  // Mierzymy rzeczywiste miganie przez pełny okres najwolniejszego kanału.
  const miganie = await strona.evaluate(async () => {
    const kanaly = [...document.querySelectorAll('.hero-rack-stage [data-speed]')].map(kanal => ({
      nazwa: kanal.querySelector('title').textContent, dioda: kanal.querySelector('.rj-link,.fiber-activity,.wi'), probki: [],
    }));
    for (let numer = 0; numer < 32; numer++) {
      kanaly.forEach(kanal => kanal.probki.push(Number(getComputedStyle(kanal.dioda).opacity)));
      await new Promise(koniec => setTimeout(koniec, 173));
    }
    return kanaly.map(kanal => ({ nazwa: kanal.nazwa, minimum: Math.min(...kanal.probki), maksimum: Math.max(...kanal.probki),
      czas: kanal.dioda.getAnimations()[0].currentTime, stan: kanal.dioda.getAnimations()[0].playState }));
  });
  assert.equal(miganie.length, 13);
  miganie.forEach(kanal => assert.ok(kanal.maksimum - kanal.minimum > .2 && kanal.stan === 'running', `Brak migania: ${kanal.nazwa}`));
  for (const technologia of ['LAN', 'FIBER', 'AIR']) {
    await strona.locator(`[data-rack-tech="${technologia}"]`).hover();
    await sprawdzWybor(strona, technologia, poczatek);
    const czasy = await strona.locator('.hero-rack-stage [data-speed]').evaluateAll(kanaly => kanaly.map(kanal => kanal.querySelector('.rj-link,.fiber-activity,.wi').getAnimations()[0].currentTime));
    assert.ok(czasy.every((czas, indeks) => czas > miganie[indeks].czas), 'Zmiana technologii zatrzymała lub zresetowała kontrolkę');
    await strona.locator('#hero-tech-link').click();
    assert.equal(await strona.locator('.device-tech-tabs [aria-pressed="true"]').getAttribute('data-technology'), technologia);
  }
  animacjeKanalow.push(...miganie);
  await strona.emulateMedia({ reducedMotion: 'reduce' });
  assert.ok(await strona.locator('.pcb-impulsy').evaluateAll(grupy => grupy.every(grupa => getComputedStyle(grupa).display === 'none')));
  assert.equal(await strona.locator('.pcb-hero').count(), 0);
  await strona.locator('[data-rack-tech="AIR"]').hover();
  assert.equal(await strona.locator('#hero-tech-panel').getAttribute('data-tech'), 'AIR');
  assert.equal(await strona.locator('.hero-rack-stage .wi').first().evaluate(element => getComputedStyle(element).animationName), 'none');
  await strona.screenshot({ path: fileURLToPath(new URL('reduced-motion-1440.png', katalog)) });

  const dotyk = await przegladarka.newPage({ viewport: { width: 390, height: 1100 }, hasTouch: true, isMobile: true });
  sledzBledy(dotyk); await dotyk.goto(adres);
  const poczatekDotyku = await geometria(dotyk);
  for (let powtorzenie = 0; powtorzenie < 3; powtorzenie++) {
    for (const technologia of ['LAN', 'FIBER', 'AIR']) {
      await dotyk.locator(`[data-rack-tech="${technologia}"]`).tap();
      await sprawdzWybor(dotyk, technologia, poczatekDotyku);
    }
  }
  // Gest przewijania przez urządzenie nie wybiera nowej technologii.
  const sesja = await dotyk.context().newCDPSession(dotyk);
  const urzadzenie = await dotyk.locator('[data-rack-tech="LAN"]').boundingBox();
  const punkt = { x: urzadzenie.x + 80, y: urzadzenie.y + 25 };
  const przewiniecie = await dotyk.evaluate(() => scrollY);
  await sesja.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [punkt] });
  await sesja.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: punkt.x, y: punkt.y - 90 }] });
  await sesja.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await dotyk.waitForFunction(poczatek => scrollY > poczatek, przewiniecie);
  assert.equal(await dotyk.locator('#hero-tech-panel').getAttribute('data-tech'), 'AIR');
  assert.equal(await dotyk.locator('[data-rack-tech="LAN"]').evaluate(element => getComputedStyle(element).boxShadow), 'none', 'Dotyk nie pozostawia podświetlenia hover');
  await dotyk.emulateMedia({ reducedMotion: 'reduce' });
  await dotyk.locator('[data-rack-tech="FIBER"]').tap();
  assert.equal(await dotyk.locator('#hero-tech-panel').getAttribute('data-tech'), 'FIBER');
  assert.equal(await dotyk.evaluate(() => document.documentElement.scrollWidth), 390);
  assert.deepEqual(bledy, [], 'Błędy JavaScript');
  assert.deepEqual(konsola, [], 'Błędy konsoli');
  console.log(`PASS klawiatura, dotyk, scroll, ograniczony ruch, 13 kanałów; ${liczbaTras} tras bez kolizji`);
} finally {
  await writeFile(new URL('wyniki.json', katalog), JSON.stringify({ pomiary, liczbaTras, animacjeKanalow, bledy, konsola, siec }, null, 2));
  await przegladarka?.close();
  serwer.kill();
}
