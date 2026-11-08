import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createRng } from '../engine/rng.js';
import { applyAging, playerDeclineDelta, declineInfo } from '../engine/drivers.js';
import { CONFIG } from '../engine/config.js';

const D = CONFIG.lifecycle.playerDecline;

test('antes do início do declínio não há queda fixa (o piloto segue a curva normal)', () => {
  assert.equal(playerDeclineDelta(D.startAge.con - 1, 'con'), null);
  assert.equal(playerDeclineDelta(25, 'agg'), null);
});

test('o declínio do jogador é uma curva fixa: cresce por ano até o limite', () => {
  const s = D.startAge.con;
  assert.equal(playerDeclineDelta(s, 'con'), D.firstYear);
  assert.ok(playerDeclineDelta(s + 1, 'con') < playerDeclineDelta(s, 'con'));
  assert.equal(playerDeclineDelta(s + 20, 'con'), D.cap);
});

test('o estilo muda quando o declínio começa: agressivo cedo, técnico tarde', () => {
  assert.ok(D.startAge.agg < D.startAge.con && D.startAge.con < D.startAge.tec);
  assert.notEqual(playerDeclineDelta(D.startAge.agg, 'agg'), null);
  assert.equal(playerDeclineDelta(D.startAge.agg, 'tec'), null);
});

test('treinar na pré-temporada corta a queda do ano', () => {
  const age = D.startAge.con + 2;
  const plain = playerDeclineDelta(age, 'con', false);
  const trained = playerDeclineDelta(age, 'con', true);
  assert.ok(Math.abs(trained) < Math.abs(plain));
  assert.ok(Math.abs(trained - plain * (1 - D.trainShield)) < 1e-9);
});

test('envelhecer o jogador não depende do sorteio; os outros pilotos continuam com variação', () => {
  const mk = (extra) => ({ name: 'X', age: D.startAge.con - 1, skill: 90, potential: 95, style: 'con', ...extra });
  const results = new Set();
  for (let seed = 1; seed <= 20; seed++) {
    const p = mk({ isPlayer: true });
    applyAging(p, createRng(seed));
    results.add(p.skill);
  }
  assert.equal(results.size, 1, 'mesma queda com qualquer sorteio');
  assert.equal([...results][0], 90 + D.firstYear);

  const ai = new Set();
  for (let seed = 1; seed <= 20; seed++) {
    const d = mk({});
    applyAging(d, createRng(seed));
    ai.add(d.skill);
  }
  assert.ok(ai.size > 1, 'piloto controlado pelo jogo segue aleatório');
});

test('a ficha recebe a previsão (início, queda do próximo ano com e sem treino)', () => {
  const young = declineInfo({ age: 24, style: 'agg' });
  assert.equal(young.startAge, D.startAge.agg);
  assert.equal(young.inDecline, false);
  const old = declineInfo({ age: D.startAge.con + 1, style: 'con' });
  assert.equal(old.inDecline, true);
  assert.ok(old.next < 0 && old.nextTrained > old.next);
});

test('a habilidade do jogador nunca cai abaixo do piso', () => {
  const p = { name: 'X', age: 40, skill: CONFIG.lifecycle.skillFloor + 0.5, potential: 90, style: 'con', isPlayer: true };
  applyAging(p, createRng(1));
  assert.ok(p.skill >= CONFIG.lifecycle.skillFloor);
});
