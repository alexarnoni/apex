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
export function fillSeats(teams, seated, market, rng, makeExtra) {
  const openSeats = [];
  const sorted = [...teams].sort((a, b) => b.car - a.car);
  for (const t of sorted) {
    const have = seated.filter((d) => d.team === t.id).length;
    for (let k = have; k < t.seats; k++) openSeats.push(t);
  }
  for (const t of openSeats) {
    if (market.length === 0) market.push(makeExtra());
    market.sort((a, b) => marketScore(b) - marketScore(a));
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
export function scoutingScore({ championshipPos, gridSize, carRank, age, typicalMaxAge, hasAcademy, fame = 0 }) {
  const S = CONFIG.scouting;
  const resultTerm = (gridSize - championshipPos + 1) / gridSize * 10; // 10 = campeão
  const weakCarTerm = Math.max(0, carRank - championshipPos) * S.weakCarBonus; // bateu carros melhores
  const ageTerm = Math.max(0, age - typicalMaxAge) * S.agePenaltyPerYearOver;
  return resultTerm * S.championshipWeight + weakCarTerm + (hasAcademy ? S.academyBonus : 0) + fame - ageTerm;
}

// Traduz a nota em tipo de oferta.
export function offerTier(score) {
  const T = CONFIG.scouting.offerThresholds;
  if (score >= T.top) return 'top';   // equipes boas da categoria de cima (+ chance de academia)
  if (score >= T.mid) return 'mid';   // equipe fraca de cima OU renovação onde está
  return 'none';                      // mais um ano onde está (ou rota alternativa)
}
