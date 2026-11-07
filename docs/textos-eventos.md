# Textos dos eventos (para revisão)

Gerado por `npm run events` a partir de `data/events.js`. Para mudar um texto, edite o arquivo de dados e gere de novo.
Tom pedido na spec: segunda pessoa, rádio de equipe e manchete, curto e concreto.

## Narrativos (19)

### Lesão no treino  `lesao_treino`

Quando: season_start · peso 2

> Uma sessão pesada de academia deu errado: distensão na coxa. O médico só libera você depois de duas corridas.

- **Entendido**
  - Você perde as 2 primeiras corridas e começa o ano com -1 de skill.

### Engenheiro estrela  `mecanico_genial`

Quando: season_start · peso 2

> A Equipe contratou o engenheiro de aerodinâmica que metade do paddock queria. Dizem que ele enxerga ar.

- **Entendido**
  - O desenvolvimento do carro tem mais chance de acertar neste ano.

### Cláusula vazada  `contrato_vazado`

Quando: season_start · peso 2

> A imprensa descobriu sua cláusula de saída. O chefe da Equipe pediu uma conversa e não sorriu.

- **Entendido**
  - -5 de confiança, +1 de fama: todo mundo quer saber quem vai te contratar.

### Dores depois do acidente  `lesao_acidente`

Quando: mid_season · peso 3

> A pancada da última corrida cobrou a conta. Pescoço travado, costas em chamas. A equipe deixa a decisão com você.

- **Correr no sacrifício**: -2 de performance nas próximas 3 corridas.
  - Você segue, mas vai sentir cada curva.
- **Pular uma corrida**: Zero ponto na próxima corrida.
  - Você descansa e volta inteiro depois.

### Assoalho flexível  `fia_punicao`

Quando: mid_season · peso 3

> Depois do pódio, a FIA mediu o assoalho da Equipe: flexão fora do limite. O pessoal já fala em "plank-gate".

- **Entendido**
  - -10 pontos no campeonato, +1 de fama: o público te vê como injustiçado.

### Provocação  `rival_provocacao`

Quando: mid_season · peso 4

> Rival disse na imprensa que você só está bem por causa do carro. A frase virou manchete.

- **Responder na pista**: +2 de performance nas próximas 3 corridas e +1 de fama.
  - Você vai usar a raiva a seu favor.
- **Ignorar**: +5 de confiança da equipe.
  - A equipe gostou da maturidade.

### A imprensa pede sua cabeça  `midia_critica`

Quando: mid_season · peso 3

> Três corridas sem pontuar. Os jornais já escolhem seu substituto.

- **Coletiva explosiva**: +2 de fama, -10 de confiança.
  - A frase viralizou. A equipe ficou pálida.
- **Cabeça baixa**: +5 de confiança.
  - Você não respondeu e voltou a trabalhar.

### Você está voando  `chuva_forma`

Quando: mid_season · peso 2

> Duas vitórias seguidas. O carro responde antes de você pensar.

- **Entendido**
  - Forma em alta (+4 de performance) nas próximas 2 corridas.

### Decisão polêmica da FIA  `fia_polemica_titulo`

Quando: season_end · peso 1

> A FIA reviu uma decisão da última corrida. O mundial inteiro depende de uma canetada.

- **Aguardar o veredito**: Meio a meio: o título vai para você ou para o líder.
  - (50%) A decisão sai a seu favor. O título é seu!
  - (50%) A decisão vai contra você. O título fica com o líder, e todo mundo fala de você.

### Teste secreto  `teste_rival`

Quando: season_end · peso 2

> Uma equipe rival te chamou para um teste escondido, de madrugada, num circuito privado.

- **Aceitar**: +2 na nota das ofertas. 30% de chance de vazar (-15 de confiança).
  - (70%) O teste foi discreto e a conversa rendeu.
  - (30%) O teste vazou. Sua equipe não gostou nada.
- **Recusar**: +5 de confiança.
  - Você disse não. A equipe soube e agradeceu.

### Gala da FIA  `convite_gala`

Quando: season_end · peso 2

> Campeão! A gala da FIA quer você no palco e a mídia quer você em todos os lugares.

- **Circuito completo de mídia**: +2 de fama.
  - Você deu entrevista até sonhar com microfone.
- **Férias**: +1 de skill: o descanso vira treino.
  - Você sumiu do mapa e voltou mais descansado.

### Proposta de patrocínio  `patrocinador_novo`

Quando: season_start · peso 2

> Uma marca grande quer o seu capacete e a sua cara em outdoor. O contrato exige agenda de mídia pesada.

- **Fechar com a marca**: +2 de fama, -3 de confiança (a equipe fica de olho no seu foco).
  - Seu rosto está em todo lugar. A equipe cobra foco.
- **Recusar e focar nas pistas**: +3 de confiança.
  - A equipe gostou de ver o foco na pista.

### Novo engenheiro de pista  `engenheiro_de_pista`

Quando: season_start · peso 2

> A Equipe trocou o seu engenheiro de pista. O novo é meticuloso e fala pouco, mas os ajustes dele costumam ser certeiros.

- **Entendido**
  - +1 de performance nas próximas 6 corridas, enquanto vocês se entendem.

### Horas extras no simulador  `simulador_extra`

Quando: season_start · peso 2

> A Equipe liberou horários extras no simulador antes do campeonato.

- **Treinar até cansar**: +1 de skill.
  - Você chega para a primeira corrida mais afiado.
- **Manter a rotina**: +2 de confiança (a equipe valoriza o equilíbrio).
  - Você preservou o corpo e a cabeça.

### Conselho de família  `conselho_de_familia`

Quando: season_start · peso 2

> Seu pai quer opinar na sua temporada, como sempre fez desde o kart. Ele ainda enxerga detalhes que você não vê.

- **Ouvir com atenção**: +0.5 de skill.
  - Duas ou três dicas dele valem o ano.
- **Pedir espaço**: +2 de confiança da equipe.
  - A equipe vê um profissional dono das próprias decisões.

### Crise na garagem  `crise_na_equipe`

Quando: mid_season · peso 3

> A Equipe está sem rumo: carro fraco, culpa trocando de mão e o clima ficou pesado.

- **Apoiar a equipe**: +5 de confiança.
  - Você segurou o grupo e a equipe lembrou.
- **Criticar em público**: +1 de fama, -10 de confiança.
  - Você disse o que todo mundo pensava. A diretoria não gostou.

### Entrevista que viralizou  `entrevista_viral`

Quando: mid_season · peso 2

> Um trecho da sua entrevista depois da corrida circula em todos os perfis de F1.

- **Entrar na brincadeira**: +1 de fama.
  - Você virou assunto, e o clima ficou leve.
- **Manter a seriedade**: +3 de confiança.
  - A equipe agradeceu a discrição.

### Revelação do ano  `premio_revelacao`

Quando: season_end · peso 2

> A imprensa especializada elegeu você a revelação da temporada.

- **Entendido**
  - +2 de fama: o paddock inteiro sabe seu nome.

### O fã-clube chegou  `fa_clube`

Quando: season_end · peso 1

> Um fã-clube organizado quer receber você para um encontro na volta para casa.

- **Ir ao encontro**: +1 de fama.
  - Uma noite longa, muita foto, uma torcida a mais.
- **Preservar a privacidade**: +2 de confiança.
  - Você descansou e a equipe agradeceu a discrição.

## Corrida (9)

### Garoa na volta 40  `garoa_pit`

Quando: race (chance 10% por corrida) · peso 4

> Rádio: "Começou a garoar na curva 3. Boxes agora ou ficamos na pista?"

- **Pit agora**: 60% de ganhar 3 posições, 40% de perder 2.
  - (60%) A troca de pneus foi perfeita. Você pula três carros.
  - (40%) A garoa parou e você perdeu tempo no box. Dois carros passam.
- **Ficar na pista**: 40% de ganhar 3 posições, 60% de perder 2.
  - (40%) Os rivais pararam e você assume a frente deles.
  - (60%) A pista ficou escorregadia e dois carros passam com pneus certos.

### Relargada  `safety_restart`

Quando: race · peso 3

> Safety car saindo. Pneus quentes, todo mundo colado. O que fazer na relargada?

- **Ataque total**: 50% de ganhar 1 posição, 20% de abandonar.
  - (50%) Você mergulha por dentro e ganha a posição.
  - (20%) Toque na primeira curva. Corrida encerrada.
  - (30%) Sem espaço: você mantém a posição.
- **Segurar**: Mantém a posição.
  - Relargada limpa. Nada muda.

### Aposta de pneu  `pneu_aposta`

Quando: race · peso 3

> Rádio: "Estamos fora dos pontos. Tem um pneu diferente do resto do grid, e é arriscado."

- **Arriscar**: 40% de ganhar 4 posições, 60% de perder 1.
  - (40%) A aposta funciona e você sobe no pelotão.
  - (60%) O pneu não durou. Você perde uma posição.
- **Manter**: Nada muda.
  - Você segue o plano.

### Duelo com o rival  `duelo_rival`

Quando: race · peso 4

> Rival está logo à sua frente, de novo. A torcida já levantou.

- **Mergulho**: 55% de ultrapassar (+1 de fama), 15% de os dois abandonarem.
  - (55%) Você fecha a porta e passa o rival na entrada da curva.
  - (15%) Toque. Os dois ficam parados na brita.
  - (30%) Ele fecha a porta primeiro. Nada muda.
- **Pressionar**: 25% de ultrapassar.
  - (25%) Ele erra sob pressão e você passa.
  - (75%) Ele aguenta a pressão. Nada muda.

### Motor perdendo pressão  `problema_motor`

Quando: race (chance 8% por corrida) · peso 3

> Rádio: "Pressão de óleo caindo. Poupar ou forçar?"

- **Poupar**: Perde uma posição no resto da corrida.
  - Você levanta o pé e perde uma posição.
- **Forçar**: 50% de nada acontecer, 50% de abandonar.
  - (50%) O motor aguenta. Respiro.
  - (50%) Fumaça branca na reta. O motor quebrou.

### Estratégia no muro  `chamada_estrategia`

Quando: race · peso 2

> Rádio: "Estratégia alternativa. Confia na gente ou quer fazer do seu jeito?"

- **Confiar na equipe**: +5 de confiança, resultado neutro.
  - Você obedece e a equipe agradece.
- **Fazer do seu jeito**: 50% de +2 posições, 50% de -2; -5 de confiança nos dois casos.
  - (50%) Seu instinto acerta, mas o muro não gostou.
  - (50%) Deu errado, e o muro lembra de quem decidiu.

### Pressão nas últimas voltas  `defesa_agressiva`

Quando: race · peso 3

> Pneu acabando e um carro mais rápido colado na sua traseira, com o pódio em jogo.

- **Fechar a porta**: 60% de segurar; 40% de perder uma posição (inclui punição).
  - (60%) Você fecha a porta e segura a posição.
  - (40%) Manobra irregular ou ataque bem-sucedido: você perde uma posição.
- **Defender limpo**: 45% de segurar.
  - (45%) Defesa limpa. Você segura.
  - (55%) Ele passa com facilidade.

### Largada confusa  `largada_confusa`

Quando: race · peso 3

> Luzes se apagam e o pelotão se espreme na primeira curva. Há espaço por dentro, mas é pouco.

- **Atacar na primeira curva**: 35% de ganhar 2 posições, 15% de perder 2, 10% de abandonar.
  - (35%) Você mergulha por dentro e passa dois carros antes da curva 2.
  - (15%) Você é espremido e perde duas posições.
  - (10%) Toque na primeira curva: pneu furado e corrida encerrada.
  - (40%) Sem espaço: você mantém a posição.
- **Esperar a poeira baixar**: 20% de ganhar 1 posição.
  - (20%) Dois carros se tocam à sua frente e você herda uma posição.
  - (80%) Largada limpa. Nada muda.

### Bandeira amarela  `bandeira_amarela`

Quando: race · peso 3

> Bandeira amarela no setor 2. Levantar o pé como mandam as regras ou manter o ritmo e torcer para os comissários não notarem?

- **Levantar o pé**: Seguro: nada muda.
  - Você obedece e perde um décimo. Nada muda.
- **Manter o ritmo**: 25% de ganhar 1 posição, 15% de punição (-2 posições).
  - (25%) O rival levantou o pé e você aproveitou para passar.
  - (15%) Os comissários notaram: punição de tempo e duas posições a menos.
  - (60%) Ninguém reparou. Nada muda.
