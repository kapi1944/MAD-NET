import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync, execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const czytaj = plik => readFileSync(new URL(`../${plik}`, import.meta.url));
const skrot = dane => createHash('sha256').update(dane).digest('hex');
const oryginal = czytaj('docs/archiwum/MAD-NET_HOME_V3_JEDEN_PLIK_ORIGINAL.html');
const html = czytaj('index.html').toString('utf8');

test('HOME: archiwum i obrazy zachowują oryginalne bajty i MIME V3', () => {
  assert.equal(skrot(oryginal), 'ceeef68c1d719bb37c161aa8df4c3c0a3395c7123da5e3f70571a6806dded99d');
  const obrazy = JSON.parse(czytaj('docs/integracja-home-v3/01-obrazy.json'));
  const osadzone = [...oryginal.toString('utf8').matchAll(/data:([^;,]+);base64,([A-Za-z0-9+/=]+)/g)];
  assert.equal(obrazy.length, 10);
  for (const obraz of obrazy) {
    const bajty = czytaj(obraz.plik);
    assert.equal(skrot(bajty), obraz.sha256);
    assert.equal(bajty.length, obraz.bajty);
    assert.ok(osadzone.some(([, mime, kod]) => mime === obraz.mime && Buffer.from(kod, 'base64').equals(bajty)));
    if (obraz.mime === 'image/png') assert.equal(bajty.subarray(1, 4).toString(), 'PNG');
    if (obraz.mime === 'image/jpeg') assert.equal(bajty.subarray(0, 3).toString('hex'), 'ffd8ff');
    if (obraz.mime === 'image/svg+xml') assert.match(bajty.toString(), /<svg/);
  }
});

test('HOME: osobne zasoby, język polski, brak zależności od stylów cennika', () => {
  assert.match(html, /<html lang="pl">/);
  assert.ok(html.includes('./assets/css/home.css'));
  assert.ok(html.includes('./assets/js/home.js'));
  assert.doesNotMatch(html, /data:|<style\b|<script\s*>|assets\/css\/styles\.css/);
  const css = czytaj('assets/css/home.css').toString();
  assert.doesNotMatch(css, /data:|@import/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /pointer-events:none/);
  assert.equal(spawnSync(process.execPath, ['--check', fileURLToPath(new URL('../assets/js/home.js', import.meta.url))]).status, 0);
});

test('cennik: specjalistyczny main i chronione moduły pozostają zgodne z baseline', () => {
  const manifest = JSON.parse(czytaj('docs/integracja-home-v3/dowody/manifest-cennika.json'));
  const skrotyEtapu05 = {
  "assets/css/styles.css": "5f405c68b63c73f4cede9526016ef182887d62026436cf69134dcb8e730d0a4d",
  "assets/js/cennik.js": "d638c99979cb11126176ff995ef5ec5432d264c26b9cf918a80d44980a8775a0",
  "assets/js/hero-rack.js": "4c11a7d6bdc8da3ac38af32bcd09cd50d54dec15b647d4d56ffa1d424e8e91aa",
  "assets/js/dostepnosc.js": "e473368ac64f83fc99b819ad8239ecbd83dee608174a2373c3cd075d151798cf"
};
  for (const wpis of manifest.filter(wpis => wpis.plik.startsWith('assets/'))) {
    // Git może zmieniać końce linii tekstu między Windows a Linux.
    const bajty = czytaj(wpis.plik === 'index.html' ? 'cennik.html' : wpis.plik);
    if (skrotyEtapu05[wpis.plik]) assert.equal(skrot(bajty.toString().replaceAll('\r\n', '\n')), skrotyEtapu05[wpis.plik], wpis.plik);
    else assert.ok([wpis.sha256Git, wpis.sha256Lokalny].includes(skrot(/\.(css|js|svg)$/.test(wpis.plik) ? bajty.toString().replaceAll('\r\n', '\n') : bajty)), wpis.plik);
  }
  const przed = execFileSync('git', ['show', '603ecb6b34509db80b46d659b0eeb1368eb2f275:cennik.html'], {encoding:'utf8'});
  const opisEtapu05 = "<p class=\"compare-sub\">Zaznacz dowolną liczbę technologii — jedną, dwie lub wszystkie trzy. Wybrane cenniki pojawią się poniżej, jeden pod drugim, z oddzielnymi kolorami i pełnymi parametrami. Kliknij gniazdo FIBER w nagłówku, aby podłączyć wybrany pakiet. Ponowne kliknięcie odłącza przewód. Miniporty LAN i AIR ilustrują prędkość pakietów.</p>";
  const opisBazowy = przed.match(/<p class="compare-sub">[\s\S]*?<\/p>/)[0];
  const daneBazowe = execFileSync('git', ['show', '1987ad3aa8a65fd1aa86f077af1addf3225bb228:assets/js/cennik.js'], {encoding:'utf8'}).replaceAll('\r\n', '\n');
  assert.equal(czytaj('assets/js/cennik.js').toString().replaceAll('\r\n', '\n').split('const TITLES=')[0], daneBazowe.split('const TITLES=')[0], '13 pakietów, ceny i opłaty bez zmian');
  const main = tresc => tresc.match(/<main>[\s\S]*?<\/main>/)[0].replaceAll('\r\n', '\n');
  assert.equal(main(czytaj('cennik.html').toString().replace(opisEtapu05, opisBazowy).replaceAll('SC/APC', 'SC/UPC')), main(przed));
});
