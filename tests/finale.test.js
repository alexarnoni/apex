import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createRng } from '../engine/rng.js';
import { paceEdge, finaleFit, finaleOptions, resolveFinale } from '../engine/strategy.js';
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

function meanShift(choice, player, rival, carWeight, runs = 4000) {
  const rng = createRng(321);
  let total = 0;
  for (let i = 0; i < runs; i++) {
    const ds = Array.from({ length: 12 }, (_, k) => ({ name: `D${k}`, seasonDnfs: 0 }));
    // jogador em P6 (índice 5), rival logo à frente (índice 4)
    const w = { result: [...ds], dnfs: [] };
    const p = ds[5]; const r = ds[4];
    Object.assign(p, player); Object.assign(r, rival);
    resolveFinale(w, p, r, choice, carWeight, rng);
    total += 5 - w.result.indexOf(p);
  }
  return total / runs;
}

test('administrar não muda nada; atacar compensa só para quem tem mais ritmo', () => {
  const quick = { teamCar: 90, skill: 92 }; const mid = { teamCar: 82, skill: 82 };
  assert.equal(meanShift('manage', quick, mid, 0.6), 0);
  assert.ok(meanShift('attack', quick, mid, 0.6) > 0.15, 'mais rápido que o rival: ataque rende');
  assert.ok(meanShift('attack', mid, quick, 0.6) < -0.15, 'mais lento que o rival: ataque custa');
  assert.ok(Math.abs(meanShift('attack', mid, mid, 0.6)) < 0.06, 'ritmo igual: média zero');
});

test('o ataque move no máximo uma posição e a resposta traz texto', () => {
  const rng = createRng(4);
  for (let i = 0; i < 200; i++) {
    const ds = Array.from({ length: 6 }, (_, k) => ({ name: `D${k}`, seasonDnfs: 0, teamCar: 80, skill: 80 }));
    const w = { result: [...ds], dnfs: [] };
    const before = w.result.indexOf(ds[3]);
    const res = resolveFinale(w, ds[3], ds[2], 'attack', 0.6, rng);
    assert.ok(['good', 'bad', 'none'].includes(res.kind));
    assert.ok(Math.abs(w.result.indexOf(ds[3]) - before) <= 1);
    assert.ok(res.text.includes('D2'));
  }
});

test('as opções do final citam o rival e a segura é administrar', () => {
  const { options, safe } = finaleOptions('Norris');
  assert.equal(safe, 'manage');
  assert.deepEqual(options.map((o) => o.id), ['attack', 'manage']);
  assert.ok(options[0].description.includes('Norris'));
});
