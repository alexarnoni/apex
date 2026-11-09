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

  // Pistas (só F1 por enquanto): cada etiqueta de data/circuits.js mexe no motor. Os efeitos somam.
  tracks: {
    rua:      { gridMult: 1.5, dnfDelta: 0.02 },        // largada vale mais; muro por perto
    potencia: { carWeightDelta: 0.04 },                 // o carro pesa mais nas retas
    tecnica:  { carWeightDelta: -0.04 },                // o piloto pesa mais nas curvas lentas
  },

  // Estratégia de pneus (F1, engine/strategy.js): aposta que move o jogador 1 ou 2 posições.
  // Com encaixe (fit) 0 a chance de dar certo e de dar errado é igual, então a média é zero.
  strategy: {
    pGood: 0.30, pBad: 0.30,      // chances de bom e de ruim com encaixe 0 (o resto é neutro)
    perFit: 0.12,                 // cada ponto de encaixe move 12pp de ruim para bom
    bigShift: 0.25,               // chance de o efeito ser 2 posições em vez de 1
    slicksBigShift: 0.5,          // a aposta nos slicks é mais extrema
    fitMatch: 1,                  // a escolha combina com a pista (macios na rua, duros na pista técnica)
    fitBack: 0.5,                 // bônus para quem larga atrás (precisa arriscar)
    backGrid: 7, farBackGrid: 12, // a partir de que posição de largada vale o bônus (macios, duros)
    wetFit: { inters: 2, wait: 0, slicks: -0.5 },
    // Final: atacar à frente ou defender de um perseguidor. Ataque rende ±1; administrar ataque é neutro.
    // Defesa pode manter posição ou perder até duas; ceder perde uma e evita o risco da disputa.
    finale: {
      chance: 0.5, pGood: 0.30, pBad: 0.30, perFit: 0.12, fitScale: 4, maxFit: 1.5,
      paceThreshold: 2,
      defense: { holdChance: 0.65, perFit: 0.12, minHold: 0.35, maxHold: 0.85, mistakeChance: 0.10 },
    },
  },

  // Largada (F1): efeito adicional sobre o resultado bruto; hold é neutro.
  start: { gain: 0.35, loss: 0.25, contact: 0.03, wetContact: 0.03, streetContact: 0.02, aggressiveGain: 0.05 },

  // Perfil da equipe (base e F1): cada perfil troca pressão por desenvolvimento (engine/profile.js).
  //   ponta: muita pressão, mas quem vai bem evolui rápido. meio: pouca pressão, desenvolvimento médio.
  //   fundo: nenhuma pressão, desenvolvimento mais lento; em troca, quem se destaca num carro fraco chama mais atenção (exposure).
  // pressure multiplica as penalidades por ficar abaixo do esperado para o carro (nota de scouting na base, confiança na F1);
  // development multiplica o crescimento de habilidade e o ganho de teto por treino.
  teamProfile: {
    ponta: { label: 'Equipe de ponta', pressure: 1.0, development: 1.15, exposure: 1.0 },   // o bônus só vale se você corresponder ao esperado (effectiveDev)
    meio:  { label: 'Meio do pelotão', pressure: 0.5, development: 1.0, exposure: 1.0 },
    fundo: { label: 'Fundo do grid', pressure: 0.0, development: 0.85, exposure: 1.4 },
    seatsPerTeam: 2,            // esperado = 2 x posição do carro + expectedOffset (cada equipe tem 2 pilotos)
    expectedOffset: 1,
    scoutPerPosOver: 0,         // base: sem bônus por superar o esperado (o prêmio de ir bem é evoluir mais rápido; com 0,25 a política mista subia de 20% para 27% de carreiras com título)
    scoutPerPosUnder: 0.5,      // base: nota a menos por posição abaixo do esperado (x pressão)
    scoutCap: 4,                // limite do ajuste de pressão na nota (em pontos)
    trustPerPosUnder: -1.0,     // F1: confiança por posição abaixo do esperado no fim do ano (x pressão)
    trustCap: 6,                // limite de posições contadas
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
    // Realismo (2026-11-07): com 55% de sorteio, equipe de orçamento baixo (Racing Bulls, Haas, Williams)
    // ganhava 11% dos títulos. Agora o orçamento pesa mais e o sorteio menos: ~6-8% (soma = 1).
    carryWeight: 0.30,
    budgetWeight: 0.45,
    lotteryWeight: 0.25,
    floor: 62,
    range: 34,
  },

  // Atributos pessoais: overall é média ponderada, nunca inclui força do carro.
  driverAttributes: {
    enabled: true,
    weights: { qualifying: 0.20, race: 0.30, consistency: 0.15, wet: 0.10, tyres: 0.15, feedback: 0.10 },
    styles: { agg: [3, 1, -3, 0, -2, -1], con: [-1, 0, 4, 0, 3, 1], tec: [0, 0, 1, 4, 2, 4] },
    growth: { qualifying: 1.1, race: 1.1, consistency: 0.9, wet: 1, tyres: 0.8, feedback: 0.7 },
    decline: { qualifying: 1.4, race: 1.2, consistency: 0.55, wet: 0.8, tyres: 0.4, feedback: 0.1 },
    experienceStart: 22, experienceEnd: 40,
    learning: { consistency: 0.04, tyres: 0.08, feedback: 0.12 },
    learningCap: 96, raceTyreWeight: 0.2, wetWeight: 0.35,
    consistencyNoise: 0.06, maxNoiseDelta: 1.5, minNoise: 0.1, reference: 80,
    feedbackDevWeight: 0.002, maxFeedbackDev: 0.03,
    trainingFocused: 2, trainingOther: 0.6,
    offSeatGrowth: { free: 0.35, reserve: 0.65 },
  },

  // Ciclo de vida do piloto
  lifecycle: {
    ageCurve: [
      { maxAge: 19, min: 2.0, max: 4.0 },
      { maxAge: 23, min: 1.5, max: 3.0 },
      { maxAge: 26, min: 0.5, max: 1.5 },
      { maxAge: 30, min: -0.5, max: 0.5 },
      { maxAge: 33, min: -1.5, max: -0.5 },
      // 2026-11-08: a faixa 34+ era -3 a -1 (média -2) e os veteranos sumiam do grid (0,18 piloto com 38+ por temporada).
      // Agora o declínio é mais gentil, há "ano bom" de veterano e a elite se aposenta mais tarde.
      { maxAge: 36, min: -1.4, max: -0.2 },
      { maxAge: 99, min: -2.0, max: -0.3 },
    ],
    // Declínio do PILOTO DO JOGADOR: sem sorteio, para ele poder planejar. Começa em startAge (por estilo): no primeiro ano
    // perde firstYear e a queda cresce perYear a cada ano, até cap. Escolher "Treinar" na pré-temporada corta a queda do
    // ano em trainShield. Os pilotos controlados pelo jogo seguem com a faixa aleatória de ageCurve.
    playerDecline: {
      startAge: { agg: 30, con: 31, tec: 32 },
      firstYear: -0.5, perYear: -0.2, cap: -1.8,   // por volta dos 38 anos a queda chega a -1,8 por ano
      trainShield: 0.35,
    },
    // Zebra dos veteranos: de vez em quando um piloto mais velho tem um ano bom e quase não perde nada (ou ganha um pouco),
    // como Alonso e Hamilton depois dos 40. Vale para os pilotos controlados pelo jogo (o jogador segue a curva fixa).
    veteranGoodYear: { minAge: 34, chance: 0.3, range: [-0.3, 0.8] },
    // Elite dura mais: acima desta habilidade a chance de aposentar é multiplicada por retireEliteFactor.
    retireEliteSkill: 86, retireEliteFactor: 0.45,
    retireHardAge: 47,           // a partir daqui a aposentadoria é certa (o recorde real é por volta dos 44-46)
    skillFloor: 60,
    retireStartAge: 32,
    retirePerYear: 0.035,        // era 0.07
    retirePerTitle: 0.07,        // +7pp por título CONSECUTIVO sem age gate ("nada mais a provar")
    retireLowSkillBonus: 0.15,   // se skill < limiar, aposenta mais cedo
    retireLowSkillThreshold: 76,
    retireMaxProb: 0.85,
  },

  // Geração de novatos (abastecimento do grid de F1)
  rookies: {
    perSeason: 5,
    ageRange: [18, 20],
    // Realismo (2026-11-07): com novatos fracos (potencial 72-85, 4% de estrelas) o nível do grid caía com
    // os anos: campeão com habilidade média 93 nos anos 1-7 e 83 nos anos 15-25. Agora fica em ~90.
    skillRange: [70, 82],
    starChance: 0.15,
    starPotRange: [92, 100],
    normalPotRange: [78, 92],
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
    // Encaixe piloto-equipe (2026-11-08): somado à nota de mercado quando a equipe escolhe.
    loyaltyBonus: 4,             // a equipe prefere quem já era dela
    sisterBonus: 3,              // equipe irmã (Red Bull e Racing Bulls, Ferrari e Haas, Mercedes e Williams)
    starSkill: 92,               // "estrela": habilidade a partir daqui
    starCarRank: 2,              // duas estrelas na mesma equipe só se o carro for top 2
    starClashPenalty: 8,
    // Renovação de quem fora do top 3 termina o contrato: a chance cai do melhor para o pior carro.
    reSignBest: 0.65, reSignWorst: 0.38, reSignEliteBonus: 0.10,
    agePenaltyStart: 34,         // era 30 / 1.5 por ano: veterano de elite nunca achava vaga (2026-11-08)
    agePenaltyPerYear: 0.8,
    // quem fica no mercado sem assento pro ano seguinte
    keepMinSkill: 76,
    keepMaxAge: 42,              // era 29
    profilesEnabled: true, feedbackFit: 0.12, consistencyFit: 0.08, youthFit: 0.10,
    reserveMinSkill: 72, reserveFeedbackWeight: 0.35, reserveSkillWeight: 0.65,
    experienceCredit: 0.20, maxExperienceCredit: 3,
    performanceBudget: 8,
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

  // Talento do jogador (2026-11-08): potencial de berço sorteado numa curva em sino (a maioria é bom, poucos são geracionais)
  // mais um pequeno bônus por começar cedo; a dedicação eleva o teto: cada escolha de treino soma trainGain ao potencial,
  // com rendimento decrescente (quanto mais alto o potencial, menos cada treino rende: trainFrom e trainSlope).
  talent: { mean: 84.5, sd: 4.5, min: 74, max: 100, youthPerYear: 1.0, trainGain: 0.30, trainFrom: 80, trainSlope: 30 },

  // Carreira do jogador na base (spec-loop-jogador)
  base: {
    kartFormation: { winner: 1.2, balanced: 1, development: 1.2 },
    kartReturnFame: 1,
    startYear: 2026,
    // Idade inicial escolhida na criação (12 a 16). calibratedFrom: a fórmula de habilidade e teto foi calibrada
    // para 14-16; abaixo disso a habilidade perde skillLossPerYearUnder por ano (criança menos pronta).
    startAge: { min: 12, max: 16, calibratedFrom: 14, skillLossPerYearUnder: 3 },
    // Idade mínima para disputar cada categoria. Confirmados: F4 15 (FIA e CBA), F3 16 e F1 18 (superlicença; 17 só
    // por exceção da FIA). F2 não tem mínimo oficial: 17 é convenção do jogo (a F2 só vale se levar à F1, que exige 18).
    // Nenhuma categoria tem idade máxima oficial, por isso a idade alta só pesa na nota dos olheiros (penalidade).
    minAge: { f4: 15, f3: 16, f2: 17, f1: 18 },
    teamCarJitter: 1.0,           // oscilação anual do carro de cada equipe de base
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
        B: { label: 'Networking de academias', description: 'Você fica bem mais visível: aumenta bastante a chance de uma academia te convidar.', academyChanceBonus: 0.15 },
      },
      f2: {
        A: { label: 'Foco total no título', description: '+1.5 de performance nesta temporada.', perfBonus: 1.5 },
        B: { label: 'Dias de teste de F1', description: '+2 na nota de scouting.', scoutingBonus: 2 },
      },
    },
  },

  // Carreira do jogador na F1 (spec-loop-jogador)
  f1: {
    homeRace: { fanFame: 1, prepDnfReduction: 0.01 },
    goals: { pointsFraction: 0.6, midMinPoints: 8, rearScoringRaces: 1, recentRaces: 3 },
    flow: { opportunityEdge: 2, chaseMargin: 1, preserveRisk: 1.3, attackRisk: 0.8, goalUrgencyRaces: 4 },
    // Sem corte de potencial na entrada da F1 (era potentialCap 84, 88, 87: um remendo de calibração). O teto do jogador agora
    // vem do talento de berço sorteado na criação (CONFIG.talent) e da dedicação ao longo da carreira (treinar eleva o teto).
    // Oferta 'good' = sorteio entre as N melhores equipes; 'bad' = entre as N piores.
    entry: { goodPool: 4, badPool: 3 },
    playerGrowthRate: 0.0,                // gap até o potencial fechado por ano na F1, além da curva de idade
    focus: {                              // season_focus: uma decisão por ano
      train: { label: 'Treinar', description: '+1 de skill extra no ano.', skillGain: 1 },
      develop: { label: 'Ajudar o desenvolvimento', description: '+0.03 no pSuccess de desenvolvimento da equipe.', devBonus: 0.03 },
      image: { label: 'Trabalhar imagem', description: '+2 de fama.', fameGain: 2 },
    },
    approach: {                           // weekend_approach: uma decisão por corrida
      risky: { label: 'Arriscado', description: 'Mais rápido (+2 de performance), mas com mais risco de abandonar a corrida.', perfBonus: 2, dnfDelta: 0.03 },
      balanced: { label: 'Equilibrado', description: 'Sem ajustes.', perfBonus: 0, dnfDelta: 0 },
      conservative: { label: 'Conservador', description: 'Um pouco mais lento (-1 de performance), mas com menos risco de abandonar a corrida.', perfBonus: -1, dnfDelta: -0.02 },
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
