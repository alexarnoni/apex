# Spec: Piloto 1 / Piloto 2, Ordens de Equipe e Confiança

Projeto: Bandeirada. Engine em `engine/`, constantes SEMPRE em `engine/config.js` (nenhum número mágico fora dele).
Motivação: fechar a métrica "campeões distintos por era de 25 anos" (atual ~14, alvo 5-9). Ver "Diário de balanceamento" no README.

## 1. Requisitos

1. Toda equipe com 2 pilotos tem um estado de hierarquia por temporada: `p1/p2` ou `equal`.
2. O status produz efeitos mecânicos no motor de corrida (performance, estratégia, trocas de posição).
3. O status é definido automaticamente por padrão, mas pode ser fixado por cláusula de contrato.
4. NPCs sempre obedecem ordens de equipe. O jogador sempre pode escolher desafiar.
5. Existe um número de confiança (0-100) APENAS entre o jogador e a equipe atual dele. NPCs não têm confiança.
6. Nada disso se aplica às categorias de base (só F1).

## 2. Regras de design

### 2.1 Atribuição de status (na virada de ano, após preencher assentos)

Ordem de avaliação por equipe:
1. Se algum piloto tem cláusula contratual de status, ela vale (ver 2.4).
2. Campeão mundial da temporada anterior nunca é `p2` (no máximo `equal`).
3. Se `|skillA - skillB| > statusSkillGap` (config, padrão 4), o de maior skill é `p1`.
4. Caso contrário, `equal`.

O status vale a temporada inteira, com uma exceção: rebaixamento por confiança (ver 2.5).

### 2.2 Efeitos mecânicos do status (aplicados em race.js)

- `p1`: `+statusP1FlatPerf` (padrão +1.0) em quali e corrida; bônus de largada por posição acrescido de `statusP1GridBonusExtra` (padrão +0.15, somado ao gridBonusPerPos normal).
- `p2`: sem bônus.
- `equal`: sem bônus para ambos.

### 2.3 Ordens de equipe (troca de posição, aplicada após ordenar o resultado da corrida)

Dispara quando TODAS as condições valem:
- Ambos os companheiros classificados (sem DNF) em posições adjacentes no resultado final;
- O `p2` terminou imediatamente à frente do `p1`;
- Corrida número > `ordersMinRace` (padrão 6, começo de temporada não tem ordem);
- O título do `p1` está matematicamente vivo: `pontosDoLider - pontosDoP1 <= corridasRestantes * pontosPorVitoria`.

Efeito: as duas posições (e os pontos correspondentes) são trocadas. NPC obedece sempre.
Status `equal`: nunca há ordem.

Registrar cada ordem no log da temporada (para narrativa e UI): `{ race, team, swapped: [nomeP2, nomeP1], defied: bool }`.

### 2.4 Cláusula de status no contrato (market.js / negociação)

Nas ofertas de F1 ao jogador, cada oferta traz o status previsto (calculado pela regra 2.1 contra o companheiro projetado). O jogador pode exigir cláusula de `p1`:
- A equipe aceita se `marketScore(jogador) >= marketScore(companheiroProjetado) + statusClauseThreshold` (padrão 3) E confiança >= 40 (se já for a equipe atual).
- Se recusar, pode contra-oferecer cláusula `equal` com probabilidade `statusEqualCounterChance` (padrão 0.5); senão, mantém a oferta sem cláusula.
- Cláusula dura o contrato inteiro e vence a regra automática.

NPCs não negociam cláusula (mantêm a regra automática).

### 2.5 Confiança (jogador <-> equipe atual)

Inteiro 0-100. Inicia em `trustStart` (60) ao assinar com uma equipe. Gatilhos:
- Obedecer ordem: `+10`
- Desafiar ordem: `-20` (a troca NÃO acontece; marcar `defied: true` no log)
- Colisão com o companheiro (quando eventos de corrida existirem): `-15`
- Fim de temporada com resultado acima do carro (posição no mundial melhor que a posição da equipe no construtores): `+5`
- Título do jogador pela equipe: `+15`

Efeitos por faixa, avaliados na virada de ano:
- `< 40`: equipe nunca oferece cláusula p1; se o jogador for `p1` automático, é rebaixado a `equal`; na renovação, a equipe só renova se não houver candidato com marketScore superior; chance `lowTrustReleaseChance` (0.3) de dispensa mesmo com contrato (rescisão).
- `40-79`: comportamento neutro.
- `>= 80`: renovação garantida se o jogador quiser; exigência de cláusula p1 usa threshold reduzido (`statusClauseThreshold - 2`).

## 3. Mudanças no config.js (adicionar bloco)

```js
status: {
  statusSkillGap: 4,
  statusP1FlatPerf: 1.0,
  statusP1GridBonusExtra: 0.15,
  ordersMinRace: 6,
  statusClauseThreshold: 3,
  statusEqualCounterChance: 0.5,
},
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
```

## 4. Pontos de implementação

- Novo módulo `engine/status.js`: `assignStatus(teams, drivers)`, `shouldOrderSwap(ctx)`, `applyTrustEvent(player, event)`.
- `engine/season.js`: manter classificação corrente durante a temporada (necessária pra condição de título vivo); aplicar a troca pós-corrida; acumular o log de ordens.
- `engine/race.js`: aplicar efeitos de status em `basePerf`/bônus de grid (ler `d.status`).
- `engine/world.js`: chamar `assignStatus` na virada de ano após `fillSeats`; avaliar efeitos de confiança do jogador.
- `engine/market.js`: cláusula de status nas ofertas (só quando `d.isPlayer`).
- O jogador desafiar/obedecer é uma DECISÃO EXTERNA à engine: `shouldOrderSwap` retorna a ordem pendente; a UI pergunta; a engine recebe `{ obey: bool }` e aplica troca + confiança. Para simulação em massa (balance.js), parâmetro `playerPolicy: 'obey' | 'defy' | null`.

## 5. Critérios de aceite

Todos os testes atuais continuam passando, mais:
1. `npm run balance`: campeões distintos por era de 25 anos cai para a faixa 5-9 (com NPCs obedecendo). Se ficar entre 9 e 11, ajustar `statusP1FlatPerf` para 1.5 antes de reportar.
2. Campeão vindo da equipe de melhor carro sobe para >= 60% das temporadas.
3. Trocas de título entre companheiros de equipe < 10%.
4. Teste novo: com dois pilotos de skill 90/85 na mesma equipe, o de 90 é `p1`; com 90/88, `equal`.
5. Teste novo: ordem só dispara com título vivo e após a corrida `ordersMinRace`.
6. Teste novo: desafiar ordem mantém o resultado e aplica `defyOrder` na confiança.
7. Determinismo preservado: mesmo seed, mesmos campeões (teste existente).

## 6. Fora de escopo (não implementar agora)

Eventos de colisão entre companheiros (o gatilho de confiança fica pronto, sem uso), moral de NPCs, ordens em categorias de base, efeito de fama nas cláusulas.
