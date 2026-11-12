# Pacotes de atualização até a 1.0

Programado em **2026-11-10**, a partir da v0.14.1 publicada. Cada pacote é uma atualização publicável com um tema só. O detalhe de cada item fica em `roadmap-ideias.md`, na fase indicada; aqui fica a ordem, o recorte e o critério de pronto.

Nenhum pacote abaixo foi implementado. Não há datas: a ordem é fixa, o ritmo depende de quem implementa. Tamanho: P = horas, M = alguns dias, G = semanas.

## Regras de todo pacote

- Um tema por pacote. Se crescer, divide; o que sobrar vai para o próximo pacote da mesma fase e não segura a publicação.
- Regra de jogo fica na engine pura e muda o resultado antes dos pontos, com determinismo por seed e decisões.
- A partir da v0.19, todo campo novo no save entra com migração. Antes dela, campo novo precisa de valor padrão para saves antigos.
- Entrega: `npm test`, `npm run build` e Playwright; subir a versão; riscar os itens no roadmap; atualizar o handoff; publicar e conferir o HTML servido.
- Orçamento: `index.html` até 1 MB. Todo efeito visual respeita movimento reduzido; todo som respeita o mudo.
- Pacotes de engine que mexem em resultado passam por `calibracao.md` antes de publicar.

## Antes da fase 1

- **v0.14.2 — Revisão de termos (P, só texto).** Trocar inglês não adaptado e tradução literal nos textos de eventos, da engine e das telas. **Publicado em 2026-11-10 na v0.14.3**, commit `afa8de5`, [deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42938463916). 183 testes Node, build e 30 Playwright (Chrome) aprovados; `textos-eventos.md` gerado de novo. Falta a leitura frase a frase das telas. Trocas feitas: "skill" → habilidade; "performance" → desempenho; "nota de scouting" → avaliação dos olheiros; "overall" → nota geral; "stint" → trecho ou parada adiada; "slicks" → pneus de pista seca; "Pit agora" → "Parar agora", igualando com "Boxes" do rádio; "rival de karting" → rival do kart; "Circuito completo de mídia" → maratona de entrevistas; "Distensão na academia" → treino físico, para não confundir com academia de pilotos. Erros de sentido: em `duelo_rival`, "fecha a porta de Gasly e passa" descreve defesa numa ultrapassagem; em `safety_restart`, "Safety car entrando" e "pneus quentes" contradizem uma relargada. Mantidos por serem uso corrente no Brasil: box, grid, pole, paddock, kart, safety car, feedback, engenheiro de pista. A ferramenta `npm run events` imprime "Pundefined" em `chamada_estrategia` por faltar posição no contexto de exportação. **Pronto quando:** nenhum termo da lista aparece em texto visível e `textos-eventos.md` foi gerado de novo.

- **v0.14.3 — Modo corrida, primeira arrumação (P, só interface).** **Publicado em 2026-11-10 na v0.14.3**, commit `afa8de5`, [deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42938463916). Botão Desfazer removido a pedido do usuário (decisão tomada não volta). Durante uma decisão de corrida a tela mostra só pista, torre, decisão e carro: ficha, meta da temporada, desenvolvimento dos carros e históricos voltam entre as etapas. No desktop o painel repetido do GP sai durante a corrida. No celular o cabeçalho ficou em duas linhas, a faixa Kart–F1 some na corrida e o painel do GP fica compacto. Medido com um save de teste: página de corrida de 2.710 para 1.303 px no desktop; primeira opção de 914 para 587 px no celular (a segunda ainda pede rolagem). 183 testes Node, build e 30 Playwright (Chrome). **Falta:** modo paddock com abas, ficha em página larga, opções fixas no rodapé do celular.

- **Critério de termos revisto em 2026-11-11.** A pedido do usuário, voltaram "stint", "slicks", "Networking de academias" e "surfar o mercado", trocados na v0.14.2 ou na v0.14.4: são de uso comum no Brasil. Continuam trocados "skill", "performance", "scouting", "overall", "Pit agora" e "Karting"; critério em `DECISIONS.md`.
- **v0.14.4 — Correções da carreira jogada (P).** **Publicado em 2026-11-11 na v0.14.4**, commit `ab770cc`, [deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43112338908). Dez correções vindas de `achados-jogada.md`: variável interna na tela, narração que adiantava o resultado dos pneus, texto de teste fechado, etiquetas contraditórias nas ofertas, números do legado, decimais e plurais, painel de simulação que fechava, opção dominada em "Forçar o ritmo" e termos em inglês restantes. O ajuste do chassi do kart foi revertido por deslocar a taxa de títulos; ver o documento. 183 testes Node, build e 30 Playwright (Chrome).
- **v0.14.5 — Modo paddock (M, só interface).** **Publicado em 2026-11-11 na v0.14.5**, commit `8ccc7fd`, [deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43115122912). Fora da corrida a decisão vem primeiro e a cena da etapa anterior desce, rotulada "Etapa anterior"; a cena só fica no topo durante a corrida ou enquanto a bandeirada é exibida. Abas Paddock, Piloto e Campeonato fora da corrida: no desktop o Paddock mantém as três colunas, Piloto abre a ficha em página larga e Campeonato abre tabela, meta e históricos; em tela estreita cada aba mostra só o seu recorte (página do Paddock de cerca de 4.900 para 2.200 px num save de teste). Meta da temporada, desenvolvimento e históricos saíram da coluna central para a lateral. "Acompanhar etapa" no topo do plano (444 px no desktop, 533 px no celular). No celular, decisões de duas opções ficam lado a lado e presas ao rodapé. Com a cena em movimento, a decisão de corrida só aparece ao fim do trecho ou ao pular a animação. A nota de estratégia deixou de aparecer antes da janela de box (a v0.14.4 mostrava um texto provisório que ficava repetido na narração). 183 testes Node, build e 32 Playwright (Chrome), com teste novo das abas. Resolve os achados 3 e 9 a 12. **Limites:** decisões de três opções não ficam presas no celular; a espera da cena foi conferida por teste, não por olho em tempo real; "Perfil de pilotagem" continua recolhido na ficha larga.

- **v0.14.6 — Continuar depois da bandeirada (P, só interface).** **Publicado em 2026-11-11 na v0.14.6**, commit `ade8f95`, [deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43117287482). Conferido no site em celular emulado: depois da bandeirada o botão aparece no pódio e leva ao plano da próxima etapa, com "Acompanhar etapa" a 533 px. Vindo do teste da v0.14.5 no site: depois da bandeirada o pódio ganha o botão "Continuar", que redesenha a tela com o plano da próxima etapa no topo; o espaço vazio acima da cena sumiu. 183 testes Node, build e 34 Playwright (Chrome), com teste novo. Abertos do mesmo teste: achados 37 a 42 em `achados-jogada.md`.

- **v0.14.7 — Pendências da carreira jogada (P).** Publicado em 2026-11-11 (commit `c39b4d3`, [deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43131728577); HTML servido com 0.14.7 e os textos novos). Limites: captura do celular para T4 não feita; 183 Node, 34 Playwright e build aprovados. Ver tabela em `exec-v0.14.7.md`. Doze tarefas de texto e cena, sem mudança de regra nem de save, especificadas em `exec-v0.14.7.md`: etiqueta da cena, plano só depois da bandeirada, evento "Pelotão embolado", ordem no celular, pista equilibrada, rádio que explica, aviso de confiança curto, kart, ano da temporada, GP de casa, composto na parada e `aria-pressed`.

## Fase 1 — Entre corridas

| Pacote | Nome | Tamanho | Tipo |
|---|---|---|---|
| v0.15 | Caixa de entrada | M | Interface, pouca engine |
| v0.16 | Companheiro e título | M | Interface, pouca engine |
| v0.17 | Números da carreira | M | Interface |
| v0.18 | Primeira corrida | P–M | Interface |

- **v0.15 — Caixa de entrada.** Especificação pronta para executar em `exec-v0.15.md` (aba Mensagens derivada do estado, nota da corrida como campo opcional, manchete; sem migração de save e sem sorteio novo). Caixa de entrada com propostas, recados do chefe, notícias e convites; nota de 1 a 10 por corrida e piloto do dia; manchete em vitórias, títulos e transferências; "enquanto você esteve fora" e avisos de marco. **Pronto quando:** toda bandeirada gera pelo menos uma mensagem nova e uma nota.
- **v0.16 — Companheiro e título.** Duelo com o companheiro; briefing antes da largada; conta do título e a parte que falta de metas e tensão (D.5); perfil da equipe atual e do companheiro na ficha (D.17); talento visível e troca dos quatro contadores (R.16). **Pronto quando:** em qualquer etapa o jogador vê o placar contra o companheiro e o que precisa para a meta ou o título.
- **v0.17 — Números da carreira.** Página da equipe; gráfico da temporada e evolução ano a ano (2.2); linha do tempo; radar de atributos; recordes do mundo; estatísticas completas (2.1); companheiros de base (2.3); GP de casa; histórico navegável da base; bandeira nas tabelas de equipes (D.7). **Pronto quando:** toda estatística que a engine já guarda tem uma tela.
- **v0.18 — Primeira corrida.** Tutorial na primeira corrida, com o engenheiro explicando cada decisão uma vez; glossário de F1 em dicas. **Pronto quando:** alguém que não acompanha F1 termina a primeira etapa sem ajuda externa.

## Fase 2 — Alicerce

| Pacote | Nome | Tamanho | Tipo |
|---|---|---|---|
| v0.19 | Save seguro | M | Infraestrutura |
| v0.20 | Motor e acesso | M–G | Infraestrutura |

- **v0.19 — Save seguro.** Migração de saves (B.7); captura de erros (B.9); aviso de duas abas no mesmo save; pedido de armazenamento persistente; pipeline único de publicação (F.14); ajustador automático de calibração, que propõe valores de configuração a partir das simulações. **Pronto quando:** um save da v0.14 abre migrado e um erro chega sem o jogador copiar relatório.
- **v0.20 — Motor e acesso.** Web Worker para a simulação; teste de desempenho em carreira longa e celular fraco (F.17); mais testes de regressão das fórmulas; separação dos textos do código (primeira metade do F.18), com glossário de termos adotados e teste que barra os termos vetados; atalhos de teclado; acessibilidade além da cor; fontes hospedadas (B.6, R.9); README para jogadores e changelog (B.13). **Pronto quando:** simular uma temporada não trava a tela e o jogo é jogável só com teclado.

## Fase 3 — Transmissão

| Pacote | Nome | Tamanho | Tipo |
|---|---|---|---|
| v0.21 | Som de corrida | M | Interface |
| v0.22 | Câmera de TV | G | Interface |
| v0.23 | Gráficos de transmissão | M–G | Interface |
| v0.24 | Pista viva | G | Interface, pouca engine |

- **v0.21 — Som de corrida.** Som sintetizado para luzes, motor, batida e torcida (D.15, 2.8); rádio completo com bip de fechamento, chiado e filtro, tocando também na narração. **Pronto quando:** uma corrida inteira tem som do apagar das luzes à bandeirada, e o mudo cala tudo.
- **v0.22 — Câmera de TV.** Mapa em perspectiva seguindo o carro com zoom; carro com forma, luz de freio e de chuva; traçados suavizados; número e rótulos; destaque do rival da decisão; carros devagar na pausa. Cena em canvas só se o SVG não sustentar. **Pronto quando:** a cena roda fluida em celular intermediário com o grid completo.
- **v0.23 — Gráficos de transmissão.** Faixa com nome; barra de distância no duelo; volante do piloto; pneus vistos de cima; telemetria ilustrativa; barra de progresso; ícones na narração; narrativa que falta (D.4); gráfico de posições, melhores momentos, replay em câmera lenta e modo foto. **Pronto quando:** antes de cada decisão a tela mostra o dado que a justifica.
- **v0.24 — Pista viva.** Pit lane; entorno da pista; corrida noturna; clima vivo; borracha e marcas; partículas; classificação animada; transições entre telas; tela sempre ligada e tela cheia; radar de chuva; reflexo nas luzes de largada (*engine*, como faixa de decisão). **Pronto quando:** duas pistas diferentes são reconhecíveis sem ler o nome.

## Fase 4 — Volta a volta

Pacotes de engine. Enquanto a calibração não fecha, o modelo novo roda em paralelo nos testes e o jogo publicado segue no modelo por fases.

| Pacote | Nome | Tamanho | Tipo |
|---|---|---|---|
| v0.25 | Volta a volta I: ritmo | G+ | Engine |
| v0.26 | Volta a volta II: pneus e box | G+ | Engine |
| v0.27 | Fim de semana completo | G | Engine e interface |

- **v0.25 — Ritmo.** Tempo por volta para cada carro (5.5); diferenças em segundos na torre; decisões abertas em voltas específicas; destino dos saves no meio de uma corrida antiga; replay por seed e decisões. **Pronto quando:** a taxa de títulos e a distribuição de resultados ficam dentro das faixas de `calibracao.md`.
- **v0.26 — Pneus e box.** Desgaste e composto de todos os carros, paradas dos rivais (5.6); safety car compactando o pelotão; meteorologia dinâmica (5.3); acerto simples por pista; bateria ou modo de ataque; duelo roda a roda (5.7). **Pronto quando:** duas estratégias diferentes produzem corridas visivelmente diferentes na torre.
- **v0.27 — Fim de semana completo.** Q1, Q2 e Q3 com eliminação e sprint (5.2); punições, limites de pista e investigações (5.4); confiabilidade por componente (4.7); câmera onboard nos momentos-chave e volta fantasma; fecha D.2 e a calibração da largada (D.2.b). **Pronto quando:** um fim de semana tem treino, classificação em três partes e corrida, todos com decisão.

## Fase 5 — Paddock

| Pacote | Nome | Tamanho | Tipo |
|---|---|---|---|
| v0.28 | Contrato | G | Engine |
| v0.29 | Relações | G | Engine |
| v0.30 | Mercado | M–G | Engine |

- **v0.28 — Contrato.** Contratos com status de 1º ou 2º piloto, duração, multa, salário e bônus (3.7); empresário; dinheiro e patrocínio pessoal; capacete e número fixos, com a tela própria de criação (R.8); ofertas com estrelas (R.7) e os itens de "Entrada no kart por propostas". **Pronto quando:** recusar a melhor equipe pode ser a escolha certa por causa das cláusulas.
- **v0.29 — Relações.** Rival persistente (3.1, 3.2); entrevistas; reputação por equipe, paddock e torcida; promessa pública; moral e confiança (3.5); relação com o engenheiro; direção do carro; rivais que aprendem o padrão de decisões do jogador; gatilhos por histórico e convites com conflito de calendário; efeito do perfil da equipe nos eventos (D.17). **Pronto quando:** a caixa de entrada cita fatos da própria carreira do jogador.
- **v0.30 — Mercado.** Mercado, parte 2 (D.8); silly season (D.14); notícias e rumores (3.8); pedir uma equipe específica (2.4); equipes-satélite (3.3); academias de verdade (3.4). **Pronto quando:** no meio do ano o jogador já sabe quais vagas vão abrir.

## Fase 6 — Mundo e base

| Pacote | Nome | Tamanho | Tipo |
|---|---|---|---|
| v0.31 | Sem beco sem saída | M–G | Engine |
| v0.32 | Base viva | G | Engine |
| v0.33 | Mundo de 2026 | G | Dados e engine |

- **v0.31 — Sem beco sem saída.** Rotas alternativas em versão leve (3.11, B.12); seletor de dificuldade (F.10); superlicença por pontos. **Pronto quando:** a parcela de carreiras em "Fim da linha" cai dos cerca de 9% atuais para perto de zero.
- **v0.32 — Base viva.** Mini calendário na base (D.3); pilotos reais na F2 e F3; salto excepcional F4–F2; evolução dos carros da base no save; nacionalidade nos rivais de base (D.7, D.12); revisão da idade mínima da F2 (D.10). **Pronto quando:** cada ano de base tem de três a cinco corridas com decisão.
- **v0.33 — Mundo de 2026.** Grid real de 2026 e campeões na retrospectiva; pacotes da F1 ao longo do calendário; orçamento seguindo o sucesso (3.6); calendário de 22 etapas; dinastia máxima abaixo de 9; agenda entre corridas, lesões e testes de pré-temporada. **Pronto quando:** uma carreira nova começa no grid real e a dinastia fica dentro do alvo da calibração.

## Reta final

| Pacote | Nome | Tamanho | Tipo |
|---|---|---|---|
| v0.34 | Voltar e mostrar | M | Interface |
| v0.35 | Modos | M–G | Engine e interface |
| v0.36 | App | M–G | Infraestrutura |
| v1.0 | Lançamento | M | Só revisão |

- **v0.34 — Voltar e mostrar.** Desafio da semana por seed e ranking local (F.12, 2.5); resultado em emojis; cartão em imagem; retrospectiva de fim de carreira; conquistas e hall da fama (F.16). **Pronto quando:** um resultado colado num grupo traz alguém novo para jogar a mesma corrida.
- **v0.35 — Modos.** Ponto de virada da temporada com opção de rejogar; cenários prontos; mundo persistente depois de aposentar. **Pronto quando:** terminar uma carreira oferece um motivo concreto para começar outra.
- **v0.36 — App.** PWA e modo offline (F.15), conferindo o service worker contra a CSP; tradução (segunda metade do F.18); 3D leve sem biblioteca para garagem, capacete e pódio. **Pronto quando:** o jogo instala, abre sem rede e troca de idioma.
- **v1.0 — Lançamento.** Nenhum recurso novo. Carreira completa em aparelhos reais (B.11); pendências de segurança e conta (S.5 a S.9); marca e domínio (R.11); origem e licença do áudio do rádio; leitura final dos textos pelo usuário (1.3); cartão no WhatsApp (B.3). **Pronto quando:** a lista "Agora" do roadmap está vazia e uma carreira inteira roda sem erro em iOS, Android e desktop.

## Depois da 1.0

"Talvez" e "Arquivo" do roadmap. Modo fictício (B.14) é obrigatório antes de qualquer monetização.
