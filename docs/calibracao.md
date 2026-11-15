# Calibração do jogo: como medir e o que já foi decidido

Este guia é para quem for mexer nos números do jogo (você, outra pessoa ou outro agente de IA). Resume as ferramentas de medição que estão em `tools/calibrate/`, as metas atuais, as decisões já tomadas e as armadilhas que já custaram tempo.

**Regra do projeto:** nenhum número de balanceamento fora de `engine/config.js`. Mudou um número, rode as ferramentas abaixo e atualize `docs/roadmap-ideias.md` e o diário do `README.md`.

## Ferramentas

Todas rodam em Node, sem dependências, e usam só a API pública do jogo e o motor.

| Comando | O que mede | Tempo |
|---|---|---|
| `npm run balance` | O mundo da F1 em 200 x 25 temporadas (campeões distintos, dinastias, idade do campeão, p2 da equipe dominante) e a base (kart: posição média e distribuição de ofertas). É a ferramenta original (`tools/balance.js`). | ~2 min |
| `npm run calibrate:kart` | Triagem do bônus do chassi e comparação de carreiras completas com o treinador e com a configuração atual. Use `-- --screen` para medir só a primeira temporada. | Varia com os candidatos |
| `npm run calibrate:player -- --policy a --n 300` | Carreiras do jogador: % que chega à F1, % com ao menos um título, títulos e vitórias por carreira. | ~12 min por 300 |
| `npm run calibrate:champions -- --runs 120` | Realismo por época: habilidade do campeão, títulos de equipes de orçamento baixo, campeão com piloto fraco, dinastias. | ~3 min |
| `npm run calibrate:veterans -- --runs 120` | Veteranos: campeão com 35+ e 38+ anos, pilotos de 38+ no grid, veteranos no top 3 e top 5. | ~3 min |
| `npm run calibrate:age -- --n 150` | Carreiras por idade inicial (12 a 16) e se a idade mínima por categoria é respeitada (violações devem ser 0). | ~10 min |
| `npm run serve` | Servidor local do `dist/` (`http://127.0.0.1:5056`) para conferir a tela no navegador. Rode `npm run build` antes. | |

**Mudar um número só para a medição, sem editar a configuração:** `--set caminho=valor`, quantas vezes precisar. O valor é lido como JSON.

```bash
npm run calibrate:player -- --policy notrain --n 400 --set talent.mean=84.5
npm run calibrate:player -- --policy a --set teamProfile.ponta.development=1.1 --set category.f1.carWeight=0.6
npm run calibrate:champions -- --set regulation.lotteryWeight=0.25
```

Caminhos que começam com `category.` mudam `data/categories.js` (ex.: `category.f1.carWeight`); os outros mudam `engine/config.js`. Índices de lista funcionam (`lifecycle.ageCurve.5.min=-1.4`). Um caminho que não existe falha com erro, para não medir sem querer a configuração errada.

### Políticas do jogador (`--policy`)

- `a` (a histórica): escolha "A" na base, **treina todo ano na F1** e aceita sempre a primeira oferta (a melhor). É o extremo "dedicado".
- `train`: escolhe sempre a opção de treino na base e treina todo ano na F1. Abre mão do bônus de carro na base.
- `notrain`: nunca treina (base: opção sem treino; F1: foco "imagem"). É o extremo baixo.

Essas políticas servem como referências; um jogador real pode ficar fora desse intervalo. Quem decide bem as ofertas e eventos deve ir melhor que a política passiva, que sempre escolhe a primeira opção e a opção segura.

## Interpretação das medições

`calibrate:player` divide a taxa de chegada à F1 por todas as tentativas. Já a taxa de título, títulos, vitórias e temporadas por carreira usam apenas as carreiras que chegaram ao legado da F1. As porcentagens abaixo seguem esse denominador; não são a chance de título entre todos que começaram no kart.

As políticas são cenários de teste, não uma estimativa validada de comportamento humano. As metas são escolhas de design, não comprovação de realismo. Resultados registrados são de rodadas históricas; esta revisão documental não repetiu as medições.

## Metas atuais (2026-11-08)

| Medida | Meta | Última medição |
|---|---|---|
| Campeões distintos por era de 25 anos | 8 a 13 | 10,7 a 10,9 |
| Dinastia máxima (títulos seguidos) | < 9 | 8 |
| Idade média do campeão | 26 a 30 | 28,4 |
| Habilidade do campeão em qualquer época | ~90 | 93 (anos 1-7), 91 (8-14), 90,6 (15-25) |
| Títulos de equipes de orçamento ≤ 6 | 6 a 8% | 4 a 8% |
| Campeão com 35+ anos / 38+ anos | ~8% / 1 a 2% | 8% / 2% |
| Pilotos de 38+ por temporada no grid | ~0,6 | 0,67 |
| Base: sem oferta / ofertas boas (kart) | ~35% / ~10% | 38% / 13% |
| Carreiras do jogador com título, política `a` | ~15 a 20% | 20% |
| Carreiras do jogador com título, política `notrain` | ~5% | 5% |
| Chegam à F1, política `a` / `notrain` | ~85% / ~95% | 85% / 96% |

## Decisões já tomadas (e por quê)

- **Sem corte fixo de potencial na F1.** Antes havia `potentialCap` (84, 88, 87): um remendo que o jogador não entendia. Hoje o potencial é **talento de berço** sorteado na criação (`CONFIG.talent`: média 84,5, desvio 4,5) mais **dedicação** (cada escolha de treino eleva o teto em 0,30, com rendimento decrescente).
- **Peso do carro na F1 de 0,60** (era 0,75) e **regulamento com 0,45 de orçamento e 0,25 de sorteio** (era 0,25 e 0,55): sem isso equipes pequenas ganhavam 11% dos títulos.
- **Novatos melhores** (`rookies`: habilidade 70-82, potencial 78-92, 15% de estrelas): sem isso o nível do grid caía com os anos (campeão com habilidade 93 nos anos 1-7 e 83 nos anos 15-25).
- **Veteranos:** faixa 34-36 mais gentil, "ano bom" de veterano (30%), elite que se aposenta mais tarde, mercado sem a penalidade de idade exagerada e limite de 47 anos. O declínio do **jogador** é uma curva fixa (`playerDecline`), sem sorteio.
- **Perfil da equipe** (`CONFIG.teamProfile`): ponta (pressão 1,0, desenvolvimento 1,15 **só se corresponder ao esperado**), meio (0,5 e 1,0), fundo (0 e 0,85, mais visibilidade). A pressão **só cobra**: o bônus positivo por superar o esperado foi removido porque duplicava o prêmio do desenvolvimento. Esperado = 2 x posição do carro + 1.
- **Ataque no final:** administrar não muda posições. Na estratégia de pneus, a opção padrão seca tem encaixe zero; na chuva, a recomendação não é neutra. A **largada (D.2.b)** usa `hold` como padrão: não altera a ordem bruta nem consome sorteio nessa escolha; o relato deixou de inventar posição na primeira volta, o que altera a sequência global de RNG. A nova **defesa (D.2.a)** usa ceder como opção automática e perde uma posição: não presumir efeito zero ou reutilizar as taxas históricas de títulos como medição dessa versão local.

## Armadilhas (já custaram tempo)

1. **Ruído.** A ferramenta imprime uma estimativa de **um erro-padrão**, não um intervalo de confiança de 95%. O valor depende da taxa e de quantas carreiras chegaram à F1. Amostras pequenas ou zero sucessos tornam a aproximação frágil. Compare as mesmas sementes e reporte amostra, denominador e incerteza; diferenças de poucos pontos podem ser ruído.
2. **Compare sempre as duas pontas** (`notrain` e `a`). Uma mudança pode parecer boa numa política e inflar a outra (os perfis de equipe subiram `notrain` de 5% para 12% e `a` só de 20% para 24%).
3. **Ablação.** Quando um número sobe sem explicação, desligue as peças uma a uma com `--set` (por exemplo, pressão e visibilidade a zero) e meça de novo. Foi assim que se achou que o bônus positivo da pressão inflava os títulos.
4. **Mexer no sorteio muda tudo.** Qualquer mudança que consuma números aleatórios em outra ordem (nomes, eventos, estratégia) troca as carreiras de cada semente. Testes que dependem de uma semente específica ficam frágeis: prefira procurar entre várias sementes.
5. **O caminho "perfeito" da base** (8 decisões, quatro temporadas de campeão) é raríssimo (1 a 2 sementes em 500), e o teste dele usa 9.
6. **`-0` no JSON.** O save troca `-0` por `0`; o motor evita `-0` de propósito (`0 - x`, `|| 0`).
7. **PowerShell em pt-BR** escreve números com vírgula decimal e `Get-Content` lê UTF-8 como ANSI: ao gerar arquivos, use um script Node ou a ferramenta de edição, nunca `Get-Content | Set-Content` em arquivos com acento.

## Histórico das calibrações (resumido)

| Quando | O que mudou | Efeito medido |
|---|---|---|
| 2026-11-07 | Realismo do campeão (novatos, regulamento, `carWeight` 0,60) | Habilidade do campeão estável (~90), equipes pequenas 11% para 6-8%. |
| 2026-11-07 | Pistas com traços | Sem mudança relevante (12,0 campeões por era). |
| 2026-11-08 | Estratégia de pneus e final de corrida | Efeito médio zero (17% antes e depois com 900 carreiras). |
| 2026-11-08 | Veteranos e mercado | 38+ no grid de 0,18 para 0,67; campeão 35+ de ~1% para 8%. |
| 2026-11-08 | Talento de berço e dedicação (sem corte) | `notrain` 5%, `a` 20%, `train` 26%. |
| 2026-11-08 | Perfil da equipe | Primeira versão: `notrain` 12%, `a` 28%. Final (sem bônus positivo, talento 84,5): `notrain` 5%, `a` 20%. |

Os detalhes de cada item estão em `docs/roadmap-ideias.md`; o diário completo, em `README.md` (sessões 1 a 7).

## v0.10: comparação com a versão publicada

Medição em 2026-11-08, **sementes 1–120 por cenário**, código-base `007b831` e código v0.10 `36bc86f`. Política `a`: treina na F1; `notrain`: não treina. O roteiro das ferramentas aposenta a partir dos 34 anos. São cenários fixos, não uma estimativa de todos os jogadores.

| Cenário | Chegaram à F1 | Com título entre quem chegou | Títulos/car. F1 | Vitórias/car. F1 |
|---|---|---|---|---|
| `007b831`, política a | 100/120 | 17/100 (17%) | 0,47 | 7,5 |
| v0.10, a, `--driving legacy` | 100/120 | 17/100 (17%) | 0,47 | 7,5 |
| v0.10, a, `--driving team` | 100/120 | 22/100 (22%) | 0,57 | 11,2 |
| `007b831`, notrain | 115/120 | 6/115 (5,2%) | 0,10 | 2,0 |
| v0.10, notrain, legacy | 115/120 | 6/115 (5,2%) | 0,10 | 2,0 |
| v0.10, notrain, team | 115/120 | 5/115 (4,3%) | 0,06 | 1,6 |

Os agregados exibidos com a política antiga ficaram iguais aos da base. A política da equipe melhora decisões e pode mudar a dificuldade: a taxa a passou de 17% a 22%, enquanto notrain foi de 5,2% a 4,3%. Erros-padrão das taxas finais: aproximadamente **4,1 pp** e **1,9 pp**, respectivamente. Amostra insuficiente para afirmar equivalência, aumento significativo ou realismo; não foram alterados talento/potencial para forçar uma taxa-alvo.

```bash
npm run calibrate:player -- --policy a --n 120 --driving legacy
npm run calibrate:player -- --policy a --n 120 --driving team
npm run calibrate:player -- --policy notrain --n 120 --driving team
npm run calibrate:pace -- --n 30
```

`--driving legacy` continua padrão para preservar comparações históricas. `team` usa a recomendação da engine durante corridas; narrativa e decisões de carreira mantêm a política definida.

**Ritmo:** 30 sementes, 27 primeiras temporadas de F1 completas, 648 corridas. Passo a passo: 2528 entradas; roteiro contextual: 994 (**60,7% menos**). `tools/calibrate/pace.js` verifica que ambos chegam ao mesmo estado final com as mesmas escolhas. Não mede tempo humano nem diversão; não deve ser tratado como teste com usuários.

## v0.11 — atributos, mercado e reservas (2026-11-08)

Carreiras: 80 sementes (1–80) por política/versão, plano da equipe e aposentadoria padrão aos 34. A taxa de título usa apenas quem chegou à F1. Mudanças no consumo de RNG fazem a mesma semente produzir trajetórias diferentes.

| Versão e política | Chegou à F1 | Com título na F1 | Títulos / carreira F1 | Vitórias / carreira F1 | Temporadas F1 |
|---|---:|---:|---:|---:|---:|
| v0.10 a | 66/80 | 16/66 (24,2%) | 0,59 | 10,7 | 12,3 |
| v0.11 a | 73/80 | 15/73 (20,5%) | 0,59 | 13,4 | 12,6 |
| v0.10 notrain | 77/80 | 2/77 (2,6%) | 0,04 | 1,7 | 13,4 |
| v0.11 notrain | 76/80 | 4/76 (5,3%) | 0,05 | 2,4 | 13,4 |

Amostra pequena, especialmente para títulos sem treino; diferenças não provam equivalência nem mudança da taxa real. Nenhum ajuste no teto de potencial foi feito para obter estes resultados.

Mundo: `npm run balance` com 200 eras de 25 anos por semente 42/137/999; comparação com v0.10 (`7ec7fc9`).

| Medida | v0.10 (42/137/999) | v0.11 (42/137/999) |
|---|---|---|
| Campeões distintos | 10,8 / 10,7 / 10,9 | 10,5 / 10,8 / 10,5 |
| Maior dinastia, média | 4,3 / 4,4 / 4,3 | 4,4 / 4,4 / 4,3 |
| Maior dinastia observada | 8 / 8 / 8 | 9 / 8 / 9 |
| Idade média do campeão | 28,8 / 28,7 / 28,6 | 28,6 / 28,6 / 28,7 |
| Campeões 38+ | 3% / 2% / 2% | 2% / 2% / 2% |
| Campeões gerados | 56% / 56% / 56% | 57% / 58% / 57% |
| Desvio de força dos carros | 8,5 / 8,4 / 8,4 | 8,4 / 8,3 / 8,5 |
| Títulos roubados pelo P2 | 19% / 19% / 19% | 18% / 19% / 19% |
| Parcela modal em construtores | 57% / 58% / 57% | 57% / 58% / 59% |

O alvo de dinastia máxima < 9 falhou em duas sementes; a parcela modal não atingiu > 60%, como na referência. Kart (1.000 simulações): posição média 12,1/20 contra 11,6; ofertas top 8%, médias 49%, sem oferta 44% (arredondadas), contra 9%/54%/38%.

As notas iniciais por dimensão são escolhas de design. A média usa 20% classificação, 30% corrida, 15% consistência, 10% chuva, 15% pneus e 10% contribuição técnica. O ritmo de corrida usa pneus em 20% do componente do piloto; na chuva, 35% vem da competência de chuva. Ajustes futuros devem conferir também base e mercado, pois ambos passam a consumir as especialidades.

## v0.18 etapa A — pneus como estado (2026-11-13)

Medição: `node tools/calibrate/player.js --policy <p> --n 300` (seeds 1 a 300). Base antes da mudança, política `a`: 269 chegam à F1 (90%), 35 com título (13%).

| Configuração | Política | Título (de 269) |
|---|---|---|
| Valores da especificação, ajustados (macio 0,04/22, duro -0,03/9, `pitOpens` 60) | `a` | 39 (14%) |
| idem | `attack` | 88 (33%) |
| idem, só macios (`abl_soft`) | | 64 (24%) |
| idem, só ataque na largada / só `pit_soft` | | 36 / 39 |
| macio 0,02/22 | `a` / `abl_soft` / `attack` | 39 / 62 / 80 |
| macio 0,02/22, `paceFactor` 0 | `abl_soft` | 64 (o ritmo do pneu não é a causa) |
| macio 0,02/22, `pitOpens` 50 | `abl_soft` | 37 (14%) |
| **final** (macio 0,02/22, duro -0,03/9, `pitOpens` 50) | `a` | **39 (14%), chegada à F1 90%** |
| **final** | `attack` | **48 (18%)** |

Causa do excesso: macios chegam a 56% depois de dois trechos e abriam a janela de box; a regra de posições existente dá +1 a quem para preso atrás de um rival, de graça. Com `pitOpens` 50 a janela por desgaste quase não abre em pista seca, e a opção `pit_soft` só aparece nesses casos raros (limite aceito; só abre sem interrupção). Valores finais alterados em relação à especificação: macio grip 0,02 e wear 22, duro grip -0,03, `pitOpens` 50.

Critérios da etapa A: `a` dentro de ±4 pontos e chegada à F1 igual (ok); `attack` 4 pontos acima de `a` e abaixo de 25% (ok). Composto: estimativa analítica do ganho médio por pista (sem simular 2.000 corridas) dá macio, médio e duro cada um melhor em pelo menos uma das 24 pistas para largadas P3 e P6; com largada P9 o médio não é o melhor em nenhuma. **Não medidos:** simulação de 2.000 corridas por composto, posição média e abandono de `attack` contra `a`, duelos com pneu a 90/60/30 (dependem das etapas B e C). As políticas `abl_soft`, `abl_start` e `abl_pit` em `tools/calibrate/lib.js` são ablações desta medição.

## v0.18 etapa A, correção — os compostos passam a pesar (2026-11-13)

A calibração acima fechava, mas o composto quase não mudava o resultado: em 60 carreiras por composto (1ª temporada de F1, demais decisões automáticas), posição média de chegada 11,93 com macios, 11,93 com médios e 11,89 com duros; a janela de box abria só por interrupção ou clima e `pit_soft` não aparecia. A causa era a regra antiga da parada, que dava uma posição de graça a quem parava preso atrás de um rival.

Mudanças: na janela normal com pneu simulado, ler certo a pista mantém a posição e ler errado custa uma; parar preso no tráfego custa uma posição com chance `pitStopCost` (é uma parada a mais que a dos rivais); o ganho vem depois, do pneu novo. Corridas sem pneu simulado (pista molhada, saves antigos) seguem a regra antiga. Valores finais: macio 0,05/26, médio 0,00/14, duro -0,04/9, `pitOpens` 60, `pitStopCost` 0,85, `paceFactor` 4.

Ganho médio de posições por corrida causado pelo pneu (ritmo por trecho mais efeito da parada), 60 carreiras por linha, cerca de 1.100 corridas secas cada:

| Composto | Pista técnica | Pista de rua | Demais pistas | Janelas por desgaste |
|---|---|---|---|---|
| Macios, parada segura | -0,15 | +0,15 | -0,09 | 772 |
| Macios, parando de macios | -0,10 | +0,20 | -0,06 | 772 |
| Médios | +0,03 | +0,04 | +0,04 | 0 |
| Duros | +0,23 | +0,04 | -0,08 | 0 |

Cada composto é o melhor em um tipo de pista: duros na técnica, macios na de rua, médios nas demais. Chance de ganhar posição no primeiro trecho com pneu novo: macios 23%, médios 13%, duros perto de zero; sem parar, os macios passam a perder.

Rodadas de ajuste (ganho dos macios em pista comum): aderência 0,04 sem custo de parada +0,16; aderência 0,06 com custo 0,75 +0,04 (política `attack` 24% de títulos, reprovada); aderência 0,05 com custo 1 -0,17; final -0,09.

Carreiras com título em 300 seeds (269 chegam à F1, 90%): base antes dos pneus 35 (13%); política `a` 32 (12%); política `attack` 48 (18%). Critérios: `a` dentro de ±4 pontos da base (ok); `attack` abaixo de 25% (ok) e no máximo 5 pontos acima de `a` (**6 pontos, no limite da margem de erro de ±2,3**). Não medido: quanto desses 6 pontos vem dos pneus e quanto dos ataques na largada, nos eventos e no duelo final, que já existiam; medir uma política "ataca mas usa médios" antes da etapa B.

Em 2026-11-15, `node tools/calibrate/player.js --policy attack_medium --n 300` repetiu as decisões agressivas com médios na largada e nas paradas em pista seca. Das 300 carreiras, 269 chegaram à F1 e 56 ganharam título (21% das que chegaram, ±2,5 pontos). Na mesma faixa de seeds, os registros anteriores têm 48 carreiras com título com macios (18%) e 32 na política padrão (12%). A vantagem da política agressiva persistiu com médios. Na v0.18.0, as opções de evento ainda não têm a marcação de ataque, então as duas políticas agressivas usam a mesma escolha padrão nos eventos.

### Etapas B e C (2026-11-15)

Série controlada de 2.000 corridas por política e por composto, com o mesmo Ferrari, piloto de habilidade 85, seeds 1–2.000 e amostras nas 24 pistas. As 100 primeiras seeds foram medidas na pista de estreia. Na comparação por composto, só muda a escolha de largada em pista seca. Posição média de chegada calculada entre classificados e abandonos registrados à parte. A coluna com abandono em último inclui os abandonos como P23.

| Etapa / política | Posição média entre classificados | Abandonos | Posição média com abandono em último |
|---|---:|---:|---:|
| B / padrão | 9,07 | 336 (16,8%) | 11,41 |
| B / agressiva, macios | 8,75 | 412 (20,6%) | 11,69 |
| C / padrão | 9,10 | 336 (16,8%) | 11,44 |
| C / agressiva, macios | 8,73 | 437 (21,9%) | 11,85 |

Com custo de 10 pontos de pneu e bônus por dentro de +0,10, a posição média agressiva entre classificados foi 9,12 em B e 9,10 em C. Aumentar só o bônus por dentro para +0,18 ou +0,24 ainda deixava B atrás da política padrão. Reduzir só o custo para 6 pontos melhorou as chegadas, mas por fora teve o maior ganho médio nos três níveis de condição testados. A configuração combinada usa custo de 6 pontos e bônus por dentro de +0,18, com o toque mantido em 3%.

Na média com o mesmo peso para cada pista e abandono em P23, os compostos ficaram a menos de 0,10 posição entre si em B e C. Macios, médios e duros ficaram isolados em primeiro respectivamente em 10, 9 e 3 pistas em B e em 12, 9 e 3 em C.

Nos duelos de ritmo igual (2.000 sorteios por manobra e condição, com médios), o ganho médio entre classificados por dentro/por fora foi +0,24/+0,18 com pneu a 90%, +0,07/+0,11 a 60% e -0,09/+0,03 a 30%. Por dentro teve 74 abandonos em cada condição (3,7%). Por fora e administrar terminaram todos os duelos.

Na etapa C, 92 das 100 primeiras seeds de carreiras novas (idade 15) chegaram à F1. Na corrida de estreia, 73 delas (79%) tiveram três ou mais pausas, com média de 3,30 pausas.

### Carreiras completas (300 seeds por política)

A partir de B, a política padrão do calibrador passou a responder com a opção segura dos eventos. Na v0.18.0 histórica ela respondia com a primeira opção, que em alguns eventos arriscava posição ou abandono. Esta diferença deve ser levada em conta ao comparar as taxas de títulos.

Na primeira rodada de B (desgaste 10, bônus por dentro +0,10), 269 das 300 carreiras chegaram à F1. A padrão teve 48 carreiras com título (18%), agressiva com macios 41 (15%) e agressiva com médios 38 (14%). A taxa padrão ficou acima da margem de 4 pontos sobre os 12% históricos.


Configuração final com desgaste 6 e bônus por dentro de +0,18. Em cada linha, 269 das 300 carreiras chegaram à F1 (89,7%). As taxas usam essas 269 como denominador.

| Etapa | Padrão | Agressiva com macios | Agressiva com médios |
|---|---:|---:|---:|
| B | 48 (17,8%) | 55 (20,4%) | 44 (16,4%) |
| C | 44 (16,4%) | 54 (20,1%) | 63 (23,4%) |

A política `attack` definida na especificação usa macios. Ela ficou 2,6 pontos acima do padrão em B e 3,7 em C, dentro do limite de 5 pontos e abaixo de 25%. A política adicional `attack_medium` ficou 7,1 pontos acima do padrão em C e também abaixo de 25%. A comparação com a v0.18.0 histórica (32 de 269, 11,9%) excede a margem de 4 pontos em B (+5,9) e C (+4,5).

Controle na v0.18.0 publicada (código de `HEAD`), com a resposta segura nos eventos como nas etapas B e C. Das 300 carreiras, 269 chegaram à F1 e 48 conquistaram pelo menos um título (17,8%). Com a política igual, B ficou no mesmo percentual e C ficou 1,5 ponto abaixo, dentro da margem de 4 pontos. A chegada à F1 foi igual nas três versões. O controle reproduziu a alta observada em B em relação aos 11,9% históricos.

### Postura de corrida (v0.18.3, 2026-11-15)

Medição pareada nas 24 pistas com Ferrari e piloto de habilidade 85. Das seeds 1 a 1.200, 889 abriram decisão de pneus em pista seca. Foram repetidas com as nove combinações de postura fixa e composto de largada, usando a política padrão nas outras escolhas. Nenhum abandono ocorreu nessa amostra, que exclui corridas encerradas antes da escolha de pneus.

| Composto | Atacar | Ritmo | Poupar |
|---|---:|---:|---:|
| Macios | 10,41 | 8,98 | **8,60** |
| Médios | **8,88** | 9,04 | 9,09 |
| Duros | **8,77** | 9,14 | 9,33 |

Cada célula informa a posição média de chegada. A configuração usa multiplicadores de desgaste 1,65 / 1 / 0,50 e modificadores de ritmo +0,06 / 0 / -0,035 para Atacar, Ritmo e Poupar. Ritmo preserva o cálculo anterior. A amostra mede corridas, sem estimativa de títulos para as novas posturas.

### Ajustador do chassi (v0.19, 2026-11-15)

O comando `npm run calibrate:kart` usa 300 seeds pareadas por padrão. Compara a posição na primeira temporada e passa para a carreira completa quando o chassi melhora pelo menos meia posição sobre o treinador. Testa primeiro o menor bônus elegível. A taxa de títulos entre quem chega à F1 deve ficar entre 15% e 20% e a até 4 pontos percentuais do chassi atual. A chegada à F1 deve ficar a até 3 pontos do chassi atual. A ferramenta imprime uma proposta para revisão; a configuração do jogo continua em `engine/config.js`.

Na triagem com 300 seeds, a chegada média foi 11,84 com treinador e 11,91, 11,45, 10,98 e 10,41 com chassi +2, +3, +4 e +5, respectivamente. Os bônus +4 e +5 cumpriram a vantagem imediata adotada na ferramenta.

| Política | Chegaram à F1 | Com título entre quem chegou |
|---|---:|---:|
| Chassi +2 (atual) | 269/300 (89,67%) | 44/269 (16,36%) |
| Treinador no kart | 263/300 (87,67%) | 54/263 (20,53%) |
| Chassi +4 | 259/300 (86,33%) | 44/259 (16,99%) |
| Chassi +5 | 260/300 (86,67%) | 48/260 (18,46%) |

O chassi +4 ultrapassou a tolerância de chegada à F1 em 0,33 ponto percentual. O chassi +5 ficou no limite de 3 pontos de chegada e dentro da faixa de títulos, a 2,10 pontos do atual. A ferramenta sugeriu +5 para revisão; a v0.19.0 usa o chassi +2. O achado 35 segue aberto até a decisão de balanceamento.
