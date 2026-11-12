// Nota da corrida (1 a 10, passos de 0,5). Só leitura: não sorteia e não muda o resultado.
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function raceRating({ playerPos, grid = null, carRank, teammatePos = null, missed = false }) {
  if (missed) return null;
  if (!playerPos) return 4;
  // Dois carros por equipe: o carro nº 1 espera P1,5; o nº 4 espera P7,5.
  const expected = 2 * carRank - 0.5;
  let rating = 6.5 + 0.35 * (expected - playerPos);
  if (grid) rating += 0.1 * clamp(grid - playerPos, -5, 5);
  if (teammatePos) rating += playerPos < teammatePos ? 0.3 : -0.3;
  if (playerPos === 1) rating = Math.max(rating, 8.5);
  else if (playerPos <= 3) rating = Math.max(rating, 7);
  return Math.round(clamp(rating, 1, 10) * 2) / 2;
}
