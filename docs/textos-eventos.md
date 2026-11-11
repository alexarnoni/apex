# Textos dos eventos (para revisão)

Gerado por `npm run events` a partir de `data/events.js`. Para mudar um texto, edite o arquivo de dados e gere de novo.
Tom pedido na spec: segunda pessoa, rádio de equipe e manchete, curto e concreto.

## Narrativos (19)

### Distensão no treino físico  `lesao_treino`

Quando: season_start · peso 2

> Último treino de força antes do campeonato. A coxa estala no leg press e o médico fecha a conversa com duas corridas de molho.

- **Ficar de molho**
  - Você assiste às duas primeiras corridas do box e começa o ano com um ponto a menos de habilidade.

### Engenheiro estrela  `mecanico_genial`

Quando: season_start · peso 2

> A McLaren tirou de um rival o engenheiro de aerodinâmica que todo mundo queria. No paddock dizem que ele enxerga o ar.

- **Seguir**
  - O pacote de desenvolvimento deste ano tem mais chance de acertar.

### Cláusula na manchete  `contrato_vazado`

Quando: season_start · peso 2

> Sua cláusula de saída vazou. O chefe da McLaren pediu uma conversa rápida e não ofereceu café.

- **Encarar a conversa**
  - A equipe esfriou com você, e metade do paddock quer saber quem vai te contratar.

### Dor depois da batida  `lesao_acidente`

Quando: mid_season · peso 3

> O pescoço travou durante a madrugada e o fisioterapeuta quer você parado. A equipe deixa a decisão com você.

- **Correr no sacrifício**: -2 de desempenho nas próximas 3 corridas.
  - Você aperta os dentes e sente cada curva.
- **Pular uma corrida**: Zero ponto na próxima corrida.
  - Você descansa e volta inteiro.

### Assoalho fora do limite  `fia_punicao`

Quando: mid_season · peso 3

> Depois do pódio, os fiscais da FIA mediram o assoalho da McLaren e acharam flexão acima do permitido.

- **Aceitar a punição**
  - Dez pontos a menos no campeonato. O público acha que te roubaram, e a sua fama sobe.

### Provocação  `rival_provocacao`

Quando: mid_season · peso 4

> Gasly disse na coletiva que você só anda por causa do carro. A frase está em todas as manchetes.

- **Responder na pista**: +2 de desempenho nas próximas 3 corridas e +1 de fama.
  - Você guarda a raiva para a pista e promete uma resposta a Gasly.
- **Ignorar**: +5 de confiança da equipe.
  - A equipe gostou da maturidade.

### Pedem a sua cabeça  `midia_critica`

Quando: mid_season · peso 3

> Três corridas sem pontuar. Um jornal já escolheu o seu substituto, e a manchete é o seu nome com ponto de interrogação.

- **Coletiva explosiva**: +2 de fama, -10 de confiança.
  - A frase viralizou e o assessor de imprensa ficou pálido.
- **Cabeça baixa**: +5 de confiança.
  - Você não respondeu e voltou ao trabalho.

### Você está voando  `chuva_forma`

Quando: mid_season · peso 2

> Duas vitórias seguidas. O carro responde antes de você pensar.

- **Aproveitar a fase**
  - Você está em fase de ouro, com muito mais ritmo nas próximas duas corridas.

### Decisão polêmica da FIA  `fia_polemica_titulo`

Quando: season_end · peso 1

> A FIA reabriu uma decisão da última corrida. O campeonato inteiro depende de uma canetada.

- **Aguardar o veredito**: Meio a meio: o título vai para você ou para o líder.
  - (50%) A decisão sai a seu favor. O título é seu!
  - (50%) A decisão vai contra você. O título fica com o líder, e o caso rende assunto por semanas.

### Teste secreto  `teste_rival`

Quando: season_end · peso 2

> Uma equipe rival te chamou para um teste escondido, de madrugada, num circuito privado.

- **Aceitar**: +2 na nota das ofertas. 30% de chance de vazar (-15 de confiança).
  - (70%) O teste foi discreto e a conversa rendeu.
  - (30%) O teste vazou e a sua equipe ficou furiosa.
- **Recusar**: +5 de confiança.
  - Você disse não, a equipe soube e agradeceu.

### Gala da FIA  `convite_gala`

Quando: season_end · peso 2

> Campeão! A FIA quer você no palco da gala e a imprensa quer você em todo lugar.

- **Maratona de entrevistas**: +2 de fama.
  - Você deu entrevista até sonhar com microfone.
- **Férias**: +1 de habilidade: o descanso vira treino.
  - Você sumiu do mapa e voltou descansado.

### Proposta de patrocínio  `patrocinador_novo`

Quando: season_start · peso 2

> Uma marca grande quer o seu capacete e a sua cara num outdoor. O contrato traz uma agenda de compromissos pesada.

- **Fechar com a marca**: +2 de fama, -3 de confiança (a equipe fica de olho no seu foco).
  - Seu rosto aparece em todo lugar, e a equipe começa a cobrar foco.
- **Recusar e focar nas pistas**: +3 de confiança.
  - A equipe gostou de ver o foco na pista.

### Novo engenheiro de pista  `engenheiro_de_pista`

Quando: season_start · peso 2

> A McLaren trocou o seu engenheiro de pista. O novo é meticuloso e fala pouco, mas os ajustes dele costumam acertar.

- **Conhecer o engenheiro**
  - Você ganha um pouco mais de ritmo nas próximas seis corridas, enquanto os dois se entendem.

### Horas extras no simulador  `simulador_extra`

Quando: season_start · peso 2

> A McLaren liberou horários extras no simulador antes do campeonato.

- **Treinar até cansar**: +1 de habilidade.
  - Você chega à primeira corrida mais afiado.
- **Manter a rotina**: +2 de confiança (a equipe valoriza o equilíbrio).
  - Você preservou o corpo e a cabeça.

### Conselho de família  `conselho_de_familia`

Quando: season_start · peso 2

> Seu pai quer opinar na sua temporada, como faz desde o kart. Ele ainda enxerga detalhes que você não vê.

- **Ouvir com atenção**: +0,5 de habilidade.
  - Duas ou três dicas dele valem o ano.
- **Pedir espaço**: +2 de confiança da equipe.
  - A equipe vê um profissional dono das próprias decisões.

### Crise na garagem  `crise_na_equipe`

Quando: mid_season · peso 3

> A McLaren está sem rumo. O carro é fraco, a culpa troca de mão a cada reunião e a garagem ficou pesada.

- **Apoiar a equipe**: +5 de confiança.
  - Você segura o grupo e a equipe não esquece.
- **Criticar em público**: +1 de fama, -10 de confiança.
  - Você disse o que todo mundo pensava, e a diretoria não gostou.

### Entrevista que viralizou  `entrevista_viral`

Quando: mid_season · peso 2

> Um trecho da sua entrevista pós-corrida circula em todos os perfis de F1.

- **Entrar na brincadeira**: +1 de fama.
  - Você vira assunto e o clima fica leve.
- **Manter a seriedade**: +3 de confiança.
  - A equipe agradeceu a discrição.

### Revelação do ano  `premio_revelacao`

Quando: season_end · peso 2

> A imprensa especializada elegeu você a revelação da temporada.

- **Subir ao palco**
  - O paddock inteiro agora sabe o seu nome.

### O fã-clube chegou  `fa_clube`

Quando: season_end · peso 1

> Um fã-clube organizado quer te receber na volta para casa.

- **Ir ao encontro**: +1 de fama.
  - Noite longa, muita foto e uma torcida a mais.
- **Preservar a privacidade**: +2 de confiança.
  - Você descansou, e a equipe agradeceu a discrição.

## Corrida (9)

### Garoa na volta 40  `garoa_pit`

Quando: race (chance 10% por corrida) · peso 4

> Rádio: "Teste, começou a garoar na curva 3. Boxes agora ou fica na pista?"

- **Parar agora**: 60% de ganhar 3 posições, 40% de perder 2.
  - (60%) A troca de pneus sai perfeita e você pula três carros.
  - (40%) A garoa parou, você perdeu tempo no box e dois carros passam.
- **Ficar na pista**: 40% de ganhar 3 posições, 60% de perder 2.
  - (40%) Os rivais pararam e você assume a frente deles.
  - (60%) A pista escorrega e dois carros passam com os pneus certos.

### Relargada  `safety_restart`

Quando: race · peso 3

> O safety car recolhe nesta volta. Pneus frios, todo mundo colado na sua traseira. Como você sai na relargada?

- **Ataque total**: 50% de ganhar 1 posição, 20% de abandonar.
  - (50%) Você mergulha por dentro e ganha a posição.
  - (20%) Toque na primeira curva. Corrida encerrada.
  - (30%) Não havia espaço, e você segura a posição.
- **Segurar**: Mantém a posição.
  - Relargada limpa, sem mudança.

### Aposta de pneu  `pneu_aposta`

Quando: race · peso 3

> Rádio: "Teste, estamos fora dos pontos. Tem um pneu diferente do resto do grid, mas é arriscado."

- **Arriscar**: 40% de ganhar 4 posições, 60% de perder 1.
  - (40%) A aposta funciona e você sobe no pelotão.
  - (60%) O pneu não aguenta e você perde uma posição.
- **Manter**: Nada muda.
  - Você segue o plano.

### Duelo com o rival  `duelo_rival`

Quando: race · peso 4

> Gasly está logo à sua frente, de novo. A arquibancada levanta.

- **Mergulho**: 55% de ultrapassar (+1 de fama), 15% de os dois abandonarem.
  - (55%) Você mergulha por dentro e passa Gasly na entrada da curva.
  - (15%) Toque. Você e Gasly terminam na brita.
  - (30%) Gasly fecha a porta primeiro.
- **Pressionar**: 25% de ultrapassar.
  - (25%) Gasly erra sob pressão e você passa.
  - (75%) Gasly aguenta a pressão.

### Motor perdendo pressão  `problema_motor`

Quando: race (chance 8% por corrida) · peso 3

> Rádio: "Teste, a pressão de óleo está caindo. Poupa ou força?"

- **Poupar**: Perde uma posição no resto da corrida.
  - Você levanta o pé e perde uma posição.
- **Forçar**: 50% de nada acontecer, 50% de abandonar.
  - (50%) O motor aguenta, por enquanto.
  - (50%) Fumaça branca na reta. O motor quebrou.

### Estratégia pelo rádio  `chamada_estrategia`

Quando: race · peso 2

> Rádio: "Teste, nossa proposta é manter o ritmo, poupar os pneus e defender Pundefined. Se quiser buscar posições agora, vai ter que forçar mais o carro."

- **Administrar a posição**: Mantenha o ritmo e a posição nesta decisão. A equipe ganha 5 pontos de confiança em você.
  - Você administra a posição como combinado com a equipe.
- **Forçar o ritmo**: 50% de chance de ganhar até duas posições e 50% de perder até duas. Se der errado, a confiança da equipe cai 5 pontos.
  - (50%) Você ganha posições, e a equipe aceita o resultado.
  - (50%) Você perde posições, e a equipe questiona sua decisão.

### Pressão nas últimas voltas  `defesa_agressiva`

Quando: race · peso 3

> Pneu no fim e um carro mais rápido colado na sua traseira, com o pódio em jogo.

- **Fechar a porta**: 60% de segurar; 40% de perder uma posição (inclui punição).
  - (60%) Você fecha a porta e segura a posição.
  - (40%) A manobra foi irregular, ou o ataque foi bom demais. Você perde uma posição.
- **Defender limpo**: 45% de segurar.
  - (45%) Defesa limpa e posição mantida.
  - (55%) Ele passa com facilidade.

### Largada confusa  `largada_confusa`

Quando: race · peso 3

> As luzes se apagam e o pelotão se espreme na primeira curva. Tem espaço por dentro, mas é pouco.

- **Atacar na primeira curva**: 35% de ganhar 2 posições, 15% de perder 2, 10% de abandonar.
  - (35%) Você mergulha por dentro e passa dois carros antes da curva 2.
  - (15%) Você é espremido e perde duas posições.
  - (10%) Toque na primeira curva. Pneu furado e corrida encerrada.
  - (40%) Não havia espaço, e você mantém a posição.
- **Esperar a poeira baixar**: 20% de ganhar 1 posição.
  - (20%) Dois carros se tocam à sua frente e você herda uma posição.
  - (80%) Largada limpa, sem mudança.

### Bandeira amarela  `bandeira_amarela`

Quando: race · peso 3

> Bandeira amarela no setor 2. Você levanta o pé como mandam as regras ou mantém o ritmo e torce para os comissários não notarem?

- **Levantar o pé**: Seguro: nada muda.
  - Você obedece e perde um décimo. Segue tudo igual.
- **Manter o ritmo**: 25% de ganhar 1 posição, 15% de punição (-2 posições).
  - (25%) O rival levantou o pé e você aproveitou para passar.
  - (15%) Os comissários notaram. Punição de tempo e duas posições a menos.
  - (60%) Ninguém reparou.
