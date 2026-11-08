import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createRng } from '../engine/rng.js';
import { makeRookie, resetRookieCounter } from '../engine/drivers.js';
import { NAME_POOLS, SURNAMES } from '../data/names.js';
import { DRIVERS_F1 } from '../data/world2026.js';
import { COUNTRY_CODES } from '../ui/countries.js';

test('todo piloto real tem nacionalidade com bandeira disponível', () => {
  for (const d of DRIVERS_F1) {
    assert.ok(d.nat, `${d.name} sem nacionalidade`);
    assert.ok(COUNTRY_CODES.includes(d.nat), `${d.name}: bandeira ${d.nat} não existe`);
  }
});

test('todo país dos nomes gerados tem bandeira, nomes e sobrenomes', () => {
  for (const [code, p] of Object.entries(NAME_POOLS)) {
    assert.ok(COUNTRY_CODES.includes(code), `bandeira de ${code}`);
    assert.ok(p.w > 0 && p.firsts.length >= 5 && p.surnames.length >= 8, `${code}: poucos nomes`);
  }
});

test('novatos gerados têm nacionalidade e nome "I. Sobrenome", sem "II" e sem colidir com pilotos reais', () => {
  resetRookieCounter();
  const rng = createRng(77);
  const real = new Set(DRIVERS_F1.map((d) => d.name));
  const countries = new Set();
  const names = new Set();
  for (let i = 0; i < 600; i++) {
    const r = makeRookie(SURNAMES, rng);
    assert.match(r.name, /^\p{L}\. \S.*$/u, r.name);
    assert.ok(!r.name.endsWith(' II'));
    assert.ok(!real.has(r.name));
    assert.ok(NAME_POOLS[r.nat], `país ${r.nat} sem lista`);
    countries.add(r.nat); names.add(r.name);
  }
  assert.ok(countries.size >= 15, `variedade de países: ${countries.size}`);
  assert.ok(names.size > 450, `nomes distintos em 600 novatos: ${names.size}`);
});

test('o sorteio de identidade é determinístico por seed', () => {
  resetRookieCounter();
  const a = Array.from({ length: 10 }, () => makeRookie(SURNAMES, createRng(5)).name);
  resetRookieCounter();
  const b = Array.from({ length: 10 }, () => makeRookie(SURNAMES, createRng(5)).name);
  assert.deepEqual(a, b);
});
