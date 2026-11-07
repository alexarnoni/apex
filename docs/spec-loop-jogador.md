# Spec: Loop do Jogador (máquina de estados e contrato engine-UI)

Projeto: Bandeirada. Depende de: spec-piloto1-piloto2 (status, ordens, confiança).
Princípio: a engine é pura e não conhece telas. Cada tela é função do estado; cada ação do jogador é uma transição. A UI nunca calcula regra, só apresenta e coleta decisões.

## 1. Máquina de estados

```
MENU -> CRIACAO -> BASE_TEMPORADA <-> BASE_OFERTAS -> ... -> F1_PRE_TEMPORADA
  -> F1_FIM_DE_SEMANA (x corridas) -> F1_FIM_TEMPORADA -> F1_OFERTAS
  -> (volta a F1_PRE_TEMPORADA | ROTA_ALTERNATIVA | APOSENTADORIA) -> LEGADO -> MENU
```

Regras de transição:
- BASE_TEMPORADA repete na mesma categoria se a oferta for `none` (máx. sem limite; a pressão de idade pune sozinha).
- ROTA_ALTERNATIVA (ver spec-sistemas) entra quando: perdeu assento de F1 sem oferta, OU 2+ temporadas de F2 sem oferta de subida.
- APOSENTADORIA: por escolha do jogador em qualquer offseason após os 30, ou forçada (sem oferta nenhuma em lugar nenhum).

## 2. Estado do jogo (GameState)

Decisão de escopo: NÃO existe save persistente. A carreira é uma sessão de minutos (modelo F1 Glory).
Anti-frustração apenas: snapshot cru do GameState em sessionStorage a cada transição (uma linha, sem versão, sem migração). Se corromper, descarta e volta ao menu. O GameState permanece um objeto serializável e o RNG tem seed, então reativar save de verdade no futuro é decisão, não redesign.

```js
{
  seed: 123456,            // RNG da carreira inteira
  rngState: {...},         // estado atual do RNG (retomar = continuar a mesma sequência)
  phase: 'F1_FIM_DE_SEMANA',
  player: { name, number, flag, style, age, skill, potential, fame, trust, team, contract: { years, status: 'p1'|'p2'|'equal'|null, exitClause: bool }, academy: null|{teamId}, stats: {...} },
  baseCareer: { category: 'f2', seasonInCategory: 1, rivals: [ate 4 pilotos persistentes], lastSummary: {...} },
  world: {...},            // só existe a partir da F1 (mundo do world.js)
  seasonCtx: { raceIndex: 7, standings: [...], ordersLog: [...], approach: null },
  pendingDecision: null | { type, payload },   // a UI SEMPRE renderiza isso quando != null
  careerLog: [ eventos e resultados, apend-only, base do compartilhamento e do anti-fraude ],
}
```

`pendingDecision` é o coração do contrato: a engine para e devolve a decisão pendente; a UI mostra; a resposta entra por `applyDecision(state, answer)`. Tipos: `base_choice`, `offer_pick`, `contract_terms`, `weekend_approach`, `race_event`, `team_order`, `season_focus`, `academy_invite`, `retire_or_continue`.

## 3. Telas (arquitetura de informação, sem estética)

### CRIACAO
Sobrenome, dorsal (1-99), bandeira, estilo (os 3 com descrição honesta dos trade-offs). Idade inicial sorteada 14-16 e exibida com uma linha explicando o efeito (mais novo = teto maior, menos pronto).

### BASE_TEMPORADA (uma tela por temporada, modo resumido)
- Cabeçalho: categoria, idade, temporada na categoria, status de academia.
- Card dos rivais persistentes (nome + linha de histórico: "te venceu na F4 em 2027").
- UMA decisão binária de pré-temporada (`base_choice`, tabela abaixo).
- Botão "Disputar temporada" -> resultado: posição, pontos, vitórias, campeão, posição dos rivais, nota de scouting em linguagem natural ("os olheiros de F3 anotaram seu nome").

Decisões por categoria (presente vs futuro, sempre):
| Categoria | Opção A | Efeito | Opção B | Efeito |
|---|---|---|---|---|
| Kart | Chassi alugado | +2 carro no ano | Treinador | +1 skill permanente |
| F4 | Simulador profissional | +1 skill permanente | Assessoria de mídia | +2 fama |
| F3 | Teste privado | +1 skill permanente | Networking de academias | +15pp chance de convite de academia |
| F2 | Foco total no título | +1.5 performance no ano | Dias de teste de F1 | +2 na nota de scouting |

### BASE_OFERTAS
Cards de oferta com: categoria/equipe de destino, tier do carro (bom/médio/fraco em linguagem de jogo: "equipe de ponta", "meio do pelotão", "zebra"), e o que a recusa significa ("ficar mais um ano no kart"). Convite de academia aparece aqui quando disparar.

### F1_PRE_TEMPORADA
- Resumo do mundo: grid do ano, favoritas, log narrativo do desenvolvimento ("a Alpine errou o conceito e começa atrás").
- Decisão `season_focus` (uma por ano): Treinar (+1 skill extra no ano) | Ajudar o desenvolvimento (+0.03 no pSuccess da equipe) | Trabalhar imagem (+2 fama).
- Seu status na equipe (p1/p2/equal) explicado em uma frase.

### F1_FIM_DE_SEMANA (a tela mais jogada do jogo)
- Antes: decisão `weekend_approach`: Arriscado (+2 perf, +3pp DNF) | Equilibrado (0/0) | Conservador (-1 perf, -2pp DNF).
- Simulação: 0 a 2 eventos `race_event` podem interromper (spec-conteudo). Ordem de equipe contra o jogador interrompe SEMPRE (`team_order`: obedecer/desafiar).
- Depois: resultado da corrida, classificação atualizada, uma linha narrativa gerada (pole, duelo com rival, DNF...).
- Ritmo alvo: fim de semana sem evento resolve em 2 cliques.

### F1_FIM_TEMPORADA
Classificações finais, evolução de skill/fama/confiança do ano, log de ordens da temporada, momentos marcantes (do careerLog).

### F1_OFERTAS (renovação/mercado)
Ofertas com termos negociáveis (`contract_terms`): duração (1-3), cláusula de status (regra da spec anterior), cláusula de saída (sim/não; com ela o jogador pode sair no offseason sem punição de confiança/fama). Sem salário (não existe economia).

### APOSENTADORIA / LEGADO
- Confirmação com peso ("encerrar a carreira de 14 anos?").
- Tela de legado: totais, vitrine de troféus, linha do tempo da carreira (careerLog condensado), rivalidades históricas, nota de legado (fórmula na spec-backend), botão compartilhar + novo jogo.

## 4. API da engine para a UI (funções puras)

```js
createCareer({surname, number, flag, style, seed?}) -> GameState
advance(state) -> GameState            // avança até a próxima pendingDecision ou próxima tela
applyDecision(state, answer) -> GameState
getView(state) -> objeto pronto pra tela atual (a UI não lê world cru)
```

## 5. Critérios de aceite

1. Carreira completa jogável por script: criação -> F1 -> aposentadoria chamando só as 4 funções acima (teste automatizado com playerPolicy fixo).
2. Determinismo: mesmo seed + mesma sequência de decisões = mesma carreira, do início ao legado (teste). Restaurar o snapshot de sessionStorage após reload continua a carreira do ponto exato.
3. Nenhuma regra numérica implementada em `ui/` (revisão: grep por números mágicos fora de engine/).
4. Base completa (kart -> oferta de F1) em no máximo 8 decisões do jogador no caminho feliz.
5. Fim de semana sem eventos = 2 interações.

## 6. Fora de escopo
Estética/layout (sessão própria), animações, ranking online (spec-backend), modo fictício, save persistente/export/import/migração (decisão de escopo: carreira em uma sentada).
