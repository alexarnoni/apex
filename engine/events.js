// Motor genérico de eventos (spec-conteudo). Nenhuma regra por id de evento aqui:
// o conteúdo vive em data/events.js e os efeitos são declarativos, resolvidos por EFFECTS.

import { CONFIG } from './config.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Move `who` dentro dos classificados e mantém DNFs no fim. n > 0 sobe n posições.
function reorder(w, who, n) {
  if (w.dnfs.includes(who)) return;
  const cls = w.result.filter((d) => !w.dnfs.includes(d));
  const i = cls.indexOf(who);
  if (i < 0) return;
  cls.splice(i, 1);
  cls.splice(clamp(i - n, 0, cls.length), 0, who);
  w.result = [...cls, ...w.dnfs];
}

function retire(w, who) {
  if (!who || w.dnfs.includes(who)) return;
  w.dnfs = [...w.dnfs, who];
  w.result = [...w.result.filter((d) => d !== who), ...w.dnfs];
  who.seasonDnfs += 1;
}

// Cada efeito: (ctx, valor, rng) => void. Efeito desconhecido lança erro (pega typo na tabela).
export const EFFECTS = {
  skill: (c, v) => { c.player.skill = clamp(c.player.skill + v, 0, v > 0 ? c.player.potential : 100); },
  skillTemp: (c, v) => { c.player.skill += v; c.player.skillTemp = (c.player.skillTemp ?? 0) + v; },
  fame: (c, v) => { c.player.fame += v; },
  trust: (c, v) => { c.player.trust = clamp((c.player.trust ?? CONFIG.trust.trustStart) + v, 0, 100); },
  perfBuff: (c, v) => { c.player.buffs = [...(c.player.buffs ?? []), { value: v.value, races: v.races }]; },
  missRaces: (c, v) => { c.f1.missRaces = (c.f1.missRaces ?? 0) + v; },
  pointsPenalty: (c, v) => { c.player.seasonPoints = Math.max(0, c.player.seasonPoints - v); },
  scouting: (c, v) => { c.player.offerBonus = (c.player.offerBonus ?? 0) + v; },
  devBonus: (c, v) => { c.f1.devBonus = (c.f1.devBonus ?? 0) + v; },
  titleRoll: (c, v) => {
    if (v !== 'player') return; // 'rival': o líder segue líder
    const top = Math.max(...c.world.drivers.filter((d) => d !== c.player).map((d) => d.seasonPoints));
    c.player.seasonPoints = Math.max(c.player.seasonPoints, top + 1);
  },
  // só em race_event
  shift: (c, v) => reorder(c.w, c.player, v),
  dnf: (c) => retire(c.w, c.player),
  dnfRival: (c) => retire(c.w, c.rival),
};

export function applyEffects(ctx, effects, rng) {
  for (const [name, value] of Object.entries(effects ?? {})) {
    const fn = EFFECTS[name];
    if (!fn) throw new Error(`efeito desconhecido: ${name}`);
    fn(ctx, value, rng);
  }
}

// Sorteia um resultado de uma opção (outcomes[].p soma 1).
export function rollOutcome(option, rng) {
  let r = rng.next();
  for (const o of option.outcomes) {
    if (r < o.p) return o;
    r -= o.p;
  }
  return option.outcomes.at(-1);
}

function weightedPick(list, rng) {
  const total = list.reduce((s, e) => s + e.weight, 0);
  let r = rng.next() * total;
  for (const e of list) {
    r -= e.weight;
    if (r < 0) return e;
  }
  return list.at(-1);
}

// Eventos elegíveis: condição verdadeira e, se houver, `chance` sorteada.
function candidates(events, ctx, rng) {
  return events.filter((e) => e.cond(ctx)).filter((e) => e.chance === undefined || rng.chance(e.chance));
}

// Narrativo: no máximo 1 por fase, com chance de a fase ter evento (CONFIG.events.phaseChance).
export function pickNarrative(events, phase, ctx, rng) {
  if (!rng.chance(CONFIG.events.phaseChance[phase])) return null;
  const c = candidates(events.filter((e) => e.phase === phase), ctx, rng);
  return c.length ? weightedPick(c, rng) : null;
}

// Corrida: no máximo 1 evento (a ordem de equipe pode somar a 2). Maioria das corridas fica quieta.
export function pickRaceEvent(events, ctx, rng) {
  if (!rng.chance(CONFIG.events.raceEventChance)) return null;
  // Intervalo mínimo: o mesmo evento não repete nas últimas N corridas (ctx.recentEvents).
  const fresh = events.filter((e) => !(ctx.recentEvents ?? []).includes(e.id));
  const c = candidates(fresh, ctx, rng);
  return c.length ? weightedPick(c, rng) : null;
}
