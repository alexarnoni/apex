import { TRACKS } from '../data/trackPaths.js';

// Cena ilustrativa da corrida. A engine informa apenas a ordem dos carros em cada fase;
// aqui o trecho entre duas fases vira uma volta animada, sem tempos nem distâncias reais.

const NS = 'http://www.w3.org/2000/svg';
const GAP = 0.014;        // espaço entre carros, em fração de volta
const LAP_MS = 7000;      // duração de uma volta na velocidade 1×
const LIGHTS_MS = 1800;   // luzes de largada antes de o pelotão sair
const SAMPLES = 720;
const PRE_START = ['race_strategy', 'race_start'];
// Rótulo dos lances entre duas decisões. "Largada" fica só para as luzes; o trecho depois dela já é corrida.
const STAGE = { race_strategy: 'Primeiras voltas', race_start: 'Primeiras voltas', race_event: 'Na pista', duelo_pista: 'Duelo na pista', race_pit: 'Depois do box', team_order: 'Rádio', race_finale: 'Final' };
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
// Fração do trecho em que o carro que termina na posição `index` começa a trocar de lugar, e quanto dura a troca.
// A cena, a narração e a torre usam os mesmos números, para o que se lê acontecer junto com o que se vê.
const MOVE_SPAN = .3;
const moveStart = (index, total) => .1 + .5 * index / Math.max(1, total);
const moveAt = (index, total) => Math.min(1, moveStart(index, total) + MOVE_SPAN / 2);

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
    const stage = map.phase === 'finish' ? 'Corrida' : STAGE[previousPhase === 'race_event' && scene.eventId === 'duelo_pista' ? scene.eventId : previousPhase] ?? 'Na pista';
    if (PRE_START.includes(previousPhase)) lines.push({ when: 'Largada', text: 'Apagam-se as luzes.', at: 0 });
    const gone = before.filter(car => !now.has(car.name));
    for (const car of gone) {
      scene.out.push(car);
      lines.push({ when: 'Abandono', text: car.isPlayer ? 'Sua corrida termina aqui.' : `${car.name} abandona.`, at: .3 });
    }
    const moves = [];
    names.forEach((name, i) => {
      if (!was.has(name)) return;
      const delta = was.get(name) - i;
      if (delta) scene.deltas[name] = delta;
      if (delta && !map.cars[i].isPlayer) moves.push({ name, delta, from: was.get(name) + 1, to: i + 1 });
    });
    if (names[0] !== before[0].name && now.has(before[0].name)) lines.push({ when: stage, text: `${names[0]} assume a liderança.`, at: moveAt(0, names.length) });
    const you = map.cars.findIndex(car => car.isPlayer);
    const yourDelta = you >= 0 ? scene.deltas[names[you]] : 0;
    const moveTime = moveAt(you, names.length);
    const playerGap = map.interruption === 'safety_car' ? GAP * .55 : GAP;
    const moveSector = sectorAt(moveTime - (you + 1 + yourDelta / 2) * playerGap) + 1;
    if (yourDelta) lines.push({ when: play && map.phase !== 'finish' ? `${stage} · S${moveSector}` : stage, text: `Você ${yourDelta > 0 ? 'ganha' : 'perde'} ${places(Math.abs(yourDelta))}: P${you + 1 + yourDelta} → P${you + 1}.`, at: moveAt(you, names.length) });
    moves.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    for (const move of moves.filter(m => Math.abs(m.delta) >= 2 && m.to > 1).slice(0, 2)) {
      lines.push({ when: stage, text: `${move.name} ${move.delta > 0 ? 'sobe' : 'cai'} de P${move.from} para P${move.to}.`, at: moveAt(move.to - 1, names.length) });
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
  // Relato da engine: fala do que a sua decisão causou, então entra junto com a troca de posição do seu carro.
  // A chegada só entra quando os carros cruzam a linha.
  const you = map.cars.findIndex(car => car.isPlayer);
  const noteAt = you >= 0 ? moveAt(you, names.length) : .55;
  for (const note of map.notes ?? []) if (!known.has(note.text)) lines.push({ ...note, at: note.when === 'Chegada' ? 1 : noteAt });
  if (map.phase === 'finish' && names.length && animate) lines.push({ when: 'Bandeirada', text: `${names[0]} vence.`, at: 1 });
  // Ordem de exibição igual à ordem em que as coisas acontecem na pista.
  lines.forEach((line, i) => { line.order = i; });
  lines.sort((a, b) => (a.at ?? 0) - (b.at ?? 0) || a.order - b.order);
  scene.feed.push(...lines);
  scene.fresh = scene.segment ? lines.length : 0;
  Object.assign(scene, { key, phase: map.phase, eventId: map.eventId, cars: map.cars, paused: false });
  return model();
}

// Os traçados vêm em pontos inteiros numa grade de 200×140, o que deixa as curvas em degraus.
// Corta os cantos duas vezes (Chaikin) só para desenhar; os dados de origem não mudam.
const smoothed = new Map();
const TRACK_ROTATION = { sau: -55, can: -50, ita: -45, abu: -48, bel: -35 };
function smoothPath(id, d) {
  if (smoothed.has(id)) return smoothed.get(id);
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  let pts = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
  let out = d;
  if (pts.length >= 4 && !/[^MLZ\d\s.,-]/i.test(d)) {
    const rotation = TRACK_ROTATION[id];
    if (rotation) {
      const angle = rotation * Math.PI / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      pts = pts.map(([x, y]) => [100 + (x - 100) * cos - (y - 70) * sin, 70 + (x - 100) * sin + (y - 70) * cos]);
    }
    for (let pass = 0; pass < 2; pass++) {
      const next = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i];
        const [bx, by] = pts[(i + 1) % pts.length];
        next.push([ax * .75 + bx * .25, ay * .75 + by * .25], [ax * .25 + bx * .75, ay * .25 + by * .75]);
      }
      pts = next;
    }
    out = `M${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`;
  }
  smoothed.set(id, out);
  return out;
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

const circuitDrawings = new Map();
const SECTORS = ['#92e5eb', '#ffd07d', '#d6afff'];
const sectorAt = fraction => Math.floor(((fraction % 1 + 1) % 1) * SECTORS.length);
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const nonlocal = (i, j) => Math.min(Math.abs(i - j), SAMPLES - Math.abs(i - j)) > 16;
const pathFrom = points => `M${points.map(p => p.map(n => n.toFixed(2)).join(' ')).join('L')}`;

function svgElement(svg, tag, attrs, parent = svg) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  parent.append(node);
  return node;
}

function circuitDrawing(id, points) {
  if (circuitDrawings.has(id)) return circuitDrawings.get(id);
  const nearby = points.map((p, i) => points.reduce((min, q, j) => nonlocal(i, j) ? Math.min(min, distance(p, q)) : min, Infinity));
  const runs = [];
  for (let i = 0; i < SAMPLES; i++) {
    const sector = sectorAt((i + .5) / SAMPLES);
    const narrow = nearby[i] < 6;
    const run = runs.at(-1);
    if (!run || run.sector !== sector || run.narrow !== narrow) runs.push({ sector, narrow, points: [points[i]] });
    runs.at(-1).points.push(points[(i + 1) % SAMPLES]);
  }

  // Em Suzuka, a passagem em direção a 130R fica sobre a primeira passagem.
  let bridge = null;
  if (id === 'jpn') {
    let closest = Infinity;
    for (let i = 0; i < SAMPLES / 2; i++) {
      for (let j = SAMPLES / 2; j < SAMPLES; j++) {
        const gap = distance(points[i], points[j]);
        if (nonlocal(i, j) && gap < closest) { closest = gap; bridge = j; }
      }
    }
    if (closest > 2) bridge = null;
  }

  // Destaca as inflexões mais visíveis, mantendo espaço entre os números.
  const bends = points.map((p, i) => {
    const a = points[(i + SAMPLES - 7) % SAMPLES];
    const b = points[(i + 7) % SAMPLES];
    const score = 1 - distance(a, b) / (distance(a, p) + distance(p, b) || 1);
    return { i, p, score };
  }).filter(({ i, score }) => score > .035 && nearby[i] > 4 && i > 20 && i < SAMPLES - 20);
  const corners = [];
  for (const bend of bends.sort((a, b) => b.score - a.score)) {
    if (corners.every(c => nonlocal(c.i, bend.i) && distance(c.p, bend.p) > 23)) corners.push(bend);
    if (corners.length === 4) break;
  }
  corners.sort((a, b) => a.i - b.i);
  const drawing = { runs, bridge, corners, nearby };
  circuitDrawings.set(id, drawing);
  return drawing;
}

function drawCircuit(svg, id, miniature = false) {
  const d = smoothPath(id, TRACKS[id].d);
  const add = (tag, attrs) => svgElement(svg, tag, attrs);
  const guide = add('path', { d, class: 'track-guide' });
  const points = lookup(id, guide);
  const { x, y, width, height } = guide.getBBox();
  const [left, top, w, h] = [x - 15, y - 17, width + 30, height + 34];
  svg.setAttribute('viewBox', `${left} ${top} ${w} ${h}`);
  const { runs, bridge, corners, nearby } = circuitDrawing(id, points);
  for (const run of runs) {
    const d = pathFrom(run.points);
    add('path', { d, class: 'track-road', 'stroke-width': run.narrow ? 2.8 : 4.5 });
    add('path', { d, class: 'track-sector', stroke: SECTORS[run.sector], 'stroke-width': run.narrow ? 1.45 : 2.6 });
  }
  if (bridge !== null) {
    const d = pathFrom(points.slice(bridge - 7, bridge + 8));
    add('path', { d, class: 'track-bridge-shadow', 'stroke-width': 8 });
    add('path', { d, class: 'track-road', 'stroke-width': 5 });
    add('path', { d, class: 'track-sector', stroke: SECTORS[sectorAt(bridge / SAMPLES)], 'stroke-width': 2.6 });
  }

  const start = at(points, 0);
  const tx = Math.cos(start.angle);
  const ty = Math.sin(start.angle);
  // Box esquemático paralelo à largada. Escolhe o lado mais afastado do restante do circuito.
  const clearance = side => points.reduce((min, q, i) => nonlocal(0, i) ?
    Math.min(min, distance([start.x - ty * side * 8, start.y + tx * side * 8], q)) : min, Infinity);
  const side = clearance(1) > clearance(-1) ? 1 : -1;
  const local = (along, across) => [start.x + tx * along - ty * across * side, start.y + ty * along + tx * across * side];
  add('path', { d: pathFrom([local(-12, 0), local(-8, 6), local(8, 6), local(12, 0)]), class: 'track-pit' });

  const arrowCount = miniature ? 5 : 8;
  for (let i = 0; i < arrowCount; i++) {
    const target = Math.round((i + .6) * SAMPLES / arrowCount);
    const index = Array.from({ length: 21 }, (_, k) => target - 10 + k)
      .reduce((best, k) => nearby[k] > nearby[best] ? k : best, target);
    const p = at(points, index / SAMPLES);
    const offset = miniature ? 0 : 4.5;
    const marker = side => [p.x - Math.sin(p.angle) * offset * side, p.y + Math.cos(p.angle) * offset * side];
    const clearance = xy => points.reduce((min, q, j) => nonlocal(index, j) ? Math.min(min, distance(xy, q)) : min, Infinity);
    const a = marker(-1);
    const b = marker(1);
    const [x, y] = !offset || clearance(a) > clearance(b) ? a : b;
    add('path', { d: 'M-2.6 -2L2.4 0L-2.6 2Z', class: 'track-arrow',
      transform: `translate(${x} ${y}) rotate(${p.angle * 180 / Math.PI})` });
  }
  for (const [cls, shift] of [['track-finish', 0], ['track-finish alt', .9]]) {
    const [a, b] = [local(shift, 3.4), local(shift, -3.4)];
    add('line', { class: cls, x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
  }
  if (!miniature) {
    const label = (text, point, cls) => {
      const node = add('text', { x: point[0], y: point[1], class: cls });
      node.textContent = text;
      const box = node.getBBox();
      const dx = Math.max(0, left + 2 - box.x) - Math.max(0, box.x + box.width - (left + w - 2));
      const dy = Math.max(0, top + 2 - box.y) - Math.max(0, box.y + box.height - (top + h - 2));
      node.setAttribute('x', point[0] + dx);
      node.setAttribute('y', point[1] + dy);
      return node;
    };
    const finishLabel = label('Largada / chegada', local(0, -8), 'track-caption').getBBox();
    const pitLabel = label('Boxes', local(0, 10), 'track-caption');
    const pitBox = pitLabel.getBBox();
    if (pitBox.x < finishLabel.x + finishLabel.width && pitBox.x + pitBox.width > finishLabel.x
        && pitBox.y < finishLabel.y + finishLabel.height && pitBox.y + pitBox.height > finishLabel.y) {
      const below = finishLabel.y + finishLabel.height + 2;
      const target = below + pitBox.height < top + h - 2 ? below : finishLabel.y - pitBox.height - 2;
      pitLabel.setAttribute('y', Number(pitLabel.getAttribute('y')) + target - pitBox.y);
    }
    for (const [i, bend] of corners.entries()) {
      const p = at(points, bend.i / SAMPLES);
      const options = [-1, 1].map(side => [p.x - Math.sin(p.angle) * 6 * side, p.y + Math.cos(p.angle) * 6 * side]);
      const gap = pt => points.reduce((min, q, j) => nonlocal(bend.i, j) ? Math.min(min, distance(pt, q)) : min, Infinity);
      label(String(i + 1), gap(options[0]) > gap(options[1]) ? options[0] : options[1], 'track-corner');
    }
  }
  return { points, left, top, w, h };
}

export function paintCircuitPreviews(root) {
  for (const svg of root.querySelectorAll('[data-circuit-preview]')) {
    const id = svg.dataset.circuitPreview;
    if (Object.hasOwn(TRACKS, id)) drawCircuit(svg, id, true);
  }
}

export function paintRaceScene(root, map, colors) {
  cancelAnimationFrame(frame);
  const panel = root.querySelector('.race-visual');
  if (!panel || !TRACKS[map.circuit.id]) return;
  const svg = panel.querySelector('svg');
  svg.classList.toggle('wet', !!map.wet);
  const element = (tag, attrs, parent) => svgElement(svg, tag, attrs, parent);
  const { points, left, top, w, h } = drawCircuit(svg, map.circuit.id);
  if (map.wet) {
    const rain = element('g', { class: 'track-rain', 'aria-hidden': 'true' });
    for (let i = 0; i < 36; i++) {
      const x = left + (i * 37) % w;
      const y = top + (i * 53) % h;
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
  const lightX = left + w / 2;
  element('rect', { x: lightX - 22, y: top + 2, width: 44, height: 11, rx: 3 }, lights);
  const lamps = [0, 1, 2, 3, 4].map(i => element('circle', { cx: lightX - 16 + i * 8, cy: top + 7.5, r: 2.6 }, lights));

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
      const t = moving ? ease(clamp((progress - moveStart(car.index, cars.length)) / MOVE_SPAN)) : 1;
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
  const feed = [...root.querySelectorAll('.race-feed li.fresh')];
  // Cada linha carrega o instante do trecho em que o fato acontece na pista (data-at) e só aparece a partir dele.
  const reveal = (progress) => feed.forEach((item) => item.classList.toggle('fresh', Number(item.dataset.at ?? 0) > progress));
  const idle = () => {
    place(1);
    reveal(1);
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
    // Cada linha da torre desliza no mesmo instante em que o carro troca de lugar na pista.
    const total = Math.max(1, map.cars.length);
    const lapMs = segment.laps * LAP_MS;
    requestAnimationFrame(() => requestAnimationFrame(() => rows.forEach((row) => {
      const index = [...row.parentElement.children].indexOf(row);
      const delay = (segment.hold + moveStart(index, total) * lapMs) / 1000 / scene.speed;
      row.style.transition = `transform ${MOVE_SPAN * lapMs / 1000 / scene.speed}s ease ${delay}s`;
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
  for (const button of root.querySelectorAll('[data-scene-skip]')) button.onclick = finish;
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
    reveal(waiting ? 0 : progress);
    if (status) status.textContent = scene.paused ? 'Cena pausada.' : waiting ? 'Luzes de largada…' : map.phase === 'finish' ? 'Últimas voltas…' : 'Corrida em andamento…';
    if (progress >= 1) finish();
    else frame = requestAnimationFrame(step);
  }
  step(previous);
}
