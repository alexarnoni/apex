import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createRng } from '../engine/rng.js';
import { seatFit, fillSeats } from '../engine/market.js';
import { createWorld, advanceYear } from '../engine/world.js';
import { resetRookieCounter } from '../engine/drivers.js';
import { TEAMS_F1, DRIVERS_F1, SISTER_TEAMS } from '../data/world2026.js';
import { CATEGORIES } from '../data/categories.js';
import { SURNAMES } from '../data/names.js';
import { CONFIG } from '../engine/config.js';

const M = CONFIG.market;

test('o encaixe premia lealdade e equipe irmã, e pune duas estrelas em carro mediano', () => {
  const team = { id: 'rb' };
  assert.equal(seatFit({ prevTeam: 'rb', skill: 80 }, team, [], 5, SISTER_TEAMS), M.loyaltyBonus);
  assert.equal(seatFit({ prevTeam: 'rbr', skill: 80 }, team, [], 5, SISTER_TEAMS), M.sisterBonus);
  assert.equal(seatFit({ prevTeam: 'fer', skill: 80 }, team, [], 5, SISTER_TEAMS), 0);
  const star = { prevTeam: null, skill: M.starSkill + 2 };
  const mate = { skill: M.starSkill + 3 };
  assert.equal(seatFit(star, team, [mate], M.starCarRank + 3, {}), -M.starClashPenalty, 'duas estrelas em carro mediano');
  assert.equal(seatFit(star, team, [mate], 1, {}), 0, 'num carro top 2 pode');
});

test('equipes irmãs são simétricas e existem no grid', () => {
  const ids = new Set(TEAMS_F1.map((t) => t.id));
  for (const [a, b] of Object.entries(SISTER_TEAMS)) {
    assert.ok(ids.has(a) && ids.has(b));
    assert.equal(SISTER_TEAMS[b], a);
  }
});

test('na vaga aberta, a equipe prefere o ex-piloto dela quando as notas são parecidas', () => {
  const teams = [{ id: 'aaa', car: 80, seats: 2 }];
  const mine = { name: 'Meu', skill: 80, potential: 80, age: 28, prevTeam: 'aaa' };
  const other = { name: 'Outro', skill: 81, potential: 81, age: 28, prevTeam: 'zzz' };
  const seated = [{ name: 'Fixo', team: 'aaa', skill: 70, potential: 70, age: 30 }];
  const left = fillSeats(teams, seated, [other, mine], createRng(1), () => { throw new Error('não devia faltar piloto'); }, {});
  assert.ok(seated.some((d) => d.name === 'Meu'), 'o ex-piloto ficou com a vaga');
  assert.ok(left.every((d) => d.name !== 'Meu'));
});

test('a cada virada de ano o mundo guarda o resumo do mercado (trocas, estreias e aposentadorias)', () => {
  resetRookieCounter();
  const rng = createRng(42);
  const world = createWorld({ teams: TEAMS_F1, drivers: DRIVERS_F1, category: CATEGORIES.f1, names: SURNAMES });
  let kinds = new Set();
  for (let y = 0; y < 8; y++) {
    advanceYear(world, rng);
    for (const m of world.lastMoves) {
      kinds.add(m.kind);
      assert.ok(m.name && ['transfer', 'rookie', 'retire'].includes(m.kind));
      if (m.kind === 'transfer') assert.notEqual(m.from, m.to);
    }
  }
  assert.ok(kinds.has('transfer') && kinds.has('rookie') && kinds.has('retire'), `tipos vistos: ${[...kinds]}`);
});

test('quem tem carro melhor renova mais: a chance cai do melhor para o pior carro', () => {
  assert.ok(M.reSignBest > M.reSignWorst);
  assert.ok(M.reSignBest <= 1 && M.reSignWorst >= 0);
});
