// Carreiras do jogador por política: quantos chegam à F1 e quantos ganham título.
// É a medição que calibra a dificuldade do jogador (meta histórica: ~15-20% com título na política "a", ~5% sem treinar).
//
//   node tools/calibrate/player.js --policy a --n 300
//   node tools/calibrate/player.js --policy notrain --n 400 --set talent.mean=84.5
//   node tools/calibrate/player.js --policy train --age 12
//
// Demora: ~12 minutos para 300 carreiras. Rode várias políticas em paralelo (um terminal para cada).

import { parseArgs, applySets, playCareer, getView, POLICIES, pct, se } from './lib.js';

const { flags, sets } = parseArgs(process.argv.slice(2));
const policy = flags.policy ?? 'a';
if (!POLICIES.includes(policy)) throw new Error(`--policy deve ser um de: ${POLICIES.join(', ')}`);
const n = Number(flags.n ?? 300);
const age = flags.age ? Number(flags.age) : null;
const driving = flags.driving ?? 'legacy';
const restore = applySets(sets);

let reached = 0; let withTitle = 0; let titles = 0; let wins = 0; let seasons = 0;
for (let seed = 1; seed <= n; seed++) {
  const s = playCareer({ seed, age, policy, driving });
  const l = getView(s).legacy;
  if (!l) continue;
  reached += 1; titles += l.titlesF1 ?? 0; wins += l.wins ?? 0; seasons += l.seasons ?? 0;
  if ((l.titlesF1 ?? 0) > 0) withTitle += 1;
}
restore();

const r = Math.max(1, reached);
console.log(`política ${policy} | condução ${driving}${sets.length ? ` | ${sets.join(' ')}` : ''} | ${n} carreiras | chegaram ${reached}, com título ${withTitle}`);
console.log(`chegaram à F1 ${pct(reached, n)} | ≥1 título ${pct(withTitle, r)} (±${se(withTitle / r, r).toFixed(1)} pontos) | títulos por carreira ${(titles / r).toFixed(2)} | vitórias ${(wins / r).toFixed(1)} | temporadas ${(seasons / r).toFixed(1)}`);
