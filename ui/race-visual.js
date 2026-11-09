import { TRACKS, TRACK_BOX } from '../data/trackPaths.js';

export function paintRaceMap(panel, map, colors, animate) {
  const track = TRACKS[map.circuit.id];
  if (!track) return;
  const svg = panel.querySelector('svg');
  svg.setAttribute('viewBox', `0 0 ${TRACK_BOX.w} ${TRACK_BOX.h}`);
  const element = (tag, attrs) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    svg.append(node);
    return node;
  };
  const path = element('path', { d: track.d, class: 'track-line' });
  element('circle', { cx: track.start[0], cy: track.start[1], r: 2, class: 'track-start' });
  const length = path.getTotalLength();
  const phase = { race_strategy: 0, race_start: 0, race_event: .25, race_pit: .48, team_order: .68, race_finale: .84, finish: 1 }[map.phase] ?? 0;
  const cars = map.cars.map((driver, index) => {
    const dot = element('path', {
      d: 'M5 0L3 1L3 2.4H1V1.4H-2V2.5H-4V-2.5H-2V-1.4H1V-2.4H3V-1Z',
      fill: colors[driver.team] ?? '#858197',
      class: driver.isPlayer ? 'visual-car you-car' : 'visual-car',
    });
    const title = document.createElementNS(svg.namespaceURI, 'title');
    title.textContent = driver.name;
    dot.append(title);
    return { dot, index, player: driver.isPlayer };
  });
  const player = cars.find(car => car.player);
  if (player) svg.append(player.dot);
  const place = progress => {
    for (const { dot, index, player } of cars) {
      const offset = (progress - index * .014 + 1) % 1;
      const point = path.getPointAtLength(length * offset);
      const ahead = path.getPointAtLength((length * offset + 2) % length);
      const angle = Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180 / Math.PI;
      dot.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle}) scale(${player ? 1.1 : .72})`);
    }
  };
  const controls = panel.querySelector('.map-controls');
  if (!animate || !phase || !cars.length || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    place(phase);
    return;
  }
  controls.hidden = false;
  const [speedButton, skip] = controls.querySelectorAll('button');
  let elapsed = 0;
  let previous = performance.now();
  let speed = 1;
  let frame;
  const finish = () => {
    cancelAnimationFrame(frame);
    place(phase);
    controls.hidden = true;
  };
  speedButton.onclick = () => { speed = 2; speedButton.disabled = true; };
  skip.onclick = finish;
  function step(now) {
    if (!panel.isConnected) return;
    elapsed += (now - previous) * speed;
    previous = now;
    const progress = Math.min(1, elapsed / 1500);
    place(Math.max(0, phase - .22) + Math.min(phase, .22) * progress);
    if (progress < 1) frame = requestAnimationFrame(step);
    else finish();
  }
  step(previous);
}
