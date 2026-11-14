// Pneu do jogador (F1): estado e funções puras, sem sorteio. A engine (f1.js) decide quando chamar cada uma.
// Só o jogador tem pneu simulado. Em pista molhada (composto nulo) a condição fica fixa e a aderência vale 0.

import { CONFIG } from './config.js';

const DRY = ['soft', 'medium', 'hard'];
export const COMPOUND_LABEL = { soft: 'Macios', medium: 'Médios', hard: 'Duros' };
const NONE = () => ({ compound: null, condition: 70, wearFactor: 0, fit: 0 });

export function startTyre(strategyId, practice) {
  if (!DRY.includes(strategyId)) return NONE();
  const T = CONFIG.tyres;
  return { compound: strategyId, condition: 100, wearFactor: practice === 'tyres' ? T.practiceWearFactor : 1, fit: 0 };
}

export function tyreOf(season) {
  return season?.cur?.tyre ?? NONE();
}

// Condição depois de um trecho de corrida.
export function tick(tyre) {
  if (!tyre?.compound) return tyre?.condition ?? 70;
  return Math.max(0, tyre.condition - CONFIG.tyres[tyre.compound].wear * (tyre.wearFactor ?? 1));
}

// Condição depois de um ataque ou de pressionar.
export function spend(tyre, amount) {
  if (!tyre?.compound) return tyre?.condition ?? 70;
  return Math.max(0, tyre.condition - amount);
}

// Aderência do composto, encaixe com a pista e efeito da condição. Positivo = mais rápido que a referência.
export function chanceMod(tyre) {
  if (!tyre?.compound) return 0;
  const T = CONFIG.tyres;
  const d = tyre.condition - T.reference;
  const byCondition = d >= 0 ? (d / 10) * T.perTenAbove : (d / 10) * T.perTenBelow;
  return T[tyre.compound].grip + (tyre.fit ?? 0) * T.fitFactor + byCondition;
}

export function attacksLeft(tyre) {
  const T = CONFIG.tyres;
  return Math.max(0, Math.floor(((tyre?.condition ?? T.reference) - T.dead) / T.attackWear));
}

export const isDead = (tyre) => !!tyre?.compound && tyre.condition <= CONFIG.tyres.dead;

export function tyreView(tyre) {
  if (!tyre?.compound) return { compound: null, label: 'Pneus de chuva', condition: Math.round(tyre?.condition ?? 70), attacksLeft: attacksLeft(tyre) };
  return { compound: tyre.compound, label: COMPOUND_LABEL[tyre.compound], condition: Math.round(tyre.condition), attacksLeft: attacksLeft(tyre) };
}
