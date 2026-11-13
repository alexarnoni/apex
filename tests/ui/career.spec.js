import { test, expect } from '@playwright/test';
import { createCareer, advance, applyDecision, ENGINE_VERSION } from '../../engine/game.js';
import { answerFor } from '../../tools/calibrate/lib.js';
import { enterF1 } from '../../engine/f1.js';
import { createRng } from '../../engine/rng.js';
import { advanceRaces } from '../../engine/advance-races.js';

// Fixtures pela API pública; interação e importação passam pela interface real.
const fixtures = new Map();
function fixture(type, predicate = () => true) {
  if (fixtures.has(type) && predicate(fixtures.get(type))) return fixtures.get(type);
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
// Modo paddock: em tela estreita cada aba mostra só o seu recorte. Abre a aba quando o alvo não está à vista.
async function show(page, selector, view) {
  if (!(await page.locator(selector).first().isVisible())) await page.locator(`[data-act="view"][data-id="${view}"]`).click();
}
// Durante a cena a decisão fica recolhida; pular a animação a revela.
async function skipScene(page) {
  const skip = page.locator('[data-scene-skip]:visible, [data-scene="skip"]:visible').first();
  if (await skip.isVisible()) await skip.click();
}

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

test('largada retoma o save na decisão pendente e registra a resposta sem desfazer', async ({ page }) => {
  const state = fixture('race_start', (s) => s.pendingDecision.payload.grid > 1);
  await importCareer(page, state);
  await expect(page.getByRole('heading', { name: 'Apagam-se as luzes' })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('largada.png'), fullPage: true });
  await expect(page.locator('[data-act="undo"]')).toHaveCount(0);
  expect(await saved(page)).toEqual(state);
  await page.reload();
  await page.locator('[data-act="continue"][data-slot="1"]').click();
  await expect(page.getByRole('heading', { name: 'Apagam-se as luzes' })).toBeVisible();
  await page.locator('[data-act="start"][data-id="hold"]').click();
  expect((await saved(page)).history.at(-1).type).toBe('race_start');
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
  const skip = page.getByRole('button', { name: 'Pular animação' });
  if (await skip.isVisible()) await skip.click();
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
  // A bandeirada da última etapa pode estar em cena: pular revela o painel de simulação.
  await skipScene(page);
  // O painel continua aberto depois de simular: não é preciso reabrir.
  await expect(page.locator('[data-act="simrest"]')).toBeVisible();
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

test('acompanhamento visual permite pular a cena sem responder à decisão', async ({ page }) => {
  const state = fixture('weekend_approach', s => {
    if (s.pendingDecision.payload.out) return false;
    const strategy = applyDecision(s, { id: s.f1.racePlan ?? 'balanced' });
    if (strategy.pendingDecision?.type !== 'race_strategy') return false;
    const start = applyDecision(strategy, { id: strategy.pendingDecision.payload.safe });
    return start.pendingDecision?.type === 'race_start' && start.pendingDecision.payload.options.length > 1
      && applyDecision(start, { id: start.pendingDecision.payload.safe }).f1.season.raceIndex === s.f1.season.raceIndex;
  });
  await importCareer(page, state);
  await page.locator('[data-act="simnext"]').click();
  const strategy = (await saved(page)).pendingDecision;
  await page.locator(`[data-act="strategy"][data-id="${strategy.payload.safe}"]`).click();
  const launch = (await saved(page)).pendingDecision;
  await page.locator(`[data-act="start"][data-id="${launch.payload.safe}"]`).click();
  const scene = page.getByRole('region', { name: 'Mapa da corrida' });
  await expect(scene).toBeVisible();
  expect(await scene.locator('.visual-car').count()).toBeGreaterThan(1);
  await expect(page.getByRole('region', { name: 'Torre de posições' }).locator('li.you')).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'Seu carro' })).toContainText('Pneus');
  await expect(scene.getByRole('list', { name: 'Narração da corrida' }).locator('li').first()).toBeAttached();
  await scene.getByRole('button', { name: 'Velocidade 4×' }).click();
  await expect(scene.getByRole('button', { name: 'Velocidade 4×' })).toHaveAttribute('aria-pressed', 'true');
  const before = await saved(page);
  await scene.getByRole('button', { name: 'Pular animação' }).click();
  await expect(scene).toBeVisible();
  await expect(scene.getByRole('button', { name: 'Pular animação' })).toBeHidden();
  expect(await saved(page)).toEqual(before);
});

test('janela de box retoma após reload e registra a parada na corrida', async ({ page }) => {
  const state = fixture('race_pit', s => !s.pendingDecision.payload.interruption);
  await importCareer(page, state);
  await expect(page.getByRole('heading', { name: 'Janela de box', exact: true })).toBeVisible();
  await expect(page.locator('.focus')).toContainText(`Posição atual · P${state.pendingDecision.payload.position}`);
  await page.reload();
  await page.locator('[data-act="continue"][data-slot="1"]').click();
  await page.getByRole('button', { name: /Parar agora/ }).click();
  const next = await saved(page);
  const result = next.f1.season.cur?.pit?.text ?? next.f1.season.lastRace?.story.find(item => item.when === 'Janela de box')?.text;
  expect(result).toMatch(/voltou em P\d+/);
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
  const start = fixture('weekend_approach', s => {
    const next = advanceRaces(s, { limit: 1 }).state;
    return ['race_event', 'race_pit', 'race_finale', 'team_order'].includes(next.pendingDecision?.type);
  });
  await importCareer(page, start);
  await page.locator('[data-act="simimportant"]').click();
  const after = await saved(page);
  expect(['race_event', 'race_pit', 'race_finale', 'team_order', 'story_event']).toContain(after.pendingDecision.type);
  if (after.pendingDecision.type !== 'story_event') {
    await skipScene(page);
    if (after.pendingDecision.type === 'race_event') {
      await expect(page.getByText(`Posição atual · P${after.pendingDecision.payload.position}`, { exact: true })).toBeVisible();
    }
    await expect(page.locator('.decision-context')).toContainText('Por que decidir agora?');
    await expect(page.locator('.decision-context')).toContainText('A equipe recomenda');
    await page.locator('.focus').scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath('decisao-v010.png'), fullPage: true });
    await page.locator('[data-act="delegate"]').click();
    const delegated = await saved(page);
    expect(delegated.history[after.history.length].type).toBe(after.pendingDecision.type);
    expect(delegated.f1.season.raceIndex - start.f1.season.raceIndex).toBeLessThanOrEqual(1);
  }
});

test('modo de decisões importantes para na bandeirada quando a etapa não tem escolha relevante', async ({ page }) => {
  const start = fixture('weekend_approach', s => advanceRaces(s, { limit: 1 }).state.pendingDecision?.type === 'weekend_approach');
  await importCareer(page, start);
  await page.getByRole('button', { name: 'Só decisões importantes' }).click();
  expect((await saved(page)).f1.season.raceIndex).toBe(start.f1.season.raceIndex + 1);
  await expect(page.locator('.race-result')).toBeHidden();
  await page.getByRole('button', { name: 'Velocidade 4×' }).click();
  await expect(page.locator('.race-result')).toBeVisible();
  const podium = page.getByRole('region', { name: 'Pódio da corrida' });
  await expect(podium.getByText('Seu resultado')).toBeVisible();
  await expect(podium.locator('li')).toHaveCount(3);
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
      await expect(page.locator('.legacy-tier b')).toBeVisible();
      return;
    }
    expect(state.phase).not.toBe('ROTA_ALTERNATIVA');
    // Com a bandeirada em cena, o plano da etapa seguinte só aparece depois de pular ou terminar a cena.
    await skipScene(page);
    const pd = state.pendingDecision;
    if (!pd) { await page.locator('[data-act="next"]').click(); continue; }
    const answer = answerFor(state, 'a', { retireAt: 30 });
    if (pd.type === 'base_choice') {
      await page.locator('[data-act="pick-base"][data-id="A"]').click();
      await page.locator('[data-act="run-base"]').click();
    } else if (pd.type === 'weekend_approach') {
      sawGoal = true;
      await show(page, '.season-pulse', 'season');
      await expect(page.locator('.season-pulse')).toBeVisible();
      await show(page, '[data-act="simnext"]', 'paddock');
      await page.getByText('Controles de acompanhamento', { exact: true }).click();
      await page.locator('[data-act="simrest"]').click();
    } else if (pd.type === 'kart_return') {
      await page.locator('[data-act="event"][data-id="stay"]').click();
    } else if (pd.type === 'contract_terms') {
      sawContract = true;
      await page.locator('[data-act="terms"]').click();
    } else {
      const acts = { academy_invite: 'academy', offer_pick: 'offer', season_focus: 'focus', story_event: 'event', home_race: 'event', race_event: 'event', retire_or_continue: 'retire', race_strategy: 'strategy', race_start: 'start', race_pit: 'pit', race_finale: 'finale', team_order: 'order' };
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
  await show(page, '.roster-panel', 'season');
  await page.getByText('Pilotos e mercado', { exact: true }).click();
  await page.locator('#roster-driver').selectOption('real-Hamilton');
  await expect(page.locator('.roster-panel')).toHaveAttribute('open', '');
  await expect(page.locator('#roster-driver')).toHaveValue('real-Hamilton');
  await expect(page.locator('.roster-panel')).toContainText('Reserva · Ferrari');
  await expect(page.locator('.roster-panel .profile-stat')).toHaveCount(6);
  await show(page, '.pilot-profile summary', 'driver');
  await page.locator('.pilot-profile summary').click();
  await expect(page.locator('.pilot-profile .profile-stat')).toHaveCount(6);
  if (test.info().project.name === 'desktop') {
    const width = await page.locator('#app').evaluate(el => el.clientWidth);
    expect(width).toBeGreaterThan(1500);
  }
  await show(page, '.roster-panel', 'season');
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
  await show(page, '.pilot-profile summary', 'driver');
  await page.locator('.pilot-profile summary').click();
  await expect(page.locator('.pilot-profile')).toContainText('Gestão de pneus');
});
test('o mudo do rádio persiste e a torre é expansível no celular', async ({ page }, info) => {
  await importCareer(page, fixture('race_start'));
  const sound = page.getByRole('button', { name: 'Som do rádio' });
  await expect(sound).toHaveAttribute('aria-pressed', 'true');
  await sound.click();
  await page.reload();
  await page.locator('[data-act="continue"][data-slot="1"]').click();
  await expect(sound).toHaveAttribute('aria-pressed', 'false');

  const tower = page.getByRole('region', { name: 'Torre de posições' });
  const rows = tower.locator('.race-tower li:visible');
  if (info.project.name === 'mobile') {
    const dashboard = await page.locator('.race-dashboard').boundingBox();
    const decision = await page.locator('.race-lead .focus').boundingBox();
    const map = await page.locator('.race-visual').boundingBox();
    expect(dashboard.y).toBeLessThan(decision.y);
    expect(decision.y).toBeLessThan(map.y);
    expect(await rows.count()).toBeLessThanOrEqual(4);
    await expect(rows.locator('.name').filter({ hasText: 'TesteUI' })).toBeVisible();
    await tower.getByText('Abrir grid completo').click();
  }
  expect(await rows.count()).toBeGreaterThan(4);
});

test('modo paddock: abas trocam o recorte e somem durante a corrida', async ({ page }) => {
  await importCareer(page, fixture('weekend_approach'));
  await expect(page.locator(".view-tabs .tab")).toHaveCount(4);
  await expect(page.locator('[data-act="simnext"]')).toBeInViewport();
  await page.locator('[data-act="view"][data-id="driver"]').click();
  await expect(page.locator('.ficha')).toBeVisible();
  await expect(page.locator('.col-main')).toBeHidden();
  await page.locator('[data-act="view"][data-id="season"]').click();
  await expect(page.locator('.ficha')).toBeHidden();
  await expect(page.locator('.col-side')).toBeVisible();
  await page.locator('[data-act="view"][data-id="paddock"]').click();
  await page.locator('[data-act="simnext"]').click();
  if ((await saved(page)).pendingDecision?.type?.startsWith('race_')) await expect(page.locator('.view-tabs')).toHaveCount(0);
});

test('depois da bandeirada, Continuar leva ao próximo passo sem rolar', async ({ page }) => {
  const start = fixture('weekend_approach', (s) => advanceRaces(s, { limit: 1 }).state.pendingDecision?.type === 'weekend_approach');
  await importCareer(page, start);
  await page.locator('[data-act="simimportant"]').click();
  expect((await saved(page)).pendingDecision.type).toBe('weekend_approach');
  await page.locator('[data-scene="skip"]').click();
  const next = page.locator('[data-act="next-stage"]:visible');
  await expect(next).toHaveCount(1);
  await next.click();
  await expect(page.locator('[data-act="simnext"]')).toBeInViewport();
  await expect(page.locator('[data-act="next-stage"]')).toHaveCount(0);
});

test('caixa de entrada: contador aparece depois da corrida, zera ao abrir e continua zerado no reload', async ({ page }) => {
  const state = fixture('weekend_approach');
  await importCareer(page, state);
  await page.getByText('Controles de acompanhamento', { exact: true }).click();
  await page.locator('[data-act="sim5"]').click();
  await skipScene(page);
  await expect(page.getByRole('button', { name: /^Mensagens, \d+ não lidas?$/ })).toBeVisible();
  await expect(page.locator('.race-result').first()).toContainText('Nota');
  await page.locator('[data-act="view"][data-id="inbox"]').click();
  await expect(page.locator('.inbox-list li').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mensagens', exact: true })).toBeVisible();
  await page.reload();
  await page.locator('[data-act="continue"][data-slot="1"]').click();
  await expect(page.getByRole('button', { name: 'Mensagens', exact: true })).toBeVisible();
});

test('caixa de entrada não aparece durante a corrida', async ({ page }) => {
  await importCareer(page, fixture('race_strategy'));
  await skipScene(page);
  await expect(page.locator('[data-act="view"][data-id="inbox"]')).toHaveCount(0);
});

test('briefing, duelo com o companheiro e conta do título aparecem antes da largada; a ficha mostra talento e equipe', async ({ page }) => {
  await importCareer(page, fixture('weekend_approach', (s) => !s.pendingDecision.payload.out));
  await expect(page.locator('.briefing')).toContainText('Briefing');
  await expect(page.locator('.briefing')).toContainText('em pontos');
  await show(page, '.duel-card', 'season');
  await expect(page.locator('.duel-card')).toContainText('Companheiro e título');
  await show(page, '.ficha', 'driver');
  await expect(page.locator('.ficha')).toContainText('Talento');
  await expect(page.locator('.ficha')).toContainText('PERFIL DA EQUIPE ATUAL');
  await expect(page.locator('.ficha-mate')).toContainText('nota geral');
});

test('v0.17: página da equipe, gráfico da temporada, ano a ano, radar e estatísticas completas', async ({ page }) => {
  await importCareer(page, fixture('weekend_approach', (s) => !s.pendingDecision.payload.out && s.f1.season.raceIndex >= 1));
  await show(page, '.team-card', 'season');
  await expect(page.locator('.team-card')).toContainText('nos construtores');
  await expect(page.locator('.season-chart svg')).toBeVisible();
  await page.locator('[data-act="sttab"][data-id="teams"]').click();
  await expect(page.locator('table[aria-label="Classificação de construtores"] img').first()).toBeVisible();
  await show(page, '.ficha', 'driver');
  await page.locator('.pilot-profile summary').click();
  await expect(page.locator('.radar')).toBeVisible();
  await page.locator('.full-stats summary').click();
  await expect(page.locator('.full-stats')).toContainText('Abandonos');
});
