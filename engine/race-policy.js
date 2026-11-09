import { CONFIG } from './config.js';
import { strategyFit, finaleFit } from './strategy.js';
import { goalProgress } from './season-goals.js';

export const PLAN_LABELS = { conservative: 'Preservar resultados', balanced: 'Equilibrar', risky: 'Buscar oportunidades' };
export const racePlan = state => Object.hasOwn(PLAN_LABELS, state.f1?.racePlan) ? state.f1.racePlan : 'balanced';

// Política transparente: só usa informações já exibidas na decisão, nunca RNG ou resultado oculto.
export function raceAdvice(state) {
  const pd = state.pendingDecision;
  if (!pd) return null;
  const p = pd.payload;
  const plan = racePlan(state);
  const zone = CONFIG.race.points.length;
  const F = CONFIG.f1.flow;
  let id = p.safe;
  let important = false;
  let reason = 'Situação comum: a equipe segue seu plano.';
  if (pd.type === 'weekend_approach') id = p.out ? 'rest' : plan;
  else if (pd.type === 'race_strategy') {
    id = p.safe;
    const circuit = state.f1.season.pendingRace?.strategyCtx ?? {};
    if (plan === 'risky' && !p.wet) {
      id = [...p.options].sort((a, b) => strategyFit(b.id, circuit) - strategyFit(a.id, circuit))[0].id;
    }
    // Clima fixo: pneus recomendados não justificam uma interrupção a cada etapa.
    reason = p.wet ? 'Pista molhada: a equipe recomenda pneus de chuva.' : 'Pneus definidos pelo plano e pelas características da pista.';
  } else if (pd.type === 'race_pit') {
    id = !p.interruption && p.changes && plan === 'risky' && !p.wet && p.clearAir ? 'extend' : p.safe;
    important = !!p.interruption || p.changes || !!p.rival;
    reason = p.interruption === 'red_flag' ? 'A prova foi suspensa. Você pode trocar pneus sem perder posição.'
      : p.interruption === 'safety_car' ? 'O pelotão está agrupado. Avalie a troca antes da relargada.'
      : p.changes ? 'A pista mudou. É hora de decidir se você troca de composto.' : 'O desgaste abriu uma janela para trocar pneus.';
  } else if (pd.type === 'race_start') {
    const street = state.f1.season.pendingRace?.startCtx?.tags.includes('rua');
    id = plan === 'risky' && !p.wet && !street && p.options.some(o => o.id === 'attack') ? 'attack' : 'hold';
    reason = p.wet || street ? 'Primeira curva de risco: a equipe prioriza margem.' : 'Largada segue o plano escolhido.';
  } else if (pd.type === 'race_finale') {
    const goal = goalProgress(state);
    const goalUrgent = goal && !goal.met && goal.total - goal.done <= F.goalUrgencyRaces;
    const edge = p.pace === 'faster' ? F.opportunityEdge : p.pace === 'slower' ? -F.opportunityEdge : 0;
    const relevant = p.pos <= zone + F.chaseMargin;
    const rival = state.f1.world.drivers.find(d => d.name === p.rival.name);
    const teammate = state.f1.season.goal?.teammate;
    const rivalOfYear = state.f1.season.rival;
    important = relevant || rival?.name === teammate || rival?.name === rivalOfYear;
    if (p.mode === 'defend') {
      // Só o ritmo em faixas exibido ao jogador entra na estimativa.
      const D = CONFIG.strategy.finale.defense;
      const hold = Math.max(D.minHold, Math.min(D.maxHold, D.holdChance + D.perFit * finaleFit(edge)));
      const points = pos => CONFIG.race.points[pos - 1] ?? 0;
      const defending = hold * points(p.pos) + Math.max(0, 1 - hold - D.mistakeChance) * points(p.pos + 1) + D.mistakeChance * points(p.pos + 2);
      const yielding = points(p.pos + 1);
      const risk = plan === 'conservative' ? F.preserveRisk : plan === 'risky' ? F.attackRisk : 1;
      id = defending > yielding * risk || (!relevant && edge >= 0 && plan !== 'conservative') ? 'defend' : 'yield';
      reason = `Você está em P${p.pos}; ${p.rival.name} pressiona logo atrás. ${relevant ? 'A disputa pode decidir pontos.' : 'O duelo envolve um adversário da sua temporada.'}`;
    } else {
      id = edge >= (plan === 'risky' || goalUrgent ? 0 : F.opportunityEdge) && relevant && plan !== 'conservative' ? 'attack' : 'manage';
      reason = `Você está em P${p.pos}; ${p.rival.name} segue logo à frente. ${relevant ? 'Há posições de pontos em disputa.' : 'Você pode enfrentar seu rival do ano.'}`;
    }
    if (goalUrgent && relevant) reason += ` Faltam ${goal.total - goal.done} etapas e a meta da equipe ainda não foi alcançada.`;
  } else if (pd.type === 'team_order') { id = 'obey'; important = true; reason = 'Ordem de equipe: sua decisão afeta o resultado e a confiança.'; }
  else if (pd.type === 'race_event') { important = p.options.length > 1; reason = `${p.title}: uma situação de corrida exige sua escolha.`; }
  else if (pd.type === 'story_event') { important = p.options.length > 1; id = p.options[0].id; reason = 'Notícia com consequências para a carreira.'; }
  else return null;
  if (!id) { important = true; reason = 'A equipe não tem recomendação segura para esta decisão salva.'; }
  return { answer: id ? { id } : null, important, reason, plan, recommendation: p.options && Array.isArray(p.options) ? p.options.find(o => o.id === id)?.label : null };
}
