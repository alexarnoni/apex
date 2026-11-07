// Feedback de quem está testando (roadmap F.9). Sem DOM: monta o texto do relatório e, se o build
// definir um destino (BANDEIRADA_FEEDBACK_URL, por exemplo a página "nova issue" de um repositório),
// o link de envio com título e corpo preenchidos.

export const FEEDBACK_KINDS = {
  bug: 'Bug',
  balance: 'Balanceamento (muito fácil ou difícil)',
  idea: 'Ideia ou sugestão',
  other: 'Outro',
};

// Títulos para o relatório: os tipos do formulário e o do fim de carreira (que não aparece na lista).
const KIND_TITLES = { ...FEEDBACK_KINDS, career: 'Fim de carreira' };

const GITHUB_URL_LIMIT = 6000; // o GitHub recusa URLs de "nova issue" muito longas

// Resumo da carreira para o relatório. `state` é o estado cru do jogo (só leitura).
export function careerSnapshot(state, { fullHistory = false } = {}) {
  if (!state) return 'Sem carreira ativa.';
  const history = state.history ?? [];
  const shown = fullHistory ? history : history.slice(-15);
  const lines = [
    `seed ${state.seed} · versão do jogo ${state.engineVersion} · fase ${state.phase} · ano ${state.year}`,
    `piloto: ${state.player?.name ?? '?'} #${state.player?.number ?? '?'} · ${state.player?.age ?? '?'} anos · estilo ${state.player?.style ?? '?'}`,
    `decisões tomadas: ${history.length}${fullHistory ? '' : ` (últimas ${shown.length} abaixo)`}`,
    JSON.stringify(shown),
  ];
  const log = (state.careerLog ?? []).slice(-6).map((e) => `- ${e.year}: ${e.text}`);
  if (log.length) lines.push('últimos acontecimentos:', ...log);
  return lines.join('\n');
}

export function buildFeedback({ kind = 'other', text = '', rating = null, state = null, includeCareer = true, fullHistory = false, userAgent = '' }) {
  const parts = [
    `BANDEIRADA · feedback · ${KIND_TITLES[kind] ?? FEEDBACK_KINDS.other}`,
    ...(rating ? [`Nota: ${rating}/5`] : []),
    '',
    text.trim() || '(sem texto)',
  ];
  if (includeCareer) parts.push('', '--- carreira ---', careerSnapshot(state, { fullHistory }));
  if (userAgent) parts.push('', `navegador: ${userAgent}`);
  return parts.join('\n');
}

// Link de envio (ex.: https://github.com/dono/repo/issues/new) com título e corpo; corpo cortado para caber.
export function sendUrl(base, { kind, text, body }) {
  if (!base) return null;
  const first = (text.trim().split('\n')[0] || 'Feedback').slice(0, 70);
  const title = `[${kind}] ${first}`;
  const sep = base.includes('?') ? '&' : '?';
  const make = (b) => `${base}${sep}title=${encodeURIComponent(title)}&body=${encodeURIComponent(b)}`;
  let b = body;
  let url = make(b);
  while (url.length > GITHUB_URL_LIMIT && b.length > 200) {
    b = `${b.slice(0, Math.floor(b.length * 0.8))}\n\n(texto cortado: use "Copiar feedback" para o relatório completo)`;
    url = make(b);
  }
  return url;
}

// --- envio para o Worker de feedback (e-mail) ----------------------------------------------------

// Corpo que o Worker espera (ver worker/feedback-core.js). `website` é o campo-isca contra robôs: fica vazio.
export function feedbackPayload({ kind = 'other', text = '', rating = null, contact = '', report = '', version = '', website = '' }) {
  return { kind, text: text.trim(), rating, contact: contact.trim(), report, version: String(version), website };
}

// Envia por POST e devolve { ok: true } ou { ok: false, reason } com um motivo pronto para mostrar ao jogador.
export async function sendFeedback(endpoint, payload, fetchImpl = globalThis.fetch) {
  try {
    const res = await fetchImpl(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) return { ok: true };
    if (res.status === 429) return { ok: false, reason: 'Muitos envios seguidos. Tente de novo em alguns minutos.' };
    let msg = '';
    try { msg = (await res.json()).error ?? ''; } catch { /* resposta sem JSON */ }
    return { ok: false, reason: msg || 'O envio falhou. Use "Copiar" e mande pela conversa.' };
  } catch {
    return { ok: false, reason: 'Sem conexão com o servidor de feedback. Use "Copiar" e mande pela conversa.' };
  }
}
