// F1 do jogador (spec-loop-jogador): foco de temporada, fim de semana, eventos, ordens de equipe,
// fim de temporada, ofertas/contrato, aposentadoria e legado.
//
// As funções resolve*/enter*/open* mutam o estado `s` que o game.js já clonou
// (ver `transition` lá). Aqui só existe regra; nenhuma tela.
//
// Fonte da verdade do jogador na F1 = driver dentro de s.f1.world (game.js religa s.player a ele
// no início de cada transição, então um snapshot JSON sem referências compartilhadas funciona).
//
// Fora desta fatia: rotas alternativas e rival persistente (rival_reencontro).

import { CONFIG } from './config.js';
import { createWorld, beginYear, endYear } from './world.js';
import { resetSeasonStats, startRace, applyTeamOrders, awardRace, summarizeSeason, trackFor } from './season.js';
import { CIRCUITS, circuitFor, TAG_LABEL, TAG_HINT } from '../data/circuits.js';
import { strategyOptions, resolveStrategy, finaleOptions, resolveFinale, finaleSituation, paceEdge } from './strategy.js';
import { startOptions, resolveStart } from './start.js';
import { createSeasonGoal, goalProgress } from './season-goals.js';
import { racePlan, PLAN_LABELS, raceAdvice } from './race-policy.js';
import { raisePotential } from './drivers.js';
import { tierOf, profileOf, profileView, trustPressure, effectiveDev, expectedPosition } from './profile.js';
import { assignStatus, applyTrustEvent, evaluateTrustEffects, trustReleaseChance } from './status.js';
import { marketScore, makeAvailable, assignReserves, fillSeats } from './market.js';
import { makeRookie } from './drivers.js';
import { attributeView, ATTRIBUTE_LABELS, trainAttributes, ensureAttributes } from './driver-attributes.js';
import { EFFECTS, applyEffects, rollOutcome, outcomeText, pickNarrative, pickRaceEvent } from './events.js';
import { CATEGORIES } from '../data/categories.js';
import { SURNAMES } from '../data/names.js';
import { TEAMS_F1, DRIVERS_F1, SISTER_TEAMS } from '../data/world2026.js';
import { NARRATIVE_EVENTS, RACE_EVENTS } from '../data/events.js';

const F1 = () => CONFIG.f1;
const clampSkill = (p, v) => Math.min(p.potential, v);

function log(s, type, text) {
  s.careerLog.push({ year: s.year, type, text });
}

const teamsById = (world) => new Map(world.teams.map((t) => [t.id, t]));
const teamName = (world, id) => world.teams.find((t) => t.id === id)?.name ?? id;

function carRank(world, teamId) {
  return [...world.teams].sort((a, b) => b.car - a.car).findIndex((t) => t.id === teamId) + 1;
}

// Classificações do campeonato (mesmo critério de desempate do resto do motor: pontos, depois vitórias).
const byPoints = (a, b) => (b.seasonPoints ?? 0) - (a.seasonPoints ?? 0) || (b.seasonWins ?? 0) - (a.seasonWins ?? 0);
const driverStandings = (world) => [...world.drivers].sort(byPoints);

function constructorStandings(world) {
  const pts = new Map(world.teams.map((t) => [t.id, 0]));
  for (const d of world.drivers) if (pts.has(d.team)) pts.set(d.team, pts.get(d.team) + (d.seasonPoints ?? 0));
  return world.teams
    .map((t) => ({ id: t.id, name: t.name, points: pts.get(t.id) }))
    .sort((a, b) => b.points - a.points);
}

const positionMap = (world) => Object.fromEntries(driverStandings(world).map((d, i) => [d.name, i + 1]));
const constructorPositionMap = (world) => Object.fromEntries(constructorStandings(world).map((c, i) => [c.id, i + 1]));

function carLabel(rank) {
  const T = F1().carTierRank;
  if (rank <= T.top) return 'equipe de ponta';
  if (rank <= T.mid) return 'meio do pelotão';
  return 'zebra';
}

// ---------------------------------------------------------------------------
// Entrada na F1
// ---------------------------------------------------------------------------

// teamId: equipe de F1 da oferta aceita. O jogador toma o assento do piloto mais fraco dela.
export function enterF1(s, rng, teamId) {
  const world = createWorld({ teams: TEAMS_F1, drivers: DRIVERS_F1, category: CATEGORIES.f1, names: SURNAMES });
  const team = world.teams.find((t) => t.id === teamId);
  if (!team) throw new Error(`equipe de F1 desconhecida: ${teamId}`);

  const mates = world.drivers.filter((d) => d.team === team.id);
  const displaced = mates.reduce((a, b) => (a.skill <= b.skill ? a : b));
  makeAvailable(world, displaced);
  world.lastMoves = [{ kind: 'available', name: displaced.name, nat: displaced.nat, from: team.name }];
  assignReserves(world);

  const p = s.player;
  ensureAttributes(p);
  p.baseStats = p.stats;
  p.stats = { wins: 0, podiums: 0, poles: 0, titles: 0, seasons: 0, points: 0, dnfs: 0, vice: 0 };
  p.team = team.id;
  p.contract = rng.int(CONFIG.rookies.contractRange[0], CONFIG.rookies.contractRange[1]);
  p.generated = false;
  p.form = 0;
  p.consecutiveTitles = 0;
  p.statusClause = null;
  p.exitClause = false;
  p.released = false;
  p.status = null;
  p.trust = CONFIG.trust.trustStart;
  p.perfBonus = 0;
  p.dnfDelta = 0;
  p.buffs = [];
  p.skillTemp = 0;
  p.offerBonus = 0;
  p.seasonPoints = 0;
  world.drivers.push(p);

  s.f1 = { world, season: null, seasons: [], lastSeason: null, devBonus: 0, missRaces: 0, lastEvent: null, eventHistory: [] };
  s.f1.racePlan = 'balanced';
  log(s, 'promotion', `Estreia na F1 pela ${team.name} (${carLabel(carRank(world, team.id))}), no lugar de ${displaced.name}.`);
  startNextYear(s);
}

// Perfil (ponta, meio, fundo) da equipe atual na F1, pelo carro dela: o desenvolvimento acelera ou freia o crescimento.
function syncF1Profile(s) {
  const { world } = s.f1;
  const p = s.player;
  const tier = tierOf(carRank(world, p.team), world.teams.length, F1().carTierRank);
  p.tier = tier;
  p.devFactor = profileOf(tier).development;
}

function startNextYear(s) {
  const { world } = s.f1;
  const last = world.history.at(-1)?.champion ?? null;
  assignStatus(world.teams, world.drivers, last);
  syncF1Profile(s);
  s.f1.season = null;
  s.player.offerBonus = 0;
  s.phase = 'F1_PRE_TEMPORADA';
  s.pendingDecision = { type: 'season_focus', payload: { options: F1().focus } };
}

// ---------------------------------------------------------------------------
// Contexto e eventos
// ---------------------------------------------------------------------------

const POINTS_ZONE = () => CONFIG.race.points.length;

function buildCtx(s, extra = {}) {
  const { world, season } = s.f1;
  const p = s.player;
  const races = season?.races ?? [];
  const rival = season?.rival ? world.drivers.find((d) => d.name === season.rival) ?? null : null;
  const sorted = [...world.drivers].sort((a, b) => (b.seasonPoints ?? 0) - (a.seasonPoints ?? 0) || (b.seasonWins ?? 0) - (a.seasonWins ?? 0));
  const leader = sorted[0];

  let noPointsStreak = 0;
  for (let i = races.length - 1; i >= 0; i--) {
    const r = races[i];
    if (r.missed) break;
    if (r.playerPos === null || r.playerPos > POINTS_ZONE()) noPointsStreak += 1; else break;
  }
  let winStreak = 0;
  for (let i = races.length - 1; i >= 0 && races[i].playerPos === 1; i--) winStreak += 1;

  return {
    player: p, world, season, f1: s.f1, rival, races,
    lastRace: races.at(-1) ?? null,
    teamRank: carRank(world, p.team),
    teamName: teamName(world, p.team),
    seasonPos: sorted.indexOf(p) + 1,
    titleGap: leader === p ? 0 : (leader.seasonPoints ?? 0) - (p.seasonPoints ?? 0),
    noPointsStreak, winStreak,
    rivalAhead: !!rival && (rival.seasonPoints ?? 0) > (p.seasonPoints ?? 0),
    ...extra,
  };
}

function storyDecision(ev, phase, ctx) {
  return {
    type: 'story_event',
    payload: {
      phase, eventId: ev.id, title: ev.title, text: ev.text(ctx),
      options: ev.options.map((o) => ({ id: o.id, label: o.label, description: o.description })),
    },
  };
}

// Tenta sortear um evento narrativo da fase. Devolve true se abriu uma decisão.
function openStory(s, rng, phase) {
  const ctx = buildCtx(s);
  const ev = pickNarrative(NARRATIVE_EVENTS, phase, ctx, rng);
  if (!ev) return false;
  s.pendingDecision = storyDecision(ev, phase, ctx);
  return true;
}

export function resolveStoryEvent(s, rng, answer) {
  const { phase, eventId } = s.pendingDecision.payload;
  const ev = NARRATIVE_EVENTS.find((e) => e.id === eventId);
  const opt = ev.options.find((o) => o.id === answer?.id);
  if (!opt) throw new Error(`id inválido (use ${ev.options.map((o) => o.id).join(', ')})`);
  const ctx = buildCtx(s);
  const outcome = rollOutcome(opt, rng);
  applyEffects(ctx, outcome.effects, rng);
  recordEvent(s, ev, outcomeText(outcome, ctx));
  s.pendingDecision = null;
  if (phase === 'season_start') return beginSeason(s, rng);
  if (phase === 'mid_season') { s.pendingDecision = weekendDecision(s); return undefined; }
  return finalizeSeason(s, rng);
}

function recordEvent(s, ev, resultText) {
  s.f1.lastEvent = { id: ev.id, title: ev.title, text: resultText };
  s.f1.eventHistory.push({ id: ev.id, year: s.year });
  log(s, 'event', `${ev.title}: ${resultText}`);
}

// ---------------------------------------------------------------------------
// Pré-temporada e fim de semana
// ---------------------------------------------------------------------------

export function resolveSeasonFocus(s, rng, answer) {
  const f = F1().focus[answer?.id];
  if (!f) throw new Error(`id inválido (use ${Object.keys(F1().focus).join(', ')})`);
  const plan = answer.plan ?? racePlan(s);
  if (!Object.hasOwn(F1().approach, plan)) throw new Error('plano de corrida inválido');
  s.f1.racePlan = plan;
  const p = s.player;
  s.f1.lastEvent = null;
  const training = answer.training ?? 'balanced';
  if (training !== 'balanced' && !Object.hasOwn(ATTRIBUTE_LABELS, training)) throw new Error('foco de treino inválido');
  s.f1.trainingFocus = training;
  if (f.skillGain) { raisePotential(p); trainAttributes(p, f.skillGain, training); }
  if (f.fameGain) p.fame += f.fameGain;
  if (f.devBonus) s.f1.devBonus += f.devBonus;
  s.f1.focus = answer.id;
  p.declineShield = answer.id === 'train';   // treinar atenua a queda de habilidade deste ano (ver playerDeclineDelta)
  // Eventos de início de temporada acontecem ANTES do desenvolvimento (devBonus precisa chegar a tempo).
  if (openStory(s, rng, 'season_start')) return;
  beginSeason(s, rng);
}

function beginSeason(s, rng) {
  const { world } = s.f1;
  const p = s.player;
  const myTeam = world.teams.find((t) => t.id === p.team);
  myTeam.devBonus = s.f1.devBonus;
  const { devLog } = beginYear(world, rng);
  delete myTeam.devBonus;
  s.f1.devBonus = 0;

  // Rival do ano: o piloto de habilidade mais próxima da sua (fora o companheiro).
  const others = world.drivers.filter((d) => d !== p && d.team !== p.team);
  const rival = others.reduce((a, b) => (Math.abs(a.skill - p.skill) <= Math.abs(b.skill - p.skill) ? a : b));
  resetSeasonStats(world.drivers);

  s.f1.season = {
    raceIndex: 0,
    total: world.category.races,
    ordersLog: [],
    races: [],
    pendingRace: null,
    devLog,
    lastRace: null,
    focus: s.f1.focus,
    rival: rival.name,
    goal: createSeasonGoal(world, p),
  };
  s.phase = 'F1_FIM_DE_SEMANA';
  s.pendingDecision = weekendDecision(s);
}

// Pista da etapa n para a UI: nome do GP, local, bandeira, características e chance de chuva.
export function circuitView(n) {
  const c = circuitFor(n);
  return { id: c.id, gp: c.gp, venue: c.venue, flag: c.flag, tags: c.tags.map((t) => TAG_LABEL[t]), hints: c.tags.map((t) => TAG_HINT[t]), rain: Math.round(c.chuva * 100) };
}

function weekendDecision(s) {
  const { season } = s.f1;
  const out = s.f1.missRaces > 0;
  const race = season.raceIndex + 1;
  const circuit = circuitView(race);
  circuit.home = !!s.player.flag && circuit.flag === s.player.flag;
  if (circuit.home && !out && s.baseCareer?.kartProgram && season.homeChoice?.race !== race) {
    const previous = (s.f1.homeResults ?? []).filter(r => r.circuit === circuit.id);
    const last = previous.at(-1);
    const win = previous.findLast(r => r.position === 1);
    const text = last?.position === null ? `Em ${last.year}, sua corrida aqui terminou em abandono.`
      : win ? `A torcida ainda lembra da sua vitória em ${win.year}.`
      : last ? `Na última vez aqui, você terminou em P${last.position} em ${last.year}.`
      : 'É sua primeira corrida em casa registrada nesta carreira.';
    return { type: 'home_race', payload: { race, circuit, title: 'GP de casa', text,
      options: [
        { id: 'fans', label: 'Encontrar a torcida', description: 'Entrevistas e encontros com fãs aumentam sua fama.' },
        { id: 'prepare', label: 'Priorizar a preparação', description: 'Mais tempo com a equipe reduz ligeiramente o risco de abandono nesta etapa.' },
      ] } };
  }
  return {
    type: 'weekend_approach',
    payload: {
      race,
      total: season.total,
      circuit,
      out,
      practice: season.practice ?? 'none',
      options: out ? { rest: { label: 'Acompanhar do box', description: 'Você está fora desta corrida.' } } : F1().approach,
    },
  };
}

export function resolveHomeRace(s, answer) {
  const { race, options } = s.pendingDecision.payload;
  if (!options.some(o => o.id === answer?.id)) throw new Error('Escolha uma opção para o GP de casa.');
  s.f1.season.homeChoice = { race, id: answer.id };
  if (answer.id === 'fans') s.player.fame += F1().homeRace.fanFame;
  s.pendingDecision = weekendDecision(s);
}

const ser = (world, w) => {
  const idx = (d) => world.drivers.indexOf(d);
  return { wet: w.wet, result: w.result.map(idx), dnfs: w.dnfs.map(idx), pole: idx(w.pole) };
};
const deser = (world, o) => {
  const D = world.drivers;
  return { wet: o.wet, result: o.result.map((i) => D[i]), dnfs: o.dnfs.map((i) => D[i]), pole: D[o.pole] };
};

export function resolveWeekendApproach(s, rng, answer) {
  const { world, season } = s.f1;
  const p = s.player;
  if (answer?.savePractice) {
    if (s.f1.missRaces > 0 || !['none', 'setup', 'tyres'].includes(answer.id)) throw new Error('Programa de treino inválido.');
    season.practice = answer.id;
    s.pendingDecision = weekendDecision(s);
    return;
  }
  if (answer?.savePlan) {
    if (!Object.hasOwn(F1().approach, answer.id)) throw new Error('plano de corrida inválido');
    s.f1.racePlan = answer.id;
    if (!season.goal) season.goal = createSeasonGoal(world, p);
    s.pendingDecision = weekendDecision(s);
    return;
  }
  if (!season.goal) season.goal = createSeasonGoal(world, p);
  s.f1.lastEvent = null; // o resultado do evento anterior some quando a próxima corrida começa
  const out = s.f1.missRaces > 0;
  const options = out ? { rest: true } : F1().approach;
  if (!options[answer?.id]) throw new Error(`id inválido (use ${Object.keys(options).join(', ')})`);

  let drivers = world.drivers;
  if (out) {
    s.f1.missRaces -= 1;
    drivers = world.drivers.filter((d) => d !== p);
  } else {
    const a = F1().approach[answer.id];
    const buff = (p.buffs ?? []).reduce((sum, b) => sum + b.value, 0);
    p.perfBonus = a.perfBonus + buff + (season.practice === 'setup' ? CONFIG.strategy.practice.setupBonus : 0);
    const home = season.homeChoice;
    p.dnfDelta = a.dnfDelta - (home?.race === season.raceIndex + 1 && home.id === 'prepare' ? F1().homeRace.prepDnfReduction : 0);
  }

  const w = startRace(drivers, world.category, rng, teamsById(world), trackFor(world.category, season.raceIndex + 1));
  // Dados da corrida em curso, para o resumo de fim de corrida (largada, abordagem, evento).
  season.cur = { grid: out ? null : (w.quali.indexOf(p) + 1) || null, approach: out ? 'rest' : answer.id, event: null };
  if (!out && season.practice) season.cur.practice = season.practice;
  delete season.practice;
  if (!out && !w.dnfs.includes(p)) {
    // Classificação feita: mostra o grid e pede a estratégia de pneus (a aposta que move algumas posições).
    const n = season.raceIndex + 1;
    const circuit = circuitView(n);
    const sctx = { tags: circuitFor(n).tags, grid: season.cur.grid ?? 10, wet: w.wet };
    const { options, safe } = strategyOptions(sctx);
    const rows = w.quali.map((d, i) => ({ pos: i + 1, name: d.name, nat: d.nat ?? d.flag ?? null, team: d.team, isPlayer: d === p }));
    season.cur.mapGrid = rows;
    season.pendingRace = { w: ser(world, w), absent: false, eventId: null, strategyCtx: sctx };
    s.pendingDecision = {
      type: 'race_strategy',
      payload: {
        race: n, circuit, wet: w.wet, grid: season.cur.grid, gridSize: w.quali.length,
        gridRows: rows.filter((r) => r.pos <= 6 || r.isPlayer), options, safe,
      },
    };
    return;
  }
  openRaceEvent(s, rng, w, out);
}

// Aposta de pneus: sorteia o efeito, move o jogador e segue para um possível evento de corrida.
export function resolveRaceStrategy(s, rng, answer) {
  const { world, season } = s.f1;
  const pr = season.pendingRace;
  const { options } = strategyOptions(pr.strategyCtx);
  if (!options.some((o) => o.id === answer?.id)) throw new Error(`id inválido (use ${options.map((o) => o.id).join(', ')})`);
  const w = deser(world, pr.w);
  const result = resolveStrategy(w, s.player, answer.id, pr.strategyCtx, rng);
  season.cur.strategy = { id: answer.id, label: result.label, kind: result.kind, shift: result.shift, text: result.text };
  const startCtx = { ...pr.strategyCtx, gridSize: world.drivers.length };
  const { options: starts, safe } = startOptions(startCtx);
  season.pendingRace = { w: ser(world, w), absent: false, eventId: null, startCtx };
  s.pendingDecision = {
    type: 'race_start',
    payload: { race: season.raceIndex + 1, circuit: circuitView(season.raceIndex + 1), grid: startCtx.grid, wet: w.wet, options: starts, safe },
  };
}

export function resolveRaceStart(s, rng, answer) {
  const { world, season } = s.f1;
  const pr = season.pendingRace;
  const w = deser(world, pr.w);
  season.cur.start = resolveStart(w, s.player, answer?.id, pr.startCtx, rng);
  season.pendingRace = null;
  openRaceEvent(s, rng, w, false);
}

// Sorteia um evento de corrida (se houver, para na decisão); sem evento, segue para as ordens de equipe.
function openRaceEvent(s, rng, w, out) {
  const { world, season } = s.f1;
  if (!out && !w.dnfs.includes(s.player)) {
    const ctx = raceCtx(s, w);
    const ev = pickRaceEvent(RACE_EVENTS, ctx, rng);
    if (ev) {
      season.pendingRace = { w: ser(world, w), absent: false, eventId: ev.id };
      s.pendingDecision = {
        type: 'race_event',
        payload: {
          race: season.raceIndex + 1, position: ctx.pos, eventId: ev.id, title: ev.title, text: ev.text(ctx), safe: ev.safe ?? null,
          options: ev.options.map((o) => ({ id: o.id, label: o.label, description: o.description })),
        },
      };
      return;
    }
  }
  openPitWindow(s, rng, w, out);
}

function raceCtx(s, w) {
  const p = s.player;
  const classified = w.result.filter((d) => !w.dnfs.includes(d));
  const i = classified.indexOf(p);
  const base = buildCtx(s, { w });
  const rival = base.rival;
  return {
    ...base,
    recentEvents: base.races.slice(-CONFIG.events.raceCooldown).map((r) => r.event).filter(Boolean),
    pos: i >= 0 ? i + 1 : null,
    rivalAheadOnTrack: !!rival && i > 0 && classified[i - 1] === rival,
  };
}

export function resolveRaceEvent(s, rng, answer) {
  const { world, season } = s.f1;
  const pr = season.pendingRace;
  const ev = RACE_EVENTS.find((e) => e.id === pr.eventId);
  const opt = ev.options.find((o) => o.id === answer?.id);
  if (!opt) throw new Error(`id inválido (use ${ev.options.map((o) => o.id).join(', ')})`);
  const w = deser(world, pr.w);
  const ctx = raceCtx(s, w);
  const outcome = rollOutcome(opt, rng);
  applyEffects(ctx, outcome.effects, rng);
  recordEvent(s, ev, outcomeText(outcome, ctx));
  season.cur.event = ev.title;
  season.cur.eventText = outcomeText(outcome, ctx);
  season.lastEventRace = season.raceIndex + 1;
  season.pendingRace = null;
  openPitWindow(s, rng, w, pr.absent, ev.id);
}

function openPitWindow(s, rng, w, absent, eventId = null) {
  const { world, season } = s.f1;
  const tyre = season.cur?.strategy;
  if (absent || !tyre?.id || w.dnfs.includes(s.player)) return continueToOrders(s, rng, w, absent, eventId);
  const cfg = CONFIG.strategy.pit;
  const circuit = circuitFor(season.raceIndex + 1);
  const life = cfg.life[tyre.id] + (season.cur.practice === 'tyres' ? CONFIG.strategy.practice.tyreLifeBonus : 0);
  const condition = 100 - Math.round(cfg.window * (100 - life) / 100);
  const neutral = CONFIG.strategy.neutralization;
  const chance = rng.next();
  const scale = w.wet ? neutral.wetMultiplier : 1;
  const interruption = chance < neutral.redFlag * scale ? 'red_flag'
    : chance < (neutral.redFlag + neutral.safetyCar) * scale ? 'safety_car' : null;
  const changes = rng.chance(w.wet ? cfg.wetChange : circuit.chuva * cfg.dryChangeFactor);
  if (!interruption && !changes && condition > cfg.worn) return continueToOrders(s, rng, w, absent, eventId);
  const classified = w.result.filter(d => !w.dnfs.includes(d));
  const index = classified.indexOf(s.player);
  const rival = classified[index - 1];
  const clearAir = !rival || paceEdge(s.player, rival, world.category.carWeight) > CONFIG.strategy.finale.paceThreshold;
  const wet = changes ? !w.wet : w.wet;
  season.pendingRace = { w: ser(world, w), absent, eventId };
  s.pendingDecision = { type: 'race_pit', payload: {
    position: index + 1, tyre: tyre.id === 'slicks' ? 'Pneus de pista seca' : tyre.id === 'wait' ? 'Composto mantido' : tyre.label,
    condition, wet, changes, interruption, rival: rival?.name ?? null,
    clearAir, safe: interruption || changes || !clearAir ? 'pit' : 'extend',
    options: interruption ? [
      { id: 'pit', label: interruption === 'red_flag' ? 'Trocar pneus na suspensão' : 'Parar sob safety car',
        description: interruption === 'red_flag' ? 'Troque sem perder posição e relargue com pneus adequados à pista.' : 'Aproveite o pelotão em ritmo reduzido. A parada pode custar uma posição.' },
      { id: 'extend', label: 'Manter os pneus', description: 'Preserve a posição. Se os pneus estiverem gastos ou inadequados, você pode perder terreno na relargada.' },
    ] : [
      { id: 'pit', label: 'Parar agora', description: changes ? 'Trocar para pneus adequados à nova condição da pista.' : 'Trocar pneus cedo para tentar ganhar tempo antes dos rivais.' },
      { id: 'extend', label: 'Adiar a parada', description: changes ? 'Ficar com o composto atual enquanto avalia a pista.' : 'Adiar a troca e aproveitar o ritmo em pista livre.' },
    ],
  } };
}

export function resolveRacePit(s, rng, answer) {
  const { world, season } = s.f1;
  const { w: snapshot, absent, eventId } = season.pendingRace;
  const p = s.pendingDecision.payload;
  if (!p.options.some(o => o.id === answer?.id)) throw new Error('Escolha uma estratégia de parada.');
  const w = deser(world, snapshot);
  w.wet = p.wet;
  const pit = answer.id === 'pit';
  const worn = p.condition <= CONFIG.strategy.pit.worn;
  const edge = p.interruption === 'red_flag' ? (pit ? 0 : p.changes || worn ? -1 : 0)
    : p.interruption === 'safety_car' ? (pit ? (p.changes || worn ? 0 : -1) : p.changes || worn ? -2 : 0)
    : p.changes ? (pit ? 1 : -2) : pit ? (p.clearAir ? 0 : 1) : (p.clearAir ? 1 : -1);
  EFFECTS.shift({ w, player: s.player }, edge);
  const position = w.result.indexOf(s.player) + 1;
  const compound = p.wet ? 'pneus de chuva' : 'pneus de pista seca';
  const detail = p.interruption === 'red_flag' && pit ? `Você colocou ${compound} durante a suspensão.`
    : p.interruption && !pit ? 'Você manteve os pneus.'
    : pit ? `Você parou, colocou ${compound} e voltou em P${position}.`
    : `Você adiou a parada e ficou em P${position} após a janela de paradas.`;
  const restart = p.interruption ? ` ${p.interruption === 'red_flag' ? 'Bandeira vermelha' : 'Safety car'}: retomada em P${position}.` : '';
  season.cur.pit = { id: answer.id, text: detail + restart };
  season.pendingRace = null;
  return continueToOrders(s, rng, w, absent, eventId);
}

// Ordens de equipe (podem pausar numa decisão) e depois o fim da corrida.
function continueToOrders(s, rng, w, absent, eventId = null) {
  const { world, season } = s.f1;
  const drivers = absent ? world.drivers.filter((d) => d !== s.player) : world.drivers;
  const r = applyTeamOrders(w, drivers, world.category, teamsById(world), season.raceIndex + 1, {
    playerPolicy: 'ask', ordersLog: season.ordersLog,
  });
  if (r.paused) {
    season.pendingRace = { w: ser(world, w), absent, teamIndex: r.teamIndex, eventId };
    s.pendingDecision = {
      type: 'team_order',
      payload: {
        race: season.raceIndex + 1,
        p1: r.order.p1.name,
        fromPosition: r.order.p2Pos + 1,
        toPosition: r.order.p1Pos + 1,
        options: [
          { id: 'obey', label: 'Obedecer', description: `Cede a posição para ${r.order.p1.name}: +${CONFIG.trust.obeyOrder} de confiança.` },
          { id: 'defy', label: 'Desafiar', description: `Mantém a posição, mas a equipe não esquece: ${CONFIG.trust.defyOrder} de confiança.` },
        ],
      },
    };
    return;
  }
  openFinale(s, rng, w, absent, eventId);
}

// Um duelo final: ataque à frente ou defesa de um perseguidor, antes de atribuir pontos.
function openFinale(s, rng, w, absent, eventId) {
  const { world, season } = s.f1;
  const p = s.player;
  const F = CONFIG.strategy.finale;
  if (!absent && !w.dnfs.includes(p)) {
    const situation = finaleSituation(w, p, world.category.carWeight);
    if (situation && rng.chance(F.chance)) {
      const { rival, mode, pos } = situation;
      const edge = paceEdge(p, rival, world.category.carWeight);
      const { options, safe } = finaleOptions(rival.name, mode);
      season.pendingRace = { w: ser(world, w), absent, eventId, finaleRival: rival.name, finaleMode: mode };
      s.pendingDecision = {
        type: 'race_finale',
        payload: {
          race: season.raceIndex + 1, circuit: circuitView(season.raceIndex + 1), pos, mode,
          rival: { name: rival.name, nat: rival.nat ?? rival.flag ?? null, team: rival.team, teamName: teamName(world, rival.team) },
          pace: edge >= F.paceThreshold ? 'faster' : edge <= -F.paceThreshold ? 'slower' : 'even',
          options, safe,
        },
      };
      return;
    }
  }
  finishRace(s, rng, w, absent, eventId);
}

export function resolveRaceFinale(s, rng, answer) {
  const { world, season } = s.f1;
  const pr = season.pendingRace;
  const rival = world.drivers.find((d) => d.name === pr.finaleRival);
  const mode = pr.finaleMode ?? 'attack'; // decisões antigas continuam sendo de ataque
  const { options } = finaleOptions(pr.finaleRival, mode);
  if (!options.some((o) => o.id === answer?.id)) throw new Error(`id inválido (use ${options.map((o) => o.id).join(', ')})`);
  const w = deser(world, pr.w);
  const result = resolveFinale(w, s.player, rival, answer.id, world.category.carWeight, rng, mode);
  season.cur.finale = { kind: result.kind, shift: result.shift, text: result.text, label: result.label };
  season.pendingRace = null;
  finishRace(s, rng, w, false, pr.eventId);
}

export function resolveTeamOrder(s, rng, answer) {
  const policy = answer?.id;
  if (policy !== 'obey' && policy !== 'defy') throw new Error('id inválido (use "obey" ou "defy")');
  const { world, season } = s.f1;
  const pr = season.pendingRace;
  const w = deser(world, pr.w);
  applyTeamOrders(w, world.drivers, world.category, teamsById(world), season.raceIndex + 1, {
    playerPolicy: policy, startTeam: pr.teamIndex, ordersLog: season.ordersLog,
  });
  applyTrustEvent(s.player, policy === 'obey' ? 'obeyOrder' : 'defyOrder');
  season.pendingRace = null;
  openFinale(s, rng, w, false, pr.eventId);
}

// Uma frase sobre o que decidiu a corrida: largada x chegada, chuva, abordagem, evento e ordem de equipe.
export function raceSummary(race, cur, order, playerName) {
  if (race.missed) return 'Você ficou fora desta corrida.';
  const bits = [];
  const grid = race.grid;
  if (race.playerPos === null) {
    bits.push(grid ? `Largou em P${grid} e abandonou.` : 'Abandonou.');
  } else if (grid) {
    const d = grid - race.playerPos;
    const delta = d > 0 ? ` (+${d})` : d < 0 ? ` (−${-d})` : '';
    bits.push(`Largou em P${grid} e terminou em P${race.playerPos}${delta}.`);
  } else {
    bits.push(`Terminou em P${race.playerPos}.`);
  }
  if (race.wet) bits.push('Corrida na chuva.');
  if (cur?.approach === 'risky') bits.push('Abordagem arriscada.');
  if (cur?.approach === 'conservative') bits.push('Abordagem conservadora.');
  if (cur?.event) bits.push(`Evento: ${cur.event}.`);
  if (order) {
    if (order.p2 === playerName) bits.push(order.defied ? 'Você desafiou a ordem de equipe.' : 'Você cedeu a posição por ordem de equipe.');
    else bits.push('A equipe mandou o companheiro ceder a posição a você.');
  }
  if (race.playerPos === 1) bits.push('Vitória!');
  return bits.join(' ');
}

const DNF_CAUSES = [
  { text: 'problema no motor', w: (p, rank) => 0.4 + (rank > 7 ? 0.2 : 0) },
  { text: 'quebra de suspensão', w: () => 0.2 },
  { text: 'toque com outro carro', w: (p) => 0.25 + (p.style === 'agg' ? 0.15 : 0) },
  { text: 'erro de pilotagem', w: (p) => 0.15 + (p.style === 'agg' ? 0.1 : 0) - (p.style === 'con' ? 0.08 : 0) },
];

// Relato da corrida do jogador: largada, estratégia, evento, ordem de equipe e chegada.
// O resultado final já está decidido; as posições intermediárias são um caminho plausível entre largada e chegada.
function raceStory(race, cur, order, p, gridSize, carRankNow, rng) {
  if (race.missed) return [];
  const lines = [];
  const grid = race.grid;
  const dnf = race.playerPos === null;
  if (cur?.start) {
    lines.push({ when: 'Largada', text: cur.start.text });
  } else if (grid) {
    const target = dnf ? grid + rng.int(0, 2) : race.playerPos;
    const lap1 = Math.max(1, Math.min(gridSize, Math.round(grid + (target - grid) * 0.35 + rng.gauss())));
    const d = grid - lap1;
    lines.push({ when: 'Largada', text: d > 0 ? `Largou em P${grid} e ganhou ${d} ${d === 1 ? 'posição' : 'posições'} na primeira volta (P${lap1}).`
      : d < 0 ? `Largou em P${grid} e perdeu ${-d} ${d === -1 ? 'posição' : 'posições'} na primeira volta (P${lap1}).`
        : `Largou em P${grid} e manteve a posição na primeira volta.` });
  }
  if (cur?.start?.kind === 'dnf') {
    lines.push({ when: 'Abandono', text: 'Sua corrida terminou por um toque na primeira curva.' });
    return lines;
  }
  if (cur?.strategy) lines.push({ when: `Estratégia (${cur.strategy.label})`, text: cur.strategy.text });
  if (cur?.event) lines.push({ when: cur.event, text: cur.eventText ?? 'Você teve de decidir na pista.' });
  if (cur?.pit) lines.push({ when: 'Janela de box', text: cur.pit.text });
  if (cur?.finale) lines.push({ when: `Final (${cur.finale.label})`, text: cur.finale.text });
  if (order) {
    lines.push({ when: 'Rádio', text: order.p2 === p.name ? (order.defied ? 'Você desafiou a ordem de equipe e manteve a posição.' : 'Você cedeu a posição por ordem de equipe.') : 'A equipe mandou o companheiro ceder a posição a você.' });
  }
  if (dnf) {
    const total = DNF_CAUSES.reduce((sum, c) => sum + c.w(p, carRankNow), 0);
    let r = rng.next() * total;
    const cause = DNF_CAUSES.find((c) => (r -= c.w(p, carRankNow)) < 0) ?? DNF_CAUSES[0];
    lines.push({ when: 'Abandono', text: `Sua corrida terminou mais cedo por ${cause.text}.` });
  } else {
    const d = grid ? grid - race.playerPos : 0;
    const gain = d > 0 ? ` (ganhou ${d} em relação ao grid)` : d < 0 ? ` (perdeu ${-d} em relação ao grid)` : '';
    lines.push({ when: 'Chegada', text: race.playerPos === 1 ? `Vitória! Você cruzou a linha em primeiro${gain}.`
      : race.playerPos <= 3 ? `Pódio: P${race.playerPos}${gain}.` : `Cruzou a linha em P${race.playerPos}${gain}.` });
  }
  return lines;
}

function finishRace(s, rng, w, absent, eventId) {
  const { world, season } = s.f1;
  const p = s.player;
  // Foto das classificações ANTES de premiar esta corrida, para mostrar quem subiu e quem caiu.
  season.prevPos = positionMap(world);
  season.prevConPos = constructorPositionMap(world);
  if (!absent) p.stats.gp = (p.stats.gp ?? 0) + 1;
  const pointsBefore = p.seasonPoints ?? 0;
  const a = awardRace(w);
  const pos = a.classified.indexOf(p) + 1;
  const race = {
    n: season.raceIndex + 1, wet: a.wet, winner: a.winner, pole: a.pole,
    playerPos: absent ? null : (pos || null), missed: absent, event: eventId,
    grid: season.cur?.grid ?? null, points: (p.seasonPoints ?? 0) - pointsBefore,
    mapOrder: a.classified.map(d => ({ team: d.team, isPlayer: !!d.isPlayer, name: d.name })),
  };
  const mate = world.drivers.find(d => d.name === season.goal?.teammate);
  race.teammateName = mate?.name ?? null;
  race.teammatePos = mate && a.classified.includes(mate) ? a.classified.indexOf(mate) + 1 : null;
  const order = season.ordersLog.find((o) => o.race === race.n && (o.p1 === p.name || o.p2 === p.name));
  race.summary = raceSummary(race, season.cur, order, p.name);
  race.story = raceStory(race, season.cur, order, p, w.result.length, carRank(world, p.team), rng);
  const circuit = circuitFor(race.n);
  if (!absent && p.flag && p.flag === circuit.flag) {
    (s.f1.homeResults ??= []).push({ year: s.year, circuit: circuit.id, position: race.playerPos });
  }
  season.cur = null;
  season.races.push(race);
  season.lastRace = race;
  p.perfBonus = 0;
  p.dnfDelta = 0;
  p.buffs = (p.buffs ?? []).map((b) => ({ ...b, races: b.races - 1 })).filter((b) => b.races > 0);
  season.raceIndex += 1;

  if (season.raceIndex >= season.total) return endSeason(s, rng);
  if (season.raceIndex === Math.floor(season.total / 2) && openStory(s, rng, 'mid_season')) return undefined;
  s.pendingDecision = weekendDecision(s);
  return undefined;
}

// ---------------------------------------------------------------------------
// Fim de temporada
// ---------------------------------------------------------------------------

function endSeason(s, rng) {
  if (openStory(s, rng, 'season_end')) return;
  finalizeSeason(s, rng);
}

function finalizeSeason(s, rng) {
  const { world, season } = s.f1;
  const p = s.player;
  const tbi = teamsById(world);
  const result = summarizeSeason(
    world.drivers, tbi,
    season.races.map((r) => ({ wet: r.wet, winner: r.winner, pole: r.pole })),
    season.ordersLog,
  );
  const pos = result.standings.indexOf(p) + 1;
  const teammate = result.standings.find(d => d !== p && d.team === p.team);
  const leadsTeammate = !!teammate && p.seasonPoints > teammate.seasonPoints;
  const conPos = result.constructors.findIndex((c) => c.id === p.team) + 1;
  const seasonRank = carRank(world, p.team);
  const seasonTier = tierOf(seasonRank, world.teams.length, F1().carTierRank);
  const goal = goalProgress(s);
  const record = {
    year: s.year,
    team: p.team,
    teamName: teamName(world, p.team),
    position: pos,
    points: p.seasonPoints,
    teammate: teammate ? { name: teammate.name, points: teammate.seasonPoints } : null,
    wins: p.seasonWins,
    podiums: p.seasonPodiums,
    poles: p.seasonPoles,
    dnfs: p.seasonDnfs,
    champion: result.champion.name,
    constructorPos: conPos,
    status: p.status,
    standings: result.standings.slice(0, 10).map((d, i) => ({ pos: i + 1, name: d.name, team: d.team, points: d.seasonPoints, isPlayer: !!d.isPlayer })),
    ordersLog: season.ordersLog,
    goal,
  };
  p.seasonChampPos = pos;

  // Efeitos temporários do ano acabam aqui.
  p.skill -= p.skillTemp ?? 0;
  p.skillTemp = 0;
  p.buffs = [];
  s.f1.missRaces = 0;

  endYear(world, rng, result, tbi, season.devLog);

  if (pos === 2) p.stats.vice += 1;
  const F = F1().fame;
  if (pos === 1) p.fame += F.title;
  else if (pos <= 3) p.fame += F.top3;
  else if (record.points > 0) p.fame += F.points;

  // Pressão da equipe (perfil): ficar abaixo do esperado para o carro custa confiança, e mais em equipe de ponta.
  const pressureLoss = goal?.met ? 0 : trustPressure(goal?.tier ?? seasonTier, goal?.carRank ?? seasonRank, pos);
  if (pressureLoss < 0) {
    p.trust = Math.max(0, (p.trust ?? CONFIG.trust.trustStart) + pressureLoss);
    log(s, 'trust', `${record.teamName} esperava mais de você nesta temporada (${pressureLoss} de confiança).`);
  }
  const effects = evaluateTrustEffects(p, null, conPos, rng, leadsTeammate);
  if (effects.includes('lowTrustRelease')) {
    p.contract = 0;
    p.released = true;
    log(s, 'trust', `A ${record.teamName} perdeu a confiança em você e não vai renovar.`);
  }
  p.devFactor = effectiveDev(seasonTier, pos <= expectedPosition(seasonRank));
  p.skill = clampSkill(p, p.skill + (p.potential - p.skill) * F1().playerGrowthRate * (p.devFactor ?? 1));

  s.f1.seasons.push(record);
  s.f1.lastSeason = record;
  log(s, 'season', `${s.year} F1 (${record.teamName}): ${pos}º no mundial, ${record.wins} vitórias, ${record.points} pts.${pos === 1 ? ' CAMPEÃO!' : ''}`);
  s.year += 1;
  s.phase = 'F1_FIM_TEMPORADA';
  s.pendingDecision = null;
}

// Chamado pelo advance() a partir de F1_FIM_TEMPORADA.
export function openOffseason(s, rng) {
  const p = s.player;
  if (p.age >= F1().maxAge) return toLegacy(s, 'forced');
  if (p.age >= F1().retireDecisionAge) {
    s.phase = 'F1_OFERTAS';
    s.pendingDecision = {
      type: 'retire_or_continue',
      payload: {
        age: p.age,
        seasons: p.stats.seasons,
        options: [
          { id: 'continue', label: 'Continuar' },
          { id: 'retire', label: 'Encerrar a carreira', description: `Encerrar a carreira de ${p.stats.seasons} temporadas na F1?` },
        ],
      },
    };
    return undefined;
  }
  return openOffers(s, rng);
}

export function resolveRetire(s, rng, answer) {
  if (answer?.id === 'retire') return toLegacy(s, 'voluntary');
  if (answer?.id === 'continue') return openOffers(s, rng);
  throw new Error('id inválido (use "continue" ou "retire")');
}

// ---------------------------------------------------------------------------
// Ofertas e contrato
// ---------------------------------------------------------------------------

function weakestMate(world, teamId) {
  const mates = world.drivers.filter((d) => d.team === teamId && !d.isPlayer);
  if (mates.length === 0) return null;
  return mates.reduce((a, b) => (marketScore(a) <= marketScore(b) ? a : b));
}

// Resultados recentes complementam a estimativa de habilidade no mercado.
export function offerTrackRecord(seasons, teamId, freeAgent) {
  const cfg = F1().offerTrackRecord;
  const recent = seasons.slice(-cfg.seasons).filter(year => year.team === teamId);
  const wins = recent.filter(year => {
    const mate = year.teammate ?? year.standings?.find(d => !d.isPlayer && d.team === year.team);
    return mate && year.points > mate.points;
  }).length;
  const topFive = recent.filter(year => year.position >= 1 && year.position <= 5).length;
  const bonus = wins * cfg.teammateWin + topFive * cfg.topFive
    + (freeAgent && wins >= 2 && topFive ? cfg.freeAgentBonus : 0);
  return { wins, topFive, bonus };
}

function openOffers(s) {
  const { world } = s.f1;
  const p = s.player;
  s.phase = 'F1_OFERTAS';
  const expired = p.contract <= 0;

  // Contrato em vigor e sem cláusula de saída: nada a decidir.
  if (!expired && !p.exitClause) {
    log(s, 'contract', `Contrato com a ${teamName(world, p.team)} segue por mais ${p.contract} ano(s).`);
    return startNextYear(s);
  }

  const offers = [];
  if (!p.released) offers.push({ id: 'renew', teamId: p.team, kind: expired ? 'renew' : 'keep' });

  const record = offerTrackRecord(s.f1.seasons ?? [], p.team, expired);
  const myScore = marketScore(p) + (p.offerBonus ?? 0) + record.bonus;
  const others = world.teams
    .filter((t) => t.id !== p.team)
    .filter((t) => {
      const weak = weakestMate(world, t.id);
      return weak && myScore >= marketScore(weak) + F1().offerMargin;
    })
    .sort((a, b) => b.car - a.car)
    .slice(0, F1().maxOffers);
  for (const t of others) offers.push({ id: `move:${t.id}`, teamId: t.id, kind: 'move' });

  if (offers.length === 0) {
    log(s, 'offer', 'Nenhuma equipe quer você para a próxima temporada.');
    return toLegacy(s, 'forced');
  }
  s.pendingDecision = {
    type: 'offer_pick',
    payload: {
      scope: 'f1',
      releasedBy: p.released ? teamName(world, p.team) : null,
      options: offers.map((o) => {
        const rank = carRank(world, o.teamId);
        let why;
        if (o.kind === 'renew') why = 'Seu contrato acabou e a equipe quer renovar.';
        else if (o.kind === 'keep') why = 'Sua cláusula de saída deixa você ficar ou sair; ficar mantém o contrato.';
        else if (record.bonus) {
          const reasons = [];
          if (record.wins) reasons.push(record.wins === 1 ? 'superou seu companheiro em uma temporada recente' : `superou seu companheiro em ${record.wins} temporadas recentes`);
          if (record.topFive) reasons.push(record.topFive === 1 ? 'terminou uma temporada no top 5' : `terminou ${record.topFive} temporadas no top 5`);
          why = `A equipe viu que você ${reasons.join(' e ')}.`;
        } else why = `Você vale mais para o mercado que ${weakestMate(world, o.teamId)?.name ?? 'o piloto mais fraco'}, o piloto mais fraco dessa equipe.`;
        return { ...o, teamName: teamName(world, o.teamId), carRank: rank, carLabel: carLabel(rank), profile: profileView(tierOf(rank, world.teams.length, F1().carTierRank)), why, ...offerNotes(world, p, o, rank) };
      }),
    },
  };
  return undefined;
}

// Vantagens e riscos de uma oferta de F1, em frases curtas: carro, companheiro e confiança.
export function offerNotes(world, p, o, rank) {
  const pros = [];
  const cons = [];
  const T = F1().carTierRank;
  if (rank <= T.top) pros.push('Carro de ponta: dá para brigar por pódios e vitórias.');
  if (rank > T.mid) cons.push('Carro do fundo do grid: pontuar vai ser difícil.');
  if (rank <= T.top) cons.push('A equipe cobra resultado: ficar abaixo do esperado custa confiança.');

  // Companheiro depois da troca: quem sobra na equipe (na troca o jogador toma o lugar do mais fraco).
  let mate = world.drivers.find((d) => d.team === o.teamId && d !== p);
  let mateName = mate?.name;
  if (o.kind === 'move') {
    const weak = weakestMate(world, o.teamId);
    mate = world.drivers.find((d) => d.team === o.teamId && !d.isPlayer && d !== weak);
    mateName = mate?.name;
  }
  if (mate) {
    if (marketScore(p) >= marketScore(mate)) pros.push(`${mateName} é um companheiro mais fraco que você: boa chance de ser piloto 1.`);
    else cons.push(`${mateName} é mais forte que você: ser piloto 1 vai ser difícil.`);
  }
  if (o.kind === 'move') cons.push(`Trocar de equipe zera a confiança acumulada (volta para ${CONFIG.trust.trustStart}).`);
  else pros.push('Mantém a confiança acumulada com a equipe.');
  return { pros, cons, mate: mateName ?? null };
}

function exitClauseAllowed(world, p) {
  const C = F1().exitClause;
  const rank = [...world.drivers].sort((a, b) => marketScore(b) - marketScore(a)).indexOf(p) + 1;
  return p.fame >= C.minFame || rank <= C.minMarketRank;
}

export function resolveF1Offer(s, rng, answer) {
  const opt = s.pendingDecision.payload.options.find((o) => o.id === answer?.id);
  if (!opt) throw new Error('id de oferta inválido');
  const { world } = s.f1;
  const p = s.player;
  if (opt.kind === 'keep') {
    log(s, 'contract', `Cumpre o contrato com a ${opt.teamName}.`);
    return startNextYear(s);
  }
  s.pendingDecision = {
    type: 'contract_terms',
    payload: {
      offerId: opt.id,
      kind: opt.kind,
      teamId: opt.teamId,
      teamName: opt.teamName,
      options: {
        years: F1().contractYears,
        clauses: ['none', 'p1', 'equal'],
        exitClauseAllowed: exitClauseAllowed(world, p),
      },
    },
  };
  return undefined;
}

export function resolveContractTerms(s, rng, answer) {
  const pl = s.pendingDecision.payload;
  const { years, clause, exitClause = false } = answer ?? {};
  if (!pl.options.years.includes(years)) throw new Error(`years inválido (use ${pl.options.years.join(', ')})`);
  if (!pl.options.clauses.includes(clause)) throw new Error(`clause inválida (use ${pl.options.clauses.join(', ')})`);
  if (typeof exitClause !== 'boolean') throw new Error('exitClause deve ser boolean');
  if (exitClause && !pl.options.exitClauseAllowed) throw new Error('nenhuma equipe aceita cláusula de saída para você agora');

  const { world } = s.f1;
  const p = s.player;

  if (pl.kind === 'move') {
    const weaker = weakestMate(world, pl.teamId);
    if (weaker) {
      const from = makeAvailable(world, weaker);
      (world.lastMoves ??= []).push({ kind: 'available', name: weaker.name, nat: weaker.nat, from: teamName(world, from) });
    }
    log(s, 'transfer', `Troca a ${teamName(world, p.team)} pela ${pl.teamName}.`);
    p.team = pl.teamId;
    p.trust = CONFIG.trust.trustStart;
    // A vaga deixada pelo jogador é preenchida já, sem temporada com grid incompleto.
    const previousTeams = new Map(world.market.map(d => [d, d.prevTeam]));
    world.market = fillSeats(world.teams, world.drivers, world.market, rng, () => makeRookie(SURNAMES, rng, 'F2'), SISTER_TEAMS);
    for (const [d, from] of previousTeams) if (world.drivers.includes(d)) {
      world.lastMoves.push({ kind: 'transfer', name: d.name, nat: d.nat, from: teamName(world, from), to: teamName(world, d.team) });
    }
    assignReserves(world);
  } else {
    log(s, 'contract', `Renova com a ${pl.teamName}.`);
  }
  p.released = false;

  // Cláusula de status: p1 só se o jogador superar o companheiro por margem; senão pode haver contraproposta 'equal'.
  const mate = world.drivers.find((d) => d.team === p.team && d !== p);
  const S = CONFIG.status;
  let granted = null;
  if (clause === 'equal') granted = 'equal';
  else if (clause === 'p1') {
    const edge = mate ? marketScore(p) - marketScore(mate) : Infinity;
    if (edge >= S.statusClauseThreshold) granted = 'p1';
    else if (rng.chance(S.statusEqualCounterChance)) {
      granted = 'equal';
      log(s, 'contract', `A ${pl.teamName} recusou o status de piloto 1 e ofereceu tratamento igual.`);
    } else {
      log(s, 'contract', `A ${pl.teamName} recusou o status de piloto 1.`);
    }
  }
  p.statusClause = granted;
  p.contract = years;
  p.exitClause = exitClause;
  log(s, 'contract', `Contrato de ${years} ano(s)${granted ? `, status ${granted}` : ''}${exitClause ? ', com cláusula de saída' : ''}.`);
  return startNextYear(s);
}

// ---------------------------------------------------------------------------
// Aposentadoria e legado
// ---------------------------------------------------------------------------

// Nota de legado (spec-backend). Função pura sobre os agregados.
export function legacyScore(sum) {
  const L = CONFIG.legacy;
  return sum.titlesF1 * L.title + sum.vice * L.vice + sum.wins * L.win + sum.poles * L.pole
    + sum.podiums * L.podium + sum.points * L.point + sum.baseTitles * L.baseTitle
    + (sum.altRouteTitles ?? 0) * L.altRouteTitle;
}

function toLegacy(s, how) {
  const p = s.player;
  const st = p.stats;
  const sum = {
    how,
    retiredAge: p.age,
    seasons: st.seasons,
    titlesF1: st.titles,
    vice: st.vice,
    wins: st.wins,
    podiums: st.podiums,
    poles: st.poles,
    points: Math.round(st.points),
    baseTitles: p.baseStats?.titles ?? 0,
    altRouteTitles: 0,
  };
  sum.score = legacyScore(sum);
  s.legacy = sum;
  s.phase = 'LEGADO';
  s.pendingDecision = null;
  log(s, 'retire', `${how === 'voluntary' ? 'Encerra a carreira' : 'Sem lugar no grid, a carreira termina'} aos ${p.age} anos. Nota de legado: ${sum.score}.`);
}

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------

function devNarrative(world, devLog) {
  const lines = [];
  for (const t of world.teams) {
    const w = devLog?.[t.id] ?? [];
    const ok = w.filter((x) => x.outcome === 'success').length;
    const bad = w.filter((x) => x.outcome === 'fail').length;
    if (bad >= 1) lines.push(`${t.name} errou o conceito de um pacote e perdeu uma janela.`);
    else if (ok === w.length && w.length > 0) lines.push(`${t.name} acertou todos os pacotes de desenvolvimento.`);
  }
  return lines;
}

// Por que o jogador tem o status atual (espelha as regras de assignStatus, sem mostrar números de habilidade).
export function statusWhy(world, p) {
  if (!p.status) return null;
  const mate = world.drivers.find((d) => d.team === p.team && d !== p);
  if (!mate) return null;
  if (p.statusClause || mate.statusClause) return 'Definido pela cláusula de status do contrato.';
  const gap = p.skill - mate.skill;
  const near = Math.abs(gap) <= CONFIG.status.statusSkillGap;
  if (p.status === 'p1') return `Você é claramente mais rápido que ${mate.name}.`;
  if (p.status === 'p2') return `${mate.name} é claramente mais rápido que você.`;
  return near ? `Você e ${mate.name} estão no mesmo nível.` : 'O campeão do ano anterior nunca fica como piloto 2, então a equipe trata os dois igual.';
}

export function f1View(s) {
  const { world, season } = s.f1;
  const p = s.player;
  const decision = s.pendingDecision;
  const round = (season?.raceIndex ?? 0) + 1;
  const pending = season?.pendingRace?.w;
  const preStart = ['race_strategy', 'race_start'].includes(decision?.type);
  const mapDrivers = indices => indices.map(i => world.drivers[i]).filter(Boolean)
    .map(d => ({ team: d.team, isPlayer: !!d.isPlayer, name: d.name }));
  // Relato parcial da corrida em andamento, com os mesmos textos que entram no relato final.
  const cur = season?.cur;
  const notes = [
    cur?.strategy && { when: `Estratégia (${cur.strategy.label})`, text: cur.strategy.text },
    cur?.event && { when: cur.event, text: cur.eventText ?? 'Você teve de decidir na pista.' },
    cur?.pit && { when: 'Janela de box', text: cur.pit.text },
  ].filter(Boolean);
  const map = !season ? null : pending ? {
    circuit: circuitView(round), phase: decision.type,
    cars: preStart ? (season.cur?.mapGrid ?? decision.payload.gridRows ?? []) : mapDrivers(pending.result.filter(i => !pending.dnfs.includes(i))),
    interruption: decision?.payload.interruption ?? null, wet: !!(decision?.payload.wet ?? pending.wet), tyre: cur?.strategy?.label ?? null, notes,
  } : season.lastRace?.mapOrder ? {
    circuit: circuitView(season.lastRace.n), phase: 'finish', cars: season.lastRace.mapOrder,
    missed: season.lastRace.missed, wet: !!season.lastRace.wet, tyre: null, notes: season.lastRace.story ?? [],
  } : round <= season.total ? { circuit: circuitView(round), phase: 'waiting', cars: [] } : null;
  const eventPosition = decision?.type === 'race_event'
    ? decision.payload.position ?? (season?.pendingRace?.w ? raceCtx(s, deser(world, season.pendingRace.w)).pos : null)
    : null;
  const rank = carRank(world, p.team);
  // Variação de posição (positivo = subiu) em relação à classificação antes da última corrida.
  const hasDelta = !!season?.prevPos && season.raceIndex > 0;
  const standings = driverStandings(world)
    .map((d, i) => ({
      pos: i + 1, name: d.name, nat: d.nat ?? d.flag ?? null, team: d.team, points: d.seasonPoints ?? 0, isPlayer: !!d.isPlayer,
      delta: hasDelta ? (season.prevPos[d.name] ?? i + 1) - (i + 1) : 0,
    }));
  const constructors = constructorStandings(world).map((c, i) => ({
    pos: i + 1, id: c.id, name: c.name, points: c.points, isYours: c.id === p.team,
    delta: hasDelta ? (season.prevConPos?.[c.id] ?? i + 1) - (i + 1) : 0,
  }));
  const isLast = (r) => r && { story: r.story ?? [], n: r.n, circuit: circuitView(r.n), wet: r.wet, winner: r.winner, pole: r.pole, playerPos: r.playerPos, missed: !!r.missed, grid: r.grid ?? null, points: r.points ?? null, summary: r.summary ?? null };
  return {
    trainingFocus: s.f1.trainingFocus ?? 'balanced',
    trainingOptions: [{ id: 'balanced', label: 'Treino equilibrado' }, ...Object.entries(ATTRIBUTE_LABELS).map(([id, label]) => ({ id, label }))],
    roster: [...world.drivers, ...(world.market ?? []), ...(world.retired ?? []).map(d => ({ ...d, role: 'retired' }))].map((d, i) => ({
      id: d.id ?? `legacy-${i}-${d.name}`, name: d.name, age: d.age, nat: d.nat ?? d.flag ?? null,
      role: d.role ?? (d.team ? 'race' : 'free'), team: d.team ? teamName(world, d.team) : null,
      reserveTeam: d.reserveTeam ? teamName(world, d.reserveTeam) : null,
      overall: Math.round(d.skill * 10) / 10, attributes: attributeView(d), isPlayer: !!d.isPlayer,
      origin: d.origin ?? null, seasonsWithoutSeat: d.seasonsWithoutSeat ?? 0,
    })),
    plan: racePlan(s),
    plans: Object.entries(PLAN_LABELS).map(([id, label]) => ({ id, label, description: F1().approach[id].description })),
    goal: goalProgress(s),
    advice: raceAdvice(s),
    eventPosition,
    map,
    pitUpdate: season?.cur?.pit?.text ?? null,
    homeRounds: CIRCUITS.flatMap((c, i) => c.flag === p.flag ? [{ round: i + 1, gp: c.gp }] : []),
    team: { id: p.team, name: teamName(world, p.team), carRank: rank, carLabel: carLabel(rank), profile: profileView(tierOf(rank, world.teams.length, F1().carTierRank)) },
    status: p.status ?? null,
    statusWhy: statusWhy(world, p),
    races: (season?.races ?? []).map((r) => ({ story: r.story ?? [], n: r.n, circuit: circuitView(r.n), playerPos: r.playerPos, missed: !!r.missed, wet: r.wet, event: r.event ?? null, grid: r.grid ?? null, summary: r.summary ?? null, winner: r.winner ?? null, pole: r.pole ?? null })),
    trust: p.trust,
    trustReview: {
      threshold: CONFIG.trust.lowTrustCap,
      releaseChance: trustReleaseChance(standings.find(d => d.isPlayer)?.pos,
        standings.some(d => !d.isPlayer && d.team === p.team && p.seasonPoints > d.points)),
      baseReleaseChance: CONFIG.trust.lowTrustReleaseChance,
      strongSeasonTop: CONFIG.trust.strongSeasonTop,
    },
    contract: { years: p.contract, statusClause: p.statusClause, exitClause: p.exitClause },
    worldSeason: world.season,
    marketMoves: (world.lastMoves ?? []).slice(0, 12),
    race: season ? { done: season.raceIndex, total: season.total, circuit: season.raceIndex < season.total ? circuitView(season.raceIndex + 1) : null } : null,
    lastRace: season ? isLast(season.lastRace) : null,
    rival: season?.rival ?? null,
    lastEvent: season?.lastEventRace <= season?.raceIndex && RACE_EVENTS.some(e => e.id === s.f1.lastEvent?.id)
      ? null : s.f1.lastEvent,
    standings,
    constructors,
    ordersLog: season?.ordersLog ?? [],
    devNarrative: season ? devNarrative(world, season.devLog) : [],
    lastSeason: s.f1.lastSeason,
    seasons: s.f1.seasons,
  };
}
