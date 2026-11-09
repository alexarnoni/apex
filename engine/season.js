// Roda uma temporada completa de qualquer categoria e devolve as classificações.
//
// INVARIANTE DE ARQUITETURA: qualquer mecânica que altere resultado de corrida
// (ordens de equipe, punições FIA, etc.) deve entrar ANTES da premiação.
// Nunca premiar dentro do simWeekend — pontos saem da ordem final pós-swap.
//
// A temporada é composta por passos pequenos (resetSeasonStats, startRace, applyTeamOrders,
// awardRace, summarizeSeason) para que a carreira do jogador possa correr uma etapa por vez
// e parar numa decisão (ordem de equipe) no meio de uma corrida. runSeason só os encadeia.

import { simWeekend } from './race.js';
import { shouldOrderSwap } from './status.js';
import { CONFIG } from './config.js';
import { circuitFor } from '../data/circuits.js';

// Só a F1 tem calendário com pistas por enquanto; as outras categorias seguem sem pista.
export const trackFor = (category, n) => (category.id === 'f1' ? circuitFor(n) : null);

export function resetSeasonStats(drivers) {
  for (const d of drivers) {
    d.seasonPoints = 0;
    d.seasonWins = 0;
    d.seasonPodiums = 0;
    d.seasonPoles = 0;
    d.seasonDnfs = 0;
    d.form = 0;
  }
}

// Simula quali + corrida (sem premiar). Devolve o fim de semana bruto, já com DNFs e poles contados.
export function startRace(drivers, category, rng, teamsById = null, track = null) {
  if (teamsById) for (const d of drivers) d.teamCar = teamsById.get(d.team).car;
  const w = simWeekend(drivers, category, rng, track);
  // w.pointsAwarded é null — premiação acontece em awardRace, após swaps
  w.dnfs.forEach((d) => { d.seasonDnfs += 1; });
  w.pole.seasonPoles += 1; // pole não muda com swap
  return w;
}

// Ordens de equipe ANTES de premiar — swap muda posição final, pontos vêm depois.
// playerPolicy:
//   null | 'obey'  -> toda ordem é cumprida (inclusive contra o jogador)
//   'defy'         -> o jogador desafia ordens em que ele está envolvido
//   'ask'          -> ordem CONTRA o jogador (ele é p2 à frente do p1) pausa e devolve
//                     { paused: true, teamIndex, order }; retome com startTeam = teamIndex
//                     e 'obey' | 'defy'. Ordem a favor do jogador é cumprida sozinha.
export function applyTeamOrders(w, drivers, category, teamsById, raceNumber, { playerPolicy = null, startTeam = 0, ordersLog = [] } = {}) {
  if (!teamsById || !category.ordersEnabled) return { paused: false };

  // Classificação do mundial ANTES desta corrida (pontos acumulados até aqui)
  const currentStandings = drivers.map((d) => ({ driver: d, points: d.seasonPoints }));
  const sortedStandings = [...currentStandings].sort((a, b) =>
    b.points - a.points || b.driver.skill - a.driver.skill);

  const teams = [...teamsById.values()];
  for (let ti = startTeam; ti < teams.length; ti++) {
    const team = teams[ti];
    const pair = drivers.filter((d) => d.team === team.id && d.status);
    const p1 = pair.find((d) => d.status === 'p1');
    const p2 = pair.find((d) => d.status === 'p2');
    if (!p1 || !p2) continue;

    const order = shouldOrderSwap({
      result: w.result,
      dnfs: w.dnfs,
      raceNumber,
      totalRaces: category.races,
      standings: currentStandings,
      sortedStandings,
      p1,
      p2,
    });
    if (!order) continue;

    const playerInvolved = p1.isPlayer || p2.isPlayer;
    let defied = false;

    if (playerPolicy === 'ask' && p2.isPlayer) {
      return { paused: true, teamIndex: ti, order };
    }
    if (playerInvolved && playerPolicy === 'defy') {
      defied = true;
    } else {
      // Troca posições no array de resultado — pontos ainda não foram atribuídos
      const { p1Pos, p2Pos } = order;
      [w.result[p1Pos], w.result[p2Pos]] = [w.result[p2Pos], w.result[p1Pos]];
    }

    ordersLog.push({ race: raceNumber, team: team.id, p1: p1.name, p2: p2.name, defied });
  }
  return { paused: false };
}

// Premia a partir da ordem FINAL (pós-swap) — classificados = result sem DNFs.
export function awardRace(w, drivers = null) {
  void drivers;
  const classified = w.result.filter((d) => !w.dnfs.includes(d));
  const R = CONFIG.race;
  classified.forEach((d, i) => {
    if (i < R.points.length) d.seasonPoints += R.points[i];
  });

  // Vitória e pódio da ordem final pós-swap
  if (classified[0]) classified[0].seasonWins += 1;
  classified.slice(0, 3).forEach((d) => { d.seasonPodiums += 1; });

  return { wet: w.wet, winner: classified[0]?.name ?? null, pole: w.pole.name, classified };
}

export function summarizeSeason(drivers, teamsById, races, ordersLog) {
  const standings = [...drivers].sort((a, b) => b.seasonPoints - a.seasonPoints || b.seasonWins - a.seasonWins);

  let constructors = null;
  if (teamsById) {
    const pts = new Map();
    for (const d of drivers) pts.set(d.team, (pts.get(d.team) ?? 0) + d.seasonPoints);
    constructors = [...pts.entries()].sort((a, b) => b[1] - a[1]).map(([id, p]) => ({ id, points: p }));
  }

  return { standings, constructors, races, champion: standings[0], ordersLog };
}

// drivers precisam ter teamCar atualizado antes (feito pelo world ou pelo career).
// playerPolicy: 'obey' | 'defy' | null (null = sem jogador, só NPCs)
export function runSeason(drivers, category, rng, teamsById = null, playerPolicy = null, playerMissesOpening = false) {
  resetSeasonStats(drivers);

  const ordersLog = [];   // { race, team, p1, p2, defied }
  const races = [];

  for (let r = 0; r < category.races; r++) {
    const starters = r === 0 && playerMissesOpening ? drivers.filter(d => !d.isPlayer) : drivers;
    const w = startRace(starters, category, rng, teamsById, trackFor(category, r + 1));
    applyTeamOrders(w, drivers, category, teamsById, r + 1, { playerPolicy, ordersLog });
    const a = awardRace(w);
    races.push({ wet: a.wet, winner: a.winner, pole: a.pole });
  }

  return summarizeSeason(drivers, teamsById, races, ordersLog);
}
