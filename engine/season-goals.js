import { CONFIG } from './config.js';
import { expectedPosition } from './profile.js';

export function createSeasonGoal(world, player) {
  const carRank = [...world.teams].sort((a, b) => b.car - a.car).findIndex(t => t.id === player.team) + 1;
  const mate = world.drivers.find(d => !d.isPlayer && d.team === player.team);
  const targetPosition = Math.min(world.drivers.length, expectedPosition(carRank));
  const tier = carRank <= CONFIG.f1.carTierRank.top ? 'ponta' : carRank <= CONFIG.f1.carTierRank.mid ? 'meio' : 'fundo';
  const G = CONFIG.f1.goals;
  const kind = tier === 'ponta' ? 'position' : tier === 'meio' ? 'points' : 'scoring';
  const target = kind === 'position' ? targetPosition : kind === 'points'
    ? Math.max(G.midMinPoints, Math.round((CONFIG.race.points[targetPosition - 1] ?? 0) * world.category.races * G.pointsFraction))
    : G.rearScoringRaces;
  return { carRank, tier, kind, target, targetPosition, teammate: mate?.name ?? null };
}

export function goalProgress(state) {
  const { world, season } = state.f1;
  if (!season) return null;
  const p = world.drivers.find(d => d.isPlayer) ?? state.player;
  const goal = season.goal ?? createSeasonGoal(world, p);
  const standings = [...world.drivers].sort((a, b) => (b.seasonPoints ?? 0) - (a.seasonPoints ?? 0) || (b.seasonWins ?? 0) - (a.seasonWins ?? 0));
  const races = season.races;
  const scoring = races.filter(r => r.playerPos && r.playerPos <= CONFIG.race.points.length).length;
  const value = goal.kind === 'position' ? standings.indexOf(p) + 1 : goal.kind === 'points' ? p.seasonPoints ?? 0 : scoring;
  const met = goal.kind === 'position' ? value <= goal.target : value >= goal.target;
  const label = goal.kind === 'position' ? `Terminar entre os ${goal.target} primeiros do mundial`
    : goal.kind === 'points' ? `Somar ${goal.target} pontos na temporada` : `Pontuar em ${goal.target} corrida${goal.target === 1 ? '' : 's'}`;
  const progress = goal.kind === 'position' ? `${value}º no mundial` : `${value} de ${goal.target}${goal.kind === 'points' ? ' pontos' : goal.target === 1 ? ' corrida com pontos' : ' corridas com pontos'}`;
  const mate = world.drivers.find(d => d.name === goal.teammate);
  const recent = races.slice(-CONFIG.f1.goals.recentRaces).filter(r => r.teammateName === goal.teammate && !r.missed);
  const ahead = recent.filter(r => r.playerPos && (!r.teammatePos || r.playerPos < r.teammatePos)).length;
  const lines = [];
  if (races.length === 0) lines.push('A meta foi definida pelo carro no início do ano; ainda não há resultados para avaliar.');
  else lines.push(`${progress}. ${met ? season.raceIndex >= season.total ? 'Meta cumprida ao fim da temporada.' : 'Meta ao alcance; mantenha o resultado até o fim do ano.' : goal.kind === 'position' ? 'A equipe espera uma reação na classificação.' : `Faltam ${Math.max(0, goal.target - value)} para a meta.`}`);
  if (mate && races.length) lines.push(`Companheiro: ${p.seasonPoints ?? 0} a ${mate.seasonPoints ?? 0} pontos contra ${mate.name}.`);
  if (recent.length) lines.push(`Você terminou à frente de ${goal.teammate} em ${ahead} das últimas ${recent.length} corridas comparáveis.`);
  const leader = standings[0];
  if (races.length && leader && leader !== p && p.seasonPoints > 0) lines.push(`${leader.name} lidera; você está ${leader.seasonPoints - p.seasonPoints} pontos atrás.`);
  if (races.length && p.contract <= 1) lines.push('Seu contrato chega ao fim nesta temporada; o desempenho e a confiança pesam nas próximas ofertas.');
  return { ...goal, label, value, progress, met: races.length > 0 && met, done: season.raceIndex, total: season.total, lines,
    consequence: 'A meta orienta a cobrança da equipe. Abaixo dela, a pressão do carro pode reduzir a confiança; cumprir evita essa cobrança. Não há prêmio automático de habilidade.' };
}
