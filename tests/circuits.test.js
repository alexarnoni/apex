import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CIRCUITS, TAG_LABEL, circuitFor } from '../data/circuits.js';
import { CATEGORIES } from '../data/categories.js';
import { CONFIG } from '../engine/config.js';
import { trackEffects } from '../engine/race.js';
import { trackFor } from '../engine/season.js';
import { circuitView } from '../engine/f1.js';

test('calendário: uma pista por etapa da F1, ids únicos e etiquetas conhecidas', () => {
  assert.equal(CIRCUITS.length, CATEGORIES.f1.races);
  assert.equal(new Set(CIRCUITS.map((c) => c.id)).size, CIRCUITS.length);
  for (const c of CIRCUITS) {
    assert.ok(c.gp && c.venue && c.flag, `${c.id} sem nome, local ou bandeira`);
    assert.ok(c.chuva >= 0 && c.chuva <= 0.5, `${c.id}: chuva fora do razoável`);
    for (const t of c.tags) assert.ok(TAG_LABEL[t] && CONFIG.tracks[t], `${c.id}: etiqueta ${t} sem efeito ou rótulo`);
  }
});

test('o calendário se repete a cada ano e só a F1 tem pista', () => {
  assert.equal(circuitFor(1).id, circuitFor(25).id);
  assert.equal(circuitFor(24).id, CIRCUITS.at(-1).id);
  assert.equal(trackFor(CATEGORIES.f1, 3).id, circuitFor(3).id);
  assert.equal(trackFor(CATEGORIES.kart, 3), null);
});

test('média de chuva do calendário fica perto da chance antiga (0,15), sem passar muito', () => {
  const mean = CIRCUITS.reduce((s, c) => s + c.chuva, 0) / CIRCUITS.length;
  assert.ok(mean > 0.11 && mean < 0.17, `média ${mean.toFixed(3)}`);
});

test('efeitos da pista: sem pista nada muda; rua pesa a largada; potência e técnica movem o peso do carro em sentidos opostos', () => {
  const none = trackEffects(null);
  assert.deepEqual(none, { carWeightDelta: 0, gridMult: 1, dnfDelta: 0, wetChance: CONFIG.race.wetChance });
  const rua = trackEffects({ tags: ['rua'], chuva: 0.1 });
  assert.ok(rua.gridMult > 1 && rua.dnfDelta > 0 && rua.wetChance === 0.1);
  assert.ok(trackEffects({ tags: ['potencia'] }).carWeightDelta > 0);
  assert.ok(trackEffects({ tags: ['tecnica'] }).carWeightDelta < 0);
  const monaco = trackEffects(circuitFor(8));
  assert.ok(monaco.gridMult > 1, 'Mônaco é de rua');
});

test('circuitView entrega nome, local, bandeira, etiquetas em português e chance de chuva em %', () => {
  const v = circuitView(8);
  assert.equal(v.gp, 'GP de Mônaco');
  assert.deepEqual(v.tags, ['Circuito de rua', 'Pista técnica']);
  assert.equal(v.rain, 10);
  assert.equal(v.hints.length, 2);
  assert.deepEqual(circuitView(24).tags, []);
});
