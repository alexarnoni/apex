// Largada simplificada: aplica o efeito sobre o resultado bruto, antes dos pontos.
// Não é um modelo por volta; a escolha padrão não altera o resultado nem consome RNG.
import { CONFIG } from './config.js';
import { EFFECTS } from './events.js';

export function startOptions({ grid }) {
  const hold = { id: 'hold', label: 'Largar com margem', description: 'Priorizar uma primeira curva limpa, sem assumir o risco extra de uma tentativa de ultrapassagem.' };
  return {
    options: grid === 1 ? [hold] : [
      { id: 'attack', label: 'Atacar na primeira curva', description: 'Tentar ganhar uma posição. Pode perder uma se errar a manobra, ou abandonar por um toque; chuva e pista de rua aumentam o risco.' },
      hold,
    ],
    safe: 'hold',
  };
}

export function resolveStart(w, player, choice, ctx, rng) {
  const { options } = startOptions(ctx);
  if (!options.some((o) => o.id === choice)) throw new Error('opção de largada inválida');
  const before = w.result.indexOf(player);
  let kind = 'none';
  let requestedShift = 0;
  let position = ctx.grid;
  let text = `Você largou com margem de P${ctx.grid}, sem arriscar uma manobra extra na primeira curva.`;
  if (choice === 'attack') {
    const S = CONFIG.start;
    const contact = S.contact + (ctx.wet ? S.wetContact : 0) + (ctx.tags.includes('rua') ? S.streetContact : 0);
    const gain = S.gain + (player.style === 'agg' ? S.aggressiveGain : 0);
    const roll = rng.next();
    if (roll < contact) {
      kind = 'dnf'; position = null;
      EFFECTS.dnf({ w, player });
      text = 'Você tentou abrir espaço na primeira curva, houve um toque e sua corrida terminou ali.';
    } else if (roll < contact + gain) {
      kind = 'good'; requestedShift = 1; position = ctx.grid - 1;
      text = `Você encontrou espaço na primeira curva e passou de P${ctx.grid} para P${position}.`;
    } else if (roll < contact + gain + S.loss) {
      kind = 'bad'; position = Math.min(ctx.gridSize, ctx.grid + 1); requestedShift = ctx.grid - position;
      text = position === ctx.grid ? `Você ficou sem espaço para avançar e seguiu em P${ctx.grid}.`
        : `Você ficou sem espaço na primeira curva e caiu de P${ctx.grid} para P${position}.`;
    } else {
      text = `Você tentou atacar na primeira curva, mas seguiu em P${ctx.grid}.`;
    }
    if (requestedShift) EFFECTS.shift({ w, player }, requestedShift);
  }
  const shift = kind === 'dnf' ? null : before - w.result.indexOf(player);
  return { kind, shift, position, text, label: choice === 'attack' ? 'Atacar' : 'Com margem' };
}
