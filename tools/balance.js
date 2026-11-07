// Ferramenta de balanceamento: roda simulações em massa e imprime as
// distribuições que definimos como critérios de "mundo crível".
// Uso: npm run balance  (ou: node tools/balance.js [seed])

import { createRng } from '../engine/rng.js';
import { createWorld, advanceYear } from '../engine/world.js';
import { runBaseSeasonSummary, createPlayer } from '../engine/career.js';
import { resetRookieCounter } from '../engine/drivers.js';
import { TEAMS_F1, DRIVERS_F1 } from '../data/world2026.js';
import { CATEGORIES } from '../data/categories.js';
import { SURNAMES } from '../data/names.js';
import { CONFIG } from '../engine/config.js';

const seedArg = Number(process.argv[2]) || 42;
const seedsToTest = process.argv[2] ? [seedArg] : [42, 137, 999];

function pct(n, d) { return Math.round((n / d) * 100) + '%'; }
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;

// ---------- 1. Mundo: 200 rodadas de 25 temporadas (3 seeds) ----------
for (const seedBase of seedsToTest) {
console.log('=== MUNDO F1: 200 x 25 temporadas (seed base ' + seedBase + ') ===\n');
const distinctChamps = [];
const maxTitleRun = [];
const champAges = [];
const genChampShare = [];
let veteranAnomaly = 0;
let champInBestCarCount = 0;
let champTeamChangeCount = 0;
let totalSeasons = 0;
const carMeans = [];
const carStdDevs = [];
const distinctPerEra = [];
let p2Steals = 0;
let dominantTeamTitles = 0;
let totalOrders = 0;
let p1PointsSum = 0;   // kill-switch: delta de pontos p1 vs p2 da equipe dominante
let p2PointsSum = 0;
let dominantPairCount = 0;
const distinctConstructorsPerEra = [];  // construtores distintos por era
let bestCarStableCount = 0;             // temporadas em que o construtor é o mesmo da era

// A/B kill-switch: mesmos seeds com ordens desligadas
let p1PointsSumOff = 0;
let p2PointsSumOff = 0;
let dominantPairCountOff = 0;

for (let run = 0; run < 200; run++) {
  resetRookieCounter();
  const rng = createRng(seedBase + run);
  const world = createWorld({ teams: TEAMS_F1, drivers: DRIVERS_F1, category: CATEGORIES.f1, names: SURNAMES });
  for (let s = 0; s < 25; s++) {
    const result = advanceYear(world, rng);
    totalOrders += result.ordersLog ? result.ordersLog.length : 0;
  }

  const champs = world.history.map((h) => h.champion);
  distinctChamps.push(new Set(champs.map((c) => c.name)).size);
  champs.forEach((c) => { champAges.push(c.age); if (c.age >= 38) veteranAnomaly++; });
  genChampShare.push(champs.filter((c) => c.generated).length / champs.length);

  for (let i = 0; i < champs.length; i++) {
    totalSeasons++;
    const h = world.history[i];
    if (h.champion.team === h.constructor) champInBestCarCount++;
    if (i > 0 && champs[i - 1].name === champs[i].name && champs[i - 1].team !== champs[i].team) {
      champTeamChangeCount++;
    }
  }

  // Instrumentação: campeões distintos por era, roubo p2, construtores por era
  const N = CONFIG.regulation.everyNSeasons;
  for (let era = 0; era * N < champs.length; era++) {
    const slice = champs.slice(era * N, (era + 1) * N);
    const histSlice = world.history.slice(era * N, (era + 1) * N);
    if (slice.length < 2) continue;
    const eraDistinct = new Set(slice.map((c) => c.name)).size;
    distinctPerEra.push(eraDistinct);

    // Construtor dominante da era
    const constrTitles = new Map();
    histSlice.forEach((h) => constrTitles.set(h.constructor, (constrTitles.get(h.constructor) ?? 0) + 1));
    const sortedConstr = [...constrTitles.entries()].sort((a, b) => b[1] - a[1]);
    distinctConstructorsPerEra.push(constrTitles.size);
    const dominantConstr = sortedConstr[0][0];
    // % temporadas em que o melhor carro é da equipe modal da era
    histSlice.forEach((h) => { if (h.constructor === dominantConstr) bestCarStableCount++; });

    // Equipe dominante da era = equipe com mais títulos
    const teamTitles = new Map();
    slice.forEach((c) => teamTitles.set(c.team, (teamTitles.get(c.team) ?? 0) + 1));
    const dominantTeam = [...teamTitles.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const dominantTitles = slice.filter((c) => c.team === dominantTeam);
    const dominantChamp = dominantTitles.length > 0
      ? [...new Map(dominantTitles.map((c) => [c.name, (dominantTitles.filter((x) => x.name === c.name).length)])).entries()]
          .sort((a, b) => b[1] - a[1])[0][0]
      : null;
    const stolenByP2 = dominantTitles.filter((c) => c.name !== dominantChamp).length;
    p2Steals += stolenByP2;
    dominantTeamTitles += dominantTitles.length;
  }

  const finalCars = world.teams.map((t) => t.car);
  const carMean = finalCars.reduce((s, v) => s + v, 0) / finalCars.length;
  const carStd = Math.sqrt(finalCars.reduce((s, v) => s + (v - carMean) ** 2, 0) / finalCars.length);
  carMeans.push(carMean);
  carStdDevs.push(carStd);

  let best = 0, cur = 0, last = null;
  for (const c of champs) {
    cur = c.name === last ? cur + 1 : 1;
    last = c.name;
    if (cur > best) best = cur;
  }
  maxTitleRun.push(best);
}

// A/B kill-switch: 50 runs com ordens OFF, medir delta p1 vs p2 da equipe dominante
const CAT_NO_ORDERS = { ...CATEGORIES.f1, ordersEnabled: false };
const CAT_WITH_ORDERS = { ...CATEGORIES.f1, ordersEnabled: true };
for (let mode = 0; mode < 2; mode++) {
  const cat = mode === 0 ? CAT_WITH_ORDERS : CAT_NO_ORDERS;
  let p1Sum = 0, p2Sum = 0, pairs = 0;
  for (let run = 0; run < 50; run++) {
    resetRookieCounter();
    const rng = createRng(seedBase + run);
    const world = createWorld({ teams: TEAMS_F1, drivers: DRIVERS_F1, category: cat, names: SURNAMES });
    for (let s = 0; s < 10; s++) advanceYear(world, rng);
    // Pega pontos do p1 e p2 da equipe com mais títulos
    const champs = world.history.map((h) => h.champion);
    const teamTitles = new Map();
    champs.forEach((c) => teamTitles.set(c.team, (teamTitles.get(c.team) ?? 0) + 1));
    const domTeam = [...teamTitles.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!domTeam) continue;
    const pair = world.drivers.filter((d) => d.team === domTeam && d.status);
    const dp1 = pair.find((d) => d.status === 'p1');
    const dp2 = pair.find((d) => d.status === 'p2');
    if (!dp1 || !dp2) continue;
    p1Sum += dp1.stats.points; p2Sum += dp2.stats.points; pairs++;
  }
  if (mode === 0) { p1PointsSum = p1Sum; p2PointsSum = p2Sum; dominantPairCount = pairs; }
  else { p1PointsSumOff = p1Sum; p2PointsSumOff = p2Sum; dominantPairCountOff = pairs; }
}

console.log('Campeões distintos por era de 25 anos: média ' + avg(distinctChamps).toFixed(1) + ' (alvo: 8-13, F1 real: 8-14)');
console.log('Maior dinastia (títulos seguidos): média ' + avg(maxTitleRun).toFixed(1) + ', máx ' + Math.max(...maxTitleRun) + ' (alvo: média 3-5, máx < 9)');
console.log('Idade média do campeão: ' + avg(champAges).toFixed(1) + ' (alvo: 26-30)');
console.log('Campeões com 38+ anos: ' + pct(veteranAnomaly, champAges.length) + ' das temporadas (alvo: < 5%)');
console.log('Temporadas vencidas por pilotos gerados: ' + pct(avg(genChampShare) * 200 * 25, 200 * 25) + ' (deve crescer ao longo da era)');
console.log('--- Instrumentação retenção ---');
console.log('Campeão na melhor equipe (construtor): ' + pct(champInBestCarCount, totalSeasons));
console.log('Trocas de equipe do campeão reinante: ' + champTeamChangeCount + ' casos em ' + totalSeasons + ' temporadas');
console.log('--- Spread de carros (fim de era, média de 200 runs) ---');
console.log('Média do carro do grid: ' + avg(carMeans).toFixed(1) + ' (alvo: ~80)');
console.log('Desvio padrão dos carros: ' + avg(carStdDevs).toFixed(1) + ' (alvo: 4-9 em regime)');
console.log('--- Por era ---');
console.log('Campeões distintos por era: média ' + avg(distinctPerEra).toFixed(1) + ' (alvo: ~1.3-1.5 pós-fix)');
console.log('Títulos roubados pelo p2 da equipe dominante: ' + pct(p2Steals, dominantTeamTitles) + ' (alvo: < 30%, > 0% — ajustado de 25% após consecutiveTitles: p2 herda quando dominante aposenta é fenômeno real, cf. Rosberg 2016)');
console.log('Ordens de equipe executadas: média ' + (totalOrders / 200).toFixed(1) + '/temporada (esperado: 4-10 na equipe dominante)');
console.log('--- Estabilidade de construtor por era ---');
console.log('Construtores distintos por era: média ' + avg(distinctConstructorsPerEra).toFixed(1) + ' (alvo: ~1.5-2)');
console.log('Temporadas vencidas pelo construtor modal da era: ' + pct(bestCarStableCount, distinctPerEra.length * CONFIG.regulation.everyNSeasons) + ' (alvo: > 60%)');
console.log('--- A/B kill-switch ordens (50 runs, 10 temporadas) ---');
const p1AvgOn  = dominantPairCount  > 0 ? (p1PointsSum  / dominantPairCount).toFixed(0)  : '?';
const p2AvgOn  = dominantPairCount  > 0 ? (p2PointsSum  / dominantPairCount).toFixed(0)  : '?';
const p1AvgOff = dominantPairCountOff > 0 ? (p1PointsSumOff / dominantPairCountOff).toFixed(0) : '?';
const p2AvgOff = dominantPairCountOff > 0 ? (p2PointsSumOff / dominantPairCountOff).toFixed(0) : '?';
console.log('Ordens ON  — p1: ' + p1AvgOn  + ' pts, p2: ' + p2AvgOn  + ' pts, delta: ' + (p1PointsSum/Math.max(1,dominantPairCount) - p2PointsSum/Math.max(1,dominantPairCount)).toFixed(0));
console.log('Ordens OFF — p1: ' + p1AvgOff + ' pts, p2: ' + p2AvgOff + ' pts, delta: ' + (p1PointsSumOff/Math.max(1,dominantPairCountOff) - p2PointsSumOff/Math.max(1,dominantPairCountOff)).toFixed(0));
console.log('');
} // fim loop seeds

// ---------- 2. Base: 1000 carreiras de kart ----------
console.log('=== BASE: 1000 temporadas de karting (jogador OVR inicial ~50) ===\n');
const tiers = { top: 0, mid: 0, none: 0 };
const positions = [];
for (let i = 0; i < 1000; i++) {
  resetRookieCounter();
  const rng = createRng(seedArg + 10000 + i);
  const player = createPlayer({ surname: 'Jogador', number: 10, style: 'con', rng });
  const r = runBaseSeasonSummary({ player, category: CATEGORIES.kart, rng, names: SURNAMES, playerCarTier: 'mid' });
  tiers[r.offer]++;
  positions.push(r.position);
}
console.log('Posição média no campeonato de kart: ' + avg(positions).toFixed(1) + ' de 20');
console.log('Ofertas boas de F4 (tier top): ' + pct(tiers.top, 1000));
console.log('Ofertas fracas / renovação (mid): ' + pct(tiers.mid, 1000));
console.log('Sem oferta (repete o ano): ' + pct(tiers.none, 1000));
console.log('\n(Leitura: o jogador médio no 1º ano de kart deve ficar no meio da tabela');
console.log(' e precisar de 1-2 temporadas para subir. Título de cara deve ser possível, não comum.)');
