import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
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

test('cennik: przeniesiona strona i chronione moduły pozostają zgodne z baseline etapu 00', () => {
  const manifest = JSON.parse(czytaj('docs/integracja-home-v3/dowody/manifest-cennika.json'));
  for (const wpis of manifest.filter(wpis => wpis.plik === 'index.html' || wpis.plik.startsWith('assets/'))) {
    // Git może zmieniać końce linii tekstu między Windows a Linux.
    const bajty = czytaj(wpis.plik === 'index.html' ? 'cennik.html' : wpis.plik);
    assert.ok([wpis.sha256Git, wpis.sha256Lokalny].includes(skrot(bajty)), wpis.plik);
  }
});
