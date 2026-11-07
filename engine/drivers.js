// Ciclo de vida dos pilotos: cresce até o teto de potencial,
// declina depois dos 33, aposenta por probabilidade.

import { CONFIG } from './config.js';

export function ageDelta(age, rng) {
  for (const band of CONFIG.lifecycle.ageCurve) {
    if (age <= band.maxAge) return rng.range(band.min, band.max);
  }
  return -1;
}

export function applyAging(driver, rng) {
  driver.age += 1;
  const delta = ageDelta(driver.age, rng);
  if (delta > 0) driver.skill = Math.min(driver.potential, driver.skill + delta);
  else driver.skill = Math.max(CONFIG.lifecycle.skillFloor, driver.skill + delta);
}

export function retirementProb(driver) {
  const L = CONFIG.lifecycle;
  // Desgaste por idade (só após retireStartAge)
  let p = 0;
  if (driver.age >= L.retireStartAge) {
    p = (driver.age - (L.retireStartAge - 1)) * L.retirePerYear;
    if (driver.skill < L.retireLowSkillThreshold) p += L.retireLowSkillBonus;
  }
  // "Nada mais a provar": títulos consecutivos aumentam aposentadoria sem gate de idade
  if (L.retirePerTitle && driver.consecutiveTitles) {
    p += driver.consecutiveTitles * L.retirePerTitle;
  }
  return Math.min(L.retireMaxProb, p);
}

let rookieCounter = 0;

// origin: rótulo narrativo ("campeão da F2", "veio da IndyCar", "rival de karting")
export function makeRookie(names, rng, origin = 'F2') {
  const R = CONFIG.rookies;
  const name = names[rookieCounter % names.length] + (rookieCounter >= names.length ? ' II' : '');
  rookieCounter += 1;
  const star = rng.chance(R.starChance);
  const potRange = star ? R.starPotRange : R.normalPotRange;
  return {
    name,
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
