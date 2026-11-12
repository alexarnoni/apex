// Caixa de entrada e manchete: derivadas do estado. Não sorteiam, não gravam nada e não mudam a carreira.
import { circuitFor } from '../data/circuits.js';

const MAX = 40;
const LOG_KIND = {
  contract: 'equipe', trust: 'equipe', academy: 'equipe', promotion: 'equipe', offer: 'equipe', start: 'equipe',
  transfer: 'mercado',
  event: 'imprensa', season: 'imprensa', retire: 'imprensa', alt_route: 'imprensa', kart_return: 'imprensa',
};
const LOG_TITLE = {
  contract: 'Contrato', trust: 'Confiança da equipe', academy: 'Academia', promotion: 'Subida de categoria', offer: 'Proposta',
  start: 'Começo da carreira', transfer: 'Troca de equipe', event: 'Notícia', season: 'Temporada encerrada',
  retire: 'Aposentadoria', alt_route: 'Outro caminho', kart_return: 'Volta ao kart',
};
const SENDER = { equipe: 'Chefe de equipe', mercado: 'Mercado', imprensa: 'Imprensa', corrida: 'Engenheiro de corrida', marco: 'Paddock' };
const MOVE_TITLE = { transfer: 'Troca de equipe', rookie: 'Estreia', return: 'Retorno', reserve: 'Reserva', available: 'Sem assento', retire: 'Aposentadoria' };

const fmtRating = (n) => n.toFixed(1).replace('.', ',');

function moveText(m) {
  if (m.kind === 'transfer') return `${m.name} sai da ${m.from ?? '—'} e vai para a ${m.to ?? '—'}.`;
  if (m.kind === 'rookie') return `${m.name} estreia na ${m.to ?? '—'}${m.origin ? ` (${m.origin})` : ''}.`;
  if (m.kind === 'return') return `${m.name} volta ao grid pela ${m.to}.`;
  if (m.kind === 'reserve') return `${m.name} segue no paddock, agora como reserva da ${m.to}.`;
  if (m.kind === 'available') return `${m.name} deixa a ${m.from ?? 'equipe'} e avalia oportunidades.`;
  return `${m.name} encerra sua participação na F1${m.age ? ` aos ${m.age} anos` : ''}${m.from ? `, após correr pela ${m.from}` : ''}.`;
}

function logMessages(state) {
  return state.careerLog.flatMap((entry, i) => {
    const kind = LOG_KIND[entry.type];
    if (!kind) return [];
    return [{ id: `log:${i}`, kind, from: SENDER[kind], title: LOG_TITLE[entry.type], text: entry.text, year: entry.year, order: entry.type === 'season' ? 900 : 1 }];
  });
}

// Uma mensagem por corrida disputada, mais no máximo um marco por corrida (primeira vitória, pódio ou pontos da temporada).
function raceMessages(state, season) {
  const out = [];
  const seen = new Set();
  const prev = state.f1?.seasons ?? [];
  const careerFirst = { win: !prev.some((s) => s.wins > 0), podium: !prev.some((s) => s.podiums > 0) };
  for (const r of season?.races ?? []) {
    const gp = circuitFor(r.n).gp;
    const label = r.rating != null ? `Nota ${fmtRating(r.rating)} · ${gp}` : gp;
    let text;
    if (r.missed) text = 'Você não disputou esta etapa.';
    else if (!r.playerPos) text = `Abandono${r.grid ? `, depois de largar em P${r.grid}` : ''}.`;
    else {
      const mate = r.teammatePos && r.teammateName ? `, ${r.playerPos < r.teammatePos ? 'à frente' : 'atrás'} de ${r.teammateName}` : '';
      text = `${r.grid ? `Largou em P${r.grid} e chegou` : 'Chegou'} em P${r.playerPos}${mate}.`;
    }
    const order = 10 + r.n;
    out.push({ id: `corrida:${state.year}:${r.n}`, kind: 'corrida', from: SENDER.corrida, title: label, text, year: state.year, order });

    if (r.missed || !r.playerPos) continue;
    const milestones = [
      { key: 'win', ok: r.playerPos === 1, title: 'Primeira vitória', first: careerFirst.win, career: `Primeira vitória na F1, em ${gp}.`, season: `Primeira vitória da temporada, em ${gp}.` },
      { key: 'podium', ok: r.playerPos <= 3, title: 'Primeiro pódio', first: careerFirst.podium, career: `Primeiro pódio na F1, em ${gp}.`, season: `Primeiro pódio da temporada, em ${gp}.` },
      { key: 'points', ok: r.points > 0, title: 'Primeiros pontos', first: false, career: null, season: `Primeiros pontos da temporada, em ${gp}.` },
    ];
    const hit = milestones.find((m) => m.ok && !seen.has(m.key));
    if (!hit) continue;
    seen.add(hit.key);
    out.push({ id: `marco:${state.year}:${hit.key}`, kind: 'marco', from: SENDER.marco, title: hit.title, text: hit.first && hit.career ? hit.career : hit.season, year: state.year, order: order + 0.5 });
  }
  return out;
}

// Movimentações de mercado: só na pré-temporada e nas três primeiras etapas.
function marketMessages(state, season) {
  if (season && (season.raceIndex ?? 0) >= 3) return [];
  return (state.f1?.world?.lastMoves ?? []).slice(0, 12).map((m, i) => ({
    id: `mercado:${state.year}:${i}`, kind: 'mercado', from: SENDER.mercado, title: MOVE_TITLE[m.kind] ?? 'Mercado', text: moveText(m), year: state.year, order: 5,
  }));
}

export function inboxView(state) {
  const season = state.f1?.season ?? null;
  const built = [...logMessages(state), ...raceMessages(state, season), ...marketMessages(state, season)]
    .map((m, seq) => ({ ...m, seq }));
  return built
    .sort((a, b) => (b.year - a.year) || (b.order - a.order) || (b.seq - a.seq))
    .slice(0, MAX)
    .map(({ id, kind, from, title, text, year }) => ({ id, kind, from, title, text, year }));
}

// Manchete da última corrida: vitória, pódio ou ultrapassagem sobre o companheiro largando atrás dele.
export function headlineFor(state) {
  const race = state.f1?.season?.lastRace ?? null;
  if (!race || race.missed || !race.playerPos) return null;
  const me = state.player.name;
  const gp = circuitFor(race.n).gp;
  if (race.playerPos === 1) return { title: `${me} vence o ${gp}`, text: `Etapa ${race.n} da temporada ${state.year}.` };
  if (race.playerPos <= 3) return { title: `${me} no pódio em ${gp}`, text: `Etapa ${race.n} da temporada ${state.year}.` };
  if (race.teammateName && race.teammatePos && race.playerPos < race.teammatePos && race.teammateGrid && race.grid > race.teammateGrid) {
    return { title: `${me} supera ${race.teammateName} em ${gp}`, text: `Largou atrás do companheiro e chegou à frente dele.` };
  }
  return null;
}
