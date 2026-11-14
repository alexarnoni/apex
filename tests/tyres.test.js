import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CONFIG } from '../engine/config.js';
import { createRng } from '../engine/rng.js';
import { startTyre, tick, spend, chanceMod, attacksLeft, tyreOf, isDead } from '../engine/tyres.js';
import { resolveStrategy } from '../engine/strategy.js';
import { createCareer, advance, applyDecision, getView } from '../engine/game.js';

const T = CONFIG.tyres;

test('tick desgasta por composto e o treino de pneus reduz o desgaste', () => {
  assert.equal(tick(startTyre('soft')), 100 - T.soft.wear);
  assert.equal(tick(startTyre('medium')), 100 - T.medium.wear);
  assert.equal(tick(startTyre('hard')), 100 - T.hard.wear);
  assert.ok(tick(startTyre('soft', 'tyres')) > tick(startTyre('soft')));
  assert.equal(tick({ compound: 'soft', condition: 5, wearFactor: 1 }), 0);
});

test('pista molhada: condição fixa, aderência zero', () => {
  const t = startTyre('inters');
  assert.deepEqual([t.compound, t.condition, t.wearFactor], [null, 70, 0]);
  assert.equal(tick(t), 70);
  assert.equal(spend(t, 10), 70);
  assert.equal(chanceMod(t), 0);
});

test('spend, attacksLeft e isDead', () => {
  const t = startTyre('medium');
  assert.equal(spend(t, T.attackWear), 90);
  assert.equal(attacksLeft(t), Math.floor((100 - T.dead) / T.attackWear));
  assert.equal(attacksLeft({ ...t, condition: 20 }), 0);
  assert.ok(isDead({ ...t, condition: T.dead }));
  assert.ok(!isDead({ ...t, condition: T.dead + 1 }));
});

test('chanceMod: acima e abaixo da referência', () => {
  const m = (condition) => chanceMod({ compound: 'medium', condition, wearFactor: 1, fit: 0 });
  assert.equal(m(70), 0);
  assert.ok(Math.abs(m(80) - 0.02) < 1e-9);
  assert.ok(Math.abs(m(60) + 0.03) < 1e-9);
  assert.ok(chanceMod({ compound: 'soft', condition: 70, fit: 0 }) > chanceMod({ compound: 'hard', condition: 70, fit: 0 }));
  assert.ok(chanceMod({ compound: 'soft', condition: 70, fit: 1 }) > chanceMod({ compound: 'soft', condition: 70, fit: 0 }));
});

test('valor padrão quando o save não tem pneu', () => {
  assert.deepEqual(tyreOf({ cur: {} }), { compound: null, condition: 70, wearFactor: 0, fit: 0 });
  assert.equal(tyreOf(null).condition, 70);
});

// Ritmo por trecho: macio ganha mais posições que médio, e médio mais que duro; depois de três trechos a ordem inverte.
function gainRate(compound, ticks, runs = 2000) {
  const rng = createRng(5);
  let gains = 0;
  for (let i = 0; i < runs; i++) {
    const t = startTyre(compound);
    for (let k = 0; k < ticks; k++) t.condition = tick(t);
    const pace = chanceMod(t);
    if (pace > 0 && rng.next() < pace * T.paceFactor) gains += 1;
    else if (pace < 0 && rng.next() < -pace * T.paceFactor) gains -= 1;
  }
  return gains / runs;
}

test('ritmo: macio > médio > duro no primeiro trecho e a ordem inverte depois de três', () => {
  const [s1, m1, h1] = ['soft', 'medium', 'hard'].map((c) => gainRate(c, 1));
  assert.ok(s1 > m1 && m1 > h1, `primeiro trecho ${s1} ${m1} ${h1}`);
  const [s3, m3, h3] = ['soft', 'medium', 'hard'].map((c) => gainRate(c, 3));
  assert.ok(h3 > m3 && m3 > s3, `terceiro trecho ${s3} ${m3} ${h3}`);
});

test('em pista seca a escolha de pneus não sorteia nem move posição', () => {
  const rng = createRng(1);
  const ds = Array.from({ length: 6 }, (_, k) => ({ name: `D${k}` }));
  const w = { result: [...ds], dnfs: [] };
  const before = rng.next();
  const rng2 = createRng(1);
  const r = resolveStrategy(w, ds[3], 'soft', { tags: ['rua'], grid: 9, wet: false }, rng2);
  assert.equal(r.shift, 0);
  assert.equal(rng2.next(), before, 'nenhum sorteio consumido');
  assert.equal(w.result.indexOf(ds[3]), 3);
});

// Fluxo completo: a corrida expõe o pneu na view e a janela de box oferece macios.
function playToRaceDecisions(seed, onDecision) {
  let s = createCareer({ surname: 'Teste', number: 7, flag: 'BR', style: 'con', seed, age: 15 });
  for (let i = 0; i < 20000; i++) {
    if (s.phase === 'LEGADO' || s.phase === 'ROTA_ALTERNATIVA') return s;
    const pd = s.pendingDecision;
    if (!pd) { const n = advance(s); if (n === s) return s; s = n; continue; }
    const answer = onDecision(s, pd) ?? defaultAnswer(s, pd);
    s = applyDecision(s, answer);
  }
  throw new Error('não terminou');
}
function defaultAnswer(s, pd) {
  switch (pd.type) {
    case 'kart_offer': return { id: 'balanced' };
    case 'kart_return': return { id: 'stay' };
    case 'home_race': return { id: 'prepare' };
    case 'base_choice': return { option: 'A' };
    case 'academy_invite': return { accept: true };
    case 'offer_pick': return pd.payload.scope === 'f1' ? { id: pd.payload.options[0].id } : { id: pd.payload.options.find((o) => o.kind === 'up')?.id ?? 'stay' };
    case 'season_focus': return { id: 'train' };
    case 'weekend_approach': return { id: pd.payload.out ? 'rest' : 'balanced' };
    case 'race_strategy': case 'race_pit': case 'race_start': case 'race_finale': return { id: pd.payload.safe };
    case 'story_event': case 'race_event': return { id: pd.payload.options[0].id };
    case 'team_order': return { id: 'obey' };
    case 'contract_terms': return { years: 2, clause: 'none', exitClause: false };
    case 'retire_or_continue': return { id: s.player.age >= 34 ? 'retire' : 'continue' };
    default: throw new Error(pd.type);
  }
}

test('view expõe o pneu desde a largada e a janela de box oferece pit_soft', () => {
  const savedOpens = T.pitOpens;
  T.pitOpens = 60; // com 50 a janela por desgaste quase nunca abre; sobe só para exercitar a opção
  let sawView = false; let sawSoft = false;
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    playToRaceDecisions(seed, (s, pd) => {
      if (pd.type === 'race_strategy') return pd.payload.wet ? { id: pd.payload.safe } : { id: 'soft' };
      if (pd.type === 'race_start' || pd.type === 'race_event') {
        const f = getView(s).f1;
        if (f?.tyre?.compound) { sawView = true; assert.equal(f.tyre.compound, 'soft'); assert.equal(f.tyre.condition, pd.type === 'race_start' ? 100 : f.tyre.condition); assert.ok(f.tyre.condition < 100 || pd.type === 'race_start'); assert.ok(f.tyre.attacksLeft >= 1); assert.equal(f.map.tyre.compound, 'soft'); }
      }
      if (pd.type === 'race_pit') {
        const ids = pd.payload.options.map((o) => o.id);
        if (ids.includes('pit_soft')) { sawSoft = true; assert.ok(ids.includes('pit') && ids.includes('extend')); return { id: 'pit_soft' }; }
      }
      return null;
    });
    if (sawView && sawSoft) break;
  }
  T.pitOpens = savedOpens;
  assert.ok(sawView, 'view com pneu');
  assert.ok(sawSoft, 'pit_soft oferecido');
});
