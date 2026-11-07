import { createHash } from 'node:crypto';

// Cabeçalho do site publicado: descrição, ícone, cartão de compartilhamento (WhatsApp, redes) e,
// se configurado, o script de análise. Sem DOM nem arquivos: recebe valores e devolve texto.

export const DEFAULT_SITE_URL = 'https://bandeirada.alexarnoni.com/';
export const TITLE = 'Bandeirada · da largada à bandeirada';
export const DESCRIPTION = 'Simulador de carreira de Fórmula 1 no navegador: comece no kart, suba por F4, F3 e F2 e dispute títulos na F1. Projeto de fã, sem vínculo com a F1.';

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Ícone: a mesma bandeira quadriculada do logotipo, em roxo.
const FAVICON = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#7b3fe4"/><g fill="#fff"><rect x="5" y="7.75" width="5.5" height="5.5"/><rect x="16" y="7.75" width="5.5" height="5.5"/><rect x="10.5" y="13.25" width="5.5" height="5.5"/><rect x="21.5" y="13.25" width="5.5" height="5.5"/><rect x="5" y="18.75" width="5.5" height="5.5"/><rect x="16" y="18.75" width="5.5" height="5.5"/></g><g fill="#4a1d9e"><rect x="10.5" y="7.75" width="5.5" height="5.5"/><rect x="21.5" y="7.75" width="5.5" height="5.5"/><rect x="5" y="13.25" width="5.5" height="5.5"/><rect x="16" y="13.25" width="5.5" height="5.5"/><rect x="10.5" y="18.75" width="5.5" height="5.5"/><rect x="21.5" y="18.75" width="5.5" height="5.5"/></g></svg>',
)}`;

// --- Content-Security-Policy -------------------------------------------------------------------
// O GitHub Pages não deixa configurar cabeçalhos, então a política vai por <meta>. O jogo embute o script
// e o estilo na página, por isso a política autoriza esses dois blocos pelo hash SHA-256 (calculado no
// build) em vez de 'unsafe-inline'. Atributos style="..." (gerados pela interface) continuam permitidos
// só em style-src-attr. frame-ancestors não funciona em <meta>, então não está aqui.

export const sha256 = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

export function buildCsp({ scriptHashes = [], styleHashes = [], endpoint = '', goatcounter = '' } = {}) {
  const script = [...scriptHashes];
  const connect = ["'self'"];
  const img = ["'self'", 'data:'];
  if (endpoint) connect.push(new URL(endpoint).origin);
  if (goatcounter) {
    const host = `https://${goatcounter}.goatcounter.com`;
    script.push('https://gc.zgo.at');
    connect.push(host);
    img.push(host);
  }
  const styleElem = [...styleHashes, 'https://fonts.googleapis.com'];
  const directives = {
    'default-src': ["'none'"],
    'script-src': script,
    'style-src': styleElem, // navegadores antigos, sem style-src-elem/attr
    'style-src-elem': styleElem,
    'style-src-attr': ["'unsafe-inline'"],
    'font-src': ['https://fonts.gstatic.com'],
    'img-src': img,
    'connect-src': connect,
    'base-uri': ["'none'"],
    'form-action': ["'none'"],
    'object-src': ["'none'"],
  };
  return Object.entries(directives).map(([k, v]) => `${k} ${v.join(' ')}`).join('; ');
}
// Garante https e barra final: "https://bandeirada.alexarnoni.com" -> "https://bandeirada.alexarnoni.com/".
export function normalizeSiteUrl(raw) {
  const u = String(raw ?? '').trim() || DEFAULT_SITE_URL;
  if (!/^https:\/\/[a-z0-9.-]+(\/[^\s?#]*)?$/i.test(u)) throw new Error(`BANDEIRADA_SITE_URL inválida (use https://dominio/caminho): ${u}`);
  return u.endsWith('/') ? u : `${u}/`;
}

export function normalizeGoatCounter(raw) {
  const c = String(raw ?? '').trim();
  if (!c) return '';
  if (!/^[a-z0-9-]+$/i.test(c)) throw new Error(`BANDEIRADA_GOATCOUNTER inválido (só o código do site, ex.: "meusite"): ${c}`);
  return c;
}

// Endereço do Worker de feedback (https). Vazio desliga o envio e deixa só "Copiar".
export function normalizeEndpoint(raw) {
  const u = String(raw ?? '').trim();
  if (!u) return '';
  // https em produção; http só para localhost (teste local do formulário).
  const ok = /^https:\/\/[a-z0-9.-]+(:\d+)?(\/[^\s]*)?$/i.test(u) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/[^\s]*)?$/i.test(u);
  if (!ok) throw new Error(`BANDEIRADA_FEEDBACK_ENDPOINT inválido (use https://endereco-do-worker): ${u}`);
  return u;
}
export function buildHead({ siteUrl, goatcounter, hasOgImage = true, csp = '' } = {}) {
  const site = normalizeSiteUrl(siteUrl);
  const gc = normalizeGoatCounter(goatcounter);
  const image = `${site}og.jpg`;
  const lines = [
    ...(csp ? [`<meta http-equiv="Content-Security-Policy" content="${esc(csp)}">`] : []),
    `<meta name="description" content="${esc(DESCRIPTION)}">`,
    '<meta name="theme-color" content="#0f1218">',
    `<link rel="icon" type="image/svg+xml" href="${esc(FAVICON)}">`,
    `<link rel="canonical" href="${esc(site)}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="pt_BR">',
    '<meta property="og:site_name" content="Bandeirada">',
    `<meta property="og:title" content="${esc(TITLE)}">`,
    `<meta property="og:description" content="${esc(DESCRIPTION)}">`,
    `<meta property="og:url" content="${esc(site)}">`,
    `<meta name="twitter:card" content="${hasOgImage ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${esc(TITLE)}">`,
    `<meta name="twitter:description" content="${esc(DESCRIPTION)}">`,
  ];
  if (hasOgImage) {
    lines.push(`<meta property="og:image" content="${esc(image)}">`, `<meta name="twitter:image" content="${esc(image)}">`);
  }
  if (gc) {
    // GoatCounter: sem cookies. count.js define window.goatcounter.count(), usado para os marcos da carreira.
    lines.push(`<script data-goatcounter="https://${gc}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>`);
  }
  return lines.join('\n');
}
