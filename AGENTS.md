# Bandeirada — instruções para agentes

- Leia `docs/INDEX.md` e `docs/HANDOFF.md` antes de começar; consulte os demais documentos conforme a tarefa.
- Leia índice e handoff uma vez ao retomar. Não carregue roadmap, specs ou histórico inteiros sem necessidade; use busca e trechos. Skills e ferramentas adicionais só conforme a tarefa.
- Responda em português. Preserve alterações locais e confira o Git antes de editar.
- O código é a referência do comportamento atual; specs também contêm planos ainda não implementados.
- Regras ficam na engine pura; interface apresenta e coleta decisões. Parâmetros de balanceamento ficam em `engine/config.js` (dados por categoria em `data/categories.js`).
- Alterações no resultado da corrida devem ocorrer antes da atribuição dos pontos. Preserve o determinismo por seed e decisões.
- Preserve saves existentes: não renomeie `apex.slot.N` nem o identificador `app: 'apex'`. Migração de formato ainda é pendente.
- Faça verificações proporcionais à mudança. Para regras de jogo, rode `npm test`; para interface/build, também `npm run build`. Para balanceamento, consulte `docs/calibracao.md`.
- Ao concluir uma tarefa, atualize o roadmap: risque o identificador e o título, marque **Feito**, registre a data e as limitações. Não marque tarefas parcialmente implementadas como concluídas.
- Ao encerrar trabalho relevante, atualize `docs/HANDOFF.md`; atualize o índice se criar/mover documentos. Não registre segredos ou dados pessoais de feedback.
- Mantenha um handoff único e curto (alvo: 50 linhas). Decisões estáveis e erros a evitar ficam em `docs/DECISIONS.md`; histórico fica no Git e nas versões. Não duplique essas informações no índice.
- Push na `main` publica o site automaticamente. Siga a autorização da conversa para commit/push; não confunda documentação local com publicação verificada.
