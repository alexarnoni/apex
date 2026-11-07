// Cabeçalho do site publicado: descrição, ícone, cartão de compartilhamento (WhatsApp, redes) e,
// se configurado, o script de análise. Sem DOM nem arquivos: recebe valores e devolve texto.

export const DEFAULT_SITE_URL = 'https://alexarnoni.github.io/apex/';
export const TITLE = 'Apex · do kart à glória';
export const DESCRIPTION = 'Simulador de carreira de Fórmula 1 no navegador: comece no kart, suba por F4, F3 e F2 e dispute títulos na F1. Projeto de fã, sem vínculo com a F1.';

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Ícone: quadrado grafite com um chevron amarelo (a "ponta" do A de Apex).
const FAVICON = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#14171f"/><path d="M6 25 14 7h4l8 18h-5l-5-11.5L11 25z" fill="#ffd21f"/></svg>',
)}`;

// Garante https e barra final: "https://apex.alexarnoni.com" -> "https://apex.alexarnoni.com/".
export function normalizeSiteUrl(raw) {
  const u = String(raw ?? '').trim() || DEFAULT_SITE_URL;
  if (!/^https:\/\/[a-z0-9.-]+(\/[^\s?#]*)?$/i.test(u)) throw new Error(`APEX_SITE_URL inválida (use https://dominio/caminho): ${u}`);
  return u.endsWith('/') ? u : `${u}/`;
}

export function normalizeGoatCounter(raw) {
  const c = String(raw ?? '').trim();
  if (!c) return '';
  if (!/^[a-z0-9-]+$/i.test(c)) throw new Error(`APEX_GOATCOUNTER inválido (só o código do site, ex.: "meusite"): ${c}`);
  return c;
}

export function buildHead({ siteUrl, goatcounter, hasOgImage = true } = {}) {
  const site = normalizeSiteUrl(siteUrl);
  const gc = normalizeGoatCounter(goatcounter);
  const image = `${site}og.jpg`;
  const lines = [
    `<meta name="description" content="${esc(DESCRIPTION)}">`,
    '<meta name="theme-color" content="#0f1218">',
    `<link rel="icon" type="image/svg+xml" href="${esc(FAVICON)}">`,
    `<link rel="canonical" href="${esc(site)}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="pt_BR">',
    '<meta property="og:site_name" content="Apex">',
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
