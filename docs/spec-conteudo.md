# Spec: Conteúdo (eventos narrativos e decisões de corrida)

Projeto: Bandeirada. Depende de: spec-loop-jogador (tipos de pendingDecision).
Formato: tabelas de dados em `data/events.js`, motor genérico em `engine/events.js`. Adicionar evento novo = adicionar linha, nunca código.

## 1. Motor de eventos (engine/events.js)

```js
// Cada evento: { id, phase, condition(state), weight, text, options: [{ label, effects }] }
// phase: 'season_start' | 'mid_season' | 'race' | 'season_end'
// effects: deltas declarativos: { skill, fame, trust, form, carTemp, missRaces, scouting, flag }
pickEvents(state, phase, rng) -> até maxPerPhase eventos sorteados por peso entre os elegíveis
```
Limites (config): máx. 1 evento narrativo por fase de temporada; máx. 2 `race_event` por corrida (contando ordem de equipe). Corridas sem nada devem ser maioria (~60%).

```js
events: { maxSeasonPhase: 1, maxPerRace: 2, quietRaceTarget: 0.6 },
```

## 2. Eventos narrativos (12 iniciais)

| id | Fase | Condição | Peso | Texto (resumo) | Opções -> efeitos |
|---|---|---|---|---|---|
| lesao_treino | season_start | sempre | 2 | Lesão no treinamento físico | (sem opção) perde 2 corridas, -1 skill temporário no ano |
| lesao_acidente | mid_season | DNF na corrida anterior | 3 | Acidente forte, dores na semana | Correr no sacrifício: -2 perf por 3 corridas / Pular 1 corrida: 0 pontos nela |
| fia_punicao | mid_season | pódio na anterior | 3 | Assoalho flexível: FIA pune | (sem opção) -10 pontos no campeonato, +1 fama (mártir) |
| fia_polemica_titulo | season_end | jogador a <=7 pts do líder na última corrida | 1 | Decisão polêmica da FIA define o mundial | (sem opção) 50/50 sorteado: título vai pra você ou pro rival, +3 fama nos dois casos |
| rival_provocacao | mid_season | rival persistente à frente no campeonato | 4 | Rival te provoca na imprensa | Responder na pista: +2 perf vs rival por 3 corridas, +1 fama / Ignorar: +5 confiança |
| rival_reencontro | season_start | rival persistente vira companheiro | 3 | Seu velho rival é seu novo companheiro | (sem opção) ordens de equipe contra você geram -5 extra de confiança se obedecer (orgulho) |
| midia_critica | mid_season | 3 corridas sem pontos | 3 | Imprensa pede sua cabeça | Coletiva explosiva: +2 fama, -10 confiança / Cabeça baixa: +5 confiança |
| teste_rival | season_end | fama >= 8 e contrato terminando | 2 | Equipe rival te chama pra teste secreto | Aceitar: +2 scouting nas ofertas, -15 confiança se vazar (30%) / Recusar: +5 confiança |
| mecanico_genial | season_start | equipe fora do top 5 | 2 | Engenheiro estrela chega à equipe | (sem opção) +0.05 pSuccess de dev da equipe no ano |
| chuva_forma | mid_season | 2 vitórias seguidas | 2 | Você está voando | (sem opção) forma travada em +4 por 2 corridas |
| convite_gala | season_end | título de qualquer categoria | 2 | Gala da FIA e assédio da mídia | Circuito completo de mídia: +2 fama / Férias: +1 skill (descanso vira treino) |
| contrato_vazado | season_start | cláusula de saída no contrato | 2 | Sua cláusula vaza na imprensa | (sem opção) -5 confiança, +1 fama |

## 3. Decisões de corrida (race_event, 8 iniciais)

| id | Condição | Peso | Situação | Opções -> efeitos |
|---|---|---|---|---|
| garoa_pit | corrida seca virando molhada (re-sorteio meio de corrida, 10%) | 4 | Garoa na volta 40, boxes ou pista? | Pit agora: 60% +3 posições finais, 40% -2 / Ficar: espelho invertido |
| safety_restart | jogador entre P2 e P6 | 3 | Relargada após safety car | Ataque total: 50% +1 posição, 20% DNF risco (roll) / Segurar: mantém |
| pneu_aposta | jogador fora dos pontos na metade | 3 | Aposta de pneu fora de sincronia | Arriscar: 40% +4 posições, 60% -1 / Manter: nada |
| duelo_rival | rival persistente na posição imediatamente à frente | 4 | Seu rival está na sua frente | Mergulho: 55% ultrapassa +1 fama, 15% DNF dos DOIS (-15 confiança se companheiro) / Pressionar: 25% ultrapassa |
| problema_motor | 8% por corrida | 3 | Motor perdendo pressão | Poupar: -3 perf no resto da corrida / Forçar: 50% nada, 50% DNF |
| chamada_estrategia | sempre elegível | 2 | Estratégia alternativa no muro | Confiar na equipe: +5 confiança, resultado neutro / Fazer do seu jeito: 50% +2 posições -5 confiança, 50% -2 posições -5 confiança |
| defesa_agressiva | jogador defendendo posição de pódio nas voltas finais | 3 | Pressão atrás nas últimas voltas | Fechar a porta: 70% segura +punição 15% (-1 posição), / Limpo: 45% segura |
| ordem_equipe | (da spec piloto1/piloto2, sempre interrompe) | - | Troca de posição ordenada | Obedecer / Desafiar (efeitos já definidos) |

Nota de implementação: efeitos "% de X posições" são resolvidos ajustando a performance final antes da ordenação (delta equivalente), nunca editando o resultado na mão, pra manter o determinismo do seed.

## 4. Termos de contrato (consolidação, tela F1_OFERTAS)

- Duração: 1-3 anos (mais longo = segurança; mais curto = liberdade pra surfar o mercado).
- Cláusula de status: regras da spec piloto1/piloto2.
- Cláusula de saída: sair no offseason sem punição; equipes só oferecem se marketScore do jogador for top 6 do grid, OU fama >= 10 (spec-sistemas).

## 5. Tom dos textos

Escrever em pt-BR, segunda pessoa, tom de rádio de equipe + manchete: curto, concreto, com nomes ("O Tanaka te fechou na entrada da curva 1"). Nunca neutro-genérico. Os textos finais dos 20 itens acima ficam em `data/events.js` e passam por revisão do Alexandre antes de mergear.

## 6. Critérios de aceite

1. Motor de eventos genérico: nenhum `if (event.id === ...)` fora da tabela de dados.
2. Simulação de 100 temporadas de F1: ~60% das corridas sem evento; nenhum evento com condição impossível de disparar; `fia_polemica_titulo` dispara em < 3% das temporadas.
3. Determinismo preservado com eventos ligados (mesmo seed + mesmas escolhas = mesma carreira).
4. Cada efeito declarativo tem teste unitário (skill, fame, trust, form, carTemp, missRaces, scouting).
