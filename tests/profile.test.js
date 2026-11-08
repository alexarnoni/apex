import { test } from 'node:test';
import assert from 'node:assert/strict';

import { tierOf, profileOf, profileView, expectedPosition, scoutPressure, trustPressure, effectiveDev } from '../engine/profile.js';
import { applyAging, raisePotential } from '../engine/drivers.js';
import { createRng } from '../engine/rng.js';
import { scoutingBreakdown, scoutingScore } from '../engine/market.js';
import { CONFIG } from '../engine/config.js';
import { createCareer, applyDecision, getView } from '../engine/game.js';

const P = CONFIG.teamProfile;

test('o perfil sai da posição do carro: ponta, meio e fundo', () => {
  assert.equal(tierOf(1, 10), 'ponta');
  assert.equal(tierOf(3, 10), 'ponta');
  assert.equal(tierOf(5, 10), 'meio');
  assert.equal(tierOf(8, 10), 'fundo');
  assert.equal(tierOf(10, 10), 'fundo');
  const cuts = { top: 4, mid: 8 };
  assert.equal(tierOf(4, 11, cuts), 'ponta');
  assert.equal(tierOf(8, 11, cuts), 'meio');
  assert.equal(tierOf(9, 11, cuts), 'fundo');
});

test('a troca é a pedida: ponta = mais pressão e desenvolvimento rápido; fundo = zero pressão e desenvolvimento lento', () => {
  assert.ok(P.ponta.pressure > P.meio.pressure && P.meio.pressure > P.fundo.pressure);
  assert.equal(P.fundo.pressure, 0);
  assert.ok(P.ponta.development > P.meio.development && P.meio.development > P.fundo.development);
  assert.equal(P.meio.development, 1);
  assert.ok(P.fundo.exposure > 1, 'quem se destaca num carro fraco chama mais atenção');
});

test('as palavras para a tela batem com os números', () => {
  assert.deepEqual([profileView('ponta').pressureWord, profileView('ponta').developmentWord], ['alta', 'rápido']);
  assert.deepEqual([profileView('meio').pressureWord, profileView('meio').developmentWord], ['média', 'médio']);
  assert.deepEqual([profileView('fundo').pressureWord, profileView('fundo').developmentWord], ['nenhuma', 'lento']);
  for (const t of ['ponta', 'meio', 'fundo']) assert.ok(profileView(t).text.length > 20);
});

test('a posição esperada cresce com o rank do carro', () => {
  assert.ok(expectedPosition(1) < expectedPosition(5) && expectedPosition(5) < expectedPosition(10));
  assert.equal(expectedPosition(1), 3);
});

test('pressão na base é só cobrança: sem pressão nada muda; na ponta, ficar abaixo do esperado subtrai e superar não soma', () => {
  assert.equal(scoutPressure('fundo', 10, 20), 0);
  assert.equal(scoutPressure('fundo', 10, 1), 0);
  const over = scoutPressure('ponta', 1, 1);   // esperava P3 e foi campeão
  const under = scoutPressure('ponta', 1, 9);  // esperava P3 e foi P9
  assert.equal(over, 0, 'o prêmio de ir bem é evoluir mais rápido, não nota extra (isso inflava os títulos)');
  assert.ok(under < 0);
  assert.ok(Math.abs(scoutPressure('ponta', 3, 15)) > Math.abs(scoutPressure('meio', 3, 15)), 'ponta cobra mais que meio');
  assert.ok(Math.abs(scoutPressure('ponta', 1, 40)) <= P.scoutCap, 'o ajuste é limitado');
});

test('pressão na F1: só ficar abaixo do esperado custa confiança, mais na ponta, e nunca é positiva', () => {
  assert.equal(trustPressure('fundo', 10, 22), 0);
  assert.equal(trustPressure('ponta', 1, 1), 0);
  assert.equal(trustPressure('ponta', 1, 3), 0);
  assert.ok(trustPressure('ponta', 1, 9) < 0);
  assert.ok(trustPressure('ponta', 1, 9) < trustPressure('meio', 1, 9));
  assert.ok(trustPressure('ponta', 1, 99) >= P.trustCap * P.trustPerPosUnder - 1e-9, 'limite de posições contadas');
});

test('a nota de scouting soma o ajuste de pressão e o carro fraco vale mais no fundo', () => {
  const base = { championshipPos: 3, gridSize: 20, carRank: 9, age: 15, typicalMaxAge: 19, hasAcademy: false };
  assert.equal(scoutingBreakdown({ ...base, pressure: 0 }).pressure, 0);
  assert.equal(scoutingBreakdown({ ...base, pressure: -1.5 }).pressure, -1.5);
  assert.ok(scoutingScore({ ...base, pressure: -2 }) < scoutingScore({ ...base, pressure: 0 }));
  assert.ok(scoutingBreakdown({ ...base, exposure: 1.4 }).weakCar > scoutingBreakdown({ ...base, exposure: 1 }).weakCar);
});

test('o desenvolvimento da equipe acelera ou freia o crescimento do jogador, mas não o declínio', () => {
  const grow = (dev) => {
    let total = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const p = { name: 'X', isPlayer: true, age: 17, skill: 60, potential: 95, style: 'con', devFactor: dev };
      applyAging(p, createRng(seed));
      total += p.skill - 60;
    }
    return total / 200;
  };
  assert.ok(grow(1.25) > grow(1) && grow(1) > grow(0.8));
  // declínio idêntico, qualquer que seja o desenvolvimento
  const decl = (dev) => { const p = { name: 'X', isPlayer: true, age: 36, skill: 85, potential: 90, style: 'con', devFactor: dev }; applyAging(p, createRng(3)); return p.skill; };
  assert.equal(decl(1.25), decl(0.8));
});

test('"se for bem, evolui bem": o bônus da equipe de ponta só vale se o jogador correspondeu ao esperado', () => {
  assert.equal(effectiveDev('ponta', true), P.ponta.development);
  assert.equal(effectiveDev('ponta', false), 1, 'abaixo do esperado cresce no ritmo normal, sem bônus');
  assert.equal(effectiveDev('meio', false), P.meio.development);
  assert.equal(effectiveDev('fundo', true), P.fundo.development, 'o fundo não tem condição');
  assert.equal(effectiveDev('fundo', false), P.fundo.development);
});

test('o desenvolvimento também muda o ganho de teto por treino', () => {
  const gain = (dev) => { const p = { potential: 85, devFactor: dev }; raisePotential(p); return p.potential - 85; };
  assert.ok(gain(1.25) > gain(1) && gain(1) > gain(0.8));
});

test('as ofertas da base trazem o perfil da equipe e o jogador guarda o fator de desenvolvimento', () => {
  let s = createCareer({ surname: 'Teste', number: 7, flag: 'BR', style: 'con', seed: 11, age: 15 });
  assert.ok(['ponta', 'meio', 'fundo'].includes(s.player.tier));
  assert.equal(s.player.devFactor, profileOf(s.player.tier).development);
  for (let i = 0; i < 40 && s.pendingDecision?.type !== 'offer_pick'; i++) {
    const pd = s.pendingDecision;
    s = applyDecision(s, pd.type === 'base_choice' ? { option: 'A' } : pd.type === 'academy_invite' ? { accept: true } : { id: 'stay' });
  }
  if (s.pendingDecision?.type !== 'offer_pick') return; // carreira sem ofertas nesta semente
  for (const o of s.pendingDecision.payload.options) {
    assert.ok(o.profile && o.profile.label && ['alta', 'média', 'nenhuma'].includes(o.profile.pressureWord), `oferta ${o.id} sem perfil`);
    assert.ok(['rápido', 'médio', 'lento'].includes(o.profile.developmentWord));
  }
  void getView(s);
});
