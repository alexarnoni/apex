// Veteranos no grid: o declínio e a aposentadoria não podem fazer os pilotos mais velhos sumirem (Alonso e Hamilton existem).
// Metas atuais: campeão com 35+ anos ~8% das temporadas (38+ ~1-2%), ~0,6 piloto de 38+ por temporada, veteranos de
// 36+ às vezes no top 5.
//
//   node tools/calibrate/veterans.js --runs 120
//   node tools/calibrate/veterans.js --set lifecycle.veteranGoodYear.chance=0.3 --set market.keepMaxAge=42

import { parseArgs, applySets, CATEGORIES, avg } from './lib.js';
import { createRng } from '../../engine/rng.js';
import { createWorld, advanceYear } from '../../engine/world.js';
import { resetRookieCounter } from '../../engine/drivers.js';
import { TEAMS_F1, DRIVERS_F1 } from '../../data/world2026.js';
import { SURNAMES } from '../../data/names.js';

const { flags, sets } = parseArgs(process.argv.slice(2));
const RUNS = Number(flags.runs ?? 120);
const YEARS = Number(flags.years ?? 25);
const restore = applySets(sets);

let n = 0; let champ35 = 0; let champ38 = 0; let top5Old = 0; let old35Top3 = 0; let old38 = 0; let ageSum = 0;
const distinct = []; const dyn = [];
for (let r = 0; r < RUNS; r++) {
  resetRookieCounter();
  const rng = createRng(5000 + r);
  const world = createWorld({ teams: TEAMS_F1, drivers: DRIVERS_F1, category: CATEGORIES.f1, names: SURNAMES });
  let run = 0; let best = 0; let prev = null;
  for (let y = 1; y <= YEARS; y++) {
    const res = advanceYear(world, rng);
    const c = res.champion;
    n++; ageSum += c.age;
    if (c.age >= 35) champ35++;
    if (c.age >= 38) champ38++;
    top5Old += res.standings.slice(0, 5).filter((d) => d.age >= 36).length;
    old35Top3 += res.standings.slice(0, 3).filter((d) => d.age >= 35).length;
    old38 += res.standings.filter((d) => d.age >= 38).length;
    run = c.name === prev ? run + 1 : 1; prev = c.name; best = Math.max(best, run);
  }
  distinct.push(new Set(world.history.map((x) => x.champion.name)).size);
  dyn.push(best);
}
restore();

const p = (x) => `${(100 * x / n).toFixed(1)}%`;
console.log(`${RUNS} mundos de ${YEARS} anos${sets.length ? ` | ${sets.join(' ')}` : ''}`);
console.log(`idade média do campeão ${(ageSum / n).toFixed(1)} | campeão 35+ ${p(champ35)} | 38+ ${p(champ38)} | veteranos 36+ no top 5 por temporada ${(top5Old / n).toFixed(2)} | 35+ no top 3 ${(old35Top3 / n).toFixed(2)} | pilotos 38+ no grid ${(old38 / n).toFixed(2)}`);
console.log(`campeões distintos por era ${avg(distinct).toFixed(1)} | dinastia média ${avg(dyn).toFixed(1)}, máxima ${Math.max(...dyn)}`);
