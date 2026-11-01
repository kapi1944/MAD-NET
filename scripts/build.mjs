/* Kompilacja statyczna bez zależności: kopiowanie zweryfikowanej strony. */
import { cp, copyFile, mkdir, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const html = await readFile(join(root, 'index.html'), 'utf8');
if (!html.includes('./assets/js/hero-rack.js') || !html.includes('id="availability-form"')) {
  throw new Error('Brakuje kluczowych elementów strony — budowanie przerwane.');
}
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await copyFile(join(root, 'index.html'), join(dist, 'index.html'));
await copyFile(join(root, 'home.html'), join(dist, 'home.html'));
await cp(join(root, 'assets'), join(dist, 'assets'), { recursive: true });
console.log('Gotowe: dist/index.html + dist/home.html + dist/assets/');
console.log('Uwaga: wysyłka zapytań e-mail wymaga osobno wdrożonego backendu.');
