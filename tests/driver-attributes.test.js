import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attributesOf, overall, ensureAttributes, trainAttributes, attributeView } from '../engine/driver-attributes.js';
import { createWorld } from '../engine/world.js';
import { applyAging } from '../engine/drivers.js';
import { createRng } from '../engine/rng.js';
import { simWeekend } from '../engine/race.js';
import { CONFIG } from '../engine/config.js';
import { TEAMS_F1, DRIVERS_F1 } from '../data/world2026.js';
import { CATEGORIES } from '../data/categories.js';
import { SURNAMES } from '../data/names.js';

test('perfis reais preservam overall inicial e atributos ficam nos limites', () => {
  const w = createWorld({ teams: TEAMS_F1, drivers: DRIVERS_F1, category: CATEGORIES.f1, names: SURNAMES });
  for (const d of w.drivers) {
    assert.ok(Math.abs(overall(attributesOf(d)) - d.skill) < 1e-8);
    assert.equal(attributeView(d).length, 6);
    assert.ok(Object.values(d.attributes).every(v => v >= 0 && v <= 100));
  }
  const h = w.drivers.find(d => d.name === 'Hamilton');
  assert.ok(h.attributes.feedback > h.attributes.qualifying);
});

test('jogador com sobrenome de piloto real usa seu estilo, não herda o perfil do homônimo', () => {
  const p = { name: 'Hamilton', skill: 80, potential: 95, age: 20, style: 'agg', isPlayer: true };
  const a = attributesOf(p);
  const b = attributesOf({ ...p, name: 'Qualquer' });
  assert.deepEqual(a, b);
});

test('treino direcionado muda distribuição, mantém potencial e não corta o jogador em 87', () => {
  const mk = () => ensureAttributes({ name: 'Teste', isPlayer: true, skill: 89, potential: 98, age: 25, style: 'con' });
  const targeted = mk(); const balanced = mk();
  trainAttributes(targeted, 1, 'tyres'); trainAttributes(balanced, 1);
  assert.equal(targeted.skill, 90); assert.equal(balanced.skill, 90);
  assert.ok(targeted.attributes.tyres > balanced.attributes.tyres);
  assert.ok(Math.abs(overall(targeted.attributes) - targeted.skill) < 1e-8);
  assert.throws(() => trainAttributes(targeted, 1, '__proto__'), /inválido/);
});

test('envelhecimento separa velocidade de técnica e continua determinístico para jogador', () => {
  const mk = () => ensureAttributes({ name: 'Teste', isPlayer: true, skill: 90, potential: 98, age: 34, style: 'con' });
  const a = mk(); const b = mk(); const before = { ...a.attributes };
  applyAging(a, createRng(1)); applyAging(b, createRng(999));
  assert.deepEqual(a, b);
  assert.ok(before.qualifying - a.attributes.qualifying > before.feedback - a.attributes.feedback);
  assert.ok(Math.abs(overall(a.attributes) - a.skill) < 1e-8);
  for (let i = 0; i < 20; i++) applyAging(a, createRng(i));
  assert.ok(a.skill >= CONFIG.lifecycle.skillFloor);
  assert.ok(Object.values(a.attributes).every(v => v >= 0 && v <= 100));
});

test('efeitos escalares e save antigo geram view coerente sem mutar o estado lido', () => {
  const d = ensureAttributes({ name: 'Teste', skill: 80, potential: 95, style: 'tec' });
  d.skill += 2;
  const json = JSON.stringify(d);
  assert.ok(Math.abs(overall(attributesOf(d)) - 82) < 1e-8);
  assert.equal(JSON.stringify(d), json);
  const old = { name: 'Antigo', skill: 75, style: 'con' };
  assert.ok(Math.abs(overall(attributesOf(old)) - 75) < 1e-8);
});

test('classificação e ritmo de corrida usam competências diferentes com overall igual', () => {
  const mk = (name, q, r) => ensureAttributes({ name, style: 'con', skill: 80, potential: 90, teamCar: 80, form: 0,
    attributes: { qualifying: q, race: r, consistency: 80, wet: 80, tyres: 80, feedback: 80 } });
  const q = mk('Classificador', 95, 65); const r = mk('Corredor', 65, 95);
  const fixed = { next: () => 0.5, chance: () => false, range: () => 0, gauss: () => 0 };
  const result = simWeekend([q, r], CATEGORIES.f1, fixed);
  assert.equal(result.pole.name, 'Classificador');
  assert.equal(result.result[0].name, 'Corredor');
  q.teamCar = 110;
  assert.equal(q.skill, 80, 'carro não muda overall');
});
