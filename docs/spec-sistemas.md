# Spec: Sistemas de Suporte (rotas alternativas, academia, orçamento dinâmico, fama)

Projeto: Apex. Depende de: spec-piloto1-piloto2, spec-loop-jogador.
Todos os números novos entram em `engine/config.js` nos blocos indicados.

## 1. Rotas alternativas (Super Fórmula, IndyCar, Fórmula E)

### Gatilho
Entra na fase ROTA_ALTERNATIVA quando: perdeu o assento de F1 sem nenhuma oferta, OU completou 2 temporadas de F2 sem oferta de subida. O jogador escolhe uma das 3 séries (ou aposentar).

### Simulação (leve, reusa o motor de base)
Cada série é uma pseudo-categoria: `{ carWeight: 0.5, gridSize: 20, races: 14, npcSkill: [70, 88], carSpread: 5 }`. Sem mundo persistente: grid NPC gerado por temporada + 2 "estrelas residentes" fixas por série (nomes gerados, skill 86-90) que dão sabor e podem virar rivais.

### Efeito no retorno
Nota de scouting de F1 recalculada por temporada lá: título = +6, pódio no campeonato = +4, top 8 = +2, resto = 0. Acumula até no máximo +8. Quando a nota cruzar o tier `mid`, equipes de F1 com vaga voltam a fazer oferta (prioridade pra equipes fracas). Idade continua pesando normalmente: a rota alternativa é ponte, não fonte da juventude.

### Config
```js
altRoutes: { scoutTitle: 6, scoutPodium: 4, scoutTop8: 2, scoutCap: 8 },
```

## 2. Academia (status binário, sem economia)

### Convite
Pode disparar em BASE_OFERTAS quando a nota de scouting da temporada for tier `top` em kart, F4 ou F3. Chance base 25% (+15pp se escolheu "networking de academias" na F3). A academia é de uma das 3 grandes (sorteada com peso pelo orçamento).

### Benefícios
- `academyBonus` na nota de scouting (já existe no config: +3).
- Assento garantido na equipe-satélite ou parceira na subida de categoria (nunca fica sem oferta).
- Na chegada à F1: primeira oferta vem da equipe B do grupo (ex.: Racing Bulls) com cláusula de renovação automática por 2 anos.

### Custos e riscos
- Revisão anual: se a temporada ficar abaixo da expectativa da academia (posição pior que a metade do grid ajustada pelo carro), corte com 40% de chance. Cortado = perde todos os benefícios + `-2` fama.
- A academia decide o ritmo: com tier `top`, ela PODE forçar promoção imediata (60% de chance), mesmo que o jogador preferisse mais um ano. Recusar a promoção = sair da academia.
- Sair voluntariamente: permitido em qualquer offseason, `-1` fama, sem outras punições.

### Config
```js
academy: { inviteChance: 0.25, networkingBonus: 0.15, cutChance: 0.4, forcePromoChance: 0.6, cutFamePenalty: 2, leaveFamePenalty: 1 },
```

## 3. Orçamento dinâmico das equipes (F1)

O orçamento deixa de ser fixo e persegue lentamente o sucesso, com piso:
- Na virada de ano: `alvo = 4 + (posiçãoNoConstrutores invertida) * 0.6` (campeã -> alvo 10, última -> alvo 4).
- `budget += (alvo - budget) * 0.25`, limitado a [4, 10].
Efeito desejado: dinastia enriquece devagar, equipe que despenca empobrece devagar, ninguém morre (piso 4 mantém a Cadillac viva). Interage com desenvolvimento e com a virada de regulamento sem mudança nelas.

### Config
```js
budgetDrift: { floor: 4, cap: 10, base: 4, perRank: 0.6, speed: 0.25 },
```

## 4. Fama (consolidação do que já foi citado nas outras specs)

Inteiro 0+, do jogador apenas. Fontes:
- Vitória de GP +0.3, pódio +0.1, pole +0.1, título de F1 +3, título de base +1.
- Decisões: assessoria de mídia (F4) +2, trabalhar imagem (foco de temporada) +2.
- Desafiar ordem de equipe: +1 fama (o público ama rebelde), junto do -20 de confiança. É o trade-off mais saboroso do sistema.
- Cortado de academia -2, sair -1.

Efeitos:
- Entra somando na nota de scouting (peso já existe).
- No mercado de F1: fama >= 10 permite exigir cláusula de saída sem contrapartida; fama >= 20 reduz o `statusClauseThreshold` em 1 (empilha com confiança alta).
- Futuro (fora de escopo): patrocínio pessoal, eventos de mídia.

### Config
```js
fame: { win: 0.3, podium: 0.1, pole: 0.1, f1Title: 3, baseTitle: 1, defyBonus: 1, exitClauseFloor: 10, clauseDiscountFloor: 20 },
```

## 5. Critérios de aceite

1. Simulação em massa: jogador preso na F2 com skill 80 entra em rota alternativa e, com 1 título lá, recebe oferta de F1 em até 2 anos em >= 70% das rodadas.
2. Carreira via academia chega à F1 em média 1.5 temporadas mais cedo que sem academia (mesmo skill), com >= 15% das carreiras de academia terminando em corte antes da F1.
3. Com orçamento dinâmico ligado, `npm run balance` mantém as métricas do mundo dentro das faixas já atingidas (idade do campeão, renovação de grid) e não reduz campeões distintos abaixo de 5.
4. Testes novos: drift de orçamento converge pro alvo e respeita piso/teto; corte de academia dispara nas condições certas; fama acumula pelas fontes listadas.

## 6. Fora de escopo
Economia monetária, patrocínios, moral de NPCs, rotas alternativas com mundo persistente.
