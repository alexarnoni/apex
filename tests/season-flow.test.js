import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCareer, advance, applyDecision, getView } from '../engine/game.js';
import { raceAdvice } from '../engine/race-policy.js';
import { advanceRaces } from '../engine/advance-races.js';
import { createSeasonGoal, goalProgress } from '../engine/season-goals.js';
import { answerFor } from '../tools/calibrate/lib.js';

function weekend() {
  for (let seed = 1; seed <= 10; seed++) {
    let s = createCareer({ surname: 'Fluxo', number: 7, style: 'con', age: 15, seed });
    for (let i = 0; i < 500; i++) {
      if (s.pendingDecision?.type === 'weekend_approach') return s;
      if (s.phase === 'ROTA_ALTERNATIVA') break;
      s = s.pendingDecision ? applyDecision(s, answerFor(s)) : advance(s);
    }
  }
  throw new Error('não encontrou F1');
}

test('plano persistente muda sem iniciar corrida, sem RNG e sobrevive a JSON', () => {
  const s = weekend(); const before = JSON.stringify(s);
  const next = applyDecision(s, { id: 'conservative', savePlan: true });
  assert.equal(next.f1.racePlan, 'conservative');
  assert.equal(next.f1.season.raceIndex, 0);
  assert.equal(next.rngState, s.rngState);
  assert.equal(raceAdvice(next).answer.id, 'conservative');
  assert.equal(getView(JSON.parse(JSON.stringify(next))).f1.plan, 'conservative');
  assert.equal(JSON.stringify(s), before);
  assert.throws(() => applyDecision(s, { id: 'toString', savePlan: true }), /inválido/);
});

test('metas são por carro, ficam fixas e a view de save JSON é correta', () => {
  const s = weekend();
  const fixed = structuredClone(s.f1.season.goal);
  assert.ok(fixed.teammate && fixed.target > 0);
  const copy = JSON.parse(JSON.stringify(s));
  assert.deepEqual(goalProgress(copy), goalProgress(s));
  for (const team of copy.f1.world.teams) team.car *= -1;
  assert.deepEqual(copy.f1.season.goal, fixed);
  for (const team of s.f1.world.teams) {
    const goal = createSeasonGoal(s.f1.world, { ...s.player, team: team.id });
    assert.equal(goal.kind, goal.tier === 'ponta' ? 'position' : goal.tier === 'meio' ? 'points' : 'scoring');
  }
});

test('automático usa as mesmas respostas/transições do manual e não altera a entrada', () => {
  const s = weekend(); const before = JSON.stringify(s);
  const result = advanceRaces(s, { limit: 5, stop: 'none' });
  let manual = s;
  for (let i = 0; i < result.actions; i++) manual = applyDecision(manual, raceAdvice(manual).answer);
  assert.deepEqual(result.state, manual);
  assert.equal(result.completed, 5);
  assert.equal(JSON.stringify(s), before);
  assert.deepEqual(advanceRaces(JSON.parse(before), { limit: 5, stop: 'none' }), result);
});

test('avanço importante pula pneus/largada comuns e para numa escolha contextual', () => {
  const s = weekend();
  const all = advanceRaces(s, { stop: 'all' });
  assert.equal(all.state.pendingDecision.type, 'race_strategy');
  const relevant = advanceRaces(s);
  assert.ok(relevant.actions > all.actions);
  assert.ok(raceAdvice(relevant.state)?.important || relevant.state.phase === 'F1_FIM_TEMPORADA');
  if (relevant.state.pendingDecision?.type !== 'story_event') {
    const next = advanceRaces(relevant.state, { limit: 1, delegateCurrent: true });
    assert.ok(next.actions >= 1, 'delegar a situação atual não trava na mesma escolha');
  }
});

test('retomar no meio da corrida conta corridas concluídas, não abordagens iniciadas', () => {
  const s = applyDecision(weekend(), { id: 'balanced' });
  const result = advanceRaces(s, { limit: 5, stop: 'none' });
  assert.equal(result.completed, 5);
  assert.equal(result.state.pendingDecision.type, 'weekend_approach');
});

test('recomendação de defesa protege ponto em P10; fora da disputa pode ceder', () => {
  const s = weekend();
  s.pendingDecision = { type: 'race_finale', payload: { mode: 'defend', pos: 10, pace: 'even', rival: { name: 'Outro' }, options: [{ id: 'defend', label: 'Defender' }, { id: 'yield', label: 'Ceder' }], safe: 'yield' } };
  assert.equal(raceAdvice(s).answer.id, 'defend');
  s.pendingDecision.payload.pos = 20;
  s.pendingDecision.payload.pace = 'slower';
  assert.equal(raceAdvice(s).answer.id, 'yield');
  assert.equal(raceAdvice(s).important, false);
});

test('saves sem campos novos abrem e inicializam meta/plano na próxima ação', () => {
  const s = JSON.parse(JSON.stringify(weekend()));
  delete s.f1.racePlan; delete s.f1.season.goal;
  const before = JSON.stringify(s);
  assert.equal(getView(s).f1.plan, 'balanced');
  assert.ok(getView(s).f1.goal.label);
  const result = advanceRaces(s, { limit: 1, stop: 'none' });
  assert.ok(result.state.f1.season.goal);
  assert.equal(JSON.stringify(s), before);
});

test('meta pendente no fim do ano informa a recomendação sem ignorar plano conservador', () => {
  const s = weekend();
  s.pendingDecision = { type: 'race_finale', payload: { mode: 'attack', pos: 11, pace: 'even', rival: { name: 'Outro' }, options: [{ id: 'attack', label: 'Atacar' }, { id: 'manage', label: 'Administrar' }], safe: 'manage' } };
  s.f1.season.goal = { ...s.f1.season.goal, kind: 'points', target: 8 };
  assert.equal(raceAdvice(s).answer.id, 'manage', 'cedo, o plano equilibrado não aposta com ritmo igual');
  s.f1.season.raceIndex = s.f1.season.total - 2;
  assert.equal(raceAdvice(s).answer.id, 'attack', 'faltando pontos no fim, pode tentar alcançar a meta');
  assert.ok(raceAdvice(s).reason.includes('meta'));
  s.f1.racePlan = 'conservative';
  assert.equal(raceAdvice(s).answer.id, 'manage', 'a preferência explícita de preservar continua valendo');
});

test('balanço de temporada e relato usam resultados registrados, sem prêmio de skill', () => {
  let s = weekend();
  for (let i = 0; i < 300; i++) {
    if (s.phase === 'F1_FIM_TEMPORADA') break;
    const result = advanceRaces(s, { stop: 'none' });
    s = result.state;
    if (s.phase === 'F1_FIM_TEMPORADA') break;
    s = applyDecision(s, answerFor(s));
  }
  assert.equal(s.phase, 'F1_FIM_TEMPORADA');
  assert.ok(s.f1.lastSeason.goal.label);
  assert.equal(s.f1.lastSeason.goal.done, s.f1.season.total);
  assert.ok(s.f1.season.races.some(r => r.teammateName));
  assert.ok(goalProgress(s).lines.some(line => line.includes('Companheiro')));
});
