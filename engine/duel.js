// Duelo com o companheiro e conta do título. Funções puras sobre o estado da temporada: sem sorteio e sem campo novo no save.

import { CONFIG } from './config.js';

const byPoints = (a, b) => (b.seasonPoints ?? 0) - (a.seasonPoints ?? 0) || (b.seasonWins ?? 0) - (a.seasonWins ?? 0);

// Placar contra o companheiro atual: pontos, corridas e classificações à frente. Corridas com outro companheiro não entram.
export function teammateDuel(state) {
  const { world, season } = state.f1;
  if (!season) return null;
  const me = world.drivers.find(d => d.isPlayer) ?? state.player;
  const mate = world.drivers.find(d => !d.isPlayer && d.team === me.team);
  if (!mate) return null;
  const races = season.races.filter(r => !r.missed && r.teammateName === mate.name);
  let raceWins = 0; let raceLosses = 0; let gridWins = 0; let gridLosses = 0;
  for (const r of races) {
    if (r.playerPos && (!r.teammatePos || r.playerPos < r.teammatePos)) raceWins += 1;
    else if (r.teammatePos && (!r.playerPos || r.teammatePos < r.playerPos)) raceLosses += 1;
    if (r.grid > 0 && r.teammateGrid > 0) { if (r.grid < r.teammateGrid) gridWins += 1; else if (r.teammateGrid < r.grid) gridLosses += 1; }
  }
  const myPoints = me.seasonPoints ?? 0;
  const matePoints = mate.seasonPoints ?? 0;
  return {
    name: mate.name, age: mate.age, nat: mate.nat ?? mate.flag ?? null, overall: Math.round(mate.skill * 10) / 10,
    myPoints, matePoints, pointsLead: myPoints - matePoints,
    races: races.length, raceWins, raceLosses, gridWins, gridLosses,
    status: me.status ?? null,
  };
}

// Quanto falta para o título: pontos do líder, o que ainda está em disputa e quantos pontos por etapa são necessários.
// Não conta ponto de volta mais rápida nem sprint (a engine não tem). Empate em pontos fica por vitórias, por isso "alcance" usa >=.
export function titleMath(state) {
  const { world, season } = state.f1;
  if (!season) return null;
  const me = world.drivers.find(d => d.isPlayer) ?? state.player;
  const remaining = Math.max(0, season.total - season.raceIndex);
  const perRace = CONFIG.race.points[0];
  const standings = [...world.drivers].sort(byPoints);
  const leader = standings[0];
  const second = standings[1];
  const mine = me.seasonPoints ?? 0;
  const isLeader = leader === me;
  const rival = isLeader ? second : leader;
  const rivalPoints = rival?.seasonPoints ?? 0;
  const gap = isLeader ? mine - rivalPoints : rivalPoints - mine;   // sempre >= 0
  const maxRemaining = remaining * perRace;
  const started = season.raceIndex > 0;
  const decided = started && isLeader && gap > maxRemaining;
  const alive = isLeader ? !decided : mine + maxRemaining >= rivalPoints;
  const needPerRace = !isLeader && alive && remaining > 0 ? Math.ceil((gap + 1) / remaining) : null;
  let line;
  if (!started) line = `Faltam ${remaining} etapas e ${maxRemaining} pontos em jogo. O título está aberto para todos.`;
  else if (remaining === 0) line = isLeader ? 'Temporada encerrada: você é o campeão.' : `Temporada encerrada: ${rival.name} é o campeão.`;
  else if (decided) line = `Título matemático: ${gap} pontos de vantagem para ${maxRemaining} em jogo.`;
  else if (isLeader) line = `Você lidera por ${gap} ponto${gap === 1 ? '' : 's'} sobre ${rival.name}; ainda há ${maxRemaining} em jogo.`;
  else if (alive) line = `${rival.name} lidera por ${gap} ponto${gap === 1 ? '' : 's'}. Para alcançá-lo, você precisa somar em média ${needPerRace} ponto${needPerRace === 1 ? '' : 's'} por etapa a mais que ele nas ${remaining} restantes.`;
  else line = `O título saiu do seu alcance: ${gap} pontos atrás com ${maxRemaining} em jogo.`;
  return { started, remaining, maxRemaining, perRace, isLeader, leader: leader?.name ?? null, rival: rival?.name ?? null, gap, alive, decided, needPerRace, line };
}
