import { test } from 'node:test';
import assert from 'node:assert/strict';
import { raceRating } from '../engine/rating.js';

test('vitória saindo da pole com o carro nº 1 não fica abaixo de 8,5', () => {
  assert.ok(raceRating({ playerPos: 1, grid: 1, carRank: 1 }) >= 8.5);
});

test('carro nº 1 em P8 tem nota baixa; carro nº 9 em P8 tem nota alta', () => {
  assert.ok(raceRating({ playerPos: 8, grid: 8, carRank: 1 }) <= 5);
  assert.ok(raceRating({ playerPos: 8, grid: 8, carRank: 9 }) >= 8.5);
});

test('abandono vale 4 e corrida não disputada não tem nota', () => {
  assert.equal(raceRating({ playerPos: null, grid: 6, carRank: 3 }), 4);
  assert.equal(raceRating({ playerPos: null, grid: 6, carRank: 3, missed: true }), null);
});

test('o companheiro desloca a nota em 0,3 antes do arredondamento', () => {
  const base = { playerPos: 5, grid: null, carRank: 3 };
  const ahead = raceRating({ ...base, teammatePos: 7 });
  const behind = raceRating({ ...base, teammatePos: 3 });
  const none = raceRating(base);
  assert.ok(ahead >= none && behind <= none);
  assert.ok(ahead >= none + 0.5 || ahead === none);
});

test('a nota fica entre 1 e 10 em passos de meio ponto', () => {
  for (let carRank = 1; carRank <= 10; carRank++) {
    for (let playerPos = 1; playerPos <= 20; playerPos++) {
      for (const grid of [null, 1, 10, 20]) {
        for (const teammatePos of [null, 1, 10, 20]) {
          const r = raceRating({ playerPos, grid, carRank, teammatePos });
          assert.ok(r >= 1 && r <= 10, `fora da faixa: ${r}`);
          assert.equal(Math.round(r * 2), r * 2, `não é meio ponto: ${r}`);
        }
      }
    }
  }
});
