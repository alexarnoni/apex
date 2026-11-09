import { CONFIG } from './config.js';
import { DRIVER_PROFILES } from '../data/driverProfiles.js';

export const ATTRIBUTE_LABELS = {
  qualifying: 'Classificação', race: 'Ritmo de corrida', consistency: 'Consistência',
  wet: 'Chuva', tyres: 'Gestão de pneus', feedback: 'Contribuição técnica',
};
const keys = Object.keys(ATTRIBUTE_LABELS);
const clamp = x => Math.max(0, Math.min(100, x));
export const overall = attrs => keys.reduce((sum, k) => sum + attrs[k] * CONFIG.driverAttributes.weights[k], 0);

// Ajusta a média respeitando limites. Preserva skill legado e efeitos escalares de treino/eventos.
function centered(attrs, target) {
  const out = Object.fromEntries(keys.map(k => [k, clamp(attrs[k])]));
  for (let pass = 0; pass < keys.length + 1; pass++) {
    const delta = target - overall(out);
    if (Math.abs(delta) < 1e-9) break;
    const free = keys.filter(k => delta > 0 ? out[k] < 100 : out[k] > 0);
    const weight = free.reduce((s, k) => s + CONFIG.driverAttributes.weights[k], 0);
    if (!weight) break;
    for (const k of free) out[k] = clamp(out[k] + delta / weight);
  }
  return out;
}

export function attributesOf(d) {
  if (d.attributes && keys.every(k => Number.isFinite(d.attributes[k]))) {
    if (d.attributeSkill === d.skill) return d.attributes;
    return centered(d.attributes, clamp(d.skill));
  }
  const fallback = CONFIG.driverAttributes.styles[d.style] ?? keys.map(() => 0);
  const shape = !d.isPlayer && !d.generated ? DRIVER_PROFILES[d.name] ?? fallback : fallback;
  return centered(Object.fromEntries(keys.map((k, i) => [k, d.skill + shape[i]])), clamp(d.skill));
}

export function ensureAttributes(d) {
  d.attributes = { ...attributesOf(d) };
  d.attributeSkill = d.skill;
  return d;
}

export function evolveAttributes(d, delta, { learning = false, focus = null } = {}) {
  ensureAttributes(d);
  const C = CONFIG.driverAttributes;
  const rates = focus && focus !== 'balanced' ? Object.fromEntries(keys.map(k => [k, k === focus ? C.trainingFocused : C.trainingOther])) : delta >= 0 ? C.growth : C.decline;
  const meanRate = overall(rates);
  const attrs = { ...d.attributes };
  for (const k of keys) attrs[k] = clamp(attrs[k] + delta * rates[k] / meanRate);
  // Aprendizado limitado: experiência pode preservar competências, sem crescimento infinito.
  if (learning && d.age >= C.experienceStart && d.age <= C.experienceEnd) {
    for (const [k, gain] of Object.entries(C.learning)) if (attrs[k] < C.learningCap) attrs[k] = Math.min(C.learningCap, attrs[k] + gain);
  }
  const target = clamp(delta > 0 ? Math.min(d.potential ?? 100, d.skill + delta) : Math.max(Math.min(d.skill, CONFIG.lifecycle.skillFloor), d.skill + delta));
  // Aprendizado redistribui competências; não cria um bônus oculto no overall.
  d.attributes = centered(attrs, target);
  d.skill = target;
  d.attributeSkill = target;
}

export function trainAttributes(d, gain, focus = 'balanced') {
  if (focus !== 'balanced' && !Object.hasOwn(ATTRIBUTE_LABELS, focus)) throw new Error('foco de treino inválido');
  evolveAttributes(d, gain, { focus });
}

export function racingSkill(d, phase = 'race', wet = false) {
  if (!CONFIG.driverAttributes.enabled) return d.skill;
  const a = attributesOf(d); const C = CONFIG.driverAttributes;
  const dry = phase === 'qualifying' ? a.qualifying : a.race * (1 - C.raceTyreWeight) + a.tyres * C.raceTyreWeight;
  return wet ? dry * (1 - C.wetWeight) + a.wet * C.wetWeight : dry;
}

export function consistencyNoise(d) {
  if (!CONFIG.driverAttributes.enabled) return 0;
  const C = CONFIG.driverAttributes;
  return Math.max(-C.maxNoiseDelta, Math.min(C.maxNoiseDelta, (C.reference - attributesOf(d).consistency) * C.consistencyNoise));
}

export function attributeView(d) {
  const attrs = attributesOf(d);
  return keys.map(id => ({ id, label: ATTRIBUTE_LABELS[id], value: Math.round(attrs[id] * 10) / 10 }));
}
