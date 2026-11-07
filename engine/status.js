// Hierarquia piloto 1 / piloto 2, ordens de equipe e confiança do jogador.
// Só se aplica à F1 (categorias de base ignoram este módulo).

import { CONFIG } from './config.js';
import { marketScore } from './market.js';

// ---------------------------------------------------------------------------
// Atribuição de status (chamada na virada de ano, após fillSeats)
// Popula d.status = 'p1' | 'p2' | 'equal' para cada piloto com equipe.
// prevChampion: piloto que venceu a temporada anterior (nunca pode ser p2).
// ---------------------------------------------------------------------------
export function assignStatus(teams, drivers, prevChampion = null) {
  const S = CONFIG.status;

  for (const team of teams) {
    const pair = drivers.filter((d) => d.team === team.id);
    if (pair.length !== 2) {
      // Equipe incompleta: todos equal
      pair.forEach((d) => { d.status = 'equal'; });
      continue;
    }

    const [a, b] = pair;

    // 1. Cláusula contratual tem prioridade
    if (a.statusClause || b.statusClause) {
      if (a.statusClause === 'p1') { a.status = 'p1'; b.status = 'p2'; }
      else if (b.statusClause === 'p1') { b.status = 'p1'; a.status = 'p2'; }
      else if (a.statusClause === 'equal' || b.statusClause === 'equal') {
        a.status = 'equal'; b.status = 'equal';
      }
      continue;
    }

    // 2. Campeão mundial anterior nunca é p2
    const aIsChamp = prevChampion && a.name === prevChampion.name;
    const bIsChamp = prevChampion && b.name === prevChampion.name;

    // 3. Gap de skill define p1/p2
    const gap = a.skill - b.skill;
    if (Math.abs(gap) > S.statusSkillGap) {
      const [p1, p2] = gap > 0 ? [a, b] : [b, a];
      // Garante que o campeão anterior não seja p2
      if (bIsChamp && p2 === b) { a.status = 'equal'; b.status = 'equal'; }
      else if (aIsChamp && p2 === a) { a.status = 'equal'; b.status = 'equal'; }
      else { p1.status = 'p1'; p2.status = 'p2'; }
    } else {
      a.status = 'equal'; b.status = 'equal';
    }
  }
}

// ---------------------------------------------------------------------------
// Verifica se uma ordem de equipe deve ser emitida nesta corrida.
// Retorna o objeto de ordem { team, p1, p2, p1Pos, p2Pos } ou null.
// ctx: { result, dnfs, raceNumber, totalRaces, standings, teamId, p1, p2 }
// standings: classificação ATUAL do mundial antes desta corrida (pontos acumulados).
// ---------------------------------------------------------------------------
export function shouldOrderSwap(ctx) {
  const { result, dnfs, raceNumber, totalRaces, standings, sortedStandings, p1, p2 } = ctx;
  const S = CONFIG.status;

  if (!p1 || !p2) return null;
  if (p1.status !== 'p1') return null;
  if (raceNumber <= S.ordersMinRace) return null;

  // Ambos classificados (sem DNF)
  if (dnfs.includes(p1) || dnfs.includes(p2)) return null;

  const p1Pos = result.indexOf(p1);
  const p2Pos = result.indexOf(p2);
  if (p1Pos < 0 || p2Pos < 0) return null;

  // p2 à frente do p1 em zona de pontos (qualquer posição, não precisa ser adjacente)
  const pointsLength = CONFIG.race.points.length;
  if (p2Pos >= p1Pos) return null;
  if (p2Pos >= pointsLength) return null;

  // Usar standings já ordenado se disponível, senão ordenar aqui
  const ranked = sortedStandings ?? [...standings].sort((a, b) => b.points - a.points);
  const leaderPoints = ranked[0]?.points ?? 0;
  const p1Points = standings.find((s) => s.driver === p1)?.points ?? 0;
  const remainingRaces = totalRaces - raceNumber;
  const pointsPerWin = CONFIG.race.points[0];

  // Título matematicamente vivo
  const titleAlive = (leaderPoints - p1Points) <= remainingRaces * pointsPerWin;
  if (!titleAlive) return null;

  // p1 deve estar no top N da classificação do campeonato (posição, não gap de pontos)
  const p1WorldPos = ranked.findIndex((s) => s.driver === p1) + 1;
  if (p1WorldPos < 1 || p1WorldPos > S.ordersTopN) return null;

  return { p1, p2, p1Pos, p2Pos };
}

// ---------------------------------------------------------------------------
// Aplica evento de confiança ao jogador. event: string chave do CONFIG.trust.
// Retorna o novo valor de confiança (clampado 0-100).
// ---------------------------------------------------------------------------
export function applyTrustEvent(player, event) {
  if (!('trust' in player)) player.trust = CONFIG.trust.trustStart;
  const delta = CONFIG.trust[event] ?? 0;
  player.trust = Math.max(0, Math.min(100, player.trust + delta));
  return player.trust;
}

// ---------------------------------------------------------------------------
// Avalia efeitos de confiança na virada de ano para o jogador.
// Retorna array de efeitos aplicados (para log/narrativa).
// ---------------------------------------------------------------------------
export function evaluateTrustEffects(player, teamDrivers, teamConstructorRank, rng) {
  const T = CONFIG.trust;
  const effects = [];

  if (!('trust' in player)) player.trust = T.trustStart;

  // Superou o carro (posição no mundial > posição do construtor)
  if (player.seasonChampPos && teamConstructorRank &&
      player.seasonChampPos < teamConstructorRank) {
    applyTrustEvent(player, 'overachieveSeason');
    effects.push('overachieveSeason');
  }

  // Título pela equipe
  if (player.stats?.titles > 0 && player.seasonChampPos === 1) {
    applyTrustEvent(player, 'titleBonus');
    effects.push('titleBonus');
  }

  // Efeitos de confiança baixa: rebaixa p1 para equal
  if (player.trust < T.lowTrustCap && player.status === 'p1') {
    player.status = 'equal';
    effects.push('lowTrustDemoted');
  }

  // Rescisão por confiança baixa
  if (player.trust < T.lowTrustCap && rng.chance(T.lowTrustReleaseChance)) {
    effects.push('lowTrustRelease');
  }

  return effects;
}
