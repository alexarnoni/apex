import { test, expect } from '@playwright/test';
import { createCareer, advance, applyDecision, ENGINE_VERSION } from '../../engine/game.js';
import { answerFor } from '../../tools/calibrate/lib.js';
import { enterF1 } from '../../engine/f1.js';
import { createRng } from '../../engine/rng.js';

// Fixtures pela API pública; interação e importação passam pela interface real.
const fixtures = new Map();
function fixture(type, predicate = () => true) {
  if (fixtures.has(type)) return fixtures.get(type);
  for (let seed = 1; seed <= 10; seed++) {
    let s = createCareer({ surname: 'TesteUI', number: 7, style: 'con', flag: 'BR', age: 15, seed });
    for (let step = 0; step < 2000; step++) {
      if (s.pendingDecision?.type === type && predicate(s)) {
        fixtures.set(type, s);
        return s;
      }
      if (['LEGADO', 'ROTA_ALTERNATIVA'].includes(s.phase)) break;
      s = s.pendingDecision ? applyDecision(s, answerFor(s)) : advance(s);
    }
  }
  throw new Error(`Não encontrou fixture ${type}`);
}

async function importCareer(page, state) {
  await page.goto('/');
  await page.locator('#f-import').setInputFiles({
    name: 'carreira-teste.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ app: 'apex', version: ENGINE_VERSION, state })),
  });
  await expect(page.getByRole('status')).toContainText('Carreira importada no slot 1');
  await page.locator('[data-act="continue"][data-slot="1"]').click();
}

const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('apex.slot.1')).state);

test.beforeEach(async ({ page }) => {
  // Sem dependência de fontes externas, analytics ou envio de feedback nos testes.
  await page.route('**/*', (route) => new URL(route.request().url()).hostname === '127.0.0.1'
    ? route.continue() : route.abort());
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /content security policy|refused to execute/i.test(message.text())) errors.push(message.text());
  });
  test.info().runtimeErrors = errors;
});

test.afterEach(async ({ page }) => {
  expect(test.info().runtimeErrors).toEqual([]);
  if (!page.isClosed()) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth
      || document.getElementById('app').scrollWidth > document.getElementById('app').clientWidth);
    expect(overflow, 'não deve haver rolagem horizontal').toBe(false);
    if (test.info().project.name === 'mobile') {
      const app = await page.locator('#app').boundingBox();
      const feedback = await page.locator('.fab').boundingBox();
      expect(app.y + app.height, 'feedback fica fora da área rolável das decisões').toBeLessThanOrEqual(feedback.y);
    }
  }
});

test('criação, temporada de base e retomada após recarregar', async ({ page }) => {
  await page.goto('/');
  await page.locator('#f-surname').fill('TesteUI');
  await page.locator('#f-number').fill('7');
  await page.locator('#f-seed').fill('5');
  await page.locator('[data-act="create"]').click();
  await expect(page.locator('[data-act="kart-offer"]')).toHaveCount(3);
  await page.reload();
  await page.locator('[data-act="continue"][data-slot="1"]').click();
  await page.locator('[data-act="kart-offer"][data-id="balanced"]').click();
  await expect(page.getByRole('heading', { name: 'Pré-temporada', exact: true })).toBeVisible();
  await page.locator('[data-act="pick-base"][data-id="A"]').click();
  await page.locator('[data-act="run-base"]').click();
  const before = await saved(page);
  expect(before.baseCareer.lastSummary).toBeTruthy();
  await page.reload();
  await page.locator('[data-act="continue"][data-slot="1"]').click();
  expect(await saved(page)).toEqual(before);
  await expect(page.locator('.layout')).toBeVisible();
});

test('início prioriza novo piloto e usa laterais somente no desktop', async ({ page }) => {
  await page.goto('/');
  const order = await page.locator('#create').evaluate(el => {
    const saves = [...document.querySelectorAll('section')].find(s => s.querySelector('h2')?.textContent === 'Suas carreiras');
    return Boolean(el.compareDocumentPosition(saves) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(order).toBe(true);
  await expect(page.getByRole('heading', { name: 'Novo piloto' })).toBeVisible();
  if (test.info().project.name === 'desktop') {
    await expect(page.locator('.home-journey')).toBeVisible();
    await expect(page.locator('.home-guide')).toBeVisible();
  } else await expect(page.locator('.home-aside').first()).toBeHidden();
  await page.screenshot({ path: test.info().outputPath('inicio-v010.png'), fullPage: true });
});

test('largada responde, desfaz e retoma o save na decisão pendente', async ({ page }) => {
  const state = fixture('race_start', (s) => s.pendingDecision.payload.grid > 1);
  await importCareer(page, state);
  await expect(page.getByRole('heading', { name: 'Apagam-se as luzes' })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('largada.png'), fullPage: true });
  await page.locator('[data-act="start"][data-id="hold"]').click();
  expect((await saved(page)).history.at(-1).type).toBe('race_start');
  await page.locator('[data-act="undo"]').click();
  await expect(page.getByRole('heading', { name: 'Apagam-se as luzes' })).toBeVisible();
  const undone = await saved(page);
  expect(undone).toEqual(state);
  await page.reload();
  await page.locator('[data-act="continue"][data-slot="1"]').click();
  await expect(page.getByRole('heading', { name: 'Apagam-se as luzes' })).toBeVisible();
});

test('defesa mostra perseguidor e ceder entra no relato', async ({ page }) => {
  const state = fixture('race_finale', (s) => s.pendingDecision.payload.mode === 'defend');
  await importCareer(page, state);
  await expect(page.locator('.focus')).toContainText('Pressionando logo atrás');
  await expect(page.locator('.focus')).toContainText(state.pendingDecision.payload.rival.name);
  await page.screenshot({ path: test.info().outputPath('defesa.png'), fullPage: true });
  await page.locator('[data-act="finale"][data-id="yield"]').click();
  const after = await saved(page);
  expect(after.f1.season.lastRace.playerPos).toBe(state.pendingDecision.payload.pos + 1);
  expect(after.f1.season.lastRace.story.some((line) => line.when === 'Final (Ceder)')).toBe(true);
  const result = page.locator('.race-result');
  await expect(result.getByText('Corrida encerrada')).toBeVisible();
  await expect(result.locator('.race-position')).toHaveText(`P${after.f1.season.lastRace.playerPos}`);
  await expect(result).toContainText(`${after.f1.season.lastRace.points} ponto`);
  await result.getByText('Ver relato da corrida').click();
  await expect(result.getByText(/cedeu a posição/).first()).toBeVisible();
});

test('simular cinco e resto resolve largada e defesa até pausa narrativa ou fim', async ({ page }) => {
  const state = fixture('weekend_approach');
  await importCareer(page, state);
  await page.getByText('Controles de acompanhamento', { exact: true }).click();
  await page.locator('[data-act="sim5"]').click();
  let after = await saved(page);
  expect(after.f1.season.races.length - state.f1.season.races.length).toBe(5);
  expect(after.pendingDecision.type).toBe('weekend_approach');
  await expect(page.getByRole('status')).toContainText('5');
  await page.getByText('Controles de acompanhamento', { exact: true }).click();
  await page.locator('[data-act="simrest"]').click();
  after = await saved(page);
  expect(after.f1.season.races.length).toBeGreaterThan(5);
  expect(['story_event', null]).toContain(after.pendingDecision?.type ?? null);
  await expect(page.getByRole('status')).toContainText(/notícia|terminou/);
});

test('parar nas decisões interrompe a simulação antes de decidir pneus', async ({ page }) => {
  await importCareer(page, fixture('weekend_approach'));
  await page.getByText('Controles de acompanhamento', { exact: true }).click();
  await page.locator('#t-stop').check();
  await page.locator('[data-act="sim5"]').click();
  expect((await saved(page)).pendingDecision.type).toBe('race_strategy');
  await expect(page.getByRole('status')).toContainText('estratégia de pneus');
});

test('plano muda sem gastar etapa, persiste no reload e meta fica visível', async ({ page }) => {
  const state = fixture('weekend_approach');
  await importCareer(page, state);
  await expect(page.locator('.season-pulse')).toContainText('Sua temporada');
  await page.locator('#race-plan').selectOption('conservative');
  const after = await saved(page);
  expect(after.f1.racePlan).toBe('conservative');
  expect(after.f1.season.raceIndex).toBe(state.f1.season.raceIndex);
  expect(after.rngState).toBe(state.rngState);
  await page.reload();
  await page.locator('[data-act="continue"][data-slot="1"]').click();
  await expect(page.locator('#race-plan')).toHaveValue('conservative');
  await page.locator('.focus').scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath('plano-v010.png'), fullPage: true });
});

test('avanço contextual mostra motivo e permite delegar a decisão atual', async ({ page }) => {
  await importCareer(page, fixture('weekend_approach'));
  await page.locator('[data-act="simimportant"]').click();
  const after = await saved(page);
  expect(['race_event', 'race_finale', 'team_order', 'story_event']).toContain(after.pendingDecision.type);
  if (after.pendingDecision.type !== 'story_event') {
    if (after.pendingDecision.type === 'race_event') {
      await expect(page.getByText(`Posição atual · P${after.pendingDecision.payload.position}`, { exact: true })).toBeVisible();
    }
    await expect(page.locator('.decision-context')).toContainText('Por que decidir agora?');
    await expect(page.locator('.decision-context')).toContainText('A equipe recomenda');
    await page.locator('.focus').scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath('decisao-v010.png'), fullPage: true });
    await page.locator('[data-act="delegate"]').click();
    expect((await saved(page)).history.length).toBeGreaterThan(after.history.length);
  }
});

test('carreira inteira por cliques: criação, base, temporadas, contratos e legado', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await page.locator('#f-surname').fill('CarreiraUI');
  await page.locator('#f-number').fill('7');
  // Nem toda seed progride até a F1; este cenário exercita um caminho que chega ao grid.
  await page.locator('#f-seed').fill(String(fixture('weekend_approach').seed));
  await page.locator('[data-act="create"]').click();
  await page.locator('[data-act="kart-offer"][data-id="balanced"]').click();
  let sawContract = false;
  let sawGoal = false;
  for (let step = 0; step < 350; step++) {
    const state = await saved(page);
    if (state.phase === 'LEGADO') {
      expect(sawContract).toBe(true);
      expect(sawGoal).toBe(true);
      await expect(page.locator('[data-act="copy"]')).toBeVisible();
      return;
    }
    expect(state.phase).not.toBe('ROTA_ALTERNATIVA');
    const pd = state.pendingDecision;
    if (!pd) { await page.locator('[data-act="next"]').click(); continue; }
    const answer = answerFor(state, 'a', { retireAt: 30 });
    if (pd.type === 'base_choice') {
      await page.locator('[data-act="pick-base"][data-id="A"]').click();
      await page.locator('[data-act="run-base"]').click();
    } else if (pd.type === 'weekend_approach') {
      sawGoal = true;
      await expect(page.locator('.season-pulse')).toBeVisible();
      await page.getByText('Controles de acompanhamento', { exact: true }).click();
      await page.locator('[data-act="simrest"]').click();
    } else if (pd.type === 'kart_return') {
      await page.locator('[data-act="event"][data-id="stay"]').click();
    } else if (pd.type === 'contract_terms') {
      sawContract = true;
      await page.locator('[data-act="terms"]').click();
    } else {
      const acts = { academy_invite: 'academy', offer_pick: 'offer', season_focus: 'focus', story_event: 'event', home_race: 'event', race_event: 'event', retire_or_continue: 'retire', race_strategy: 'strategy', race_start: 'start', race_finale: 'finale', team_order: 'order' };
      const id = pd.type === 'academy_invite' ? 'yes' : answer.id;
      await page.locator(`[data-act="${acts[pd.type]}"][data-id="${id}"]`).click();
    }
  }
  throw new Error('carreira não chegou ao legado');
});

function ferrariFixture() {
  // Fixture controlada para exercitar a vaga concreta citada pelo usuário.
  const s = createCareer({ surname: 'TesteUI', number: 7, style: 'con', age: 15, seed: 8 });
  s.player.skill = 85; s.player.potential = 95;
  enterF1(s, createRng(8), 'fer');
  return s;
}

test('consulta Hamilton reserva e perfil do jogador sem perder a seleção', async ({ page }) => {
  const state = ferrariFixture();
  if (test.info().project.name === 'desktop') await page.setViewportSize({ width: 1920, height: 1080 });
  await importCareer(page, state);
  await page.getByText('Pilotos e mercado', { exact: true }).click();
  await page.locator('#roster-driver').selectOption('real-Hamilton');
  await expect(page.locator('.roster-panel')).toHaveAttribute('open', '');
  await expect(page.locator('#roster-driver')).toHaveValue('real-Hamilton');
  await expect(page.locator('.roster-panel')).toContainText('Reserva · Ferrari');
  await expect(page.locator('.roster-panel .profile-stat')).toHaveCount(6);
  await page.locator('.pilot-profile summary').click();
  await expect(page.locator('.pilot-profile .profile-stat')).toHaveCount(6);
  if (test.info().project.name === 'desktop') {
    const width = await page.locator('#app').evaluate(el => el.clientWidth);
    expect(width).toBeGreaterThan(1500);
  }
  await page.locator('.roster-panel').scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath('perfis-v011.png'), fullPage: true });
});

test('treino direcionado fica salvo e o perfil acompanha a evolução', async ({ page }) => {
  await importCareer(page, ferrariFixture());
  await page.locator('#training-focus').selectOption('tyres');
  await page.locator('[data-act="focus"][data-id="train"]').click();
  const state = await saved(page);
  expect(state.f1.trainingFocus).toBe('tyres');
  expect(state.player.attributes.tyres).toBeGreaterThan(85);
  await page.reload();
  await page.locator('[data-act="continue"][data-slot="1"]').click();
  await page.locator('.pilot-profile summary').click();
  await expect(page.locator('.pilot-profile')).toContainText('Gestão de pneus');
});
