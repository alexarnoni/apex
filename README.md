# Apex

Jogo de carreira de Fórmula 1 no navegador, inspirado no F1 Glory: do karting à glória, com um mundo fictício vivo a partir do grid 2026 real.

## Decisões de design (fechadas)

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
  game.js         máquina de estados e API da UI: createCareer / advance / applyDecision / getView
data/      ponto de partida do mundo e parâmetros por categoria
tools/     balance.js: simulação em massa com os critérios de validação
tests/     node:test, sem dependências
ui/        por enquanto só um console de debug; a UI real é a próxima fase
```

## Rodar

```bash
npm test          # testes da engine
npm run balance   # distribuições de validação (campeões distintos, dinastias, idades...)
npm run dev       # serve ui/ e prova a engine no navegador
```

## Critérios de mundo crível (o que `npm run balance` verifica)

- **8-13 campeões distintos por era de 25 anos** (F1 real: 2000-2024=8, 1990-2014=12, 1975-1999=14; o alvo original de 5-8 era mais concentrado que qualquer janela histórica real)
- Dinastias de 3-5 títulos existem e morrem, quase sempre em virada de regulamento; **máximo < 9** (recorde real: 5, Schumacher)
- Idade média do campeão entre 26 e 30; campeão com 38+ é raridade
- Campeões gerados (✦) dominam a segunda metade da era
- Jogador médio no 1º ano de kart fica no meio da tabela; título de cara é possível, não comum

## Roadmap

1. ~~Protótipo do motor e do mundo~~ (validado em simuladores interativos)
2. **Agora:** engine consolidada + balanceamento via `tools/balance.js`
3. Loop do jogador: criação -> base resumida -> F1 (decisões de fim de semana, foco de temporada, contratos) -> aposentadoria e legado
4. UI real (Cloudflare Pages) + eventos narrativos, lesões, rivalidades, rotas alternativas
5. Backend de ranking (FastAPI + Postgres na Oracle VM) + compartilhamento

## Diário de balanceamento

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

## Publicar o jogo (GitHub Pages)

`npm run build` gera `dist/index.html` (o jogo inteiro em um arquivo). O workflow [.github/workflows/pages.yml](.github/workflows/pages.yml) roda os testes, constrói e publica a cada push na `main`.

1. Criar o repositório e enviar o código (Pages gratuito exige repositório **público**, então o código fica visível):
   ```bash
   gh repo create apex --public --source . --push
   ```
2. No GitHub: Settings > Pages > Source: **GitHub Actions** (só na primeira vez).
3. O jogo fica em `https://<usuario>.github.io/apex/`. O botão "Enviar pelo GitHub" do formulário de feedback abre uma issue nesse repositório (o workflow define `APEX_FEEDBACK_URL`).

Alternativa: Cloudflare Pages com build `npm run build` e pasta de saída `dist`. Para testar o botão de envio localmente: `APEX_FEEDBACK_URL=https://github.com/usuario/apex/issues/new npm run build`.

## Dívidas de design anotadas

- Piloto 1 / piloto 2 e ordens de equipe
- Rotas alternativas (Super Fórmula, IndyCar, FE) como tabela leve que regenera scouting
- Moral/confiança da equipe como modulador invisível de ofertas e desenvolvimento
- Orçamento de equipe seguindo lentamente o sucesso (com piso)
- Modo fictício (arquivo de substituição de nomes)

## Invariante de arquitetura (aprendido no balanceamento)

Qualquer mecânica que altere o resultado de uma corrida (ordens de equipe, punições da FIA, safety car, etc.) **deve ser aplicada antes da premiação**, nunca depois. O `simWeekend` retorna apenas a ordem de chegada bruta; os pontos são atribuídos em `runSeason` a partir da ordem final pós-modificações. Violar essa regra produz bugs silenciosos onde o log mostra a troca mas o campeonato ignora.
