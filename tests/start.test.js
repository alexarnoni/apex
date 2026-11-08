import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startOptions, resolveStart } from '../engine/start.js';
import { createCareer, advance, applyDecision } from '../engine/game.js';
import { answerFor } from '../tools/calibrate/lib.js';
import { createRng } from '../engine/rng.js';
import { CONFIG } from '../engine/config.js';

const ctx = { grid: 4, gridSize: 6, wet: false, tags: [] };
const grid = () => {
  const ds = Array.from({ length: 6 }, (_, i) => ({ name: `D${i}`, seasonDnfs: 0, style: 'con' }));
  return { ds, w: { result: [...ds], dnfs: [] } };
};

test('largar com margem é neutro e não sorteia; pole não oferece ataque sem posição para ganhar', () => {
  const { ds, w } = grid();
  const r = resolveStart(w, ds[3], 'hold', ctx, { next: () => { throw new Error('não deve sortear'); } });
  assert.equal(r.shift, 0);
  assert.equal(r.position, 4);
  assert.deepEqual(w.result, ds);
  assert.equal(startOptions(ctx).safe, 'hold');
  assert.deepEqual(startOptions({ grid: 1 }).options.map((o) => o.id), ['hold']);
  assert.throws(() => resolveStart(w, ds[0], 'attack', { ...ctx, grid: 1 }, null), /inválida/);
});

test('ataque na largada pode ganhar, perder ou manter posição e contato causa abandono', () => {
  for (const [roll, expectedKind, expectedShift] of [[0, 'dnf', null], [0.2, 'good', 1], [0.5, 'bad', -1], [0.9, 'none', 0]]) {
    const { ds, w } = grid();
    const r = resolveStart(w, ds[3], 'attack', ctx, { next: () => roll });
    assert.equal(r.kind, expectedKind);
    assert.equal(r.shift, expectedShift);
    assert.equal(w.dnfs.includes(ds[3]), expectedKind === 'dnf');
    assert.equal(ds[3].seasonDnfs, expectedKind === 'dnf' ? 1 : 0);
    assert.equal(new Set(w.result).size, ds.length);
  }
});

test('chuva e rua aumentam contato; último não perde uma posição inexistente na largada', () => {
  const dry = grid();
  assert.notEqual(resolveStart(dry.w, dry.ds[3], 'attack', ctx, { next: () => 0.04 }).kind, 'dnf');
  for (const extra of [{ wet: true }, { tags: ['rua'] }]) {
    const { ds, w } = grid();
    assert.equal(resolveStart(w, ds[3], 'attack', { ...ctx, ...extra }, { next: () => 0.04 }).kind, 'dnf');
  }
  const { ds, w } = grid();
  const last = resolveStart(w, ds[5], 'attack', { ...ctx, grid: 6 }, { next: () => 0.5 });
  assert.equal(last.position, 6);
  assert.equal(last.shift, 0);
  assert.ok(!last.text.includes('caiu'));
});

function findStart() {
  for (let seed = 1; seed <= 10; seed++) {
    let s = createCareer({ surname: 'Teste', number: 7, style: 'con', age: 15, seed });
    for (let i = 0; i < 1500; i++) {
      if (s.pendingDecision?.type === 'race_start' && s.pendingDecision.payload.grid > 1) return s;
      if (s.phase === 'LEGADO' || s.phase === 'ROTA_ALTERNATIVA') break;
      s = s.pendingDecision ? applyDecision(s, answerFor(s)) : advance(s);
    }
  }
  throw new Error('não encontrou largada');
}

test('largada pela API aceita save JSON e rejeita resposta inválida sem alterar estado', () => {
  const s = findStart();
  assert.ok(s.f1.season.cur.strategy, 'estratégia vem antes da largada');
  const json = JSON.stringify(s);
  assert.throws(() => applyDecision(s, { id: 'invalid' }), /inválida/);
  const restored = JSON.parse(json);
  assert.deepEqual(applyDecision(s, { id: 'hold' }), applyDecision(restored, { id: 'hold' }));
  assert.equal(JSON.stringify(s), json);
});

test('toque na largada encerra a participação, não dá pontos e tem causa específica no relato', () => {
  const s = JSON.parse(JSON.stringify(findStart()));
  // Estado RNG controlado para testar o contato pelo fluxo público, sem alterar regras.
  s.rngState = Array.from({ length: 1000 }, (_, i) => i).find((i) => createRng(s.seed, i).next() < CONFIG.start.contact);
  assert.notEqual(s.rngState, undefined);
  const points = s.player.seasonPoints;
  const dnfs = s.player.seasonDnfs;
  const gp = s.player.stats.gp ?? 0;
  let next = applyDecision(s, { id: 'attack' });
  while (next.pendingDecision?.type === 'team_order') next = applyDecision(next, { id: 'obey' });
  const race = next.f1.season.lastRace;
  assert.equal(race.playerPos, null);
  assert.equal(next.player.seasonPoints, points);
  assert.equal(next.player.seasonDnfs, dnfs + 1);
  assert.equal(next.player.stats.gp, gp + 1);
  assert.deepEqual(race.story.map((line) => line.when), ['Largada', 'Abandono']);
  assert.ok(race.story.at(-1).text.includes('primeira curva'));
  assert.notEqual(next.pendingDecision?.type, 'race_finale');
});
