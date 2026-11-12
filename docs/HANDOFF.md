# Retomada — Bandeirada

Atualizado em **2026-11-11**.

- Repo `alexarnoni/apex`; push na `main` publica o site (GitHub Pages). Site: https://bandeirada.alexarnoni.com.
- **Publicado:** v0.14.7 em `c39b4d3` ([deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43131728577)). HTML servido conferido: versão 0.14.7 e os textos novos.
- **Só local, não publicado** (branch `main`, sem push):
  - v0.15 "Caixa de entrada": `2ef2a13` (código) e `e48fb90` (docs). Versão ainda 0.14.7. Publicar só com pedido explícito; ao publicar, subir para 0.15.0 em `package.json` e `package-lock.json`.
  - Ajuste de layout da T4 da v0.14.7: `033216e`. As duas opções no celular deixaram de ficar presas ao rodapé e não cobrem mais o recado do rádio. Esse ajuste precisa ir na próxima publicação.
- Verificação atual: 194 testes Node, build e 38 Playwright (Chrome do sistema).
- Bip do rádio (`ui/app.js`, `ui/sound.js`): toca só no recado de decisão de corrida visível. Ainda não foi ouvido no navegador.

## Pendências

- Publicar a v0.15 (e o ajuste de `033216e`), quando o usuário pedir.
- Testar em aparelho real: som do rádio, ordem das opções no celular, caixa de entrada.
- Achados parciais em `achados-jogada.md`: 28, 30 e 32.
- Próximo pacote: `pacotes-1.0.md`, a partir da v0.16.

## Saves e regras

- ENGINE_VERSION 1 e chaves `apex.slot.N` / `app: 'apex'` preservadas. Campos novos são opcionais (`rating`, `teammateGrid` nas corridas).
- Build normaliza CRLF antes de calcular CSP. Não flexibilizar a política para contornar diferença do Windows.
- GoatCounter: `alexarnoni`. Feedback segue pelo Worker (`worker/README.md`).
- Testes de navegador: ver `testes-interface.md`. Chrome do sistema via config temporária, apagada depois.

Referências: `INDEX.md`, `guia-executor.md`, `DECISIONS.md`, `versoes.md`.
