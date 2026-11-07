// Feedback de quem está testando (roadmap F.9). Sem DOM: monta o texto do relatório e, se o build
// definir um destino (APEX_FEEDBACK_URL, por exemplo a página "nova issue" de um repositório),
// o link de envio com título e corpo preenchidos.

export const FEEDBACK_KINDS = {
  bug: 'Bug',
  balance: 'Balanceamento (muito fácil ou difícil)',
  idea: 'Ideia ou sugestão',
  other: 'Outro',
};

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

export function buildFeedback({ kind = 'other', text = '', state = null, includeCareer = true, fullHistory = false, userAgent = '' }) {
  const parts = [
    `APEX · feedback · ${FEEDBACK_KINDS[kind] ?? FEEDBACK_KINDS.other}`,
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
