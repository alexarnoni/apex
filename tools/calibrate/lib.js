// Biblioteca comum das ferramentas de calibração (tools/calibrate/*.js). Só Node, sem dependências.
//
// Uso típico numa ferramenta:
//   const { flags, sets } = parseArgs(process.argv.slice(2));
//   const restore = applySets(sets);          // muda CONFIG/CATEGORIES só nesta execução
//   ... mede ...
//   restore();

import { createCareer, advance, applyDecision, getView } from '../../engine/game.js';
import { CONFIG } from '../../engine/config.js';
import { CATEGORIES } from '../../data/categories.js';

export { CONFIG, CATEGORIES, getView };

// --- argumentos: --n 300 --policy train --set talent.mean=84.5 --set teamProfile.ponta.development=1.1 -----------------
export function parseArgs(argv) {
  const flags = {};
  const sets = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    if (key === 'set') sets.push(val); else flags[key] = val;
  }
  return { flags, sets };
}

const parseValue = (raw) => { try { return JSON.parse(raw); } catch { return raw; } };

// "talent.mean=84.5" muda CONFIG.talent.mean. "category.f1.carWeight=0.6" muda CATEGORIES.f1.carWeight.
// Índices de lista funcionam ("lifecycle.ageCurve.5.min=-1.4"). Devolve uma função que desfaz tudo.
export function applySets(sets) {
  const savedConfig = JSON.parse(JSON.stringify(CONFIG));
  const savedCats = JSON.parse(JSON.stringify(CATEGORIES));
  for (const s of sets) {
    const [path, raw] = s.split('=');
    const parts = path.split('.');
    let target = CONFIG;
    let rest = parts;
    if (parts[0] === 'category') { target = CATEGORIES; rest = parts.slice(1); }
    for (const k of rest.slice(0, -1)) {
      if (target[k] === undefined) throw new Error(`caminho inexistente em --set ${s}`);
      target = target[k];
    }
    const last = rest.at(-1);
    if (!(last in target)) throw new Error(`chave inexistente em --set ${s}`);
    target[last] = parseValue(raw);
  }
  return () => {
    for (const k of Object.keys(CONFIG)) delete CONFIG[k];
    Object.assign(CONFIG, savedConfig);
    for (const k of Object.keys(CATEGORIES)) delete CATEGORIES[k];
    Object.assign(CATEGORIES, savedCats);
  };
}

// --- políticas de jogo (usam só a API pública do jogo) --------------------------------------------------------------
// a        : escolha 'A' na base, treina todo ano na F1, ofertas: a primeira (a melhor). É a política "histórica" das medições.
// train    : sempre escolhe a opção de treino na base (skillGain) e treina todo ano na F1.
// notrain  : nunca treina (base: opção sem skillGain; F1: foco "imagem").
export const POLICIES = ['a', 'train', 'notrain'];

export function answerFor(state, policy = 'a', { retireAt = 34 } = {}) {
  const pd = state.pendingDecision;
  switch (pd.type) {
    case 'base_choice': {
      const o = pd.payload.options;
      const keys = Object.keys(o);
      if (policy === 'train') return { option: keys.find((k) => o[k].skillGain) ?? keys[0] };
      if (policy === 'notrain') return { option: keys.find((k) => !o[k].skillGain) ?? keys[0] };
      return { option: 'A' };
    }
    case 'academy_invite': return { accept: true };
    case 'offer_pick': return pd.payload.scope === 'f1'
      ? { id: pd.payload.options[0].id }
      : { id: pd.payload.options.find((o) => o.kind === 'up')?.id ?? 'stay' };
    case 'season_focus': return { id: policy === 'notrain' ? 'image' : 'train' };
    case 'weekend_approach': return { id: pd.payload.out ? 'rest' : 'balanced' };
    case 'race_strategy':
    case 'race_finale': return { id: pd.payload.safe };
    case 'story_event':
    case 'race_event': return { id: pd.payload.options[0].id };
    case 'team_order': return { id: 'obey' };
    case 'contract_terms': return { years: 2, clause: 'none', exitClause: false };
    case 'retire_or_continue': return { id: state.player.age >= retireAt ? 'retire' : 'continue' };
    default: throw new Error(`tipo de decisão sem resposta na política: ${pd.type}. Atualize answerFor em tools/calibrate/lib.js`);
  }
}

// Joga uma carreira inteira (até o legado ou a rota alternativa) com a política escolhida.
// onState(s) é chamado a cada passo (útil para anotar a idade de entrada em cada categoria).
export function playCareer({ seed, age = null, policy = 'a', surname = 'Teste', number = 7, flag = 'BR', style = 'con', onState = null }) {
  let s = createCareer({ surname, number, flag, style, seed, age });
  for (let i = 0; i < 20000; i++) {
    if (onState) onState(s);
    if (s.phase === 'LEGADO' || s.phase === 'ROTA_ALTERNATIVA') return s;
    if (s.pendingDecision) s = applyDecision(s, answerFor(s, policy));
    else { const next = advance(s); if (next === s) return s; s = next; }
  }
  throw new Error(`a carreira da seed ${seed} não terminou`);
}

export const pct = (x, n) => `${(100 * x / n).toFixed(0)}%`;
export const avg = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
// Erro padrão de uma proporção, em pontos percentuais (para saber se uma diferença é ruído).
export const se = (p, n) => 100 * Math.sqrt((p * (1 - p)) / n);
