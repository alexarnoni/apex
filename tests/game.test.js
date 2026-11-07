import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createCareer, advance, applyDecision, getView, ENGINE_VERSION } from '../engine/game.js';
import { legacyScore } from '../engine/f1.js';
import { CONFIG } from '../engine/config.js';

const HERO = { surname: 'Teste', number: 7, flag: 'BR', style: 'con' };
const BASE_PHASES = ['CRIACAO', 'BASE_TEMPORADA', 'BASE_OFERTAS'];

// Política fixa usando só a API pública. Responde qualquer decisão pendente.
function answerFor(state, { retireAt = 34, approach = 'balanced', order = 'obey', clause = 'none' } = {}) {
  const pd = state.pendingDecision;
  switch (pd.type) {
    case 'base_choice': return { option: 'A' };
    case 'academy_invite': return { accept: true };
    case 'offer_pick': return pd.payload.scope === 'f1' ? { id: pd.payload.options[0].id }
      : { id: pd.payload.options.find((o) => o.kind === 'up')?.id ?? 'stay' };
    case 'season_focus': return { id: 'train' };
    case 'weekend_approach': return { id: pd.payload.out ? 'rest' : approach };
    case 'story_event':
    case 'race_event': return { id: pd.payload.options[0].id };
    case 'team_order': return { id: order };
    case 'contract_terms': return { years: 2, clause, exitClause: false };
    case 'retire_or_continue': return { id: state.player.age >= retireAt ? 'retire' : 'continue' };
    default: throw new Error('tipo inesperado ' + pd.type);
  }
}

// Joga até a condição de parada, avançando telas sem decisão com advance().
function play(state, stop, policy = {}, maxSteps = 5000) {
  let s = state;
  let decisions = 0;
  for (let i = 0; i < maxSteps; i++) {
    if (stop(s)) return { s, decisions };
    if (s.pendingDecision) { s = applyDecision(s, answerFor(s, policy)); decisions += 1; }
    else {
      const next = advance(s);
      if (next === s) return { s, decisions }; // tela terminal
      s = next;
    }
  }
  throw new Error('carreira não terminou');
}

const playBase = (seed) => play(createCareer({ ...HERO, seed }), (s) => !BASE_PHASES.includes(s.phase));
const playFull = (seed, policy) => play(createCareer({ ...HERO, seed }), (s) => s.phase === 'LEGADO', policy);

// --- Base ---------------------------------------------------------------

test('base roda criação -> F1 (ou rota alternativa) só pela API', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const { s } = playBase(seed);
    assert.ok(['F1_PRE_TEMPORADA', 'ROTA_ALTERNATIVA'].includes(s.phase), `fase ${s.phase}`);
    if (s.phase === 'F1_PRE_TEMPORADA') assert.equal(s.pendingDecision.type, 'season_focus');
  }
});

test('a maioria das carreiras com política fixa chega à F1', () => {
  let f1 = 0;
  const N = 100;
  for (let seed = 1; seed <= N; seed++) if (playBase(seed).s.phase === 'F1_PRE_TEMPORADA') f1 += 1;
  assert.ok(f1 >= N * 0.5, `só ${f1}/${N} chegaram à F1`);
});

// Critério de aceite 4 da spec. Sem playerGrowthRate o melhor caso era 9 decisões (jogador
// chegava à F4+ 18º-19º); com 0.06 o caminho de 8 existe (~1% das seeds, mediana 10).
test('caminho feliz da base em até 8 decisões (4 escolhas + 4 ofertas)', () => {
  let best = Infinity;
  for (let seed = 1; seed <= 500; seed++) {
    const { s, decisions } = playBase(seed);
    if (s.phase === 'F1_PRE_TEMPORADA') best = Math.min(best, decisions);
  }
  assert.ok(best <= 8, `melhor caminho teve ${best} decisões`);
});

test('transições não mutam o estado anterior', () => {
  const s0 = createCareer({ ...HERO, seed: 5 });
  const frozen = JSON.stringify(s0);
  applyDecision(s0, { option: 'B' });
  assert.equal(JSON.stringify(s0), frozen);
});

test('decisões inválidas são rejeitadas', () => {
  const s = createCareer({ ...HERO, seed: 5 });
  assert.throws(() => applyDecision(s, { option: 'Z' }));
  assert.throws(() => createCareer({ ...HERO, style: 'xxx' }));
  assert.throws(() => createCareer({ ...HERO, number: 100 }));
  assert.throws(() => applyDecision({ ...s, pendingDecision: null }, {}));
});

test('advance não altera estado que já espera decisão', () => {
  const s = createCareer({ ...HERO, seed: 5 });
  assert.equal(advance(s), s);
});

test('view da base traz rivais, scouting em linguagem natural e nenhum estado cru', () => {
  let s = createCareer({ ...HERO, seed: 11 });
  s = applyDecision(s, { option: 'A' });
  const v = getView(s);
  assert.equal(v.base.rivals.length, 3);
  assert.equal(typeof v.base.lastSeason.scouting, 'string');
  assert.equal(v.rngState, undefined);
});

// --- F1 -----------------------------------------------------------------

// Primeira seed cuja base termina na F1.
function f1Start() {
  for (let seed = 1; seed < 100; seed++) {
    const { s } = playBase(seed);
    if (s.phase === 'F1_PRE_TEMPORADA') return s;
  }
  throw new Error('nenhuma seed chegou à F1');
}

test('F1: pré-temporada -> 1 decisão por corrida -> fim de temporada -> advance -> ofertas', () => {
  let s = applyDecision(f1Start(), { id: 'train' });
  // Evento de início de temporada (narrativo) pode vir antes da primeira corrida.
  if (s.pendingDecision.type === 'story_event') s = applyDecision(s, answerFor(s));
  assert.equal(s.phase, 'F1_FIM_DE_SEMANA');
  assert.equal(s.pendingDecision.type, 'weekend_approach');
  assert.equal(s.pendingDecision.payload.race, 1);

  const total = s.pendingDecision.payload.total;
  let weekends = 0;
  while (s.phase === 'F1_FIM_DE_SEMANA' && s.pendingDecision) {
    if (s.pendingDecision.type === 'weekend_approach') weekends += 1;
    s = applyDecision(s, answerFor(s));
  }
  assert.equal(weekends, total);
  assert.equal(s.phase, 'F1_FIM_TEMPORADA');
  assert.equal(s.pendingDecision, null);
  assert.equal(getView(s).f1.lastSeason.standings.length, 10);

  s = advance(s);
  // Contrato em vigor e sem cláusula de saída: nada a negociar, vai direto à pré-temporada.
  if (s.phase === 'F1_PRE_TEMPORADA') assert.equal(s.pendingDecision.type, 'season_focus');
  else assert.equal(s.phase, 'F1_OFERTAS');
  assert.ok(s.pendingDecision);
});

test('F1: ao aceitar a oferta, o jogador tem equipe, contrato e assento no grid', () => {
  const s = f1Start();
  const v = getView(s);
  assert.ok(v.f1.team.id);
  assert.equal(v.f1.standings.length, 22);
  assert.ok(v.f1.standings.some((r) => r.isPlayer));
  assert.ok(v.f1.contract.years >= 1);
});

test('F1: carreira completa só pela API termina em LEGADO com nota calculada pela fórmula', () => {
  for (const seed of [1, 2, 3]) {
    const { s } = playFull(seed);
    assert.equal(s.phase, 'LEGADO', `seed ${seed}: ${s.phase}`);
    const { legacy } = getView(s);
    assert.equal(legacy.score, legacyScore(legacy));
    assert.ok(legacy.seasons >= 1);
    assert.equal(s.pendingDecision, null);
  }
});

test('F1: determinismo — mesmo seed + mesmas decisões = mesma carreira', () => {
  assert.deepEqual(playFull(7).s, playFull(7).s);
  assert.notDeepEqual(playFull(7).s.careerLog, playFull(8).s.careerLog);
});

test('F1: snapshot JSON no meio da temporada continua do ponto exato', () => {
  let a = applyDecision(f1Start(), { id: 'train' });
  for (let i = 0; i < 5; i++) a = applyDecision(a, answerFor(a));
  let b = JSON.parse(JSON.stringify(a));
  for (let i = 0; i < 40 && a.pendingDecision; i++) {
    a = applyDecision(a, answerFor(a));
    b = applyDecision(b, answerFor(b));
  }
  assert.deepEqual(getView(a), getView(b));
  assert.equal(a.rngState, b.rngState);
});

test('F1: ordem de equipe contra o jogador interrompe e a escolha muda a confiança', () => {
  // Procura uma carreira em que o jogador receba ordem contra si, jogando as duas respostas.
  let found = null;
  for (let seed = 1; seed < 60 && !found; seed++) {
    const base = play(createCareer({ ...HERO, seed }), (s) => !BASE_PHASES.includes(s.phase)).s;
    if (base.phase !== 'F1_PRE_TEMPORADA') continue;
    let s = base;
    for (let step = 0; step < 400 && s.phase !== 'LEGADO'; step++) {
      if (s.pendingDecision?.type === 'team_order') { found = s; break; }
      s = s.pendingDecision ? applyDecision(s, answerFor(s)) : advance(s);
    }
  }
  if (!found) return; // raro; coberto por 'status' em engine.test.js
  const trust0 = found.player.trust;
  const obey = applyDecision(found, { id: 'obey' });
  const defy = applyDecision(found, { id: 'defy' });
  assert.equal(obey.player.trust, Math.min(100, trust0 + CONFIG.trust.obeyOrder));
  assert.equal(defy.player.trust, Math.max(0, trust0 + CONFIG.trust.defyOrder));
  const mine = (st) => st.f1.season.ordersLog.filter((o) => o.p2 === st.player.name).at(-1);
  assert.equal(mine(obey).defied, false);
  assert.equal(mine(defy).defied, true);
  assert.equal(obey.f1.season.pendingRace, null);
});

test('F1: termos de contrato inválidos são rejeitados; cláusula de saída exige mérito', () => {
  let s = f1Start();
  s = play(s, (x) => x.pendingDecision?.type === 'contract_terms', { retireAt: 99 }).s;
  assert.equal(s.pendingDecision.type, 'contract_terms');
  assert.throws(() => applyDecision(s, { years: 9, clause: 'none', exitClause: false }));
  assert.throws(() => applyDecision(s, { years: 2, clause: 'xxx', exitClause: false }));
  if (!s.pendingDecision.payload.options.exitClauseAllowed) {
    assert.throws(() => applyDecision(s, { years: 2, clause: 'none', exitClause: true }));
  }
});

test('legacyScore segue a fórmula da spec-backend', () => {
  const sum = { titlesF1: 2, vice: 1, wins: 10, poles: 4, podiums: 20, points: 900, baseTitles: 2, altRouteTitles: 0 };
  assert.equal(legacyScore(sum), 2 * 1000 + 250 + 10 * 50 + 4 * 15 + 20 * 10 + 900 + 2 * 40);
});

// --- versão, seed e histórico (F.2, F.4, F.5) -------------------------------

test('estado carrega engineVersion e a view expõe seed e versão', () => {
  const s = createCareer({ ...HERO, seed: 321 });
  assert.equal(s.engineVersion, ENGINE_VERSION);
  const v = getView(s);
  assert.equal(v.seed, 321);
  assert.equal(v.engineVersion, ENGINE_VERSION);
});

test('cada decisão entra no histórico; o estado anterior não muda', () => {
  const s0 = createCareer({ ...HERO, seed: 5 });
  assert.deepEqual(s0.history, []);
  const s1 = applyDecision(s0, { option: 'B' });
  assert.deepEqual(s1.history, [{ type: 'base_choice', answer: { option: 'B' } }]);
  assert.deepEqual(s0.history, []);
});

test('desfazer = voltar ao estado anterior e repetir a mesma decisão dá o mesmo resultado', () => {
  const s0 = createCareer({ ...HERO, seed: 9 });
  const a = applyDecision(s0, { option: 'A' });
  const b = applyDecision(s0, { option: 'A' }); // "desfez" e repetiu
  assert.deepEqual(a, b);
});
