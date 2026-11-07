import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildFeedback, careerSnapshot, sendUrl, feedbackPayload, sendFeedback, FEEDBACK_KINDS } from '../ui/feedback.js';
import { createCareer, applyDecision } from '../engine/game.js';

const career = () => applyDecision(createCareer({ surname: 'Teste', number: 7, style: 'con', seed: 99 }), { option: 'A' });

test('relatório traz tipo, texto, seed, versão e decisões', () => {
  const out = buildFeedback({ kind: 'bug', text: 'Travou na oferta', state: career(), userAgent: 'UA-teste' });
  assert.match(out, /feedback · Bug/);
  assert.match(out, /Travou na oferta/);
  assert.match(out, /seed 99/);
  assert.match(out, /versão do jogo 1/);
  assert.match(out, /"type":"base_choice"/);
  assert.match(out, /navegador: UA-teste/);
});

test('sem incluir a carreira, o relatório não vaza estado; sem carreira ativa também funciona', () => {
  const out = buildFeedback({ kind: 'idea', text: 'Queria mais equipes', state: career(), includeCareer: false });
  assert.doesNotMatch(out, /seed 99/);
  assert.match(buildFeedback({ kind: 'other', text: 'oi', state: null }), /Sem carreira ativa/);
  assert.match(buildFeedback({ kind: 'other', text: '   ' }), /\(sem texto\)/);
});

test('histórico: por padrão só o final; completo quando pedido', () => {
  let s = career();
  s.history = Array.from({ length: 40 }, (_, i) => ({ type: 'x', answer: { i } }));
  const short = careerSnapshot(s);
  const full = careerSnapshot(s, { fullHistory: true });
  assert.match(short, /decisões tomadas: 40 \(últimas 15 abaixo\)/);
  assert.ok(!short.includes('"i":0}'));
  assert.ok(full.includes('"i":0}') && full.includes('"i":39}'));
});

test('tipo desconhecido cai em "Outro"', () => {
  assert.match(buildFeedback({ kind: 'nada', text: 'x' }), new RegExp(FEEDBACK_KINDS.other.slice(0, 5)));
});

test('sendUrl: sem destino não há link; com destino codifica título e corta corpo longo', () => {
  assert.equal(sendUrl('', { kind: 'bug', text: 'a', body: 'b' }), null);
  const url = sendUrl('https://github.com/x/y/issues/new', { kind: 'bug', text: 'Erro na F1\nmais detalhes', body: 'corpo & espaço' });
  assert.match(url, /^https:\/\/github\.com\/x\/y\/issues\/new\?title=/);
  assert.match(url, /title=%5Bbug%5D%20Erro%20na%20F1&/);
  assert.match(url, /body=corpo%20%26%20espa%C3%A7o$/);
  const big = sendUrl('https://github.com/x/y/issues/new', { kind: 'bug', text: 't', body: 'z'.repeat(20000) });
  assert.ok(big.length <= 6000, `url com ${big.length}`);
  assert.match(decodeURIComponent(big), /texto cortado/);
  assert.match(sendUrl('https://x.dev/new?a=1', { kind: 'k', text: 't', body: 'b' }), /new\?a=1&title=/);
});

test('feedbackPayload limpa espaços, mantém o campo-isca vazio e converte a versão em texto', () => {
  const p = feedbackPayload({ kind: 'bug', text: '  travou  ', rating: 3, contact: ' a@b.com ', report: 'r', version: 1 });
  assert.deepEqual(p, { kind: 'bug', text: 'travou', rating: 3, contact: 'a@b.com', report: 'r', version: '1', website: '' });
  assert.equal(feedbackPayload({}).kind, 'other');
});

test('sendFeedback: sucesso envia JSON por POST e devolve ok', async () => {
  let seen;
  const fake = async (url, init) => { seen = { url, init }; return { ok: true, status: 200 }; };
  const r = await sendFeedback('https://fb.example/', { text: 'oi' }, fake);
  assert.deepEqual(r, { ok: true });
  assert.equal(seen.url, 'https://fb.example/');
  assert.equal(seen.init.method, 'POST');
  assert.equal(seen.init.headers['content-type'], 'application/json');
  assert.deepEqual(JSON.parse(seen.init.body), { text: 'oi' });
});

test('sendFeedback: limite, erro com mensagem, erro sem corpo e rede fora viram motivos legíveis', async () => {
  const r429 = await sendFeedback('x', {}, async () => ({ ok: false, status: 429 }));
  assert.match(r429.reason, /Muitos envios/);
  const rMsg = await sendFeedback('x', {}, async () => ({ ok: false, status: 400, json: async () => ({ error: 'Escreva uma mensagem ou dê uma nota.' }) }));
  assert.equal(rMsg.reason, 'Escreva uma mensagem ou dê uma nota.');
  const rVazio = await sendFeedback('x', {}, async () => ({ ok: false, status: 502, json: async () => { throw new Error('sem json'); } }));
  assert.match(rVazio.reason, /O envio falhou/);
  const rRede = await sendFeedback('x', {}, async () => { throw new TypeError('Failed to fetch'); });
  assert.equal(rRede.ok, false);
  assert.match(rRede.reason, /Sem conexão/);
});
