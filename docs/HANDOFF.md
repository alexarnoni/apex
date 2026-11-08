# Retomada — Bandeirada

Atualizado em **2026-11-08**. Leia este arquivo e o índice; abra outras referências conforme a tarefa.

## Estado confirmado

- Publicado: **`007b831`**, após o marco v0.9.2. Repositório `alexarnoni/apex`, branch `main`.
- Site: https://bandeirada.alexarnoni.com. [Deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42520319063); HTTP 200 e hashes CSP conferidos.
- **158 testes Node + 10 testes Playwright passaram localmente e no pipeline**; build aprovado. Calibração completa não refeita após largada/defesa.
- Entregue: defesa final (D.2.a), largada (D.2.b), UI desktop/375 px, feedback sem cobrir decisões no celular e aviso acessível de importação.
- `ENGINE_VERSION = 1`; pacote interno ainda `0.1.0`. Sem ranking online; Worker de feedback separado.

## Trabalho desta etapa

- Adotado contexto enxuto: global → índice mestre → índice do projeto → handoff.
- Globais criados: `C:/Users/alexc/.codex/AGENTS.md` e `INDEX.md` (fora do Git). Somente Bandeirada cadastrado.
- Projeto: leitura seletiva no `AGENTS.md`, mapa em `INDEX.md`, decisões estáveis em `DECISIONS.md`, rotina em `contexto-agentes.md`.
- Organização documental e plano do próximo pacote preparados para commit nesta etapa; consulte `git log` para o hash. Nenhuma alteração de gameplay ou novos testes nesta etapa. Sem push documental separado.

## Próximo trabalho

**Pacote v0.10: fim de semana mais vivo**, planejado em `proxima-atualizacao.md`: treino livre, boxes por fases, safety car coletivo, relato e validação. Ainda não implementado. Começar pelo contrato de fases e treino livre.

O usuário quer pacotes maiores publicados ao final: trabalhar em branch `codex/`, commits internos menores e um push de integração quando o conjunto estiver pronto e validado. A pergunta desta etapa foi sobre a abordagem; nenhum desenvolvimento do pacote foi iniciado.

Prioridades seguintes: mercado/silly season → mini calendário da base/metas → sons. A base continua uma decisão por temporada.

## Limites

- Corrida ainda simulada de uma vez; decisões alteram o resultado antes dos pontos. Não há modelo por volta.
- Automático cede na defesa e usa `hold` na largada; métricas antigas de títulos não validam essa versão.
- Chromium com viewport móvel não substitui aparelhos reais; carreira inteira pela UI continua pendente.
- Sem migração de saves; rotas alternativas terminais. Regras e armadilhas: `DECISIONS.md`.

## Retomar

Confira `git status --short` e `git log -3 --oneline`. Não repita testes só para confirmar este documento. Para a próxima mudança, consulte comandos em `testes-interface.md`, medições em `calibracao.md` e prioridades no início de `roadmap-ideias.md`.
