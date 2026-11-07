import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildHead, normalizeSiteUrl, normalizeGoatCounter, normalizeEndpoint, DEFAULT_SITE_URL, DESCRIPTION } from '../tools/site-head.js';

test('endereço do site: padrão, barra final e validação', () => {
  assert.equal(normalizeSiteUrl(undefined), DEFAULT_SITE_URL);
  assert.equal(normalizeSiteUrl(''), DEFAULT_SITE_URL);
  assert.equal(normalizeSiteUrl('https://bandeirada.alexarnoni.com'), 'https://bandeirada.alexarnoni.com/');
  assert.equal(normalizeSiteUrl('https://bandeirada.alexarnoni.com/'), 'https://bandeirada.alexarnoni.com/');
  assert.throws(() => normalizeSiteUrl('http://bandeirada.alexarnoni.com'), /BANDEIRADA_SITE_URL inválida/);
  assert.throws(() => normalizeSiteUrl('bandeirada.alexarnoni.com'), /BANDEIRADA_SITE_URL inválida/);
  assert.throws(() => normalizeSiteUrl('https://x.com/a b'), /BANDEIRADA_SITE_URL inválida/);
});

test('código do GoatCounter: vazio desliga; só letras, números e hífen', () => {
  assert.equal(normalizeGoatCounter(''), '');
  assert.equal(normalizeGoatCounter(undefined), '');
  assert.equal(normalizeGoatCounter(' meu-site '), 'meu-site');
  assert.throws(() => normalizeGoatCounter('x"><script>'), /BANDEIRADA_GOATCOUNTER inválido/);
  assert.throws(() => normalizeGoatCounter('a.b'), /BANDEIRADA_GOATCOUNTER inválido/);
});

test('cabeçalho traz descrição, ícone, canonical e cartão de compartilhamento com a URL certa', () => {
  const h = buildHead({ siteUrl: 'https://bandeirada.alexarnoni.com' });
  assert.match(h, /<meta name="description" content="Simulador de carreira/);
  assert.match(h, /<link rel="icon" type="image\/svg\+xml" href="data:image\/svg\+xml,/);
  assert.match(h, /<link rel="canonical" href="https:\/\/bandeirada\.alexarnoni\.com\/">/);
  assert.match(h, /<meta property="og:url" content="https:\/\/bandeirada\.alexarnoni\.com\/">/);
  assert.match(h, /<meta property="og:image" content="https:\/\/bandeirada\.alexarnoni\.com\/og\.jpg">/);
  assert.match(h, /<meta name="twitter:card" content="summary_large_image">/);
  assert.ok(DESCRIPTION.length < 200, 'descrição curta o bastante para o cartão');
});

test('sem imagem o cartão vira "summary" e não cita og:image', () => {
  const h = buildHead({ siteUrl: DEFAULT_SITE_URL, hasOgImage: false });
  assert.match(h, /twitter:card" content="summary"/);
  assert.doesNotMatch(h, /og:image/);
});

test('análise: sem código nada é carregado; com código entra o script do GoatCounter, sem cookies', () => {
  assert.doesNotMatch(buildHead({ siteUrl: DEFAULT_SITE_URL }), /goatcounter|gc\.zgo\.at/);
  const h = buildHead({ siteUrl: DEFAULT_SITE_URL, goatcounter: 'apexgame' });
  assert.match(h, /<script data-goatcounter="https:\/\/apexgame\.goatcounter\.com\/count" async src="https:\/\/gc\.zgo\.at\/count\.js"><\/script>/);
  assert.doesNotMatch(h, /cookie/i);
});

test('valores vindos do ambiente são escapados no HTML', () => {
  const h = buildHead({ siteUrl: 'https://exemplo.dev/a&b' });
  assert.match(h, /href="https:\/\/exemplo\.dev\/a&amp;b\/"/);
});

test('endereço do Worker de feedback: vazio desliga, https obrigatório', () => {
  assert.equal(normalizeEndpoint(''), '');
  assert.equal(normalizeEndpoint(undefined), '');
  assert.equal(normalizeEndpoint(' https://bandeirada-feedback.exemplo.workers.dev/ '), 'https://bandeirada-feedback.exemplo.workers.dev/');
  assert.throws(() => normalizeEndpoint('http://fb.exemplo.dev'), /BANDEIRADA_FEEDBACK_ENDPOINT inválido/);
  assert.equal(normalizeEndpoint('http://127.0.0.1:5055/feedback'), 'http://127.0.0.1:5055/feedback', 'localhost vale para teste local');
  assert.throws(() => normalizeEndpoint('http://127.0.0.1.evil.com/x'), /inválido/);
  assert.throws(() => normalizeEndpoint('fb.exemplo.dev'), /BANDEIRADA_FEEDBACK_ENDPOINT inválido/);
  assert.throws(() => normalizeEndpoint('https://a b.dev'), /BANDEIRADA_FEEDBACK_ENDPOINT inválido/);
});
