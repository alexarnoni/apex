// Eventos narrativos e decisões de corrida (spec-conteudo). Adicionar evento = adicionar linha aqui.
// Texto em pt-BR, segunda pessoa, tom de rádio de equipe e manchete, com nomes (piloto, rival, equipe).
// Passada de redação feita em 2026-11-07; falta a revisão final do Alexandre (roadmap 1.3).
//
// Evento: { id, phase, cond(ctx), weight, chance?, title, text(ctx), options: [{ id, label, description, outcomes }] }
//   outcomes: [{ p, effects, text }]  (p soma 1; sorteado com o RNG da carreira)
//   text de um resultado pode ser string ou função (ctx) => string, para citar rival, piloto ou equipe.
//   effects (nomes validados em engine/events.js):
//     skill, skillTemp, fame, trust, perfBuff {value, races}, missRaces, pointsPenalty, scouting,
//     devBonus, titleRoll ('player'|'rival')            -> narrativos
//     shift (+n sobe n posições), dnf, dnfRival         -> só em race_event
//
// ctx (montado em engine/f1.js): player, world, season, rival, lastRace, races, teamRank, teamName,
//   seasonPos, titleGap, noPointsStreak, winStreak, rivalAhead; em corrida também w, pos, rivalAheadOnTrack.
//   player.name é o sobrenome do piloto (é como o rádio da equipe o chama).
//
// Fora: rival_reencontro (spec 2.6) precisa de rival persistente na F1, que ainda não existe.

// Evento sem escolha de verdade: uma única opção, com rótulo próprio do botão.
const ok = (outcomes, label = 'Seguir') => [{ id: 'ok', label, description: '', outcomes }];

export const NARRATIVE_EVENTS = [
  // --- season_start ---------------------------------------------------------
  {
    id: 'lesao_treino', phase: 'season_start', weight: 2,
    cond: () => true,
    title: 'Distensão na academia',
    text: () => 'Último treino de força antes do campeonato. A coxa estala no leg press e o médico fecha a conversa com duas corridas de molho.',
    options: ok([{ p: 1, effects: { missRaces: 2, skillTemp: -1 }, text: 'Você assiste às duas primeiras corridas do box e começa o ano com um ponto a menos de skill.' }], 'Ficar de molho'),
  },
  {
    id: 'mecanico_genial', phase: 'season_start', weight: 2,
    cond: (c) => c.teamRank > 5,
    title: 'Engenheiro estrela',
    text: (c) => `A ${c.teamName} tirou de um rival o engenheiro de aerodinâmica que todo mundo queria. No paddock dizem que ele enxerga o ar.`,
    options: ok([{ p: 1, effects: { devBonus: 0.05 }, text: 'O pacote de desenvolvimento deste ano tem mais chance de acertar.' }]),
  },
  {
    id: 'contrato_vazado', phase: 'season_start', weight: 2,
    cond: (c) => !!c.player.exitClause,
    title: 'Cláusula na manchete',
    text: (c) => `Sua cláusula de saída vazou. O chefe da ${c.teamName} pediu uma conversa rápida e não ofereceu café.`,
    options: ok([{ p: 1, effects: { trust: -5, fame: 1 }, text: 'A equipe esfriou com você, e metade do paddock quer saber quem vai te contratar.' }], 'Encarar a conversa'),
  },

  // --- mid_season -----------------------------------------------------------
  {
    id: 'lesao_acidente', phase: 'mid_season', weight: 3,
    cond: (c) => c.lastRace && c.lastRace.playerPos === null && !c.lastRace.missed,
    title: 'Dor depois da batida',
    text: () => 'O pescoço travou durante a madrugada e o fisioterapeuta quer você parado. A equipe deixa a decisão com você.',
    options: [
      { id: 'sacrificio', label: 'Correr no sacrifício', description: '-2 de performance nas próximas 3 corridas.', outcomes: [{ p: 1, effects: { perfBuff: { value: -2, races: 3 } }, text: 'Você aperta os dentes e sente cada curva.' }] },
      { id: 'pular', label: 'Pular uma corrida', description: 'Zero ponto na próxima corrida.', outcomes: [{ p: 1, effects: { missRaces: 1 }, text: 'Você descansa e volta inteiro.' }] },
    ],
  },
  {
    id: 'fia_punicao', phase: 'mid_season', weight: 3,
    cond: (c) => c.lastRace && c.lastRace.playerPos !== null && c.lastRace.playerPos <= 3,
    title: 'Assoalho fora do limite',
    text: (c) => `Depois do pódio, os fiscais da FIA mediram o assoalho da ${c.teamName} e acharam flexão acima do permitido.`,
    options: ok([{ p: 1, effects: { pointsPenalty: 10, fame: 1 }, text: 'Dez pontos a menos no campeonato. O público acha que te roubaram, e a sua fama sobe.' }], 'Aceitar a punição'),
  },
  {
    id: 'rival_provocacao', phase: 'mid_season', weight: 4,
    cond: (c) => !!c.rivalAhead,
    title: 'Provocação',
    text: (c) => `${c.rival.name} disse na coletiva que você só anda por causa do carro. A frase está em todas as manchetes.`,
    options: [
      { id: 'responder', label: 'Responder na pista', description: '+2 de performance nas próximas 3 corridas e +1 de fama.', outcomes: [{ p: 1, effects: { perfBuff: { value: 2, races: 3 }, fame: 1 }, text: (c) => `Você guarda a raiva para a pista e promete uma resposta a ${c.rival.name}.` }] },
      { id: 'ignorar', label: 'Ignorar', description: '+5 de confiança da equipe.', outcomes: [{ p: 1, effects: { trust: 5 }, text: 'A equipe gostou da maturidade.' }] },
    ],
  },
  {
    id: 'midia_critica', phase: 'mid_season', weight: 3,
    cond: (c) => c.noPointsStreak >= 3,
    title: 'Pedem a sua cabeça',
    text: () => 'Três corridas sem pontuar. Um jornal já escolheu o seu substituto, e a manchete é o seu nome com ponto de interrogação.',
    options: [
      { id: 'explosiva', label: 'Coletiva explosiva', description: '+2 de fama, -10 de confiança.', outcomes: [{ p: 1, effects: { fame: 2, trust: -10 }, text: 'A frase viralizou e o assessor de imprensa ficou pálido.' }] },
      { id: 'cabeca_baixa', label: 'Cabeça baixa', description: '+5 de confiança.', outcomes: [{ p: 1, effects: { trust: 5 }, text: 'Você não respondeu e voltou ao trabalho.' }] },
    ],
  },
  {
    id: 'chuva_forma', phase: 'mid_season', weight: 2,
    cond: (c) => c.winStreak >= 2,
    title: 'Você está voando',
    text: () => 'Duas vitórias seguidas. O carro responde antes de você pensar.',
    options: ok([{ p: 1, effects: { perfBuff: { value: 4, races: 2 } }, text: 'Você está em fase de ouro, com muito mais ritmo nas próximas duas corridas.' }], 'Aproveitar a fase'),
  },

  // --- season_end -----------------------------------------------------------
  {
    id: 'fia_polemica_titulo', phase: 'season_end', weight: 1,
    cond: (c) => c.titleGap > 0 && c.titleGap <= 7,
    title: 'Decisão polêmica da FIA',
    text: () => 'A FIA reabriu uma decisão da última corrida. O campeonato inteiro depende de uma canetada.',
    options: [{
      id: 'ok', label: 'Aguardar o veredito', description: 'Meio a meio: o título vai para você ou para o líder.',
      outcomes: [
        { p: 0.5, effects: { titleRoll: 'player', fame: 3 }, text: 'A decisão sai a seu favor. O título é seu!' },
        { p: 0.5, effects: { titleRoll: 'rival', fame: 3 }, text: 'A decisão vai contra você. O título fica com o líder, e o caso rende assunto por semanas.' },
      ],
    }],
  },
  {
    id: 'teste_rival', phase: 'season_end', weight: 2,
    cond: (c) => c.player.fame >= 8 && c.player.contract <= 1,
    title: 'Teste secreto',
    text: () => 'Uma equipe rival te chamou para um teste escondido, de madrugada, num circuito privado.',
    options: [
      {
        id: 'aceitar', label: 'Aceitar', description: '+2 na nota das ofertas. 30% de chance de vazar (-15 de confiança).',
        outcomes: [
          { p: 0.7, effects: { scouting: 2 }, text: 'O teste foi discreto e a conversa rendeu.' },
          { p: 0.3, effects: { scouting: 2, trust: -15 }, text: 'O teste vazou e a sua equipe ficou furiosa.' },
        ],
      },
      { id: 'recusar', label: 'Recusar', description: '+5 de confiança.', outcomes: [{ p: 1, effects: { trust: 5 }, text: 'Você disse não, a equipe soube e agradeceu.' }] },
    ],
  },
  {
    id: 'convite_gala', phase: 'season_end', weight: 2,
    cond: (c) => c.seasonPos === 1,
    title: 'Gala da FIA',
    text: () => 'Campeão! A FIA quer você no palco da gala e a imprensa quer você em todo lugar.',
    options: [
      { id: 'midia', label: 'Circuito completo de mídia', description: '+2 de fama.', outcomes: [{ p: 1, effects: { fame: 2 }, text: 'Você deu entrevista até sonhar com microfone.' }] },
      { id: 'ferias', label: 'Férias', description: '+1 de skill: o descanso vira treino.', outcomes: [{ p: 1, effects: { skill: 1 }, text: 'Você sumiu do mapa e voltou descansado.' }] },
    ],
  },

  // --- mais eventos (roadmap 1.8) -------------------------------------------
  {
    id: 'patrocinador_novo', phase: 'season_start', weight: 2,
    cond: (c) => c.player.fame >= 3,
    title: 'Proposta de patrocínio',
    text: () => 'Uma marca grande quer o seu capacete e a sua cara num outdoor. O contrato traz uma agenda de mídia pesada.',
    options: [
      { id: 'fechar', label: 'Fechar com a marca', description: '+2 de fama, -3 de confiança (a equipe fica de olho no seu foco).', outcomes: [{ p: 1, effects: { fame: 2, trust: -3 }, text: 'Seu rosto aparece em todo lugar, e a equipe começa a cobrar foco.' }] },
      { id: 'recusar', label: 'Recusar e focar nas pistas', description: '+3 de confiança.', outcomes: [{ p: 1, effects: { trust: 3 }, text: 'A equipe gostou de ver o foco na pista.' }] },
    ],
  },
  {
    id: 'engenheiro_de_pista', phase: 'season_start', weight: 2,
    cond: () => true,
    title: 'Novo engenheiro de pista',
    text: (c) => `A ${c.teamName} trocou o seu engenheiro de pista. O novo é meticuloso e fala pouco, mas os ajustes dele costumam acertar.`,
    options: ok([{ p: 1, effects: { perfBuff: { value: 1, races: 6 } }, text: 'Você ganha um pouco mais de ritmo nas próximas seis corridas, enquanto os dois se entendem.' }], 'Conhecer o engenheiro'),
  },
  {
    id: 'simulador_extra', phase: 'season_start', weight: 2,
    cond: (c) => c.teamRank <= 4,
    title: 'Horas extras no simulador',
    text: (c) => `A ${c.teamName} liberou horários extras no simulador antes do campeonato.`,
    options: [
      { id: 'treinar', label: 'Treinar até cansar', description: '+1 de skill.', outcomes: [{ p: 1, effects: { skill: 1 }, text: 'Você chega à primeira corrida mais afiado.' }] },
      { id: 'rotina', label: 'Manter a rotina', description: '+2 de confiança (a equipe valoriza o equilíbrio).', outcomes: [{ p: 1, effects: { trust: 2 }, text: 'Você preservou o corpo e a cabeça.' }] },
    ],
  },
  {
    id: 'conselho_de_familia', phase: 'season_start', weight: 2,
    cond: (c) => c.player.age <= 21,
    title: 'Conselho de família',
    text: () => 'Seu pai quer opinar na sua temporada, como faz desde o kart. Ele ainda enxerga detalhes que você não vê.',
    options: [
      { id: 'ouvir', label: 'Ouvir com atenção', description: '+0.5 de skill.', outcomes: [{ p: 1, effects: { skill: 0.5 }, text: 'Duas ou três dicas dele valem o ano.' }] },
      { id: 'espaco', label: 'Pedir espaço', description: '+2 de confiança da equipe.', outcomes: [{ p: 1, effects: { trust: 2 }, text: 'A equipe vê um profissional dono das próprias decisões.' }] },
    ],
  },
  {
    id: 'crise_na_equipe', phase: 'mid_season', weight: 3,
    cond: (c) => c.teamRank >= 8 && c.noPointsStreak >= 2,
    title: 'Crise na garagem',
    text: (c) => `A ${c.teamName} está sem rumo. O carro é fraco, a culpa troca de mão a cada reunião e a garagem ficou pesada.`,
    options: [
      { id: 'apoiar', label: 'Apoiar a equipe', description: '+5 de confiança.', outcomes: [{ p: 1, effects: { trust: 5 }, text: 'Você segura o grupo e a equipe não esquece.' }] },
      { id: 'criticar', label: 'Criticar em público', description: '+1 de fama, -10 de confiança.', outcomes: [{ p: 1, effects: { fame: 1, trust: -10 }, text: 'Você disse o que todo mundo pensava, e a diretoria não gostou.' }] },
    ],
  },
  {
    id: 'entrevista_viral', phase: 'mid_season', weight: 2,
    cond: (c) => c.player.fame >= 4,
    title: 'Entrevista que viralizou',
    text: () => 'Um trecho da sua entrevista pós-corrida circula em todos os perfis de F1.',
    options: [
      { id: 'brincar', label: 'Entrar na brincadeira', description: '+1 de fama.', outcomes: [{ p: 1, effects: { fame: 1 }, text: 'Você vira assunto e o clima fica leve.' }] },
      { id: 'serio', label: 'Manter a seriedade', description: '+3 de confiança.', outcomes: [{ p: 1, effects: { trust: 3 }, text: 'A equipe agradeceu a discrição.' }] },
    ],
  },
  {
    id: 'premio_revelacao', phase: 'season_end', weight: 2,
    cond: (c) => c.seasonPos <= 5 && c.player.age <= 22,
    title: 'Revelação do ano',
    text: () => 'A imprensa especializada elegeu você a revelação da temporada.',
    options: ok([{ p: 1, effects: { fame: 2 }, text: 'O paddock inteiro agora sabe o seu nome.' }], 'Subir ao palco'),
  },
  {
    id: 'fa_clube', phase: 'season_end', weight: 1,
    cond: (c) => c.player.fame >= 6,
    title: 'O fã-clube chegou',
    text: () => 'Um fã-clube organizado quer te receber na volta para casa.',
    options: [
      { id: 'encontro', label: 'Ir ao encontro', description: '+1 de fama.', outcomes: [{ p: 1, effects: { fame: 1 }, text: 'Noite longa, muita foto e uma torcida a mais.' }] },
      { id: 'privacidade', label: 'Preservar a privacidade', description: '+2 de confiança.', outcomes: [{ p: 1, effects: { trust: 2 }, text: 'Você descansou, e a equipe agradeceu a discrição.' }] },
    ],
  },
];

export const RACE_EVENTS = [
  {
    id: 'garoa_pit', phase: 'race', weight: 4, chance: 0.10,
    cond: (c) => c.pos !== null && !c.w.wet,
    title: 'Garoa na volta 40',
    text: (c) => `Rádio: "${c.player.name}, começou a garoar na curva 3. Boxes agora ou fica na pista?"`,
    options: [
      { id: 'pit', label: 'Pit agora', description: '60% de ganhar 3 posições, 40% de perder 2.', outcomes: [
        { p: 0.6, effects: { shift: 3 }, text: 'A troca de pneus sai perfeita e você pula três carros.' },
        { p: 0.4, effects: { shift: -2 }, text: 'A garoa parou, você perdeu tempo no box e dois carros passam.' },
      ] },
      { id: 'ficar', label: 'Ficar na pista', description: '40% de ganhar 3 posições, 60% de perder 2.', outcomes: [
        { p: 0.4, effects: { shift: 3 }, text: 'Os rivais pararam e você assume a frente deles.' },
        { p: 0.6, effects: { shift: -2 }, text: 'A pista escorrega e dois carros passam com os pneus certos.' },
      ] },
    ],
  },
  {
    id: 'safety_restart', phase: 'race', weight: 3,
    cond: (c) => c.pos !== null && c.pos >= 2 && c.pos <= 6,
    title: 'Relargada',
    text: () => 'Safety car entrando. Pneus quentes, todo mundo colado na sua traseira. Como você sai na relargada?',
    options: [
      { id: 'ataque', label: 'Ataque total', description: '50% de ganhar 1 posição, 20% de abandonar.', outcomes: [
        { p: 0.5, effects: { shift: 1 }, text: 'Você mergulha por dentro e ganha a posição.' },
        { p: 0.2, effects: { dnf: true }, text: 'Toque na primeira curva. Corrida encerrada.' },
        { p: 0.3, effects: {}, text: 'Não havia espaço, e você segura a posição.' },
      ] },
      { id: 'segurar', label: 'Segurar', description: 'Mantém a posição.', outcomes: [{ p: 1, effects: {}, text: 'Relargada limpa, sem mudança.' }] },
    ],
  },
  {
    id: 'pneu_aposta', phase: 'race', weight: 3,
    cond: (c) => c.pos !== null && c.pos > 10,
    title: 'Aposta de pneu',
    text: (c) => `Rádio: "${c.player.name}, estamos fora dos pontos. Tem um pneu diferente do resto do grid, mas é arriscado."`,
    options: [
      { id: 'arriscar', label: 'Arriscar', description: '40% de ganhar 4 posições, 60% de perder 1.', outcomes: [
        { p: 0.4, effects: { shift: 4 }, text: 'A aposta funciona e você sobe no pelotão.' },
        { p: 0.6, effects: { shift: -1 }, text: 'O pneu não aguenta e você perde uma posição.' },
      ] },
      { id: 'manter', label: 'Manter', description: 'Nada muda.', outcomes: [{ p: 1, effects: {}, text: 'Você segue o plano.' }] },
    ],
  },
  {
    id: 'duelo_rival', phase: 'race', weight: 4,
    cond: (c) => !!c.rivalAheadOnTrack,
    title: 'Duelo com o rival',
    text: (c) => `${c.rival.name} está logo à sua frente, de novo. A arquibancada levanta.`,
    options: [
      { id: 'mergulho', label: 'Mergulho', description: '55% de ultrapassar (+1 de fama), 15% de os dois abandonarem.', outcomes: [
        { p: 0.55, effects: { shift: 1, fame: 1 }, text: (c) => `Você fecha a porta de ${c.rival.name} e passa na entrada da curva.` },
        { p: 0.15, effects: { dnf: true, dnfRival: true }, text: (c) => `Toque. Você e ${c.rival.name} terminam na brita.` },
        { p: 0.3, effects: {}, text: (c) => `${c.rival.name} fecha a porta primeiro.` },
      ] },
      { id: 'pressionar', label: 'Pressionar', description: '25% de ultrapassar.', outcomes: [
        { p: 0.25, effects: { shift: 1 }, text: (c) => `${c.rival.name} erra sob pressão e você passa.` },
        { p: 0.75, effects: {}, text: (c) => `${c.rival.name} aguenta a pressão.` },
      ] },
    ],
  },
  {
    id: 'problema_motor', phase: 'race', weight: 3, chance: 0.08,
    cond: (c) => c.pos !== null,
    title: 'Motor perdendo pressão',
    text: (c) => `Rádio: "${c.player.name}, a pressão de óleo está caindo. Poupa ou força?"`,
    options: [
      { id: 'poupar', label: 'Poupar', description: 'Perde uma posição no resto da corrida.', outcomes: [{ p: 1, effects: { shift: -1 }, text: 'Você levanta o pé e perde uma posição.' }] },
      { id: 'forcar', label: 'Forçar', description: '50% de nada acontecer, 50% de abandonar.', outcomes: [
        { p: 0.5, effects: {}, text: 'O motor aguenta, por enquanto.' },
        { p: 0.5, effects: { dnf: true }, text: 'Fumaça branca na reta. O motor quebrou.' },
      ] },
    ],
  },
  {
    id: 'chamada_estrategia', phase: 'race', weight: 2,
    cond: (c) => c.pos !== null,
    title: 'Estratégia no muro',
    text: (c) => `Rádio: "${c.player.name}, temos uma estratégia alternativa. Confia na gente ou vai do seu jeito?"`,
    options: [
      { id: 'confiar', label: 'Confiar na equipe', description: '+5 de confiança, resultado neutro.', outcomes: [{ p: 1, effects: { trust: 5 }, text: 'Você obedece e a equipe agradece.' }] },
      { id: 'seu_jeito', label: 'Fazer do seu jeito', description: '50% de +2 posições, 50% de -2; -5 de confiança nos dois casos.', outcomes: [
        { p: 0.5, effects: { shift: 2, trust: -5 }, text: 'Seu instinto acerta, mas o muro não gostou da desobediência.' },
        { p: 0.5, effects: { shift: -2, trust: -5 }, text: 'Deu errado, e o muro lembra de quem decidiu.' },
      ] },
    ],
  },
  {
    id: 'defesa_agressiva', phase: 'race', weight: 3,
    cond: (c) => c.pos !== null && c.pos <= 3,
    title: 'Pressão nas últimas voltas',
    text: () => 'Pneu no fim e um carro mais rápido colado na sua traseira, com o pódio em jogo.',
    options: [
      { id: 'fechar', label: 'Fechar a porta', description: '60% de segurar; 40% de perder uma posição (inclui punição).', outcomes: [
        { p: 0.6, effects: {}, text: 'Você fecha a porta e segura a posição.' },
        { p: 0.4, effects: { shift: -1 }, text: 'A manobra foi irregular, ou o ataque foi bom demais. Você perde uma posição.' },
      ] },
      { id: 'limpo', label: 'Defender limpo', description: '45% de segurar.', outcomes: [
        { p: 0.45, effects: {}, text: 'Defesa limpa e posição mantida.' },
        { p: 0.55, effects: { shift: -1 }, text: 'Ele passa com facilidade.' },
      ] },
    ],
  },
  {
    id: 'largada_confusa', phase: 'race', weight: 3,
    cond: (c) => c.pos !== null && c.pos >= 5 && c.pos <= 15,
    title: 'Largada confusa',
    text: () => 'As luzes se apagam e o pelotão se espreme na primeira curva. Tem espaço por dentro, mas é pouco.',
    options: [
      { id: 'atacar', label: 'Atacar na primeira curva', description: '35% de ganhar 2 posições, 15% de perder 2, 10% de abandonar.', outcomes: [
        { p: 0.35, effects: { shift: 2 }, text: 'Você mergulha por dentro e passa dois carros antes da curva 2.' },
        { p: 0.15, effects: { shift: -2 }, text: 'Você é espremido e perde duas posições.' },
        { p: 0.1, effects: { dnf: true }, text: 'Toque na primeira curva. Pneu furado e corrida encerrada.' },
        { p: 0.4, effects: {}, text: 'Não havia espaço, e você mantém a posição.' },
      ] },
      { id: 'esperar', label: 'Esperar a poeira baixar', description: '20% de ganhar 1 posição.', outcomes: [
        { p: 0.2, effects: { shift: 1 }, text: 'Dois carros se tocam à sua frente e você herda uma posição.' },
        { p: 0.8, effects: {}, text: 'Largada limpa, sem mudança.' },
      ] },
    ],
  },
  {
    id: 'bandeira_amarela', phase: 'race', weight: 3,
    cond: (c) => c.pos !== null && c.pos <= 8,
    title: 'Bandeira amarela',
    text: () => 'Bandeira amarela no setor 2. Você levanta o pé como mandam as regras ou mantém o ritmo e torce para os comissários não notarem?',
    options: [
      { id: 'levantar', label: 'Levantar o pé', description: 'Seguro: nada muda.', outcomes: [{ p: 1, effects: {}, text: 'Você obedece e perde um décimo. Segue tudo igual.' }] },
      { id: 'manter', label: 'Manter o ritmo', description: '25% de ganhar 1 posição, 15% de punição (-2 posições).', outcomes: [
        { p: 0.25, effects: { shift: 1 }, text: 'O rival levantou o pé e você aproveitou para passar.' },
        { p: 0.15, effects: { shift: -2 }, text: 'Os comissários notaram. Punição de tempo e duas posições a menos.' },
        { p: 0.6, effects: {}, text: 'Ninguém reparou.' },
      ] },
    ],
  },
];
