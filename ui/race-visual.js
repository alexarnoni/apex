import { TRACKS, TRACK_BOX } from '../data/trackPaths.js';

// Cena ilustrativa da corrida. A engine informa apenas a ordem dos carros em cada fase;
// aqui o trecho entre duas fases vira uma volta animada, sem tempos nem distâncias reais.

const NS = 'http://www.w3.org/2000/svg';
const GAP = 0.014;        // espaço entre carros, em fração de volta
const LAP_MS = 7000;      // duração de uma volta na velocidade 1×
const LIGHTS_MS = 1800;   // luzes de largada antes de o pelotão sair
const SAMPLES = 720;
const PRE_START = ['race_strategy', 'race_start'];
const STAGE = { race_strategy: 'Largada', race_start: 'Largada', race_event: 'Na pista', race_pit: 'Box', team_order: 'Rádio', race_finale: 'Final' };
const STATUS = {
  waiting: 'Pista livre antes da corrida.', race_strategy: 'Grid formado.', race_start: 'Grid formado.',
  finish: 'Bandeirada.',
};

const scene = { key: null, phase: null, cars: [], out: [], deltas: {}, feed: [], fresh: 0, segment: null, speed: 1, paused: false };
const lookups = new Map();
let frame = 0;

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (n) => Math.max(0, Math.min(1, n));
const ease = (t) => t * t * (3 - 2 * t);
const places = (n) => `${n} ${n === 1 ? 'posição' : 'posições'}`;

// Compara a ordem recebida com a anterior e devolve o que a tela mostra: setas, abandonos e narração.
// Quando `animate` é verdadeiro e a corrida avançou, prepara o trecho que paintRaceScene vai tocar.
export function raceScene(map, key, animate) {
  const names = map.cars.map(car => car.name);
  const sameRace = scene.key === key;
  const unchanged = sameRace && scene.phase === map.phase && names.join('|') === scene.cars.map(car => car.name).join('|');
  if (unchanged) return model();

  const before = sameRace ? scene.cars : [];
  const previousPhase = sameRace ? scene.phase : null;
  const racing = names.length > 0 && !PRE_START.includes(map.phase);
  const play = animate && racing && !reduced() && map.interruption !== 'red_flag';
  const lines = [];
  if (!sameRace || !animate) Object.assign(scene, { out: [], feed: [] });
  scene.deltas = {};
  scene.segment = null;

  if (animate && racing && before.length) {
    const was = new Map(before.map((car, i) => [car.name, i]));
    const now = new Map(names.map((name, i) => [name, i]));
    const stage = map.phase === 'finish' ? 'Corrida' : STAGE[previousPhase] ?? 'Na pista';
    if (PRE_START.includes(previousPhase)) lines.push({ when: 'Largada', text: 'Apagam-se as luzes.' });
    const gone = before.filter(car => !now.has(car.name));
    for (const car of gone) {
      scene.out.push(car);
      lines.push({ when: 'Abandono', text: car.isPlayer ? 'Sua corrida termina aqui.' : `${car.name} abandona.` });
    }
    const moves = [];
    names.forEach((name, i) => {
      if (!was.has(name)) return;
      const delta = was.get(name) - i;
      if (delta) scene.deltas[name] = delta;
      if (delta && !map.cars[i].isPlayer) moves.push({ name, delta, from: was.get(name) + 1, to: i + 1 });
    });
    if (names[0] !== before[0].name && now.has(before[0].name)) lines.push({ when: stage, text: `${names[0]} assume a liderança.` });
    const you = map.cars.findIndex(car => car.isPlayer);
    const yourDelta = you >= 0 ? scene.deltas[names[you]] : 0;
    if (yourDelta) lines.push({ when: stage, text: `Você ${yourDelta > 0 ? 'ganha' : 'perde'} ${places(Math.abs(yourDelta))}: P${you + 1 + yourDelta} → P${you + 1}.` });
    moves.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    for (const move of moves.filter(m => Math.abs(m.delta) >= 2 && m.to > 1).slice(0, 2)) {
      lines.push({ when: stage, text: `${move.name} ${move.delta > 0 ? 'sobe' : 'cai'} de P${move.from} para P${move.to}.` });
    }
    if (play) {
      scene.segment = {
        elapsed: 0, laps: map.phase === 'finish' ? 2 : 1, hold: PRE_START.includes(previousPhase) ? LIGHTS_MS : 0,
        fromGrid: PRE_START.includes(previousPhase), from: Object.fromEntries(was), out: gone.map(car => ({ ...car, rank: was.get(car.name) })),
      };
    }
  } else if (play) {
    // Etapa delegada inteira: não há ordem anterior, então o pelotão só completa as voltas até a bandeirada.
    scene.segment = { elapsed: 0, laps: 2, hold: 0, fromGrid: false, from: {}, out: [] };
  }

  const known = new Set(scene.feed.map(line => line.text));
  for (const note of map.notes ?? []) if (!known.has(note.text)) lines.push(note);
  if (map.phase === 'finish' && names.length && animate) lines.push({ when: 'Bandeirada', text: `${names[0]} vence.` });
  scene.feed.push(...lines);
  scene.fresh = scene.segment ? lines.length : 0;
  Object.assign(scene, { key, phase: map.phase, cars: map.cars, paused: false });
  return model();
}

function model() {
  return { deltas: scene.deltas, out: scene.out, feed: scene.feed, fresh: scene.segment ? scene.fresh : 0, playing: !!scene.segment, finishing: scene.phase === 'finish', speed: scene.speed };
}

function lookup(id, path) {
  if (lookups.has(id)) return lookups.get(id);
  const length = path.getTotalLength();
  const points = [];
  for (let i = 0; i < SAMPLES; i++) {
    const { x, y } = path.getPointAtLength(length * i / SAMPLES);
    points.push([x, y]);
  }
  lookups.set(id, points);
  return points;
}

// Ponto e direção em uma fração da volta, interpolando a tabela para o movimento ficar suave.
function at(points, fraction) {
  const f = ((fraction % 1) + 1) % 1 * SAMPLES;
  const i = Math.floor(f) % SAMPLES;
  const a = points[i];
  const b = points[(i + 1) % SAMPLES];
  const c = points[(i + 3) % SAMPLES];
  const t = f - Math.floor(f);
  return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, angle: Math.atan2(c[1] - a[1], c[0] - a[0]) };
}

export function paintRaceScene(root, map, colors) {
  cancelAnimationFrame(frame);
  const panel = root.querySelector('.race-visual');
  const track = TRACKS[map.circuit.id];
  if (!panel || !track) return;
  const svg = panel.querySelector('svg');
  svg.setAttribute('viewBox', `0 0 ${TRACK_BOX.w} ${TRACK_BOX.h}`);
  svg.classList.toggle('wet', !!map.wet);
  const element = (tag, attrs, parent = svg) => {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    parent.append(node);
    return node;
  };

  // Pista em camadas: zebra por baixo, asfalto por cima e a linha central tracejada.
  element('path', { d: track.d, class: 'track-kerb' });
  element('path', { d: track.d, class: 'track-kerb-red' });
  const road = element('path', { d: track.d, class: 'track-road' });
  element('path', { d: track.d, class: 'track-centre' });
  const points = lookup(map.circuit.id, road);
  const line = at(points, 0);
  const nx = -Math.sin(line.angle);
  const ny = Math.cos(line.angle);
  for (const [cls, shift] of [['track-finish', 0], ['track-finish alt', .9]]) {
    element('line', {
      class: cls,
      x1: line.x + nx * 3.4 + Math.cos(line.angle) * shift, y1: line.y + ny * 3.4 + Math.sin(line.angle) * shift,
      x2: line.x - nx * 3.4 + Math.cos(line.angle) * shift, y2: line.y - ny * 3.4 + Math.sin(line.angle) * shift,
    });
  }
  if (map.wet) {
    const rain = element('g', { class: 'track-rain', 'aria-hidden': 'true' });
    for (let i = 0; i < 36; i++) {
      const x = (i * 37) % TRACK_BOX.w;
      const y = (i * 53) % TRACK_BOX.h;
      element('line', { x1: x, y1: y, x2: x - 2, y2: y + 6 }, rain);
    }
  }

  const shape = 'M5 0L3 1L3 2.4H1V1.4H-2V2.5H-4V-2.5H-2V-1.4H1V-2.4H3V-1Z';
  const makeCar = (driver, cls) => {
    const node = element('path', { d: shape, fill: colors[driver.team] ?? '#858197', class: cls });
    const title = document.createElementNS(NS, 'title');
    title.textContent = driver.name;
    node.append(title);
    return node;
  };
  const segment = scene.segment;
  const outCars = (segment?.out ?? []).map(driver => ({ driver, node: makeCar(driver, 'visual-car out-car') }));
  const halo = element('circle', { r: 6.5, class: 'you-halo' });
  const cars = map.cars.map((driver, index) => ({
    index, player: !!driver.isPlayer, from: segment?.from[driver.name] ?? index,
    node: makeCar(driver, driver.isPlayer ? 'visual-car you-car' : 'visual-car'),
  }));
  const player = cars.find(car => car.player);
  if (player) svg.append(player.node);
  halo.toggleAttribute('hidden', !player);

  const lights = element('g', { class: 'start-lights', hidden: '' });
  element('rect', { x: 78, y: 3, width: 44, height: 11, rx: 3 }, lights);
  const lamps = [0, 1, 2, 3, 4].map(i => element('circle', { cx: 84 + i * 8, cy: 8.5, r: 2.6 }, lights));

  const put = (node, fraction, side, scale) => {
    const p = at(points, fraction);
    const x = p.x - Math.sin(p.angle) * side;
    const y = p.y + Math.cos(p.angle) * side;
    node.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(p.angle * 180 / Math.PI).toFixed(1)}) scale(${scale})`);
    return { x, y };
  };
  const onGrid = PRE_START.includes(map.phase);
  // progress: 0 no início do trecho, 1 no fim. Sem trecho em andamento, a cena fica parada no fim.
  const place = (progress) => {
    const lap = segment ? segment.laps * progress : 0;
    const grid = onGrid ? 1 : segment?.fromGrid ? 1 - clamp(progress / .12) : 0;
    for (const car of cars) {
      const moving = segment && car.from !== car.index;
      const t = moving ? ease(clamp((progress - (.1 + .5 * car.index / cars.length)) / .3)) : 1;
      const rank = car.from + (car.index - car.from) * t;
      const pass = moving ? Math.sin(Math.PI * t) * 2.1 * Math.sign(car.from - car.index) : 0;
      const stagger = grid * (car.from % 2 ? 1.5 : -1.5);
      const gap = map.interruption === 'safety_car' ? GAP * .55 : GAP;
      const distance = lap - (rank + 1) * gap;
      const crossing = map.phase === 'finish' && segment ? Math.min(distance + cars.length * gap * progress ** 4, segment.laps + .006 + (cars.length - car.index) * gap * .35) : distance;
      const spot = put(car.node, crossing, pass + stagger, car.player ? 1 : .68);
      if (car.player) { halo.setAttribute('cx', spot.x.toFixed(2)); halo.setAttribute('cy', spot.y.toFixed(2)); }
    }
    for (const { driver, node } of outCars) {
      put(node, segment.laps * Math.min(progress, .3) * .5 - (driver.rank + 1) * GAP, -2.6 * clamp(progress / .3), .68);
      node.setAttribute('opacity', (1 - clamp((progress - .3) / .5)).toFixed(2));
    }
  };

  const controls = panel.querySelector('.map-controls');
  const status = panel.querySelector('.scene-status');
  const feed = [...root.querySelectorAll('.race-feed li.fresh')].reverse();
  const reveal = (count) => feed.forEach((item, i) => item.classList.toggle('fresh', i >= count));
  const idle = () => {
    place(1);
    reveal(feed.length);
    for (const { node } of outCars) node.remove();
    lights.setAttribute('hidden', '');
    if (controls) controls.hidden = true;
    if (status) status.textContent = map.interruption === 'red_flag' ? 'Prova suspensa. Escolha os pneus para a retomada.'
      : map.interruption === 'safety_car' ? 'Pelotão agrupado atrás do safety car.'
      : STATUS[map.phase] ?? (map.cars.length ? 'Corrida pausada: a decisão é sua.' : '');
    panel.classList.toggle('flag', map.phase === 'finish');
    root.querySelectorAll('[data-finish-pending]').forEach(node => { node.hidden = true; });
    root.querySelectorAll('[data-finish-reveal]').forEach(node => { node.hidden = false; });
  };
  if (!segment) return idle();

  // Linhas da torre deslizam da posição anterior até a nova.
  if (segment.elapsed === 0) {
    const rows = [...root.querySelectorAll('.race-tower li[data-delta]')];
    for (const row of rows) {
      row.style.transition = 'none';
      row.style.transform = `translateY(${Number(row.dataset.delta) * row.offsetHeight}px)`;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => rows.forEach((row) => {
      row.style.transition = `transform ${1.2 / scene.speed}s ease ${segment.hold / 1000 / scene.speed}s`;
      row.style.transform = '';
    })));
  }

  const finish = () => {
    cancelAnimationFrame(frame);
    scene.segment = null;
    scene.fresh = 0;
    idle();
  };
  const speeds = [...controls.querySelectorAll('[data-scene-speed]')];
  const pause = controls.querySelector('[data-scene="pause"]');
  const syncControls = () => {
    for (const button of speeds) button.setAttribute('aria-pressed', String(Number(button.dataset.sceneSpeed) === scene.speed));
    pause.textContent = scene.paused ? 'Continuar' : 'Pausar';
    pause.setAttribute('aria-pressed', String(scene.paused));
  };
  for (const button of speeds) button.onclick = () => { scene.speed = Number(button.dataset.sceneSpeed); syncControls(); };
  pause.onclick = () => { scene.paused = !scene.paused; syncControls(); };
  controls.querySelector('[data-scene="skip"]').onclick = finish;
  controls.hidden = false;
  panel.classList.remove('flag');
  syncControls();

  const duration = segment.laps * LAP_MS;
  let previous = performance.now();
  function step(now) {
    if (!panel.isConnected) return;
    if (!scene.paused) segment.elapsed += Math.min(120, now - previous) * scene.speed;
    previous = now;
    const waiting = segment.elapsed < segment.hold;
    const progress = clamp((segment.elapsed - segment.hold) / duration);
    lights.toggleAttribute('hidden', !waiting);
    if (waiting) lamps.forEach((lamp, i) => lamp.classList.toggle('on', segment.elapsed > (i + 1) * segment.hold / 6));
    place(progress);
    // A última linha só aparece no fim do trecho, quando os carros chegam.
    reveal(waiting ? 1 : 1 + Math.floor(progress * (feed.length - 1)));
    if (status) status.textContent = scene.paused ? 'Cena pausada.' : waiting ? 'Luzes de largada…' : map.phase === 'finish' ? 'Últimas voltas…' : 'Corrida em andamento…';
    if (progress >= 1) finish();
    else frame = requestAnimationFrame(step);
  }
  step(previous);
}
