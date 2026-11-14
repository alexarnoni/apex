# Bandeirada: histórico de versões

Este documento junta, em um lugar só, o que cada versão do jogo trouxe. Ele reúne o que estava espalhado nos outros `.md` do projeto (README, roadmap, specs, segurança e Worker) e no histórico do git.

**Sobre a numeração.** O jogo ainda não tinha versões numeradas. Os números abaixo (v0.1 a v0.9.2) são marcos que agrupam os commits por assunto, escolhidos na hora de escrever este documento. Eles **não** são a `ENGINE_VERSION` (que é o formato do save e continua em 1; ver "Compatibilidade de saves"). A partir de v0.10.0, o pacote tem versão explícita no package.json e na página inicial; os marcos anteriores continuam agrupamentos retrospectivos.

**Endereço:** https://bandeirada.alexarnoni.com · **Repositório:** `alexarnoni/apex` · **Deploy:** automático a cada push na `main` (GitHub Pages).

---

## Resumo em uma tabela

| Versão | Marco | Data | Publicada |
|---|---|---|---|
| v0.1 | Protótipo do motor e do mundo (então "Apex") | antes do git | não |
| v0.2 | Engine, carreira do jogador, UI e eventos jogáveis | 2026-11-07 | sim |
| v0.3 | "Funcional": seed, desfazer, salvar, simular, feedback, hospedagem | 2026-11-07 | sim |
| v0.4 | Nível 1: habilidade e potencial, ajuda, resumo, vantagens e riscos, acessibilidade, equipes reais | 2026-11-07 | sim |
| v0.5 | Beta público: Bandeirada, domínio, feedback por e-mail, segurança | 2026-11-07 | sim |
| v0.6 | Interface viva: tema escuro, ficha com medidor, textos para leigos | 2026-11-07 | sim |
| v0.7 | Mundo e corrida: pistas, bandeiras, simulação corrigida, realismo do campeão | 2026-11-07 | sim |
| v0.8 | Criação e ficha: idade, nacionalidade, estatísticas por categoria, traçado das pistas | 2026-11-07/08 | sim |
| v0.9 | Corrida em momentos, declínio previsível, veteranos, nomes por país e mercado | 2026-11-08 | sim (commit `4b9add0`) |
| v0.9.1 | Talento de berço e dedicação no lugar do corte de potencial | 2026-11-08 | sim (commit `f35795c`) |
| v0.9.2 | Perfil da equipe nas ofertas: pressão x desenvolvimento | 2026-11-08 | sim (commit `659b46a`) |
| v0.10.0 | Ritmo contextual, planos, metas, história da temporada e nova página inicial | 2026-11-08 | sim; código `36bc86f` |
| v0.11.0 | Seis atributos, treino direcionado, reservas e mercado preservado | 2026-11-08 | implementação validada; publicação em HANDOFF |

---

## v0.1: protótipo do motor e do mundo

*Antes do git; validado em simuladores interativos.*

- Motor de corrida único para todas as categorias (`engine/race.js`): classificação mais corrida, com `carWeight` por categoria.
- Mundo da F1 vivo (`engine/world.js`): desenvolvimento de carros com risco, viradas de regulamento, pilotos que envelhecem, aposentam e são substituídos por novatos gerados.
- Calibração por `npm run balance`: 8 a 13 campeões distintos por era de 25 anos, dinastias de 3 a 5 títulos (máx < 9), idade média do campeão entre 26 e 30.
- Decisões de design fechadas (ver `README.md`): simulação 100% no cliente, a base é prólogo e a F1 é o jogo, subir é por oferta, estilos mexem na variância, nomes reais estruturados como dados.

## v0.2: engine, carreira do jogador, UI e eventos jogáveis

*Commit `0091994`, 2026-11-07.*

- Loop do jogador (`engine/game.js`): criação, base resumida (kart, F4, F3, F2) com uma decisão por temporada, ofertas de subida por nota de scouting, academia, F1 com foco de temporada, abordagem por corrida, ordens de equipe, contratos, aposentadoria e legado.
- Eventos narrativos e de corrida declarativos (`engine/events.js`, `data/events.js`): 19 narrativos e 9 de corrida.
- Equipes de base com nomes reais (`data/baseTeams.js`).
- UI em um único HTML gerado por esbuild (`ui/`, `tools/build-ui.js`).
- Base técnica: RNG com seed, transições imutáveis, `ENGINE_VERSION`, contrato de `pendingDecision`, testes com `node:test`.

## v0.3: "Funcional"

*Commits `d97890a`, `4ac6bb8`, `e195d67`, `3394d02`, `2b05dbb`, 2026-11-07.*

- Seed na tela, versão no save e relatório de erro copiável, desfazer (até 30 passos).
- Salvar em 3 slots no navegador, exportar e importar arquivo `.json`.
- Motivos na tela (nota de scouting, status, ofertas) e controles de velocidade (simular 5 corridas e o resto da temporada).
- Formulário de feedback com o resumo da carreira.
- Publicação no GitHub Pages por GitHub Actions.

## v0.4: Nível 1

*Commits `f6d6dfa`, `0b43677`, 2026-11-07.*

- Habilidade e potencial do jogador na tela (o potencial exato fica escondido; só uma faixa de 10 pontos).
- Ajuda com 12 verbetes, resumo de uma frase por corrida, cartões de oferta com vantagens e riscos.
- Acessibilidade e mobile (foco por tela, leitor de tela, 375 px sem estouro).
- Eventos novos (8 narrativos e 2 de corrida) e equipes reais conferidas (F2 e F3 batem com os grids de 2026).
- Passada de redação nos 28 textos de eventos (`docs/textos-eventos.md`; ainda aguarda a sua revisão, item 1.3).

## v0.5: beta público

*Commits `aae5e7f`, `9fe3a50`, `65f878b`, `ada4591`, `8936f88`, 2026-11-07.*

- **Marca:** o jogo deixa de ser "Apex" (preto e amarelo, que lembrava a equipe do filme) e vira **Bandeirada**, com paleta roxa, logotipo quadriculado, favicon e cartão de compartilhamento.
- **Publicação:** domínio `bandeirada.alexarnoni.com` com HTTPS obrigatório (o endereço antigo redireciona), análise opcional com GoatCounter, licença "todos os direitos reservados", aviso de projeto de fã e painel de privacidade.
- **Layout em três colunas** (ficha, decisão, painel da temporada), com a decisão primeiro no celular.
- **Feedback por e-mail:** botão flutuante, nota de 1 a 5 no fim da carreira e Worker da Cloudflare (`worker/`) que valida origem, tamanho e campos e envia o e-mail.
- **Segurança:** Content-Security-Policy por hash, Actions fixadas por SHA, Dependabot, CI em pull requests, `SECURITY.md` e `security.txt`.

## v0.6: interface viva

*Commits `9acbf78`, `26e39dc`, `a62a978`, `3813276`, `e8018b4`, `20bf221`, 2026-11-07.*

- Correção do logotipo e do favicon (vírgula decimal no SVG), com testes de regressão.
- Tema Auto, Claro e Escuro, cores mais vivas, filete roxo e faixa quadriculada.
- Ficha com atributos: medidor circular de **Habilidade** (antes "Nível"), **Potencial** (antes "Teto estimado"), Margem, Fama em texto e Estilo.
- Abas "Tabela" e "Etapas", "Sala de troféus".

## v0.7: mundo e corrida

*Commits `6eb6ea7`, `72c00f2`, `ca6b3a7`, `d892cbd`, 2026-11-07.*

- **Calendário da F1** com 24 pistas reais (nome, local, chance de chuva) e traços que mexem na corrida (rua, potência, técnica). O calendário real de 2026 caiu para 22 etapas; o jogo mantém 24.
- **Bandeiras em SVG** (flag-icons, MIT) na ficha, nas pistas e na lista de etapas.
- **Simulação de corridas corrigida:** resolve eventos sozinha com a opção cautelosa e conta o que decidiu.
- **Textos sem jargão** ("pp" virou palavras).
- **Realismo do campeão:** o nível do grid deixou de cair com os anos (novatos melhores) e equipes de orçamento baixo ganham menos títulos; peso do carro na F1 de 0,75 para 0,60 e teto de potencial do jogador de 84 para 88.

## v0.8: criação e ficha

*Commits `eed6d45`, `3166570`, 2026-11-07 e 2026-11-08.*

- **Idade inicial escolhida (12 a 16)** e idade mínima por categoria: F4 15, F3 16, F1 18 (confirmadas); F2 17 é convenção do jogo. Não há idade máxima oficial em nenhuma categoria, então a idade alta só pesa na nota dos olheiros.
- **Nacionalidade** com 255 países (bandeira dentro da caixa) e nomes em português pelo navegador.
- **Estatísticas por categoria** na ficha (kart, F4, F3, F2, F1).
- **Traçado das 24 pistas** no cartão da etapa (projeto f1-circuits, MIT).

## v0.9: corrida em momentos, declínio e mercado

*Commit `4b9add0`, 2026-11-08; 137 testes passando.* O ajuste de calibração `25af201` baixou o corte de potencial na entrada da F1 de 88 para 87 (88 deixava 22% das carreiras passivas com título; 87 dá 15%).

### v0.9.1: talento de berço e dedicação

*Commit `f35795c`, 2026-11-08; 137 testes passando.*

- O corte fixo de potencial na entrada da F1 (87) foi **removido**.
- **Talento de berço:** o potencial do jogador é sorteado na criação numa curva em sino (média 85,5, poucos geracionais acima de 95), com um pequeno bônus por começar cedo.
- **Dedicação:** cada escolha de treino (base e F1) eleva o teto do jogador em 0,30, com rendimento decrescente. Quem treina muito pode virar um talento geracional.
- Medido (300 carreiras por política): quem nunca treina chega à F1 em 94% e ganha título em 5%; quem treina todo ano na F1 chega em 88% e ganha título em 20%; quem sempre treina (base e F1) chega em 85% e ganha título em 26%.
- Dois testes ficaram menos frágeis: nem toda semente chega mais à F1.

- **Corrida em momentos:**
  - Tela de **classificação** com o grid de largada, previsão de chuva, traços da pista e **estratégia de pneus** (aposta de 1 ou 2 posições; a escolha padrão tem efeito médio zero).
  - **Final de corrida** (versão enxuta): quando há um rival à frente, atacar (±1 posição, conforme o ritmo) ou administrar.
  - **Relato da corrida** com largada, estratégia, evento, ordem de equipe, final e chegada, incluindo a **causa do abandono**.
  - O que falta para a versão completa está em `roadmap-ideias.md`, item D.2.
- **Declínio previsível do seu piloto:** curva fixa por idade, com início por estilo e atenuada por "Treinar"; a ficha mostra a previsão.
- **Veteranos:** declínio mais gentil, "ano bom" de veterano, elite que se aposenta mais tarde, mercado sem a penalidade exagerada de idade e limite de 47 anos. Resultado: veteranos de 38+ voltam ao grid e às vezes brigam lá em cima, como Alonso e Hamilton.
- **Nomes por país:** todo piloto tem nacionalidade; os gerados têm nome "I. Sobrenome" (24 países), com bandeira nas tabelas.
- **Mercado de pilotos:** lealdade ao time, equipes irmãs (Red Bull e Racing Bulls, Ferrari e Haas, Mercedes e Williams), duas estrelas só em carro top 2, renovação por força do carro e resumo "Mercado de pilotos" na pré-temporada.

---

### v0.9.2: perfil da equipe nas ofertas

*Commit `659b46a`, 2026-11-08; 148 testes passando.*

- As ofertas de subida e de contrato mostram o **perfil da equipe**: ponta (muita pressão, desenvolve rápido se você for bem), meio (pouca pressão, desenvolvimento normal) e fundo (sem pressão, desenvolvimento lento, mais visibilidade a quem se destaca num carro fraco).
- **Pressão:** só cobrança; ficar abaixo do esperado para o carro custa nota de scouting na base e confiança na F1.
- **Desenvolvimento:** acelera ou freia o crescimento de habilidade e o ganho de teto por treino (nunca o declínio).
- Para manter a taxa de títulos, a média do talento de berço baixou de 85,5 para 84,5. Medido (400 carreiras): nunca treina 5% de títulos, política mista 20%.

## v0.10.0 — ritmo e propósito

Pacote implementado em 2026-11-08, código `36bc86f`. Plano persistente, avanço contextual, recomendação da equipe, metas na F1, painel de temporada e criação acima dos saves com laterais no desktop. **167 testes Node e 18 de navegador aprovados**; detalhes, compatibilidade e evidências em [`v0.10.md`](v0.10.md). Publicação vinculada ao workflow da integração na main.

## Compatibilidade de saves

### Alterações após v0.9.2 (publicadas em `007b831`)

- **2026-11-08 — D.2.a:** final de corrida com defesa contra o perseguidor. Disputar pode preservar a posição ou custar até duas por erro; ceder perde uma sem disputa. Prioridade de defesa depende do ritmo relativo; companheiros e abandonos não são selecionados como perseguidores elegíveis.
- A simulação automática escolhe ceder quando há decisão de defesa. As medições históricas de dificuldade não foram refeitas para esse comportamento.
- Decisões antigas sem `mode` continuam sendo de ataque; `ENGINE_VERSION` permanece 1.
- **2026-11-08 — D.2.b:** nova decisão `race_start` após a estratégia: atacar na primeira curva ou largar com margem. O ataque pode render uma posição, custar uma ou causar contato; chuva e pista de rua aumentam risco. Na pole há apenas a opção com margem. Abandono na largada tem causa específica e encerra o relato ali. Simulação e políticas de calibração usam `hold`.
- Verificado após ambos os incrementos: **158 testes e build local**. Sem novo número oficial de release. Commit/push `007b831` e [deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42520319063). As novas decisões são aditivas; saves em eventos posteriores continuam do ponto salvo.

- **Validação da interface (2026-11-08):** adicionada suite Playwright com 10 testes de desktop/celular passando, CI configurado, aviso acessível de importação e faixa de feedback no celular para evitar cobrir escolhas. Guia em `testes-interface.md`. Publicado em `007b831`.

### Formato e dados antigos

- `ENGINE_VERSION` está em **1** desde o início; um save de outra versão não é carregado/importado, com aviso (não implica apagar automaticamente o arquivo ou slot). Nada mudou esse número até agora, porque as mudanças foram aditivas.
- Carreiras salvas antes de cada versão continuam abrindo, com estas diferenças:
  - **v0.7 e v0.8:** a decisão pendente guarda o texto e o cartão da pista daquela época (textos antigos, bandeira em emoji, que a tela converte em imagem); a tabela "Por categoria" só tem os totais da base.
  - **v0.7:** um evento de corrida já pendente não tem a opção cautelosa (`safe`), então a simulação para nele uma vez.
  - **v0.9.2:** carreiras salvas ganham o perfil na próxima troca de temporada ou de equipe; as ofertas que já estavam na tela (decisão pendente) não mostram o perfil.
  - **v0.9.1:** o potencial já salvo do jogador continua o antigo (que era cortado em 87 na F1) e só sobe com o treino daqui para frente; carreiras novas nascem com o talento sorteado.
  - **v0.9:** pilotos já gerados mantêm os nomes antigos ("Almeida II") e sem nacionalidade; os novos seguem o formato "I. Sobrenome". O declínio do seu piloto passa a valer no próximo envelhecimento.

## Onde está cada coisa (documentos reunidos)

| Documento | O que contém |
|---|---|
| `docs/DECISIONS.md` | Decisões estáveis e armadilhas. |
| `docs/contexto-agentes.md` | Rotina enxuta e contexto global/projeto. |
| `AGENTS.md` | Instruções curtas para agentes. |
| `docs/INDEX.md` | Entrada e mapa dos documentos. |
| `docs/HANDOFF.md` | Estado confirmado, limites e próximo trabalho. |
| `README.md` | Decisões de design, estrutura do código, como rodar, critérios de balanceamento, diário de calibração, publicação. |
| `docs/roadmap-ideias.md` | Tudo que falta, por importância, e o registro item a item do que foi feito (níveis 1 a 5, funcional, beta, segurança, identidade, dinamismo). |
| `docs/spec-loop-jogador.md` | O loop da carreira do jogador. |
| `docs/spec-sistemas.md` | Sistemas (academias, satélites, contratos). |
| `docs/spec-conteudo.md` | Conteúdo e eventos. |
| `docs/spec-piloto1-piloto2.md` | Status de piloto 1 e 2 e ordens de equipe. |
| `docs/spec-backend.md` | O backend de ranking planejado (FastAPI e Postgres). |
| `docs/textos-eventos.md` | Os 28 textos de eventos para revisão (gerado por `npm run events`). |
| `SECURITY.md` | Como relatar uma vulnerabilidade e o que há para proteger. |
| `worker/README.md` | Como publicar e configurar o Worker de feedback. |
| `docs/testes-interface.md` | Suite Playwright, execução, cobertura e limites. |
| `docs/calibracao.md` | Como medir e calibrar os números do jogo (ferramentas em `tools/calibrate/`), metas, decisões e armadilhas. |

Os documentos originais continuam onde estavam; este arquivo só resume e aponta para eles.

## v0.11.0: perfis e mercado vivo

Detalhes em [v0.11.md](v0.11.md). 178 testes Node e 22 de navegador. ENGINE_VERSION 1, atributos inferidos em saves antigos, sem reconstruir pilotos anteriormente apagados. Mercado preserva livres e reservas; transferência mantém grid completo.

## v0.15: caixa de entrada

Publicada como 0.15.0 em `123eabe`. A primeira tentativa (`b4079da`) falhou no CI por causa da barra de abas em fonte larga; a correção está no mesmo lançamento.

Aba **Mensagens** derivada do estado (`engine/inbox.js`): cartas do careerLog, uma mensagem por corrida, marcos da temporada (primeira vitória, pódio ou pontos), movimentações de mercado no início da temporada e manchete da última corrida. A nota da corrida (`engine/rating.js`, de 1 a 10) entra como campo opcional `rating` em cada corrida. Mensagens lidas ficam no `localStorage` por slot e seed. Saves antigos continuam abrindo: sem `rating` a corrida aparece só com o GP. Para a manchete de "supera o companheiro", a corrida também grava `teammateGrid`, opcional. ENGINE_VERSION 1 sem mudança. 194 testes Node e 38 de navegador.

## v0.18.0 (não publicada): pneus como estado

Campo opcional novo em `season.cur.tyre` (`compound`, `condition`, `wearFactor`, `fit`) e `season.cur.tyreLog`; lidos com valor padrão (condição 70, sem composto) quando faltam. Nova resposta `pit_soft` na janela de box. ENGINE_VERSION 1 sem mudança; saves antigos continuam abrindo (uma corrida em andamento nesse save segue sem pneu simulado). Corridas passam a sair diferentes das versões anteriores com a mesma seed.
