// Todas as constantes de balanceamento do jogo em um lugar só.
// Regra do projeto: nenhum número mágico fora deste arquivo.

export const CONFIG = {
  // Motor de corrida
  race: {
    noise: { quali: 2.5, race: 4.0, wetExtra: 2.0 },
    gridBonusPerPos: 0.3,        // vantagem por posição de largada
    weekendFactorSigma: 1.5,     // "fim de semana bom/ruim" liga quali e corrida
    wetChance: 0.15,
    wetCarWeight: 0.6,           // na chuva o carro pesa menos
    dnfBase: 0.06,
    dnfMin: 0.015,
    points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
  },

  // Estilos de pilotagem: mexem em média E variância
  styles: {
    agg: { qualiBonus: 2, noiseDelta: 1.5, dnfDelta: 0.04, label: 'Agressivo' },
    tec: { flatBonus: 1, wetBonus: 5, growthMult: 1.15, devAssist: 0.03, label: 'Técnico' },
    con: { noiseDelta: -1.5, qualiNoiseDelta: -1.0, dnfDelta: -0.045, peakPenalty: 1, label: 'Consistente' },
  },

  // Forma (fase boa/ruim): random walk limitado
  form: { step: 1.5, cap: 5 },

  // Desenvolvimento de carro (só F1)
  development: {
    windowsPerSeason: 3,
    pSuccess: 0.55,
    pFail: 0.15,                 // falha também queima a janela seguinte
    gainRange: [1.6, 2.4],       // era [1, 3]: mesmo ganho médio, metade da variância
    lossRange: [1.2, 1.8],       // era [1, 2]: idem
    budgetWeight: 0.6,           // pontos de dev = budget*0.6 + prêmio*0.4
    prizeWeight: 0.4,
    magBase: 0.55,
    magDivisor: 14,
    regressionToMean: 0.02,      // pelotão copia soluções e converge devagar
    meanCar: 80,
    maxSpread: 16,               // banda em torno da média (substitui carMin/carMax como limite ativo)
    carMin: 62,
    carMax: 104,
  },

  // Virada de regulamento: novo carro = herança + orçamento + loteria.
  // conceptRange: a cada regulamento, cada equipe sorteia um "conceito" em
  // [-x, +x] que enviesa TODOS os dados de desenvolvimento daquela era.
  // É o que cria dinastias (acertou o conceito) e travessias do deserto (errou).
  regulation: {
    conceptRange: 0.40,          // era 0.32; pós-renormalização o conceito pode ser mais decisivo
    everyNSeasons: 7,            // era 5 → ~3.6 eras por período de 25 anos
    carryWeight: 0.20,           // era 0.30 → reset mais destruidor, corta dinastias longas
    budgetWeight: 0.25,
    lotteryWeight: 0.55,         // sobe pra compensar (soma = 1)
    floor: 62,
    range: 34,
  },

  // Ciclo de vida do piloto
  lifecycle: {
    ageCurve: [
      { maxAge: 19, min: 2.0, max: 4.0 },
      { maxAge: 23, min: 1.5, max: 3.0 },
      { maxAge: 26, min: 0.5, max: 1.5 },
      { maxAge: 30, min: -0.5, max: 0.5 },
      { maxAge: 33, min: -1.5, max: -0.5 },
      { maxAge: 99, min: -3.0, max: -1.0 },
    ],
    skillFloor: 60,
    retireStartAge: 32,
    retirePerYear: 0.07,
    retirePerTitle: 0.07,        // +7pp por título CONSECUTIVO sem age gate ("nada mais a provar")
    retireLowSkillBonus: 0.15,   // se skill < limiar, aposenta mais cedo
    retireLowSkillThreshold: 76,
    retireMaxProb: 0.85,
  },

  // Geração de novatos (abastecimento do grid de F1)
  rookies: {
    perSeason: 5,
    ageRange: [18, 20],
    skillRange: [66, 76],
    starChance: 0.04,
    starPotRange: [94, 100],
    normalPotRange: [72, 85],
    contractRange: [2, 3],
  },

  // Retenção de elite: top-N do mundial renova automaticamente com alta probabilidade
  retention: {
    standingsCutoff: 3,   // terminou no top 3 do mundial...
    prob: 0.85,           // ...renova com a equipe atual sem ir ao mercado
  },

  // Bônus de campeão reinante: fortalece o dominante contra desafiantes externos
  champion: { carryoverPerf: 0.75 },

  // Mercado de assentos
  market: {
    // score = skill*a + margemCrescimento*b - penalidadeIdade*c
    skillWeight: 0.7,
    growthWeight: 0.5,
    agePenaltyStart: 30,
    agePenaltyPerYear: 1.5,
    // quem fica no mercado sem assento pro ano seguinte
    keepMinSkill: 76,
    keepMaxAge: 29,
  },

  // Scouting das categorias de base (gera as ofertas de subida)
  scouting: {
    // nota = resultado no campeonato + bônus por carro fraco + fama - idade relativa
    championshipWeight: 1.0,
    weakCarBonus: 0.5,           // ir bem em carro ruim vale mais
    agePenaltyPerYearOver: 2.0,  // acima da idade típica da categoria
    academyBonus: 3.0,
    offerThresholds: { top: 8, mid: 4 },  // top: equipes boas; mid: equipes fracas / renovação
  },

  // Confiabilidade derivada da força do carro
  reliability: { base: 0.045, perCarPoint: 0.001, refCar: 85, min: 0.04, max: 0.08 },

  // Hierarquia piloto 1 / piloto 2 e ordens de equipe (só F1)
  status: {
    statusSkillGap: 2,           // diferença de skill para atribuir p1/p2 (senão equal)
    statusP1FlatPerf: 2.5,       // bônus de performance do p1 em quali e corrida
    statusP1GridBonusExtra: 0.15,// bônus extra de largada por posição para o p1
    ordersMinRace: 10,           // ordens de equipe só disparam após esta corrida
    ordersTopN: 5,               // só emite ordem se o p1 estiver no top 5 do campeonato
    statusClauseThreshold: 3,    // marketScore mínimo de vantagem para aceitar cláusula p1
    statusEqualCounterChance: 0.5,// chance de contra-oferecer cláusula equal quando recusa p1
  },

  // Carreira do jogador na base (spec-loop-jogador)
  base: {
    startYear: 2026,
    teamCarJitter: 1.0,             // oscilação anual do carro de cada equipe de base
    tierPoolSize: 4,                // 'good' sorteia entre as N melhores equipes, 'bad' entre as N piores
    offersPerTier: { top: 3, mid: 2 }, // quantas equipes fazem oferta de subida em cada tier
    rivalCount: 3,
    rivalSkillRange: [50, 60],      // rivais persistentes nascem no topo do kart
    altRouteAfterNoOfferSeasons: 2, // F2 sem oferta N temporadas seguidas -> rota alternativa
    playerGrowthRate: 0.06,         // calibrado em 600 seeds (política fixa): 91% chegam à F1, idade média 20.8. fração do gap até o potencial fechada por ano, além da curva de idade (só na base)
    altRouteOverAge: 3,            // anos acima da idade típica máxima da categoria -> rota alternativa (evita carreira eterna na base)
    fame: { champion: 2, top3: 1 },
    academy: { baseInviteChance: 0.10, teamPool: 4 }, // convite só com oferta 'top'; pool = N melhores equipes
    offerCarTier: { top: 'good', mid: 'bad' },
    // Uma decisão binária de pré-temporada por categoria: presente vs futuro.
    choices: {
      kart: {
        A: { label: 'Chassi alugado', description: '+2 de carro nesta temporada.', carBonus: 2 },
        B: { label: 'Treinador', description: '+1 de skill permanente.', skillGain: 1 },
      },
      f4: {
        A: { label: 'Simulador profissional', description: '+1 de skill permanente.', skillGain: 1 },
        B: { label: 'Assessoria de mídia', description: '+2 de fama.', fameGain: 2 },
      },
      f3: {
        A: { label: 'Teste privado', description: '+1 de skill permanente.', skillGain: 1 },
        B: { label: 'Networking de academias', description: '+15pp de chance de convite de academia.', academyChanceBonus: 0.15 },
      },
      f2: {
        A: { label: 'Foco total no título', description: '+1.5 de performance nesta temporada.', perfBonus: 1.5 },
        B: { label: 'Dias de teste de F1', description: '+2 na nota de scouting.', scoutingBonus: 2 },
      },
    },
  },

  // Carreira do jogador na F1 (spec-loop-jogador)
  f1: {
    entry: { goodPool: 4, badPool: 3, potentialCap: 84 },   // potentialCap: teto de potencial do jogador ao entrar na F1 (calibrado, ver README sessão 4); oferta 'good' = sorteio entre as N melhores equipes; 'bad' = entre as N piores
    playerGrowthRate: 0.0,                // gap até o potencial fechado por ano na F1, além da curva de idade
    focus: {                              // season_focus: uma decisão por ano
      train: { label: 'Treinar', description: '+1 de skill extra no ano.', skillGain: 1 },
      develop: { label: 'Ajudar o desenvolvimento', description: '+0.03 no pSuccess de desenvolvimento da equipe.', devBonus: 0.03 },
      image: { label: 'Trabalhar imagem', description: '+2 de fama.', fameGain: 2 },
    },
    approach: {                           // weekend_approach: uma decisão por corrida
      risky: { label: 'Arriscado', description: '+2 de performance, +3pp de chance de abandono.', perfBonus: 2, dnfDelta: 0.03 },
      balanced: { label: 'Equilibrado', description: 'Sem ajustes.', perfBonus: 0, dnfDelta: 0 },
      conservative: { label: 'Conservador', description: '-1 de performance, -2pp de chance de abandono.', perfBonus: -1, dnfDelta: -0.02 },
    },
    fame: { title: 5, top3: 2, points: 0.5 },   // fama por temporada: campeão / top 3 / pontuou
    retireDecisionAge: 30,                // a partir daqui toda offseason pergunta se aposenta
    maxAge: 44,                           // aposentadoria forçada
    maxOffers: 3,                         // ofertas de OUTRAS equipes por offseason
    offerMargin: 0,                       // marketScore do jogador precisa superar o do piloto mais fraco da equipe por isso
    contractYears: [1, 2, 3],
    exitClause: { minFame: 10, minMarketRank: 6 },  // cláusula de saída: fama >= 10 OU top 6 de marketScore do grid
    carTierRank: { top: 4, mid: 8 },      // ranking de carro: <= top 'equipe de ponta', <= mid 'meio do pelotão', senão 'zebra'
  },

  // Eventos (spec-conteudo): máx. 1 narrativo por fase e 1 evento de corrida (+ ordem de equipe = 2 interrupções).
  events: {
    phaseChance: { season_start: 0.6, mid_season: 0.7, season_end: 0.6 },
    raceCooldown: 4,               // corridas sem repetir o mesmo evento
    raceEventChance: 0.54,        // chance de a corrida tentar sortear um evento (alvo: ~60% das corridas quietas; 0.42 com intervalo dava 69%)
  },

  // Nota de legado (spec-backend): mesma fórmula será recalculada no servidor
  legacy: { title: 1000, vice: 250, win: 50, pole: 15, podium: 10, point: 1, baseTitle: 40, altRouteTitle: 60 },

  // Confiança do jogador com a equipe atual (0-100)
  trust: {
    trustStart: 60,
    obeyOrder: 10,
    defyOrder: -20,
    teammateCrash: -15,
    overachieveSeason: 5,
    titleBonus: 15,
    lowTrustCap: 40,
    highTrustFloor: 80,
    lowTrustReleaseChance: 0.3,
  },
};
