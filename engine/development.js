// Desenvolvimento de carro (F1): apostar em pacotes que podem dar errado,
// e viradas de regulamento que embaralham parcialmente o grid.

import { CONFIG } from './config.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Roda as janelas de desenvolvimento de uma equipe em uma temporada.
// team: { car, budget, prize, hasTecDriver }
// Retorna o log das janelas (para narrativa: "pacote da Ferrari não funcionou").
export function runDevSeason(team, rng) {
  const D = CONFIG.development;
  const devPoints = team.budget * D.budgetWeight + (team.prize ?? 5) * D.prizeWeight;
  const mag = D.magBase + devPoints / D.magDivisor;
  let pSuccess = D.pSuccess + (team.concept ?? 0) + (team.devBonus ?? 0) + (team.hasTecDriver ? (CONFIG.styles.tec.devAssist ?? 0) : 0);

  const log = [];
  let skipNext = false;
  for (let w = 0; w < D.windowsPerSeason; w++) {
    if (skipNext) { skipNext = false; log.push({ window: w, outcome: 'fixing' }); continue; }
    const r = rng.next();
    if (r < pSuccess) {
      const gain = rng.range(D.gainRange[0], D.gainRange[1]) * mag;
      team.car += gain;
      log.push({ window: w, outcome: 'success', delta: gain });
    } else if (r >= 1 - D.pFail) {
      const loss = rng.range(D.lossRange[0], D.lossRange[1]) * mag;
      team.car -= loss;
      skipNext = true; // temporada seguinte da janela é gasta corrigindo o conceito
      log.push({ window: w, outcome: 'fail', delta: -loss });
    } else {
      log.push({ window: w, outcome: 'neutral', delta: 0 });
    }
  }

  // Convergência do pelotão (todo mundo copia solução de todo mundo)
  team.car += (D.meanCar - team.car) * D.regressionToMean;
  team.car = clamp(team.car, D.carMin, D.carMax);
  return log;
}

// Virada de regulamento: herança parcial + orçamento + loteria.
export function applyRegulationReset(teams, rng) {
  const R = CONFIG.regulation;
  for (const t of teams) {
    const budgetTerm = R.floor + t.budget * 3.4;
    const lottery = R.floor + rng.next() * R.range;
    t.car = R.carryWeight * t.car + R.budgetWeight * budgetTerm + R.lotteryWeight * lottery;
    t.concept = rng.range(-R.conceptRange, R.conceptRange);
  }
}

// Sorteia os conceitos da era inicial (chamado uma vez na criação do mundo).
export function rollInitialConcepts(teams, rng) {
  const R = CONFIG.regulation;
  for (const t of teams) t.concept = rng.range(-R.conceptRange, R.conceptRange);
}

export function isRegulationYear(season) {
  const n = CONFIG.regulation.everyNSeasons;
  return season > 1 && (season - 1) % n === 0;
}
