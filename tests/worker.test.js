import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  handleFeedback, parsePayload, buildMime, buildSubject, formatBody, encodeSubject, originAllowed, createRateLimiter, LIMITS,
} from '../worker/feedback-core.js';

const ORIGIN = 'https://bandeirada.alexarnoni.com';
const env = (extra = {}) => {
  const sent = [];
  return {
    sent,
    ALLOWED_ORIGINS: `${ORIGIN},https://alexarnoni.github.io`,
    FEEDBACK_FROM: 'feedback@alexarnoni.com',
    FEEDBACK_TO: 'destino@exemplo.com',
    EMAIL: { send: async (m) => { sent.push(m); } },
    ...extra,
  };
};
const deps = (over = {}) => ({
  makeMessage: (from, to, raw) => ({ from, to, raw }),
  limiter: createRateLimiter({ max: 100, windowMs: 1000 }),
  now: new Date('2026-11-07T12:00:00Z'),
  ...over,
});
const post = (body, headers = {}) => new Request('https://fb.example/', {
  method: 'POST',
  headers: { origin: ORIGIN, 'content-type': 'application/json', ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});
// Assunto: texto puro ou "encoded-word" UTF-8 em base64 (RFC 2047).
const decodeSubject = (raw) => {
  const s = raw.match(/^Subject: (.*)\r\n/m)[1];
  const m = s.match(/^=\?UTF-8\?B\?(.+)\?=$/);
  return m ? Buffer.from(m[1], 'base64').toString('utf8') : s;
};
const decodeBody = (raw) => Buffer.from(raw.split('\r\n\r\n')[1].replace(/\r\n/g, ''), 'base64').toString('utf8');

test('origem: só as listadas passam', () => {
  assert.equal(originAllowed(ORIGIN, `${ORIGIN},https://x.dev`), true);
  assert.equal(originAllowed('https://outro.dev', ORIGIN), false);
  assert.equal(originAllowed(null, ORIGIN), false);
  assert.equal(originAllowed(ORIGIN, ''), false);
});

test('pré-voo CORS: 204 com cabeçalhos para origem permitida, 403 para as outras', async () => {
  const ok = await handleFeedback(new Request('https://fb.example/', { method: 'OPTIONS', headers: { origin: ORIGIN } }), env(), deps());
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get('access-control-allow-origin'), ORIGIN);
  const no = await handleFeedback(new Request('https://fb.example/', { method: 'OPTIONS', headers: { origin: 'https://ruim.dev' } }), env(), deps());
  assert.equal(no.status, 403);
});

test('envio válido manda um e-mail com assunto, corpo e CORS', async () => {
  const e = env();
  const res = await handleFeedback(post({ kind: 'bug', text: 'Travou na oferta', rating: 4, contact: 'jogador@exemplo.com', version: '1', report: 'seed 99' }), e, deps());
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal(e.sent.length, 1);
  const { from, to, raw } = e.sent[0];
  assert.equal(from, 'feedback@alexarnoni.com');
  assert.equal(to, 'destino@exemplo.com');
  assert.equal(decodeSubject(raw), '[Bandeirada] Bug · nota 4/5 · Travou na oferta');
  assert.match(raw, /^Reply-To: jogador@exemplo\.com\r\n/m);
  assert.match(raw, /Content-Type: text\/plain; charset=UTF-8/);
  const body = decodeBody(raw);
  assert.match(body, /Tipo: Bug/);
  assert.match(body, /Nota: 4\/5/);
  assert.match(body, /Travou na oferta/);
  assert.match(body, /seed 99/);
});

test('acentos no assunto e no corpo viram UTF-8 válido', async () => {
  const e = env();
  await handleFeedback(post({ kind: 'idea', text: 'Mais equipes de kart, por favor! ção' }), e, deps());
  const { raw } = e.sent[0];
  const subject = raw.match(/^Subject: (.*)\r\n/m)[1];
  assert.match(subject, /^=\?UTF-8\?B\?.+\?=$/);
  assert.equal(Buffer.from(subject.slice(10, -2), 'base64').toString('utf8'), '[Bandeirada] Ideia · Mais equipes de kart, por favor! ção');
  assert.match(decodeBody(raw), /por favor! ção/);
  assert.equal(encodeSubject('simples'), 'simples');
});

test('só a nota já vale; sem texto e sem nota é recusado', async () => {
  const e = env();
  assert.equal((await handleFeedback(post({ kind: 'career', rating: 5 }), e, deps())).status, 200);
  assert.match(decodeBody(e.sent[0].raw), /sem texto, só a nota/);
  assert.equal((await handleFeedback(post({ kind: 'bug', text: '   ' }), env(), deps())).status, 400);
  assert.equal((await handleFeedback(post({ kind: 'bug', text: 'x', rating: 9 }), env(), deps())).status, 200); // nota inválida é ignorada
});

test('origem não permitida, método errado, JSON inválido e corpo gigante', async () => {
  assert.equal((await handleFeedback(post({ text: 'x' }, { origin: 'https://ruim.dev' }), env(), deps())).status, 403);
  assert.equal((await handleFeedback(new Request('https://fb.example/', { method: 'GET', headers: { origin: ORIGIN } }), env(), deps())).status, 405);
  assert.equal((await handleFeedback(post('isso não é json'), env(), deps())).status, 400);
  assert.equal((await handleFeedback(post({ text: 'x'.repeat(LIMITS.body + 10) }), env(), deps())).status, 413);
});

test('campo-isca preenchido: responde ok mas não envia nada', async () => {
  const e = env();
  const res = await handleFeedback(post({ text: 'compre já', website: 'http://spam.example' }), e, deps());
  assert.equal(res.status, 200);
  assert.equal(e.sent.length, 0);
});

test('limite de envios por IP responde 429', async () => {
  const lim = createRateLimiter({ max: 2, windowMs: 60000 });
  const d = deps({ limiter: lim });
  const e = env();
  const h = { 'cf-connecting-ip': '1.2.3.4' };
  assert.equal((await handleFeedback(post({ text: 'a' }, h), e, d)).status, 200);
  assert.equal((await handleFeedback(post({ text: 'b' }, h), e, d)).status, 200);
  assert.equal((await handleFeedback(post({ text: 'c' }, h), e, d)).status, 429);
  assert.equal((await handleFeedback(post({ text: 'd' }, { 'cf-connecting-ip': '9.9.9.9' }), e, d)).status, 200, 'outro IP não é afetado');
});

test('limitador libera de novo depois da janela', () => {
  let t = 0;
  const allow = createRateLimiter({ max: 1, windowMs: 1000, now: () => t });
  assert.equal(allow('k'), true);
  assert.equal(allow('k'), false);
  t = 1500;
  assert.equal(allow('k'), true);
});

test('falha do envio de e-mail vira 502 sem vazar detalhes; configuração ausente vira 500', async () => {
  const ruim = env({ EMAIL: { send: async () => { throw new Error('segredo interno'); } } });
  const res = await handleFeedback(post({ text: 'oi' }), ruim, deps());
  assert.equal(res.status, 502);
  assert.doesNotMatch(await res.text(), /segredo/);
  assert.equal((await handleFeedback(post({ text: 'oi' }), env({ FEEDBACK_TO: undefined }), deps())).status, 500);
});

test('quebras de linha no contato e no texto não injetam cabeçalhos de e-mail', async () => {
  const e = env();
  await handleFeedback(post({ text: 'primeira\nBcc: alguem@x.com', contact: 'a@b.com\r\nBcc: outro@x.com' }), e, deps());
  const headers = e.sent[0].raw.split('\r\n\r\n')[0];
  assert.doesNotMatch(headers, /^Bcc:/m);
  assert.equal(parsePayload({ text: 'x', contact: 'a\nb' }).data.contact, 'a b');
});

test('corte de tamanho em cada campo e tipo desconhecido vira "other"', () => {
  const p = parsePayload({ kind: 'invasao', text: 'a'.repeat(LIMITS.text + 500), report: 'r'.repeat(LIMITS.report + 500), contact: 'c'.repeat(500), version: 'v'.repeat(500) }).data;
  assert.equal(p.kind, 'other');
  assert.equal(p.text.length, LIMITS.text);
  assert.equal(p.report.length, LIMITS.report);
  assert.equal(p.contact.length, LIMITS.contact);
  assert.equal(p.version.length, LIMITS.version);
});

test('assunto e corpo legíveis', () => {
  const d = parsePayload({ kind: 'balance', text: 'Fácil demais\nsegunda linha', rating: 2, report: 'seed 1' }).data;
  assert.equal(buildSubject(d), '[Bandeirada] Balanceamento · nota 2/5 · Fácil demais');
  const body = formatBody(d);
  assert.match(body, /Tipo: Balanceamento\nNota: 2\/5/);
  assert.match(body, /--- relatório do jogo ---\nseed 1/);
  assert.match(buildMime({ from: 'a@b.com', to: 'c@d.com', subject: 's', body: 'corpo' }), /Message-ID: <.+@b\.com>/);
});
