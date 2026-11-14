# Retomada — Bandeirada

Atualizado em **2026-11-13**.

- Repo `alexarnoni/apex`; push na `main` publica o site (GitHub Pages). Site: https://bandeirada.alexarnoni.com.
- **Publicado:** v0.15.0 em `123eabe` ([deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43136639372)). HTML servido conferido: versão 0.15.0, aba Mensagens, manchete e textos novos.
  - A primeira tentativa (`b4079da`, [run 43135701868](https://github.com/alexarnoni/apex/actions/runs/43135701868)) falhou no CI: a barra de abas com "Mensagens (N)" passava da largura do celular na fonte de fallback do Linux. Corrigido em `123eabe` (abas quebram linha). Reproduzido localmente com fonte larga.
  - v0.14.7 em `c39b4d3`, com o ajuste de layout das opções no celular em `033216e`.
- **Publicado:** v0.16.0 em `3798f43` ([deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43322798161)): duelo, conta do título, briefing, ficha, achados 17, 18, 19 (parcial) e 30 (parcial). Detalhe e limites em `pacotes-1.0.md`.
- Verificação atual: 207 testes Node, build e 44 Playwright (Chrome do sistema).
- Bip do rádio (`ui/app.js`, `ui/sound.js`): toca só no recado de decisão de corrida visível. Ainda não foi ouvido no navegador.

## Pendências

- Testar em aparelho real: som do rádio, ordem das opções no celular, caixa de entrada.
- v0.17.1 "Corrida legível" publicada em 2026-11-12 (commit `8456726`): narração em sincronia com a pista, traçado suavizado com setas, pneus desenhados e textos realistas. Na fila, em `pacotes-1.0.md`: "Pneus e disputas" (v0.18.0 a v0.18.2, especificado em `exec-v0.18.md`), postura (v0.18.3) e traçados redesenhados (v0.18.4); a mesma página lista o que foi conversado em 2026-11-12 e ainda não foi feito.
- **v0.18.0 (etapa A de `exec-v0.18.md`) corrigida em 2026-11-13 e commitada localmente, NÃO publicada.** A primeira versão fechava a calibração, mas o composto não mudava o resultado; a correção trocou a regra de posições da parada (sem ganho de graça) e devolveu aderência e janela de box. Agora cada composto é o melhor em um tipo de pista (duros na técnica, macios na de rua, médios nas demais). 207 testes Node, 44 Playwright e build aprovados; política `a` 12% de títulos (base 13%), `attack` 18%. Números em `calibracao.md`. Antes da etapa B: medir uma política que ataca usando médios, para separar o efeito dos pneus.
- Próximo pacote: "Pneus e disputas" (v0.18.0 a v0.18.2), especificado em `exec-v0.18.md`; muda regra de jogo e exige a calibração descrita lá. Depois: postura (v0.18.3), traçados redesenhados (v0.18.4) e o tutorial "Primeira corrida" (v0.18.5). Ordem invertida em 2026-11-13 a pedido do usuário.
- Achados parciais em `achados-jogada.md`: 28, 30 e 32.
- **v0.17.0 publicada** em `b5e492d` ([deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43348196763)): equipe, gráficos, radar, estatísticas, recordes, companheiro e histórico da base, bandeiras e faixa do legado. HTML servido conferido (versão 0.17.0 e textos novos). Limites em `pacotes-1.0.md`.

## Saves e regras

- ENGINE_VERSION 1 e chaves `apex.slot.N` / `app: 'apex'` preservadas. Campos novos são opcionais (`rating`, `teammateGrid` nas corridas).
- Build normaliza CRLF antes de calcular CSP. Não flexibilizar a política para contornar diferença do Windows.
- GoatCounter: `alexarnoni`. Feedback segue pelo Worker (`worker/README.md`).
- Testes de navegador: ver `testes-interface.md`. Chrome do sistema via config temporária, apagada depois.

Referências: `INDEX.md`, `guia-executor.md`, `DECISIONS.md`, `versoes.md`.
