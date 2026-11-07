# Spec: Ranking e Compartilhamento (backend)

Projeto: Apex. Backend: FastAPI + PostgreSQL na Oracle VM (mesma infra de Astraea/Scout). Frontend: Cloudflare Pages.
Decisão de escopo: NÃO existe save persistente (carreira é uma sessão de minutos). O backend entra só no FIM da carreira: ranking e compartilhamento. O único estado local é um snapshot cru em sessionStorage (definido na spec-loop-jogador), sem versão nem migração.

## 1. Nota de legado (fórmula do ranking)

```
legadoScore = titulosF1*1000 + vicecampeonatos*250 + vitorias*50 + poles*15
            + podios*10 + pontosF1*1 + titulosBase*40 + titulosRotaAlternativa*60
```
Calculada na engine (função pura, testada) e recalculada no servidor a partir do careerLog. A do servidor é a que vale.

## 2. API (FastAPI)

### POST /api/v1/careers
Enviado uma vez, na tela de LEGADO. Body:
`{ seed, engineVersion, player: {name, number, flag, style}, summary: {stats agregados}, careerLog: [...] }`

Servidor:
1. Valida limites de plausibilidade: vitórias por temporada <= corridas da categoria; títulos <= temporadas; pontos por temporada <= corridas * 26; idade final entre 30 e 50; careerLog consistente com o summary (recomputa os agregados a partir do log).
2. Recalcula `legadoScore` do log. Divergência com o cliente = usa o do servidor, marca flag `mismatch`.
3. Rate limit por IP: 10/dia. Sem autenticação no MVP.
4. Retorna `{ id, shareUrl, legadoScore, rank }`.

### GET /api/v1/ranking?period=weekly|global&limit=50
Retorna posições: `{ rank, playerName, flag, legadoScore, titulos, vitorias, id }`. Semanal = carreiras enviadas na semana ISO corrente.

### GET /api/v1/careers/{id}
Dados públicos da carreira pra página de compartilhamento (card estilo F1 Glory: nome, bandeira, dorsal, totais, linha do tempo condensada).

### Anti-fraude, postura honesta
O MVP aceita que score client-side é forjável por quem se esforçar. As defesas acima (recomputo do log + plausibilidade + rate limit) barram o trivial. Defesa forte fica documentada como v2: replay determinístico no servidor (seed + lista de decisões => o servidor re-simula a carreira com a mesma engine em Node e confere o resultado). A arquitetura já permite (engine isomórfica + seed + careerLog), só não implementar agora.

## 3. Banco (Postgres)

```sql
careers(id uuid pk, created_at, player_name text, flag text, number int,
        style text, seed bigint, engine_version text, legado_score int,
        titles int, wins int, podiums int, poles int, points int,
        seasons int, career_log jsonb, mismatch bool default false)
-- índices: (legado_score desc), (created_at desc)
```

## 4. Compartilhamento

- `shareUrl` aponta pra página estática no Pages que busca GET /careers/{id} e renderiza o card.
- Card com meta tags estáticas no MVP; imagem OpenGraph dinâmica é v2.

## 5. Critérios de aceite

1. POST com summary inflado (ex.: 30 vitórias em 24 corridas) é rejeitado com 422.
2. POST com log válido retorna score idêntico ao calculado pela engine no cliente.
3. Ranking semanal vira na segunda-feira 00:00 UTC.
4. Rate limit devolve 429 com mensagem amigável.
5. Página de compartilhamento renderiza com apenas o GET público (sem depender de estado local).

## 6. Fora de escopo
Save persistente, export/import, migração de save, autenticação, replay anti-fraude (v2), imagem OG dinâmica.
