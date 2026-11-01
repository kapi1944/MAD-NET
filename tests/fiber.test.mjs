import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const czytaj=plik=>readFileSync(new URL('../'+plik,import.meta.url),'utf8');
test('FIBER: aktualne interfejsy i instrukcje stosują SC/APC Simplex',()=>{
 for(const plik of ['internet.html','cennik.html','assets/js/cennik.js','assets/js/dostepnosc.js','assets/js/hero-rack.js','README.md','AGENTS.md','docs/DECYZJE.md','docs/ARCHITEKTURA.md','docs/TESTY_MANUALNE.md'])assert.doesNotMatch(czytaj(plik),/SC\/UPC/,plik);
 assert.match(czytaj('internet.html'),/polerowanie APC pod kątem 8°/);
 assert.match(czytaj('assets/css/oferta.css'),/\.zlacze-fiber\{stroke:#78b86a\}/);
});
