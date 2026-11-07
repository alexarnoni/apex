// Loop do jogador: máquina de estados + contrato engine <-> UI (spec-loop-jogador).
// API pura: createCareer / advance / applyDecision / getView. O GameState é serializável
// e cada transição devolve um estado novo (o anterior nunca é mutado).
//
// Escopo: criação -> base (kart/F4/F3/F2) -> F1 (engine/f1.js) -> aposentadoria -> legado.
// Ainda fora: eventos narrativos (spec-conteudo) e ROTA_ALTERNATIVA (tela terminal por enquanto).

import { CONFIG } from './config.js';
import {
  enterF1, resolveSeasonFocus, resolveWeekendApproach, resolveTeamOrder,
  resolveStoryEvent, resolveRaceEvent, openOffseason, resolveRetire, resolveF1Offer, resolveContractTerms, f1View,
} from './f1.js';
import { createRng } from './rng.js';
import { applyAging, makeRookie, getRookieCounter, setRookieCounter } from './drivers.js';
import { createPlayer, runBaseSeasonSummary, pickTeamByTier, teamsByStrength } from './career.js';
import { BASE_TEAMS } from '../data/baseTeams.js';
import { CATEGORIES, BASE_LADDER } from '../data/categories.js';
import { SURNAMES } from '../data/names.js';
import { TEAMS_F1 } from '../data/world2026.js';

const STYLES = Object.keys(CONFIG.styles);

// Sobe quando o formato do estado ou as regras mudam de um jeito que invalida saves antigos.
export const ENGINE_VERSION = 1;

// Executa uma transição sobre uma cópia do estado, com RNG e contador de nomes restaurados.
function transition(state, fn) {
  const s = structuredClone(state);
  relinkPlayer(s);
  const rng = createRng(s.seed, s.rngState);
  setRookieCounter(s.rookieCounter);
  fn(s, rng);
  s.rngState = rng.getState();
  s.rookieCounter = getRookieCounter();
  return s;
}

// Na F1 o jogador vive dentro do mundo (s.f1.world). s.player aponta para o MESMO objeto; um
// snapshot JSON perde essa referência compartilhada, então a ligação é refeita a cada transição.
function relinkPlayer(s) {
  if (s.f1) s.player = s.f1.world.drivers.find((d) => d.isPlayer) ?? s.player;
}

function log(s, type, text) {
  s.careerLog.push({ year: s.year, type, text });
}

const nextCategoryId = (id) => BASE_LADDER[BASE_LADDER.indexOf(id) + 1] ?? 'f1';

export function createCareer({ surname, number, flag = null, style, seed } = {}) {
  if (!surname) throw new Error('surname obrigatório');
  if (!Number.isInteger(number) || number < 1 || number > 99) throw new Error('number deve ser 1-99');
  if (!STYLES.includes(style)) throw new Error(`style deve ser um de: ${STYLES.join(', ')}`);
  const realSeed = (seed ?? Date.now()) >>> 0;

  const blank = {
    engineVersion: ENGINE_VERSION,
    history: [],            // [{ type, answer }] de cada decisão: base de relatório de erro e de replay futuro
    seed: realSeed,
    rngState: realSeed,
    rookieCounter: 0,
    year: CONFIG.base.startYear,
    phase: 'CRIACAO',
    player: null,
    baseCareer: null,
    pendingDecision: null,
    careerLog: [],
  };

  const s = transition(blank, (st, rng) => {
    const player = createPlayer({ surname, number, style, rng });
    player.flag = flag;
    player.trust = CONFIG.trust.trustStart;
    player.academy = null;
    st.player = player;

    const kart = CATEGORIES.kart;
    const [lo, hi] = CONFIG.base.rivalSkillRange;
    const rivals = [];
    for (let i = 0; i < CONFIG.base.rivalCount; i++) {
      const r = makeRookie(SURNAMES, rng, 'rival de karting');
      r.age = player.age;
      r.skill = rng.range(lo, hi);
      r.lastResult = null;
      rivals.push(r);
    }
    st.baseCareer = {
      category: kart.id,
      seasonInCategory: 1,
      teamId: pickTeamByTier('kart', 'mid', rng).id,
      noOfferStreak: 0,
      rivals,
      mods: null,
      lastSummary: null,
    };
    const startTeam = BASE_TEAMS.kart.find((t) => t.id === st.baseCareer.teamId);
    log(st, 'start', `${surname} #${number} começa no ${kart.name} pela ${startTeam.name}, aos ${player.age} anos.`);
    st.phase = 'BASE_TEMPORADA';
    st.pendingDecision = baseChoiceDecision(st);
  });
  return s;
}

function baseChoiceDecision(s) {
  const cat = s.baseCareer.category;
  return { type: 'base_choice', payload: { category: cat, options: CONFIG.base.choices[cat] } };
}

// Avança até a próxima decisão pendente. Estados já parados numa decisão (ou numa tela terminal) voltam iguais.
export function advance(state) {
  if (state.pendingDecision) return state;
  if (state.phase === 'BASE_TEMPORADA') {
    return transition(state, (s) => { s.pendingDecision = baseChoiceDecision(s); });
  }
  if (state.phase === 'F1_FIM_TEMPORADA') {
    return transition(state, (s, rng) => openOffseason(s, rng));
  }
  return state;
}

export function applyDecision(state, answer) {
  const pd = state.pendingDecision;
  if (!pd) throw new Error('não há decisão pendente');
  const next = resolveDecision(state, pd, answer);
  next.history = [...(state.history ?? []), { type: pd.type, answer }];
  return next;
}

function resolveDecision(state, pd, answer) {
  switch (pd.type) {
    case 'base_choice': return transition(state, (s, rng) => resolveBaseChoice(s, rng, answer));
    case 'academy_invite': return transition(state, (s, rng) => resolveAcademyInvite(s, rng, answer));
    case 'offer_pick':
      return transition(state, (s, rng) => (pd.payload.scope === 'f1' ? resolveF1Offer : resolveOffer)(s, rng, answer));
    case 'season_focus': return transition(state, (s, rng) => resolveSeasonFocus(s, rng, answer));
    case 'weekend_approach': return transition(state, (s, rng) => resolveWeekendApproach(s, rng, answer));
    case 'team_order': return transition(state, (s, rng) => resolveTeamOrder(s, rng, answer));
    case 'story_event': return transition(state, (s, rng) => resolveStoryEvent(s, rng, answer));
    case 'race_event': return transition(state, (s, rng) => resolveRaceEvent(s, rng, answer));
    case 'contract_terms': return transition(state, (s, rng) => resolveContractTerms(s, rng, answer));
    case 'retire_or_continue': return transition(state, (s, rng) => resolveRetire(s, rng, answer));
    default: throw new Error(`decisão não implementada: ${pd.type}`);
  }
}

function resolveBaseChoice(s, rng, answer) {
  const bc = s.baseCareer;
  const choice = CONFIG.base.choices[bc.category][answer?.option];
  if (!choice) throw new Error('option inválida (use "A" ou "B")');
  const p = s.player;
  if (choice.skillGain) p.skill = Math.min(p.potential, p.skill + choice.skillGain);
  if (choice.fameGain) p.fame += choice.fameGain;
  bc.mods = {
    carBonus: choice.carBonus ?? 0,
    perfBonus: choice.perfBonus ?? 0,
    scoutingBonus: choice.scoutingBonus ?? 0,
    academyChanceBonus: choice.academyChanceBonus ?? 0,
  };

  const category = CATEGORIES[bc.category];
  const summary = runBaseSeasonSummary({
    player: p, category, rng, names: SURNAMES,
    persistentRivals: bc.rivals,
    playerTeamId: bc.teamId,
    hasAcademy: !!p.academy,
    carBonus: bc.mods.carBonus, perfBonus: bc.mods.perfBonus, scoutingBonus: bc.mods.scoutingBonus,
  });

  // Estatísticas, fama e rivais
  const st = p.stats;
  st.seasons += 1;
  st.gp = (st.gp ?? 0) + category.races;
  st.wins += p.seasonWins;
  st.podiums += p.seasonPodiums;
  st.poles += p.seasonPoles;
  st.points += p.seasonPoints;
  st.dnfs += p.seasonDnfs;
  if (summary.position === 1) { st.titles += 1; p.fame += CONFIG.base.fame.champion; }
  else if (summary.position <= 3) p.fame += CONFIG.base.fame.top3;
  summary.rivalResults.forEach((rr) => {
    const rival = bc.rivals.find((r) => r.name === rr.name);
    if (rival) rival.lastResult = { category: category.id, year: s.year, position: rr.position };
  });

  bc.lastSummary = { ...summary, year: s.year, category: category.id };
  log(s, 'season', `${s.year} ${category.name}: ${summary.position}º (${summary.wins} vitórias, ${summary.points} pts).`);

  // Convite de academia (só com oferta 'top', ainda sem academia)
  const A = CONFIG.base.academy;
  const inviteChance = A.baseInviteChance + bc.mods.academyChanceBonus;
  if (summary.offer === 'top' && !p.academy && rng.chance(inviteChance)) {
    const team = TEAMS_F1[rng.int(0, Math.min(A.teamPool, TEAMS_F1.length) - 1)];
    s.phase = 'BASE_OFERTAS';
    s.pendingDecision = { type: 'academy_invite', payload: { teamId: team.id, teamName: team.name } };
    return;
  }
  openOffers(s, rng);
}

function resolveAcademyInvite(s, rng, answer) {
  const { teamId, teamName } = s.pendingDecision.payload;
  if (answer?.accept === true) {
    s.player.academy = { teamId };
    log(s, 'academy', `${teamName} te colocou na academia de pilotos.`);
  }
  openOffers(s, rng);
}

// Monta o leque de ofertas. Sem oferta ('none') a carreira repete a categoria sozinha.
function openOffers(s, rng) {
  const bc = s.baseCareer;
  const tier = bc.lastSummary.offer;
  s.phase = 'BASE_OFERTAS';
  if (tier === 'none') {
    bc.noOfferStreak += 1;
    log(s, 'offer', 'Nenhuma oferta de subida: mais uma temporada na mesma categoria.');
    startNextSeason(s, rng, bc.category, bc.teamId);
    return;
  }
  const nextId = nextCategoryId(bc.category);
  const curName = CATEGORIES[bc.category].name;
  const curTeam = BASE_TEAMS[bc.category].find((t) => t.id === bc.teamId);
  const ups = upTeams(s, rng, nextId, tier).map(({ team, rank, n }) => ({
    id: `up:${team.id}`,
    kind: 'up',
    category: nextId,
    teamId: team.id,
    teamName: team.name,
    carRank: rank,
    carLabel: rankLabel(rank, n),
    academy: !!s.player.academy && (nextId === 'f1' ? team.id === s.player.academy.teamId : team.academy === s.player.academy.teamId),
    label: `Subir para ${CATEGORIES[nextId].name} pela ${team.name}`,
    consequence: null,
    why: tier === 'top'
      ? 'Sua nota de scouting foi alta: equipes de ponta querem você.'
      : 'Sua nota de scouting só convenceu equipes do fundo do grid.',
    ...upNotes(s, team, rank, n, nextId),
  }));
  s.pendingDecision = {
    type: 'offer_pick',
    payload: {
      scope: 'base',
      tier,
      options: [
        ...ups,
        { id: 'stay', kind: 'stay', category: bc.category, teamId: bc.teamId, teamName: curTeam.name, label: `Ficar na ${curTeam.name}`, consequence: `Mais um ano em ${curName}.`, why: 'Ficar dá mais um ano para melhorar a nota de scouting.',
          pros: ['Você já conhece a equipe e o carro.'],
          cons: ['Cada ano a mais na categoria aumenta a pressão de idade na nota de scouting.'] },
      ],
    },
  };
}

function shuffled(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Vantagens e riscos de uma oferta de subida, em frases curtas (a UI só lista).
function upNotes(s, team, rank, n, nextId) {
  const pros = [];
  const cons = ['A categoria de cima tem adversários mais fortes.'];
  if (rank <= 3) pros.push('Carro de ponta: dá para brigar por vitórias e chamar atenção.');
  if (rank > n - 3) cons.push('Carro do fundo do grid: é difícil impressionar os olheiros.');
  const ac = s.player.academy?.teamId;
  if (ac && (nextId === 'f1' ? team.id === ac : team.academy === ac)) pros.push('Ligada à sua academia: bônus na nota de scouting.');
  if (nextId === 'f1') pros.push('É a Fórmula 1: o objetivo da carreira de base.');
  return { pros, cons };
}

function rankLabel(rank, n) {
  if (rank <= 3) return 'equipe de ponta';
  if (rank > n - 3) return 'zebra';
  return 'meio do pelotão';
}

// Equipes da categoria de cima que fazem oferta: tier 'top' = entre as melhores, 'mid' = entre as piores.
// A equipe ligada à academia do jogador (se houver) sempre entra no leque.
function upTeams(s, rng, nextId, tier) {
  const sorted = nextId === 'f1' ? [...TEAMS_F1].sort((a, b) => b.car - a.car) : teamsByStrength(nextId);
  const size = CONFIG.base.tierPoolSize + 1;
  const pool = tier === 'top' ? sorted.slice(0, size) : sorted.slice(-size);
  const picked = shuffled(pool, rng).slice(0, CONFIG.base.offersPerTier[tier]);
  const ac = s.player.academy?.teamId;
  if (ac) {
    const extra = sorted.find((t) => (nextId === 'f1' ? t.id === ac : t.academy === ac));
    if (extra && !picked.includes(extra)) picked.push(extra);
  }
  return picked.sort((a, b) => sorted.indexOf(a) - sorted.indexOf(b)).map((t) => ({ team: t, rank: sorted.indexOf(t) + 1, n: sorted.length }));
}

function resolveOffer(s, rng, answer) {
  const bc = s.baseCareer;
  const opt = s.pendingDecision.payload.options.find((o) => o.id === answer?.id);
  if (!opt) throw new Error('id de oferta inválido (use um id da lista de ofertas)');
  bc.noOfferStreak = 0;
  s.pendingDecision = null;
  if (opt.kind === 'up' && opt.category === 'f1') {
    ageEveryone(s, rng);
    enterF1(s, rng, opt.teamId);
    return;
  }
  if (opt.kind === 'up') log(s, 'promotion', `Sobe para ${CATEGORIES[opt.category].name} pela ${opt.teamName}.`);
  startNextSeason(s, rng, opt.category, opt.teamId);
}

function ageEveryone(s, rng) {
  s.year += 1;
  applyAging(s.player, rng);
  // Talento jovem alcança o grid da categoria acima: fecha parte do gap até o potencial.
  const p = s.player;
  p.skill = Math.min(p.potential, p.skill + (p.potential - p.skill) * CONFIG.base.playerGrowthRate);
  for (const r of s.baseCareer.rivals) applyAging(r, rng);
}

function startNextSeason(s, rng, categoryId, teamId) {
  const bc = s.baseCareer;
  ageEveryone(s, rng);
  bc.seasonInCategory = categoryId === bc.category ? bc.seasonInCategory + 1 : 1;
  bc.category = categoryId;
  bc.teamId = teamId;
  bc.mods = null;

  const limit = CONFIG.base.altRouteAfterNoOfferSeasons;
  const tooOld = s.player.age > CATEGORIES[categoryId].typicalAge[1] + CONFIG.base.altRouteOverAge;
  if ((categoryId === 'f2' && bc.noOfferStreak >= limit) || tooOld) {
    s.phase = 'ROTA_ALTERNATIVA';
    s.pendingDecision = null;
    log(s, 'alt_route', 'Sem ofertas de subida: hora de procurar outro caminho.');
    return;
  }
  s.phase = 'BASE_TEMPORADA';
  s.pendingDecision = baseChoiceDecision(s);
}

// --- View: tudo que a UI precisa, sem expor o estado cru ---

function scoutingLine(summary) {
  const up = CATEGORIES[nextCategoryId(summary.category)].name;
  if (summary.offer === 'top') return `Os olheiros de ${up} anotaram seu nome: equipes de ponta querem conversar.`;
  if (summary.offer === 'mid') return `Há interesse de ${up}, mas só de equipes do fundo do grid.`;
  return 'Ninguém ligou. Os olheiros não viram o suficiente.';
}

// Totais da carreira inteira (base + F1) para a ficha e a vitrine de troféus.
export function careerTotals(state, p) {
  const base = state.f1 ? (p.baseStats ?? {}) : (p.stats ?? {});
  const f1 = state.f1 ? (p.stats ?? {}) : {};
  const n = (o, k) => o[k] ?? 0;
  return {
    gp: n(base, 'gp') + n(f1, 'gp'),
    wins: n(base, 'wins') + n(f1, 'wins'),
    podiums: n(base, 'podiums') + n(f1, 'podiums'),
    poles: n(base, 'poles') + n(f1, 'poles'),
    titlesBase: n(base, 'titles'),
    titlesF1: n(f1, 'titles'),
    titles: n(base, 'titles') + n(f1, 'titles'),
    vice: n(f1, 'vice'),
  };
}

// O potencial exato fica escondido: a UI mostra só uma faixa de 10 pontos ("estimativa dos olheiros").
export function potentialBand(potential) {
  const lo = Math.round((potential - 5) / 5) * 5;
  return [lo, lo + 10];
}

const num1 = (n) => (Math.round(n * 10) / 10).toLocaleString('pt-BR');
const signed = (n) => `${n >= 0 ? '+' : '−'}${num1(Math.abs(n))}`;

// Uma linha com o porquê da nota de scouting da temporada (parcelas somadas) e o que cada oferta exige.
export function scoutingWhy(sum) {
  const pr = sum.scoutingParts;
  if (!pr) return null;
  const T = CONFIG.scouting.offerThresholds;
  const bits = [`resultado (${sum.position}º) ${signed(pr.result)}`];
  if (pr.weakCar > 0) bits.push(`bateu carros melhores ${signed(pr.weakCar)}`);
  if (pr.academy) bits.push(`academia ${signed(pr.academy)}`);
  if (pr.fame) bits.push(`fama ${signed(pr.fame)}`);
  if (pr.age < 0) bits.push(`idade acima do típico ${signed(pr.age)}`);
  return `Nota ${num1(sum.scouting)}: ${bits.join(' · ')}. Equipes de ponta pedem ${T.top}; equipes do fundo do grid, ${T.mid}.`;
}

function rivalLine(r, playerPos) {
  if (!r.lastResult) return `${r.name} ainda não correu contra você.`;
  const { category, year, position } = r.lastResult;
  const catName = CATEGORIES[category].name;
  if (position < playerPos) return `${r.name} te venceu na ${catName} em ${year}.`;
  return `Você venceu ${r.name} na ${catName} em ${year}.`;
}

export function getView(state) {
  const { baseCareer: bc } = state;
  const p = state.f1 ? (state.f1.world.drivers.find((d) => d.isPlayer) ?? state.player) : state.player;
  const view = {
    screen: state.phase,
    seed: state.seed,
    engineVersion: state.engineVersion,
    year: state.year,
    player: {
      name: p.name, number: p.number, flag: p.flag, style: p.style, age: p.age, fame: p.fame, academy: p.academy, stats: p.stats,
      skill: Math.round(p.skill * 10) / 10,
      potentialBand: potentialBand(p.potential),
      career: careerTotals(state, p),
    },
    decision: state.pendingDecision,
    log: state.careerLog.slice(-10),
  };
  if (bc) {
    const sum = bc.lastSummary;
    view.base = {
      category: CATEGORIES[bc.category].name,
      team: BASE_TEAMS[bc.category].find((t) => t.id === bc.teamId)?.name ?? null,
      seasonInCategory: bc.seasonInCategory,
      rivals: bc.rivals.map((r) => rivalLine(r, sum?.position ?? Infinity)),
      lastSeason: sum && {
        year: sum.year,
        category: CATEGORIES[sum.category].name,
        teamName: sum.teamName,
        carRank: sum.carRank,
        position: sum.position,
        points: sum.points,
        wins: sum.wins,
        champion: sum.champion,
        rivalResults: sum.rivalResults,
        scouting: scoutingLine(sum),
        why: scoutingWhy(sum),
      },
    };
  }
  if (state.f1) view.f1 = f1View({ ...state, player: p });
  if (state.phase === 'LEGADO') view.legacy = state.legacy;
  if (state.phase === 'ROTA_ALTERNATIVA') view.note = 'Rotas alternativas ainda não implementadas.';
  return view;
}
