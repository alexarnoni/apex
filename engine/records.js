// Recordes deste mundo: líderes de cada marca entre todos os pilotos que já correram na F1 desde o início da carreira.
// Conta só temporadas concluídas (as estatísticas entram no fim do ano). Função pura sobre o mundo; nada é guardado no save.

const METRICS = [
  ['titles', 'Títulos'], ['wins', 'Vitórias'], ['poles', 'Poles'], ['podiums', 'Pódios'], ['points', 'Pontos'], ['seasons', 'Temporadas'],
];

export function worldRecords(world) {
  const all = [...world.drivers, ...(world.market ?? []), ...(world.retired ?? [])];
  const out = [];
  for (const [key, label] of METRICS) {
    let best = null;
    for (const d of all) {
      const value = Math.round(d.stats?.[key] ?? 0);
      if (value > 0 && (!best || value > best.value)) best = { name: d.name, value, isPlayer: !!d.isPlayer };
    }
    if (best) out.push({ key, label, ...best });
  }
  return out;
}
