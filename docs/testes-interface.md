# Testes da interface

Suite Playwright adicionada em 2026-11-08. Roda o jogo construído em Chromium isolado, sem usar abas, perfil ou saves pessoais do Chrome.

## Executar

```bash
npm ci
npx playwright install chromium --only-shell
npm run test:ui
```

No Linux de CI, a instalação usa `npx playwright install --with-deps chromium --only-shell` para incluir bibliotecas do sistema.

`npm test` continua sendo a suíte Node (178 testes na v0.11). `npm run test:ui` é separado e executa onze cenários em dois tamanhos: desktop 1440×1000 e celular 375×812, totalizando **22 testes** (consulta de perfis também em 1920 px). O runner constrói o site, inicia servidor em `127.0.0.1:5057` e encerra o servidor ao terminar. Essa porta deve estar livre.

## Cobertura atual

- Consultar piloto reserva, seis atributos e preservar seleção após renderização.
- Direcionar treino e retomar atributos persistidos no save.
- Criar piloto, disputar uma temporada de base e retomar após recarregar.
- Importar JSON pela interface, responder à largada, desfazer e retomar a decisão pendente.
- Mostrar perseguidor na defesa, ceder e conferir resultado/relato salvo.
- Simular cinco corridas e o restante até pausa narrativa ou fim da temporada.
- Ativar parada nas decisões e interromper antes da estratégia de pneus.
- Mudar plano sem consumir etapa/RNG, retomar no reload, avançar por contexto e delegar uma decisão.
- Verificar criação antes dos saves e painéis laterais responsivos.
- Detectar erros de JavaScript, bloqueio de script por CSP e rolagem horizontal nas telas percorridas.
- No celular, conferir que o botão de feedback fica fora da área rolável das decisões.

Os saves de teste da F1 são gerados pela API pública (`createCareer`, `advance`, `applyDecision`) e importados por arquivo; não é preciso clicar toda a base a cada cenário. Além dessas fixtures, há um cenário separado que cria o piloto e percorre a carreira inteira até o legado pela interface.

Pedidos externos são bloqueados durante os testes: sem envio de feedback, analytics ou dependência de Google Fonts. As capturas usam as fontes disponíveis no ambiente, não garantem o mesmo aspecto com fontes remotas carregadas.

## Artefatos e CI

Configuração: `playwright.config.js`. Cenários: `tests/ui/career.spec.js`.

Capturas de largada/defesa ficam em `test-results/`; falhas também geram captura e trace. `test-results/` e `playwright-report/` são ignorados pelo Git. Para investigar um trace, use `npx playwright show-trace caminho/trace.zip`.

Os workflows de PR e de publicação foram configurados para instalar o Chromium e executar a suite antes de publicar. A suite passou localmente e no [deploy do commit `007b831`](https://github.com/alexarnoni/apex/actions/runs/42520319063). O workflow de PR também está configurado; esta confirmação é do pipeline de publicação.

## O que falta

- ~~Percurso de carreira inteira, incluindo ofertas, termos de contrato e legado, só com cliques~~ — **Feito na v0.10**, em desktop e celular emulado; caminhos de política alternativa continuam úteis para ampliar cobertura.
- Validar Safari/iOS, Firefox e aparelhos reais; viewport móvel do Chromium não substitui esses testes.
- Fluxos de falha de armazenamento, navegação por teclado/modal e envio de feedback com backend simulado.
- Fluxos adicionais de escolhas não padronizadas de contrato/ordens.
- Comparação visual automatizada entre versões; capturas atuais foram inspecionadas, não são golden images.
