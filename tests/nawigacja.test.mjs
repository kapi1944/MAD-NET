import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const strony = ['index.html','cennik.html','uslugi.html','kontakt.html','internet.html','monitoring-alarmy.html','sieci-it.html','strony-www-hosting.html','instalacje-tv-sat.html'];
const czytaj = plik => readFileSync(new URL(`../${plik}`,import.meta.url),'utf8');
test('nawigacja: dziewięć stron ma wspólne elementy i istniejące względne cele',()=>{
  for(const plik of strony){
    const html = czytaj(plik);
    for(const znacznik of ['wspolny-naglowek','wspolna-stopka','./assets/img/mad-net-logo.png','./assets/css/nawigacja.css','./assets/js/nawigacja.js','aria-controls="lista-uslug"']) assert.ok(html.includes(znacznik),`${plik}: ${znacznik}`);
    assert.doesNotMatch(html,/href="#"|https:\/\/kapi1944\.github\.io/);
    for(const [,cel] of html.matchAll(/<a\b[^>]*href="(\.\/[^"#]+)(?:#[^"]*)?"/g)) assert.ok(existsSync(new URL(`../${cel}`,import.meta.url)),`${plik}: martwy cel ${cel}`);
    for(const [,cel,fragment] of html.matchAll(/<a\b[^>]*href="(?:\.\/([^"#]+))?#([^"$]+)"/g)){
      assert.ok(czytaj(cel||plik).includes(`id="${fragment}"`),`${plik}: brak fragmentu ${fragment}`);
    }
  }
  assert.equal((czytaj('uslugi.html').match(/class="baner-uslugi"/g)||[]).length,5);
  for(const plik of strony.slice(3)) assert.match(czytaj(plik),/Strona tymczasowa/);
});
test('nawigacja: nowe skrypty mają poprawną składnię',()=>{
  for(const plik of ['nawigacja.js','stare-adresy.js']) assert.equal(spawnSync(process.execPath,['--check',fileURLToPath(new URL(`../assets/js/${plik}`,import.meta.url))]).status,0);
});
