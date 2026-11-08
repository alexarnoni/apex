import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createCareer, advance, applyDecision } from '../engine/game.js';
import { CONFIG } from '../engine/config.js';

const HERO = { surname: 'Teste', number: 7, flag: 'BR', style: 'con' };

function answerFor(state) {
  const pd = state.pendingDecision;
  switch (pd.type) {
    case 'base_choice': return { option: 'A' };
    case 'academy_invite': return { accept: true };
    case 'offer_pick': return pd.payload.scope === 'f1' ? { id: pd.payload.options[0].id }
      : { id: pd.payload.options.find((o) => o.kind === 'up')?.id ?? 'stay' };
    case 'season_focus': return { id: 'train' };
    case 'weekend_approach': return { id: pd.payload.out ? 'rest' : 'balanced' };
    case 'story_event':
    case 'race_event': return { id: pd.payload.options[0].id };
    case 'race_strategy': return { id: pd.payload.safe };
    case 'race_finale': return { id: pd.payload.safe };
    case 'team_order': return { id: 'obey' };
    case 'contract_terms': return { years: 2, clause: 'none', exitClause: false };
    case 'retire_or_continue': return { id: 'retire' };
    default: throw new Error('tipo inesperado ' + pd.type);
  }
}

// Joga até a F1 e anota a idade em que o jogador entrou em cada categoria.
function entryAges(seed, age) {
  let s = createCareer({ ...HERO, seed, age });
  const entries = {};
  for (let i = 0; i < 3000; i++) {
    const cat = s.baseCareer?.category;
    if (cat && !(cat in entries)) entries[cat] = s.player.age;
    if (s.f1) { entries.f1 = s.player.age; return { s, entries }; }
    if (s.phase === 'LEGADO' || s.phase === 'ROTA_ALTERNATIVA') return { s, entries };
    if (s.pendingDecision) s = applyDecision(s, answerFor(s));
    else { const n = advance(s); if (n === s) return { s, entries }; s = n; }
  }
  throw new Error('não terminou');
}

test('a idade inicial é escolhida e validada (12 a 16)', () => {
  assert.equal(createCareer({ ...HERO, seed: 1, age: 12 }).player.age, 12);
  assert.equal(createCareer({ ...HERO, seed: 1, age: 16 }).player.age, 16);
  for (const bad of [11, 17, 14.5, '15']) assert.throws(() => createCareer({ ...HERO, seed: 1, age: bad }), /age deve ser/);
  const sorteada = createCareer({ ...HERO, seed: 1 }).player.age;
  assert.ok(sorteada >= 14 && sorteada <= 16, 'sem idade, continua sorteando 14 a 16');
});

test('quem começa muito novo tem menos habilidade e o teto não passa de 100', () => {
  const p12 = createCareer({ ...HERO, seed: 5, age: 12 }).player;
  const p14 = createCareer({ ...HERO, seed: 5, age: 14 }).player;
  assert.ok(p12.skill < p14.skill, `skill aos 12 (${p12.skill}) deveria ser menor que aos 14 (${p14.skill})`);
  assert.ok(p12.potential <= 100);
});

test('a idade mínima de cada categoria é respeitada em qualquer idade inicial', () => {
  const min = CONFIG.base.minAge;
  for (const age of [12, 13, 14, 15, 16]) {
    for (let seed = 1; seed <= 6; seed++) {
      const { entries } = entryAges(seed, age);
      for (const [cat, a] of Object.entries(entries)) {
        if (min[cat]) assert.ok(a >= min[cat], `seed ${seed}, início aos ${age}: entrou na ${cat} aos ${a} (mínimo ${min[cat]})`);
      }
    }
  }
});

test('quem começa aos 12 passa anos no kart até ter idade para a F4; o bloqueio por idade não conta como "sem oferta"', () => {
  let blocked = 0;
  for (let seed = 1; seed <= 12; seed++) {
    let s = createCareer({ ...HERO, seed, age: 12 });
    assert.equal(s.player.age, 12);
    for (let i = 0; i < 60 && s.phase !== 'LEGADO' && !s.f1; i++) {
      const before = s.baseCareer?.noOfferStreak;
      const beforeYear = s.baseCareer?.lastSummary?.year;
      if (s.pendingDecision) s = applyDecision(s, answerFor(s));
      else { const n = advance(s); if (n === s) break; s = n; }
      const sum = s.baseCareer?.lastSummary;
      if (sum?.ageBlock && sum.year !== beforeYear) {
        blocked += 1;
        assert.equal(s.baseCareer.noOfferStreak, before, 'o bloqueio por idade não aumenta a sequência sem oferta');
        assert.ok(s.player.age < sum.ageBlock.minAge, 'só bloqueia quem ainda não tem a idade');
      }
    }
  }
  assert.ok(blocked > 0, 'em 12 carreiras que começam aos 12, algum bloqueio por idade aconteceu');
});
