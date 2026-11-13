// Estratégia de pneus da corrida (F1): a decisão que vem depois da classificação.
//
// O resultado da corrida já foi simulado; a estratégia é uma aposta que pode mover o jogador algumas posições.
// A chance de a aposta dar certo depende de quão bem a escolha combina com a pista, o clima e a largada
// (o "encaixe", fit). A opção padrão (a que a simulação automática usa) tem encaixe 0: em média não ganha nem perde nada,
// então a calibração do campeonato não muda. Quem lê a pista e o tempo escolhe melhor do que o acaso.

import { CONFIG } from './config.js';
import { EFFECTS } from './events.js';
import { racingSkill } from './driver-attributes.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const LABELS = {
  soft:   { label: 'Macios', description: 'Mais aderência e volta mais rápida no começo, mas se desgastam cedo. Bons para ganhar posição largando atrás e em pista de rua, onde o desgaste é baixo.' },
  medium: { label: 'Médios', description: 'Equilíbrio entre ritmo e duração. Dão liberdade para parar cedo ou tarde; é a escolha da maioria do grid.' },
  hard:   { label: 'Duros', description: 'Menos aderência e demoram a aquecer, mas duram muito. Bons em pista técnica, que castiga o pneu, e para esticar o primeiro stint.' },
  inters: { label: 'Intermediários', description: 'O pneu certo para pista molhada sem água acumulada. É a escolha que a equipe recomenda.' },
  wait:   { label: 'Esticar os intermediários', description: 'Ficar mais tempo na pista para trocar direto para pneus de seco quando secar. Se a chuva apertar, você perde ritmo.' },
  slicks: { label: 'Arriscar slicks', description: 'Pneus de seco na pista molhada. Se o trilho seco aparecer logo, você voa; se não, perde muito.' },
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
  inters: 'Os intermediários estavam na janela certa e você andou forte',
  wait: 'Esticar compensou: a pista secou e você fez uma parada a menos',
  slicks: 'A aposta ousada nos slicks funcionou',
};
const BAD = {
  soft: 'Os macios acabaram cedo e você perdeu ritmo',
  medium: 'Uma parada lenta custou posições',
  hard: 'Os duros demoraram a esquentar',
  inters: 'A pista secou antes do esperado e os intermediários superaqueceram',
  wait: 'A chuva apertou e os intermediários gastos custaram ritmo',
  slicks: 'Os slicks não seguraram na pista molhada',
};

// --- Final de corrida (versão enxuta) ---------------------------------------------------------------
// O jogador vê o rival logo à frente e decide: atacar (arrisca ±1 posição, a favor de quem tem mais ritmo) ou administrar.

// Vantagem de ritmo do jogador sobre o rival: positiva = jogador mais rápido. Mistura carro e habilidade pelo peso da categoria.
export function paceEdge(player, rival, carWeight) {
  const perf = (d) => carWeight * (d.teamCar ?? 80) + (1 - carWeight) * racingSkill(d);
  return perf(player) - perf(rival);
}

export function finaleFit(edge) {
  const F = CONFIG.strategy.finale;
  return clamp(edge / F.fitScale, -F.maxFit, F.maxFit);
}

// Escolhe um único duelo. Um perseguidor mais rápido ganha prioridade;
// companheiros e abandonos não geram um duelo de defesa independente das ordens.
export function finaleSituation(w, player, carWeight) {
  if (w.dnfs.includes(player)) return null;
  const classified = w.result.filter((d) => !w.dnfs.includes(d));
  const i = classified.indexOf(player);
  if (i < 0) return null;
  const front = classified[i - 1];
  const rear = classified[i + 1];
  const attack = front && front.team !== player.team ? front : null;
  const defense = rear && rear.team !== player.team ? rear : null;
  const threshold = CONFIG.strategy.finale.paceThreshold;
  if (defense && (!attack || paceEdge(player, defense, carWeight) <= -threshold)) {
    return { mode: 'defend', rival: defense, pos: i + 1 };
  }
  return attack ? { mode: 'attack', rival: attack, pos: i + 1 } : null;
}

export function finaleOptions(rivalName, mode = 'attack') {
  if (mode === 'defend') return {
    options: [
      { id: 'defend', label: 'Defender posição', description: `Disputar com ${rivalName}: pode manter a posição, mas uma defesa mal executada pode custar até duas posições.` },
      { id: 'yield', label: 'Ceder a posição', description: `Deixar ${rivalName} passar: perde uma posição, sem arriscar um erro na disputa.` },
    ],
    safe: 'yield',
  };
  return {
    options: [
      { id: 'attack', label: 'Atacar', description: `Tentar a ultrapassagem sobre ${rivalName}: se der certo você sobe uma posição; se der errado, perde uma.` },
      { id: 'manage', label: 'Administrar', description: 'Cuidar dos pneus e do carro e levar a posição para casa, sem risco.' },
    ],
    safe: 'manage',
  };
}

export function resolveFinale(w, player, rival, choiceId, carWeight, rng, mode = 'attack') {
  if (mode === 'defend') {
    const D = CONFIG.strategy.finale.defense;
    const before = w.result.indexOf(player);
    let kind = 'bad';
    let requestedShift = -1;
    let text = `Você cedeu a posição para ${rival.name} e evitou a disputa.`;
    if (choiceId === 'defend') {
      const hold = clamp(D.holdChance + D.perFit * finaleFit(paceEdge(player, rival, carWeight)), D.minHold, D.maxHold);
      const roll = rng.next();
      if (roll < hold) {
        kind = 'good'; requestedShift = 0;
        text = `Você fechou a porta para ${rival.name} e manteve a posição.`;
      } else if (roll >= 1 - D.mistakeChance) {
        requestedShift = -2;
        text = `Você errou ao defender de ${rival.name} e saiu da trajetória.`;
      } else {
        text = `${rival.name} encontrou espaço e passou, apesar da sua defesa.`;
      }
    } else if (choiceId !== 'yield') {
      throw new Error('id inválido (use defend ou yield)');
    }
    if (requestedShift) EFFECTS.shift({ w, player }, requestedShift);
    const shift = before - w.result.indexOf(player);
    if (shift) text += ` Perdeu ${Math.abs(shift)} ${shift === -1 ? 'posição' : 'posições'}.`;
    return { kind, shift, label: choiceId === 'defend' ? 'Defender' : 'Ceder', text };
  }
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
