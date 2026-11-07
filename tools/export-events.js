// Exporta todos os textos de eventos para um Markdown de revisão (roadmap 1.3).
//   npm run events  ->  docs/textos-eventos.md
// Edite os textos em data/events.js; este arquivo é só para ler tudo de uma vez.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NARRATIVE_EVENTS, RACE_EVENTS } from '../data/events.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// text(ctx) usa nomes do contexto; aqui entra um contexto de exemplo para o texto sair legível.
const sample = { teamName: 'Equipe', rival: { name: 'Rival' }, player: { name: 'Você' } };

function block(ev) {
  const lines = [`### ${ev.title}  \`${ev.id}\``, '', `Quando: ${ev.phase}${ev.chance ? ` (chance ${Math.round(ev.chance * 100)}% por corrida)` : ''} · peso ${ev.weight}`, '', `> ${ev.text(sample)}`, ''];
  for (const o of ev.options) {
    lines.push(`- **${o.label}**${o.description ? `: ${o.description}` : ''}`);
    for (const out of o.outcomes) lines.push(`  - ${out.p < 1 ? `(${Math.round(out.p * 100)}%) ` : ''}${out.text}`);
  }
  lines.push('');
  return lines.join('\n');
}

const md = [
  '# Textos dos eventos (para revisão)',
  '',
  'Gerado por `npm run events` a partir de `data/events.js`. Para mudar um texto, edite o arquivo de dados e gere de novo.',
  'Tom pedido na spec: segunda pessoa, rádio de equipe e manchete, curto e concreto.',
  '',
  `## Narrativos (${NARRATIVE_EVENTS.length})`,
  '',
  ...NARRATIVE_EVENTS.map(block),
  `## Corrida (${RACE_EVENTS.length})`,
  '',
  ...RACE_EVENTS.map(block),
].join('\n');

writeFileSync(join(root, 'docs/textos-eventos.md'), md);
console.log(`docs/textos-eventos.md · ${NARRATIVE_EVENTS.length} narrativos, ${RACE_EVENTS.length} de corrida`);
