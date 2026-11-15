import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads';
import { createCareer, applyDecision } from '../../engine/game.js';
import { applySets, CONFIG, parseArgs, playCareer } from './lib.js';

const parameter = 'base.choices.kart.A.carBonus';
const startingPositionGain = 0.5;
const maxTitleDelta = 4;
const maxEntryDelta = 3;
const titleRange = [15, 20];

function screen(n, bonus, option) {
  const restore = applySets([`${parameter}=${bonus}`]);
  try {
    let total = 0;
    for (let seed = 1; seed <= n; seed++) {
      const state = createCareer({ surname: 'Teste', number: 7, flag: 'BR', style: 'con', seed });
      total += applyDecision(state, { option }).baseCareer.seasons[0].position;
    }
    return total / n;
  } finally {
    restore();
  }
}

function measure({ n, bonus, policy }) {
  const restore = applySets([`${parameter}=${bonus}`]);
  try {
    let reached = 0;
    let titled = 0;
    for (let seed = 1; seed <= n; seed++) {
      const end = playCareer({ seed, policy });
      if (!end.legacy) continue;
      reached++;
      if (end.legacy.titlesF1 > 0) titled++;
    }
    return { entryRate: 100 * reached / n, titleRate: reached ? 100 * titled / reached : 0, reached, titled };
  } finally {
    restore();
  }
}

function run(sample) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL(import.meta.url), { workerData: sample });
    worker.once('message', result => {
      console.log(`${sample.policy} / chassi ${sample.bonus}: ${result.reached}/${sample.n} na F1, ${result.titled}/${result.reached} com título (${result.titleRate.toFixed(2)}%)`);
      resolve(result);
    });
    worker.once('error', reject);
    worker.once('exit', code => { if (code !== 0) reject(new Error(`Simulação encerrada com código ${code}`)); });
  });
}

async function main() {
  const { flags } = parseArgs(process.argv.slice(2));
  const n = Number(flags.n ?? 300);
  if (!Number.isInteger(n) || n < 300) throw new Error('Use pelo menos 300 seeds por política.');
  const base = CONFIG.base.choices.kart.A.carBonus;
  const coach = screen(n, base, 'B');
  console.log(`Temporada de estreia (${n} seeds), posição média com treinador: ${coach.toFixed(2)}`);
  const candidates = [base, base + 1, base + 2, base + 3].map(bonus => ({ bonus, position: screen(n, bonus, 'A') }));
  for (const { bonus, position } of candidates) console.log(`Chassi ${bonus}: posição média ${position.toFixed(2)}`);
  if (flags.screen === 'true') return;

  const eligible = candidates.filter(item => coach - item.position >= startingPositionGain);
  if (!eligible.length) {
    console.log('Faixa testada sem vantagem imediata suficiente. Considere testar visibilidade para olheiros.');
    return;
  }
  const first = eligible.shift();
  const baseline = run({ n, bonus: base, policy: 'a' });
  const [reference, , firstResult] = await Promise.all([
    baseline, run({ n, bonus: base, policy: 'kart_coach' }),
    first.bonus === base ? baseline : run({ n, bonus: first.bonus, policy: 'a' }),
  ]);
  for (const candidate of [first, ...eligible]) {
    const result = candidate === first ? firstResult : await run({ n, bonus: candidate.bonus, policy: 'a' });
    const withinTitles = result.titleRate >= titleRange[0] && result.titleRate <= titleRange[1]
      && Math.abs(result.titleRate - reference.titleRate) <= maxTitleDelta;
    if (withinTitles && Math.abs(result.entryRate - reference.entryRate) <= maxEntryDelta) {
      console.log(`Proposta para revisão: ${parameter}=${candidate.bonus} (posição média ${candidate.position.toFixed(2)}).`);
      return;
    }
  }
  console.log('Nenhum bônus passou nos limites de carreira. Considere testar visibilidade para olheiros.');
}

if (isMainThread) await main();
else parentPort.postMessage(measure(workerData));
