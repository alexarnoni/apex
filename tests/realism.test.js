import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createRng } from '../engine/rng.js';
import { createWorld, advanceYear } from '../engine/world.js';
import { resetRookieCounter } from '../engine/drivers.js';
import { TEAMS_F1, DRIVERS_F1 } from '../data/world2026.js';
import { CATEGORIES } from '../data/categories.js';
import { SURNAMES } from '../data/names.js';

// Regressão do realismo do mundo (calibrado em 2026-11-07): o nível do grid não pode cair com os anos,
// senão pilotos fracos (ex.: habilidade ~80) viram campeões no fim da carreira do jogador.
test('o nível dos campeões se mantém nos anos 15 a 25 e o campeão quase nunca é fraco', () => {
  const late = [];
  for (let r = 0; r < 30; r++) {
    resetRookieCounter();
    const rng = createRng(9000 + r);
    const world = createWorld({ teams: TEAMS_F1, drivers: DRIVERS_F1, category: CATEGORIES.f1, names: SURNAMES });
    for (let y = 1; y <= 25; y++) {
      const result = advanceYear(world, rng);
      if (y >= 15) late.push(result.champion.skill);
    }
  }
  const mean = late.reduce((a, b) => a + b, 0) / late.length;
  const weak = late.filter((s) => s < 85).length / late.length;
  assert.ok(mean >= 88, `habilidade média do campeão nos anos 15-25: ${mean.toFixed(1)} (esperado >= 88)`);
  assert.ok(weak <= 0.12, `campeões com habilidade < 85 nos anos 15-25: ${(weak * 100).toFixed(0)}% (esperado <= 12%)`);
});
