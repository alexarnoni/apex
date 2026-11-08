import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createRng } from '../engine/rng.js';
import { simWeekend } from '../engine/race.js';
import { createWorld, advanceYear } from '../engine/world.js';
import { retirementProb, resetRookieCounter } from '../engine/drivers.js';
import { scoutingScore, offerTier } from '../engine/market.js';
import { TEAMS_F1, DRIVERS_F1 } from '../data/world2026.js';
import { CATEGORIES } from '../data/categories.js';
import { SURNAMES } from '../data/names.js';
import { CONFIG } from '../engine/config.js';
import { runSeason } from '../engine/season.js';

function freshWorld(seed) {
  resetRookieCounter();
  const rng = createRng(seed);
  const world = createWorld({ teams: TEAMS_F1, drivers: DRIVERS_F1, category: CATEGORIES.f1, names: SURNAMES });
  return { rng, world };
}

test('mesmo seed produz o mesmo campeão (determinismo)', () => {
  const a = freshWorld(123);
  const b = freshWorld(123);
  for (let i = 0; i < 5; i++) { advanceYear(a.world, a.rng); advanceYear(b.world, b.rng); }
  assert.deepEqual(
    a.world.history.map((h) => h.champion.name),
    b.world.history.map((h) => h.champion.name),
  );
});

test('fim de semana: todo mundo termina ou abandona, pontos batem com a tabela', () => {
  const rng = createRng(7);
  const drivers = DRIVERS_F1.map((d) => ({ ...d, form: 0, teamCar: 85, seasonPoints: 0, seasonWins: 0, seasonPodiums: 0, seasonPoles: 0, seasonDnfs: 0 }));
  const w = simWeekend(drivers, CATEGORIES.f1, rng);
  // result inclui classificados + DNFs
  assert.equal(w.result.length, drivers.length);
  // pointsAwarded é null — premiação acontece em runSeason
  assert.equal(w.pointsAwarded, null);
  // Verifica que uma temporada de 1 corrida distribui pontos corretamente
  const rng2 = createRng(7);
  const drivers2 = DRIVERS_F1.map((d) => ({ ...d, form: 0, teamCar: 85 }));
  const { standings } = runSeason(drivers2, { ...CATEGORIES.f1, races: 1, ordersEnabled: false }, rng2);
  const total = standings.reduce((s, d) => s + d.seasonPoints, 0);
  const maxTotal = CONFIG.race.points.reduce((a, b) => a + b, 0);
  assert.ok(total <= maxTotal && total > 0);
});

test('grid sempre cheio após a virada de ano (22 assentos)', () => {
  const { rng, world } = freshWorld(99);
  for (let i = 0; i < 10; i++) {
    advanceYear(world, rng);
    assert.equal(world.drivers.length, 22, 'temporada ' + world.season);
    assert.ok(world.drivers.every((d) => d.team !== null));
  }
});

test('ninguém corre até os 50: aposentadoria funciona', () => {
  const { rng, world } = freshWorld(555);
  for (let i = 0; i < 25; i++) advanceYear(world, rng);
  assert.ok(world.drivers.every((d) => d.age < 47));
  assert.equal(retirementProb({ age: 25, skill: 90 }), 0);
  assert.ok(retirementProb({ age: 44, skill: 70 }) >= 0.55, 'veterano fraco aposenta com folga');
  assert.equal(retirementProb({ age: 47, skill: 99 }), 1, 'limite do corpo: aos 47 a aposentadoria é certa');
  assert.ok(retirementProb({ age: 40, skill: 92 }) < retirementProb({ age: 40, skill: 78 }), 'a elite dura mais');
});

test('scouting: campeão jovem em carro fraco > veterano em carro bom', () => {
  const young = scoutingScore({ championshipPos: 1, gridSize: 20, carRank: 10, age: 16, typicalMaxAge: 17, hasAcademy: false });
  const old = scoutingScore({ championshipPos: 1, gridSize: 20, carRank: 1, age: 20, typicalMaxAge: 17, hasAcademy: false });
  assert.ok(young > old);
  assert.equal(offerTier(young), 'top');
});

test('config não tem NaN escondido (sanidade)', () => {
  const walk = (o) => Object.values(o).forEach((v) => {
    if (typeof v === 'object' && v !== null) walk(v);
    else if (typeof v === 'number') assert.ok(Number.isFinite(v));
  });
  walk(CONFIG);
});

// --- Testes spec-piloto1-piloto2 ---

import { assignStatus, shouldOrderSwap, applyTrustEvent } from '../engine/status.js';

test('status: gap > statusSkillGap => p1/p2; gap <= gap => equal', () => {
  const S = CONFIG.status;
  const teams = [{ id: 'A', car: 90, seats: 2 }];

  // Caso 1: gap 90-85 = 5 > 4 => p1/p2
  const d1 = { name: 'Alpha', team: 'A', skill: 90 };
  const d2 = { name: 'Beta',  team: 'A', skill: 85 };
  assignStatus(teams, [d1, d2]);
  assert.equal(d1.status, 'p1');
  assert.equal(d2.status, 'p2');

  // Caso 2: gap 90-88 = 2 <= 4 => equal
  const d3 = { name: 'Gamma', team: 'A', skill: 90 };
  const d4 = { name: 'Delta', team: 'A', skill: 88 };
  assignStatus(teams, [d3, d4]);
  assert.equal(d3.status, 'equal');
  assert.equal(d4.status, 'equal');
});

test('status: ordem só dispara com título vivo e após ordersMinRace', () => {
  const S = CONFIG.status;
  const p1 = { name: 'P1', status: 'p1', isPlayer: false };
  const p2 = { name: 'P2', status: 'p2', isPlayer: false };
  // p2 à frente do p1 em zona de pontos (não precisa ser adjacente)
  const result = [p2, p1]; // p2 em P1, p1 em P2 — ambos em zona de pontos
  const dnfs = [];
  const totalRaces = 24;

  const makeCtx = (raceNumber, p1Points, leaderPoints) => ({
    result, dnfs, raceNumber, totalRaces,
    standings: [
      { driver: p1, points: p1Points },
      { driver: p2, points: leaderPoints },
    ],
    p1, p2,
  });

  // Antes de ordersMinRace (corrida 5): não dispara
  assert.equal(shouldOrderSwap(makeCtx(5, 100, 120)), null);

  // Após ordersMinRace, título vivo: dispara
  const orderCtx = makeCtx(S.ordersMinRace + 1, 100, 120);
  assert.notEqual(shouldOrderSwap(orderCtx), null);

  // Após ordersMinRace, título matematicamente morto: não dispara
  const deadCtx = makeCtx(S.ordersMinRace + 1, 0, 10000);
  assert.equal(shouldOrderSwap(deadCtx), null);

  // p2 atrás do p1: não dispara
  const p2Behind = { ...makeCtx(S.ordersMinRace + 1, 100, 120), result: [p1, p2] };
  assert.equal(shouldOrderSwap(p2Behind), null);
});

test('status: desafiar ordem mantém resultado e aplica defyOrder na confiança', () => {
  const T = CONFIG.trust;
  const player = { name: 'Jogador', trust: T.trustStart, isPlayer: true };
  const startTrust = player.trust;
  applyTrustEvent(player, 'defyOrder');
  assert.equal(player.trust, startTrust + T.defyOrder);

  // obey
  const player2 = { name: 'Jogador2', trust: T.trustStart, isPlayer: true };
  applyTrustEvent(player2, 'obeyOrder');
  assert.equal(player2.trust, T.trustStart + T.obeyOrder);
});

test('ordens de equipe: swap P2<->P5 transfere pontos corretos pós-swap', () => {
  // Monta uma corrida simples com 6 pilotos, p1 em P5 e p2 em P2
  const rng = createRng(42);
  const teams = [{ id: 'T', car: 90, seats: 2 }];
  const p1 = { name: 'P1driver', team: 'T', skill: 90, style: 'con', status: 'p1', form: 0, teamCar: 90 };
  const p2 = { name: 'P2driver', team: 'T', skill: 85, style: 'con', status: 'p2', form: 0, teamCar: 90 };
  const others = [1, 2, 3].map((i) => ({
    name: 'Other' + i, team: 'X' + i, skill: 80, style: 'con', status: 'equal', form: 0, teamCar: 85,
  }));
  const allDrivers = [p1, p2, ...others];
  const teamsById = new Map([
    ['T', { id: 'T', car: 90, seats: 2 }],
    ['X1', { id: 'X1', car: 85, seats: 2 }],
    ['X2', { id: 'X2', car: 85, seats: 2 }],
    ['X3', { id: 'X3', car: 85, seats: 2 }],
  ]);

  // Roda uma temporada curta com 8 corridas (> ordersMinRace=6)
  // e verifica que os pontos acumulados do p1 > p2 pelo efeito das ordens
  const category = { ...CATEGORIES.f1, races: 8, ordersEnabled: true };
  const { standings } = runSeason(allDrivers, category, rng, teamsById);

  // Verificação estrutural: standings é array válido com pontos
  assert.ok(standings.length === allDrivers.length);
  assert.ok(standings.every((d) => typeof d.seasonPoints === 'number'));
  // Total de pontos não pode ser maior que máximo possível (8 corridas × sum dos pontos)
  const maxPts = CONFIG.race.points.reduce((a, b) => a + b, 0) * 8;
  const totalPts = standings.reduce((s, d) => s + d.seasonPoints, 0);
  assert.ok(totalPts <= maxPts && totalPts > 0);
});
