# Bandeirada

Jogo de carreira de Fórmula 1 no navegador, inspirado no F1 Glory: da largada à bandeirada, com um mundo fictício vivo a partir do grid 2026 real.

## Retomar o projeto

Leia [`docs/INDEX.md`](docs/INDEX.md) para encontrar os documentos e [`docs/HANDOFF.md`](docs/HANDOFF.md) para o estado confirmado e o próximo trabalho. Regras para agentes em [`AGENTS.md`](AGENTS.md). Consulte somente as referências necessárias. Decisões estáveis: [`docs/DECISIONS.md`](docs/DECISIONS.md); organização global/projeto: [`docs/contexto-agentes.md`](docs/contexto-agentes.md).

## Decisões de design vigentes

- **Arquitetura:** simulação 100% no cliente, save em localStorage com export/import. Backend mínimo (FastAPI + Postgres) só para ranking e compartilhamento, adicionado na fase 4.
- **A base é prólogo, a F1 é o jogo.** Karting, F4, F3 e F2 rodam em modo resumido: uma decisão por temporada, botão de simular, leque de ofertas. 3-5 minutos até a F1. Sem economia de dinheiro; academia é status binário.
- **Subir é por oferta, nunca automático.** Nota de scouting = resultado + bônus por carro fraco + fama + academia - pressão de idade.
- **Mundo vivo na F1:** desenvolvimento de carro com risco (pacotes podem piorar o carro), viradas de regulamento a cada 5 anos que embaralham parcialmente o grid, pilotos envelhecem/aposentam, novatos gerados disputam assentos.
- **Estilos mexem em variância, não só em média:** agressivo = picos e abandonos; técnico = chuva, evolução e ajuda no desenvolvimento; consistente = pontua sempre.
- **3-4 rivais persistentes** acompanham o jogador desde o kart (o resto dos grids de base é descartável).
- **Nomes reais por enquanto**, estruturados como dados (`data/world2026.js`) para que um modo fictício seja só outro arquivo.

## Estrutura

```
engine/    módulos puros, isomórficos (Node + navegador), sem dependências
  config.js       TODAS as constantes de balanceamento (regra: nenhum número mágico fora daqui)
  rng.js          RNG com seed (carreiras reproduzíveis/compartilháveis)
  race.js         motor de corrida (quali + corrida), único para todas as categorias
  season.js       temporada completa de qualquer categoria
  development.js  desenvolvimento de carro com risco + viradas de regulamento
  drivers.js      envelhecimento, aposentadoria, geração de novatos
  market.js       mercado de assentos da F1 + scouting da base
  world.js        orquestra um ano da F1 (dev -> temporada -> virada de ano)
  career.js       carreira do jogador na base (temporadas resumidas + ofertas)
  f1.js           F1 do jogador: foco, fim de semana, ordens, ofertas/contrato, legado
  strategy.js     pneus e duelos finais de ataque/defesa
  start.js        escolha de largada e risco de toque
  profile.js      pressão e desenvolvimento por perfil de equipe
  season-goals.js objetivos e resumo da temporada
  race-policy.js  recomendações e relevância das decisões
  advance-races.js avanço por etapas ou até decisão importante
  game.js         máquina de estados e API da UI: createCareer / advance / applyDecision / getView
data/      ponto de partida do mundo e parâmetros por categoria
tools/     balance.js: simulação em massa com os critérios de validação
tests/     node:test, sem dependências
ui/        interface do jogo: app.js (telas), shell.html (CSS e tokens, tema claro/escuro),
           saves.js (3 slots), feedback.js; o build junta tudo em dist/index.html
worker/    Worker da Cloudflare que recebe o feedback e envia por e-mail
```

## Rodar

```bash
npm test          # testes da engine
npm run balance   # distribuições de validação (campeões distintos, dinastias, idades...)
npm run build     # gera dist/index.html e assets
npm run serve     # serve dist/ em http://127.0.0.1:5056
npm run dev       # constrói e serve dist/ via npx serve
npm run test:ui   # Chromium isolado em desktop/celular; instalar navegador antes
```

Guia da suite de navegador, instalação e limites: [`docs/testes-interface.md`](docs/testes-interface.md). São 18 testes de navegador, separados dos 167 testes Node, incluindo carreira inteira pela interface. Os workflows de PR e publicação estão configurados para executar ambos.

## Critérios de mundo crível (o que `npm run balance` verifica)

- **8-13 campeões distintos por era de 25 anos** (F1 real: 2000-2024=8, 1990-2014=12, 1975-1999=14; o alvo original de 5-8 era mais concentrado que qualquer janela histórica real)
- Dinastias de 3-5 títulos existem e morrem, quase sempre em virada de regulamento; **máximo < 9** (recorde real: 5, Schumacher)
- Idade média do campeão entre 26 e 30; campeão com 38+ é raridade
- Campeões gerados (✦) dominam a segunda metade da era
- Jogador médio no 1º ano de kart fica no meio da tabela; título de cara é possível, não comum

## Calibração e ferramentas de medição

Quem for mexer nos números do jogo deve ler [`docs/calibracao.md`](docs/calibracao.md): como rodar as ferramentas de `tools/calibrate/` (`npm run calibrate:player`, `calibrate:champions`, `calibrate:veterans`, `calibrate:age`, `calibrate:pace`), as metas atuais, as decisões tomadas e as armadilhas (ruído estatístico, comparar as duas pontas, ablação).

## Versões do jogo

O histórico de versões (o que cada marco trouxe, compatibilidade de saves e onde está cada documento) fica em [`docs/versoes.md`](docs/versoes.md). O que falta, por ordem de importância, fica em [`docs/roadmap-ideias.md`](docs/roadmap-ideias.md).

## Roadmap atual

Engine, loop de carreira, UI pública, eventos, saves e feedback já estão implementados. Versão do pacote: **v0.10.0**, com plano persistente, objetivos e avanço contextual da F1. Mudanças e limites em [`docs/v0.10.md`](docs/v0.10.md).

Próximos candidatos: rotas alternativas jogáveis (incluindo WEC/NASCAR, pedido recente), mercado/silly season, mini calendário da base e sons. Corrida por fases continua planejada, sem acrescentar decisões repetidas. A ordem será definida na conversa. Ranking e compartilhamento com backend ficam para depois. O site atual usa **GitHub Pages**, com um Worker separado para feedback.

## Alterações publicadas após v0.9.2 (`007b831`)

**D.2.a — defesa no final da corrida:** implementada, testada e publicada em 2026-11-08. O jogador pode disputar com o perseguidor ou ceder a posição; ritmo relativo afeta a defesa e o relato registra o resultado antes dos pontos. A decisão de **largada (D.2.b)** também foi publicada: atacar na primeira curva ou largar com margem, com risco influenciado por chuva e pista de rua. Verificações atuais: **158 testes e build aprovados**. Métricas históricas de calibração não foram refeitas após essa alteração.

## Diário de balanceamento

Registro histórico: pendências e números de cada sessão refletem aquela etapa, não necessariamente o estado atual. Consulte `docs/calibracao.md` e o resumo do roadmap para a configuração vigente.

**Sessão 1 (estado inicial):**
- Kart calibrado: posição média 11.7/20, ofertas 24% top / 39% mid / 37% sem oferta. Dentro do alvo.
- Idade média do campeão 27.3, zero campeões 38+, grid renova (60% dos títulos com pilotos gerados). Dentro do alvo.
- Campeões distintos travado em ~14 (alvo original 5-8). Diagnóstico: não é compressão de carro, não é troca entre companheiros. É a mecânica de piloto 1/piloto 2 + ordens de equipe que faltava.

**Sessão 2 (spec-piloto1-piloto2 + balanceamento extenso):**
- Implementados: status p1/p2/equal, ordens de equipe, retenção de elite, renormalização de carro (âncora de média), carryoverPerf do campeão reinante, consecutiveTitles retirement.
- Bug crítico resolvido: simWeekend premiava pontos antes das ordens de equipe — troca era cosmética. Fix: premiação movida para runSeason, após todos os swaps.
- Diagnóstico de alvo: o alvo original de 5-8 campeões distintos estava errado. Contagem real da F1: 2000-2024=8, 1990-2014=12, 1975-1999=14. Faixa histórica real é **8-13**. Simulação em ~12 está dentro.
- Roubo do p2 ajustado para < 30% (era < 25%): após consecutiveTitles o dominante aposenta mais cedo e o p2 herda o carro bom — fenômeno real (Rosberg 2016, Button 2009). Não é bug, é textura. Não tentar "corrigir" de volta para 25% sem revisar este diário.

**Estado final do balanceamento (spec-piloto1-piloto2 encerrada):**
| Métrica | Resultado | Alvo |
|---|---|---|
| Campeões distintos/25 anos | ~12 | 8-13 ✅ |
| Dinastia média | ~4.0 | 3-5 ✅ |
| Dinastia máxima | 7-8 | < 9 ✅ |
| Idade média campeão | ~28 | 26-30 ✅ |
| Campeões 38+ | 0% | < 5% ✅ |
| Roubo do p2 | ~27% | < 30% ✅ |
| Desvio padrão carros | ~8.7 | 4-9 ✅ |

Próximo: spec-loop-jogador. Balanceamento fino a partir de dados de jogo real, não estatística de era.

**Sessão 3 (loop do jogador, fatia base -> oferta de F1, `engine/game.js`):**
- Com política fixa (sempre A, sempre sobe) o jogador chegava à F4 com skill ~10 abaixo dos NPCs e só 68% chegavam à F1; nenhum caminho em 8 decisões.
- Fix: `base.playerGrowthRate` fecha 6% do gap até o potencial por ano na base. Medido em 600 seeds: 91% chegam à F1, idade média na entrada 20.8, mediana 10 decisões, caminho de 8 existe (~1%). Kart intacto (11.5/20 de posição média no 1º ano).
- Taxas testadas: 0.04 (90%, 21.2 anos), 0.10 (98%, 20.2), 0.20 (99.8%, 19.6, fácil demais). Só dados de jogo real devem mexer nisso de novo.
- Saída por idade (`altRouteOverAge`): sem ela, jogador sem oferta ficava preso na base para sempre.
- Pendente: F1 do jogador (F1_PRE_TEMPORADA em diante) e rotas alternativas.

**Sessão 4 (F1 do jogador: `engine/f1.js` + passos separados em `season.js`/`world.js`):**
- `runSeason`/`advanceYear` foram fatiados (`startRace`, `applyTeamOrders`, `awardRace`, `summarizeSeason`, `beginYear`, `endYear`) para o jogador correr uma etapa por vez. Verificado: testes antigos intactos e `npm run balance` idêntico ao diário acima (11.9 campeões, dinastia 4.0/máx 7, idade 28.0, p2 26%).
- Fluxo: `season_focus` -> 1 `weekend_approach` por corrida (+ `team_order` só quando o jogador é p2 à frente do p1; ordem a favor é automática) -> `F1_FIM_TEMPORADA` -> `advance()` -> `retire_or_continue` (30+) -> `offer_pick` -> `contract_terms` -> próxima temporada, até `LEGADO`.
- Medição com política passiva (sempre `balanced`, `train`, renova): **sem teto**, 57-60% das carreiras ganhavam título (média 2.2). Alavanca: potencial do jogador (88-100) vs gerados (72-85). Com `f1.entry.potentialCap`: 90 -> 47%, 86 -> 37%, 82 -> 16%.
- Escolhido **84**, 250 seeds: 91% chegam à F1; 24% com título (9% com 2+), 64% com vitória, 56% com pódio, posição média 11.1, 15 temporadas, nota média ~2900. É piso (política passiva); quem decide bem deve ir melhor. Só dados de jogo real devem mexer nisso de novo.
- Ainda fora: eventos narrativos e `race_event` (spec-conteudo), rotas alternativas, rival_reencontro.

**Sessão 5 (UI jogável + equipes reais na base):**
- `npm run build` gera `dist/apex.html` (um arquivo, engine embutida). `ui/app.js` só apresenta e coleta decisões.
- `data/baseTeams.js`: equipes reais de kart, F4, F3 e F2 (2 carros cada; `strength` vira carro via `carSpread`). Vínculos de academia são aproximação de jogo (Prema–Ferrari, DAMS–Alpine).
- Ofertas de subida são equipes concretas (3 no tier `top`, 2 no `mid`, + a ligada à academia); na F2 as ofertas são equipes reais de F1. O carro do jogador é o da equipe escolhida, não mais sorteio por tier.
- Recalibração com 600 seeds (política fixa): 93% chegam à F1, idade média 21.1, caminho de 8 decisões existe; kart 11.6/20. Ofertas de F4 no kart: top 10% / mid 55% / nenhuma 35% (antes 24/39/37, mesma fatia total de ~65% com oferta).
- Ainda sem equipe de base nos rivais/histórico (rivais não mostram equipe) e sem equipe-satélite na entrada da F1.

**Sessão 6 (eventos narrativos, spec-conteudo):**
- `data/events.js` (11 narrativos + 7 de corrida, rascunho de texto em pt-BR para revisar) + `engine/events.js` (motor genérico, efeitos declarativos validados por nome). Decisões novas: `story_event` (narrativo) e `race_event`.
- Gatilhos: `season_start` (antes do desenvolvimento, para `devBonus` chegar a tempo), `mid_season`, `season_end`, e 1 evento por corrida (+ ordem de equipe = no máximo 2 interrupções).
- Desvios da spec: `rival_reencontro` ficou de fora (não há rival persistente na F1); o "rival do ano" é o piloto de skill mais próxima fora a equipe; efeitos de corrida reordenam o resultado depois da simulação (determinístico, mas não é ajuste de performance antes da ordenação); `story_event` não está na lista de tipos da spec-loop-jogador.
- Medido em 100 carreiras (política passiva): 63% das corridas quietas (alvo ~60%; `raceEventChance` 0.54 + intervalo de 4 corridas por evento, porque sem ele `pneu_aposta` e `chamada_estrategia` dominavam). Todos os efeitos têm teste unitário; todo evento tem condição provadamente satisfazível em teste. Em simulação, `contrato_vazado` e `fia_polemica_titulo` não dispararam (política passiva não assina cláusula de saída nem chega perto do título); o critério "<3% das temporadas" da fia_polemica passa com folga mas foi medido em 0%, então vale revisar com jogo real.

**Sessão 7 (2026-11-07 e 08: realismo, corrida em momentos e talento). O detalhe de cada item está em `docs/roadmap-ideias.md` e o resumo por versão em `docs/versoes.md`.**
- **Realismo do campeão (medido em 150 mundos de 25 anos):** o nível do grid caía com os anos (campeão com habilidade média 93 nos anos 1-7 e 83 nos anos 15-25). Ajustes: novatos melhores (`rookies`: habilidade 70-82, potencial 78-92, 15% de estrelas), regulamento com `carryWeight` 0.30, `budgetWeight` 0.45 e `lotteryWeight` 0.25 (equipes de orçamento baixo ganhavam 11% dos títulos, hoje 6-8%) e `carWeight` da F1 de 0.75 para 0.60.
- **Veteranos:** a curva `ageCurve` ganhou a faixa 34-36 (-1.4 a -0.2), `veteranGoodYear` (30% de "ano bom" a partir dos 34), `retirePerYear` 0.035, `retireEliteFactor` 0.45 acima de 86 de habilidade, `retireHardAge` 47 e o mercado sem a penalidade de idade exagerada (`agePenaltyStart` 34, `keepMaxAge` 42). Resultado: campeão com 35+ anos em 8% das temporadas e 0,67 piloto de 38+ por temporada (antes 0,18). Balanceamento do mundo: 10.7-10.9 campeões por era, dinastia média 4.3, máx 8.
- **Mercado:** `seatFit` (lealdade 4, equipe irmã 3, duas estrelas só em carro top 2), renovação por força do carro (`reSignBest` 0.65, `reSignWorst` 0.38) e `world.lastMoves` para o resumo da pré-temporada.
- **Jogador:** declínio fixo (`playerDecline`: começa aos 30/31/32 por estilo, de -0.5 a -1.8 por ano, "Treinar" corta 35%). O corte de potencial na entrada da F1 (`potentialCap` 84, 88 e 87, descrito na sessão 4) foi **removido** e substituído por `CONFIG.talent`: potencial de berço sorteado (média 85.5, desvio 4.5) e treino que o eleva (`trainGain` 0.30 com rendimento decrescente). Medição com política passiva (300 carreiras por política): nunca treina 94% chegam à F1 e 5% ganham título; treina todo ano na F1 88% e 20%; sempre treina 85% e 26%.
- **Corrida:** decisões novas `race_strategy` (estratégia de pneus, aposta de 1 ou 2 posições com média zero na escolha padrão) e `race_finale` (atacar o rival à frente ou administrar, ±1 posição conforme o ritmo), relato por corrida (`race.story`) com a causa do abandono, e 24 pistas com traços (`CONFIG.tracks`) e chuva por pista. A simulação automática usa sempre a opção segura. Em `tests/`, 137 testes.
- **Perfil da equipe (D.17):** CONFIG.teamProfile (ponta 1.15 / meio 1.0 / fundo 0.85 de desenvolvimento; pressão 1.0 / 0.5 / 0; visibilidade do fundo 1.4), engine/profile.js (perfil por posição do carro, esperado = 2 x posição + 1, cobrança de nota na base e de confiança na F1, bônus da ponta só se corresponder ao esperado). Primeira versão com bônus positivo de pressão e expectativa menor tirou ofertas da base (sem oferta 44%) e subiu os títulos (mista 27%); a versão final ficou em sem oferta 38% e mista 20% / nunca treina 5% com o talento médio em 84,5.
- **Ferramentas de medição:** os rascunhos foram substituídos por scripts portáveis versionados em `tools/calibrate/`; comandos e limitações em `docs/calibracao.md`.

## Publicar o jogo (GitHub Pages)

**No ar:** https://bandeirada.alexarnoni.com (o endereço antigo `alexarnoni.github.io/apex` redireciona para ele; publica sozinho a cada push na `main`).

`npm run build` gera `dist/index.html` (o jogo inteiro em um arquivo). O workflow [.github/workflows/pages.yml](.github/workflows/pages.yml) roda os testes, constrói e publica a cada push na `main`.

1. Criar o repositório e enviar o código (Pages gratuito exige repositório **público**, então o código fica visível):
   ```bash
   gh repo create apex --public --source . --push
   ```
2. No GitHub: Settings > Pages > Source: **GitHub Actions** (só na primeira vez).
3. O jogo fica em `https://bandeirada.alexarnoni.com` (o endereço antigo `alexarnoni.github.io/apex` redireciona). O feedback do jogo vai pelo Worker (`BANDEIRADA_FEEDBACK_ENDPOINT`) para o e-mail do autor; `BANDEIRADA_FEEDBACK_URL` abre uma issue como alternativa.

Alternativa: Cloudflare Pages com build `npm run build` e pasta de saída `dist`. Para testar o botão de envio localmente: `BANDEIRADA_FEEDBACK_URL=https://github.com/usuario/apex/issues/new npm run build`.

### Endereço próprio e análise de uso (beta)

> **Feito em 2026-11-07:** CNAME criado, domínio ligado no GitHub Pages, certificado aprovado e HTTPS obrigatório. Os passos 1 a 3 abaixo ficam como registro de como foi feito; falta só a análise de uso (passo 4).

Endereço escolhido: **https://bandeirada.alexarnoni.com** (o domínio `alexarnoni.com` está na Cloudflare, e o site pessoal não roda no GitHub Pages, por isso um subdomínio e não `/apex`).

1. **DNS (você, na Cloudflare):** Dashboard > `alexarnoni.com` > DNS > Records > Add record: tipo `CNAME`, nome `bandeirada`, destino `alexarnoni.github.io`, proxy **somente DNS** (nuvem cinza) até o GitHub emitir o HTTPS.
2. **GitHub (comandos):**
   ```bash
   gh api -X PUT repos/alexarnoni/apex/pages -f cname=bandeirada.alexarnoni.com
   gh variable set BANDEIRADA_SITE_URL --body https://bandeirada.alexarnoni.com
   ```
3. Quando o certificado estiver emitido (minutos até cerca de 1 hora):
   ```bash
   gh api -X PUT repos/alexarnoni/apex/pages -F https_enforced=true
   gh workflow run "Publicar no GitHub Pages"
   ```
   `BANDEIRADA_SITE_URL` vira o `canonical` e o `og:url`/`og:image` do cartão de compartilhamento.
4. **Análise de uso (GoatCounter, sem cookies):** crie o site em goatcounter.com, escolha o código (a parte antes de `.goatcounter.com`) e rode `gh variable set BANDEIRADA_GOATCOUNTER --body <codigo>` e o `gh workflow run` acima. Sem a variável, nenhuma análise é carregada. Marcos enviados: `carreira-iniciada`, `chegou-na-f1`, `carreira-terminada-*`, `fim-da-linha-na-base`, `ajuda-aberta`, `feedback-aberto`, `save-exportado`. Nunca vão nome, seed ou dados da carreira.
5. Para testar localmente: `BANDEIRADA_SITE_URL=https://bandeirada.alexarnoni.com BANDEIRADA_GOATCOUNTER=codigo npm run build`.

**Feedback por e-mail:** o botão flutuante "Feedback" e o cartão de fim de carreira enviam para um Worker da Cloudflare (`worker/`), que manda um e-mail para a caixa do autor sem exigir conta do jogador. Publicado e ligado ao jogo (passo a passo para refazer em [worker/README.md](worker/README.md)); o endereço do Worker entra como `BANDEIRADA_FEEDBACK_ENDPOINT`. Sem ele, o jogo só oferece "Copiar".

**Segurança:** site estático com Content-Security-Policy por hash (`tools/site-head.js`), Actions fixadas por SHA, Dependabot e relato privado de vulnerabilidade ([SECURITY.md](SECURITY.md)). Pendências e decisões em [docs/roadmap-ideias.md](docs/roadmap-ideias.md), seção "Segurança".

**Licença:** todos os direitos reservados ([LICENSE](LICENSE)); o código é público para consulta. A Bandeirada é um projeto de fã, sem vínculo com a F1, a FIA ou as equipes; o jogo mostra esse aviso no rodapé e no painel "Sobre e privacidade". Antes de qualquer monetização, trocar os nomes reais (modo fictício, roadmap 3.10).
## Dívidas de design anotadas

- Piloto 1 / piloto 2 e ordens de equipe: implementados; melhorias de contexto ficam no roadmap.
- Rotas alternativas (Super Fórmula, IndyCar, FE) como tabela leve que regenera scouting
- Moral/confiança da equipe como modulador invisível de ofertas e desenvolvimento
- Orçamento de equipe seguindo lentamente o sucesso (com piso)
- Modo fictício (arquivo de substituição de nomes)

## Invariante de arquitetura (aprendido no balanceamento)

Qualquer mecânica que altere o resultado de uma corrida (ordens de equipe, punições da FIA, safety car, etc.) **deve ser aplicada antes da premiação**, nunca depois. O `simWeekend` retorna apenas a ordem de chegada bruta; os pontos são atribuídos em `runSeason` a partir da ordem final pós-modificações. Violar essa regra produz bugs silenciosos onde o log mostra a troca mas o campeonato ignora.
