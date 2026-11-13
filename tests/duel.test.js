import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCareer, advance, applyDecision, getView } from '../engine/game.js';
import { teammateDuel, titleMath } from '../engine/duel.js';
import { answerFor } from '../tools/calibrate/lib.js';

// Leva uma carreira até o primeiro fim de semana de F1 e simula algumas etapas.
function f1Season(races = 0) {
  for (let seed = 1; seed <= 10; seed++) {
    let s = createCareer({ surname: 'Duelo', number: 7, style: 'con', age: 15, seed });
    for (let i = 0; i < 2000; i++) {
      if (s.phase === 'ROTA_ALTERNATIVA') break;
      const done = s.f1?.season?.raceIndex;   // há carreiras que entram na F1 com a temporada em andamento
      if (s.pendingDecision?.type === 'weekend_approach' && !s.pendingDecision.payload.out && (races === 0 ? done === 0 : done >= races)) return s;
      s = s.pendingDecision ? applyDecision(s, answerFor(s)) : advance(s);
    }
  }
  throw new Error('não encontrou F1');
}

test('no início da temporada o duelo está zerado e o título aberto, sem alterar o estado', () => {
  const s = f1Season(0);
  const before = JSON.stringify(s);
  const d = teammateDuel(s);
  const t = titleMath(s);
  assert.equal(d.races, 0);
  assert.equal(d.myPoints, 0);
  assert.equal(t.started, false);
  assert.equal(t.alive, true);
  assert.equal(t.maxRemaining, t.remaining * t.perRace);
  assert.equal(JSON.stringify(s), before);
});

test('depois de corridas o placar fecha com as etapas e a conta do título é coerente', () => {
  const s = f1Season(3);
  const d = teammateDuel(s);
  assert.ok(d.races >= 1 && d.races <= s.f1.season.raceIndex);
  assert.ok(d.raceWins + d.raceLosses <= d.races);
  assert.equal(d.pointsLead, d.myPoints - d.matePoints);
  const t = titleMath(s);
  assert.ok(t.gap >= 0);
  assert.equal(t.alive, t.isLeader ? !t.decided : s.f1.world.drivers.find(x => x.isPlayer).seasonPoints + t.maxRemaining >= s.f1.world.drivers.find(x => x.name === t.rival).seasonPoints);
  assert.equal(typeof t.line, 'string');
  const view = getView(s);
  assert.deepEqual(view.f1.duel, d);
  assert.deepEqual(view.f1.title, t);
  assert.ok(view.player.talent);
});

test('faixa do legado cobre qualquer nota e só apresenta', async () => {
  const { legacyTier } = await import('../engine/f1.js');
  assert.equal(legacyTier(0).label, 'Passagem discreta');
  assert.equal(legacyTier(1679).label, 'Piloto respeitado');
  assert.equal(legacyTier(1700).label, 'Piloto de destaque');
  assert.equal(legacyTier(23140).label, 'Dinastia histórica');
  assert.equal(legacyTier(23140).next, null);
  assert.equal(legacyTier(100).next.missing, 400);
});

test('a view traz nacionalidade da equipe e abandonos da carreira', () => {
  const v = getView(f1Season(0));
  assert.ok(v.f1.constructors.every(c => typeof c.nat === 'string'));
  assert.equal(typeof v.player.career.dnfs, 'number');
});

test('recordes do mundo somam só quem tem marca e a base registra companheiro e campeão', async () => {
  const { worldRecords } = await import('../engine/records.js');
  const s = f1Season(3);
  const recs = worldRecords(s.f1.world);
  assert.ok(Array.isArray(recs));
  for (const r of recs) assert.ok(r.value > 0 && typeof r.name === 'string');
  const view = getView(s);
  assert.deepEqual(view.f1.records, recs);
  const seasons = view.baseHistory;
  assert.ok(seasons.length > 0);
  assert.ok(seasons.every(x => 'mate' in x && 'champion' in x), 'campos novos da base entram em todas as temporadas novas');
  const mated = seasons.filter(x => x.mate);
  assert.ok(mated.length > 0 && mated.every(x => x.mate.name && x.mate.position >= 1));
  const cum = view.f1.races.map(r => r.points);
  assert.ok(cum.every(p => p === null || p >= 0));
});
