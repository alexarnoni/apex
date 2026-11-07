// UI do Apex. Só apresenta e coleta decisões: toda regra vive em engine/.
// Entrada única: createCareer / advance / applyDecision / getView (spec-loop-jogador).

import { createCareer, advance, applyDecision, getView, ENGINE_VERSION } from '../engine/game.js';
import { CATEGORIES, BASE_LADDER } from '../data/categories.js';
import { TEAMS_F1 } from '../data/world2026.js';
import { createSaves } from './saves.js';
import { buildFeedback, sendUrl, FEEDBACK_KINDS } from './feedback.js';

// Destino opcional do feedback (ex.: página "nova issue" de um repositório), definido no build
// com APEX_FEEDBACK_URL. Sem ele o formulário só copia o relatório.
// eslint-disable-next-line no-undef
const FEEDBACK_URL = typeof __FEEDBACK_URL__ !== 'undefined' ? __FEEDBACK_URL__ : '';

const FLAGS = ['BR', 'AR', 'PT', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'FI', 'JP', 'US', 'MX', 'AU'];
const STYLES = {
  agg: { name: 'Agressivo', text: 'Mais rápido na classificação, mas oscila mais e abandona mais.' },
  tec: { name: 'Técnico', text: 'Vai bem na chuva e ajuda a equipe a desenvolver o carro.' },
  con: { name: 'Consistente', text: 'Raramente abandona e pontua sempre, mas tem menos picos de velocidade.' },
};
const STATUS_TEXT = {
  p1: 'Você é piloto 1: a equipe prioriza você e as ordens de equipe correm a seu favor.',
  p2: 'Você é piloto 2: se estiver na frente do piloto 1, pode receber ordem para ceder posição.',
  equal: 'Tratamento igual: ninguém tem prioridade na equipe.',
};
const CLAUSE_TEXT = { none: 'Sem cláusula de status', p1: 'Exigir status de piloto 1', equal: 'Exigir tratamento igual' };
const TEAM_COLOR = Object.fromEntries(TEAMS_F1.map((t) => [t.id, t.color]));

let state = null;
let activeSlot = null; // slot onde a carreira em andamento é gravada a cada transição
let undoStack = []; // estados anteriores (só em memória); o estado é imutável, então desfazer é trocar de referência
const UNDO_MAX = 30;
let ui = { fb: { open: false, kind: 'bug', text: '', include: true, full: false, msg: '' }, autoSingle: true, notice: null, baseOpt: null, terms: { years: 2, clause: 'none', exit: false }, fullGrid: false, confirmNew: false, error: null, draft: { surname: '', number: '', flag: 'BR', style: 'con', seed: '' } };
let lastKey = '';

// --- util -------------------------------------------------------------------

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $app = () => document.getElementById('app');
const ord = (n) => `${n}º`;

// --- salvamento (slots no localStorage) ---------------------------------------

function pickStorage() {
  try {
    const s = window.localStorage;
    s.setItem('apex.probe', '1');
    s.removeItem('apex.probe');
    return s;
  } catch {
    return null; // bloqueado (modo privado, política do navegador)
  }
}

function describeCareer(s) {
  const v = getView(s);
  const where = v.f1 ? `F1 · ${v.f1.team.name}` : `${v.base?.category ?? ''}${v.base?.team ? ` · ${v.base.team}` : ''}`;
  return {
    title: `${v.player.flag ?? ''} #${v.player.number} ${v.player.name}`.trim(),
    detail: v.screen === 'LEGADO' ? `Carreira encerrada · legado ${v.legacy.score}` : `${where} · ${v.player.age} anos · ${v.year}`,
    seed: v.seed,
  };
}

const saves = createSaves({ storage: pickStorage(), version: ENGINE_VERSION, describe: describeCareer, validate: (s) => getView(s) });

// Grava a carreira no slot ativo. Se o navegador recusar, avisa uma vez e segue jogando.
function save() {
  if (activeSlot == null || !state) return;
  if (!saves.write(activeSlot, state)) {
    ui.saveWarn = true;
  }
}

function fmtDate(ms) {
  try { return new Date(ms).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); } catch { return ''; }
}

async function downloadFile(filename, text) {
  try {
    const claudeRt = window.claude;
    const downloads = claudeRt?.use ? await claudeRt.use('downloads') : null;
    if (downloads) {
      await downloads.save({ filename, data: text });
      ui.notice = 'Arquivo de save pronto. Guarde-o: dá para importar na tela inicial.';
    } else {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      ui.notice = `Arquivo ${filename} gerado.`;
    }
  } catch (e) {
    ui.notice = e?.code === 'declined' ? 'Download cancelado.' : 'Não foi possível gerar o arquivo neste navegador.';
  }
  render();
}

// --- transições ------------------------------------------------------------

function run(fn) {
  try {
    const before = state;
    state = fn(state);
    if (state !== before) { undoStack.push(before); if (undoStack.length > UNDO_MAX) undoStack.shift(); }
    ui.error = null;
    save();
  } catch (e) {
    ui.error = e.message || String(e);
  }
  render();
}

function undo() {
  if (!undoStack.length) return;
  state = undoStack.pop();
  ui.error = null;
  ui.baseOpt = null;
  save();
  render();
}

function errorReport() {
  return buildFeedback({ kind: 'bug', text: `Erro: ${ui.error}`, state, includeCareer: true, userAgent: navigator.userAgent });
}

// --- feedback (F.9) ---------------------------------------------------------

function currentFeedback() {
  const f = ui.fb;
  return buildFeedback({ kind: f.kind, text: f.text, state, includeCareer: f.include && !!state, fullHistory: f.full, userAgent: navigator.userAgent });
}

function feedbackPanel() {
  const f = ui.fb;
  const url = FEEDBACK_URL ? sendUrl(FEEDBACK_URL, { kind: f.kind, text: f.text, body: currentFeedback() }) : null;
  return `<section class="card focus" id="fb-panel"><div class="row" style="justify-content:space-between"><h2>Enviar feedback</h2><button class="btn ghost small" data-act="fb-close">Fechar</button></div>
    <p class="mute" style="font-size:14px">Conte o que aconteceu, o que achou fácil ou difícil, ou o que faltou. O relatório leva a seed e as últimas decisões para eu conseguir repetir a sua carreira.</p>
    <label class="field">Tipo<select id="fb-kind">${Object.entries(FEEDBACK_KINDS).map(([k, v]) => `<option value="${k}" ${f.kind === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
    <label class="field">O que aconteceu?<textarea id="fb-text" rows="5" maxlength="2000" style="font:inherit;font-size:16px;color:var(--fg);background:var(--panel2);border:1px solid var(--line);border-radius:3px;padding:10px;width:100%">${esc(f.text)}</textarea></label>
    <label class="row" style="gap:6px;font-size:14px"><input type="checkbox" id="fb-include" ${f.include && state ? 'checked' : ''} ${state ? '' : 'disabled'}> Incluir o resumo da carreira (seed, versão, últimas decisões)</label>
    <label class="row" style="gap:6px;font-size:14px"><input type="checkbox" id="fb-full" ${f.full ? 'checked' : ''} ${state ? '' : 'disabled'}> Incluir todas as decisões (maior, mas permite repetir o problema)</label>
    <div class="row"><button class="btn" data-act="fb-copy">Copiar feedback</button>
      ${url ? `<a class="btn ghost" id="fb-send" href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-act="fb-send">Enviar pelo GitHub</a>` : ''}
      <span class="mute" id="fb-msg">${esc(f.msg)}</span></div>
    ${f.fallback ? `<textarea id="fb-fallback" readonly rows="6" style="font:12px var(--f-mono);color:var(--fg);background:var(--panel2);border:1px solid var(--line);border-radius:3px;padding:8px;width:100%">${esc(f.fallback)}</textarea>` : ''}</section>`;
}

function copyFeedback() {
  const f = ui.fb;
  const say = (t) => { f.msg = t; const el = document.getElementById('fb-msg'); if (el) el.textContent = t; };
  if (!f.text.trim()) { say('Escreva o que aconteceu antes de copiar.'); return; }
  const text = currentFeedback();
  const manual = () => {
    f.msg = 'Não deu para copiar sozinho: o relatório está selecionado abaixo, copie com Ctrl+C.';
    f.fallback = text;
    render();
    document.getElementById('fb-fallback')?.select();
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => { f.fallback = ''; say('Feedback copiado. Cole na conversa com quem te passou o jogo.'); }, manual);
  } else manual();
}

function refreshSendLink() {
  const a = document.getElementById('fb-send');
  if (a && FEEDBACK_URL) a.href = sendUrl(FEEDBACK_URL, { kind: ui.fb.kind, text: ui.fb.text, body: currentFeedback() });
}
// Evento sem escolha de verdade (uma única opção): com o modo automático ligado, resolve sozinho.
function isNoChoice(pd) {
  return !!pd && (pd.type === 'story_event' || pd.type === 'race_event') && pd.payload.options.length === 1;
}
function settle(s) {
  let cur = s;
  while (ui.autoSingle && isNoChoice(cur.pendingDecision)) {
    cur = applyDecision(cur, { id: cur.pendingDecision.payload.options[0].id });
  }
  return cur;
}

const decide = (answer) => run((s) => settle(applyDecision(s, answer)));

// Simula até n corridas no modo equilibrado. Para sozinho numa decisão com escolha real
// (evento, ordem de equipe) ou no fim da temporada, e diz por que parou.
function simRaces(n) {
  run((s) => {
    const before = getView(s).f1.races.length;
    let cur = settle(s);
    let done = 0;
    while (done < n && cur.phase === 'F1_FIM_DE_SEMANA' && cur.pendingDecision?.type === 'weekend_approach') {
      cur = settle(applyDecision(cur, { id: cur.pendingDecision.payload.out ? 'rest' : 'balanced' }));
      done += 1;
    }
    const v = getView(cur);
    const ran = v.f1.races.slice(before);
    const results = ran.map((r) => (r.missed ? 'fora' : r.playerPos ? `P${r.playerPos}` : 'abandono')).join(' · ');
    const pd = cur.pendingDecision;
    let why = '';
    if (pd?.type === 'team_order') why = ' Parou: ordem de equipe para você decidir.';
    else if (pd?.type === 'race_event' || pd?.type === 'story_event') why = ' Parou: evento com escolha.';
    else if (!pd || cur.phase !== 'F1_FIM_DE_SEMANA') why = ' A temporada terminou.';
    ui.notice = ran.length ? `Corridas ${ran[0].n}–${ran.at(-1).n}: ${results}.${why}` : null;
    return cur;
  });
}

// --- peças ------------------------------------------------------------------

function ladder(view) {
  const inF1 = !!view.f1;
  const cur = view.base ? Object.values(CATEGORIES).find((c) => c.name === view.base.category)?.id : null;
  const ids = [...BASE_LADDER, 'f1'];
  const curIdx = inF1 ? ids.length - 1 : ids.indexOf(cur);
  return `<div class="ladder" role="img" aria-label="Pirâmide de categorias">${ids.map((id, i) =>
    `<div class="${i < curIdx ? 'done' : ''} ${i === curIdx ? 'now' : ''}">${esc(id === 'f1' ? 'F1' : id.toUpperCase())}</div>`).join('')}</div>`;
}

function header(view) {
  const p = view.player;
  return `<header class="bar">
    <div class="logo">Ap<b>e</b>x</div>
    <span class="chip">${esc(p.flag ?? '')} #${esc(p.number)} ${esc(p.name)}</span>
    <span class="chip">${esc(view.year)} · ${esc(p.age)} anos</span>
    <span class="chip" title="Use esta seed na criação para repetir a carreira">seed ${esc(view.seed)}</span>
    <button class="btn ghost small" data-act="undo" ${undoStack.length ? '' : 'disabled'}>Desfazer</button>
    <button class="btn ghost small" data-act="export-current">Salvar em arquivo</button>
    <button class="btn ghost small" data-act="fb-open">Feedback</button>
    <button class="btn ghost small" data-act="newgame">${saves.available ? 'Menu' : 'Sair'}</button>
  </header>${ui.confirmNew ? `<div class="note">Sem salvamento neste navegador: sair perde a carreira (use "Salvar em arquivo" antes). <button class="btn small" data-act="newgame-yes">Sair mesmo assim</button> <button class="btn ghost small" data-act="newgame-no">Cancelar</button></div>` : ''}
  ${ui.saveWarn ? `<div class="note err">O navegador recusou gravar a carreira. Ela continua nesta aba, mas use "Salvar em arquivo" para não perder.</div>` : ''}`;
}

function stat(label, value) { return `<div class="stat"><b>${esc(value)}</b><small>${esc(label)}</small></div>`; }

function playerStats(view) {
  const p = view.player;
  const st = p.stats;
  return `<div class="stats">
    ${stat('Fama', Math.round(p.fame * 10) / 10)}
    ${stat('Vitórias', st.wins)}
    ${stat('Pódios', st.podiums)}
    ${stat('Títulos', st.titles)}
    ${p.academy ? stat('Academia', p.academy.teamId.toUpperCase()) : ''}
  </div>`;
}

function towerRows(rows, limit = 10) {
  const shown = ui.fullGrid ? rows : rows.filter((r) => r.pos <= limit || r.isPlayer);
  let prev = 0;
  const out = [];
  for (const r of shown) {
    if (r.pos - prev > 1) out.push(`<tr><td colspan="4" class="mute" style="text-align:center">···</td></tr>`);
    prev = r.pos;
    out.push(`<tr class="${r.isPlayer ? 'you' : ''}">
      <td class="pos">${r.pos}</td>
      <td class="car"><i style="background:${esc(TEAM_COLOR[r.team] ?? 'var(--line)')}"></i></td>
      <td class="name">${esc(r.name)}</td>
      <td class="pts">${esc(r.points)}</td></tr>`);
  }
  return out.join('');
}

function tower(rows, title) {
  return `<section class="card"><h3>${esc(title)}</h3>
    <div class="scroll-x"><table class="tower"><tbody>${towerRows(rows)}</tbody></table></div>
    <button class="btn ghost small" data-act="grid" style="align-self:flex-start">${ui.fullGrid ? 'Mostrar só o top 10' : 'Ver grid completo'}</button></section>`;
}

function optionCards(options, act, selected = null) {
  return `<div class="grid2">${Object.entries(options).map(([id, o]) =>
    `<button class="opt ${selected === id ? 'on' : ''}" data-act="${act}" data-id="${esc(id)}"><strong>${esc(o.label)}</strong><span>${esc(o.description ?? '')}</span></button>`).join('')}</div>`;
}

function teamTag(f1) {
  return `<span class="team"><i style="background:${esc(TEAM_COLOR[f1.team.id] ?? 'var(--line)')}"></i><b>${esc(f1.team.name)}</b></span>`;
}

// --- telas ------------------------------------------------------------------

function slotRow(s) {
  const asking = ui.confirmDel === s.slot;
  let info;
  if (s.status === 'empty') info = `<div><b>Slot ${s.slot}</b> <span class="mute">livre</span></div>`;
  else if (s.status === 'ok') info = `<div style="min-width:0"><b>Slot ${s.slot} · ${esc(s.info.title)}</b><br><span class="mute">${esc(s.info.detail)} · seed ${esc(s.info.seed)} · salvo ${esc(fmtDate(s.savedAt))}</span></div>`;
  else if (s.status === 'old') info = `<div><b>Slot ${s.slot}</b> <span class="mute">salvo numa versão antiga do jogo (v${esc(s.version)}). Não dá para continuar; apague para liberar o slot.</span></div>`;
  else info = `<div><b>Slot ${s.slot}</b> <span class="mute">save corrompido. Apague para liberar o slot.</span></div>`;
  let actions = '';
  if (asking) {
    actions = `<span class="mute">Apagar de vez?</span> <button class="btn small" data-act="slot-del-yes" data-slot="${s.slot}">Sim, apagar</button> <button class="btn ghost small" data-act="slot-del-no">Cancelar</button>`;
  } else if (s.status === 'ok') {
    actions = `<button class="btn small" data-act="continue" data-slot="${s.slot}">Continuar</button> <button class="btn ghost small" data-act="export-slot" data-slot="${s.slot}">Salvar em arquivo</button> <button class="btn ghost small" data-act="slot-del" data-slot="${s.slot}">Apagar</button>`;
  } else if (s.status !== 'empty') {
    actions = `<button class="btn ghost small" data-act="slot-del" data-slot="${s.slot}">Apagar</button>`;
  }
  return `<div class="row" style="justify-content:space-between;border-top:1px solid var(--line);padding-top:10px">${info}<div class="row" style="gap:8px">${actions}</div></div>`;
}

function screenCreate() {
  const d = ui.draft;
  const list = saves.list();
  const free = list.filter((s) => s.status === 'empty');
  const slotField = !saves.available ? ''
    : free.length === 0 ? ''
      : `<label class="field">Salvar no slot<select id="f-slot">${free.map((s) => `<option value="${s.slot}" ${String(s.slot) === String(d.slot) ? 'selected' : ''}>Slot ${s.slot}</option>`).join('')}</select></label>`;
  const noSlots = saves.available && free.length === 0;
  return `<header class="bar"><div class="logo">Ap<b>e</b>x</div><span class="chip">protótipo</span><button class="btn ghost small" data-act="fb-open">Feedback</button></header>
  <section class="card">
    <h1>Do kart à glória</h1>
    <p class="mute">Você começa aos 14-16 anos no karting. Cada temporada de base tem uma decisão; quem for bem recebe ofertas e sobe até a Fórmula 1. Uma carreira dura uns 20 minutos.</p>
  </section>
  ${ui.notice ? `<div class="note">${esc(ui.notice)}</div>` : ''}
  ${saves.available ? `<section class="card focus"><h2>Suas carreiras</h2>
    <p class="mute" style="font-size:14px">O jogo salva sozinho a cada decisão, neste navegador. Para levar a carreira a outro lugar, use "Salvar em arquivo" e importe aqui.</p>
    ${list.map(slotRow).join('')}
    <label class="field">Importar de arquivo (.json)<input type="file" id="f-import" accept=".json,application/json"></label></section>`
    : `<div class="note err">Este navegador bloqueia o salvamento local. Dá para jogar, mas sair da página perde a carreira: use "Salvar em arquivo" durante o jogo.</div>`}
  <form class="card" id="create" autocomplete="off">
    <h2>Novo piloto</h2>
    <div class="grid2">
      <label class="field">Sobrenome<input type="text" id="f-surname" maxlength="18" value="${esc(d.surname)}" placeholder="Ex.: Fittipaldi"></label>
      <label class="field">Dorsal (1-99)<input type="number" id="f-number" min="1" max="99" value="${esc(d.number)}" placeholder="Ex.: 33"></label>
      <label class="field">Bandeira<select id="f-flag">${FLAGS.map((f) => `<option ${f === d.flag ? 'selected' : ''}>${f}</option>`).join('')}</select></label>
      <label class="field">Seed (opcional, repete uma carreira)<input type="text" id="f-seed" inputmode="numeric" value="${esc(d.seed)}" placeholder="vazio = aleatória"></label>
      ${slotField}
    </div>
    <h3>Estilo de pilotagem</h3>
    <div class="grid2">${Object.entries(STYLES).map(([id, s]) =>
      `<button type="button" class="opt ${d.style === id ? 'on' : ''}" data-act="style" data-id="${id}"><strong>${esc(s.name)}</strong><span>${esc(s.text)}</span></button>`).join('')}</div>
    <p class="mute" style="font-size:14px">Idade inicial sorteada entre 14 e 16 anos: mais novo começa menos pronto, mas tem teto de evolução maior.</p>
    ${noSlots ? '<div class="note">Os 3 slots estão ocupados. Apague uma carreira acima para começar outra.</div>' : ''}
    ${ui.error ? `<div class="note err">${esc(ui.error)}</div>` : ''}
    <div class="row"><button class="btn" type="submit" data-act="create" ${noSlots ? 'disabled' : ''}>Começar carreira</button></div>
  </form>`;
}
function seasonResultCard(view) {
  const ls = view.base?.lastSeason;
  if (!ls) return '';
  const rivals = ls.rivalResults.map((r) => `${esc(r.name)} ${ord(r.position)}`).join(' · ');
  return `<section class="card">
    <h3>${esc(ls.year)} · ${esc(ls.category)} · ${esc(ls.teamName)} <span class="chip">carro #${esc(ls.carRank)}</span></h3>
    <div class="row" style="align-items:flex-end;gap:24px"><div class="big">${ord(ls.position)}</div>
      <div class="stats">${stat('Pontos', ls.points)}${stat('Vitórias', ls.wins)}</div></div>
    ${ls.champion ? `<p class="mute">Campeão: ${esc(ls.champion)}</p>` : `<p><span class="pill good">Campeão</span></p>`}
    <p class="mute">Seus rivais: ${rivals}</p>
    <p class="note">${esc(ls.scouting)}</p>${ls.why ? `<p class="mute" style="font-size:14px">${esc(ls.why)}</p>` : ''}</section>`;
}

function screenBase(view) {
  const pd = view.decision;
  let body = '';
  if (pd?.type === 'base_choice') {
    const opts = pd.payload.options;
    body = `<section class="card focus"><h2>Pré-temporada</h2><p class="mute">Uma decisão antes de correr: presente ou futuro.</p>
      ${optionCards(opts, 'pick-base', ui.baseOpt)}
      <div class="row"><button class="btn" data-act="run-base" ${ui.baseOpt ? '' : 'disabled'}>Disputar temporada</button></div></section>`;
  } else if (pd?.type === 'academy_invite') {
    body = `<section class="card focus"><h2>Convite de academia</h2>
      <p>A <b>${esc(pd.payload.teamName)}</b> quer você na academia de pilotos. Isso melhora sua nota de scouting nas próximas temporadas.</p>
      <div class="row"><button class="btn" data-act="academy" data-id="yes">Aceitar</button><button class="btn ghost" data-act="academy" data-id="no">Recusar</button></div></section>`;
  } else if (pd?.type === 'offer_pick') {
    const cards = pd.payload.options.map((o) => {
      const sub = o.kind === 'up'
        ? `Carro: ${o.carLabel} (#${o.carRank})${o.academy ? ' · ligada à sua academia' : ''}`
        : o.consequence;
      const color = o.category === 'f1' && o.kind === 'up' ? TEAM_COLOR[o.teamId] : null;
      const label = color ? `<span class="team"><i style="background:${esc(color)}"></i>${esc(o.label)}</span>` : esc(o.label);
      return `<button class="opt" data-act="offer" data-id="${esc(o.id)}"><strong>${label}</strong><span>${esc(sub)}</span>${o.why ? `<span>${esc(o.why)}</span>` : ''}</button>`;
    }).join('');
    body = `<section class="card focus"><h2>Ofertas</h2><div class="grid2">${cards}</div></section>`;
  }
  const rivals = view.base.rivals.length
    ? `<section class="card"><h3>Seus rivais</h3><ul class="log">${view.base.rivals.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></section>` : '';
  return `${header(view)}${ladder(view)}
    <section class="card"><div class="row"><h2>${esc(view.base.category)}</h2><span class="chip">${esc(view.base.team)}</span><span class="chip">temporada ${esc(view.base.seasonInCategory)} na categoria</span></div>${playerStats(view)}</section>
    ${seasonResultCard(view)}${body}${rivals}`;
}

function raceLine(r) {
  if (!r) return '';
  const mine = r.playerPos ? `Você terminou em <b>P${r.playerPos}</b>.` : `<b class="pill bad">Abandono</b>`;
  return `<p>Corrida ${r.n}${r.wet ? ' · <span class="pill">chuva</span>' : ''}: ${mine} <span class="mute">Vitória: ${esc(r.winner ?? '—')} · Pole: ${esc(r.pole)}</span></p>`;
}

function f1Strip(view) {
  const f1 = view.f1;
  const trustPct = Math.round(f1.trust);
  const c = f1.contract;
  return `<section class="card">
    <div class="row">${teamTag(f1)}<span class="chip">carro: ${esc(f1.team.carLabel)} (#${esc(f1.team.carRank)})</span>
      ${f1.rival ? `<span class="chip">rival do ano: ${esc(f1.rival)}</span>` : ''}
      <span class="chip">contrato: ${esc(c.years)} ano(s)${c.statusClause ? ` · ${esc(c.statusClause)}` : ''}${c.exitClause ? ' · saída livre' : ''}</span></div>
    <p class="mute" style="font-size:14px">${esc(STATUS_TEXT[f1.status] ?? 'Seu status na equipe é definido no início da temporada.')}${f1.statusWhy ? ` <b>Por quê:</b> ${esc(f1.statusWhy)}` : ''}</p>
    <div><div class="row" style="justify-content:space-between"><small class="mute">CONFIANÇA DA EQUIPE</small><span class="num">${trustPct}</span></div>
      <div class="bar-meter"><i style="width:${trustPct}%"></i></div></div>
    ${playerStats(view)}</section>`;
}

function eventCard(pd) {
  const p = pd.payload;
  const act = pd.type === 'race_event' ? 'event' : 'event';
  return `<section class="card focus"><h3>${pd.type === 'race_event' ? 'Na pista' : 'Notícia'}</h3><h2>${esc(p.title)}</h2>
    <p>${esc(p.text)}</p>
    <div class="grid2">${p.options.map((o) => `<button class="opt" data-act="${act}" data-id="${esc(o.id)}"><strong>${esc(o.label)}</strong>${o.description ? `<span>${esc(o.description)}</span>` : ''}</button>`).join('')}</div></section>`;
}

function lastEventCard(f1) {
  return f1.lastEvent ? `<section class="card"><h3>${esc(f1.lastEvent.title)}</h3><p>${esc(f1.lastEvent.text)}</p></section>` : '';
}

function screenF1(view) {
  const f1 = view.f1;
  const pd = view.decision;
  let body = '';
  let title = '';
  const r = f1.race;
  if (view.screen === 'F1_PRE_TEMPORADA') {
    title = `Pré-temporada ${f1.worldSeason + 1}`;
    body = pd.type === 'story_event' ? eventCard(pd)
      : `<section class="card focus"><h2>Foco do ano</h2><p class="mute">Uma escolha por temporada.</p>${optionCards(pd.payload.options, 'focus')}</section>`;
  } else if (view.screen === 'F1_FIM_DE_SEMANA' && pd) {
    title = r.done >= r.total ? `Temporada ${f1.worldSeason} · fim do campeonato` : `Temporada ${f1.worldSeason} · corrida ${r.done + 1} de ${r.total}`;
    const prog = `<div class="bar-meter"><i style="width:${Math.round((r.done / r.total) * 100)}%"></i></div>`;
    if (pd.type === 'story_event' || pd.type === 'race_event') {
      body = eventCard(pd);
    } else if (pd.type === 'team_order') {
      const p = pd.payload;
      body = `<section class="card focus"><h2>Ordem de equipe</h2>
        <p>Rádio: <b>"${esc(p.p1)} é mais rápido. Deixe-o passar."</b> Você está em P${esc(p.fromPosition)}.</p>
        <div class="grid2">${p.options.map((o) => `<button class="opt" data-act="order" data-id="${o.id}"><strong>${esc(o.label)}</strong><span>${esc(o.description)}</span></button>`).join('')}</div></section>`;
    } else {
      body = `<section class="card focus"><h2>${pd.payload.out ? 'Você está fora desta corrida' : 'Abordagem do fim de semana'}</h2>${optionCards(pd.payload.options, 'approach')}
        <div class="row"><button class="btn ghost small" data-act="sim5">Simular 5 corridas</button><button class="btn ghost small" data-act="simrest">Simular o resto da temporada</button></div>
        <label class="row" style="gap:6px;font-size:14px;color:var(--mute)"><input type="checkbox" id="t-auto" ${ui.autoSingle ? 'checked' : ''}> Resolver sozinho eventos sem escolha</label>
        <p class="mute" style="font-size:14px">A simulação usa a abordagem equilibrada e para quando há uma decisão sua.</p></section>`;
    }
    body = `${prog}${body}`;
  }
  const dev = f1.devNarrative.length && f1.race?.done === 0
    ? `<section class="card"><h3>Desenvolvimento dos carros</h3><ul class="log">${f1.devNarrative.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></section>` : '';
  const last = f1.lastRace && view.screen === 'F1_FIM_DE_SEMANA' ? `<section class="card">${raceLine(f1.lastRace)}</section>` : '';
  const standTitle = view.screen === 'F1_PRE_TEMPORADA' ? 'Grid (classificação do ano anterior)' : 'Campeonato de pilotos';
  return `${header(view)}${ladder(view)}
    <h2>${esc(title)}</h2>${f1Strip(view)}${lastEventCard(f1)}${body}${last}${dev}${tower(f1.standings, standTitle)}`;
}

function screenEndSeason(view) {
  const ls = view.f1.lastSeason;
  const champ = ls.position === 1;
  const orders = ls.ordersLog.filter((o) => o.p2 === view.player.name || o.p1 === view.player.name);
  return `${header(view)}${ladder(view)}${lastEventCard(view.f1)}
    <section class="card focus"><h3>Fim da temporada · ${esc(ls.teamName)}</h3>
      <div class="row" style="align-items:flex-end;gap:24px"><div class="big">${ord(ls.position)}</div>
        <div class="stats">${stat('Pontos', ls.points)}${stat('Vitórias', ls.wins)}${stat('Pódios', ls.podiums)}${stat('Poles', ls.poles)}${stat('Abandonos', ls.dnfs)}</div></div>
      ${champ ? `<p><span class="pill good">CAMPEÃO MUNDIAL</span></p>` : `<p class="mute">Campeão: ${esc(ls.champion)} · Sua equipe terminou em ${ord(ls.constructorPos)} no construtores.</p>`}
      ${orders.length ? `<p class="mute">Ordens de equipe com você: ${orders.map((o) => `corrida ${o.race}${o.defied ? ' (desafiou)' : ' (obedeceu)'}`).join(', ')}.</p>` : ''}
      <div class="row"><button class="btn" data-act="next">Continuar</button></div></section>
    <section class="card"><h3>Classificação final</h3><div class="scroll-x"><table class="tower"><tbody>
      ${ls.standings.map((r) => `<tr class="${r.isPlayer ? 'you' : ''}"><td class="pos">${r.pos}</td><td class="car"><i style="background:${esc(TEAM_COLOR[r.team] ?? 'var(--line)')}"></i></td><td class="name">${esc(r.name)}</td><td class="pts">${esc(r.points)}</td></tr>`).join('')}
    </tbody></table></div></section>`;
}

function screenOffers(view) {
  const pd = view.decision;
  let body = '';
  if (pd.type === 'retire_or_continue') {
    body = `<section class="card focus"><h2>Fim de temporada, ${esc(pd.payload.age)} anos</h2>
      <p class="mute">${esc(pd.payload.seasons)} temporada(s) na F1. Continuar ou encerrar a carreira?</p>
      <div class="row"><button class="btn" data-act="retire" data-id="continue">Continuar</button><button class="btn ghost" data-act="retire" data-id="retire">Encerrar a carreira</button></div></section>`;
  } else if (pd.type === 'offer_pick') {
    body = `<section class="card focus"><h2>Mercado de pilotos</h2><div class="grid2">${pd.payload.options.map((o) => {
      const verb = o.kind === 'renew' ? 'Renovar com' : o.kind === 'keep' ? 'Cumprir contrato com' : 'Assinar com';
      return `<button class="opt" data-act="offer" data-id="${esc(o.id)}"><strong>${verb} ${esc(o.teamName)}</strong><span>Carro: ${esc(o.carLabel)} (#${esc(o.carRank)})</span>${o.why ? `<span>${esc(o.why)}</span>` : ''}</button>`;
    }).join('')}</div></section>`;
  } else if (pd.type === 'contract_terms') {
    const o = pd.payload.options;
    const t = ui.terms;
    body = `<section class="card focus"><h2>Contrato · ${esc(pd.payload.teamName)}</h2>
      <h3>Duração</h3><div class="radio">${o.years.map((y) => `<label><input type="radio" name="t-years" value="${y}" ${t.years === y ? 'checked' : ''}>${y} ano(s)</label>`).join('')}</div>
      <p class="mute" style="font-size:14px">Mais longo dá segurança. Mais curto deixa você livre para surfar o mercado.</p>
      <h3>Status na equipe</h3><div class="radio">${o.clauses.map((c) => `<label><input type="radio" name="t-clause" value="${c}" ${t.clause === c ? 'checked' : ''}>${esc(CLAUSE_TEXT[c])}</label>`).join('')}</div>
      <p class="mute" style="font-size:14px">A equipe só aceita piloto 1 se você for claramente melhor que o companheiro. Pode haver contraproposta.</p>
      <h3>Cláusula de saída</h3>
      <label class="radio"><span style="display:flex;gap:6px;align-items:center;${o.exitClauseAllowed ? '' : 'opacity:.5'}"><input type="checkbox" id="t-exit" ${o.exitClauseAllowed ? '' : 'disabled'} ${t.exit && o.exitClauseAllowed ? 'checked' : ''}>Poder sair no fim de qualquer temporada</span></label>
      ${o.exitClauseAllowed ? '' : '<p class="mute" style="font-size:14px">Nenhuma equipe aceita isso ainda: precisa de fama 10+ ou estar entre os 6 pilotos mais valiosos do grid.</p>'}
      <div class="row"><button class="btn" data-act="terms">Assinar contrato</button></div></section>`;
  }
  return `${header(view)}${ladder(view)}${f1Strip(view)}${body}`;
}

function summaryText(view) {
  const l = view.legacy;
  const p = view.player;
  const seasons = view.f1.seasons.map((s) => `${s.year} ${s.teamName} ${s.position}º ${s.points}pts ${s.wins}v`).join('; ');
  return [
    `APEX · ${p.name} #${p.number} (${p.flag}) · estilo ${STYLES[p.style].name} · seed ${state.seed}`,
    `Legado ${l.score} · ${l.seasons} temporadas · ${l.titlesF1} títulos · ${l.vice} vice · ${l.wins} vitórias · ${l.podiums} pódios · ${l.poles} poles · ${l.points} pts · base: ${l.baseTitles} títulos · parou aos ${l.retiredAge}`,
    seasons,
  ].join('\n');
}

function screenLegacy(view) {
  const l = view.legacy;
  return `${header(view)}${ladder(view)}
    <section class="card focus"><h3>${l.how === 'voluntary' ? 'Carreira encerrada' : 'Sem lugar no grid'} · aos ${esc(l.retiredAge)} anos</h3>
      <div class="row" style="align-items:flex-end;gap:24px"><div class="big">${esc(l.score)}</div><small class="mute">NOTA DE LEGADO</small></div>
      <div class="stats">${stat('Títulos F1', l.titlesF1)}${stat('Vice', l.vice)}${stat('Vitórias', l.wins)}${stat('Pódios', l.podiums)}${stat('Poles', l.poles)}${stat('Pontos', l.points)}${stat('Temporadas', l.seasons)}${stat('Títulos na base', l.baseTitles)}</div>
      <div class="row"><button class="btn" data-act="copy">Copiar resumo</button><button class="btn ghost" data-act="newgame-yes">Nova carreira</button></div>
      <p class="mute" style="font-size:14px" id="copy-msg">Cole o resumo no chat de quem está testando, junto com o que achou da carreira.</p>
      <textarea id="summary" readonly rows="4" style="font:12px var(--f-mono);width:100%;background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:3px;padding:8px">${esc(summaryText(view))}</textarea></section>
    <section class="card"><h3>Linha do tempo</h3><div class="scroll-x"><table class="tower"><tbody>
      ${view.f1.seasons.map((s) => `<tr><td class="pos">${esc(s.year)}</td><td class="car"><i style="background:${esc(TEAM_COLOR[s.team] ?? 'var(--line)')}"></i></td><td class="name">${esc(s.teamName)}</td><td class="pts">${ord(s.position)} · ${esc(s.points)} pts${s.position === 1 ? ' ★' : ''}</td></tr>`).join('')}
    </tbody></table></div></section>`;
}

function screenAlt(view) {
  return `${header(view)}${ladder(view)}
    <section class="card focus"><h2>Fim da linha</h2>
      <p>Os olheiros pararam de ligar e a carreira não chegou à Fórmula 1. As rotas alternativas (Super Fórmula, IndyCar, Fórmula E) ainda não existem neste protótipo.</p>
      <div class="row"><button class="btn" data-act="newgame-yes">Nova carreira</button></div></section>
    ${view.base ? seasonResultCard(view) : ''}`;
}

// --- render ----------------------------------------------------------------

function render() {
  const el = $app();
  if (!state) { el.innerHTML = (ui.fb.open ? feedbackPanel() : '') + screenCreate(); return; }
  const view = getView(state);
  let html;
  switch (view.screen) {
    case 'BASE_TEMPORADA':
    case 'BASE_OFERTAS': html = screenBase(view); break;
    case 'F1_PRE_TEMPORADA':
    case 'F1_FIM_DE_SEMANA': html = screenF1(view); break;
    case 'F1_FIM_TEMPORADA': html = screenEndSeason(view); break;
    case 'F1_OFERTAS': html = screenOffers(view); break;
    case 'LEGADO': html = screenLegacy(view); break;
    case 'ROTA_ALTERNATIVA': html = screenAlt(view); break;
    default: html = `<div class="note err">Tela desconhecida: ${esc(view.screen)}</div>`;
  }
  if (ui.notice) html = `<div class="note">${esc(ui.notice)}</div>${html}`;
  if (ui.error) html = `<div class="note err" role="alert">${esc(ui.error)} <button class="btn ghost small" data-act="copy-error">Copiar relatório do erro</button> <span class="mute" id="err-msg"></span></div>${html}`;
  el.innerHTML = (ui.fb.open ? feedbackPanel() : '') + html;
  const key = `${view.screen}|${view.decision?.type ?? ''}|${view.year}|${view.f1?.race?.done ?? ''}`;
  if (key !== lastKey) { lastKey = key; window.scrollTo(0, 0); }
}

// --- eventos -----------------------------------------------------------------

function readDraft() {
  const g = (id) => document.getElementById(id)?.value ?? '';
  ui.draft = { ...ui.draft, surname: g('f-surname'), number: g('f-number'), flag: g('f-flag') || 'BR', seed: g('f-seed'), slot: g('f-slot') || ui.draft.slot };
}

function startCareer() {
  readDraft();
  const d = ui.draft;
  try {
    const seed = d.seed.trim() === '' ? undefined : Number(d.seed);
    if (seed !== undefined && !Number.isFinite(seed)) throw new Error('Seed deve ser um número.');
    let slot = null;
    if (saves.available) {
      slot = Number(d.slot) || saves.firstEmpty();
      if (slot == null || saves.list()[slot - 1].status !== 'empty') throw new Error('Escolha um slot livre (apague uma carreira antes, se estiverem todos ocupados).');
    }
    state = createCareer({ surname: d.surname.trim(), number: Number(d.number), flag: d.flag, style: d.style, seed });
    activeSlot = slot;
    undoStack = [];
    ui.error = null;
    ui.notice = null;
    ui.baseOpt = null;
    ui.saveWarn = false;
    save();
  } catch (e) {
    ui.error = e.message.includes('surname') ? 'Informe um sobrenome.' : e.message.includes('number') ? 'O dorsal deve ser um número de 1 a 99.' : e.message;
  }
  render();
}

// Volta ao menu sem apagar nada: a carreira já está gravada no slot.
function toMenu() {
  state = null; activeSlot = null; undoStack = []; ui.confirmNew = false; ui.confirmDel = null; ui.baseOpt = null; ui.error = null; ui.saveWarn = false; lastKey = '';
  render();
}

function importFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const st = saves.parseImport(String(reader.result));
      const slot = saves.firstEmpty();
      if (slot == null) throw new Error('Sem slot livre: apague uma carreira antes de importar.');
      if (!saves.write(slot, st)) throw new Error('O navegador recusou gravar o save importado.');
      ui.notice = `Carreira importada no slot ${slot}.`;
    } catch (e) { ui.notice = e.message; }
    render();
  };
  reader.onerror = () => { ui.notice = 'Não foi possível ler o arquivo.'; render(); };
  reader.readAsText(file);
}

document.addEventListener('input', (e) => {
  if (e.target.id === 'fb-text') { ui.fb.text = e.target.value; ui.fb.msg = ''; ui.fb.fallback = ''; document.getElementById('fb-fallback')?.remove(); refreshSendLink(); }
});

document.addEventListener('submit', (e) => { if (e.target.id === 'create') { e.preventDefault(); startCareer(); } });

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.name === 't-years') ui.terms.years = Number(t.value);
  else if (t.name === 't-clause') ui.terms.clause = t.value;
  else if (t.id === 't-exit') ui.terms.exit = t.checked;
  else if (t.id === 'f-import' && t.files?.[0]) importFile(t.files[0]);
  else if (t.id === 'fb-kind') { ui.fb.kind = t.value; refreshSendLink(); }
  else if (t.id === 'fb-include') { ui.fb.include = t.checked; refreshSendLink(); }
  else if (t.id === 'fb-full') { ui.fb.full = t.checked; refreshSendLink(); }
  else if (t.id === 't-auto') { ui.autoSingle = t.checked; run((s) => settle(s)); }
});

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  const id = el.dataset.id;
  const slot = Number(el.dataset.slot);
  ui.notice = null;
  switch (act) {
    case 'create': return; // tratado pelo submit
    case 'style': readDraft(); ui.draft.style = id; return render();
    case 'continue': {
      const st = saves.load(slot);
      if (!st) { ui.notice = 'Não foi possível abrir esse save.'; return render(); }
      state = st; activeSlot = slot; undoStack = []; ui.error = null; ui.saveWarn = false; lastKey = '';
      return render();
    }
    case 'slot-del': ui.confirmDel = slot; return render();
    case 'slot-del-no': ui.confirmDel = null; return render();
    case 'slot-del-yes': saves.remove(slot); ui.confirmDel = null; ui.notice = `Slot ${slot} apagado.`; return render();
    case 'export-current': { const { filename, text } = saves.exportFile(state); return downloadFile(filename, text); }
    case 'export-slot': { const st = saves.load(slot); if (!st) { ui.notice = 'Não foi possível abrir esse save.'; return render(); } const { filename, text } = saves.exportFile(st); return downloadFile(filename, text); }
    case 'newgame': if (saves.available) return toMenu(); ui.confirmNew = !ui.confirmNew; return render();
    case 'newgame-no': ui.confirmNew = false; return render();
    case 'newgame-yes': return toMenu();
    case 'grid': ui.fullGrid = !ui.fullGrid; return render();
    case 'pick-base': ui.baseOpt = id; return render();
    case 'run-base': { const o = ui.baseOpt; ui.baseOpt = null; return decide({ option: o }); }
    case 'academy': return decide({ accept: id === 'yes' });
    case 'offer': return decide({ id });
    case 'focus': return decide({ id });
    case 'approach': return decide({ id });
    case 'event': return decide({ id });
    case 'order': return decide({ id });
    case 'simrest': return simRaces(Infinity);
    case 'sim5': return simRaces(5);
    case 'next': return run((s) => settle(advance(s)));
    case 'retire': return decide({ id });
    case 'terms': ui.terms = { years: ui.terms.years, clause: ui.terms.clause, exit: ui.terms.exit }; return decide({ years: ui.terms.years, clause: ui.terms.clause, exitClause: ui.terms.exit });
    case 'copy': return copySummary();
    case 'undo': return undo();
    case 'copy-error': return copyErrorReport();
    case 'fb-open': ui.fb.open = true; ui.fb.msg = ''; if (ui.error && !ui.fb.text) ui.fb.text = `Erro: ${ui.error}\n`; render(); document.getElementById('fb-text')?.focus(); return undefined;
    case 'fb-close': ui.fb.open = false; return render();
    case 'fb-copy': return copyFeedback();
    case 'fb-send': if (!ui.fb.text.trim()) { e.preventDefault(); ui.fb.msg = 'Escreva o que aconteceu antes de enviar.'; const m = document.getElementById('fb-msg'); if (m) m.textContent = ui.fb.msg; } return undefined;
    default:
  }
});

function copyErrorReport() {
  const text = errorReport();
  const msg = document.getElementById('err-msg');
  const say = (t) => { if (msg) msg.textContent = t; };
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => say('Relatório copiado.'), () => say(text));
  else say(text);
}

function copySummary() {
  const ta = document.getElementById('summary');
  const msg = document.getElementById('copy-msg');
  const done = (ok) => { if (msg) msg.textContent = ok ? 'Resumo copiado.' : 'Não deu para copiar sozinho: o texto abaixo está selecionado, copie com Ctrl+C.'; };
  const fallback = () => { ta.focus(); ta.select(); done(false); };
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(ta.value).then(() => done(true), fallback);
  else fallback();
}

// --- boot ---------------------------------------------------------------------

render();
