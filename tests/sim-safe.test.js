import { test } from 'node:test';
import assert from 'node:assert/strict';

import { RACE_EVENTS } from '../data/events.js';

test('todo evento de corrida com escolha tem uma opção cautelosa válida para a simulação automática', () => {
  for (const ev of RACE_EVENTS) {
    if (ev.options.length < 2) continue;
    assert.ok(ev.safe, `${ev.id} sem opção cautelosa`);
    assert.ok(ev.options.some((o) => o.id === ev.safe), `${ev.id}: "${ev.safe}" não é uma das opções`);
  }
});
