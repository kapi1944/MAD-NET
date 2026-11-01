/* Kompilacja statyczna bez zależności: kopiowanie zweryfikowanej strony. */
import { cp, copyFile, mkdir, rm, readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const strony = {
  'index.html': ['<html lang="pl">', 'id="tytul-glowny"', 'id="nawigacja"', 'id="mapa-ramka"', './assets/css/home.css', './assets/js/home.js'],
  'cennik.html': ['id="cennik"', 'id="oplaty"', 'id="kontakt"', 'id="hero-rack-stage"', 'id="availability-form"', './assets/css/styles.css', './assets/css/hero-hybryda.css'],
  'uslugi.html': ['baner-uslugi', 'Usługi MAD-NET', './assets/css/uslugi.css'],
  'kontakt.html': ['strona-tymczasowa', 'Strona tymczasowa'],
  'internet.html': ['strona-tymczasowa', 'Strona tymczasowa'],
  'monitoring-alarmy.html': ['strona-tymczasowa', 'Strona tymczasowa'],
  'sieci-it.html': ['strona-tymczasowa', 'Strona tymczasowa'],
  'strony-www-hosting.html': ['strona-tymczasowa', 'Strona tymczasowa'],
  'instalacje-tv-sat.html': ['strona-tymczasowa', 'Strona tymczasowa'],
};
for (const [plik, znaczniki] of Object.entries(strony)) {
  const tresc = await readFile(join(root, plik), 'utf8');
  for (const znacznik of znaczniki) {
    if (!tresc.includes(znacznik)) throw new Error(`${plik}: brak ${znacznik} — budowanie przerwane.`);
  }
  for (const znacznik of ['wspolny-naglowek', 'wspolna-stopka', './assets/css/nawigacja.css', './assets/js/nawigacja.js']) {
    if (!tresc.includes(znacznik)) throw new Error(`${plik}: brak wspólnego elementu ${znacznik}.`);
  }
  if (plik === 'cennik.html') {
    const skrypty = ['cennik.js', 'dostepnosc.js', 'hero-rack.js'].map(nazwa => tresc.indexOf(`src="./assets/js/${nazwa}"`));
    if (skrypty.some((pozycja, numer) => pozycja < 0 || (numer > 0 && pozycja <= skrypty[numer - 1]))) {
      throw new Error('cennik.html: brak skryptów lub niepoprawna kolejność — budowanie przerwane.');
    }
  }
  for (const [, zasob] of tresc.matchAll(/(?:src|href)="(\.\/assets\/[^"#?]+)"/g)) {
    await access(join(root, zasob));
  }
}
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const plik of Object.keys(strony)) await copyFile(join(root, plik), join(dist, plik));
await cp(join(root, 'assets'), join(dist, 'assets'), { recursive: true });
console.log(`Gotowe: ${Object.keys(strony).length} stron z allowlisty + dist/assets/`);
console.log('Uwaga: wysyłka zapytań e-mail wymaga osobno wdrożonego backendu.');
