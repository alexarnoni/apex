import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCareer, getView, applyDecision } from '../engine/game.js';
import { enterF1 } from '../engine/f1.js';
import { createRng } from '../engine/rng.js';
import { createWorld, advanceYear } from '../engine/world.js';
import { makeAvailable, fillSeats, assignReserves } from '../engine/market.js';
import { TEAMS_F1, DRIVERS_F1 } from '../data/world2026.js';
import { CATEGORIES } from '../data/categories.js';
import { SURNAMES } from '../data/names.js';

const world = () => createWorld({ teams: TEAMS_F1, drivers: DRIVERS_F1, category: CATEGORIES.f1, names: SURNAMES });
function entry() {
  const s = createCareer({ surname: 'Teste', number: 7, style: 'con', age: 15, seed: 8 });
  enterF1(s, createRng(8), 'fer');
  return s;
}

test('entrar na Ferrari preserva Hamilton no paddock, com todos os dados e 22 assentos', () => {
  const s = entry(); const w = s.f1.world;
  assert.equal(w.drivers.length, 22);
  const h = w.market.find(d => d.name === 'Hamilton');
  assert.ok(h); assert.equal(h.team, null);
  assert.equal(h.prevTeam, 'fer'); assert.ok(h.attributes && h.stats);
  assert.equal(h.role, 'reserve'); assert.equal(h.reserveTeam, 'fer');
  assert.ok(getView(s).f1.roster.some(d => d.name === 'Hamilton' && d.role === 'reserve'));
  assert.ok(w.lastMoves.some(m => m.kind === 'reserve' && m.name === 'Hamilton'));
});

test('reserva não ocupa assento e pode voltar a disputar uma vaga', () => {
  const w = world(); const h = w.drivers.find(d => d.name === 'Hamilton');
  makeAvailable(w, h); assignReserves(w);
  w.market = fillSeats(w.teams, w.drivers, w.market, createRng(3), () => { throw new Error('não precisa novato'); });
  assert.ok(w.drivers.includes(h)); assert.equal(h.role, 'race');
  assert.equal(h.reserveTeam, null); assert.equal(w.market.length, 0);
  assert.equal(w.drivers.filter(d => d.team === 'fer').length, 2);
});

test('mercado e aposentadorias preservam identidade, envelhecem livres e mantêm grid completo', () => {
  const s = entry(); const w = s.f1.world; const rng = createRng(123);
  const h = w.market.find(d => d.name === 'Hamilton'); const original = h.age;
  for (let year = 0; year < 8; year++) {
    advanceYear(w, rng);
    const all = [...w.drivers, ...w.market, ...w.retired];
    assert.equal(w.drivers.length, 22);
    assert.equal(new Set(all.map(d => d.id)).size, all.length, 'identidade em apenas um grupo');
    assert.equal(all.filter(d => d.name === 'Hamilton').length, 1);
    assert.ok(h.age >= original + 1);
    assert.ok(w.market.every(d => !d.team));
    const reserves = w.market.filter(d => d.reserveTeam);
    assert.equal(new Set(reserves.map(d => d.reserveTeam)).size, reserves.length);
  }
  assert.ok(w.retired.includes(h), 'atinge aposentadoria natural, não desaparece por perder vaga');
});

test('treino e perfis da entrada sobrevivem ao save JSON', () => {
  const s = entry(); const snapshot = JSON.stringify(s);
  const answer = { id: 'train', training: 'tyres' };
  const a = applyDecision(s, answer); const b = applyDecision(JSON.parse(snapshot), answer);
  assert.deepEqual(a, b); assert.equal(JSON.stringify(s), snapshot);
  assert.equal(a.f1.trainingFocus, 'tyres');
});

test('troca do jogador preenche a vaga anterior e preserva o substituído imediatamente', () => {
  const s = entry();
  s.pendingDecision = { type: 'contract_terms', payload: { kind: 'move', teamId: 'mcl', teamName: 'McLaren', options: { years: [1, 2], clauses: ['none'], exitClauseAllowed: false } } };
  const result = applyDecision(s, { years: 2, clause: 'none', exitClause: false });
  const w = result.f1.world;
  assert.equal(w.drivers.length, 22);
  for (const t of w.teams) assert.equal(w.drivers.filter(d => d.team === t.id).length, t.seats);
  assert.equal(result.player.team, 'mcl');
  const all = [...w.drivers, ...w.market, ...w.retired];
  const displaced = w.lastMoves.find(m => m.kind === 'available' && m.from === 'McLaren');
  assert.ok(displaced);
  assert.ok(['Norris', 'Piastri'].includes(displaced.name));
  assert.equal(all.filter(d => d.name === displaced.name).length, 1);
  assert.ok(w.lastMoves.some(m => m.kind === 'transfer' && m.to === 'Ferrari'));
});
