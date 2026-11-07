// Eventos narrativos e decisões de corrida (spec-conteudo). Adicionar evento = adicionar linha aqui.
// Rascunho de texto em pt-BR: segunda pessoa, tom de rádio de equipe e manchete. Revisar antes de divulgar.
//
// Evento: { id, phase, cond(ctx), weight, chance?, title, text(ctx), options: [{ id, label, description, outcomes }] }
//   outcomes: [{ p, effects, text }]  (p soma 1; sorteado com o RNG da carreira)
//   effects (nomes validados em engine/events.js):
//     skill, skillTemp, fame, trust, perfBuff {value, races}, missRaces, pointsPenalty, scouting,
//     devBonus, titleRoll ('player'|'rival')            -> narrativos
//     shift (+n sobe n posições), dnf, dnfRival         -> só em race_event
//
// ctx (montado em engine/f1.js): player, world, season, rival, lastRace, races, teamRank, teamName,
//   seasonPos, titleGap, noPointsStreak, winStreak, rivalAhead; em corrida também w, pos, rivalAheadOnTrack.
//
// Fora: rival_reencontro (spec 2.6) precisa de rival persistente na F1, que ainda não existe.

const ok = (outcomes) => [{ id: 'ok', label: 'Entendido', description: '', outcomes }];

export const NARRATIVE_EVENTS = [
  // --- season_start ---------------------------------------------------------
  {
    id: 'lesao_treino', phase: 'season_start', weight: 2,
    cond: () => true,
    title: 'Lesão no treino',
    text: () => 'Uma sessão pesada de academia deu errado: distensão na coxa. O médico só libera você depois de duas corridas.',
    options: ok([{ p: 1, effects: { missRaces: 2, skillTemp: -1 }, text: 'Você perde as 2 primeiras corridas e começa o ano com -1 de skill.' }]),
  },
  {
    id: 'mecanico_genial', phase: 'season_start', weight: 2,
    cond: (c) => c.teamRank > 5,
    title: 'Engenheiro estrela',
    text: (c) => `A ${c.teamName} contratou o engenheiro de aerodinâmica que metade do paddock queria. Dizem que ele enxerga ar.`,
    options: ok([{ p: 1, effects: { devBonus: 0.05 }, text: 'O desenvolvimento do carro tem mais chance de acertar neste ano.' }]),
  },
  {
    id: 'contrato_vazado', phase: 'season_start', weight: 2,
    cond: (c) => !!c.player.exitClause,
    title: 'Cláusula vazada',
    text: (c) => `A imprensa descobriu sua cláusula de saída. O chefe da ${c.teamName} pediu uma conversa e não sorriu.`,
    options: ok([{ p: 1, effects: { trust: -5, fame: 1 }, text: '-5 de confiança, +1 de fama: todo mundo quer saber quem vai te contratar.' }]),
  },

  // --- mid_season -----------------------------------------------------------
  {
    id: 'lesao_acidente', phase: 'mid_season', weight: 3,
    cond: (c) => c.lastRace && c.lastRace.playerPos === null && !c.lastRace.missed,
    title: 'Dores depois do acidente',
    text: () => 'A pancada da última corrida cobrou a conta. Pescoço travado, costas em chamas. A equipe deixa a decisão com você.',
    options: [
      { id: 'sacrificio', label: 'Correr no sacrifício', description: '-2 de performance nas próximas 3 corridas.', outcomes: [{ p: 1, effects: { perfBuff: { value: -2, races: 3 } }, text: 'Você segue, mas vai sentir cada curva.' }] },
      { id: 'pular', label: 'Pular uma corrida', description: 'Zero ponto na próxima corrida.', outcomes: [{ p: 1, effects: { missRaces: 1 }, text: 'Você descansa e volta inteiro depois.' }] },
    ],
  },
  {
    id: 'fia_punicao', phase: 'mid_season', weight: 3,
    cond: (c) => c.lastRace && c.lastRace.playerPos !== null && c.lastRace.playerPos <= 3,
    title: 'Assoalho flexível',
    text: (c) => `Depois do pódio, a FIA mediu o assoalho da ${c.teamName}: flexão fora do limite. O pessoal já fala em "plank-gate".`,
    options: ok([{ p: 1, effects: { pointsPenalty: 10, fame: 1 }, text: '-10 pontos no campeonato, +1 de fama: o público te vê como injustiçado.' }]),
  },
  {
    id: 'rival_provocacao', phase: 'mid_season', weight: 4,
    cond: (c) => !!c.rivalAhead,
    title: 'Provocação',
    text: (c) => `${c.rival.name} disse na imprensa que você só está bem por causa do carro. A frase virou manchete.`,
    options: [
      { id: 'responder', label: 'Responder na pista', description: '+2 de performance nas próximas 3 corridas e +1 de fama.', outcomes: [{ p: 1, effects: { perfBuff: { value: 2, races: 3 }, fame: 1 }, text: 'Você vai usar a raiva a seu favor.' }] },
      { id: 'ignorar', label: 'Ignorar', description: '+5 de confiança da equipe.', outcomes: [{ p: 1, effects: { trust: 5 }, text: 'A equipe gostou da maturidade.' }] },
    ],
  },
  {
    id: 'midia_critica', phase: 'mid_season', weight: 3,
    cond: (c) => c.noPointsStreak >= 3,
    title: 'A imprensa pede sua cabeça',
    text: () => 'Três corridas sem pontuar. Os jornais já escolhem seu substituto.',
    options: [
      { id: 'explosiva', label: 'Coletiva explosiva', description: '+2 de fama, -10 de confiança.', outcomes: [{ p: 1, effects: { fame: 2, trust: -10 }, text: 'A frase viralizou. A equipe ficou pálida.' }] },
      { id: 'cabeca_baixa', label: 'Cabeça baixa', description: '+5 de confiança.', outcomes: [{ p: 1, effects: { trust: 5 }, text: 'Você não respondeu e voltou a trabalhar.' }] },
    ],
  },
  {
    id: 'chuva_forma', phase: 'mid_season', weight: 2,
    cond: (c) => c.winStreak >= 2,
    title: 'Você está voando',
    text: () => 'Duas vitórias seguidas. O carro responde antes de você pensar.',
    options: ok([{ p: 1, effects: { perfBuff: { value: 4, races: 2 } }, text: 'Forma em alta (+4 de performance) nas próximas 2 corridas.' }]),
  },

  // --- season_end -----------------------------------------------------------
  {
    id: 'fia_polemica_titulo', phase: 'season_end', weight: 1,
    cond: (c) => c.titleGap > 0 && c.titleGap <= 7,
    title: 'Decisão polêmica da FIA',
    text: () => 'A FIA reviu uma decisão da última corrida. O mundial inteiro depende de uma canetada.',
    options: [{
      id: 'ok', label: 'Aguardar o veredito', description: 'Meio a meio: o título vai para você ou para o líder.',
      outcomes: [
        { p: 0.5, effects: { titleRoll: 'player', fame: 3 }, text: 'A decisão sai a seu favor. O título é seu!' },
        { p: 0.5, effects: { titleRoll: 'rival', fame: 3 }, text: 'A decisão vai contra você. O título fica com o líder, e todo mundo fala de você.' },
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
          { p: 0.3, effects: { scouting: 2, trust: -15 }, text: 'O teste vazou. Sua equipe não gostou nada.' },
        ],
      },
      { id: 'recusar', label: 'Recusar', description: '+5 de confiança.', outcomes: [{ p: 1, effects: { trust: 5 }, text: 'Você disse não. A equipe soube e agradeceu.' }] },
    ],
  },
  {
    id: 'convite_gala', phase: 'season_end', weight: 2,
    cond: (c) => c.seasonPos === 1,
    title: 'Gala da FIA',
    text: () => 'Campeão! A gala da FIA quer você no palco e a mídia quer você em todos os lugares.',
    options: [
      { id: 'midia', label: 'Circuito completo de mídia', description: '+2 de fama.', outcomes: [{ p: 1, effects: { fame: 2 }, text: 'Você deu entrevista até sonhar com microfone.' }] },
      { id: 'ferias', label: 'Férias', description: '+1 de skill: o descanso vira treino.', outcomes: [{ p: 1, effects: { skill: 1 }, text: 'Você sumiu do mapa e voltou mais descansado.' }] },
    ],
  },
];

export const RACE_EVENTS = [
  {
    id: 'garoa_pit', phase: 'race', weight: 4, chance: 0.10,
    cond: (c) => c.pos !== null && !c.w.wet,
    title: 'Garoa na volta 40',
    text: () => 'Rádio: "Começou a garoar na curva 3. Boxes agora ou ficamos na pista?"',
    options: [
      { id: 'pit', label: 'Pit agora', description: '60% de ganhar 3 posições, 40% de perder 2.', outcomes: [
        { p: 0.6, effects: { shift: 3 }, text: 'A troca de pneus foi perfeita. Você pula três carros.' },
        { p: 0.4, effects: { shift: -2 }, text: 'A garoa parou e você perdeu tempo no box. Dois carros passam.' },
      ] },
      { id: 'ficar', label: 'Ficar na pista', description: '40% de ganhar 3 posições, 60% de perder 2.', outcomes: [
        { p: 0.4, effects: { shift: 3 }, text: 'Os rivais pararam e você assume a frente deles.' },
        { p: 0.6, effects: { shift: -2 }, text: 'A pista ficou escorregadia e dois carros passam com pneus certos.' },
      ] },
    ],
  },
  {
    id: 'safety_restart', phase: 'race', weight: 3,
    cond: (c) => c.pos !== null && c.pos >= 2 && c.pos <= 6,
    title: 'Relargada',
    text: () => 'Safety car saindo. Pneus quentes, todo mundo colado. O que fazer na relargada?',
    options: [
      { id: 'ataque', label: 'Ataque total', description: '50% de ganhar 1 posição, 20% de abandonar.', outcomes: [
        { p: 0.5, effects: { shift: 1 }, text: 'Você mergulha por dentro e ganha a posição.' },
        { p: 0.2, effects: { dnf: true }, text: 'Toque na primeira curva. Corrida encerrada.' },
        { p: 0.3, effects: {}, text: 'Sem espaço: você mantém a posição.' },
      ] },
      { id: 'segurar', label: 'Segurar', description: 'Mantém a posição.', outcomes: [{ p: 1, effects: {}, text: 'Relargada limpa. Nada muda.' }] },
    ],
  },
  {
    id: 'pneu_aposta', phase: 'race', weight: 3,
    cond: (c) => c.pos !== null && c.pos > 10,
    title: 'Aposta de pneu',
    text: () => 'Rádio: "Estamos fora dos pontos. Tem um pneu diferente do resto do grid, e é arriscado."',
    options: [
      { id: 'arriscar', label: 'Arriscar', description: '40% de ganhar 4 posições, 60% de perder 1.', outcomes: [
        { p: 0.4, effects: { shift: 4 }, text: 'A aposta funciona e você sobe no pelotão.' },
        { p: 0.6, effects: { shift: -1 }, text: 'O pneu não durou. Você perde uma posição.' },
      ] },
      { id: 'manter', label: 'Manter', description: 'Nada muda.', outcomes: [{ p: 1, effects: {}, text: 'Você segue o plano.' }] },
    ],
  },
  {
    id: 'duelo_rival', phase: 'race', weight: 4,
    cond: (c) => !!c.rivalAheadOnTrack,
    title: 'Duelo com o rival',
    text: (c) => `${c.rival.name} está logo à sua frente, de novo. A torcida já levantou.`,
    options: [
      { id: 'mergulho', label: 'Mergulho', description: '55% de ultrapassar (+1 de fama), 15% de os dois abandonarem.', outcomes: [
        { p: 0.55, effects: { shift: 1, fame: 1 }, text: 'Você fecha a porta e passa o rival na entrada da curva.' },
        { p: 0.15, effects: { dnf: true, dnfRival: true }, text: 'Toque. Os dois ficam parados na brita.' },
        { p: 0.3, effects: {}, text: 'Ele fecha a porta primeiro. Nada muda.' },
      ] },
      { id: 'pressionar', label: 'Pressionar', description: '25% de ultrapassar.', outcomes: [
        { p: 0.25, effects: { shift: 1 }, text: 'Ele erra sob pressão e você passa.' },
        { p: 0.75, effects: {}, text: 'Ele aguenta a pressão. Nada muda.' },
      ] },
    ],
  },
  {
    id: 'problema_motor', phase: 'race', weight: 3, chance: 0.08,
    cond: (c) => c.pos !== null,
    title: 'Motor perdendo pressão',
    text: () => 'Rádio: "Pressão de óleo caindo. Poupar ou forçar?"',
    options: [
      { id: 'poupar', label: 'Poupar', description: 'Perde uma posição no resto da corrida.', outcomes: [{ p: 1, effects: { shift: -1 }, text: 'Você levanta o pé e perde uma posição.' }] },
      { id: 'forcar', label: 'Forçar', description: '50% de nada acontecer, 50% de abandonar.', outcomes: [
        { p: 0.5, effects: {}, text: 'O motor aguenta. Respiro.' },
        { p: 0.5, effects: { dnf: true }, text: 'Fumaça branca na reta. O motor quebrou.' },
      ] },
    ],
  },
  {
    id: 'chamada_estrategia', phase: 'race', weight: 2,
    cond: (c) => c.pos !== null,
    title: 'Estratégia no muro',
    text: () => 'Rádio: "Estratégia alternativa. Confia na gente ou quer fazer do seu jeito?"',
    options: [
      { id: 'confiar', label: 'Confiar na equipe', description: '+5 de confiança, resultado neutro.', outcomes: [{ p: 1, effects: { trust: 5 }, text: 'Você obedece e a equipe agradece.' }] },
      { id: 'seu_jeito', label: 'Fazer do seu jeito', description: '50% de +2 posições, 50% de -2; -5 de confiança nos dois casos.', outcomes: [
        { p: 0.5, effects: { shift: 2, trust: -5 }, text: 'Seu instinto acerta, mas o muro não gostou.' },
        { p: 0.5, effects: { shift: -2, trust: -5 }, text: 'Deu errado, e o muro lembra de quem decidiu.' },
      ] },
    ],
  },
  {
    id: 'defesa_agressiva', phase: 'race', weight: 3,
    cond: (c) => c.pos !== null && c.pos <= 3,
    title: 'Pressão nas últimas voltas',
    text: () => 'Pneu acabando e um carro mais rápido colado na sua traseira, com o pódio em jogo.',
    options: [
      { id: 'fechar', label: 'Fechar a porta', description: '60% de segurar; 40% de perder uma posição (inclui punição).', outcomes: [
        { p: 0.6, effects: {}, text: 'Você fecha a porta e segura a posição.' },
        { p: 0.4, effects: { shift: -1 }, text: 'Manobra irregular ou ataque bem-sucedido: você perde uma posição.' },
      ] },
      { id: 'limpo', label: 'Defender limpo', description: '45% de segurar.', outcomes: [
        { p: 0.45, effects: {}, text: 'Defesa limpa. Você segura.' },
        { p: 0.55, effects: { shift: -1 }, text: 'Ele passa com facilidade.' },
      ] },
    ],
  },
];
