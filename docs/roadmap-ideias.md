# Bandeirada: ideias e melhorias, do mais fácil ao mais difícil

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
| ~~F.9~~ | ~~Formulário de feedback com resumo da carreira, seed e texto~~ | M | 2 | ✅ **Feito (2026-11-07).** Botão "Feedback" na tela inicial e em toda tela de carreira: tipo (bug, balanceamento, ideia, outro), texto, opção de incluir seed, versão e últimas decisões (ou todas, para repetir o problema) e "Copiar feedback" (com campo de apoio se o navegador negar o clipboard). Com `BANDEIRADA_FEEDBACK_URL` no build, aparece também "Enviar pelo GitHub" (issue com título e corpo preenchidos, corpo cortado para caber na URL). Lógica em `ui/feedback.js`, testada. |
| F.10 | Seletor de dificuldade ou modo assistido | M | 2 | Ajusta potencial e frequência de eventos; exige recalibrar cada nível. |
| ~~F.11~~ | ~~Hospedagem fora do Artifact (Cloudflare Pages ou GitHub Pages)~~ | M | 2 | ✅ **Feito (2026-11-07).** Site público em **https://alexarnoni.github.io/apex/**, repositório público https://github.com/alexarnoni/apex. O workflow `.github/workflows/pages.yml` roda `npm test` (Node 22, Linux) e `npm run build` a cada push na `main` e publica sozinho; o botão "Enviar pelo GitHub" do feedback abre issue nesse repositório. O Artifact antigo continua no ar, mas a versão pública é a do GitHub Pages. |
| F.12 | Desafio diário (uma seed por dia) e ranking local dos amigos | M | 3 | Funciona sem backend, com o resumo copiado. |
| F.13 | Teste automático da interface no `npm test` | M | 3 | O percurso completo clicando foi feito à mão; automatizar pega quebras na UI antes de publicar. |
| F.14 | Pipeline único de publicação (`npm run release`) | M | 3 | Roda testes e balanceamento, constrói e publica; evita publicar versão quebrada. |
| F.15 | PWA e modo offline | M | 3 | O jogo todo já roda no cliente. |
| F.16 | Conquistas e hall da fama local | M | 3 | Dá objetivo a quem já ganhou um título. |
| F.17 | Teste de desempenho em carreira longa e celular fraco | M | 3 | Cada transição clona o estado inteiro; medir antes de o mundo crescer. |
| F.18 | Tradução (i18n): separar os textos do código | M-G | 4 | Mais barato fazer antes de o volume de texto crescer. |

## Beta público e profissional (transversal)

O que separa "amigos testando" de um beta público com cara profissional. O jogo roda todo no navegador, então o site é estático (CDN, custo zero, muita gente jogando ao mesmo tempo não pesa); servidor só entra com ranking e compartilhamento (4.1). Ordenado do mais fácil ao mais difícil.

| # | Item | Esforço | Notas |
|---|---|---|---|
| ~~B.1~~ | ~~Aviso de projeto de fã e painel "Sobre e privacidade"~~ | P | ✅ **Feito (2026-11-07).** Rodapé em toda tela e painel com aviso (sem vínculo com a F1, a FIA, equipes e pilotos), privacidade (save só no navegador, análise sem cookies se ativada, Google Fonts vê o IP) e link do código. |
| ~~B.2~~ | ~~LICENSE~~ | P | ✅ **Feito (2026-11-07).** Todos os direitos reservados (decisão sua), em português e inglês; `package.json` com `UNLICENSED`. Mantém a porta aberta para monetizar e dá para abrir depois. |
| ~~B.3~~ | ~~Favicon, descrição e cartão de compartilhamento~~ | P | ✅ **Feito (2026-11-07), a confirmar no ar.** Título, descrição, ícone, `canonical`, `og:*` e `twitter:*` no cabeçalho do site (`tools/site-head.js`, testado) e imagem 1200×630 em `ui/assets/og.jpg`. Falta ver o cartão aparecendo de verdade no WhatsApp depois do deploy: os raspadores guardam cache e eu não consigo testá-los daqui. |
| ~~B.4~~ | ~~Domínio `bandeirada.alexarnoni.com`~~ | P | ✅ **Feito (2026-11-07).** CNAME `bandeirada` → `alexarnoni.github.io` (proxy desligado), domínio ligado no Pages, certificado aprovado, HTTPS obrigatório. Verificado no ar: título, `canonical`, `og:image` e `og.jpg` já usam o endereço novo; `alexarnoni.github.io/apex` e `http://` redirecionam (301) para o HTTPS novo. |
| B.5 | Análise de uso (GoatCounter) | P | **Preparado, falta você.** Script por variável (`BANDEIRADA_GOATCOUNTER`) e marcos da carreira (`chegou-na-f1`, `carreira-terminada-*` e outros) já no jogo e testados com um contador de mentira. Falta criar a conta/site no goatcounter.com e gravar o código na variável. Grátis para uso não comercial. |
| B.6 | Fontes hospedadas no próprio site (sai o Google Fonts) | P-M | Evita expor o IP do visitante ao Google e acelera o primeiro carregamento. Exige baixar os arquivos das fontes (Barlow, Barlow Condensed, IBM Plex Mono, todas com licença livre). |
| B.7 | Migrar saves entre versões do jogo | M | Hoje, ao mudar o formato, o save antigo é descartado. Com muita gente jogando isso vira perda de carreira. Mínimo: avisar para exportar antes; ideal: migração por versão. |
| ~~B.8~~ | ~~Feedback sem conta no GitHub~~ | M | ✅ **Feito (2026-11-07).** Worker `bandeirada-feedback` publicado na Cloudflare e ligado ao jogo (`BANDEIRADA_FEEDBACK_ENDPOINT`). Testado no ar: origem errada e robô sem `Origin` recebem 403, o pré-voo CORS libera só o domínio do jogo, e um envio feito pelo próprio jogo em `bandeirada.alexarnoni.com` chegou na caixa de entrada, sem violação de CSP. Pendências do Worker: regra de Rate Limiting da Cloudflare (S.6) e decidir o subdomínio `workers.dev`, que hoje contém parte do e-mail pessoal. |
| B.9 | Captura automática de erros | M | Hoje um erro só chega se o jogador copiar o relatório. Opções: Sentry (plano gratuito) ou um envio próprio. |
| B.10 | Teste automático da interface no CI (F.13) | M | Percorre uma carreira clicando, em navegador de verdade, antes de cada deploy. |
| B.11 | Teste em aparelhos reais (iOS Safari, Android, Firefox) | M | Só foi testado em Chromium emulado. Cuidado com `localStorage` no modo privado do iOS. |
| B.12 | Rotas alternativas (3.11) | M-G | Cerca de 9% das carreiras caem em "Fim da linha". Para público de fora, é o maior beco sem saída. |
| B.13 | README para jogadores, changelog e canal da comunidade | M | O README atual é de quem desenvolve. Falta uma página "sobre o jogo", histórico de versões e um grupo (WhatsApp ou Discord) para o feedback. |
| B.14 | Modo fictício antes de qualquer monetização (3.10) | M | O jogo usa nomes e marcas reais. Isso é aceitável como projeto de fã sem fins lucrativos; com anúncios, venda ou assinatura o risco de notificação por marca e direito de imagem sobe muito. Troca de nomes é só trocar arquivos de dados. Também muda de plano no GoatCounter e na licença. |
| B.15 | Backend de ranking e compartilhamento (4.1) | G | Só aqui entra servidor (FastAPI + Postgres, atrás da Cloudflare, com limite de requisições e backup). A carga é pequena: um envio por carreira terminada. O risco real é fraude no ranking (replay no servidor, 4.3). |
| ~~B.16~~ | ~~Botão de feedback flutuante e janela de envio~~ | P | ✅ **Feito (2026-11-07).** Botão fixo no canto, em todas as telas; abre uma janela por cima (Esc e clique fora fecham, foco e leitor de tela tratados). O botão do cabeçalho foi removido. |
| ~~B.17~~ | ~~Pedir nota e comentário no fim da carreira~~ | P | ✅ **Feito (2026-11-07).** Cartão com nota de 1 a 5 e comentário opcional na tela de legado e na de fim da linha; leva o resumo da carreira se o jogador deixar marcado. |

## Segurança (2026-11-07)

O jogo é um site estático, sem conta de usuário nem cookies; a superfície de ataque é pequena. Medido: `npm audit` com 0 vulnerabilidades, nenhuma dependência de produção, varredura de segredos e proteção contra push de segredo ativas.

| # | Item | Estado |
|---|---|---|
| S.1 | Content-Security-Policy com hashes (script e estilo embutidos), sem `unsafe-inline` nem `unsafe-eval` em script | ✅ Feito. Gerada no build (`buildCsp`) e testada: os hashes batem com a página real. Conferido num navegador: carreira completa sem violações, e confirmado que bloqueia script injetado, script e imagem de fora, `fetch` externo e `eval`. |
| S.2 | GitHub Actions fixadas por SHA de commit | ✅ Feito. Os 5 SHAs foram conferidos contra as tags. O Dependabot propõe as atualizações. |
| S.3 | Dependabot (npm e Actions), alertas e correções automáticas, CI em pull requests | ✅ Feito. `dependabot.yml`, `ci.yml` (testa e constrói sem publicar). |
| S.4 | `SECURITY.md`, `security.txt` (RFC 9116) e relato privado de vulnerabilidade | ✅ Feito. O contato é o relato privado do GitHub, sem expor e-mail. |
| S.5 | Verificar o domínio no GitHub (evita sequestro do subdomínio) | Aberto, é com você: GitHub (conta) > Settings > Pages > Add a domain, e um registro TXT na Cloudflare. |
| S.6 | Worker de feedback: regra de Rate Limiting da Cloudflare e, se houver spam, Turnstile | Aberto. O limite por IP em memória é só a primeira barreira, e a checagem de origem não é segurança de verdade (qualquer cliente fora do navegador forja o cabeçalho). |
| S.7 | 2FA (de preferência passkey) no GitHub e na Cloudflare | Aberto, é com você. |
| S.8 | Cabeçalhos HTTP (HSTS, `X-Content-Type-Options`, `frame-ancestors`, `Referrer-Policy`) | Aberto. O GitHub Pages não deixa configurar; exige pôr a Cloudflare na frente (proxy ligado, SSL Full strict). |
| S.9 | E-mail pessoal nos commits públicos | Aberto, decisão sua. Passar a usar o e-mail "noreply" do GitHub nos próximos commits; o histórico só muda com reescrita e `force push`. |
| S.10 | Proteção da branch `main` | Opcional: com uma pessoa só e deploy por push, exigir PR atrapalha mais do que protege. |
## Identidade e redesenho: Bandeirada (2026-11-07)

O jogo se chamava Apex e usava preto com amarelo, que é a identidade da equipe fictícia do filme de F1. Passou a se chamar **Bandeirada** ("Da largada à bandeirada"), com uma identidade própria. O F1 Glory é só inspiração de estrutura de informação: layout, textos, ícones e logotipos de equipes não foram copiados.

| # | Item | Estado |
|---|---|---|
| R.1 | Nome Bandeirada e slogan "Da largada à bandeirada" | ✅ Feito. Nome internos antigos (`apex.slot`, `app: 'apex'`) ficaram de propósito, para não apagar saves existentes. |
| R.2 | Paleta roxo de cronometragem, tema claro e escuro | ✅ Feito. O roxo é a cor da volta mais rápida na telemetria; as cores das equipes aparecem só como dado (faixas e bolinhas). Em 2026-11-07 ganhou um botão de tema no cabeçalho (Auto, Claro, Escuro; Auto segue o sistema), salvo no navegador. |
| R.3 | Logotipo (bandeira quadriculada 4x3), favicon e cartão de compartilhamento | ✅ Feito. O cartão `ui/assets/og.jpg` foi refeito com a marca nova. |
| R.4 | Layout em 3 colunas no desktop (ficha, decisão, painel) e decisão primeiro no celular | ✅ Feito. Conferido a 375 px numa carreira inteira, sem estouro horizontal. |
| R.5 | Ficha do piloto: habilidade em destaque, dorsal, bandeira, estilo, idade, fama, equipe, GP, vitórias, pódios, poles, sala de troféus, contrato e confiança | ✅ Feito. A engine entrega os totais da carreira (`career`). |
| R.6 | Painel da temporada: abas Tabela e Etapas, pilotos e construtores, setas de variação | ✅ Feito. As abas se chamavam "Classificação" e "Corrida a corrida" (R.15 trocou). |
| R.7 | Ofertas com estrelas do carro e etiqueta curta de perfil (texto nosso) | Aberto. Hoje as ofertas têm vantagens e riscos. |
| R.8 | Tela de criação de piloto própria: número com prévia ao vivo, bandeiras em imagem com busca, estilos com arquétipos | Aberto. Exige baixar bandeiras em SVG (licença livre); aviso antes de baixar. |
| R.9 | Fontes hospedadas no próprio site (junto com B.6) | Aberto. |
| R.10 | Renomear o repositório do GitHub para `bandeirada` | Aberto, decisão sua: muda o endereço do Pages e os comandos do README. |
| R.11 | Conferir marca e domínio (INPI, Registro.br, Google e lojas de apps) | Aberto, é com você: não dá para verificar daqui. |
| R.12 | Logotipo e favicon com número inválido (`x="10,5"`) | ✅ Feito (2026-11-07). O PowerShell em pt-BR escreveu vírgula decimal e 9 dos 12 quadrados sumiram no ar. Corrigido, com testes de regressão no logotipo, no favicon e no build, e conferido no site publicado. |
| R.13 | Visual mais vivo: cartões arredondados com filete roxo, faixa quadriculada no topo, gradientes e brilho nos botões, cor por categoria na pirâmide, medalhas no top 3, selos verde e vermelho nas variações, contadores em quadradinhos | ✅ Feito (2026-11-07). Pedido: as primeiras cores ficaram "chapadas". A segunda rodada limpou o excesso (fundo neutro, ficha sem banner pesado) para ficar no espírito de um painel de jogo de gestão, sem copiar. |
| R.14 | Atributos do piloto em barras na ficha: Habilidade (com a faixa do Potencial marcada), Fama em texto (Desconhecido, Promessa, Conhecido, Famoso, Estrela, Lenda) e Estilo com explicação | ✅ Feito (2026-11-07). Nomes escolhidos por você: **Habilidade** (antes "Nível", o overall) e **Potencial** (antes "Teto estimado"). Os cortes da fama (2, 6, 12, 22, 35) são palpite e podem ser calibrados. |
| R.15 | Diferenciar do F1 Glory nos detalhes: "Vitrine" virou "Sala de troféus", abas viraram "Tabela" e "Etapas", e o quadrado do overall virou um medidor circular (anel da habilidade e arco fino do potencial) | ✅ Feito (2026-11-07). |
| R.16 | Trocar os quatro contadores (hoje GP, Vitórias, Pódios, Poles, na mesma ordem do F1 Glory), por exemplo para Largadas, Vitórias, Pódios e Voltas mais rápidas | Aberto. Era a sugestão 2 da diferenciação; ficou de fora por ora. |
| R.17 | Ficha em faixa horizontal no topo e duas colunas embaixo, em vez de três colunas | **Salvo para depois (ideia 4 da diferenciação).** Muda bastante o layout (R.4); fazer só se o resto não bastar para ter identidade própria. |
## Dinamismo: o jogo ficou repetitivo (2026-11-07)

Feedback de quem jogou: na F1 cada corrida é a mesma escolha de três botões (Arriscado, Equilibrado, Conservador, com efeito de ±2) e um resultado em uma linha; na base é uma decisão por temporada. Pedido: pistas com nome, F1 mais dinâmica e a base também. Ordem combinada: calendário com pistas, corrida em momentos (F1), mini calendário na base.

| # | Item | Estado |
|---|---|---|
| D.1 | Calendário da F1 com 24 pistas reais (`data/circuits.js`): nome do GP, local, bandeira, etiquetas e chance de chuva por pista | ✅ Feito (2026-11-07). Etiquetas mexem no motor (`CONFIG.tracks`): **rua** (largada vale mais, +2pp de abandono), **potência** (o carro pesa +0,04), **técnica** (o piloto pesa mais, −0,04). Chuva por pista, média ≈ 0,14 (antes 0,15 fixo). Balanceamento mantido (12,0 campeões por era, alvo 8–13). A UI mostra o cartão da pista antes de cada corrida, o nome do GP no título, na lista de etapas e no resultado. O calendário real de 2026 caiu para 22 etapas (sem Bahrein e Arábia Saudita); o jogo mantém as 24 originais. Sem mudar o formato do save. |
| D.2 | Corrida em momentos (F1): treino livre, classificação e corrida viram telas curtas com decisões de verdade (pneus, quando parar, atacar ou defender, chuva) | Aberto. Próximo. Precisa de um novo tipo de `pendingDecision` e de uma simulação da corrida em fases no motor. |
| D.3 | Mini calendário na base: 3 a 5 etapas-chave por temporada, com pista e uma decisão em cada | Aberto. Reaproveita D.1 e D.2 em versão curta; a base ainda não tem pistas. |
| D.4 | Narrativa da corrida: resumo do que aconteceu (largada, ultrapassagens, safety car, abandonos de rivais) em vez de uma linha | Aberto, sugestão minha; combina com D.2. |
| D.5 | Metas e tensão de temporada: objetivos da equipe, pressão do contrato, briga de título com o rival | Aberto, sugestão minha. |

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
