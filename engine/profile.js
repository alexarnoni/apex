// Perfil da equipe: pressão x desenvolvimento (spec nas notas de CONFIG.teamProfile).
//
// O perfil sai da posição do carro da equipe entre as da categoria:
//   ponta = entre as 3 melhores; fundo = entre as 3 piores (na F1, pelos cortes de CONFIG.f1.carTierRank); meio = o resto.

import { CONFIG } from './config.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// rank: 1 = melhor carro. n: quantas equipes. cuts: { top, mid } opcional (F1); sem ele, 3 melhores e 3 piores.
export function tierOf(rank, n, cuts = null) {
  if (cuts) return rank <= cuts.top ? 'ponta' : rank <= cuts.mid ? 'meio' : 'fundo';
  return rank <= 3 ? 'ponta' : rank > n - 3 ? 'fundo' : 'meio';
}

export const profileOf = (tier) => ({ id: tier, ...CONFIG.teamProfile[tier] });

// "Se for bem, evolui bem": na equipe de ponta o bônus de desenvolvimento só vale quando o jogador correspondeu ao esperado
// para o carro naquela temporada; abaixo disso ele cresce no ritmo normal (1,0). Nos outros perfis não há condição.
export function effectiveDev(tier, metExpectation) {
  const dev = CONFIG.teamProfile[tier].development;
  return tier === 'ponta' && !metExpectation ? Math.min(dev, 1) : dev;
}

// Posição final esperada de um piloto num carro de posição `rank` (2 pilotos por equipe): 2 x posição do carro + 1, ou seja,
// o carro 1 espera P3, o carro 5 espera P11. Medido: o jogador médio termina em P11,6 num carro do meio no kart, então
// esperar menos que isso (a primeira versão usava 2 x posição - 0,5) punia quem jogava normal e tirava ofertas da base.
export function expectedPosition(rank) {
  return CONFIG.teamProfile.seatsPerTeam * rank + CONFIG.teamProfile.expectedOffset;
}

// Ajuste de pressão na nota de scouting da base. Positivo = superou o esperado (e a equipe tem cobrança, então vale mais).
export function scoutPressure(tier, rank, position) {
  const P = CONFIG.teamProfile;
  const pressure = P[tier].pressure;
  if (pressure === 0) return 0;
  const gap = expectedPosition(rank) - position;     // > 0: terminou melhor que o esperado
  const raw = gap >= 0 ? gap * P.scoutPerPosOver : gap * P.scoutPerPosUnder;
  return clamp(raw * pressure, -P.scoutCap, P.scoutCap);
}

// Confiança perdida na F1 por ficar abaixo do esperado para o carro (sempre <= 0).
export function trustPressure(tier, rank, position) {
  const P = CONFIG.teamProfile;
  const pressure = P[tier].pressure;
  if (pressure === 0) return 0;
  const under = clamp(position - expectedPosition(rank), 0, P.trustCap);
  return Math.round(under * P.trustPerPosUnder * pressure * 10) / 10 || 0;   // "|| 0" evita -0, que o JSON do save troca por 0
}

// Texto curto para a tela (pressão e desenvolvimento em palavras, mais a frase do perfil).
const PRESSURE_WORD = (p) => (p >= 0.9 ? 'alta' : p > 0 ? 'média' : 'nenhuma');
const DEV_WORD = (d) => (d > 1.1 ? 'rápido' : d >= 0.95 ? 'médio' : 'lento');
const TEXT = {
  ponta: 'Muita pressão: a equipe espera resultado e cobra. Se você for bem, evolui rápido.',
  meio: 'Pressão moderada e desenvolvimento médio. Um meio-termo tranquilo para crescer.',
  fundo: 'Sem pressão nenhuma, mas o desenvolvimento é mais lento. Quem se destaca num carro fraco chama muita atenção.',
};

export function profileView(tier) {
  const p = profileOf(tier);
  return {
    id: tier, label: p.label, text: TEXT[tier],
    pressure: p.pressure, pressureWord: PRESSURE_WORD(p.pressure),
    development: p.development, developmentWord: DEV_WORD(p.development),
  };
}
