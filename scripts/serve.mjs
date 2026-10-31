/* MAD-NET — prosty lokalny serwer HTTP z odświeżaniem przeglądarki bez zależności. */
import http from 'node:http';
import { readFile, stat, watch } from 'node:fs';
import { resolve, join, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const rootArg = args.indexOf('--root');
const root = rootArg >= 0 ? resolve(projectRoot, args[rootArg + 1] ?? '.') : projectRoot;
const live = !args.includes('--no-live');
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const watchers = new Set();
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};
const liveClient = `<script>(()=>{const stream=new EventSource('/__madnet_reload');stream.onmessage=(e)=>{if(e.data==='reload')location.reload()};})();</script>`;

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
  }
  const requestPath = (req.url ?? '/').split('?')[0];
  if (live && requestPath === '/__madnet_reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': connected\n\n'); watchers.add(res);
    req.on('close', () => watchers.delete(res)); return;
  }
  let relative;
  try { relative = decodeURIComponent(requestPath); } catch { res.writeHead(400); res.end(); return; }
  if (relative.includes('\0') || relative.includes('\\')) { res.writeHead(400); res.end(); return; }
  const target = resolve(root, '.' + (relative.endsWith('/') ? relative + 'index.html' : relative));
  if (target !== root && !target.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
  // Bezpiecznik: serwer deweloperski nie udostępnia .git, API ani konfiguracji.
  if (target.slice(root.length).split(/[\\/]/).some(part => part.startsWith('.') && part !== '.') ||
      target.slice(root.length).split(/[\\/]/).includes('api')) {
    res.writeHead(403); res.end(); return;
  }
  stat(target, (err, info) => {
    if (err || !info.isFile()) { res.writeHead(404); res.end('404'); return; }
    readFile(target, (readErr, data) => {
      if (readErr) { res.writeHead(500); res.end(); return; }
      let output = data;
      const extension = extname(target).toLowerCase();
      if (live && extension === '.html') {
        output = Buffer.from(data.toString('utf8').replace('</body>', liveClient + '\n</body>'));
      }
      res.writeHead(200, { 'Content-Type': MIME[extension] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : output);
    });
  });
});

server.listen(port, host, () => {
  console.log(`MAD-NET ${live ? 'DEV' : 'PREVIEW'}: http://${host}:${port}`);
  console.log('Zatrzymaj: Ctrl+C');
});
if (live) {
  let debounce;
  try {
    const watcher = watch(projectRoot, { recursive: true }, (_kind, filename = '') => {
      const name = String(filename).replaceAll('\\', '/');
      if (!name || name.startsWith('dist/') || name.startsWith('.git/') || name.startsWith('node_modules/')) return;
      if (!/\.(html|css|js|png|jpg|svg)$/.test(name)) return;
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        for (const client of watchers) client.write('data: reload\n\n');
      }, 170);
    });
    server.on('close', () => watcher.close());
  } catch (error) {
    console.warn('Automatyczne odświeżanie jest niedostępne:', error.message);
  }
}
