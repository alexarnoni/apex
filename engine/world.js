// O mundo vivo da F1: desenvolvimento -> temporada -> virada de ano.
// É o protótipo v3 validado, agora como módulo.
//
// advanceYear roda o ano inteiro de uma vez (simulação em massa). A carreira do jogador usa
// os mesmos passos separados: beginYear -> corridas (season.js) -> endYear.

import { CONFIG } from './config.js';
import { runDevSeason, applyRegulationReset, isRegulationYear, rollInitialConcepts } from './development.js';
import { runSeason, resetSeasonStats } from './season.js';
import { applyAging, retirementProb, makeRookie } from './drivers.js';
import { fillSeats, assignReserves } from './market.js';
import { ensureAttributes, attributesOf } from './driver-attributes.js';
import { assignStatus } from './status.js';
import { SISTER_TEAMS } from '../data/world2026.js';

export function createWorld({ teams, drivers, category, names }) {
  return {
    season: 0,
    category,
    names,
    teams: teams.map((t) => ({ ...t, prize: 5, seats: t.seats ?? 2 })),
    drivers: drivers.map((d) => ensureAttributes({
      ...d,
      id: d.id ?? `real-${d.name}`, role: 'race',
      form: 0,
      generated: false,
      potential: d.potential ?? d.skill + Math.max(0, (26 - d.age) * 1.2),
      stats: { wins: 0, podiums: 0, poles: 0, titles: 0, seasons: 0, points: 0, dnfs: 0 },
    })),
    market: [],
    retired: [],
    history: [],   // um registro por temporada: campeão, construtor, log de dev
  };
}

// Passos 1 e 2 (antes das corridas): regulamento, desenvolvimento, renormalização, status.
// Devolve { teamsById, devLog } para o endYear.
export function beginYear(world, rng) {
  world.season += 1;
  const teamsById = new Map(world.teams.map((t) => [t.id, t]));

  // 1. Regulamento e desenvolvimento
  if (world.season === 1) rollInitialConcepts(world.teams, rng);
  if (isRegulationYear(world.season)) applyRegulationReset(world.teams, rng);
  const devLog = {};
  for (const t of world.teams) {
    t.hasTecDriver = world.drivers.some((d) => d.team === t.id && d.style === 'tec');
    const contributors = [...world.drivers.filter(d => d.team === t.id), ...(world.market ?? []).filter(d => d.reserveTeam === t.id)];
    const best = Math.max(CONFIG.driverAttributes.reference, ...contributors.map(d => attributesOf(d).feedback));
    t.driverFeedbackBonus = CONFIG.driverAttributes.enabled ? Math.min(CONFIG.driverAttributes.maxFeedbackDev, (best - CONFIG.driverAttributes.reference) * CONFIG.driverAttributes.feedbackDevWeight) : 0;
    devLog[t.id] = runDevSeason(t, rng);
  }

  // Renormalização: ancora a média do grid em meanCar, preservando diferenças relativas.
  // Impede que o teto (carMax) comprima o grid — o que nivelava os carros e destruía as dinastias.
  {
    const D = CONFIG.development;
    const mean = world.teams.reduce((s, t) => s + t.car, 0) / world.teams.length;
    const shift = D.meanCar - mean;
    for (const t of world.teams) {
      t.car += shift;
      t.car = Math.max(D.meanCar - D.maxSpread, Math.min(D.meanCar + D.maxSpread, t.car));
    }
  }

  // 2. Temporada
  // Atribuir status p1/p2/equal antes de rodar (usa campeão do ano anterior)
  const prevChampion = world.history.length > 0 ? world.history.at(-1).champion : null;
  assignStatus(world.teams, world.drivers, prevChampion);
  // Marcar campeão reinante para bônus de carryoverPerf
  for (const d of world.drivers) d.isReigning = false;
  if (prevChampion) {
    const reigning = world.drivers.find((d) => d.name === prevChampion.name);
    if (reigning) reigning.isReigning = true;
  }

  for (const d of world.drivers) d.stats.seasons += 1;
  return { teamsById, devLog };
}

// Passos 2 (pós-corridas) e 3-4: estatísticas, histórico, envelhecimento, aposentadoria,
// contratos, mercado. O jogador (isPlayer) envelhece e perde 1 ano de contrato, mas nunca
// aposenta nem vai ao mercado sozinho: essas decisões são do jogador (engine/game.js).
export function endYear(world, rng, result, teamsById, devLog) {
  result.champion.stats.titles += 1;
  // Atualiza títulos consecutivos: campeão incrementa, todos os outros zeram
  for (const d of world.drivers) {
    if (d.name === result.champion.name) {
      d.consecutiveTitles = (d.consecutiveTitles ?? 0) + 1;
    } else {
      d.consecutiveTitles = 0;
    }
  }
  for (const d of world.drivers) {
    d.stats.wins += d.seasonWins;
    d.stats.podiums += d.seasonPodiums;
    d.stats.poles += d.seasonPoles;
    d.stats.points += d.seasonPoints;
    d.stats.dnfs += d.seasonDnfs;
  }
  result.constructors.forEach((c, i) => { teamsById.get(c.id).prize = 10 - i; });

  world.history.push({
    season: world.season,
    champion: { name: result.champion.name, age: result.champion.age, team: result.champion.team, generated: result.champion.generated },
    constructor: result.constructors[0].id,
    regulation: isRegulationYear(world.season),
    devLog,
  });

  // 3. Virada de ano: envelhecer, aposentar, contratos, mercado
  // Classificação final do mundial para retenção de elite
  const finalStandings = result.standings;
  const topDriverNames = new Set(finalStandings.slice(0, CONFIG.retention.standingsCutoff).map((d) => d.name));

  // Posição do carro de cada equipe (1 = melhor): quem está num carro bom renova mais.
  const carOrder = [...world.teams].sort((a, b) => b.car - a.car).map((t) => t.id);
  const M = CONFIG.market;
  const staying = [];
  const retiredNow = [];
  const prevTeamOf = new Map();
  const availableBefore = [...(world.market ?? [])];
  const aliveMarket = [];
  for (const d of availableBefore) {
    applyAging(d, rng);
    d.seasonsWithoutSeat = (d.seasonsWithoutSeat ?? 0) + 1;
    if (rng.chance(retirementProb(d))) {
      d.role = 'retired'; d.reserveTeam = null; d.team = null;
      world.retired.push(d); retiredNow.push(d);
    } else aliveMarket.push(d);
  }
  world.market = aliveMarket;
  for (const d of world.drivers) {
    prevTeamOf.set(d, d.team);
    applyAging(d, rng);
    d.contract -= 1;
    if (d.isPlayer) { staying.push(d); continue; }
    if (rng.chance(retirementProb(d))) { d.prevTeam = d.team; d.team = null; d.role = 'retired'; d.reserveTeam = null; world.retired.push(d); retiredNow.push(d); continue; }
    if (d.contract > 0) { staying.push(d); continue; }
    // Contrato vencido: o top 3 do mundial renova quase sempre; os demais renovam conforme a força do carro
    // (melhor carro 75%, pior 40%, mais 10 pontos para a elite).
    const rankPct = carOrder.length > 1 ? carOrder.indexOf(d.team) / (carOrder.length - 1) : 0;
    const reSign = M.reSignBest - (M.reSignBest - M.reSignWorst) * rankPct + (d.skill >= M.starSkill - 4 ? M.reSignEliteBonus : 0);
    const keeps = (topDriverNames.has(d.name) && rng.chance(CONFIG.retention.prob)) || rng.chance(reSign);
    if (keeps) {
      d.contract = rng.int(CONFIG.rookies.contractRange[0], CONFIG.rookies.contractRange[1]);
      staying.push(d);
      continue;
    }
    d.prevTeam = d.team;
    d.team = null;
    d.role = 'free'; d.reserveTeam = null; d.status = null; d.statusClause = null; d.seasonsWithoutSeat = 0;
    world.market.push(d);
  }
  for (let i = 0; i < CONFIG.rookies.perSeason; i++) {
    world.market.push(makeRookie(world.names, rng, rng.pick(['campeão da F2', 'destaque da F2', 'veio da IndyCar', 'veio da Super Fórmula'])));
  }
  world.market = fillSeats(world.teams, staying, world.market, rng, () => makeRookie(world.names, rng, 'F2'), SISTER_TEAMS);
  world.drivers = staying;
  world.lastMoves = marketMoves(world, prevTeamOf, retiredNow);
  for (const d of world.market) if (prevTeamOf.has(d)) world.lastMoves.push({ kind: 'available', name: d.name, nat: d.nat ?? null, from: world.teams.find(t => t.id === d.prevTeam)?.name ?? null });
  assignReserves(world);

  // 4. Atribuir status para o próximo ano (após mercado, com grid final)
  assignStatus(world.teams, world.drivers, result.champion);
}

// Resumo do mercado do ano para a UI: quem trocou de equipe, quem estreou e quem se aposentou, do mais forte ao mais fraco.
function marketMoves(world, prevTeamOf, retiredNow) {
  const teamName = (id) => world.teams.find((t) => t.id === id)?.name ?? null;
  const moves = [];
  for (const d of world.drivers) {
    if (d.isPlayer) continue;
    const from = prevTeamOf.get(d);
    if (from === undefined) {
      moves.push({ kind: !d.generated || d.stats.seasons > 0 ? 'return' : 'rookie', name: d.name, nat: d.nat ?? null, to: teamName(d.team), origin: d.origin ?? null, skill: d.skill });
    } else if (from !== d.team) {
      moves.push({ kind: 'transfer', name: d.name, nat: d.nat ?? null, from: teamName(from), to: teamName(d.team), skill: d.skill });
    }
  }
  for (const d of retiredNow) moves.push({ kind: 'retire', name: d.name, nat: d.nat ?? null, from: teamName(d.prevTeam), age: d.age, skill: d.skill });
  return moves.sort((a, b) => b.skill - a.skill).map(({ skill, ...m }) => m);
}

export function advanceYear(world, rng) {
  const { teamsById, devLog } = beginYear(world, rng);
  const result = runSeason(world.drivers, world.category, rng, teamsById);
  endYear(world, rng, result, teamsById, devLog);
  return result;
}

export { resetSeasonStats };
