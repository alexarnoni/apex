import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createRng } from '../engine/rng.js';
import { strategyFit, strategyOptions, resolveStrategy } from '../engine/strategy.js';
import { createCareer, advance, applyDecision, getView } from '../engine/game.js';

const HERO = { surname: 'Teste', number: 7, flag: 'BR', style: 'con' };

test('a estratégia padrão tem encaixe zero no seco e é a recomendada na chuva', () => {
  const dry = strategyOptions({ wet: false });
  assert.equal(dry.safe, 'medium');
  assert.deepEqual(dry.options.map((o) => o.id), ['soft', 'medium', 'hard']);
  assert.equal(strategyFit('medium', { tags: ['rua'], grid: 3, wet: false }), 0);
  const wet = strategyOptions({ wet: true });
  assert.equal(wet.safe, 'inters');
  assert.ok(strategyFit('inters', { wet: true }) > strategyFit('wait', { wet: true }));
  assert.ok(strategyFit('slicks', { wet: true }) < 0);
});

test('o encaixe premia a escolha que combina com a pista e a largada', () => {
  assert.ok(strategyFit('soft', { tags: ['rua'], grid: 5 }) > strategyFit('soft', { tags: [], grid: 5 }));
  assert.ok(strategyFit('hard', { tags: ['tecnica'], grid: 5 }) > strategyFit('hard', { tags: [], grid: 5 }));
  assert.ok(strategyFit('soft', { tags: [], grid: 9 }) > strategyFit('soft', { tags: [], grid: 2 }), 'quem larga atrás precisa arriscar');
});

// Mundo mínimo: 12 classificados; mede o deslocamento médio do jogador (P6) com cada escolha.
function meanShift(choice, ctx, runs = 4000) {
  const rng = createRng(123);
  let total = 0;
  for (let i = 0; i < runs; i++) {
    const ds = Array.from({ length: 12 }, (_, k) => ({ name: `D${k}`, seasonDnfs: 0 }));
    const w = { result: [...ds], dnfs: [] };
    const player = ds[5];
    resolveStrategy(w, player, choice, ctx, rng);
    total += 5 - w.result.indexOf(player);
  }
  return total / runs;
}

test('a escolha padrão não muda o resultado em média, e a escolha certa vale um pouco mais', () => {
  const ctx = { tags: ['rua'], grid: 6, wet: false };
  assert.ok(Math.abs(meanShift('medium', ctx)) < 0.06, 'padrão: média ~0');
  assert.ok(meanShift('soft', ctx) > 0.15, 'macios em pista de rua: ganha posições em média');
  const wet = { tags: [], grid: 6, wet: true };
  assert.ok(meanShift('inters', wet) > meanShift('wait', wet));
  assert.ok(meanShift('slicks', wet) < 0, 'slicks no molhado perdem em média');
});

test('a resposta traz rótulo, tipo e texto, e o jogador nunca sai da lista nem passa do limite', () => {
  const rng = createRng(9);
  for (let i = 0; i < 200; i++) {
    const ds = Array.from({ length: 5 }, (_, k) => ({ name: `D${k}`, seasonDnfs: 0 }));
    const w = { result: [...ds], dnfs: [] };
    const r = resolveStrategy(w, ds[0], 'soft', { tags: [], grid: 1, wet: false }, rng);
    assert.ok(['good', 'bad', 'none'].includes(r.kind));
    assert.equal(r.label, 'Macios');
    assert.ok(r.text.length > 5);
    assert.equal(w.result.length, 5);
    assert.ok(w.result.includes(ds[0]));
  }
});

// Joga até a primeira corrida da F1 e confere o fluxo: abordagem, estratégia, (evento), (ordem), relato.
function toFirstWeekend(seed) {
  let s = createCareer({ ...HERO, seed, age: 15 });
  for (let i = 0; i < 3000; i++) {
    if (s.pendingDecision?.type === 'weekend_approach') return s;
    const pd = s.pendingDecision;
    if (!pd) { const n = advance(s); if (n === s) throw new Error('travou'); s = n; continue; }
    const id = (() => {
      switch (pd.type) {
        case 'base_choice': return { option: 'A' };
        case 'academy_invite': return { accept: true };
        case 'offer_pick': return pd.payload.scope === 'f1' ? { id: pd.payload.options[0].id } : { id: pd.payload.options.find((o) => o.kind === 'up')?.id ?? 'stay' };
        case 'season_focus': return { id: 'train' };
        case 'story_event': case 'race_event': return { id: pd.payload.options[0].id };
        case 'contract_terms': return { years: 2, clause: 'none', exitClause: false };
        default: throw new Error('tipo ' + pd.type);
      }
    })();
    s = applyDecision(s, id);
  }
  throw new Error('não chegou à F1');
}

test('no fim de semana da F1 a classificação vem antes da corrida, com grid, clima e opções', () => {
  let s = toFirstWeekend(5);
  s = applyDecision(s, { id: 'balanced' });
  const pd = s.pendingDecision;
  assert.equal(pd.type, 'race_strategy');
  const p = pd.payload;
  assert.equal(p.race, 1);
  assert.ok(p.circuit.gp && p.grid >= 1 && p.gridSize >= 20);
  assert.ok(p.gridRows.some((r) => r.isPlayer), 'o jogador aparece no grid mostrado');
  assert.ok(p.gridRows.length <= 7);
  assert.ok(p.options.length === 3 && p.options.some((o) => o.id === p.safe));
  assert.throws(() => applyDecision(s, { id: 'nao-existe' }), /id inválido/);
});

test('o relato da corrida registra largada, estratégia e chegada (ou a causa do abandono)', () => {
  let s = toFirstWeekend(5);
  for (let guard = 0; guard < 40 && getView(s).f1.races.length < 3; guard++) {
    const pd = s.pendingDecision;
    if (pd.type === 'weekend_approach') s = applyDecision(s, { id: 'balanced' });
    else if (pd.type === 'race_start') s = applyDecision(s, { id: pd.payload.safe });
    else if (pd.type === 'race_strategy') s = applyDecision(s, { id: pd.payload.safe });
    else if (pd.type === 'race_pit') s = applyDecision(s, { id: pd.payload.safe });
    else if (pd.type === 'race_finale') s = applyDecision(s, { id: pd.payload.safe });
    else if (pd.type === 'race_event') s = applyDecision(s, { id: pd.payload.options[0].id });
    else if (pd.type === 'team_order') s = applyDecision(s, { id: 'obey' });
    else if (pd.type === 'story_event') s = applyDecision(s, { id: pd.payload.options[0].id });
    else throw new Error('tipo ' + pd.type);
  }
  const races = getView(s).f1.races;
  assert.ok(races.length >= 3);
  for (const r of races) {
    const whens = r.story.map((l) => l.when);
    assert.ok(whens.includes('Largada'), 'tem a largada');
    assert.ok(whens.includes('Chegada') || whens.includes('Abandono'), 'termina em chegada ou abandono');
    if (r.playerPos !== null) assert.ok(r.story.at(-1).text.includes(`P${r.playerPos}`) || r.playerPos === 1);
  }
});


test('treino vale só para a etapa e uma neutralização pode ser delegada após reabrir o save', () => {
  let s = toFirstWeekend(6);
  s = applyDecision(s, { id: 'tyres', savePractice: true });
  assert.equal(s.pendingDecision.payload.practice, 'tyres');
  assert.equal(s.f1.season.raceIndex, 0);

  const seen = new Set();
  for (let guard = 0; guard < 140 && s.phase === 'F1_FIM_DE_SEMANA'; guard++) {
    const pd = s.pendingDecision;
    const advice = getView(s).f1.advice;
    if (pd.type === 'race_pit' && pd.payload.interruption) {
      assert.ok(advice.important);
      const restored = JSON.parse(JSON.stringify(s));
      const next = applyDecision(restored, advice.answer);
      assert.deepEqual(next, applyDecision(s, advice.answer));
      const text = next.f1.season.cur?.pit?.text ?? next.f1.season.lastRace.story.find(line => line.when === 'Janela de box').text;
      assert.match(text, /retomada em P/);
      seen.add(pd.payload.interruption);
    }
    s = applyDecision(s, advice?.answer ?? { id: pd.payload.options[0].id });
    if (s.f1.season.raceIndex === 0) assert.equal(s.f1.season.cur.practice, 'tyres');
    if (s.pendingDecision?.type === 'weekend_approach') assert.equal(s.pendingDecision.payload.practice, 'none');
  }
  assert.ok(seen.has('safety_car'));
  assert.ok(seen.has('red_flag'));
});
