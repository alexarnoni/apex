# Calibração do jogo: como medir e o que já foi decidido

Este guia é para quem for mexer nos números do jogo (você, outra pessoa ou outro agente de IA). Resume as ferramentas de medição que estão em `tools/calibrate/`, as metas atuais, as decisões já tomadas e as armadilhas que já custaram tempo.

**Regra do projeto:** nenhum número de balanceamento fora de `engine/config.js`. Mudou um número, rode as ferramentas abaixo e atualize `docs/roadmap-ideias.md` e o diário do `README.md`.

## Ferramentas

Todas rodam em Node, sem dependências, e usam só a API pública do jogo e o motor.

| Comando | O que mede | Tempo |
|---|---|---|
| `npm run balance` | O mundo da F1 em 200 x 25 temporadas (campeões distintos, dinastias, idade do campeão, p2 da equipe dominante) e a base (kart: posição média e distribuição de ofertas). É a ferramenta original (`tools/balance.js`). | ~2 min |
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
