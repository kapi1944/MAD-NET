import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const text = path => readFileSync(join(root, path), 'utf8');
const html = text('cennik.html');
const js = text('assets/js/cennik.js');

test('strona główna HOME ma własne zasoby i sekcje', () => {
  const stronaGlowna = text('index.html');
  for (const znacznik of ['<html lang="pl">', 'id="tytul-glowny"', 'id="nawigacja"', 'id="mapa-ramka"', './assets/css/home.css', './assets/js/home.js']) {
    assert.ok(stronaGlowna.includes(znacznik), `HOME: brak ${znacznik}`);
  }
  assert.ok(!stronaGlowna.includes('./assets/css/styles.css'));
  assert.ok(!stronaGlowna.includes('./assets/js/cennik.js'));
  assert.ok(!existsSync(join(root, 'home.html')), 'HOME ma jedno źródło w index.html');
});

test('struktura startowa i poprawne odnośniki do rozdzielonych zasobów', () => {
  for (const file of [
    'assets/css/styles.css', 'assets/js/cennik.js',
    'assets/js/dostepnosc.js', 'assets/js/hero-rack.js',
    'assets/img/mad-net-logo.png',
  ]) {
    assert.ok(existsSync(join(root, file)), `Brak pliku: ${file}`);
    assert.ok(html.includes(`./${file}`), `Brak odnośnika do: ${file}`);
  }
  assert.equal((html.match(/<style>/g) ?? []).length, 0);
  assert.equal((html.match(/<script>/g) ?? []).length, 0);
  assert.ok(!html.includes('data:image/png;base64,'));
});

test('skrypty wykonują się w pierwotnej kolejności', () => {
  const positions = ['cennik.js', 'dostepnosc.js', 'hero-rack.js'].map(name => html.indexOf(`assets/js/${name}`));
  assert.ok(positions.every(v => v > 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test('oryginalny szablon V18 jest zachowany do porównań i rollbacku', () => {
  const original = text('docs/archiwum/V18_oryginal.html');
  assert.ok(original.includes('rack-device'));
  assert.ok(original.includes('<style>'));
  assert.ok(original.includes('<script>'));
});

test('13 wariantów: 5 LAN, 3 FIBER i 5 AIR', () => {
  for (const [tech, speeds] of Object.entries({
    LAN: [10,20,40,60,80], FIBER: [50,100,300], AIR: [10,20,40,60,80],
  })) {
    for (const speed of speeds) {
      assert.ok(js.includes(`${tech}-${speed}M`), `Brak ${tech}-${speed}M`);
    }
  }
  assert.equal((html.match(/data-rack-tech="(LAN|FIBER|AIR)"/g) ?? []).length, 3);
});

test('zachowano sekcje i formularz, bez fikcyjnego backendu SMTP', () => {
  for (const marker of ['id="cennik"', 'id="oplaty"', 'id="kontakt"', 'id="availability-form"', 'id="hero-rack-stage"']) {
    assert.ok(html.includes(marker), `Brak sekcji: ${marker}`);
  }
  assert.ok(text('assets/js/dostepnosc.js').includes('api/zapytanie.php'));
  assert.ok(!existsSync(join(root, 'api/zapytanie.php')), 'Backend nie powinien być pozornie udostępniony.');
});

test('poprawna składnia JavaScript we wszystkich trzech skryptach', () => {
  for (const file of ['assets/js/cennik.js','assets/js/dostepnosc.js','assets/js/hero-rack.js']) {
    const result = spawnSync(process.execPath, ['--check', join(root, file)], { encoding:'utf8' });
    assert.equal(result.status, 0, `${file}: ${result.stderr}`);
  }
});
