// Ciclo de vida dos pilotos: cresce até o teto de potencial,
// declina depois dos 33, aposenta por probabilidade.

import { CONFIG } from './config.js';
import { NAME_POOLS } from '../data/names.js';

export function ageDelta(age, rng) {
  const Z = CONFIG.lifecycle.veteranGoodYear;
  if (age >= Z.minAge && Z.chance > 0 && rng.chance(Z.chance)) return rng.range(Z.range[0], Z.range[1]);
  for (const band of CONFIG.lifecycle.ageCurve) {
    if (age <= band.maxAge) return rng.range(band.min, band.max);
  }
  return -1;
}

// Dedicação: treinar eleva o teto do jogador (potencial), com rendimento decrescente. Quem treina muito pode virar um talento
// geracional; quem não treina fica no talento de berço. Devolve quanto o teto subiu.
export function raisePotential(player, amount = CONFIG.talent.trainGain) {
  const T = CONFIG.talent;
  const factor = Math.max(0.15, Math.min(1, 1 - (player.potential - T.trainFrom) / T.trainSlope));
  const before = player.potential;
  player.potential = Math.min(T.max, player.potential + amount * factor);
  return player.potential - before;
}

// Queda de habilidade do jogador ao fazer `age` anos (negativa), ou null se ainda não está em declínio.
// shield: o foco "Treinar" do ano corta a queda.
export function playerDeclineDelta(age, style, shield = false) {
  const D = CONFIG.lifecycle.playerDecline;
  const start = D.startAge[style] ?? D.startAge.con;
  if (age < start) return null;
  const raw = Math.max(D.cap, D.firstYear + (age - start) * D.perYear);
  return shield ? raw * (1 - D.trainShield) : raw;
}

// Resumo para a ficha: quando o declínio começa e quanto custa o próximo ano (com e sem treino).
export function declineInfo(driver) {
  const D = CONFIG.lifecycle.playerDecline;
  const start = D.startAge[driver.style] ?? D.startAge.con;
  const next = playerDeclineDelta(driver.age + 1, driver.style, false);
  const nextTrained = playerDeclineDelta(driver.age + 1, driver.style, true);
  return { startAge: start, inDecline: driver.age + 1 >= start, next, nextTrained };
}

export function applyAging(driver, rng) {
  driver.age += 1;
  if (driver.isPlayer) {
    const d = playerDeclineDelta(driver.age, driver.style, !!driver.declineShield);
    if (d !== null) {
      driver.skill = Math.max(CONFIG.lifecycle.skillFloor, driver.skill + d);
      return;
    }
  }
  const delta = ageDelta(driver.age, rng);
  if (delta > 0) driver.skill = Math.min(driver.potential, driver.skill + delta);
  else driver.skill = Math.max(CONFIG.lifecycle.skillFloor, driver.skill + delta);
}

export function retirementProb(driver) {
  const L = CONFIG.lifecycle;
  if (driver.age >= L.retireHardAge) return 1;   // limite do corpo: ninguém corre depois disso
  // Desgaste por idade (só após retireStartAge)
  let p = 0;
  if (driver.age >= L.retireStartAge) {
    p = (driver.age - (L.retireStartAge - 1)) * L.retirePerYear;
    if (driver.skill < L.retireLowSkillThreshold) p += L.retireLowSkillBonus;
    if (driver.skill >= L.retireEliteSkill) p *= L.retireEliteFactor;   // elite dura mais (Alonso, Hamilton)
  }
  // "Nada mais a provar": títulos consecutivos aumentam aposentadoria sem gate de idade
  if (L.retirePerTitle && driver.consecutiveTitles) {
    p += driver.consecutiveTitles * L.retirePerTitle;
  }
  return Math.min(L.retireMaxProb, p);
}

let rookieCounter = 0;

// Sorteia país, inicial e sobrenome ("L. Moretti"). Nunca colide com os pilotos reais (que só têm sobrenome).
function rollIdentity(rng) {
  const entries = Object.entries(NAME_POOLS);
  const total = entries.reduce((s, [, p]) => s + p.w, 0);
  let r = rng.next() * total;
  const [nat, p] = entries.find(([, e]) => (r -= e.w) < 0) ?? entries[0];
  const first = p.firsts[rng.int(0, p.firsts.length - 1)];
  const surname = p.surnames[rng.int(0, p.surnames.length - 1)];
  return { nat, name: `${first[0]}. ${surname}` };
}

// origin: rótulo narrativo ("campeão da F2", "veio da IndyCar", "rival de karting")
// names: lista antiga de sobrenomes, mantida na assinatura por compatibilidade (os nomes agora vêm de NAME_POOLS).
export function makeRookie(names, rng, origin = 'F2') {
  void names;
  const R = CONFIG.rookies;
  const { nat, name } = rollIdentity(rng);
  rookieCounter += 1;
  const star = rng.chance(R.starChance);
  const potRange = star ? R.starPotRange : R.normalPotRange;
  return {
    name,
    nat,
    team: null,
    skill: rng.range(R.skillRange[0], R.skillRange[1]),
    potential: rng.range(potRange[0], potRange[1]),
    style: rng.pick(['agg', 'tec', 'con']),
    age: rng.int(R.ageRange[0], R.ageRange[1]),
    contract: 0,
    generated: true,
    origin,
    form: 0,
    stats: { wins: 0, podiums: 0, poles: 0, titles: 0, seasons: 0, points: 0, dnfs: 0 },
  };
}

export function resetRookieCounter() { rookieCounter = 0; }
export function getRookieCounter() { return rookieCounter; }
export function setRookieCounter(n) { rookieCounter = n; }
