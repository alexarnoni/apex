// Carreira do jogador na base (karting -> F4 -> F3 -> F2), em modo resumido:
// uma temporada = grid de NPCs + resultado + nota de scouting + leque de ofertas.
// A F1 do jogador roda dentro do world.js (o jogador vira um driver do mundo).

import { CONFIG } from './config.js';
import { runSeason } from './season.js';
import { scoutingScore, scoutingBreakdown, offerTier } from './market.js';
import { makeRookie } from './drivers.js';
import { ensureAttributes } from './driver-attributes.js';
import { tierOf, scoutPressure } from './profile.js';
import { BASE_TEAMS } from '../data/baseTeams.js';

// Gera o grid NPC de uma categoria de base, incluindo os rivais persistentes.
export function makeBaseGrid(category, rng, names, persistentRivals = []) {
  const grid = [...persistentRivals];
  while (grid.length < category.gridSize - 1) {
    const npc = makeRookie(names, rng, category.id);
    npc.age = rng.int(category.typicalAge[0], category.typicalAge[1]);
    npc.skill = rng.range(category.npcSkill[0], category.npcSkill[1]);
    grid.push(npc);
  }
  return grid;
}

// Equipes de uma categoria com o carro da temporada (força fixa da equipe + pequena oscilação).
export function seasonTeams(category, rng) {
  const J = CONFIG.base.teamCarJitter;
  return BASE_TEAMS[category.id].map((t) => ({
    ...t,
    car: 80 + category.carSpread * t.strength + rng.range(-J, J),
  }));
}

// Equipes ordenadas da melhor para a pior (pela força fixa, sem sorteio).
export function teamsByStrength(categoryId) {
  return [...BASE_TEAMS[categoryId]].sort((a, b) => b.strength - a.strength);
}

// Sorteia uma equipe de um tier: 'good' = entre as melhores, 'mid' = do meio, 'bad' = entre as piores.
export function pickTeamByTier(categoryId, tier, rng) {
  const sorted = teamsByStrength(categoryId);
  const n = CONFIG.base.tierPoolSize;
  if (tier === 'good') return rng.pick(sorted.slice(0, n));
  if (tier === 'bad') return rng.pick(sorted.slice(-n));
  const mid = Math.floor(sorted.length / 2);
  return rng.pick(sorted.slice(mid - 1, mid + 2));
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Distribui os pilotos pelas equipes (2 carros cada; o jogador ocupa 1 vaga da equipe dele).
// Devolve { carRank (1 = melhor carro), team, teams }.
export function assignBaseTeams(drivers, player, category, rng, playerTeamId) {
  const teams = seasonTeams(category, rng);
  const mine = teams.find((t) => t.id === playerTeamId) ?? teams[Math.floor(teams.length / 2)];
  const seats = teams.flatMap((t) => [t, t]);
  seats.splice(seats.indexOf(mine), 1); // vaga do jogador
  shuffle(drivers.filter((d) => d !== player), rng).forEach((d, i) => {
    d.team = seats[i].id;
    d.teamCar = seats[i].car;
  });
  player.team = mine.id;
  player.teamCar = mine.car;
  const carRank = 1 + teams.filter((t) => t.car > mine.car).length;
  return { carRank, team: mine, teams };
}

// Roda uma temporada de base resumida e devolve tudo que a UI precisa mostrar.
// Modificadores de pré-temporada (decisão base_choice): carBonus e perfBonus valem só neste ano;
// scoutingBonus soma na nota.
// A equipe do jogador vem de playerTeamId; sem ele, sorteia uma do tier playerCarTier ('mid' por padrão).
export function runBaseSeasonSummary({ player, category, rng, names, persistentRivals = [], playerTeamId = null, playerCarTier = 'mid', hasAcademy = false, carBonus = 0, perfBonus = 0, scoutingBonus = 0, playerMissesOpening = false }) {
  const grid = makeBaseGrid(category, rng, names, persistentRivals);
  const drivers = [player, ...grid];
  const teamId = playerTeamId ?? pickTeamByTier(category.id, playerCarTier, rng).id;
  const { carRank, team, teams } = assignBaseTeams(drivers, player, category, rng, teamId);
  player.teamCar += carBonus;
  player.perfBonus = perfBonus;

  const result = runSeason(drivers, category, rng, null, null, playerMissesOpening);
  player.perfBonus = 0;
  const pos = result.standings.indexOf(player) + 1;

  // Perfil da equipe: a cobrança (pressão) mexe na nota e o carro fraco dá mais visibilidade a quem se destaca.
  const tier = tierOf(carRank, teams.length);
  const scoutingArgs = {
    championshipPos: pos,
    gridSize: drivers.length,
    carRank,
    age: player.age,
    typicalMaxAge: category.typicalAge[1],
    hasAcademy,
    fame: (player.fame ?? 0) + scoutingBonus,
    pressure: scoutPressure(tier, carRank, pos),
    exposure: CONFIG.teamProfile[tier].exposure,
  };
  const score = scoutingScore(scoutingArgs);

  // Companheiro de equipe no ano (2 vagas por equipe): só leitura do resultado, sem sorteio.
  const mateDriver = drivers.find((d) => d !== player && d.team === player.team);
  const mate = mateDriver ? { name: mateDriver.name, position: result.standings.indexOf(mateDriver) + 1, points: mateDriver.seasonPoints } : null;

  return {
    position: pos,
    mate,
    points: player.seasonPoints,
    wins: player.seasonWins,
    podiums: player.seasonPodiums,
    champion: result.champion === player ? null : result.champion.name,
    rivalResults: persistentRivals.map((r) => ({ name: r.name, position: result.standings.indexOf(r) + 1 })),
    teamId: team.id,
    teamName: team.name,
    scouting: score,
    scoutingParts: scoutingBreakdown(scoutingArgs),
    tier,
    offer: offerTier(score),
    carRank,
  };
}

// age: idade inicial escolhida (CONFIG.base.startAge); sem ela, sorteia entre 14 e 16 como antes.
// Dos 14 aos 16 a fórmula é a calibrada (mais novo = habilidade e teto maiores). Abaixo de 14 a habilidade
// cai (criança ainda não está pronta) e o teto é limitado a 100, senão quem começa aos 12 chegaria à F1 esmagando o grid.
// Talento de berço: curva em sino (média e desvio em CONFIG.talent), com um pequeno bônus por começar cedo.
export function rollPotential(age, rng) {
  const T = CONFIG.talent;
  const raw = T.mean + T.sd * rng.gauss() + Math.max(0, 16 - age) * T.youthPerYear;
  return Math.round(Math.max(T.min, Math.min(T.max, raw)) * 10) / 10;
}

export function createPlayer({ surname, number, style, rng, age: chosenAge = null }) {
  const age = chosenAge ?? rng.int(14, 16);
  const S = CONFIG.base.startAge;
  const young = Math.max(0, S.calibratedFrom - age);
  const skill = 50 + (16 - Math.max(age, S.calibratedFrom)) * 1.5 - young * S.skillLossPerYearUnder;
  return ensureAttributes({
    id: 'player',
    name: surname,
    number,
    style,
    age,
    skill,
    potential: rollPotential(age, rng),
    team: null,
    contract: 0,
    fame: 0,
    form: 0,
    isPlayer: true,
    stats: { wins: 0, podiums: 0, poles: 0, titles: 0, seasons: 0, points: 0, dnfs: 0 },
  });
}
