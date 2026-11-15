import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createRng } from '../engine/rng.js';
import { paceEdge, finaleFit, finaleOptions, resolveFinale, rivalProfile } from '../engine/strategy.js';
import { CONFIG } from '../engine/config.js';

const F = CONFIG.strategy.finale;

test('a vantagem de ritmo mistura carro e habilidade pelo peso da categoria', () => {
  const fast = { teamCar: 90, skill: 90 };
  const slow = { teamCar: 80, skill: 80 };
  assert.ok(paceEdge(fast, slow, 0.6) > 0);
  assert.ok(paceEdge(slow, fast, 0.6) < 0);
  assert.equal(paceEdge(fast, fast, 0.6), 0);
  // carro pesa mais na F1: mesmo piloto em carro melhor ganha mais vantagem
  const a = { teamCar: 90, skill: 80 }; const b = { teamCar: 80, skill: 90 };
  assert.ok(paceEdge(a, b, 0.75) > paceEdge(a, b, 0.4));
});

test('o encaixe do ataque é limitado e simétrico', () => {
  assert.equal(finaleFit(0), 0);
  assert.equal(finaleFit(1000), F.maxFit);
  assert.equal(finaleFit(-1000), -F.maxFit);
  assert.equal(finaleFit(2), -finaleFit(-2));
});

function sample(choice, condition, runs = 2000) {
  const rng = createRng(321);
  const counts = { good: 0, bad: 0, none: 0, dnf: 0 };
  for (let i = 0; i < runs; i++) {
    const ds = Array.from({ length: 6 }, (_, k) => ({ name: `D${k}`, seasonDnfs: 0, teamCar: 80, skill: 80 }));
    const w = { result: [...ds], dnfs: [] };
    const res = resolveFinale(w, ds[3], ds[2], choice, 0.6, rng, 'attack', { tyre: { compound: 'medium', condition } });
    counts[res.kind]++;
    if (res.kind === 'dnf') assert.ok(w.dnfs.includes(ds[3]));
    else assert.ok(Math.abs(w.result.indexOf(ds[3]) - 3) <= 1);
  }
  return counts;
}

test('por dentro rende mais ultrapassagens e tem toque; pneu novo ajuda', () => {
  const inside = sample('inside', 90);
  const outside = sample('outside', 90);
  assert.ok(inside.good > outside.good);
  assert.ok(inside.dnf > 0);
  assert.equal(outside.dnf, 0);
  assert.ok(inside.good > sample('inside', 60).good);
  assert.deepEqual(sample('attack', 90), inside);
  assert.equal(sample('manage', 90).none, 2000);
});

test('as opções do final citam o rival e a segura continua disponível com pneu gasto', () => {
  const tyre = { compound: 'medium', condition: CONFIG.tyres.dead };
  const { options, safe } = finaleOptions('Norris', 'attack', { tyre });
  assert.equal(safe, 'manage');
  assert.deepEqual(options.map((o) => o.id), ['inside', 'outside', 'manage']);
  assert.ok(options[0].description.includes('Norris'));
  assert.ok(options[0].disabled && options[1].disabled);
  assert.match(options[0].reason, /Pneu/);
  assert.ok(!options[2].disabled);
  const ds = [{ name: 'Norris', teamCar: 80, skill: 80 }, { name: 'Jogador', teamCar: 80, skill: 80 }];
  const w = { result: [...ds], dnfs: [] };
  assert.throws(() => resolveFinale(w, ds[1], ds[0], 'inside', 0.6, createRng(1), 'attack', { tyre }), /Pneu/);
});

test('perfil usa consistência antes de desgaste e pressão ajuda no duelo seguinte', () => {
  const driver = (consistency, tyres) => ({ attributes: { consistency, tyres, qualifying: 80, race: 80, wet: 80, feedback: 80 }, attributeSkill: 80, skill: 80, teamCar: 80 });
  const mistake = rivalProfile(driver(70, 65));
  const closes = rivalProfile(driver(88, 65));
  assert.equal(mistake.press, 0.25);
  assert.equal(mistake.pressure, 0.15);
  assert.ok(closes.inside < 0 && closes.outside > 0);
  assert.ok(rivalProfile(driver(80, 70)).late > 0);
  assert.equal(rivalProfile(driver(80, 80)).late, undefined);
  const options = finaleOptions('Norris', 'attack', { profile: mistake, mid: true });
  assert.equal(options.safe, 'press');
  assert.equal(options.options[2].id, 'press');

  const player = { ...driver(80, 80), name: 'Jogador' };
  const rival = { ...driver(70, 65), name: 'Norris' };
  const outcome = (id, roll, duel) => resolveFinale({ result: [rival, player], dnfs: [] },
    player, rival, id, 0.6, { next: () => roll }, 'attack', { profile: mistake, ...duel });
  assert.equal(outcome('press', 0.20, { mid: true }).shift, 1);
  assert.equal(outcome('press', 0.30, { mid: true }).shift, 0);
  assert.notEqual(outcome('outside', 0.32, { pressure: false }).kind, 'good');
  assert.equal(outcome('outside', 0.32, { pressure: true }).kind, 'good');
});
