// Mercado de assentos da F1 e nota de scouting das categorias de base.

import { CONFIG } from './config.js';
import { attributesOf } from './driver-attributes.js';

// Valor de mercado de um piloto para as equipes de F1.
export function marketScore(d) {
  const M = CONFIG.market;
  const growth = Math.max(0, d.potential - d.skill);
  const agePenalty = Math.max(0, d.age - M.agePenaltyStart) * M.agePenaltyPerYear;
  const a = attributesOf(d);
  const credit = M.profilesEnabled ? Math.min(M.maxExperienceCredit, Math.max(0, (a.consistency + a.tyres + a.feedback) / 3 - CONFIG.driverAttributes.reference) * M.experienceCredit) : 0;
  return d.skill * M.skillWeight + growth * M.growthWeight - Math.max(0, agePenalty - credit);
}

// Preenche assentos vagos: equipes em ordem de força de carro escolhem primeiro.
// seated: pilotos com contrato ativo. market: pool de disponíveis (mutado).
// makeExtra(): fábrica de novato caso o mercado seque.
// Encaixe de um piloto numa vaga: lealdade, equipe irmã e a regra de não juntar duas estrelas em carro mediano.
export function seatFit(d, team, mates, carRank, sisters = {}) {
  const M = CONFIG.market;
  let fit = 0;
  if (d.prevTeam === team.id) fit += M.loyaltyBonus;
  else if (d.prevTeam && sisters[d.prevTeam] === team.id) fit += M.sisterBonus;
  if (d.skill >= M.starSkill && carRank > M.starCarRank && mates.some((m) => m.skill >= M.starSkill)) fit -= M.starClashPenalty;
  if (M.profilesEnabled && Number.isFinite(d.age)) {
    const a = attributesOf(d);
    if (team.budget !== undefined && team.budget >= M.performanceBudget) {
      fit += (a.consistency - d.skill) * M.consistencyFit;
    } else {
      fit += (a.feedback - d.skill) * M.feedbackFit;
      // A equipe com um veterano pode complementar a dupla com margem de crescimento.
      if (mates.some(m => m.age >= M.agePenaltyStart)) fit += Math.max(0, d.potential - d.skill) * M.youthFit;
    }
  }
  return fit;
}

export function fillSeats(teams, seated, market, rng, makeExtra, sisters = {}) {
  const openSeats = [];
  const sorted = [...teams].sort((a, b) => b.car - a.car);
  for (const t of sorted) {
    const have = seated.filter((d) => d.team === t.id).length;
    for (let k = have; k < t.seats; k++) openSeats.push(t);
  }
  for (const t of openSeats) {
    if (market.length === 0) market.push(makeExtra());
    const mates = seated.filter((d) => d.team === t.id);
    const rank = sorted.indexOf(t) + 1;
    const score = (d) => marketScore(d) + seatFit(d, t, mates, rank, sisters);
    market.sort((a, b) => score(b) - score(a));
    const pick = market.shift();
    pick.team = t.id;
    pick.role = 'race'; pick.reserveTeam = null; pick.seasonsWithoutSeat = 0;
    pick.contract = rng.int(CONFIG.rookies.contractRange[0], CONFIG.rookies.contractRange[1]);
    seated.push(pick);
  }
  // Sem assento não significa apagado: o ciclo de vida e aposentadoria ficam no mundo.
  return market;
}

export function makeAvailable(world, driver) {
  const from = driver.team;
  world.drivers = world.drivers.filter(d => d !== driver);
  driver.prevTeam = from ?? driver.prevTeam;
  driver.team = null; driver.contract = 0; driver.role = 'free'; driver.reserveTeam = null;
  driver.seasonsWithoutSeat = 0; driver.status = null; driver.statusClause = null;
  world.market ??= [];
  if (!world.market.includes(driver)) world.market.push(driver);
  return from;
}

// Um reserva por equipe; o vínculo não ocupa assento e permite disputar futuras vagas.
export function assignReserves(world) {
  const M = CONFIG.market;
  const occupied = new Set();
  const candidates = [...world.market].sort((a, b) => (b.skill * M.reserveSkillWeight + attributesOf(b).feedback * M.reserveFeedbackWeight)
    - (a.skill * M.reserveSkillWeight + attributesOf(a).feedback * M.reserveFeedbackWeight));
  for (const d of candidates) {
    const previous = d.reserveTeam;
    const choices = world.teams.filter(t => !occupied.has(t.id));
    const team = d.skill >= M.reserveMinSkill ? choices.sort((a, b) => {
      const score = t => (d.prevTeam === t.id ? M.loyaltyBonus : 0) + seatFit(d, t, [], world.teams.indexOf(t) + 1);
      return score(b) - score(a);
    })[0] : null;
    d.role = team ? 'reserve' : 'free'; d.reserveTeam = team?.id ?? null;
    if (team) occupied.add(team.id);
    if (team && previous !== team.id) (world.lastMoves ??= []).push({ kind: 'reserve', name: d.name, nat: d.nat ?? null, to: team.name });
  }
}

// Nota de scouting em categoria de base -> define o leque de ofertas de subida.
// championshipPos: 1-based. carRank: 1 = melhor carro do grid da categoria.
// Parcelas da nota (para explicar o porquê ao jogador). scoutingScore é a soma delas.
export function scoutingBreakdown({ championshipPos, gridSize, carRank, age, typicalMaxAge, hasAcademy, fame = 0, pressure = 0, exposure = 1 }) {
  const S = CONFIG.scouting;
  const resultTerm = (gridSize - championshipPos + 1) / gridSize * 10; // 10 = campeão
  return {
    result: resultTerm * S.championshipWeight,
    weakCar: Math.max(0, carRank - championshipPos) * S.weakCarBonus * exposure, // bateu carros melhores (vale mais num carro do fundo)
    pressure,                                                                    // cobrança da equipe (perfil): positivo superou, negativo ficou abaixo
    academy: hasAcademy ? S.academyBonus : 0,
    fame,
    age: 0 - Math.max(0, age - typicalMaxAge) * S.agePenaltyPerYearOver, // "0 -" evita -0, que o JSON do save troca por 0
  };
}

export function scoutingScore(args) {
  const p = scoutingBreakdown(args);
  return p.result + p.weakCar + p.pressure + p.academy + p.fame + p.age;
}

// Traduz a nota em tipo de oferta.
export function offerTier(score) {
  const T = CONFIG.scouting.offerThresholds;
  if (score >= T.top) return 'top';   // equipes boas da categoria de cima (+ chance de academia)
  if (score >= T.mid) return 'mid';   // equipe fraca de cima OU renovação onde está
  return 'none';                      // mais um ano onde está (ou rota alternativa)
}
