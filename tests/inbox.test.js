import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCareer, advance, applyDecision, getView } from '../engine/game.js';
import { advanceRaces } from '../engine/advance-races.js';
import { inboxView, headlineFor } from '../engine/inbox.js';
import { answerFor } from '../tools/calibrate/lib.js';

// Carreira na F1 com algumas corridas já disputadas.
function playedF1(races = 4) {
  for (let seed = 1; seed <= 10; seed++) {
    let s = createCareer({ surname: 'Caixa', number: 7, style: 'con', age: 15, seed });
    for (let i = 0; i < 500; i++) {
      if (s.pendingDecision?.type === 'weekend_approach' && !s.pendingDecision.payload.out) break;
      if (s.phase === 'ROTA_ALTERNATIVA') break;
      s = s.pendingDecision ? applyDecision(s, answerFor(s)) : advance(s);
    }
    if (s.pendingDecision?.type === 'weekend_approach' && !s.pendingDecision.payload.out) {
      return advanceRaces(s, { limit: races, stop: 'none' }).state;
    }
  }
  throw new Error('não encontrou F1');
}

test('a caixa de entrada tem uma mensagem por corrida e no máximo 40 mensagens', () => {
  const s = playedF1(4);
  const inbox = getView(s).inbox;
  const raceMsgs = inbox.filter(m => m.kind === 'corrida');
  assert.equal(raceMsgs.length, s.f1.season.races.length);
  assert.ok(inbox.length <= 40);
});

test('ids são únicos e estáveis entre chamadas e a lista vai da mais nova para a mais antiga', () => {
  const s = playedF1(3);
  const a = inboxView(s);
  const b = inboxView(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(a.map(m => m.id), b.map(m => m.id));
  assert.equal(new Set(a.map(m => m.id)).size, a.length);
  for (let i = 1; i < a.length; i++) assert.ok(a[i - 1].year >= a[i].year);
});

test('a leitura não altera o estado', () => {
  const s = playedF1(2);
  const before = JSON.stringify(s);
  inboxView(s); headlineFor(s);
  assert.equal(JSON.stringify(s), before);
});

test('a nota aparece na mensagem da corrida quando existe', () => {
  const s = playedF1(2);
  const race = s.f1.season.races.find(r => r.rating != null);
  assert.ok(race, 'corrida com nota');
  const msg = inboxView(s).find(m => m.id === `corrida:${s.year}:${race.n}`);
  assert.match(msg.title, /^Nota \d,\d · /);
});

test('save antigo sem nota ainda mostra a mensagem da corrida só com o GP', () => {
  const s = playedF1(2);
  const old = JSON.parse(JSON.stringify(s));
  for (const r of old.f1.season.races) delete r.rating;
  const msg = inboxView(old).find(m => m.kind === 'corrida');
  assert.ok(msg);
  assert.ok(!msg.title.startsWith('Nota'));
});

test('manchete devolve null sem corrida e um texto com o nome quando há vitória ou pódio', () => {
  const s = playedF1(1);
  const h = headlineFor(s);
  if (s.f1.season.lastRace.playerPos && s.f1.season.lastRace.playerPos <= 3) assert.ok(h && h.title.includes(s.player.name));
  const base = JSON.parse(JSON.stringify(s));
  base.f1.season.lastRace.playerPos = 1;
  assert.match(headlineFor(base).title, /vence o GP/);
  base.f1.season.lastRace.playerPos = 9;
  base.f1.season.lastRace.teammatePos = 12;
  base.f1.season.lastRace.teammateName = 'Rival';
  base.f1.season.lastRace.teammateGrid = 3;
  base.f1.season.lastRace.grid = 10;
  assert.match(headlineFor(base).title, /supera Rival/);
});
