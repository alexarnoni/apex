// Empacota a UI + engine em UM arquivo HTML (sem servidor, sem dependência em runtime).
//   npm run build  ->  dist/apex.html           (abre direto no navegador)
//                      dist/apex.artifact.html   (fragmento para publicar como Artifact)

import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const out = await build({
  entryPoints: [join(root, 'ui/app.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2020',
  write: false,
  legalComments: 'none',
  // Destino opcional do botão de feedback (ex.: https://github.com/dono/repo/issues/new).
  define: { __FEEDBACK_URL__: JSON.stringify(process.env.APEX_FEEDBACK_URL ?? '') },
});

// Evita que "</script" dentro do bundle feche a tag antes da hora.
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const shell = readFileSync(join(root, 'ui/shell.html'), 'utf8');
const fragment = shell.replace('{{BUNDLE}}', () => js);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/apex.artifact.html'), fragment);
const full = `<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>\n${fragment}\n</body></html>\n`;
writeFileSync(join(root, 'dist/apex.html'), full);
writeFileSync(join(root, 'dist/index.html'), full); // raiz do site (GitHub Pages / Cloudflare Pages)
console.log(`dist/apex.html  ${(Buffer.byteLength(fragment) / 1024).toFixed(0)} KB`);
