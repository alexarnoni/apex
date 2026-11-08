import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createCareer, advance, applyDecision, getView } from '../engine/game.js';

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

function playUntil(seed, stop) {
  let s = createCareer({ ...HERO, seed, age: 15 });
  for (let i = 0; i < 4000; i++) {
    if (stop(s)) return s;
    if (s.pendingDecision) s = applyDecision(s, answerFor(s));
    else { const n = advance(s); if (n === s) return s; s = n; }
  }
  throw new Error('não terminou');
}

test('a ficha separa a carreira por categoria e a soma bate com o total', () => {
  const s = playUntil(11, (st) => st.phase === 'LEGADO');
  const p = getView(s).player;
  const rows = p.byCategory;
  assert.ok(rows.length >= 2, 'pelo menos kart e mais uma categoria');
  assert.equal(rows[0].id, 'kart');
  const ladder = ['kart', 'f4', 'f3', 'f2', 'f1'];
  const idx = rows.map((r) => ladder.indexOf(r.id));
  assert.deepEqual(idx, [...idx].sort((a, b) => a - b), 'na ordem da pirâmide');
  for (const k of ['gp', 'wins', 'podiums', 'poles']) {
    assert.equal(rows.reduce((sum, r) => sum + r[k], 0), p.career[k], `soma de ${k} por categoria = total da carreira`);
  }
});

test('carreira em andamento na base mostra só as categorias já disputadas', () => {
  const s = playUntil(11, (st) => st.baseCareer?.category === 'f4');
  const ids = getView(s).player.byCategory.map((r) => r.id);
  assert.deepEqual(ids, ['kart']);
});
