# Apex: ideias e melhorias, do mais fácil ao mais difícil

Lista consolidada de tudo que surgiu até agora, ordenada pelo custo de implementar. Esforço é uma estimativa de trabalho de código + teste + calibração (P = horas, M = alguns dias, G = semanas).
Itens já registrados como dívida no README estão marcados com (README).

## Nível 1: muito fácil (só UI, texto ou dados)

| # | Item | Esforço | Notas |
|---|---|---|---|
| ~~1.1~~ | ~~Mostrar skill, potencial e estilo do jogador na tela~~ | P | ✅ **Feito (2026-11-07).** A tela mostra estilo, nível (skill) e "teto estimado". Decisão tomada: o potencial exato fica escondido; a UI só mostra uma faixa de 10 pontos ("palpite dos olheiros"), calculada em `potentialBand`. Reverter para o valor exato é trocar uma linha em `getView`. |
| ~~1.2~~ | ~~Tutorial curto e glossário (status p1/p2, scouting, confiança, academia)~~ | P | ✅ **Feito (2026-11-07).** Botão "Ajuda" na tela inicial e em toda tela de carreira, com 12 verbetes recolhíveis (objetivo, scouting, academia, estilos, status, ordem de equipe, contrato, eventos, salvar). Os textos não citam números de regra, para não desatualizar com o `config.js`. |
| 1.3 | Revisar e reescrever os textos dos eventos | P | A spec pede revisão sua antes de divulgar. Tudo em `data/events.js`. **Em revisão (2026-11-07):** passada de redação feita por mim nos 28 textos (tom de rádio e manchete, nomes de piloto, rival e equipe, sem frases do tipo "efeito: revelação", rótulos próprios nos botões, "Nada muda" não repete mais). Mecânica e números intactos; resultados de texto agora podem citar nomes (`outcomeText`). **Falta o seu OK:** leia `docs/textos-eventos.md` (gerado por `npm run events`), me diga o que mudar e o item é riscado. |
| ~~1.4~~ | ~~Resumo curto depois de cada corrida (o que decidiu o resultado)~~ | P | ✅ **Feito (2026-11-07).** Cada corrida tem uma frase: largada x chegada (com +/−), chuva, abordagem, evento e ordem de equipe (`raceSummary`). A causa de um abandono não é simulada, então o resumo diz só "abandonou". |
| ~~1.5~~ | ~~Revisar nomes e vínculos reais das equipes de base e academias~~ | P | ✅ **Feito (2026-11-07), com ressalva.** Conferido na web: F2 (11 equipes) e F3 (10 equipes) batem com os grids de 2026. Correções: F3 sem a Jenzer (a DAMS entrou no lugar em 2025-2027, grid de 20), "Invicta Virtuosi Racing" virou "Invicta Racing", e duas marcas de kart que não consegui confirmar foram trocadas (Exprit e Kosmic). Calibração da base mantida (91% chegam à F1). Ressalvas: F4 e kart variam por país e por ano, então são equipes reais, mas não um grid oficial; Prema-Ferrari é parceria longa e documentada, mas DAMS-Alpine continua aproximação de jogo (não achei confirmação atual). |
| ~~1.6~~ | ~~Cartão de oferta com mais dados (histórico recente, vantagens e riscos)~~ | P | ✅ **Feito (2026-11-07), sem o histórico.** Cada oferta, na base e na F1, lista vantagens (+) e riscos (−): carro, companheiro (quem é mais forte), academia, confiança perdida ao trocar. O histórico recente da equipe não entrou: as equipes de base não guardam histórico (força fixa), e na F1 só o campeão do ano é registrado. Fica como ideia se o histórico passar a existir (item 4.4/4.5). |
| ~~1.7~~ | ~~Ajustes de mobile e acessibilidade~~ | P | ✅ **Feito (2026-11-07).** Foco vai ao título a cada troca de tela; `#app` deixou de ser `aria-live` (relia a tela inteira a cada clique), com avisos como `role="status"`/`alert`; contornos de foco em campo de texto, resumo e links; texto só para leitor de tela nas vantagens e riscos; cor de "vantagem" escurecida no tema claro para contraste. Conferido a 375px percorrendo uma carreira inteira (399 passos, 260 telas): nenhuma tela estourou na horizontal. Não testei com leitor de tela de verdade. |
| ~~1.8~~ | ~~Mais eventos narrativos (patrocínio, família, mídia, engenheiro de pista)~~ | P por evento | ✅ **Feito (2026-11-07).** 8 narrativos novos (patrocínio, engenheiro de pista, simulador, conselho de família, crise na equipe, entrevista viral, revelação do ano, fã-clube) e 2 de corrida (largada confusa, bandeira amarela), só em `data/events.js`. Total: 19 narrativos e 9 de corrida. Textos são rascunho meu, sujeitos à revisão do 1.3. |

## Nível 2: fácil (pouca lógica nova na engine)

| # | Item | Esforço | Notas |
|---|---|---|---|
| 2.1 | Estatísticas de carreira completas (por equipe, recordes, comparação com o companheiro) | P-M | A engine guarda `seasons`; falta agregar e exibir. |
| 2.2 | Gráfico de evolução do jogador ano a ano | P-M | Guardar um ponto por temporada no estado. |
| 2.3 | Companheiros de base visíveis (quem correu ao seu lado) | M | Hoje o grid de base é descartável; guardar o companheiro de equipe por temporada. |
| 2.4 | Pedir uma equipe específica numa oferta | M | Regra nova: aceita ou recusa pela nota. |
| 2.5 | Ranking local e botão de "copiar carreira" mais completo | P | Já existe o resumo copiável; ampliar com linha do tempo. |
| 2.6 | Telemetria anônima para calibrar com jogo real | M | Exige um destino para os dados (ver 4.1). |
| 2.7 | Salvar carreira de verdade (export e import de arquivo) | M | Estado já é serializável; falta versão e migração de formato. |
| 2.8 | Som e animação leve | M | Só front-end. |

## Nível 3: médio (sistemas novos, mas isolados)

| # | Item | Esforço | Notas |
|---|---|---|---|
| 3.1 | Rival persistente do kart até a F1 (evento `rival_reencontro`) | M | Mantê-lo no estado e inseri-lo no mundo da F1. Hoje o "rival do ano" é só o piloto de skill mais próxima. |
| 3.2 | Rivalidades na história (quem te venceu, duelos marcantes) | M | Depende de 3.1. |
| 3.3 | Equipes-satélite e cláusula de renovação na entrada da F1 | M | Descrito em `spec-sistemas`. |
| 3.4 | Academias de verdade (benefícios e cobranças) | M | Vincula convite de academia a equipes da F1. |
| 3.5 | Moral e confiança da equipe como força invisível (README) | M | Modulador sobre ofertas e desenvolvimento. |
| 3.6 | Orçamento de equipe seguindo o sucesso, com piso (README) | M | Mexe no desenvolvimento do carro; recalibrar o `npm run balance`. |
| 3.7 | Contratos mais ricos (cláusula de performance, rescisão) | M | Estende o `contract_terms`. |
| 3.8 | Mercado de transferências com notícias e rumores | M | Texto gerado a partir do mercado que já existe. |
| 3.9 | Atributos separados do piloto (classificação, corrida, chuva, largada, pneus) | M-G | Afeta o motor de corrida e toda a calibração. |
| 3.10 | Modo fictício (arquivo de substituição de nomes) (README) | M | Dados já estão em arquivos; falta um seletor e geração de nomes. |
| 3.11 | Rotas alternativas (Super Fórmula, IndyCar, Fórmula E) como tabela leve que regenera o scouting (README) | M-G | Hoje a rota alternativa é tela terminal. Inclui legado e `altRouteTitles`. |
| 3.12 | Salvar e recarregar em nuvem | M | Depende de 4.1. |

## Nível 4: difícil (infraestrutura ou mudança grande de escopo)

| # | Item | Esforço | Notas |
|---|---|---|---|
| 4.1 | Backend de ranking e compartilhamento (FastAPI + Postgres) | G | Especificado em `spec-backend`: nota recalculada no servidor, plausibilidade, rate limit. |
| 4.2 | Página de compartilhamento com card da carreira | M-G | Depende de 4.1. |
| 4.3 | Anti-fraude forte por replay determinístico no servidor | G | A arquitetura já permite (engine isomórfica + seed + decisões); falta o executor. |
| 4.4 | Mundo vivo mais rico (fusões, saída de marcas, equipes novas) | G | Reescreve partes do mercado e do orçamento. |
| 4.5 | Pilotos de base com carreiras próprias (sobem e caem) | G | O grid deixa de ser descartável; custo de simulação aumenta. |
| 4.6 | Fornecedor de motor e mudança de regulamento por fábrica | G | Substitui o `regulation` atual; recalibrar dinastias. |
| 4.7 | Confiabilidade por componente, troca e punição de grid | G | Exige estado de componentes por carro. |

## Nível 5: muito difícil (o caminho do "100% real")

Cada item muda decisões já fechadas (base resumida, sem economia, resultado por ordem de chegada). Fazer em ordem, porque um depende do outro.

| # | Item | Esforço | Notas |
|---|---|---|---|
| 5.1 | Calendário e pistas reais com características diferentes | G | Dados por pista (alta velocidade, rua, chuva) e efeito no motor. |
| 5.2 | Fim de semana completo (treinos livres, Q1/Q2/Q3, sprint, corrida) | G | Muda o ritmo e o número de decisões por corrida. |
| 5.3 | Meteorologia dinâmica durante a corrida | G | Hoje a chuva é sorteada uma vez por corrida. |
| 5.4 | Regras da FIA (limites de pista, punições, bandeira vermelha, safety car) | G | O invariante do README vale: aplicar antes da premiação. |
| 5.5 | Modelo de tempo de volta (degradação de pneu, combustível, tráfego) | G+ | Substitui o `simWeekend`; é a maior reescrita da engine. |
| 5.6 | Pit stops e estratégia de pneus de verdade | G+ | Depende de 5.5. |
| 5.7 | Duelo roda a roda, DRS e incidentes com consequência | G+ | Depende de 5.5 e 5.6. |
| 5.8 | Desenvolvimento com teto de custos e túnel de vento limitado | G | Depende de 4.6. |
| 5.9 | Base simulada corrida a corrida (e não uma temporada resumida) | G+ | Contradiz a decisão atual de 3 a 5 minutos até a F1; precisa de nova decisão de produto. |

## Funcional: o que faz o jogo funcionar de verdade (transversal)

Itens que não são "recurso de jogo", mas decidem se dá para jogar sem perder progresso e testar com amigos. Ordenados do mais fácil ao mais difícil. Vários valem mais que itens dos níveis 3 a 5; a coluna Nível indica onde caberiam na tabela principal.

| # | Item | Esforço | Nível | Notas |
|---|---|---|---|---|
| ~~F.1~~ | ~~Transformar o projeto em repositório git~~ | P | 1 | ✅ **Feito (2026-11-07).** `git init` na branch `main`, `.gitignore` (node_modules, dist) e primeiro commit. |
| ~~F.2~~ | ~~Mostrar a seed na tela durante o jogo~~ | P | 1 | ✅ **Feito (2026-11-07).** Chip "seed N" no cabeçalho de toda tela de carreira; a view expõe `seed`. |
| ~~F.3~~ | ~~Explicar o porquê (nota de scouting, status, oferta) em uma linha~~ | P | 1 | ✅ **Feito (2026-11-07).** Nota de scouting com as parcelas somadas (resultado, carro fraco, academia, fama, idade) e o que cada tipo de oferta exige; status com "Por quê" (sem mostrar skill); cada oferta de base e de F1 com uma linha de motivo. A engine expõe `scoutingBreakdown` e `statusWhy`. |
| ~~F.4~~ | ~~Tela de erro útil com "copiar relatório" (estado, seed, últimas decisões)~~ | P | 1 | ✅ **Feito (2026-11-07).** O estado guarda `history` (tipo e resposta de cada decisão); o botão "Copiar relatório do erro" junta mensagem, seed, versão, fase, últimas 15 decisões e navegador. Esse histórico também serve de base para o replay do item 4.3. |
| ~~F.5~~ | ~~`engineVersion` no snapshot e aviso de save antigo~~ | P | 1 | ✅ **Feito (2026-11-07).** `ENGINE_VERSION` em `engine/game.js` (subir quando o formato do estado mudar); save de outra versão é descartado com aviso na tela inicial. |
| ~~F.6~~ | ~~Desfazer a última decisão~~ | P-M | 2 | ✅ **Feito (2026-11-07).** Botão "Desfazer" no cabeçalho, até 30 passos, só em memória (some ao recarregar a página). Repetir a mesma decisão depois de desfazer dá o mesmo resultado (testado). |
| ~~F.7~~ | ~~Salvar na máquina (`localStorage`), com alguns slots e exportar arquivo~~ | M | 2 | ✅ **Feito (2026-11-07).** 3 slots com autosave a cada decisão (`ui/saves.js`, testado em Node), tela "Suas carreiras" (continuar, salvar em arquivo, apagar com confirmação), importar arquivo `.json` (rejeita arquivo inválido, de outra versão ou corrompido) e botão "Menu" sem perder a carreira. Sem `localStorage` (modo privado, `data:`), o jogo avisa e segue sem salvar. No Artifact o arquivo sai pela capacidade `downloads` (o viewer confirma o download). Não migra saves antigos de `sessionStorage`. |
| ~~F.8~~ | ~~Controle de velocidade (simular 5 corridas, até o próximo evento, pular eventos sem escolha)~~ | M | 2 | ✅ **Feito (2026-11-07).** Botões "Simular 5 corridas" e "Simular o resto da temporada" (abordagem equilibrada); a simulação para sozinha em decisão com escolha real (evento, ordem de equipe) e mostra o resultado das corridas simuladas e o motivo da parada. "Até o próximo evento" é esse mesmo comportamento, então não virou botão separado. Opção "Resolver sozinho eventos sem escolha" (ligada por padrão): evento de uma opção só é resolvido na hora e o resultado aparece no cartão seguinte. |
| ~~F.9~~ | ~~Formulário de feedback com resumo da carreira, seed e texto~~ | M | 2 | ✅ **Feito (2026-11-07).** Botão "Feedback" na tela inicial e em toda tela de carreira: tipo (bug, balanceamento, ideia, outro), texto, opção de incluir seed, versão e últimas decisões (ou todas, para repetir o problema) e "Copiar feedback" (com campo de apoio se o navegador negar o clipboard). Com `APEX_FEEDBACK_URL` no build, aparece também "Enviar pelo GitHub" (issue com título e corpo preenchidos, corpo cortado para caber na URL). Lógica em `ui/feedback.js`, testada. |
| F.10 | Seletor de dificuldade ou modo assistido | M | 2 | Ajusta potencial e frequência de eventos; exige recalibrar cada nível. |
| ~~F.11~~ | ~~Hospedagem fora do Artifact (Cloudflare Pages ou GitHub Pages)~~ | M | 2 | ✅ **Feito (2026-11-07).** Site público em **https://alexarnoni.github.io/apex/**, repositório público https://github.com/alexarnoni/apex. O workflow `.github/workflows/pages.yml` roda `npm test` (Node 22, Linux) e `npm run build` a cada push na `main` e publica sozinho; o botão "Enviar pelo GitHub" do feedback abre issue nesse repositório. O Artifact antigo continua no ar, mas a versão pública é a do GitHub Pages. |
| F.12 | Desafio diário (uma seed por dia) e ranking local dos amigos | M | 3 | Funciona sem backend, com o resumo copiado. |
| F.13 | Teste automático da interface no `npm test` | M | 3 | O percurso completo clicando foi feito à mão; automatizar pega quebras na UI antes de publicar. |
| F.14 | Pipeline único de publicação (`npm run release`) | M | 3 | Roda testes e balanceamento, constrói e publica; evita publicar versão quebrada. |
| F.15 | PWA e modo offline | M | 3 | O jogo todo já roda no cliente. |
| F.16 | Conquistas e hall da fama local | M | 3 | Dá objetivo a quem já ganhou um título. |
| F.17 | Teste de desempenho em carreira longa e celular fraco | M | 3 | Cada transição clona o estado inteiro; medir antes de o mundo crescer. |
| F.18 | Tradução (i18n): separar os textos do código | M-G | 4 | Mais barato fazer antes de o volume de texto crescer. |

## Pendências de qualidade (transversais)

- Calibrar com jogo real, não com política passiva: taxa de título (hoje 24% passivo), crescimento do jogador na base, frequência de eventos, frequência de `fia_polemica_titulo` e `contrato_vazado` (nunca dispararam em simulação passiva).
- Mais testes de regressão para as fórmulas e ferramentas de balanceamento para a carreira do jogador.
- Jogar uma carreira inteira numa tela real de celular.
- Decidir se `story_event` entra formalmente na spec-loop-jogador (hoje é um tipo novo, fora da lista de tipos).

## Sugestão de ordem

0. Funcional barato primeiro: F.1 a F.7 e F.11. São baratos e dão segurança (git, desfazer, salvar, link público) para o resto.
1. Nível 1 inteiro, junto com 2.1 a 2.3: deixa o jogo mais rico rápido e dá material para os amigos testarem. Depois, F.8 e F.9 (ritmo e feedback), que os amigos mais vão sentir.
2. 3.1 e 3.2 (rival persistente): é o que dá alma à narrativa.
3. 3.3, 3.4 e 3.11 (satélites, academias, rotas alternativas): fecham os becos sem saída da carreira.
4. 4.1 e 4.2 (ranking e compartilhamento): quando o jogo já agradar.
5. Nível 5 só depois de decidir qual camada de realismo importa mais.
