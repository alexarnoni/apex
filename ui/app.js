// UI da Bandeirada. Só apresenta e coleta decisões: toda regra vive em engine/.
// Entrada única: createCareer / advance / applyDecision / getView (spec-loop-jogador).

import { createCareer, advance, applyDecision, getView, ENGINE_VERSION } from '../engine/game.js';
import { CATEGORIES, BASE_LADDER } from '../data/categories.js';
import { TEAMS_F1 } from '../data/world2026.js';
import { createSaves } from './saves.js';
import { buildFeedback, careerSnapshot, sendUrl, feedbackPayload, sendFeedback, FEEDBACK_KINDS } from './feedback.js';

// Destino opcional do feedback (ex.: página "nova issue" de um repositório), definido no build
// com BANDEIRADA_FEEDBACK_URL. Sem ele o formulário só copia o relatório.
// eslint-disable-next-line no-undef
const FEEDBACK_URL = typeof __FEEDBACK_URL__ !== 'undefined' ? __FEEDBACK_URL__ : '';
// Endereço do Worker que recebe o feedback e o envia por e-mail (definido no build).
// eslint-disable-next-line no-undef
const FEEDBACK_ENDPOINT = typeof __FEEDBACK_ENDPOINT__ !== 'undefined' ? __FEEDBACK_ENDPOINT__ : '';
// Análise de uso (GoatCounter) só existe se o build recebeu BANDEIRADA_GOATCOUNTER.
// eslint-disable-next-line no-undef
const ANALYTICS = typeof __ANALYTICS__ !== 'undefined' ? __ANALYTICS__ : false;
const REPO_URL = 'https://github.com/alexarnoni/apex';

// Conta um marco (sem cookies, sem nome, seed ou dados da carreira). Sem análise configurada, não faz nada.
function track(name) {
  if (!ANALYTICS) return;
  try { window.goatcounter?.count?.({ path: `evento/${name}`, title: name, event: true }); } catch { /* análise bloqueada: segue o jogo */ }
}

// Marcos da carreira, a partir da mudança de estado numa jogada.
function trackProgress(before, after) {
  if (!before || !after) return;
  if (after.f1 && !before.f1) track('chegou-na-f1');
  if (after.phase === 'LEGADO' && before.phase !== 'LEGADO') track(`carreira-terminada-${after.legacy?.how ?? 'fim'}`);
  if (after.phase === 'ROTA_ALTERNATIVA' && before.phase !== 'ROTA_ALTERNATIVA') track('fim-da-linha-na-base');
}

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
// Marca: bandeira quadriculada (grade 4x3) em roxo, ao lado do nome.
const LOGO = `<div class="logo"><svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#7b3fe4"/><g fill="#fff"><rect x="5" y="7.75" width="5.5" height="5.5"/><rect x="16" y="7.75" width="5.5" height="5.5"/><rect x="10.5" y="13.25" width="5.5" height="5.5"/><rect x="21.5" y="13.25" width="5.5" height="5.5"/><rect x="5" y="18.75" width="5.5" height="5.5"/><rect x="16" y="18.75" width="5.5" height="5.5"/></g><g fill="#4a1d9e"><rect x="10.5" y="7.75" width="5.5" height="5.5"/><rect x="21.5" y="7.75" width="5.5" height="5.5"/><rect x="5" y="13.25" width="5.5" height="5.5"/><rect x="16" y="13.25" width="5.5" height="5.5"/><rect x="10.5" y="18.75" width="5.5" height="5.5"/><rect x="21.5" y="18.75" width="5.5" height="5.5"/></g></svg><span>Bandeirada</span></div>`;
const TEAM_COLOR = Object.fromEntries(TEAMS_F1.map((t) => [t.id, t.color]));

let state = null;
let activeSlot = null; // slot onde a carreira em andamento é gravada a cada transição
let undoStack = []; // estados anteriores (só em memória); o estado é imutável, então desfazer é trocar de referência
const UNDO_MAX = 30;
let ui = { tab: 'standings', stTab: 'drivers', aboutOpen: false, helpOpen: false, fb: { open: false, kind: 'bug', text: '', include: true, full: false, msg: '', contact: '', status: '' }, end: { rating: null, text: '', include: true, status: '', msg: '' }, autoSingle: true, notice: null, baseOpt: null, terms: { years: 2, clause: 'none', exit: false }, fullGrid: false, confirmNew: false, error: null, draft: { surname: '', number: '', flag: 'BR', style: 'con', seed: '' } };
let lastKey = '';

// --- util -------------------------------------------------------------------

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $app = () => document.getElementById('app');
const ord = (n) => `${n}º`;

// --- tema: automático (segue o sistema) > claro > escuro ------------------------------

const THEMES = ['auto', 'light', 'dark'];
const THEME_LABEL = { auto: '◐ Auto', light: '☀ Claro', dark: '☾ Escuro' };
function readTheme() {
  try { const t = window.localStorage.getItem('bandeirada.theme'); return THEMES.includes(t) ? t : 'auto'; } catch { return 'auto'; }
}
function applyTheme(t) {
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}
let theme = readTheme();
applyTheme(theme);
function cycleTheme() {
  theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  applyTheme(theme);
  try { window.localStorage.setItem('bandeirada.theme', theme); } catch { /* sem armazenamento: vale só nesta sessão */ }
}
const themeBtn = () => `<button class="btn ghost small" data-act="theme" title="Trocar tema: automático, claro ou escuro" aria-label="Tema: ${esc(THEME_LABEL[theme])}">${THEME_LABEL[theme]}</button>`;

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
      track('save-exportado');
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
    if (state !== before) { undoStack.push(before); if (undoStack.length > UNDO_MAX) undoStack.shift(); trackProgress(before, state); }
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

// --- ajuda e glossário (1.2) ---------------------------------------------------
// Sem números de regra aqui: os valores vivem em engine/config.js e mudam com a calibração.

const HELP = [
  ['O objetivo', 'Você é um piloto jovem. Comece no kart, suba por F4, F3 e F2 até a Fórmula 1, dispute títulos e encerre a carreira com o maior legado que conseguir. Uma carreira dura uns 20 minutos.'],
  ['Como se sobe na base', 'Cada temporada tem uma escolha de pré-temporada (presente ou futuro) e termina com uma nota de scouting. Nota alta: equipes de ponta da categoria de cima fazem oferta. Nota média: só equipes do fundo do grid. Nota baixa: você repete a categoria. Subir nunca é automático.'],
  ['Nota de scouting', 'Soma o resultado no campeonato, um bônus por bater carros melhores que o seu, academia e fama, menos uma pressão por idade acima do típico da categoria. A tela mostra cada parcela.'],
  ['Academia', 'Convite de uma equipe de F1 para a sua formação. Aumenta a nota de scouting nas temporadas seguintes e abre ofertas ligadas a essa equipe.'],
  ['Estilo de pilotagem', 'Agressivo: mais rápido na classificação, mas oscila e abandona mais. Técnico: vai bem na chuva e ajuda a equipe a desenvolver o carro. Consistente: raramente abandona e pontua sempre, com menos picos.'],
  ['Habilidade e potencial', 'Habilidade é o quanto você é rápido hoje. Ela cresce com a idade, o treino e as escolhas, até um limite que você só vê como o potencial estimado pelos olheiros.'],
  ['Fama', 'Sobe com resultados e certos eventos. Ajuda nas ofertas e é uma das formas de conseguir cláusula de saída no contrato.'],
  ['Status na equipe', 'Piloto 1 tem prioridade e um bônus de desempenho. Piloto 2 pode receber ordem de equipe para ceder posição. Igual significa sem prioridade. O status vem do desempenho em relação ao companheiro ou de uma cláusula do contrato.'],
  ['Ordem de equipe e confiança', 'Quando você, como piloto 2, está na frente do piloto 1, a equipe pode mandar ceder a posição. Obedecer aumenta a confiança da equipe; desafiar reduz bastante. Confiança baixa pode custar o status e até a renovação.'],
  ['Contrato', 'Você escolhe a duração, a cláusula de status (piloto 1 ou tratamento igual) e, se a equipe aceitar, a cláusula de saída. A equipe só dá piloto 1 se você for claramente melhor que o companheiro. Trocar de equipe zera a confiança acumulada.'],
  ['Eventos', 'Notícias e decisões de corrida podem mexer em fama, confiança, performance e até na posição final. Algumas têm risco: leia as opções antes de escolher.'],
  ['Simular, desfazer e salvar', 'Dá para simular várias corridas de uma vez; a simulação para quando há uma decisão sua. "Desfazer" volta um passo. O jogo salva sozinho em slots neste navegador, e "Salvar em arquivo" gera um .json que pode ser importado depois.'],
];

function helpPanel() {
  return `<section class="card focus" id="help-panel"><div class="row" style="justify-content:space-between"><h2>Como funciona</h2><button class="btn ghost small" data-act="modal-close">Fechar</button></div>
    ${HELP.map(([t, d]) => `<details><summary>${esc(t)}</summary><p style="margin-top:6px">${esc(d)}</p></details>`).join('')}</section>`;
}

// --- sobre, aviso de projeto de fã e privacidade -------------------------------

function aboutPanel() {
  const stats = ANALYTICS
    ? 'O site conta visitas e etapas da carreira (como "chegou à F1") com o GoatCounter, sem cookies e sem dados pessoais. O nome do piloto, a seed e o conteúdo da carreira não são enviados.'
    : 'O site não coleta estatísticas de uso.';
  const feedback = FEEDBACK_ENDPOINT
    ? 'O feedback só sai quando você clica em Enviar. O texto que você escrever, o contato (se preencher) e, se marcar, a seed e as últimas decisões da carreira chegam por e-mail ao autor do jogo. Nada mais é coletado.'
    : 'O feedback só sai se você copiar ou enviar. Se marcar a opção, o relatório leva a seed e as últimas decisões da carreira.';
  return `<section class="card focus" id="about-panel"><div class="row" style="justify-content:space-between"><h2>Sobre e privacidade</h2><button class="btn ghost small" data-act="modal-close">Fechar</button></div>
    <details open><summary>Sobre a Bandeirada</summary><p style="margin-top:6px">A Bandeirada é um projeto de fã, independente, sem vínculo com a Fórmula 1, a FIA, as equipes ou os pilotos citados. Nomes, marcas e logotipos pertencem aos seus donos e aparecem só para ambientar o jogo. Os resultados são simulados e não retratam pessoas reais.</p></details>
    <details open><summary>Privacidade</summary>
      <p style="margin-top:6px">Sua carreira fica salva só no seu navegador. Ela só sai daqui se você mandar um feedback com o resumo da carreira marcado.</p>
      <p style="margin-top:6px">${esc(stats)}</p>
      <p style="margin-top:6px">As fontes do texto vêm do Google Fonts, então o Google vê o endereço IP de quem abre o site.</p>
      <p style="margin-top:6px">${esc(feedback)}</p></details>
    <details open><summary>Código e licença</summary><p style="margin-top:6px">O código está visível em <a href="${REPO_URL}" target="_blank" rel="noopener noreferrer">${REPO_URL.replace('https://', '')}</a>, com todos os direitos reservados.</p></details></section>`;
}

const anyModal = () => ui.aboutOpen || ui.helpOpen || ui.fb.open;

function footer() {
  const fab = anyModal() ? '' : `<button class="fab" data-act="fb-open" aria-label="Enviar feedback"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v12H8l-4 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>Feedback</button>`;
  return `<footer class="foot">Projeto de fã independente, sem vínculo com a F1, a FIA ou as equipes. <button class="linkbtn" data-act="about-open">Sobre e privacidade</button> · Achou algo estranho? <button class="linkbtn" data-act="fb-open">Conte</button></footer>${fab}`;
}

// Painéis (ajuda, sobre, feedback) abrem numa janela por cima da tela, com fundo escurecido.
function modal(label, inner) {
  return `<div class="modal-backdrop" data-act="modal-close"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(label)}">${inner}</div></div>`;
}

const panels = () => {
  if (ui.aboutOpen) return modal('Sobre e privacidade', aboutPanel());
  if (ui.helpOpen) return modal('Como funciona', helpPanel());
  if (ui.fb.open) return modal('Enviar feedback', feedbackPanel());
  return '';
};

function closeModals() {
  ui.aboutOpen = false;
  ui.helpOpen = false;
  ui.fb.open = false;
}

// Leva o foco para dentro da janela aberta (teclado e leitor de tela).
function focusModal(selector = '.modal h2') {
  const el = document.querySelector(`.modal ${selector === '.modal h2' ? 'h2' : selector}`);
  if (!el) return;
  if (el.tagName === 'H2') el.setAttribute('tabindex', '-1');
  el.focus();
}

// --- feedback (F.9) ---------------------------------------------------------

function currentFeedback() {
  const f = ui.fb;
  return buildFeedback({ kind: f.kind, text: f.text, state, includeCareer: f.include && !!state, fullHistory: f.full, userAgent: navigator.userAgent });
}

// Relatório que acompanha o envio por e-mail: resumo da carreira (se o jogador deixou marcado) e navegador.
function reportFor(includeCareer, full) {
  const parts = [];
  if (includeCareer && state) parts.push(careerSnapshot(state, { fullHistory: full }));
  parts.push(`navegador: ${navigator.userAgent}`);
  return parts.join('\n');
}

function feedbackPanel() {
  const f = ui.fb;
  const busy = f.status === 'sending';
  const url = !FEEDBACK_ENDPOINT && FEEDBACK_URL ? sendUrl(FEEDBACK_URL, { kind: f.kind, text: f.text, body: currentFeedback() }) : null;
  return `<section class="card focus" id="fb-panel"><div class="row" style="justify-content:space-between"><h2>Enviar feedback</h2><button class="btn ghost small" data-act="modal-close">Fechar</button></div>
    <p class="mute" style="font-size:14px">Conte o que aconteceu, o que achou fácil ou difícil, ou o que faltou. ${FEEDBACK_ENDPOINT ? 'A mensagem chega direto ao criador do jogo, sem precisar de conta.' : 'Copie o relatório e mande para quem te passou o jogo.'}</p>
    <label class="field">Tipo<select id="fb-kind">${Object.entries(FEEDBACK_KINDS).map(([k, v]) => `<option value="${k}" ${f.kind === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
    <label class="field">O que aconteceu?<textarea id="fb-text" rows="5" maxlength="2000" style="font:inherit;font-size:16px;color:var(--fg);background:var(--panel2);border:1px solid var(--line);border-radius:3px;padding:10px;width:100%">${esc(f.text)}</textarea></label>
    ${FEEDBACK_ENDPOINT ? `<label class="field">Como te responder? (opcional: e-mail ou WhatsApp)<input type="text" id="fb-contact" maxlength="120" value="${esc(f.contact)}" autocomplete="off"></label>` : ''}
    <label class="row" style="gap:6px;font-size:14px"><input type="checkbox" id="fb-include" ${f.include && state ? 'checked' : ''} ${state ? '' : 'disabled'}> Incluir o resumo da carreira (seed, versão, últimas decisões)</label>
    <label class="row" style="gap:6px;font-size:14px"><input type="checkbox" id="fb-full" ${f.full ? 'checked' : ''} ${state ? '' : 'disabled'}> Incluir todas as decisões (maior, mas permite repetir o problema)</label>
    <input class="hp" type="text" id="fb-website" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="row">${FEEDBACK_ENDPOINT ? `<button class="btn" data-act="fb-submit" ${busy || f.status === 'sent' ? 'disabled' : ''}>${busy ? 'Enviando…' : 'Enviar'}</button>` : ''}
      <button class="btn ${FEEDBACK_ENDPOINT ? 'ghost' : ''}" data-act="fb-copy">Copiar feedback</button>
      ${url ? `<a class="btn ghost" id="fb-send" href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-act="fb-send">Enviar pelo GitHub</a>` : ''}
      <span class="mute" id="fb-msg" role="status">${esc(f.msg)}</span></div>
    ${f.fallback ? `<textarea id="fb-fallback" readonly rows="6" style="font:12px var(--f-mono);color:var(--fg);background:var(--panel2);border:1px solid var(--line);border-radius:3px;padding:8px;width:100%">${esc(f.fallback)}</textarea>` : ''}</section>`;
}

async function submitFeedback() {
  const f = ui.fb;
  if (!FEEDBACK_ENDPOINT || f.status === 'sending') return;
  if (!f.text.trim()) { f.msg = 'Escreva o que aconteceu antes de enviar.'; const m = document.getElementById('fb-msg'); if (m) m.textContent = f.msg; return; }
  f.status = 'sending';
  f.msg = '';
  render();
  const payload = feedbackPayload({
    kind: f.kind, text: f.text, contact: f.contact, version: state?.engineVersion ?? ENGINE_VERSION,
    report: reportFor(f.include, f.full), website: document.getElementById('fb-website')?.value ?? '',
  });
  const r = await sendFeedback(FEEDBACK_ENDPOINT, payload);
  if (r.ok) {
    f.status = 'sent';
    f.msg = 'Enviado! Obrigado, isso ajuda muito.';
    f.text = '';
    track('feedback-enviado');
  } else {
    f.status = '';
    f.msg = r.reason;
  }
  render();
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

// --- fim de carreira: "Como foi essa carreira?" (nota de 1 a 5 e comentário opcional) ---------------

const freshEnd = () => ({ rating: null, text: '', include: true, status: '', msg: '' });

function careerFeedbackCard() {
  const e = ui.end;
  if (e.status === 'sent') return '<section class="card"><h3>Obrigado!</h3><p>Sua opinião chegou. Ela ajuda a ajustar o jogo.</p></section>';
  const busy = e.status === 'sending';
  const rates = [1, 2, 3, 4, 5].map((n) => `<button class="rate ${e.rating === n ? 'on' : ''}" data-act="rate" data-id="${n}" aria-pressed="${e.rating === n}" aria-label="Nota ${n}">${n}</button>`).join('');
  return `<section class="card" id="end-fb"><h3>Como foi essa carreira?</h3>
    <div class="rates" role="group" aria-label="Nota de 1 a 5">${rates}</div>
    <div class="row small mute" style="justify-content:space-between"><span>1 · fraca</span><span>5 · ótima</span></div>
    <label class="field">Quer contar mais? (opcional)<textarea id="end-text" rows="3" maxlength="1000" style="font:inherit;font-size:16px;color:var(--fg);background:var(--panel2);border:1px solid var(--line);border-radius:3px;padding:10px;width:100%">${esc(e.text)}</textarea></label>
    <label class="row" style="gap:6px;font-size:14px"><input type="checkbox" id="end-include" ${e.include ? 'checked' : ''}> Enviar junto o resumo da carreira (seed e decisões)</label>
    <div class="row">${FEEDBACK_ENDPOINT
    ? `<button class="btn" data-act="end-send" ${e.rating && !busy ? '' : 'disabled'}>${busy ? 'Enviando…' : 'Enviar'}</button>`
    : `<button class="btn" data-act="end-copy" ${e.rating ? '' : 'disabled'}>Copiar</button>`}
      <span class="mute" id="end-msg" role="status">${esc(e.msg)}</span></div></section>`;
}

async function submitCareerFeedback() {
  const e = ui.end;
  if (!FEEDBACK_ENDPOINT || !e.rating || e.status === 'sending') return;
  e.status = 'sending';
  e.msg = '';
  render();
  const view = getView(state);
  const report = [view.legacy ? summaryText(view) : '', reportFor(e.include, false)].filter(Boolean).join('\n\n');
  const r = await sendFeedback(FEEDBACK_ENDPOINT, feedbackPayload({
    kind: 'career', text: e.text, rating: e.rating, version: state.engineVersion ?? ENGINE_VERSION, report,
  }));
  if (r.ok) { e.status = 'sent'; e.msg = ''; track('feedback-fim-de-carreira'); } else { e.status = ''; e.msg = r.reason; }
  render();
}

function copyCareerFeedback() {
  const e = ui.end;
  const view = getView(state);
  const text = buildFeedback({ kind: 'career', text: e.text, rating: e.rating, state, includeCareer: e.include, userAgent: navigator.userAgent });
  const extra = view.legacy ? `\n\n${summaryText(view)}` : '';
  const done = (t) => { e.msg = t; const m = document.getElementById('end-msg'); if (m) m.textContent = t; };
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text + extra).then(() => done('Copiado. Cole na conversa com quem te passou o jogo.'), () => done('Não deu para copiar sozinho.'));
  else done('Não deu para copiar sozinho.');
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
  const LADDER_COLOR = { kart: '#1fb877', f4: '#0aa5c9', f3: '#3b7dea', f2: '#9b4dff', f1: '#ff3d8b' };
  return `<div class="ladder" role="img" aria-label="Pirâmide de categorias">${ids.map((id, i) =>
    `<div class="${i < curIdx ? 'done' : ''} ${i === curIdx ? 'now' : ''}" style="--c:${LADDER_COLOR[id] ?? '#7b3fe4'}">${esc(id === 'f1' ? 'F1' : id.toUpperCase())}</div>`).join('')}</div>`;
}

function header(view) {
  const p = view.player;
  return `<header class="bar">
    ${LOGO}
    <span class="chip">${esc(p.flag ?? '')} #${esc(p.number)} ${esc(p.name)}</span>
    <span class="chip">${esc(view.year)} · ${esc(p.age)} anos</span>
    <span class="chip" title="Use esta seed na criação para repetir a carreira">seed ${esc(view.seed)}</span>
    <button class="btn ghost small" data-act="undo" ${undoStack.length ? '' : 'disabled'}>Desfazer</button>
    <button class="btn ghost small" data-act="export-current">Salvar em arquivo</button>
    <button class="btn ghost small" data-act="help-open">Ajuda</button>
    ${themeBtn()}
    <button class="btn ghost small" data-act="newgame">${saves.available ? 'Menu' : 'Sair'}</button>
  </header>${ui.confirmNew ? `<div class="note">Sem salvamento neste navegador: sair perde a carreira (use "Salvar em arquivo" antes). <button class="btn small" data-act="newgame-yes">Sair mesmo assim</button> <button class="btn ghost small" data-act="newgame-no">Cancelar</button></div>` : ''}
  ${ui.saveWarn ? `<div class="note err">O navegador recusou gravar a carreira. Ela continua nesta aba, mas use "Salvar em arquivo" para não perder.</div>` : ''}`;
}

function stat(label, value) { return `<div class="stat"><b>${esc(value)}</b><small>${esc(label)}</small></div>`; }




function optionCards(options, act, selected = null) {
  return `<div class="grid2">${Object.entries(options).map(([id, o]) =>
    `<button class="opt ${selected === id ? 'on' : ''}" data-act="${act}" data-id="${esc(id)}"><strong>${esc(o.label)}</strong><span>${esc(o.description ?? '')}</span></button>`).join('')}</div>`;
}

function teamTag(f1) {
  return `<span class="team"><i style="background:${esc(TEAM_COLOR[f1.team.id] ?? 'var(--line)')}"></i><b>${esc(f1.team.name)}</b></span>`;
}

// --- layout em colunas: decisão no centro, ficha à esquerda, painel da temporada à direita ----
// No DOM a decisão vem primeiro (no celular é o que aparece no topo); no desktop o CSS posiciona as colunas.

function layout(view, main, aside = '') {
  return `${header(view)}${ladder(view)}
  <div class="layout">
    <div class="col-main">${main}</div>
    <div class="col-ficha">${ficha(view)}</div>
    <div class="col-side">${aside}</div>
  </div>`;
}

// Atributos do piloto: fama (barra) e estilo de pilotagem. Habilidade e potencial ficam no medidor e nos quadradinhos.
function attributes(p) {
  const clamp = (n) => Math.max(0, Math.min(100, n));
  const fame = Math.round(p.fame * 10) / 10;
  const famePct = clamp((p.fame / 40) * 100);
  const fameTier = [[2, 'Desconhecido'], [6, 'Promessa'], [12, 'Conhecido'], [22, 'Famoso'], [35, 'Estrela']].find(([lim]) => p.fame < lim)?.[1] ?? 'Lenda';
  const style = STYLES[p.style];
  return `<div class="attrs">
    <div class="attr" title="Sobe com resultados e mídia; abre portas no mercado.">
      <div class="attr-head"><span>Fama</span><b class="tier">${esc(fameTier)} <span class="num mute small">${fame}</span></b></div>
      <div class="meter"><i class="fill fame" style="width:${famePct}%"></i></div>
      <div class="attr-foot mute small">Sobe com títulos, pódios e mídia. Atrai equipes melhores.</div>
    </div>
    <div class="attr">
      <div class="attr-head"><span>Estilo</span><b>${esc(style?.name ?? p.style)}</b></div>
      <div class="attr-foot mute small">${esc(style?.text ?? '')}</div>
    </div>
  </div>`;
}

// Quanto falta para o topo da faixa de potencial (vira "no teto" quando já chegou).
const margin = (p) => { const g = p.potentialBand[1] - Math.round(p.skill); return g > 0 ? `+${g}` : 'no limite'; };

// Medidor circular: anel de dentro = habilidade; arco fino por fora = faixa do potencial estimado.
function skillDial(p) {
  const pct = (n) => Math.max(0, Math.min(100, n)) / 100;
  const skill = Math.round(p.skill);
  const [lo, hi] = p.potentialBand;
  const R1 = 31; const C1 = 2 * Math.PI * R1;
  const R2 = 40; const C2 = 2 * Math.PI * R2;
  const f = (n) => n.toFixed(2);
  return `<div class="dial" title="Habilidade: o quanto você é rápido hoje (0 a 100). O arco fino por fora é o potencial estimado: ${lo} a ${hi}.">
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <defs><linearGradient id="dialg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0aa5c9"/><stop offset=".5" stop-color="#7b3fe4"/><stop offset="1" stop-color="#ff3d8b"/></linearGradient></defs>
      <g transform="rotate(-90 48 48)" fill="none">
        <circle class="dial-track" cx="48" cy="48" r="${R1}" stroke-width="9"/>
        <circle cx="48" cy="48" r="${R1}" stroke="url(#dialg)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${f(C1 * pct(skill))} ${f(C1)}"/>
        <circle class="dial-band" cx="48" cy="48" r="${R2}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${f(C2 * (pct(hi) - pct(lo)))} ${f(C2)}" stroke-dashoffset="${f(-C2 * pct(lo))}"/>
      </g>
    </svg>
    <div class="dial-num"><b>${esc(skill)}</b></div>
    <div class="dial-cap"><span>habilidade</span></div>
  </div>`;
}

function ficha(view) {
  const p = view.player;
  const c = p.career;
  const f1 = view.f1;
  const trustPct = f1 ? Math.round(f1.trust) : 0;
  const team = f1
    ? `<div class="ficha-team">${teamTag(f1)}<span class="mute small">carro: ${esc(f1.team.carLabel)} (#${esc(f1.team.carRank)})</span></div>`
    : `<div class="ficha-team"><b>${esc(view.base.team)}</b><span class="mute small">${esc(view.base.category)} · temporada ${esc(view.base.seasonInCategory)}</span></div>`;
  const trophies = [];
  if (c.titlesF1) trophies.push(`<span class="pill trophy">F1 ×${c.titlesF1}</span>`);
  if (c.titlesBase) trophies.push(`<span class="pill trophy">Base ×${c.titlesBase}</span>`);
  if (c.vice) trophies.push(`<span class="pill">Vice ×${c.vice}</span>`);
  const f1Extra = f1 ? `
    <div class="chips-row"><span class="chip">contrato: ${esc(f1.contract.years)} ${f1.contract.years === 1 ? 'ano' : 'anos'}${f1.contract.statusClause ? ` · ${esc(f1.contract.statusClause)}` : ''}${f1.contract.exitClause ? ' · saída livre' : ''}</span>
      ${f1.rival ? `<span class="chip">rival: ${esc(f1.rival)}</span>` : ''}</div>
    <p class="mute small">${esc(STATUS_TEXT[f1.status] ?? 'Seu status na equipe é definido no início da temporada.')}${f1.statusWhy ? ` <b>Por quê:</b> ${esc(f1.statusWhy)}` : ''}</p>
    <div><div class="row" style="justify-content:space-between"><small class="mute">CONFIANÇA DA EQUIPE</small><span class="num">${trustPct}</span></div>
      <div class="bar-meter"><i style="width:${trustPct}%"></i></div></div>` : '';
  return `<section class="card ficha" aria-label="Ficha do piloto">
    <div class="ficha-top">
      ${skillDial(p)}
      <div class="ficha-id">
        <div class="ficha-name">${esc(p.name)}</div>
        <div class="chips-row"><span class="chip">#${esc(p.number)}</span><span class="chip">${esc(p.flag ?? '')}</span><span class="chip">${esc(STYLES[p.style]?.name ?? p.style)}</span></div>
      </div>
    </div>
    ${attributes(p)}
    <div class="tiles">${stat('Idade', p.age)}${stat('Potencial', `${p.potentialBand[0]}–${p.potentialBand[1]}`)}${stat('Margem', margin(p))}${p.academy ? stat('Academia', p.academy.teamId.toUpperCase()) : ''}</div>
    ${team}
    <div class="counters">${stat('GP', c.gp)}${stat('Vitórias', c.wins)}${stat('Pódios', c.podiums)}${stat('Poles', c.poles)}</div>
    <div class="vitrine"><small class="mute">SALA DE TROFÉUS</small> ${trophies.length ? trophies.join(' ') : '<span class="mute small">vazia por enquanto</span>'}</div>
    ${f1Extra}
    <p class="mute small">Potencial é o palpite dos olheiros de até onde você chega.</p>
  </section>`;
}

const delta = (n) => (n > 0
  ? `<span class="d up" aria-hidden="true">▲${n}</span><span class="sr-only">subiu ${n}</span>`
  : n < 0 ? `<span class="d down" aria-hidden="true">▼${-n}</span><span class="sr-only">caiu ${-n}</span>`
    : '<span class="d" aria-hidden="true">=</span>');

function driversTable(f1) {
  const shown = ui.fullGrid ? f1.standings : f1.standings.filter((r) => r.pos <= 10 || r.isPlayer);
  let prev = 0;
  const rows = [];
  for (const r of shown) {
    if (r.pos - prev > 1) rows.push('<tr><td colspan="5" class="mute" style="text-align:center">···</td></tr>');
    prev = r.pos;
    rows.push(`<tr class="${r.isPlayer ? 'you' : ''}"><td class="pos ${r.pos <= 3 ? `p${r.pos}` : ''}">${r.pos}</td>
      <td class="car"><i style="background:${esc(TEAM_COLOR[r.team] ?? 'var(--line)')}"></i></td>
      <td class="name">${esc(r.name)}</td><td class="dl">${delta(r.delta)}</td><td class="pts">${esc(r.points)}</td></tr>`);
  }
  return `<div class="scroll-x"><table class="tower" aria-label="Classificação de pilotos"><tbody>${rows.join('')}</tbody></table></div>
    <button class="btn ghost small" data-act="grid" style="align-self:flex-start">${ui.fullGrid ? 'Mostrar só o top 10' : 'Ver grid completo'}</button>`;
}

function teamsTable(f1) {
  const rows = f1.constructors.map((c) => `<tr class="${c.isYours ? 'you' : ''}"><td class="pos">${c.pos}</td>
    <td class="car"><i style="background:${esc(TEAM_COLOR[c.id] ?? 'var(--line)')}"></i></td>
    <td class="name">${esc(c.name)}</td><td class="dl">${delta(c.delta)}</td><td class="pts">${esc(c.points)}</td></tr>`).join('');
  return `<div class="scroll-x"><table class="tower" aria-label="Classificação de construtores"><tbody>${rows}</tbody></table></div>`;
}

function racesList(f1) {
  if (!f1.races.length) return '<p class="mute small">Nenhuma corrida disputada ainda nesta temporada.</p>';
  const items = [...f1.races].reverse().map((r) => {
    const res = r.missed ? '<span class="pill">fora</span>' : r.playerPos ? `<span class="pill ${r.playerPos <= 3 ? `trophy p${r.playerPos}` : ''}">P${r.playerPos}</span>` : '<span class="pill bad">abandono</span>';
    return `<li><div class="row" style="gap:8px"><b>C${r.n}</b>${res}<span class="mute small">${esc(r.winner ?? '—')} venceu${r.wet ? ' · chuva' : ''}</span></div>${r.summary ? `<div class="mute small">${esc(r.summary)}</div>` : ''}</li>`;
  }).join('');
  return `<ul class="racelist">${items}</ul>`;
}

// Painel da temporada (coluna da direita): classificação de pilotos e construtores, ou corrida a corrida.
function seasonPanel(view) {
  const f1 = view.f1;
  const title = view.screen === 'F1_PRE_TEMPORADA' ? 'Grid · classificação do ano anterior' : `Temporada ${f1.worldSeason}`;
  const tabBtn = (act, id, label, cur) => `<button class="tab ${cur === id ? 'on' : ''}" role="tab" aria-selected="${cur === id}" data-act="${act}" data-id="${id}">${label}</button>`;
  const body = ui.tab === 'races'
    ? racesList(f1)
    : `<div class="tabs sub" role="tablist">${tabBtn('sttab', 'drivers', 'Pilotos', ui.stTab)}${tabBtn('sttab', 'teams', 'Construtores', ui.stTab)}</div>${ui.stTab === 'teams' ? teamsTable(f1) : driversTable(f1)}`;
  return `<section class="card"><h3>${esc(title)}</h3>
    <div class="tabs" role="tablist">${tabBtn('tab', 'standings', 'Tabela', ui.tab)}${tabBtn('tab', 'races', 'Etapas', ui.tab)}</div>${body}</section>`;
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
  return `<header class="bar">${LOGO}<span class="chip">protótipo</span><button class="btn ghost small" data-act="help-open">Ajuda</button>${themeBtn()}</header>
  <section class="card">
    <h1>Da largada à bandeirada</h1>
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
      <label class="field">Sobrenome<input type="text" id="f-surname" maxlength="18" value="${esc(d.surname)}" placeholder="Ex.: Senna"></label>
      <label class="field">Número do carro (1-99)<input type="number" id="f-number" min="1" max="99" value="${esc(d.number)}" placeholder="Ex.: 12"></label>
      <label class="field">Bandeira<select id="f-flag">${FLAGS.map((f) => `<option ${f === d.flag ? 'selected' : ''}>${f}</option>`).join('')}</select></label>
      <label class="field">Seed (opcional, repete uma carreira)<input type="text" id="f-seed" inputmode="numeric" value="${esc(d.seed)}" placeholder="vazio = aleatória"></label>
      ${slotField}
    </div>
    <h3>Estilo de pilotagem</h3>
    <div class="grid2">${Object.entries(STYLES).map(([id, s]) =>
      `<button type="button" class="opt ${d.style === id ? 'on' : ''}" data-act="style" data-id="${id}"><strong>${esc(s.name)}</strong><span>${esc(s.text)}</span></button>`).join('')}</div>
    <p class="mute" style="font-size:14px">Idade inicial sorteada entre 14 e 16 anos: mais novo começa menos pronto, mas tem potencial de evolução maior.</p>
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
      return `<button class="opt" data-act="offer" data-id="${esc(o.id)}"><strong>${label}</strong><span>${esc(sub)}</span>${o.why ? `<span>${esc(o.why)}</span>` : ''}${proscons(o)}</button>`;
    }).join('');
    body = `<section class="card focus"><h2>Ofertas</h2><div class="grid2">${cards}</div></section>`;
  }
  const rivals = view.base.rivals.length
    ? `<section class="card"><h3>Seus rivais</h3><ul class="log">${view.base.rivals.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></section>` : '';
  const head = `<section class="card"><div class="row"><h2>${esc(view.base.category)}</h2><span class="chip">${esc(view.base.team)}</span><span class="chip">temporada ${esc(view.base.seasonInCategory)} na categoria</span></div></section>`;
  return layout(view, `${head}${seasonResultCard(view)}${body}`, rivals);
}

function raceLine(r) {
  if (!r) return '';
  const mine = r.summary ? esc(r.summary) : (r.playerPos ? `Você terminou em <b>P${r.playerPos}</b>.` : '<b class="pill bad">Abandono</b>');
  return `<p><b>Corrida ${r.n}</b>${r.wet ? ' · <span class="pill">chuva</span>' : ''}: ${mine}</p>
    <p class="mute" style="font-size:14px">Vitória: ${esc(r.winner ?? '—')} · Pole: ${esc(r.pole)}</p>`;
}

// Vantagens (+) e riscos (−) de uma oferta, em lista curta.
function proscons(o) {
  // <span> e não <ul>: o cartão inteiro é um <button>, que só aceita conteúdo inline.
  const line = (sign, t, cls) => `<span class="${cls}"><b aria-hidden="true">${sign}</b> <span class="sr-only">${cls === 'pro' ? 'Vantagem:' : 'Risco:'}</span> ${esc(t)}</span>`;
  const items = [...(o.pros ?? []).map((t) => line('+', t, 'pro')), ...(o.cons ?? []).map((t) => line('−', t, 'con'))];
  return items.length ? `<span class="pc">${items.join('')}</span>` : '';
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
  return layout(view, `<h2>${esc(title)}</h2>${lastEventCard(f1)}${body}${last}${dev}`, seasonPanel(view));
}

function screenEndSeason(view) {
  const ls = view.f1.lastSeason;
  const champ = ls.position === 1;
  const orders = ls.ordersLog.filter((o) => o.p2 === view.player.name || o.p1 === view.player.name);
  const main = `${lastEventCard(view.f1)}
    <section class="card focus"><h3>Fim da temporada · ${esc(ls.teamName)}</h3>
      <div class="row" style="align-items:flex-end;gap:24px"><div class="big">${ord(ls.position)}</div>
        <div class="stats">${stat('Pontos', ls.points)}${stat('Vitórias', ls.wins)}${stat('Pódios', ls.podiums)}${stat('Poles', ls.poles)}${stat('Abandonos', ls.dnfs)}</div></div>
      ${champ ? `<p><span class="pill good">CAMPEÃO MUNDIAL</span></p>` : `<p class="mute">Campeão: ${esc(ls.champion)} · Sua equipe terminou em ${ord(ls.constructorPos)} no construtores.</p>`}
      ${orders.length ? `<p class="mute">Ordens de equipe com você: ${orders.map((o) => `corrida ${o.race}${o.defied ? ' (desafiou)' : ' (obedeceu)'}`).join(', ')}.</p>` : ''}
      <div class="row"><button class="btn" data-act="next">Continuar</button></div></section>`;
  return layout(view, main, seasonPanel(view));
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
      return `<button class="opt" data-act="offer" data-id="${esc(o.id)}"><strong>${verb} ${esc(o.teamName)}</strong><span>Carro: ${esc(o.carLabel)} (#${esc(o.carRank)})${o.mate ? ` · Companheiro: ${esc(o.mate)}` : ''}</span>${o.why ? `<span>${esc(o.why)}</span>` : ''}${proscons(o)}</button>`;
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
  return layout(view, body, seasonPanel(view));
}

function summaryText(view) {
  const l = view.legacy;
  const p = view.player;
  const seasons = view.f1.seasons.map((s) => `${s.year} ${s.teamName} ${s.position}º ${s.points}pts ${s.wins}v`).join('; ');
  return [
    `BANDEIRADA · ${p.name} #${p.number} (${p.flag}) · estilo ${STYLES[p.style].name} · seed ${state.seed}`,
    `Legado ${l.score} · ${l.seasons} temporadas · ${l.titlesF1} títulos · ${l.vice} vice · ${l.wins} vitórias · ${l.podiums} pódios · ${l.poles} poles · ${l.points} pts · base: ${l.baseTitles} títulos · parou aos ${l.retiredAge}`,
    seasons,
  ].join('\n');
}

function screenLegacy(view) {
  const l = view.legacy;
  const main = `<section class="card focus"><h2>${l.how === 'voluntary' ? 'Carreira encerrada' : 'Sem lugar no grid'} · aos ${esc(l.retiredAge)} anos</h2>
      <div class="row" style="align-items:flex-end;gap:24px"><div class="big">${esc(l.score)}</div><small class="mute">NOTA DE LEGADO</small></div>
      <div class="stats">${stat('Títulos F1', l.titlesF1)}${stat('Vice', l.vice)}${stat('Vitórias', l.wins)}${stat('Pódios', l.podiums)}${stat('Poles', l.poles)}${stat('Pontos', l.points)}${stat('Temporadas', l.seasons)}${stat('Títulos na base', l.baseTitles)}</div>
      <div class="row"><button class="btn" data-act="copy">Copiar resumo</button><button class="btn ghost" data-act="newgame-yes">Nova carreira</button></div>
      <p class="mute" style="font-size:14px" id="copy-msg">Cole o resumo no chat de quem está testando, junto com o que achou da carreira.</p>
      <textarea id="summary" readonly rows="4" style="font:12px var(--f-mono);width:100%;background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:3px;padding:8px">${esc(summaryText(view))}</textarea></section>${careerFeedbackCard()}`;
  const timeline = `<section class="card"><h3>Linha do tempo</h3><div class="scroll-x"><table class="tower"><tbody>
      ${view.f1.seasons.map((s) => `<tr><td class="pos">${esc(s.year)}</td><td class="car"><i style="background:${esc(TEAM_COLOR[s.team] ?? 'var(--line)')}"></i></td><td class="name">${esc(s.teamName)}</td><td class="pts">${ord(s.position)} · ${esc(s.points)} pts${s.position === 1 ? ' ★' : ''}</td></tr>`).join('')}
    </tbody></table></div></section>`;
  return layout(view, main, timeline);
}

function screenAlt(view) {
  const main = `<section class="card focus"><h2>Fim da linha</h2>
      <p>Os olheiros pararam de ligar e a carreira não chegou à Fórmula 1. As rotas alternativas (Super Fórmula, IndyCar, Fórmula E) ainda não existem neste protótipo.</p>
      <div class="row"><button class="btn" data-act="newgame-yes">Nova carreira</button></div></section>
    ${view.base ? seasonResultCard(view) : ''}${careerFeedbackCard()}`;
  return layout(view, main, view.base?.rivals?.length
    ? `<section class="card"><h3>Seus rivais</h3><ul class="log">${view.base.rivals.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></section>` : '');
}

// --- render ----------------------------------------------------------------

// Troca de tela: leva o foco ao título principal, para leitor de tela e teclado começarem do topo.
// (O #app não é aria-live: ele é redesenhado a cada clique e leria a tela inteira de novo.)
function focusHeading(root) {
  const h = [...root.querySelectorAll('h1, h2')].find((x) => !x.closest('#help-panel, #fb-panel'));
  if (!h) return;
  h.setAttribute('tabindex', '-1');
  h.focus({ preventScroll: true });
}

function render() {
  const el = $app();
  el.className = state ? 'wrap wide' : 'wrap';
  if (!state) { el.innerHTML = panels() + screenCreate() + footer(); document.body.classList.toggle('modal-open', !!anyModal()); return; }
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
  if (ui.notice) html = `<div class="note" role="status">${esc(ui.notice)}</div>${html}`;
  if (ui.error) html = `<div class="note err" role="alert">${esc(ui.error)} <button class="btn ghost small" data-act="copy-error">Copiar relatório do erro</button> <span class="mute" id="err-msg"></span></div>${html}`;
  el.innerHTML = panels() + html + footer();
  document.body.classList.toggle('modal-open', !!anyModal());
  const key = `${view.screen}|${view.decision?.type ?? ''}|${view.year}|${view.f1?.race?.done ?? ''}`;
  if (key !== lastKey) { lastKey = key; window.scrollTo(0, 0); focusHeading(el); }
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
    track('carreira-iniciada');
    ui.end = freshEnd();
    ui.error = null;
    ui.notice = null;
    ui.baseOpt = null;
    ui.saveWarn = false;
    save();
  } catch (e) {
    ui.error = e.message.includes('surname') ? 'Informe um sobrenome.' : e.message.includes('number') ? 'O número do carro deve ser de 1 a 99.' : e.message;
  }
  render();
}

// Volta ao menu sem apagar nada: a carreira já está gravada no slot.
function toMenu() {
  ui.end = freshEnd();
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
  if (e.target.id === 'fb-contact') ui.fb.contact = e.target.value;
  if (e.target.id === 'end-text') ui.end.text = e.target.value;
  if (e.target.id === 'fb-text') { ui.fb.text = e.target.value; ui.fb.msg = ''; ui.fb.fallback = ''; document.getElementById('fb-fallback')?.remove(); refreshSendLink(); }
});

document.addEventListener('submit', (e) => { if (e.target.id === 'create') { e.preventDefault(); startCareer(); } });

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.name === 't-years') ui.terms.years = Number(t.value);
  else if (t.name === 't-clause') ui.terms.clause = t.value;
  else if (t.id === 't-exit') ui.terms.exit = t.checked;
  else if (t.id === 'f-import' && t.files?.[0]) importFile(t.files[0]);
  else if (t.id === 'end-include') ui.end.include = t.checked;
  else if (t.id === 'fb-kind') { ui.fb.kind = t.value; refreshSendLink(); }
  else if (t.id === 'fb-include') { ui.fb.include = t.checked; refreshSendLink(); }
  else if (t.id === 'fb-full') { ui.fb.full = t.checked; refreshSendLink(); }
  else if (t.id === 't-auto') { ui.autoSingle = t.checked; run((s) => settle(s)); }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && anyModal()) { closeModals(); render(); }
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
    case 'tab': ui.tab = id; return render();
    case 'sttab': ui.stTab = id; return render();
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
    case 'theme': cycleTheme(); render(); return undefined;
    case 'copy-error': return copyErrorReport();
    case 'about-open': ui.aboutOpen = true; ui.helpOpen = false; ui.fb.open = false; render(); focusModal(); return undefined;
    case 'help-open': track('ajuda-aberta'); ui.aboutOpen = false; ui.helpOpen = true; ui.fb.open = false; render(); focusModal(); return undefined;
    case 'fb-open':
      track('feedback-aberto'); ui.aboutOpen = false; ui.helpOpen = false; ui.fb.open = true; ui.fb.msg = '';
      if (ui.fb.status === 'sent') ui.fb.status = '';
      if (ui.error && !ui.fb.text) ui.fb.text = `Erro: ${ui.error}\n`;
      render(); focusModal('textarea'); return undefined;
    case 'modal-close': if (e.target !== el) return undefined; closeModals(); return render();
    case 'fb-submit': return submitFeedback();
    case 'fb-copy': return copyFeedback();
    case 'rate': ui.end.rating = Number(id); ui.end.msg = ''; return render();
    case 'end-send': return submitCareerFeedback();
    case 'end-copy': return copyCareerFeedback();
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
