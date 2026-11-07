// RNG com seed (mulberry32). Mesmo seed = mesma carreira.
// Essencial para: reproduzir bugs, compartilhar carreiras ("seed 4207"),
// e testes determinísticos.

// initialState: retoma a sequência de onde parou (ver getState) — base do snapshot da carreira.
export function createRng(seed = Date.now() >>> 0, initialState = null) {
  let a = (initialState ?? seed) >>> 0;
  const next = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    seed,
    getState: () => a >>> 0,
    next,                                 // uniforme [0,1)
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    gauss() {                               // normal(0,1) via Box-Muller
      let u = 0, v = 0;
      while (u === 0) u = next();
      while (v === 0) v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
  };
}
