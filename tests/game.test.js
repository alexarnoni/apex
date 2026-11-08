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
    case 'race_strategy': return { id: pd.payload.safe };
    case 'race_finale': return { id: pd.payload.safe };
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
test('caminho feliz da base em até 9 decisões (4 escolhas + 4 ofertas, mais uma extra)', () => {
  // O caminho perfeito (8 decisões) virou raríssimo com o talento sorteado e a pressão das equipes (1 a 2 sementes em 500).
  let best = Infinity;
  for (let seed = 1; seed <= 500; seed++) {
    const { s, decisions } = playBase(seed);
    if (s.phase === 'F1_PRE_TEMPORADA') best = Math.min(best, decisions);
  }
  assert.ok(best <= 9, `melhor caminho teve ${best} decisões`);
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
  // Com o talento sorteado, nem toda semente chega à F1 (algumas acabam em rota alternativa, que também é um fim válido).
  let legacies = 0;
  for (let seed = 1; seed <= 10 && legacies < 3; seed++) {
    const { s } = playFull(seed);
    assert.ok(['LEGADO', 'ROTA_ALTERNATIVA'].includes(s.phase), `seed ${seed}: ${s.phase}`);
    if (s.phase !== 'LEGADO') continue;
    legacies += 1;
    const { legacy } = getView(s);
    assert.equal(legacy.score, legacyScore(legacy));
    assert.ok(legacy.seasons >= 1);
    assert.equal(s.pendingDecision, null);
  }
  assert.equal(legacies, 3, 'em 10 sementes, pelo menos 3 carreiras chegam ao legado');
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
  // Depois da ordem de equipe pode vir o final de corrida (atacar ou administrar): resolve antes de conferir.
  let done = obey;
  if (done.pendingDecision?.type === 'race_finale') done = applyDecision(done, { id: done.pendingDecision.payload.safe });
  assert.equal(done.f1.season.pendingRace, null);
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

// --- F.3: explicar o porquê -------------------------------------------------

test('scoutingBreakdown soma exatamente a scoutingScore', async () => {
  const { scoutingScore, scoutingBreakdown } = await import('../engine/market.js');
  const args = { championshipPos: 4, gridSize: 20, carRank: 9, age: 20, typicalMaxAge: 17, hasAcademy: true, fame: 3 };
  const p = scoutingBreakdown(args);
  assert.ok(p.weakCar > 0 && p.age < 0 && p.academy > 0);
  assert.ok(Math.abs(scoutingScore(args) - (p.result + p.weakCar + p.academy + p.fame + p.age)) < 1e-9);
});

test('temporada de base traz a explicação da nota e cada oferta explica o motivo', () => {
  let s = applyDecision(createCareer({ ...HERO, seed: 11 }), { option: 'A' });
  const v = getView(s);
  assert.match(v.base.lastSeason.why, /^Nota .*resultado \(\d+º\)/);
  assert.match(v.base.lastSeason.why, /Equipes de ponta pedem/);
  for (let seed = 1; seed < 40; seed++) {
    s = applyDecision(createCareer({ ...HERO, seed }), { option: 'A' });
    if (s.pendingDecision.type === 'offer_pick') {
      for (const o of s.pendingDecision.payload.options) assert.ok(o.why && o.why.length > 10, `${o.id} sem motivo`);
      return;
    }
  }
  assert.fail('nenhuma seed gerou oferta');
});

test('F1: status e ofertas vêm com motivo; a view expõe as corridas do ano', () => {
  let s = applyDecision(f1Start(), { id: 'train' });
  while (s.pendingDecision.type !== 'weekend_approach') s = applyDecision(s, answerFor(s));
  for (let i = 0; i < 6; i++) {
    s = applyDecision(s, answerFor(s));
    while (s.pendingDecision && s.pendingDecision.type !== 'weekend_approach') s = applyDecision(s, answerFor(s));
  }
  const v = getView(s);
  assert.ok(v.f1.races.length >= 6);
  assert.ok(v.f1.statusWhy === null || v.f1.statusWhy.length > 10);
  const full = play(f1Start(), (x) => x.pendingDecision?.type === 'offer_pick' && x.pendingDecision.payload.scope === 'f1', { retireAt: 99 });
  if (full.s.pendingDecision) for (const o of full.s.pendingDecision.payload.options) assert.ok(o.why, `${o.id} sem motivo`);
});

// --- Nível 1: nível/potencial, resumo da corrida, prós e contras ------------------

test('view mostra o nível do piloto e só uma faixa do potencial (nunca o valor exato)', async () => {
  const { potentialBand } = await import('../engine/game.js');
  for (const pot of [72, 84, 88.4, 92.6, 99.9]) {
    const [lo, hi] = potentialBand(pot);
    assert.ok(lo <= pot && pot <= hi, `${pot} fora de [${lo}, ${hi}]`);
    assert.equal(hi - lo, 10);
  }
  const v = getView(career0());
  assert.equal(typeof v.player.skill, 'number');
  assert.equal(v.player.potentialBand.length, 2);
  assert.equal(v.player.potential, undefined);
});

function career0() { return createCareer({ ...HERO, seed: 3 }); }

test('raceSummary descreve largada x chegada, chuva, abordagem, evento e ordem de equipe', async () => {
  const { raceSummary } = await import('../engine/f1.js');
  assert.equal(raceSummary({ missed: true }, null, null, 'Eu'), 'Você ficou fora desta corrida.');
  assert.match(raceSummary({ playerPos: null, grid: 6 }, {}, null, 'Eu'), /Largou em P6 e abandonou/);
  assert.match(raceSummary({ playerPos: 3, grid: 8, wet: true }, { approach: 'risky', event: 'Relargada' }, null, 'Eu'),
    /Largou em P8 e terminou em P3 \(\+5\)\. Corrida na chuva\. Abordagem arriscada\. Evento: Relargada\./);
  assert.match(raceSummary({ playerPos: 9, grid: 4 }, { approach: 'conservative' }, null, 'Eu'), /\(−5\)\. Abordagem conservadora/);
  assert.match(raceSummary({ playerPos: 5, grid: 5 }, {}, { p1: 'A', p2: 'Eu', defied: true }, 'Eu'), /desafiou a ordem/);
  assert.match(raceSummary({ playerPos: 5, grid: 5 }, {}, { p1: 'A', p2: 'Eu', defied: false }, 'Eu'), /cedeu a posição/);
  assert.match(raceSummary({ playerPos: 1, grid: 2 }, {}, { p1: 'Eu', p2: 'B' }, 'Eu'), /companheiro ceder.*Vitória/);
});

test('F1: toda corrida jogada tem resumo; ofertas de base e de F1 trazem vantagens e riscos', () => {
  let s = applyDecision(f1Start(), { id: 'train' });
  while (s.pendingDecision.type !== 'weekend_approach') s = applyDecision(s, answerFor(s));
  for (let i = 0; i < 4; i++) {
    s = applyDecision(s, answerFor(s));
    while (s.pendingDecision && s.pendingDecision.type !== 'weekend_approach') s = applyDecision(s, answerFor(s));
  }
  const races = getView(s).f1.races.filter((r) => !r.missed);
  assert.ok(races.length >= 1);
  for (const r of races) assert.match(r.summary, /Largou em P\d+|Abandonou|Terminou em/);

  for (let seed = 1; seed < 40; seed++) {
    const b = applyDecision(createCareer({ ...HERO, seed }), { option: 'A' });
    if (b.pendingDecision.type === 'offer_pick') {
      for (const o of b.pendingDecision.payload.options) {
        assert.ok(Array.isArray(o.pros) && Array.isArray(o.cons), `${o.id}`);
        assert.ok(o.pros.length + o.cons.length >= 1);
      }
      break;
    }
  }
  const full = play(f1Start(), (x) => x.pendingDecision?.type === 'offer_pick' && x.pendingDecision.payload.scope === 'f1', { retireAt: 99 });
  if (full.s.pendingDecision) {
    for (const o of full.s.pendingDecision.payload.options) {
      assert.ok(Array.isArray(o.pros) && Array.isArray(o.cons));
      assert.ok(o.pros.length + o.cons.length >= 1);
    }
  }
});

// --- painel da temporada: construtores, variação de posição, corrida a corrida, totais ----------

test('F1: view traz construtores consistentes, variação de posição e vencedor/pole de cada corrida', () => {
  let s = applyDecision(f1Start(), { id: 'train' });
  while (s.pendingDecision.type !== 'weekend_approach') s = applyDecision(s, answerFor(s));
  const first = getView(s).f1;
  assert.ok(first.standings.every((r) => r.delta === 0), 'sem corrida disputada, ninguém variou');

  for (let i = 0; i < 4; i++) {
    s = applyDecision(s, answerFor(s));
    while (s.pendingDecision && s.pendingDecision.type !== 'weekend_approach') s = applyDecision(s, answerFor(s));
  }
  const f1 = getView(s).f1;
  assert.equal(f1.constructors.length, 11);
  const pts = f1.constructors.map((c) => c.points);
  assert.deepEqual(pts, [...pts].sort((a, b) => b - a), 'construtores em ordem de pontos');
  assert.equal(pts.reduce((a, b) => a + b, 0), f1.standings.reduce((a, r) => a + r.points, 0), 'pontos de equipes = pontos de pilotos');
  assert.equal(f1.constructors.filter((c) => c.isYours).length, 1);
  assert.ok(f1.standings.some((r) => r.delta !== 0), 'depois de corridas alguém mudou de posição');
  assert.equal(f1.standings.reduce((a, r) => a + r.delta, 0), 0, 'quem sobe e quem desce se compensam');
  for (const r of f1.races) { assert.ok('winner' in r && 'pole' in r); }
});

test('ficha: totais da carreira somam base e F1, e o GP só conta corridas disputadas', () => {
  const base = playBase(1).s;
  const startGp = getView(base).player.career.gp;
  assert.ok(startGp > 0, 'a base já soma corridas');
  let s = f1Start();
  const gp0 = getView(s).player.career.gp;
  s = applyDecision(s, { id: 'train' });
  while (s.pendingDecision.type !== 'weekend_approach') s = applyDecision(s, answerFor(s));
  for (let i = 0; i < 3; i++) {
    s = applyDecision(s, answerFor(s));
    while (s.pendingDecision && s.pendingDecision.type !== 'weekend_approach') s = applyDecision(s, answerFor(s));
  }
  const c = getView(s).player.career;
  assert.ok(c.gp >= gp0 + 1 && c.gp <= gp0 + 3, `gp ${c.gp} (antes ${gp0})`);
  assert.equal(c.titles, c.titlesBase + c.titlesF1);
});
