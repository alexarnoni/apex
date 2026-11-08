// Compara entradas no modo passo a passo e contextual com a MESMA política e os MESMOS resultados.
// Não mede tempo humano nem diversão. npm run calibrate:pace -- --n 30
import assert from 'node:assert/strict';
import { createCareer, advance, applyDecision } from '../../engine/game.js';
import { answerFor, parseArgs } from './lib.js';
import { advanceRaces } from '../../engine/advance-races.js';
import { raceAdvice } from '../../engine/race-policy.js';

const { flags } = parseArgs(process.argv.slice(2));
const n = Number(flags.n ?? 30);
if (!Number.isInteger(n) || n < 1) throw new Error('--n deve ser um inteiro positivo');
const totals = { manual: 0, contextual: 0, races: 0, seasons: 0 };
for (let seed = 1; seed <= n; seed++) {
  let s = createCareer({ surname: 'Ritmo', number: 7, style: 'con', age: 15, seed });
  for (let i = 0; i < 500 && !['F1_FIM_DE_SEMANA', 'ROTA_ALTERNATIVA'].includes(s.phase); i++) {
    s = s.pendingDecision ? applyDecision(s, answerFor(s)) : advance(s);
  }
  if (!s.f1) continue;
  let manual = s; let contextual = s;
  let manualInputs = 0; let contextualInputs = 0;
  while (manual.phase === 'F1_FIM_DE_SEMANA') {
    const pd = manual.pendingDecision;
    const single = ['story_event', 'race_event', 'race_start'].includes(pd.type) && pd.payload.options.length === 1;
    if (!single) manualInputs++;
    manual = applyDecision(manual, raceAdvice(manual)?.answer ?? answerFor(manual));
  }
  while (contextual.phase === 'F1_FIM_DE_SEMANA') {
    contextual = advanceRaces(contextual, { stop: 'important' }).state;
    contextualInputs++; // pedido de avanço
    if (contextual.phase !== 'F1_FIM_DE_SEMANA') break;
    contextual = applyDecision(contextual, raceAdvice(contextual)?.answer ?? answerFor(contextual));
    contextualInputs++; // escolha do jogador
  }
  assert.deepEqual(contextual, manual, `seed ${seed}: o modo de acompanhamento não deve mudar a política`);
  totals.manual += manualInputs; totals.contextual += contextualInputs;
  totals.races += contextual.f1.season.raceIndex; totals.seasons++;
}
console.log(JSON.stringify(totals));
console.log(`Redução de entradas neste roteiro: ${(100 * (1 - totals.contextual / Math.max(1, totals.manual))).toFixed(1)}%`);
