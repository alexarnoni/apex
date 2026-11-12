# Especificação — v0.14.7 "Pendências da carreira jogada"

Pacote pequeno, quase todo de texto e interface. Leia antes `guia-executor.md`. Origem: `achados-jogada.md` (os números entre parênteses são os achados). Estado em 2026-11-11: **publicado** em 2026-11-11 como v0.14.7 (commit `c39b4d3`). Modelo sugerido: qualquer um; as tarefas são independentes.

| Tarefa | Estado |
|---|---|
| T1 etiqueta da cena | **Feito** |
| T2 plano após bandeirada | **Feito** (`.after-flag`; auxiliar `skipScene` também clica em `[data-scene="skip"]`) |
| T3 evento "Pelotão embolado" | **Feito** (`npm run events` executado) |
| T4 ordem no celular | **Feito**, testes passam; **captura 375×812 não feita** |
| T5 "Pista equilibrada" | **Feito** |
| T6 rádio que explica | **Feito** |
| T7 aviso de confiança | **Feito** (`<details>`) |
| T8 kart não é carro | **Feito** (ofertas do kart e cartão da base); "Carro:" nas ofertas de F4 em diante não foi tocado, por fora do escopo |
| T9 ano no lugar de "Temporada 1" | **Feito** (`view.year`; `raceDashboard` recebe o ano por parâmetro) |
| T10 frase do GP de casa | **Feito** |
| T11 composto na parada | **Feito**, com ressalva: em pista seca usa o composto do plano quando ele é macios, médios ou duros; sem composto escolhido na parada, mantém "pneus de pista seca". |
| T12 `aria-pressed` | **Feito** (`optionCards` e estilo de pilotagem) |

Nenhuma tarefa deste pacote muda regra, probabilidade, efeito ou save. Se alguma mudança parecer exigir isso, pare e relate.

## Tarefas

### T1 — Etiqueta da cena não adianta o resultado (37)

- **Arquivo:** `ui/app.js`, função `raceSceneCard`, linha com `<span class="chip">${esc(phase)}${position ? ` · P${position}` : ''}</span>`.
- **Problema:** enquanto a animação roda, a etiqueta já mostra a fase e a posição finais ("Bandeirada · P8" durante as luzes de largada).
- **Mudança:** quando `sceneModel?.playing` for verdadeiro, renderize essa etiqueta com `hidden data-finish-reveal`. Ela aparece sozinha quando o trecho termina.
- **Pronto quando:** com a cena rodando a etiqueta de fase não está visível; ao terminar ou pular, aparece. A etiqueta de clima continua sempre visível.

### T2 — Plano da próxima etapa só depois da bandeirada (38)

- **Arquivo:** `ui/app.js`, função `layout`, linha `<div class="col-main">${sceneTop ? scene + main : main + scene}</div>`.
- **Problema:** com a bandeirada ainda animando, a tela já mostra o resultado e o plano da etapa seguinte.
- **Mudança:** quando `sceneTop && !raceLead` (bandeirada em exibição fora do modo corrida), envolva `main` em `<div class="after-flag" hidden data-finish-reveal>…</div>`. Em `ui/shell.html`, dê a `.after-flag` o mesmo comportamento de coluna de `.col-main` (`display: flex; flex-direction: column; gap: 16px;`) e garanta que `[hidden]` a esconda (já existe a regra `[data-finish-reveal][hidden] { display: none; }`; confira a ordem das regras).
- **Testes:** cenários que clicam em `simnext`, `simimportant`, `sim5` ou `simrest` logo depois de uma corrida vão encontrar o botão escondido. Antes desses cliques, chame `skipScene(page)`; amplie o auxiliar para também clicar em `[data-scene="skip"]` quando `[data-scene-skip]` não existir.
- **Pronto quando:** durante a bandeirada só aparecem abas, cena e, ao fim, pódio com "Continuar" e o conteúdo; os 34 testes passam.

### T3 — Evento "Largada confusa" vira lance de meio de corrida (39)

- **Arquivo:** `data/events.js`, evento `id: 'largada_confusa'`.
- **Problema:** aparece depois de a largada já ter sido decidida e narrada.
- **Mudança, só de texto.** Não altere `id`, `phase`, `safe`, `weight`, `cond`, `p`, `effects` nem os `id` das opções.
  - `title`: `'Pelotão embolado'`
  - `text`: `'Três carros dividem a freada à sua frente. Tem espaço por dentro, mas é pouco.'`
  - opção `atacar`: `label` `'Mergulhar por dentro'`; textos dos resultados, na ordem: `'Você mergulha por dentro e passa dois carros na saída da curva.'`, `'Você é espremido e perde duas posições.'`, `'Toque na disputa. Pneu furado e corrida encerrada.'`, `'Não havia espaço, e você mantém a posição.'`
  - opção `esperar`: mantenha o rótulo; troque `'Largada limpa, sem mudança.'` por `'Ninguém erra, e tudo segue igual.'`
- **Depois:** `npm run events`. Procure `Largada confusa` e `Atacar na primeira curva` em `tests/` e ajuste se algum teste citar os textos antigos (o rótulo "Atacar na primeira curva" continua existindo na decisão de largada, em `engine/`; não mexa nele).
- **Pronto quando:** `npm test` passa e `docs/textos-eventos.md` mostra o evento novo.

### T4 — Opções presas não cobrem a descrição no celular (40)

- **Arquivo:** `ui/shell.html`, bloco `@media (max-width: 699px)` do modo corrida.
- **Problema:** no celular as duas opções ficam presas ao rodapé e cobrem o texto que descreve a situação.
- **Mudança:** dentro desse bloco, faça o recado do rádio vir depois da descrição: `.in-race .focus > .decision-context { order: 5; }` e `.in-race .focus > .grid2 { order: 10; }` (o cartão já é `display: flex; flex-direction: column`). O título (`h2`, `h3`) continua primeiro por não ter `order`.
- **Pronto quando:** a 375×812, numa decisão de corrida com duas opções, a descrição da situação aparece inteira acima das opções sem rolar. Confira com uma captura.

### T5 — Circuito sem característica diz que é equilibrado (42)

- **Arquivos:** `ui/app.js`, função `raceSceneCard` (etiqueta de características, que só aparece quando `map.circuit.tags?.length`) e a função que monta "Informações do circuito" em `raceDashboard`.
- **Problema:** oito circuitos têm `tags: []` em `data/circuits.js`; a escolha de pneus fala em pista de rua e pista técnica sem dizer qual é o caso.
- **Mudança, só de interface:** quando o circuito não tiver características, mostre a etiqueta `Pista equilibrada`, com `title` `Sem característica marcante: nenhum pneu leva vantagem pelo traçado.` Não altere `data/circuits.js` (as características mexem no resultado).
- **Pronto quando:** na Austrália a cena mostra "Pista equilibrada"; no Canadá continua "Pista de potência".

### T6 — Rádio que explica (23)

- **Arquivo:** `engine/race-policy.js` (textos de `reason`; são só texto exibido).
- **Mudança:** troque estas três frases. Não mexa em mais nada da função.
  - `'Pneus definidos pelo plano e pelas características da pista.'` → `'Antes da largada você escolhe o pneu do primeiro trecho. A recomendação segue o seu plano e o tipo de pista.'`
  - `'Largada segue o plano escolhido.'` → `'As luzes vão se apagar. Atacar pode render posição; largar com margem evita toque na primeira curva.'`
  - `` `${p.title}: uma situação de corrida exige sua escolha.` `` → `` `${p.title}: o lance acontece agora e a equipe não decide por você.` ``
- **Pronto quando:** `npm test` passa (procure as frases antigas em `tests/` antes).

### T7 — Aviso de confiança curto durante a corrida (25)

- **Arquivo:** `ui/app.js`, função `trustNotice`.
- **Problema:** no meio de uma decisão de corrida aparece um bloco longo com percentuais de risco de perder a vaga.
- **Mudança:** mantenha a primeira linha (`Confiança da equipe · N/100`) sempre visível e coloque os dois parágrafos dentro de `<details><summary>O que está em jogo</summary>…</details>`.
- **Pronto quando:** o aviso ocupa uma linha fechado e mostra o mesmo texto de antes aberto. Procure em `tests/ui/` por trechos desses parágrafos; se houver, abra o `details` no teste antes de conferir.

### T8 — Kart não é carro (27)

- **Arquivos:** `engine/game.js` (ofertas do kart, textos `'Carro forte · cobrança alta'` e os dois irmãos, "Carro intermediário" e "Carro menos competitivo") e `ui/app.js` (cartão da temporada da base, `<span class="chip">carro #${esc(ls.carRank)}</span>`).
- **Mudança:** nas três ofertas do kart, troque "Carro" por "Kart". No cartão da temporada, troque a etiqueta por `força do equipamento: ${ls.carRank}º` (vale para todas as categorias da base; o número é a posição do equipamento na categoria, não o número do piloto).
- **Pronto quando:** a tela de kart não usa "carro" nas ofertas e a etiqueta não se confunde com o número do piloto. Ajuste testes que citem os textos antigos.

### T9 — Ano no lugar de "Temporada 1" (31)

- **Arquivo:** `ui/app.js`, duas ocorrências de `Temporada ${…f1.worldSeason…}` (título do painel do campeonato e barra de progresso do GP).
- **Mudança:** mostre `Temporada ${view.year}` (ou o ano equivalente disponível na função; confira o que cada função recebe). Se a função só receber `f1`, passe o ano por parâmetro.
- **Pronto quando:** as duas telas mostram o ano (por exemplo, "Temporada 2032"). Ajuste testes que procurem "Temporada 1".

### T10 — Frase do GP de casa (28)

- **Arquivo:** `engine/f1.js`, texto `'É sua primeira corrida em casa registrada nesta carreira.'`
- **Mudança:** `'É a sua primeira corrida em casa na F1.'`

### T11 — Parada mostra o composto (30)

- **Arquivo:** `engine/f1.js`, linha com `tyre.id === 'slicks' ? 'Pneus de pista seca' : …`.
- **Problema:** o relato da parada diz "colocou pneus de pista seca" mesmo em pista seca, sem dizer o composto.
- **Mudança:** leia a função em volta para entender quando `tyre.id` é `'slicks'`. Se for só a aposta de pneus de seco em pista molhada, deixe como está e marque a tarefa como "sem mudança necessária", explicando. Se também cobrir a parada normal em pista seca, use o rótulo do composto escolhido. Não altere a lógica, só o texto exibido.

### T12 — Escolhas anunciam o que está selecionado (32)

- **Arquivo:** `ui/app.js`, função `optionCards` e os botões de estilo de pilotagem (`data-act="style"`).
- **Mudança:** acrescente `aria-pressed="${selecionado}"` aos botões `.opt` que podem ficar marcados (`class="opt on"`).
- **Pronto quando:** o botão marcado tem `aria-pressed="true"` e os demais `"false"`.

## Fora deste pacote

Ficam onde `achados-jogada.md` indica: corrida com poucas decisões (41, Fase 4), conselhos contraditórios (24, depende do volta a volta), nota opaca dos olheiros (29, v0.15), ofertas em fórmula fixa e academia sem contrapartida (21 e 22, v0.28 e v0.30), escolha do kart (35, v0.19), marcos, companheiro, aposentadoria e legado (15, 17, 18, 19: v0.15 a v0.17).

## Entrega

Siga a seção "Entrega de cada pacote" de `guia-executor.md`. Versão alvo: 0.14.7 (suba só quando o usuário mandar publicar).
