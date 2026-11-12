# Especificação — v0.15 "Caixa de entrada"

Primeiro pacote da Fase 1. Leia antes `guia-executor.md`. Estado em 2026-11-11: nada iniciado. Modelo sugerido: Sonnet (há função pura nova na engine e uma aba nova).

**Pronto quando:** depois de cada bandeirada o jogador tem pelo menos uma mensagem nova e uma nota da corrida, e vê quantas mensagens ainda não leu.

## Decisões já tomadas (não reabrir)

- **Sem migração de save.** A caixa de entrada é **derivada** do estado que já existe; nada dela é gravado no save, exceto a nota da corrida (campo opcional, abaixo).
- **Sem sorteio novo.** Nenhuma função deste pacote usa `rng`.
- **Nada muda o resultado da corrida.** Nota, mensagens e manchete são só leitura.
- **Mensagens lidas ficam fora do save**, em `localStorage`, por slot.
- A caixa de entrada é uma quarta aba, **Mensagens**, ao lado de Paddock, Piloto e Campeonato. Não aparece durante a corrida.

## Parte A — Nota da corrida (engine)

### A1. Função pura

Crie `engine/rating.js` exportando `raceRating({ playerPos, grid, carRank, teams, teammatePos, missed })`, que devolve um número de 1 a 10 em passos de 0,5, ou `null` se `missed` for verdadeiro.

Regra (use exatamente esta, para os testes fecharem):

1. Abandono (`playerPos` nulo e não `missed`): `4`.
2. Posição esperada pelo carro: `esperada = 2 * carRank - 0.5` (dois carros por equipe; carro nº 1 espera 1,5; carro nº 4 espera 7,5).
3. `nota = 6.5 + 0.35 * (esperada - playerPos)`.
4. Se `grid` existir: `nota += 0.1 * limitar(grid - playerPos, -5, 5)`.
5. Se `teammatePos` existir: `+0.3` quando `playerPos < teammatePos`, `-0.3` quando maior.
6. Vitória (`playerPos === 1`): a nota não fica abaixo de `8.5`. Pódio (`<= 3`): não fica abaixo de `7`.
7. Limite a `[1, 10]` e arredonde para o meio ponto mais próximo.

### A2. Gravar na corrida

Em `engine/f1.js`, função `finishRace`, depois de `race.teammatePos` ser calculado, grave `race.rating = raceRating({...})` usando `carRank(world, p.team)` e `world.teams.length`. É um campo novo e **opcional**: corridas de saves antigos não o têm.

Em `f1View`, inclua `rating: r.rating ?? null` no mapa de `races` e garanta que `lastRace` também o exponha.

### A3. Testes

`tests/rating.test.js`, com pelo menos: carro nº 1 vencendo saindo da pole (≥ 8,5); carro nº 1 em P8 (nota baixa, ≤ 5); carro nº 9 em P8 (nota alta, ≥ 8,5); abandono (4); corrida não disputada (`null`); efeito do companheiro (±0,3 antes do arredondamento); resultado sempre múltiplo de 0,5 entre 1 e 10. Rode `npm test`: os testes de determinismo existentes precisam continuar passando (o campo novo entra no save, mas não usa sorteio).

## Parte B — Mensagens (engine, derivadas)

### B1. Função pura

Crie `engine/inbox.js` exportando `inboxView(state)`, que devolve uma lista de mensagens, **da mais nova para a mais antiga**, no máximo 40:

```js
{ id, kind, from, title, text, year }
// kind: 'corrida' | 'equipe' | 'mercado' | 'imprensa' | 'marco'
```

`id` precisa ser estável entre redesenhos e entre recarregamentos do mesmo save (use ano, tipo e um índice ou o número da etapa; nunca `Date.now()` nem posição na lista final).

Fontes, todas já existentes no estado:

| Fonte | Vira | Regra |
|---|---|---|
| `state.careerLog` (itens `{ year, type, text }`) | `equipe` para `contract`, `trust`, `academy`, `promotion`, `offer`, `start`; `mercado` para `transfer`; `imprensa` para `event`, `season`, `retire`, `alt_route`, `kart_return` | Texto igual ao do log. Título curto por tipo (por exemplo, "Contrato", "Confiança da equipe", "Temporada encerrada"). Remetente: "Chefe de equipe", "Mercado" ou "Imprensa". |
| Corridas da temporada atual (`state.f1.season.races`) | `corrida`, remetente "Engenheiro de corrida" | Uma por corrida disputada: título `Nota N · GP …`, texto com posição, largada e a comparação com o companheiro quando houver `teammatePos` ("à frente de Russell" ou "atrás de Russell"). Sem nota (save antigo): título só com o GP e a posição. |
| A mesma lista de corridas | `marco`, remetente "Paddock" | No máximo uma por corrida, na primeira vez em que acontecer **na temporada atual**: primeiros pontos, primeiro pódio, primeira vitória. Para saber se é a primeira da carreira na F1, compare com os totais de temporadas anteriores (`state.f1.seasons`); se não der para afirmar com os dados do estado, escreva "primeiro(a) … da temporada". |
| `state.f1.world.lastMoves` (até 12) | `mercado` | Só na pré-temporada e nas três primeiras etapas. Uma mensagem por movimentação, com o texto que a tela de mercado já usa. |
| Manchete (parte C) | `imprensa` | Quando houver manchete da última corrida. |

Na base (antes da F1), use só o `careerLog`.

### B2. Expor na view

Em `engine/game.js`, `getView` passa a devolver `inbox: inboxView(state)`.

### B3. Testes

`tests/inbox.test.js`: ids únicos e estáveis (chamar duas vezes dá a mesma lista); ordem da mais nova para a mais antiga; uma mensagem de corrida por etapa disputada; marco de primeiro pódio aparece uma vez só; a função não altera o estado (`JSON.stringify` antes e depois). Use os auxiliares de `tools/calibrate/lib.js` (`answerFor`) para jogar uma carreira até a F1, como os outros testes fazem.

## Parte C — Manchete (engine, derivada)

Em `engine/inbox.js`, exporte também `headlineFor(state)`, que devolve `{ title, text }` ou `null` a partir da última corrida:

- vitória: `"<Sobrenome> vence o GP …"`;
- pódio: `"<Sobrenome> no pódio em …"`;
- chegou à frente do companheiro largando atrás dele: `"<Sobrenome> supera <Companheiro> em …"`;
- demais casos: `null`.

Título de campeão e transferência ficam para a v0.16; não implemente agora. Exponha em `getView` como `headline`.

## Parte D — Interface

### D1. Aba Mensagens

- `ui/app.js`, função `layout`: acrescente `inbox: 'Mensagens'` a `VIEWS`. Mostre o número de não lidas ao lado do rótulo quando for maior que zero (por exemplo, `Mensagens (3)`), com `aria-label` por extenso.
- Nova função `inboxPanel(view)`: lista de cartões com remetente, título, texto e ano; mensagens não lidas com destaque que não dependa só de cor (por exemplo, um marcador "nova").
- `ui/shell.html`: `.layout[data-view="inbox"]` mostra só o painel de mensagens, em uma coluna, em qualquer largura. Siga o padrão das regras de `data-view="driver"`.
- Ao abrir a aba, marque tudo como lido.

### D2. Lidas e não lidas

- Guarde em `localStorage` a lista de ids lidos por slot e por seed: chave `bandeirada.inbox.<slot>`, valor `{ seed, ids: [...] }`. Se a seed guardada for diferente da carreira atual, comece do zero. Limite a 200 ids. Envolva leitura e escrita em `try/catch`, como o tema e o som já fazem.
- Sem `localStorage`, tudo conta como lido depois de aberto, só nesta sessão (guarde em `ui`).

### D3. Nota e manchete no Paddock

- No cartão "Corrida encerrada" (`raceResultCard`), mostre a nota ao lado da posição quando existir: `Nota 7,5` (vírgula decimal).
- Na lista "Etapas" do painel do campeonato, acrescente a nota de cada corrida quando existir.
- Quando `view.headline` existir, mostre um cartão de manchete acima do resultado, com a classe `headline`. Ele também precisa esperar a bandeirada (está dentro de `main`; se a tarefa T2 da v0.14.7 já estiver feita, nada a fazer).

### D4. Testes de navegador

Em `tests/ui/career.spec.js`: a aba Mensagens existe fora da corrida e não existe durante; depois de uma corrida o contador é maior que zero; abrir a aba zera o contador; recarregar a página mantém as mensagens lidas; o cartão de resultado mostra a nota. Lembre de `skipScene` e `show`.

## Fora deste pacote

Duelo com o companheiro em placar fixo, briefing, conta do título, título de campeão e transferência como manchete (v0.16); "enquanto você esteve fora" e nota de todos os pilotos com "piloto do dia" (precisam de dados que o save não guarda; reavaliar depois da v0.19); explicação da nota dos olheiros (achado 29) pode entrar se sobrar tempo, como mensagem do tipo `equipe` na base, usando o texto que a tela já mostra.

## Entrega

Siga a seção "Entrega de cada pacote" de `guia-executor.md`. Versão alvo: 0.15.0. Em `docs/versoes.md`, acrescente uma entrada curta da v0.15 dizendo que o save ganhou o campo opcional `rating` nas corridas e que saves antigos continuam abrindo.
