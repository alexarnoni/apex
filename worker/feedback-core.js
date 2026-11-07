// Núcleo do Worker de feedback (Cloudflare). Sem dependências da Cloudflare: o que depende do runtime
// (a classe EmailMessage) entra por `deps.makeMessage`, então tudo aqui roda e é testado em Node.
//
// Fluxo: o jogo faz POST de um JSON; o Worker valida (origem, tamanho, campos, limite de envios),
// monta um e-mail em texto e envia pelo binding `send_email` para um destino verificado no Email Routing.

export const LIMITS = { body: 16000, text: 2000, report: 8000, contact: 120, version: 40 };

const KIND_LABEL = {
  bug: 'Bug',
  balance: 'Balanceamento',
  idea: 'Ideia',
  career: 'Fim de carreira',
  other: 'Outro',
};

const clean = (v, max) => String(v ?? '').replace(/\r/g, '').slice(0, max);
// Uma linha só: impede quebra de linha em cabeçalhos de e-mail (injeção de cabeçalho).
const oneLine = (v, max) => clean(v, max).replace(/\s+/g, ' ').trim();
const looksLikeEmail = (v) => /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(v);

export function originAllowed(origin, allowedCsv) {
  if (!origin) return false;
  return String(allowedCsv ?? '').split(',').map((s) => s.trim()).filter(Boolean).includes(origin);
}

// Valida e normaliza o corpo. Devolve { spam: true } para o campo-isca preenchido (robôs).
export function parsePayload(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, status: 400, error: 'Corpo inválido.' };
  if (String(raw.website ?? '').trim() !== '') return { ok: true, spam: true };
  const kind = Object.hasOwn(KIND_LABEL, raw.kind) ? raw.kind : 'other';
  const text = clean(raw.text, LIMITS.text).trim();
  const r = Number(raw.rating);
  const rating = Number.isInteger(r) && r >= 1 && r <= 5 ? r : null;
  if (!text && !rating) return { ok: false, status: 400, error: 'Escreva uma mensagem ou dê uma nota.' };
  return {
    ok: true,
    data: {
      kind,
      text,
      rating,
      contact: oneLine(raw.contact, LIMITS.contact),
      report: clean(raw.report, LIMITS.report).trim(),
      version: oneLine(raw.version, LIMITS.version),
    },
  };
}

// Base64 de um texto UTF-8 sem Buffer (que não existe no Worker sem nodejs_compat): TextEncoder + btoa.
function b64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
// Assunto em ASCII passa direto; com acento vira "encoded-word" UTF-8 (RFC 2047).
export function encodeSubject(s) {
  // eslint-disable-next-line no-control-regex
  return /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`;
}

export function buildSubject(d) {
  const first = oneLine(d.text.split('\n')[0] ?? '', 60);
  const parts = [`[Bandeirada] ${KIND_LABEL[d.kind]}`];
  if (d.rating) parts.push(`nota ${d.rating}/5`);
  if (first) parts.push(first);
  return parts.join(' · ');
}

export function formatBody(d) {
  const lines = [`Tipo: ${KIND_LABEL[d.kind]}`];
  if (d.rating) lines.push(`Nota: ${d.rating}/5`);
  if (d.contact) lines.push(`Contato: ${d.contact}`);
  if (d.version) lines.push(`Versão do jogo: ${d.version}`);
  lines.push('', 'Mensagem:', d.text || '(sem texto, só a nota)');
  if (d.report) lines.push('', '--- relatório do jogo ---', d.report);
  return lines.join('\n');
}

const wrap76 = (b64) => b64.replace(/(.{76})/g, '$1\r\n');

// E-mail em texto, UTF-8, corpo em base64 (aceita qualquer caractere sem se preocupar com 7 bits).
export function buildMime({ from, to, subject, body, replyTo, now = new Date() }) {
  const domain = from.split('@')[1] ?? 'localhost';
  const headers = [
    `From: Bandeirada <${from}>`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    `Date: ${now.toUTCString()}`,
    `Message-ID: <${now.getTime().toString(36)}.${Math.random().toString(36).slice(2, 10)}@${domain}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  ];
  if (replyTo && looksLikeEmail(replyTo)) headers.push(`Reply-To: ${replyTo}`);
  return `${headers.join('\r\n')}\r\n\r\n${wrap76(b64(body))}\r\n`;
}

// Limitador simples em memória (por instância do Worker, então é só uma primeira barreira;
// o limite de verdade deve ser uma regra de Rate Limiting da Cloudflare na rota).
export function createRateLimiter({ max, windowMs, now = () => Date.now() }) {
  const hits = new Map();
  return function allow(key) {
    const t = now();
    const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
    if (recent.length >= max) { hits.set(key, recent); return false; }
    recent.push(t);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear(); // não deixa a memória crescer sem fim
    return true;
  };
}

const limiter = createRateLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

function corsHeaders(origin) {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}

const json = (status, body, extra = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...extra } });

export async function handleFeedback(request, env, deps = {}) {
  const origin = request.headers.get('origin');
  const allowed = originAllowed(origin, env.ALLOWED_ORIGINS);
  const cors = allowed ? corsHeaders(origin) : {};
  const rate = deps.limiter ?? limiter;

  if (request.method === 'OPTIONS') return allowed ? new Response(null, { status: 204, headers: cors }) : json(403, { ok: false, error: 'Origem não permitida.' });
  if (request.method !== 'POST') return json(405, { ok: false, error: 'Use POST.' }, { allow: 'POST, OPTIONS', ...cors });
  if (!allowed) return json(403, { ok: false, error: 'Origem não permitida.' });

  if (!env.EMAIL || !env.FEEDBACK_FROM || !env.FEEDBACK_TO) return json(500, { ok: false, error: 'Feedback não configurado.' }, cors);

  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > LIMITS.body) return json(413, { ok: false, error: 'Mensagem grande demais.' }, cors);
  const rawText = await request.text();
  if (rawText.length > LIMITS.body) return json(413, { ok: false, error: 'Mensagem grande demais.' }, cors);

  let raw;
  try { raw = JSON.parse(rawText); } catch { return json(400, { ok: false, error: 'Corpo inválido.' }, cors); }

  if (!rate(request.headers.get('cf-connecting-ip') ?? 'anon')) return json(429, { ok: false, error: 'Muitos envios seguidos.' }, cors);

  const parsed = parsePayload(raw);
  if (!parsed.ok) return json(parsed.status, { ok: false, error: parsed.error }, cors);
  if (parsed.spam) return json(200, { ok: true }, cors); // robô: finge que deu certo, não envia

  const d = parsed.data;
  const mime = buildMime({ from: env.FEEDBACK_FROM, to: env.FEEDBACK_TO, subject: buildSubject(d), body: formatBody(d), replyTo: d.contact, now: deps.now });
  try {
    await env.EMAIL.send(deps.makeMessage(env.FEEDBACK_FROM, env.FEEDBACK_TO, mime));
  } catch (e) {
    console.error('feedback: falha ao enviar e-mail', e?.message ?? e);
    return json(502, { ok: false, error: 'Não foi possível enviar agora.' }, cors);
  }
  return json(200, { ok: true }, cors);
}
