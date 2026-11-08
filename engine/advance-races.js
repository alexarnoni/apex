import { applyDecision } from './game.js';
import { raceAdvice } from './race-policy.js';

// Todos os modos usam a mesma política e as mesmas transições das escolhas manuais.
export function advanceRaces(state, { limit = Infinity, stop = 'important', autoSingle = true, delegateCurrent = false } = {}) {
  if (!['none', 'all', 'important'].includes(stop)) throw new Error('modo de parada inválido');
  const initial = state.f1?.season?.raceIndex ?? 0;
  const initialSeason = state.f1?.world?.season;
  let current = state;
  let actions = 0;
  let reason = '';
  for (let guard = 0; guard < 5000; guard++) {
    const pd = current.pendingDecision;
    if (current.phase !== 'F1_FIM_DE_SEMANA' || !pd || current.f1.world.season !== initialSeason) { reason = 'A temporada terminou.'; break; }
    const completed = current.f1.season.raceIndex - initial;
    if (completed >= limit) { reason = 'Etapas solicitadas concluídas.'; break; }
    const advice = raceAdvice(current);
    const single = ['story_event', 'race_event', 'race_start'].includes(pd.type) && pd.payload.options.length === 1 && autoSingle;
    const narrative = pd.type === 'story_event';
    const delegated = delegateCurrent && current === state && !narrative;
    if (!advice?.answer || (!single && !delegated && (narrative || (pd.type !== 'weekend_approach' && (stop === 'all' || (stop === 'important' && advice.important)))))) {
      reason = advice?.reason ?? 'Há uma decisão pendente.'; break;
    }
    current = applyDecision(current, advice.answer);
    actions++;
  }
  return { state: current, completed: (current.f1?.season?.raceIndex ?? initial) - initial, actions, reason };
}
