# Achados da carreira jogada (2026-11-10)

Jogada na v0.14.3, no navegador, a 1024 px de largura. Do kart ao fim do primeiro ano de F1 por cliques, lendo cada tela (seed 3358876013, piloto consistente). Contrato, propostas da F1, aposentadoria e legado foram lidos em saves gerados pela política automática de calibração, não jogados à mão. Nada aqui foi corrigido, salvo indicação. Itens marcados "a conferir" são suspeitas sem verificação no código.

## Erros (corrigir primeiro)

1. **Variável interna exposta.** Foco do ano na F1: "+0.03 no pSuccess de desenvolvimento da equipe."
2. **A narração conta o futuro.** Antes de apagarem as luzes já aparece "Os macios acabaram cedo e você perdeu ritmo: −1 posição". Visto de novo no meio da corrida seguinte ("Uma parada lenta custou posições"). O efeito da estratégia é resolvido na escolha e narrado na hora.
3. **A próxima decisão chega antes de a cena acabar.** A janela de box aparece com a cena ainda em "Luzes de largada…"; o resultado do ataque na largada só entra na narração depois.
4. **Texto de teste fechado em público.** Legado: "Cole o resumo no chat de quem está testando".
5. **Etiqueta contraditória na oferta.** Ferrari com "Carro: meio do pelotão (#4)" e selo "Equipe de ponta". Em ofertas de meio de pelotão, "Pressão ●●○ média" ao lado de "Pouca pressão".
6. **Números que não fecham.** Legado: 79 vitórias, 241 pódios, 200 poles no cartão e 80, 249, 201 na ficha (a ficha soma a base). (A suspeita de "▲14" com texto "subiu 1" na tabela era corte da minha leitura, não erro do jogo.)
7. **Decimal misturado.** "+1.5 de desempenho" e "+0.5" com ponto; "+9,5" com vírgula.
8. **Plurais com parênteses.** "1 ano(s)", "10 temporada(s)".

## A decisão fica enterrada

9. **Botão principal abaixo da dobra no desktop.** Antes da corrida, "Acompanhar etapa" fica a cerca de 1.180 px; na classificação, as opções de pneu também, atrás da lista do grid.
10. **Tela de fim de carreira abre no pódio da última corrida.** O legado vem depois da cena. O mesmo acontece com contrato, propostas da F1 e aposentadoria: todos abaixo do pódio e da cena da etapa anterior.
11. **Resultado antigo no topo.** Ao subir de categoria, o cartão da temporada anterior continua acima da decisão nova.
12. **Duas etapas na mesma tela.** Com a bandeirada da Austrália ainda animando, a página já mostra "Antes da corrida · GP da China". "GP da Austrália / Antes da corrida" aparece duas vezes antes da largada.
13. **"Controles de acompanhamento" fecha a cada clique.** Simular o resto da temporada pede reabrir o painel toda vez que uma notícia interrompe.

## Momentos sem peso

14. **Um ano de base são três cliques.** Escolha de pré-temporada, "Disputar temporada" e o resultado aparece: 19º, sem ver corrida nenhuma. Do kart à F1 foram cerca de 20 cliques.
15. **Marcos passam em branco.** Título da F2, estreia na F1 e primeiros pontos não têm tela nem frase própria.
16. **Corrida curta.** A primeira corrida de F1 teve três decisões (pneus, largada, box) e acabou.
17. **Companheiro invisível.** Russell venceu a corrida de estreia e nada na tela disse que era o companheiro.
18. **Aposentadoria sem contexto.** Aos 30 anos, depois de um P2: "Continuar ou encerrar a carreira?", sem títulos, previsão de declínio ou o que está em jogo.
19. **Legado é um número.** "23140 nota de legado", sem faixa, comparação ou história da carreira. A ficha de um piloto aposentado ainda mostra "contrato: 0 anos" e "Você é piloto 1".

## Decisões fracas

20. **Opção dominada.** "Forçar o ritmo": 50% de ganhar e 50% de perder posições, com a confiança caindo nos dois casos. "Administrar" dá confiança e mantém a posição.
21. **Ofertas da base em fórmula fixa.** Sempre uma de ponta, duas de meio (#4 e #5) com texto idêntico, e ficar. A frase "Sua avaliação dos olheiros foi alta" se repete nos três cartões.
22. **Academia sem contrapartida.** O convite só descreve vantagem; não há motivo para recusar.
23. **Rádio que não explica.** "Por que decidir agora? Estratégia pelo rádio: uma situação de corrida exige sua escolha." e "Pneus definidos pelo plano e pelas características da pista." não ajudam a escolher.
24. **Conselhos que se contradizem.** A narração diz que os macios acabaram cedo; o rádio recomenda adiar a parada e diz que o ritmo favorece ficar na pista.
25. **Bloco de risco no meio da corrida.** Na 2ª corrida de um estreante: "o risco de perder a vaga seria de 30% … que normalmente é de 30%".

## Texto e termos

26. Inglês que restou: "Karting" como nome da categoria (a aba já diz "Kart"), "Networking de academias", "surfar o mercado".
27. Kart chamado de carro: "Carro forte", "+2 de carro", "Energy Corse carro #7". O "#7" é a força do equipamento e se confunde com o número do piloto (#27).
28. "te venceu na Karting"; "É sua primeira corrida em casa registrada nesta carreira."
29. "Nota 0: resultado (19º) +1 · cobrança da equipe −1" é opaco para quem chega.
30. Narração: quase tudo rotulado "Largada", inclusive lances do meio da prova; ordem do mais novo para o mais antigo; a parada aparece como "pneus de pista seca", sem o composto.
31. "Temporada 1" no lugar do ano (2032).

## Acessibilidade

32. Estilos de pilotagem e escolhas de pré-temporada não são expostos como botão nem indicam o selecionado a leitores de tela (sem `aria-pressed`).

## Suspeitas verificadas por simulação (2026-11-11)

Política automática de calibração, estilo consistente.

33. **Posição repetida (P8 em cinco etapas): não é defeito geral.** Em 689 temporadas de F1 de 60 carreiras, a posição mais comum ocupa 21% das corridas na mediana e 29% no percentil 90. A etiqueta lê a ordem de chegada da própria corrida. A sequência vista não foi reproduzida; ficou como coincidência provável daquela carreira.
34. **Poles: o caso de 60% é exceção.** Em 37 carreiras completas, 171 poles e 184 vitórias em 11.032 GPs (1,5% e 1,7%). A carreira de 200 poles é um caso de dinastia, limite já conhecido da calibração, e não um erro de contagem.
35. **Escolha do kart sem efeito visível (achado novo).** No primeiro ano de kart, em 300 seeds, "Chassi alugado (+2 de carro)" dá posição média 12,4 e "Treinador (+1 de habilidade permanente)" dá 12,2; top 3 em 1% nos dois casos. O salto de 19º para 2º visto na jogada foi variação entre temporadas, não o chassi. O chassi não entrega o ganho imediato que promete, então o treinador é sempre a melhor escolha.

## Estado em 2026-11-11

**Corrigido e publicado na v0.14.4 (2026-11-11).** 183 testes Node, build e 30 Playwright (Chrome) aprovados.

- 1: o foco "Ajudar o desenvolvimento" descreve o efeito em palavras.
- 2: o resultado da estratégia de pneus só entra na narração depois da janela de box (ou nas voltas finais); antes aparece "Plano de pneus definido para a largada". Só a view mudou; regra e resultado são os mesmos.
- 4: texto do resumo copiável reescrito.
- 5: rótulo do carro nas ofertas para a F1 usa os mesmos cortes do perfil da equipe; "Pouca pressão" virou "Pressão moderada" no perfil de meio de pelotão.
- 6: números do legado rotulados "na F1".
- 7 e 8: vírgula decimal e plurais sem parênteses.
- 13: "Controles de acompanhamento" continua aberto depois de simular (teste de interface ajustado).
- 20: "Forçar o ritmo" só custa confiança quando dá errado. A política automática escolhe a outra opção, então a calibração não muda.
- 26 e 28: "Kart" como nome da categoria e "te venceu no Kart". "Networking de academias" e "surfar o mercado" ficaram: são de uso comum no Brasil (critério do usuário em 2026-11-11).
- Características da pista no cabeçalho da cena, para a escolha de pneus no desktop.

**Tentado e revertido: escolha do kart (35).** Subir o chassi de +2 para +5 torna a escolha real (posição média 10,8 contra 12,3 do treinador), mas em 150 carreiras da política "a" a taxa de título foi de 14% para 22% (±3,6) e a chegada à F1 de 91% para 86%. Fica acima da meta de 15 a 20%. O valor voltou a +2; o texto diz "+2 de kart". Para resolver: calibrar com 300 ou mais carreiras por política e compensar em outro parâmetro, ou trocar o efeito do chassi por algo que não mexa no desempenho (por exemplo, visibilidade para olheiros).

**Não corrigido, com destino.**

| Achados | Onde fica |
|---|---|
| 3 (decisão antes de a cena acabar), 9 a 12 (decisão enterrada, duas etapas na tela) | Resolvidos na v0.14.5, aplicada localmente em 2026-11-11 |
| 15, 17 (marcos e companheiro) | v0.15 e v0.16 |
| 18, 19 (aposentadoria e legado) | v0.16 e v0.17; retrospectiva na v0.34 |
| 14 (ano de base em três cliques) | v0.32, mini calendário |
| 16 (corrida curta) | Fase 4, volta a volta |
| 21, 22 (ofertas em fórmula fixa, academia sem contrapartida) | v0.28 e v0.30 |
| 23, 24, 25 (rádio que não explica, conselhos contraditórios, bloco de risco) | Leitura frase a frase das telas (resto da v0.14.2) |
| 27, 29, 30, 31 (kart chamado de carro, nota opaca, rótulos da narração, "Temporada 1") | Leitura frase a frase das telas |
| 32 (acessibilidade das escolhas) | v0.20 |
| 35 (escolha do kart) | Ajustador de calibração, v0.19 |

## Ordem sugerida

Erros 1 a 8 e o item 13 cabem num pacote pequeno de correções. Os itens 9 a 12 pedem o modo paddock: cada decisão fora da corrida em tela própria, sem a cena antiga em cima. Os itens 14 a 19 confirmam a Fase 1 (marcos, companheiro, nota) e o mini calendário da base.
