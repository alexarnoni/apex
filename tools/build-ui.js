// Empacota a UI + engine em UM arquivo HTML (sem servidor, sem dependência em runtime).
//   npm run build  ->  dist/index.html (= dist/apex.html)  site completo, com cabeçalho e cartão de compartilhamento
//                      dist/apex.artifact.html             fragmento para publicar como Artifact
//                      dist/og.jpg                         imagem do cartão de compartilhamento (de ui/assets/)
//
// Variáveis de ambiente (todas opcionais):
//   BANDEIRADA_SITE_URL       endereço público do site (padrão: https://bandeirada.alexarnoni.com/), usado em canonical e og:url/og:image
//   BANDEIRADA_FEEDBACK_URL   destino do botão "Enviar pelo GitHub" (ex.: https://github.com/dono/repo/issues/new)
//   BANDEIRADA_GOATCOUNTER    código do site no GoatCounter; sem ele nenhuma análise é carregada
//   BANDEIRADA_FEEDBACK_ENDPOINT  endereço do Worker de feedback (e-mail); sem ele o formulário só copia o relatório

import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildHead, normalizeEndpoint, normalizeGoatCounter, normalizeSiteUrl, TITLE } from './site-head.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const siteUrl = normalizeSiteUrl(process.env.BANDEIRADA_SITE_URL);
const goatcounter = normalizeGoatCounter(process.env.BANDEIRADA_GOATCOUNTER);
const feedbackEndpoint = normalizeEndpoint(process.env.BANDEIRADA_FEEDBACK_ENDPOINT);

const out = await build({
  entryPoints: [join(root, 'ui/app.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2020',
  write: false,
  legalComments: 'none',
  define: {
    __FEEDBACK_URL__: JSON.stringify(process.env.BANDEIRADA_FEEDBACK_URL ?? ''),
    __ANALYTICS__: JSON.stringify(!!goatcounter),
    __FEEDBACK_ENDPOINT__: JSON.stringify(feedbackEndpoint),
  },
});

// Evita que "</script" dentro do bundle feche a tag antes da hora.
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const shell = readFileSync(join(root, 'ui/shell.html'), 'utf8');
const [headPart, bodyPart] = shell.split('<!--BODY-->');
const body = bodyPart.replace('{{BUNDLE}}', () => js);

mkdirSync(join(root, 'dist'), { recursive: true });

// Artifact: só o fragmento, sem cabeçalho extra.
writeFileSync(join(root, 'dist/apex.artifact.html'), `${headPart}${body}`);

// Site: cabeçalho de verdade (descrição, ícone, cartão de compartilhamento, análise).
const ogSrc = join(root, 'ui/assets/og.jpg');
const hasOgImage = existsSync(ogSrc);
if (hasOgImage) copyFileSync(ogSrc, join(root, 'dist/og.jpg'));
const head = headPart.replace('<title>Bandeirada</title>', `<title>${TITLE}</title>`);
const full = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
${buildHead({ siteUrl, goatcounter, hasOgImage })}
${head}</head><body>${body}
</body></html>
`;
writeFileSync(join(root, 'dist/apex.html'), full);
writeFileSync(join(root, 'dist/index.html'), full); // raiz do site (GitHub Pages / Cloudflare Pages)
console.log(`dist/index.html  ${(Buffer.byteLength(full) / 1024).toFixed(0)} KB  · site ${siteUrl}${goatcounter ? ` · goatcounter ${goatcounter}` : ''}`);
