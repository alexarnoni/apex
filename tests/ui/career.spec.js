import { test, expect } from '@playwright/test';
import { createCareer, advance, applyDecision, ENGINE_VERSION } from '../../engine/game.js';
import { answerFor } from '../../tools/calibrate/lib.js';

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
  await expect(page.locator('#app')).toContainText('cedeu a posição');
});

test('simular cinco e resto resolve largada e defesa até pausa narrativa ou fim', async ({ page }) => {
  const state = fixture('weekend_approach');
  await importCareer(page, state);
  await page.locator('[data-act="sim5"]').click();
  let after = await saved(page);
  expect(after.f1.season.races.length - state.f1.season.races.length).toBe(5);
  expect(after.pendingDecision.type).toBe('weekend_approach');
  await expect(page.getByRole('status')).toContainText('5');
  await page.locator('[data-act="simrest"]').click();
  after = await saved(page);
  expect(after.f1.season.races.length).toBeGreaterThan(5);
  expect(['story_event', null]).toContain(after.pendingDecision?.type ?? null);
  await expect(page.getByRole('status')).toContainText(/notícia|terminou/);
});

test('parar nas decisões interrompe a simulação antes de decidir pneus', async ({ page }) => {
  await importCareer(page, fixture('weekend_approach'));
  await page.locator('#t-stop').check();
  await page.locator('[data-act="sim5"]').click();
  expect((await saved(page)).pendingDecision.type).toBe('race_strategy');
  await expect(page.getByRole('status')).toContainText('estratégia de pneus');
});
