import { test } from 'node:test';
import assert from 'node:assert/strict';
import { finaleSituation, finaleOptions, resolveFinale } from '../engine/strategy.js';
import { createCareer, advance, applyDecision } from '../engine/game.js';
import { answerFor } from '../tools/calibrate/lib.js';
import { CONFIG } from '../engine/config.js';

function grid() {
  const ds = Array.from({ length: 6 }, (_, i) => ({ name: `D${i}`, team: `T${i}`, teamCar: 80, skill: 80 }));
  return { ds, w: { result: [...ds], dnfs: [] } };
}

test('um rival mais rápido atrás gera defesa; líder pode defender e último não tem perseguidor', () => {
  const { ds, w } = grid();
  ds[3].skill = 100;
  assert.equal(finaleSituation(w, ds[2], 0.6).mode, 'defend');
  assert.equal(finaleSituation(w, ds[0], 0.6).rival, ds[1]);
  assert.equal(finaleSituation(w, ds[5], 0.6).mode, 'attack');
  ds[1].team = ds[0].team;
  assert.equal(finaleSituation(w, ds[0], 0.6), null, 'não disputa com companheiro após as ordens');
  w.dnfs.push(ds[0]);
  assert.equal(finaleSituation(w, ds[0], 0.6), null);
});

test('defender preserva a posição ou perde até duas; ceder perde uma e exclui abandonos', () => {
  for (const [roll, expected] of [[0, 0], [0.8, -1], [0.99, -2]]) {
    const { ds, w } = grid();
    const r = resolveFinale(w, ds[2], ds[3], 'defend', 0.6, { next: () => roll }, 'defend');
    assert.equal(r.shift, expected);
    assert.equal(w.result.indexOf(ds[2]), 2 - expected);
    assert.ok(r.text.includes(ds[3].name));
    assert.equal(new Set(w.result).size, ds.length);
  }
  const { ds, w } = grid();
  w.dnfs.push(ds[5]);
  const r = resolveFinale(w, ds[3], ds[4], 'defend', 0.6, { next: () => 0.99 }, 'defend');
  assert.equal(r.shift, -1, 'não perde posição para quem abandonou');
  const a = grid();
  const yielded = resolveFinale(a.w, a.ds[2], a.ds[3], 'yield', 0.6, { next: () => { throw new Error('não deve sortear'); } }, 'defend');
  assert.equal(yielded.shift, -1);
  assert.equal(finaleOptions('Rival', 'defend').safe, 'yield');
});

test('ritmo melhor aumenta a chance de segurar a defesa', () => {
  const quick = grid();
  quick.ds[2].skill = 100;
  assert.equal(resolveFinale(quick.w, quick.ds[2], quick.ds[3], 'defend', 0.6, { next: () => 0.7 }, 'defend').shift, 0);
  const slow = grid();
  slow.ds[3].skill = 100;
  assert.equal(resolveFinale(slow.w, slow.ds[2], slow.ds[3], 'defend', 0.6, { next: () => 0.7 }, 'defend').shift, -1);
});

function findFinale(mode) {
  let found;
  for (let seed = 1; seed <= 6 && !found; seed++) {
    let s = createCareer({ surname: 'Teste', number: 7, style: 'con', age: 15, seed });
    for (let step = 0; step < 1200; step++) {
      if (s.pendingDecision?.type === 'race_finale' && s.pendingDecision.payload.mode === mode) { found = s; break; }
      if (s.phase === 'LEGADO' || s.phase === 'ROTA_ALTERNATIVA') break;
      s = s.pendingDecision ? applyDecision(s, answerFor(s)) : advance(s);
    }
  }
  assert.ok(found, `encontrou decisão de ${mode} no fluxo real`);
  return found;
}

test('defesa pela API restaura JSON, rejeita resposta inválida e premia só após a decisão', () => {
  const found = findFinale('defend');
  const snapshot = JSON.stringify(found);
  assert.throws(() => applyDecision(found, { id: 'attack' }), /id inválido/);
  const before = found.player.seasonPoints;
  const after = applyDecision(found, { id: 'yield' });
  assert.equal(JSON.stringify(found), snapshot, 'estado anterior não foi alterado');
  assert.deepEqual(after, applyDecision(JSON.parse(snapshot), { id: 'yield' }), 'retomada mantém resultado');
  const race = after.f1.season.lastRace;
  assert.equal(race.playerPos, found.pendingDecision.payload.pos + 1);
  assert.equal(after.player.seasonPoints - before, CONFIG.race.points[race.playerPos - 1] ?? 0);
  assert.ok(race.story.some((line) => line.when === 'Final (Ceder)' && line.text.includes(found.pendingDecision.payload.rival.name)));
});

test('decisão antiga de ataque sem mode continua resolvendo com o mesmo resultado', () => {
  const current = findFinale('attack');
  const old = JSON.parse(JSON.stringify(current));
  delete old.f1.season.pendingRace.finaleMode;
  delete old.pendingDecision.payload.mode;
  assert.deepEqual(applyDecision(old, { id: 'manage' }), applyDecision(current, { id: 'manage' }));
});
