// Servidor local mínimo para conferir o site construído (dist/) no navegador, com as bandeiras em dist/flags.
// Sem dependências. O jogo usa localStorage, então cada porta tem os seus próprios saves.
//
//   npm run build && node tools/serve.mjs            (http://127.0.0.1:5056)
//   node tools/serve.mjs dist 5060                    (outra pasta e porta)

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize, resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? 'dist');
const port = Number(process.argv[3] ?? 5056);
const types = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json' };

createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = normalize(join(dir, p));
  if (!file.startsWith(dir) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(port, '127.0.0.1', () => console.log(`servindo ${dir} em http://127.0.0.1:${port}`));
