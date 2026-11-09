import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDecision, createCareer, getView } from '../engine/game.js';
import { enterF1 } from '../engine/f1.js';
import { createRng } from '../engine/rng.js';
import { CATEGORIES } from '../data/categories.js';
import { answerFor } from '../tools/calibrate/lib.js';
import { advanceRaces } from '../engine/advance-races.js';

const create = flag => createCareer({ surname: 'Teste', number: 12, style: 'con', flag, age: 15, seed: 5, kartOffers: true });

test('propostas de kart sobrevivem ao JSON e a escolha muda a equipe e a formação', () => {
  const state = JSON.parse(JSON.stringify(create('BR')));
  assert.equal(state.pendingDecision.type, 'kart_offer');
  assert.equal(new Set(state.pendingDecision.payload.options.map(o => o.teamId)).size, 3);
  const run = id => applyDecision(applyDecision(state, { id }), { option: 'A' });
  const winner = run('winner');
  const development = run('development');
  assert.ok(winner.baseCareer.lastSummary.carRank < development.baseCareer.lastSummary.carRank);
  assert.ok(development.player.devFactor > 1);
  assert.equal(getView(winner).baseHistory[0].team, winner.baseCareer.lastSummary.teamName);
});

test('convite pelo vice salvo disputa uma prova e custa uma largada na F4', () => {
  const state = applyDecision(create('BR'), { id: 'balanced' });
  state.baseCareer.seasons = [{ year: state.year, categoryId: 'kart', position: 2, teamId: state.baseCareer.teamId, team: 'Equipe do vice' }];
  state.pendingDecision = { type: 'offer_pick', payload: { options: [
    { id: 'f4', kind: 'up', category: 'f4', teamId: 'prema', teamName: 'Prema Racing' },
  ] } };
  const invited = applyDecision(state, { id: 'f4' });
  assert.equal(invited.pendingDecision.type, 'kart_return');
  assert.match(invited.pendingDecision.payload.text, /vice no kart/);
  const accept = applyDecision(invited, { id: 'return' });
  assert.match(accept.baseCareer.kartReturn.finish, /^(P\d+|abandono)$/);
  const f4 = id => applyDecision(applyDecision(invited, { id }), { option: 'A' });
  assert.equal(f4('return').player.catStats.f4.gp, CATEGORIES.f4.races - 1);
  assert.equal(f4('stay').player.catStats.f4.gp, CATEGORIES.f4.races);
});

test('GP de casa pausa o automático e recupera um abandono do próprio save', () => {
  let state = applyDecision(create('AU'), { id: 'balanced' });
  enterF1(state, createRng(5), 'fer');
  state.f1.homeResults = [{ year: state.year - 1, circuit: 'aus', position: null }];
  while (state.phase === 'F1_PRE_TEMPORADA') state = applyDecision(state, answerFor(state));
  assert.equal(state.pendingDecision.type, 'home_race');
  assert.match(state.pendingDecision.payload.text, /abandono/);
  assert.equal(advanceRaces(state, { stop: 'none' }).state, state);
  const fame = state.player.fame;
  const next = applyDecision(JSON.parse(JSON.stringify(state)), { id: 'fans' });
  assert.equal(next.pendingDecision.type, 'weekend_approach');
  assert.equal(next.player.fame, fame + 1);
  assert.equal(next.f1.season.raceIndex, state.f1.season.raceIndex);
});
