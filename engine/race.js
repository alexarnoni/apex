// Motor de corrida. O MESMO motor roda karting e F1:
// a categoria só muda carWeight, tamanho de grid e afins (ver data/categories.js).

import { CONFIG } from './config.js';
import { racingSkill, consistencyNoise } from './driver-attributes.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function reliability(car) {
  const r = CONFIG.reliability;
  return clamp(r.base + (r.refCar - car) * r.perCarPoint, r.min, r.max);
}

export function updateForm(driver, rng) {
  const f = CONFIG.form;
  driver.form = clamp((driver.form ?? 0) + rng.range(-f.step, f.step), -f.cap, f.cap);
}

function basePerf(d, car, wet, carWeight, phase = 'race') {
  const st = CONFIG.styles[d.style] ?? {};
  const cw = wet ? CONFIG.race.wetCarWeight : carWeight;
  let p = cw * car + (1 - cw) * racingSkill(d, phase, wet) + (d.form ?? 0) + (d.weekend ?? 0) + (d.perfBonus ?? 0);
  if (st.flatBonus) p += st.flatBonus;
  if (wet && st.wetBonus) p += st.wetBonus;
  // Bônus de status p1 (só F1, quando atribuído)
  if (d.status === 'p1') p += CONFIG.status.statusP1FlatPerf;
  // Bônus de campeão reinante
  if (d.isReigning && CONFIG.champion) p += CONFIG.champion.carryoverPerf;
  return p;
}

// Simula um fim de semana completo (quali + corrida) para um grid de pilotos.
// drivers: [{ skill, style, form, teamCar, ... }]  (teamCar = força do carro do piloto)
// Retorna { wet, quali: [driver...], result: [{driver, dnf}...], pointsAwarded: Map }
// Efeito da pista (tags de data/circuits.js) sobre o motor. Sem pista, nada muda.
export function trackEffects(track) {
  const e = { carWeightDelta: 0, gridMult: 1, dnfDelta: 0, wetChance: CONFIG.race.wetChance };
  if (!track) return e;
  e.wetChance = track.chuva ?? e.wetChance;
  for (const tag of track.tags ?? []) {
    const t = CONFIG.tracks[tag];
    if (!t) continue;
    e.carWeightDelta += t.carWeightDelta ?? 0;
    e.gridMult *= t.gridMult ?? 1;
    e.dnfDelta += t.dnfDelta ?? 0;
  }
  return e;
}

export function simWeekend(drivers, category, rng, track = null) {
  const R = CONFIG.race;
  const T = trackEffects(track);
  const carWeight = category.carWeight + T.carWeightDelta;
  const wet = rng.chance(T.wetChance);

  for (const d of drivers) {
    updateForm(d, rng);
    d.weekend = rng.gauss() * R.weekendFactorSigma; // "o carro funcionou nesse traçado"
  }

  // Qualificação
  const quali = drivers
    .map((d) => {
      const st = CONFIG.styles[d.style] ?? {};
      let sigma = Math.max(CONFIG.driverAttributes.minNoise, R.noise.quali + (st.noiseDelta ?? 0) + (st.qualiNoiseDelta ?? 0) + consistencyNoise(d));
      if (wet) sigma += R.noise.wetExtra;
      const p = basePerf(d, d.teamCar, wet, carWeight, 'qualifying') + (st.qualiBonus ?? 0) + rng.gauss() * sigma;
      return { d, p };
    })
    .sort((a, b) => b.p - a.p)
    .map((x) => x.d);

  const gridPos = new Map(quali.map((d, i) => [d, i]));

  // Corrida
  const running = [];
  const dnfs = [];
  for (const d of drivers) {
    const st = CONFIG.styles[d.style] ?? {};
    const dnfProb = Math.max(R.dnfMin, reliability(d.teamCar) + (st.dnfDelta ?? 0) + (d.dnfDelta ?? 0) + T.dnfDelta);
    if (rng.chance(dnfProb)) { dnfs.push(d); continue; }
    let sigma = Math.max(CONFIG.driverAttributes.minNoise, R.noise.race + (st.noiseDelta ?? 0) + consistencyNoise(d));
    if (wet) sigma += R.noise.wetExtra;
    let p = basePerf(d, d.teamCar, wet, carWeight);
    p -= st.peakPenalty ?? 0;
    p += (drivers.length - gridPos.get(d)) * R.gridBonusPerPos * T.gridMult;
    // p1 recebe bônus extra de largada
    if (d.status === 'p1') p += (drivers.length - gridPos.get(d)) * CONFIG.status.statusP1GridBonusExtra;
    p += rng.gauss() * sigma;
    running.push({ d, p });
  }
  running.sort((a, b) => b.p - a.p);

  const result = running.map((x) => x.d).concat(dnfs);

  // pointsAwarded NÃO é construído aqui — premiação acontece em runSeason após ordens de equipe
  return { wet, track: track?.id ?? null, quali, result, dnfs, pointsAwarded: null, pole: quali[0], winner: running[0]?.d ?? null };
}
