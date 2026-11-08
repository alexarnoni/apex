// Carreiras por idade inicial (12 a 16): quantos chegam à F1, com que idade entram em cada categoria e se a idade mínima
// por categoria é respeitada (violações devem ser 0).
//
//   node tools/calibrate/start-age.js --n 150
//   node tools/calibrate/start-age.js --n 150 --policy notrain

import { parseArgs, applySets, playCareer, getView, CONFIG, avg } from './lib.js';

const { flags, sets } = parseArgs(process.argv.slice(2));
const N = Number(flags.n ?? 150);
const policy = flags.policy ?? 'a';
const restore = applySets(sets);
const min = CONFIG.base.minAge;

for (const age of [12, 13, 14, 15, 16]) {
  let reached = 0; let titles = 0; let violations = 0;
  const entry = { f4: [], f3: [], f2: [], f1: [] };
  for (let seed = 1; seed <= N; seed++) {
    const seen = {};
    const s = playCareer({
      seed, age, policy,
      onState: (st) => {
        const cat = st.f1 ? 'f1' : st.baseCareer?.category;
        if (cat && !(cat in seen)) seen[cat] = st.player.age;
      },
    });
    const l = getView(s).legacy;
    if (l) { reached += 1; titles += l.titlesF1 ?? 0; }
    for (const [id, a] of Object.entries(seen)) {
      if (entry[id]) entry[id].push(a);
      if (min[id] && a < min[id]) violations += 1;
    }
  }
  const f = (a) => (a.length ? avg(a).toFixed(1) : '-');
  console.log(`idade inicial ${age}: chegam à F1 ${(100 * reached / N).toFixed(0)}% | entrada F4 ${f(entry.f4)} F3 ${f(entry.f3)} F2 ${f(entry.f2)} F1 ${f(entry.f1)} | violações de idade mínima ${violations} | títulos por carreira ${(titles / Math.max(1, reached)).toFixed(2)}`);
}
restore();
