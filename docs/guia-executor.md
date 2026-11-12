# Guia do executor

Para o agente que vai implementar um pacote já especificado (por exemplo, `exec-v0.14.7.md` ou `exec-v0.15.md`). Leia este guia inteiro e a especificação do pacote. Não é preciso ler roadmap nem histórico.

## Antes de começar

1. `git status --short` e `git log -3 --oneline`. Se houver alteração local que não é sua, pare e avise o usuário.
2. Leia `AGENTS.md` e `docs/HANDOFF.md`. As regras de `AGENTS.md` valem sempre.
3. Leia só a especificação do pacote pedido. Faça as tarefas na ordem em que aparecem.

## Regras que não mudam

- Responda ao usuário em português.
- Regra de jogo fica em `engine/`; a interface (`ui/`) só mostra e coleta decisões.
- Não mude números de balanceamento (`engine/config.js`, `data/categories.js`, probabilidades e efeitos em `data/events.js`) a menos que a tarefa diga exatamente qual número e qual valor.
- Não use sorteio novo (`rng`) em código que roda durante a carreira, a menos que a tarefa peça. Um sorteio a mais muda todas as carreiras por seed.
- Saves: não renomeie `apex.slot.N` nem `app: 'apex'`. Campo novo no save só se a tarefa pedir, e sempre lido com valor padrão (`campo ?? padrao`), para saves antigos continuarem abrindo.
- Não reintroduza o botão Desfazer. Termos em inglês de uso comum no Brasil ficam (ver `DECISIONS.md`).
- Não crie arquivos de documentação além dos que a tarefa pede.

## Ambiente (Windows, Git Bash)

- Os arquivos usam CRLF. Edite com a ferramenta de edição; evite `sed` em trechos com acento.
- Testes de regra: `npm test` (devem passar todos; hoje são 183).
- Build: `npm run build` (gera `dist/index.html`; hoje cerca de 353 KB, limite de 1 MB).
- Textos de eventos: depois de mexer em `data/events.js`, rode `npm run events` para gerar `docs/textos-eventos.md` de novo.
- Testes de navegador: o navegador do Playwright não está instalado nesta máquina. Use o Chrome do sistema com uma configuração temporária e apague-a depois:

  ```bash
  cat > pw.tmp.config.js <<'EOF'
  import base from './playwright.config.js';
  export default { ...base, use: { ...base.use, channel: 'chrome' } };
  EOF
  npx playwright test -c pw.tmp.config.js
  rm -f pw.tmp.config.js
  ```

  Hoje são 34 testes (17 cenários em desktop e em celular emulado). Não faça commit de `pw.tmp.config.js`.
- Não faça commit da pasta `.claude/`.

## Como a interface funciona (para não quebrar)

- `ui/app.js` redesenha a tela inteira com `innerHTML` a cada ação (`render()`). Nada guardado no DOM sobrevive; estado de tela fica no objeto `ui` ou em `localStorage`.
- Ações são botões com `data-act` (e `data-id`), tratados num `switch` perto do fim de `ui/app.js`.
- **Não repita o mesmo `data-act` + `data-id` duas vezes na tela.** Os testes localizam botões por esses atributos e falham com dois resultados.
- Layout: `layout(view, main, aside, raceLead)`. Com `raceLead` preenchido, a tela está no modo corrida (classe `in-race`): sem abas, só pista, torre, decisão e carro. Fora da corrida há abas `Paddock`, `Piloto` e `Campeonato` (`ui.view`), trocadas por CSS em `ui/shell.html` (`.layout[data-view="…"]`).
- Cena da corrida: `ui/race-visual.js`. `sceneModel.playing` é verdadeiro enquanto a animação roda. Elementos com `hidden data-finish-reveal` aparecem quando o trecho termina; elementos com `data-finish-pending` somem. Use esse mecanismo para qualquer coisa que deva esperar a cena.
- A cena guarda memória entre redesenhos (linhas de narração derivadas). Texto provisório colocado em `map.notes` fica repetido; prefira não emitir a nota.
- CSS: `:has()` dentro de `:has()` é inválido e a regra inteira é descartada. `.card` tem `overflow: hidden`.
- Com `prefers-reduced-motion`, a cena é estática: nada espera animação.

## Testes de navegador: armadilhas

- Elemento escondido faz o Playwright esperar até o tempo limite. Se um teste clicar em algo que agora espera a cena, chame antes `skipScene(page)` (auxiliar em `tests/ui/career.spec.js`).
- Em tela estreita, conteúdo de outra aba está escondido. Use `show(page, seletor, aba)` (mesmo arquivo) antes de interagir.
- Ao mudar o comportamento de uma tela, ajuste o teste existente e acrescente um caso para o comportamento novo.

## Entrega de cada pacote

1. `npm test`, `npm run build` e os testes de navegador, todos passando. Cole o resumo real das saídas no relato.
2. Atualize os documentos: marque as tarefas feitas na especificação do pacote; em `docs/pacotes-1.0.md`, escreva na entrada do pacote o que foi feito e os limites; em `docs/achados-jogada.md`, marque os achados resolvidos; em `docs/HANDOFF.md`, atualize a linha de estado (o handoff deve ficar curto).
3. Faça commit local com mensagem em português, sem acentos no título, terminando com a linha de coautoria que o ambiente indicar. Separe documentação de código em commits diferentes.
4. **Não faça push nem suba a versão sem o usuário pedir.** Push na `main` publica o site.
5. Quando o usuário mandar publicar: suba a versão em `package.json` e `package-lock.json` (três ocorrências), rode tudo de novo, faça o commit, `git push origin main`, espere o deploy (`gh run list --limit 1`, `gh run watch <id> --exit-status`), baixe `https://bandeirada.alexarnoni.com/` e confira que a versão nova e um marcador da mudança estão no HTML. Só então diga que publicou. Registre a publicação nos documentos num commit com `[skip ci]` no título.

## Relato ao usuário

Diga o que mudou, o que foi verificado e como, e o que não foi verificado. Se um teste falhar e você não conseguir resolver, pare e mostre a saída; não ajuste o teste só para passar. Se a especificação estiver errada ou ambígua (arquivo ou trecho que não existe mais, por exemplo), pare nessa tarefa, siga para as que não dependem dela e relate.
