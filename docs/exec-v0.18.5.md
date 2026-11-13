# Especificação — v0.18.5 "Pneus e disputas"

Leia antes `guia-executor.md`. Estado em 2026-11-12: nada iniciado. Pedido do usuário: mais opções para ultrapassar e ganhar posição, com pneus que tenham efeito como na vida real, sem travar o jogo nem simular demais.

**Este pacote muda regra de jogo e resultado de corrida.** Modelo sugerido: Sonnet com esforço alto, ou superior. Não é tarefa para Haiku. Cada etapa abaixo só é publicada depois de passar pela calibração descrita no fim.

## Ideia central

O **pneu é o recurso** que liga todas as escolhas da corrida. Cada composto tem aderência e desgaste; a condição do pneu cai a cada trecho; atacar gasta pneu; pneu bom ajuda a atacar e a defender; pneu acabado custa posição; a parada devolve pneu novo. Assim a escolha de pneus, a largada, a janela de box e o duelo passam a pesar umas nas outras. As "fichas de ataque" discutidas antes viram isto: quantos ataques o pneu ainda aguenta.

**O pneu não é o objetivo; é o meio.** O que o usuário pediu é dar ao jogador a chance de **tentar** algo que dê resultado para ele. Por isso, em toda corrida seca com um carro ao alcance, o jogador precisa ter pelo menos uma oportunidade de partir para cima por decisão própria, saber de antemão a chance aproximada e o custo, e ver o ganho reconhecido quando dá certo (posição, nota da corrida e narração). Se uma etapa deixar o jogador só reagindo ao que o jogo oferece, ela não cumpriu o pedido.

**Regra pedida pelo usuário (2026-11-12), que a simulação precisa respeitar:**

| Composto | Ritmo | Duração |
|---|---|---|
| Macio | o mais rápido | dura menos |
| Médio | intermediário | dura um tempo médio |
| Duro | o mais lento | dura mais |

Isso tem de aparecer no resultado da corrida, não só no texto: com pneu novo, quem está de macio anda na frente de quem está de duro; depois de alguns trechos sem parar, a relação se inverte.

## Limites deliberados (não ampliar)

- **Sem volta a volta.** O modelo anda por trecho da corrida, nos mesmos pontos em que a engine já passa.
- **Sem pausa nova de tipo novo.** O duelo de meio de corrida usa o tipo `race_event` que já existe. A corrida continua com no máximo cinco pausas.
- **Rivais não têm pneu simulado.** Só o jogador tem estado de pneu.
- **Corrida em pista molhada fica como está.** O modelo vale para corridas secas com macios, médios ou duros. Em pista molhada (ids `inters`, `wait`, `slicks`) mantenha a lógica atual e trate aderência como 0 e condição como 70 fixa.
- Regra na engine pura; resultado alterado antes dos pontos; mesma seed e mesmas decisões dão o mesmo resultado. Corridas passam a sair diferentes das versões anteriores com a mesma seed, o que é aceito.

## Como a corrida corre hoje (leia o código antes)

`engine/f1.js`: `resolveRaceStrategy` → `resolveRaceStart` → `openRaceEvent` (sorteia um evento ou segue) → `openPitWindow` (abre a janela só em alguns casos) → `continueToOrders` → `openFinale` (duelo final com 50% de chance quando há situação) → `finishRace`. `engine/strategy.js`: `resolveStrategy` (hoje uma aposta sorteada que move posições), `finaleSituation`, `finaleOptions`, `resolveFinale`, `paceEdge`. `engine/start.js`: `resolveStart`. O estado da corrida em andamento é `season.cur` (criado em `resolveWeekendApproach`) e `season.pendingRace`.

## Etapa A — Pneu como estado (publicável sozinha)

### A1. Configuração

Em `engine/config.js`, acrescente `tyres` (valores de partida; a calibração pode ajustá-los, só estes):

```js
tyres: {
  soft:   { grip:  0.06, wear: 20 },
  medium: { grip:  0.00, wear: 14 },
  hard:   { grip: -0.04, wear: 9 },
  practiceWearFactor: 0.8,   // treino livre "Testar pneus" reduz o desgaste
  attackWear: 10,            // custo de uma tentativa de ultrapassagem
  pressWear: 4,              // custo de pressionar
  reference: 70,             // condição neutra
  perTenBelow: 0.03,         // a cada 10 pontos abaixo de 70: -0,03 de chance
  perTenAbove: 0.02,         // a cada 10 pontos acima de 70: +0,02 de chance
  dead: 15,                  // pneu acabado
  pitOpens: 60,              // janela de box abre com condição igual ou menor
},
```

### A2. Estado e funções puras

Crie `engine/tyres.js` com funções puras e sem sorteio:

- `startTyre(strategyId, practice)` → `{ compound, condition: 100, wearFactor }` para `soft`, `medium`, `hard`; para os ids de chuva, `{ compound: null, condition: 70, wearFactor: 0 }`.
- `tick(tyre)` → nova condição depois de um trecho (`condition - wear * wearFactor`, mínimo 0). Com `compound` nulo, não muda.
- `spend(tyre, amount)` → condição depois de um ataque ou de pressionar.
- `chanceMod(tyre)` → aderência do composto mais o efeito da condição, conforme A1. Com `compound` nulo, 0.
- `attacksLeft(tyre)` → `Math.max(0, Math.floor((condition - dead) / attackWear))`.
- `tyreOf(season)` → `season.cur?.tyre ?? { compound: null, condition: 70, wearFactor: 0 }` (valor padrão para saves antigos no meio de uma corrida).

Grave em `season.cur.tyre` dentro de `resolveRaceStrategy`. É campo novo e opcional no save.

### A3. Desgaste por trecho

Chame `tick` em três pontos, sempre antes de montar a decisão: no começo de `openRaceEvent`, no começo de `openPitWindow` e no começo de `openFinale`. Não aplique quando o jogador está ausente ou abandonou.

Depois de cada `tick`, se a condição ficou em `dead` ou menos, o jogador perde uma posição (`EFFECTS.shift(..., -1)`) e a narração registra "Pneus no fim: você perde uma posição."

### A3b. Ritmo do pneu por trecho (o pneu entra na simulação)

Depois de cada `tick` (os mesmos três pontos de A3), o ritmo do pneu move o jogador:

- `ritmo = chanceMod(tyre)` (aderência do composto mais o efeito da condição; positivo é mais rápido que a referência).
- Sorteie **sempre um** `rng.next()` por trecho, mesmo quando o ritmo for zero, para a sequência de sorteios não depender do composto.
- Se `ritmo > 0` e o sorteio for menor que `ritmo * tyres.paceFactor`, o jogador ganha uma posição; se `ritmo < 0` e o sorteio for menor que `-ritmo * tyres.paceFactor`, perde uma. Use `EFFECTS.shift`.
- Acrescente `paceFactor: 2` a `CONFIG.tyres`. Com os valores de partida: macio novo tem cerca de 24% de ganhar posição no primeiro trecho e passa a perder depois de dois trechos sem parar; duro começa neutro e fica levemente positivo no fim; médio fica entre os dois.
- A narração registra o movimento com o motivo: "Macios novos: você ganha uma posição." ou "Pneus gastos: você perde uma posição."
- Não se aplica a corrida molhada (ritmo 0) nem a quem abandonou.

Este é o efeito que precisa ser conferido na calibração com mais cuidado, por agir em toda corrida.

### A4. A escolha de pneus deixa de ser aposta

Em `resolveStrategy`, para `soft`, `medium` e `hard`, remova o sorteio que move posições. O encaixe com a pista (`strategyFit`) passa a ser um bônus fixo guardado em `season.cur.tyre.fit` e somado à aderência em `chanceMod` (`fit * 0.03`). O texto da estratégia vira descritivo: "Você larga de macios: mais aderência no começo, desgaste rápido." Para os ids de chuva, não mude nada.

### A5. Janela de box usa a condição real

Em `openPitWindow`, troque o cálculo de `condition` pela condição do estado. A janela abre quando há interrupção, mudança de pista, ou condição igual ou menor que `tyres.pitOpens` (no lugar de `cfg.worn`). Em `resolveRacePit`, `worn` passa a ser condição igual ou menor que `tyres.pitOpens`; a regra de posições (`edge`) não muda.

Opções da parada em pista seca sem mudança de clima: `pit` ("Parar: pneus médios", volta com médios a 100), **nova** `pit_soft` ("Parar: pneus macios", volta com macios a 100) e `extend`. A regra de posições trata `pit_soft` como `pit`. `safe` continua como hoje. Com interrupção ou mudança de clima, mantenha as duas opções atuais; ao parar em pista seca, o pneu volta como médio a 100.

### A6. View e interface

`f1View`: exponha `tyre: { compound, label, condition, attacksLeft }` na raiz e em `map`. No painel "Seu carro" (`carPanel` em `ui/app.js`) mostre composto, condição em barra com texto (não só cor) e "Ataques que o pneu aguenta: N" durante toda a corrida, não só na janela de box. Na decisão de pneus, cada opção mostra aderência e desgaste em palavras.

### A7. Testes

`tests/tyres.test.js`: em 2.000 corridas simuladas do primeiro trecho, macio ganha posição mais vezes que médio, e médio mais que duro; depois de três trechos sem parar, a ordem se inverte; desgaste por composto; treino de pneus reduz desgaste; `attacksLeft`; `chanceMod` acima e abaixo da referência; pneu em `dead` custa posição; valor padrão quando `season.cur.tyre` não existe; corrida molhada não muda. Ajuste `tests/strategy.test.js` para o fim da aposta em pista seca. Navegador: o painel mostra composto e condição desde a largada; a janela de box oferece `pit_soft`.

## Etapa B — Atacar gasta pneu e o duelo final tem manobra (depende da A)

### B1. Custo do ataque

Toda tentativa de ganhar posição gasta `tyres.attackWear`: `attack` na largada (`resolveStart`), opções de evento marcadas como ataque e manobras do duelo. Em `data/events.js`, marque com `attack: true` apenas as opções de ultrapassagem: `mergulho` em `duelo_rival`, `atacar` em `largada_confusa` e a opção de ataque de `safety_restart`. Não mude probabilidades nem efeitos.

Quando `attacksLeft` for 0, a opção de ataque vai no payload com `disabled: true` e `reason: 'Pneu sem condição para atacar.'`; a engine rejeita a resposta com erro claro. A interface mostra a opção apagada com o motivo. A opção segura nunca é desabilitada.

A chance de sucesso de cada ataque soma `chanceMod(tyre)`: na largada, some ao `gain`; nos eventos marcados, não mexa (as probabilidades são fixas em dados).

### B2. Duelo final com manobra

Em `finaleOptions`, no modo ataque, as opções passam a ser:

| id | Rótulo | Regra |
|---|---|---|
| `inside` | Por dentro | `pGood = F.pGood + 0.10 + mods`; `pBad = F.pBad - mods`; 3% de toque e abandono, sorteado antes |
| `outside` | Por fora | `pGood = F.pGood - 0.06 + mods`; `pBad = 0.10`; sem toque |
| `manage` | Administrar | como hoje, sem sorteio e sem gasto |

`mods = F.perFit * fit + chanceMod(tyre) + pressão + perfil` (pressão e perfil vêm da etapa C; por ora, 0). Limite `pGood` a `[0.05, 0.75]` e `pBad` a `[0.05, 0.60]`. Use um único `rng.next()` por manobra e faixas na ordem: toque, sucesso, fracasso, neutro.

Compatibilidade: `resolveRaceFinale` aceita `attack` como sinônimo de `inside`, para saves parados numa decisão antiga. `safe` continua `manage`. O modo defesa não muda, exceto somar `chanceMod(tyre)` à chance de segurar.

### B3. Testes

Custo do ataque na largada, no evento e no duelo; opção desabilitada sem pneu e resposta rejeitada; `attack` antigo ainda funciona; por dentro tem mais sucesso e algum abandono em 2.000 sorteios, por fora não abandona; pneu novo aumenta a chance, pneu gasto reduz. Navegador: o duelo final mostra as três opções; opção desabilitada aparece com o motivo.

## Etapa C — Duelo de meio de corrida e perfil do rival (depende da B)

### C1. Duelo de meio de corrida

Em `openRaceEvent`, quando nenhum evento for sorteado e houver um carro de outra equipe imediatamente à frente (mesma regra de `finaleSituation` no modo ataque), abra **sempre** um duelo, sem sorteio, desde que o pneu aguente pelo menos um ataque (`attacksLeft >= 1`); sem pneu, siga direto. É a garantia de que o jogador tem a sua chance em toda corrida com briga. Abra o duelo usando o próprio tipo `race_event`, com `eventId: 'duelo_pista'`, título "Duelo na pista" e opções `inside`, `outside` e `press` (segura: `press`). `resolveRaceEvent` trata esse `eventId` à parte e chama a mesma função do duelo final. Não acrescente `duelo_pista` a `data/events.js`.

`press` (Pressionar): gasta `tyres.pressWear`, não move posição e grava `season.cur.pressure = { rival: nome, level: 1 }`. No duelo final contra o mesmo rival, pressão vale `+0.10` em `mods`.

### C2. Perfil do rival

Função pura `rivalProfile(rival)` em `engine/tyres.js` ou arquivo próprio, usando `attributesOf` de `engine/driver-attributes.js`, com uma etiqueta só, nesta prioridade:

| Condição | Etiqueta | Efeito |
|---|---|---|
| `consistency <= 70` | "Erra sob pressão" | `press` tem 25% de render a posição na hora; pressão vale `+0.15` |
| `consistency >= 88` | "Fecha bem a porta por dentro" | `inside -0.08`, `outside +0.04` |
| `tyres <= 70` | "Gasta pneu no fim" | só no duelo final: `+0.08` nas duas manobras |
| demais | "Defesa comum" | nenhum |

A etiqueta e uma frase do que ela significa vão no payload e aparecem na tela do duelo.

### C2b. Tentar precisa compensar e ser reconhecido

- **Chance à vista.** Cada manobra mostra a chance em palavras, calculada dos mesmos números da regra: "boa" (55% ou mais), "razoável" (35 a 54%), "difícil" (abaixo de 35%), e o risco ("pode abandonar", "pode perder uma posição", "sem risco").
- **Ultrapassagem conta na nota.** Guarde em `season.cur.overtakes` quantas posições o jogador ganhou por manobra própria (largada, evento marcado como ataque, duelo). Em `raceRating` (`engine/rating.js`), some `+0.3` por ultrapassagem própria, até `+1`. Campo opcional; sem ele, 0.
- **Narração própria.** Cada manobra bem-sucedida gera uma linha na narração com o nome do rival e a manobra ("Por fora na curva 1: você passa Sainz."). A mensagem do engenheiro na caixa de entrada cita quantas ultrapassagens foram suas.
- **Duelo final sempre que houver alvo e pneu.** Hoje o duelo final abre com 50% de chance (`F.chance`). No modo ataque, passe a abri-lo sempre que houver situação e `attacksLeft >= 1`; o modo defesa continua com a chance atual. Confira o efeito disso na calibração.

### C3. Demais pontos a ajustar

- `engine/race-policy.js`: conselho e recomendação para o duelo (recomende `outside` com pneu abaixo de 50, `inside` com ritmo melhor e pneu acima de 70, `press` ou `manage` nos demais).
- `engine/advance-races.js` e `tools/calibrate/lib.js` (`answerFor`): delegar e simular usam a opção segura; nenhuma resposta automática pode escolher opção desabilitada.
- `ui/race-visual.js`: rótulo do trecho para o duelo.
- Tutorial e glossário da v0.18: explicar composto, condição, ataques restantes e manobras.
- Achado 41 (`achados-jogada.md`): marque como resolvido se a primeira corrida de uma carreira nova tiver pelo menos três pausas na maioria das seeds; meça em 100 seeds e registre.

### C4. Testes

O duelo de meio só abre sem evento e com carro de outra equipe à frente; pressão vale no duelo final só contra o mesmo rival; cada etiqueta de perfil sai dos atributos certos; uma carreira inteira com a política automática termina sem erro (`npm test` já cobre carreiras completas).

## Calibração (obrigatória antes de publicar cada etapa)

1. Antes de mexer em qualquer coisa, meça a base e guarde a saída: `node tools/calibrate/player.js --policy a --n 300` (cerca de 12 minutos).
2. Acrescente a `tools/calibrate/lib.js` a política `attack`: macios na largada, `attack` na largada, primeira opção marcada como ataque nos eventos, `inside` nos duelos, `pit_soft` na parada; sempre respeitando opções desabilitadas. Inclua em `POLICIES`.
3. Depois de cada etapa, meça `a` e `attack` com `--n 300`.
4. **Critérios para publicar:**
   - política `a`: carreiras com título dentro de ±4 pontos percentuais da base medida no passo 1, e chegada à F1 dentro de ±3 pontos;
   - política `attack`: carreiras com título no máximo 5 pontos acima da política `a` da mesma medição, e nunca acima de 25%;
   - os três compostos são escolhas de verdade: em 2.000 corridas simuladas por composto, com a mesma política nas outras decisões, nenhum composto tem posição média de chegada melhor que os outros dois em mais de 0,5 posição no conjunto das 24 pistas, e cada um é o melhor em pelo menos uma pista;
   - tentar compensa: em 2.000 corridas simuladas da política `attack`, a posição média de chegada é melhor que a da política `a` com o mesmo carro, e a taxa de abandono é maior; ou seja, atacar rende mais e custa mais;
   - nenhuma manobra é a melhor em todos os casos: em 2.000 duelos simulados com pneu a 90, 60 e 30, a melhor escolha muda pelo menos uma vez.
5. Se um critério falhar, ajuste **somente** os valores de `CONFIG.tyres` e as constantes de manobra desta especificação, um de cada vez, e meça de novo. Não mexa em outros números do jogo. Se três rodadas de ajuste não bastarem, pare e relate com as medições.
6. Registre base, medições e valores finais em `docs/calibracao.md`.

## Entrega

Siga `guia-executor.md`. Publique as etapas A, B e C separadas (versões alvo 0.18.5, 0.18.6 e 0.18.7), cada uma só com a ordem do usuário. Em `docs/versoes.md`, registre os campos opcionais novos do save (`season.cur.tyre`, `season.cur.pressure`) e que saves antigos continuam abrindo. A postura (Atacar, Ritmo, Poupar) fica para depois deste pacote e ainda não tem especificação.
