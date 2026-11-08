# Contexto enxuto para agentes

```text
Instruções globais → índice mestre → AGENTS.md do projeto
  → docs/INDEX.md → docs/HANDOFF.md → referências necessárias
```

No Codex deste computador: global `C:/Users/alexc/.codex/AGENTS.md`, índice mestre `C:/Users/alexc/.codex/INDEX.md`. São pessoais e externos ao Git: não acompanham um clone.

O [guia oficial de AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) descreve o carregamento global e por projeto ao iniciar. Abra uma conversa nova para confirmar a descoberta automática. Não há economia percentual de tokens garantida.

| Arquivo | Responsabilidade |
|---|---|
| Global `AGENTS.md` | Preferências gerais e entrada do índice mestre; curto. |
| Global `INDEX.md` | Nome, caminho e índice de cada projeto conhecido; sem histórico. |
| Projeto `AGENTS.md` | Regras específicas e entrada da documentação. |
| `docs/INDEX.md` | Mapa das referências, sem repetir seu conteúdo. |
| `docs/HANDOFF.md` | Um estado atual, próximo passo, verificações e bloqueios; alvo até 50 linhas. |
| `docs/DECISIONS.md` | Decisões estáveis e erros a não repetir. |
| Roadmap/versões | Tarefas e histórico; leitura seletiva. |

## Rotina

- Início: ler índice e handoff uma vez, conferir Git e buscar apenas os trechos relevantes.
- Durante: carregar skills e ferramentas conforme a necessidade da tarefa.
- Fim: atualizar o handoff com o estado real, sem promessas ou testes não executados. Atualizar índice se referências mudarem; riscar tarefas concluídas no roadmap.
- Projeto novo: criar instruções curtas, índice e handoff e cadastrar o caminho no índice mestre, preservando entradas existentes.
- Outro computador/agente: recriar a entrada global com os caminhos locais. Se a ferramenta não descobrir `AGENTS.md`, apontar para ele nas instruções nativas dela.

## Skills e hooks

Não foram adicionados comandos de barra, skills extras ou hooks nesta etapa. A rotina é instrução, não automação garantida. Adicionar skill para um procedimento repetitivo concreto e hooks só após verificar suporte e utilidade. Não copiar configurações de Claude/Gemini para o Codex como se fossem equivalentes.
