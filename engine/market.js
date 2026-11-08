// Mercado de assentos da F1 e nota de scouting das categorias de base.

import { CONFIG } from './config.js';

// Valor de mercado de um piloto para as equipes de F1.
export function marketScore(d) {
  const M = CONFIG.market;
  const growth = Math.max(0, d.potential - d.skill);
  const agePenalty = Math.max(0, d.age - M.agePenaltyStart) * M.agePenaltyPerYear;
  return d.skill * M.skillWeight + growth * M.growthWeight - agePenalty;
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
    pick.contract = rng.int(CONFIG.rookies.contractRange[0], CONFIG.rookies.contractRange[1]);
    seated.push(pick);
  }
  // Quem sobra no mercado: só continua quem ainda tem apelo
  const M = CONFIG.market;
  return market.filter((d) => d.skill >= M.keepMinSkill && d.age <= M.keepMaxAge);
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
