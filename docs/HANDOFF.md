# Retomada — Bandeirada

Atualizado em **2026-11-13**.

- Repo `alexarnoni/apex`; push na `main` publica o site (GitHub Pages). Site: https://bandeirada.alexarnoni.com.
- **Publicado:** v0.15.0 em `123eabe` ([deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43136639372)). HTML servido conferido: versão 0.15.0, aba Mensagens, manchete e textos novos.
  - A primeira tentativa (`b4079da`, [run 43135701868](https://github.com/alexarnoni/apex/actions/runs/43135701868)) falhou no CI: a barra de abas com "Mensagens (N)" passava da largura do celular na fonte de fallback do Linux. Corrigido em `123eabe` (abas quebram linha). Reproduzido localmente com fonte larga.
  - v0.14.7 em `c39b4d3`, com o ajuste de layout das opções no celular em `033216e`.
- **Publicado:** v0.16.0 em `3798f43` ([deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43322798161)): duelo, conta do título, briefing, ficha, achados 17, 18, 19 (parcial) e 30 (parcial). Detalhe e limites em `pacotes-1.0.md`.
- Verificação atual: 199 testes Node, build e 42 Playwright (Chrome do sistema).
- Bip do rádio (`ui/app.js`, `ui/sound.js`): toca só no recado de decisão de corrida visível. Ainda não foi ouvido no navegador.

## Pendências

- Testar em aparelho real: som do rádio, ordem das opções no celular, caixa de entrada.
- Achados parciais em `achados-jogada.md`: 28, 30 e 32.
- **v0.17.0 publicada** em `b5e492d` ([deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43348196763)): equipe, gráficos, radar, estatísticas, recordes, companheiro e histórico da base, bandeiras e faixa do legado. HTML servido conferido (versão 0.17.0 e textos novos). Limites em `pacotes-1.0.md`.

## Saves e regras

- ENGINE_VERSION 1 e chaves `apex.slot.N` / `app: 'apex'` preservadas. Campos novos são opcionais (`rating`, `teammateGrid` nas corridas).
- Build normaliza CRLF antes de calcular CSP. Não flexibilizar a política para contornar diferença do Windows.
- GoatCounter: `alexarnoni`. Feedback segue pelo Worker (`worker/README.md`).
- Testes de navegador: ver `testes-interface.md`. Chrome do sistema via config temporária, apagada depois.

Referências: `INDEX.md`, `guia-executor.md`, `DECISIONS.md`, `versoes.md`.
