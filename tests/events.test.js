import { test } from 'node:test';
import assert from 'node:assert/strict';

import { EFFECTS, applyEffects, rollOutcome, pickRaceEvent } from '../engine/events.js';
import { createRng } from '../engine/rng.js';
import { NARRATIVE_EVENTS, RACE_EVENTS } from '../data/events.js';

const mk = (name, extra = {}) => ({ name, skill: 80, potential: 90, fame: 0, trust: 60, age: 20, seasonPoints: 0, seasonDnfs: 0, ...extra });

function ctxWith(over = {}) {
  const player = mk('Eu', { seasonPoints: 50, ...over.player });
  const rival = mk('Rival', { seasonPoints: 60 });
  const leader = mk('Lider', { seasonPoints: 55 });
  const w = { wet: false, result: [rival, player, leader], dnfs: [], pole: leader };
  return {
    player, rival, f1: {}, world: { drivers: [player, rival, leader] }, w,
    pos: 2, rivalAheadOnTrack: false, rivalAhead: false, teamRank: 3, teamName: 'Equipe',
    seasonPos: 2, titleGap: 5, noPointsStreak: 0, winStreak: 0,
    lastRace: { playerPos: 5, missed: false }, races: [],
    ...over,
  };
}

// --- efeitos declarativos (um teste por efeito) ------------------------------

test('efeito skill: sobe até o potencial, nunca passa dele', () => {
  const c = ctxWith();
  EFFECTS.skill(c, 5);
  assert.equal(c.player.skill, 85);
  EFFECTS.skill(c, 50);
  assert.equal(c.player.skill, 90);
});

test('efeito skillTemp: altera agora e registra o total para reverter no fim do ano', () => {
  const c = ctxWith();
  EFFECTS.skillTemp(c, -1);
  EFFECTS.skillTemp(c, -2);
  assert.equal(c.player.skill, 77);
  assert.equal(c.player.skillTemp, -3);
});

test('efeitos fame e trust (trust fica em 0-100)', () => {
  const c = ctxWith();
  EFFECTS.fame(c, 2);
  EFFECTS.trust(c, 50);
  assert.equal(c.player.fame, 2);
  assert.equal(c.player.trust, 100);
  EFFECTS.trust(c, -500);
  assert.equal(c.player.trust, 0);
});

test('efeito perfBuff: acumula buffs com valor e duração', () => {
  const c = ctxWith();
  EFFECTS.perfBuff(c, { value: 2, races: 3 });
  EFFECTS.perfBuff(c, { value: -1, races: 1 });
  assert.deepEqual(c.player.buffs, [{ value: 2, races: 3 }, { value: -1, races: 1 }]);
});

test('efeitos missRaces, devBonus e scouting acumulam', () => {
  const c = ctxWith();
  EFFECTS.missRaces(c, 2); EFFECTS.missRaces(c, 1);
  EFFECTS.devBonus(c, 0.05); EFFECTS.devBonus(c, 0.03);
  EFFECTS.scouting(c, 2); EFFECTS.scouting(c, 2);
  assert.equal(c.f1.missRaces, 3);
  assert.ok(Math.abs(c.f1.devBonus - 0.08) < 1e-9);
  assert.equal(c.player.offerBonus, 4);
});

test('efeito pointsPenalty: tira pontos sem passar de zero', () => {
  const c = ctxWith();
  EFFECTS.pointsPenalty(c, 10);
  assert.equal(c.player.seasonPoints, 40);
  EFFECTS.pointsPenalty(c, 100);
  assert.equal(c.player.seasonPoints, 0);
});

test('efeito titleRoll: "player" passa o líder; "rival" não mexe', () => {
  const a = ctxWith();
  EFFECTS.titleRoll(a, 'rival');
  assert.equal(a.player.seasonPoints, 50);
  EFFECTS.titleRoll(a, 'player');
  assert.equal(a.player.seasonPoints, 61); // líder tinha 60
});

test('efeito shift: sobe/desce posições entre os classificados, DNFs ficam no fim', () => {
  const c = ctxWith();
  const [rival, , leader] = c.w.result;
  EFFECTS.shift(c, 1);
  assert.deepEqual(c.w.result.map((d) => d.name), ['Eu', 'Rival', 'Lider']);
  EFFECTS.shift(c, -5); // não passa do último
  assert.deepEqual(c.w.result.map((d) => d.name), ['Rival', 'Lider', 'Eu']);
  assert.ok(rival && leader);
});

test('efeitos dnf e dnfRival: tiram da corrida e contam abandono', () => {
  const c = ctxWith();
  EFFECTS.dnf(c);
  assert.ok(c.w.dnfs.includes(c.player));
  assert.equal(c.player.seasonDnfs, 1);
  assert.equal(c.w.result.at(-1), c.player);
  EFFECTS.dnf(c); // idempotente
  assert.equal(c.player.seasonDnfs, 1);
  EFFECTS.dnfRival(c);
  assert.ok(c.w.dnfs.includes(c.rival));
  assert.equal(c.rival.seasonDnfs, 1);
});

test('efeito desconhecido lança erro (pega typo na tabela)', () => {
  assert.throws(() => applyEffects(ctxWith(), { naoExiste: 1 }, createRng(1)), /efeito desconhecido/);
});

// --- tabelas ------------------------------------------------------------------

test('todo efeito usado nas tabelas existe no motor', () => {
  for (const ev of [...NARRATIVE_EVENTS, ...RACE_EVENTS]) {
    for (const o of ev.options) for (const out of o.outcomes) {
      for (const name of Object.keys(out.effects)) assert.ok(EFFECTS[name], `${ev.id}: efeito ${name}`);
    }
  }
});

test('probabilidades de cada opção somam 1 e ids são únicos', () => {
  const ids = new Set();
  for (const ev of [...NARRATIVE_EVENTS, ...RACE_EVENTS]) {
    assert.ok(!ids.has(ev.id), `id repetido ${ev.id}`);
    ids.add(ev.id);
    for (const o of ev.options) {
      const sum = o.outcomes.reduce((s, x) => s + x.p, 0);
      assert.ok(Math.abs(sum - 1) < 1e-9, `${ev.id}/${o.id}: soma ${sum}`);
    }
  }
});

test('nenhum evento tem condição impossível: cada um é satisfeito por algum contexto realista', () => {
  const variants = [
    ctxWith(),
    ctxWith({ pos: 1, lastRace: { playerPos: 1, missed: false }, winStreak: 2, seasonPos: 1, titleGap: 0 }),
    ctxWith({ pos: 12, noPointsStreak: 3, lastRace: { playerPos: null, missed: false }, rivalAhead: true, rivalAheadOnTrack: true, teamRank: 8 }),
    ctxWith({ player: { fame: 9, contract: 1, exitClause: true } }),
    ctxWith({ titleGap: 4 }),
  ];
  for (const ev of [...NARRATIVE_EVENTS, ...RACE_EVENTS]) {
    assert.ok(variants.some((v) => ev.cond(v)), `${ev.id} nunca é elegível`);
  }
});

test('rollOutcome respeita as faixas de probabilidade', () => {
  const opt = { outcomes: [{ p: 0.25, id: 'a' }, { p: 0.75, id: 'b' }] };
  assert.equal(rollOutcome(opt, { next: () => 0.1 }).id, 'a');
  assert.equal(rollOutcome(opt, { next: () => 0.3 }).id, 'b');
  assert.equal(rollOutcome(opt, { next: () => 0.9999 }).id, 'b');
});

test('pickRaceEvent: sem sorteio de tentativa, a corrida fica quieta', () => {
  assert.equal(pickRaceEvent(RACE_EVENTS, ctxWith(), { chance: () => false, next: () => 0.5 }), null);
});
