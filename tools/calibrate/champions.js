// Realismo do mundo da F1 por época: quem vence os campeonatos ao longo de 25 anos.
// Mede, por faixa de anos, a habilidade do campeão, a chance de campeão com piloto fraco, títulos de equipes de orçamento
// baixo e dinastias. Metas atuais: habilidade do campeão ~90 em qualquer época; equipes pequenas 6-8% dos títulos;
// 8-13 campeões distintos por era; dinastia máxima < 9.
//
//   node tools/calibrate/champions.js --runs 120
//   node tools/calibrate/champions.js --set regulation.lotteryWeight=0.25 --set category.f1.carWeight=0.6

import { parseArgs, applySets, CONFIG, CATEGORIES, avg, pct } from './lib.js';
import { createRng } from '../../engine/rng.js';
import { createWorld, advanceYear } from '../../engine/world.js';
import { resetRookieCounter } from '../../engine/drivers.js';
import { TEAMS_F1, DRIVERS_F1 } from '../../data/world2026.js';
import { SURNAMES } from '../../data/names.js';

const { flags, sets } = parseArgs(process.argv.slice(2));
const RUNS = Number(flags.runs ?? 120);
const YEARS = Number(flags.years ?? 25);
const SEED = Number(flags.seed ?? 4000);
const restore = applySets(sets);
void CONFIG;

const budgetOf = Object.fromEntries(TEAMS_F1.map((t) => [t.id, t.budget]));
const buckets = [[1, 7], [8, 14], [15, 25]];
const stat = buckets.map(() => ({ n: 0, small: 0, champSk: 0, top1Sk: 0, sub85: 0, top3: 0 }));
const distinct = []; const dyn = [];

for (let r = 0; r < RUNS; r++) {
  resetRookieCounter();
  const rng = createRng(SEED + r);
  const world = createWorld({ teams: TEAMS_F1, drivers: DRIVERS_F1, category: CATEGORIES.f1, names: SURNAMES });
  let run = 0; let best = 0; let prev = null;
  for (let y = 1; y <= YEARS; y++) {
    const result = advanceYear(world, rng);
    const champ = result.champion;
    const h = world.history.at(-1);
    const skills = result.standings.map((d) => d.skill).sort((a, b) => b - a);
    const rank = skills.findIndex((sk) => sk <= champ.skill) + 1;
    const s = stat[buckets.findIndex(([a, z]) => y >= a && y <= z)];
    s.n++;
    if ((budgetOf[h.champion.team] ?? 0) <= 6) s.small++;
    s.champSk += champ.skill; s.top1Sk += skills[0];
    if (champ.skill < 85) s.sub85++;
    if (rank <= 3) s.top3++;
    run = champ.name === prev ? run + 1 : 1; prev = champ.name; best = Math.max(best, run);
  }
  distinct.push(new Set(world.history.map((x) => x.champion.name)).size);
  dyn.push(best);
}
restore();

console.log(`${RUNS} mundos de ${YEARS} anos${sets.length ? ` | ${sets.join(' ')}` : ''}`);
stat.forEach((s, i) => console.log(`  anos ${buckets[i].join('-')}: equipe de orçamento ≤6 ${pct(s.small, s.n)} | habilidade do campeão ${(s.champSk / s.n).toFixed(1)} (melhor do grid ${(s.top1Sk / s.n).toFixed(1)}) | campeão <85 ${pct(s.sub85, s.n)} | campeão no top 3 de habilidade ${pct(s.top3, s.n)}`));
console.log(`campeões distintos por era ${avg(distinct).toFixed(1)} (alvo 8-13) | dinastia média ${avg(dyn).toFixed(1)}, máxima ${Math.max(...dyn)} (alvo < 9)`);
