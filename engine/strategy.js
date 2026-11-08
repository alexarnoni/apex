// Estratégia de pneus da corrida (F1): a decisão que vem depois da classificação.
//
// O resultado da corrida já foi simulado; a estratégia é uma aposta que pode mover o jogador algumas posições.
// A chance de a aposta dar certo depende de quão bem a escolha combina com a pista, o clima e a largada
// (o "encaixe", fit). A opção padrão (a que a simulação automática usa) tem encaixe 0: em média não ganha nem perde nada,
// então a calibração do campeonato não muda. Quem lê a pista e o tempo escolhe melhor do que o acaso.

import { CONFIG } from './config.js';
import { EFFECTS } from './events.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const LABELS = {
  soft:   { label: 'Macios', description: 'Ataque cedo: rendem mais em pista de rua e para quem larga atrás, mas gastam rápido.' },
  medium: { label: 'Médios', description: 'A escolha segura: nem ganha nem perde nada de especial.' },
  hard:   { label: 'Duros', description: 'Aguentam mais voltas: bons em pista técnica e para esticar o primeiro stint.' },
  inters: { label: 'Pneus de chuva', description: 'A pista está molhada: é a escolha que a equipe recomenda.' },
  wait:   { label: 'Esperar a pista secar', description: 'Fica com o que tem e aposta que a chuva passa logo.' },
  slicks: { label: 'Arriscar slicks', description: 'Aposta alta: se a pista secar, você voa; se não, perde muito.' },
};

// Encaixe de cada opção com a situação (tags da pista, posição de largada, clima).
export function strategyFit(id, { tags = [], grid = 10, wet = false }) {
  const S = CONFIG.strategy;
  if (wet) return S.wetFit[id] ?? 0;
  if (id === 'soft') return (tags.includes('rua') ? S.fitMatch : 0) + (grid >= S.backGrid ? S.fitBack : 0);
  if (id === 'hard') return (tags.includes('tecnica') ? S.fitMatch : 0) + (grid >= S.farBackGrid ? S.fitBack : 0);
  return 0;
}

// Opções oferecidas e a escolha padrão (a de encaixe 0 no seco; a de chuva na pista molhada).
export function strategyOptions(ctx) {
  const ids = ctx.wet ? ['inters', 'wait', 'slicks'] : ['soft', 'medium', 'hard'];
  return {
    options: ids.map((id) => ({ id, ...LABELS[id] })),
    safe: ctx.wet ? 'inters' : 'medium',
  };
}

const GOOD = {
  soft: 'Os macios deram o ataque que você queria',
  medium: 'A equipe acertou o tempo da parada',
  hard: 'Os duros aguentaram e você passou rivais no fim do stint',
  inters: 'Você foi dos primeiros a trocar para pneus de chuva',
  wait: 'Esperar compensou: a pista secou na hora certa',
  slicks: 'A aposta ousada nos slicks funcionou',
};
const BAD = {
  soft: 'Os macios acabaram cedo e você perdeu ritmo',
  medium: 'Uma parada lenta custou posições',
  hard: 'Os duros demoraram a esquentar',
  inters: 'A pista secou antes do esperado e os pneus de chuva sofreram',
  wait: 'A chuva apertou e você demorou a trocar',
  slicks: 'Os slicks não seguraram na pista molhada',
};

// --- Final de corrida (versão enxuta) ---------------------------------------------------------------
// O jogador vê o rival logo à frente e decide: atacar (arrisca ±1 posição, a favor de quem tem mais ritmo) ou administrar.

// Vantagem de ritmo do jogador sobre o rival: positiva = jogador mais rápido. Mistura carro e habilidade pelo peso da categoria.
export function paceEdge(player, rival, carWeight) {
  const perf = (d) => carWeight * (d.teamCar ?? 80) + (1 - carWeight) * d.skill;
  return perf(player) - perf(rival);
}

export function finaleFit(edge) {
  const F = CONFIG.strategy.finale;
  return clamp(edge / F.fitScale, -F.maxFit, F.maxFit);
}

export function finaleOptions(rivalName) {
  return {
    options: [
      { id: 'attack', label: 'Atacar', description: `Tentar a ultrapassagem sobre ${rivalName}: se der certo você sobe uma posição; se der errado, perde uma.` },
      { id: 'manage', label: 'Administrar', description: 'Cuidar dos pneus e do carro e levar a posição para casa, sem risco.' },
    ],
    safe: 'manage',
  };
}

export function resolveFinale(w, player, rival, choiceId, carWeight, rng) {
  if (choiceId !== 'attack') return { kind: 'none', shift: 0, label: 'Administrar', text: 'Você administrou o ritmo e levou a posição para casa.' };
  const F = CONFIG.strategy.finale;
  const fit = finaleFit(paceEdge(player, rival, carWeight));
  const pGood = clamp(F.pGood + F.perFit * fit, 0.05, 0.7);
  const pBad = clamp(F.pBad - F.perFit * fit, 0.05, 0.6);
  const r = rng.next();
  let kind = 'none';
  let shift = 0;
  if (r < pGood) { kind = 'good'; shift = 1; } else if (r < pGood + pBad) { kind = 'bad'; shift = -1; }
  if (shift !== 0) EFFECTS.shift({ w, player }, shift);
  const text = kind === 'good' ? `Você atacou e passou ${rival.name}: +1 posição.`
    : kind === 'bad' ? `O ataque sobre ${rival.name} não deu certo e você perdeu uma posição.`
      : `Você atacou, mas ${rival.name} segurou a posição.`;
  return { kind, shift, label: 'Atacar', text };
}

// Resolve a aposta: sorteia bom, ruim ou neutro e move o jogador. Devolve { kind, shift, text, label }.
export function resolveStrategy(w, player, choiceId, ctx, rng) {
  const S = CONFIG.strategy;
  const meta = LABELS[choiceId];
  const fit = strategyFit(choiceId, ctx);
  const pGood = clamp(S.pGood + S.perFit * fit, 0.05, 0.7);
  const pBad = clamp(S.pBad - S.perFit * fit, 0.05, 0.6);
  const big = choiceId === 'slicks' ? S.slicksBigShift : S.bigShift;
  const r = rng.next();
  let kind = 'none';
  let shift = 0;
  if (r < pGood) { kind = 'good'; shift = 1 + (rng.chance(big) ? 1 : 0); }
  else if (r < pGood + pBad) { kind = 'bad'; shift = -(1 + (rng.chance(big) ? 1 : 0)); }
  if (shift !== 0) EFFECTS.shift({ w, player }, shift);
  const n = Math.abs(shift);
  const text = kind === 'good' ? `${GOOD[choiceId]}: +${n} ${n === 1 ? 'posição' : 'posições'}.`
    : kind === 'bad' ? `${BAD[choiceId]}: −${n} ${n === 1 ? 'posição' : 'posições'}.`
      : 'A estratégia correu como previsto.';
  return { kind, shift, text, label: meta.label };
}
