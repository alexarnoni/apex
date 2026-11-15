# Retomada — Bandeirada

Atualizado em **2026-11-15**.

- Repo `alexarnoni/apex`; push na `main` publica o site (GitHub Pages). Site: https://bandeirada.alexarnoni.com.
- **Publicado:** v0.15.0 em `123eabe` ([deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43136639372)). HTML servido conferido: versão 0.15.0, aba Mensagens, manchete e textos novos.
  - A primeira tentativa (`b4079da`, [run 43135701868](https://github.com/alexarnoni/apex/actions/runs/43135701868)) falhou no CI: a barra de abas com "Mensagens (N)" passava da largura do celular na fonte de fallback do Linux. Corrigido em `123eabe` (abas quebram linha). Reproduzido localmente com fonte larga.
  - v0.14.7 em `c39b4d3`, com o ajuste de layout das opções no celular em `033216e`.
- **Publicado:** v0.16.0 em `3798f43` ([deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43322798161)): duelo, conta do título, briefing, ficha, achados 17, 18, 19 (parcial) e 30 (parcial). Detalhe e limites em `pacotes-1.0.md`.
- Verificação atual: 211 testes Node, build e 48 cenários Playwright (Chrome).
- Bip do rádio (`ui/app.js`, `ui/sound.js`): toca só no recado de decisão de corrida visível. Ainda não foi ouvido no navegador.

## Pendências

- **Etapas B e C incluídas na v0.19.0.** Ataques gastam 6 pontos de pneu, duelo final tem manobras, meio de corrida ganha duelo e perfil do rival quando falta evento. A calibração de 2.000 corridas mostrou melhores chegadas entre classificados para a política agressiva, com mais abandonos. Em 100 seeds, 73 das 92 estreias tinham ao menos três pausas. Medições e limitações em `calibracao.md`. Em 300 seeds por política, macios ficaram dentro de +5 pontos sobre o padrão em B/C; médios ficaram +7,1 em C.

- Testar em aparelho real: som do rádio, ordem das opções no celular, caixa de entrada.
- v0.17.1 "Corrida legível" publicada em 2026-11-12 (commit `8456726`): narração em sincronia com a pista, traçado suavizado com setas, pneus desenhados e textos realistas. Na fila, em `pacotes-1.0.md`: "Pneus e disputas" (v0.18.0 a v0.18.2, especificado em `exec-v0.18.md`), postura (v0.18.3) e traçados redesenhados (v0.18.4); a mesma página lista o que foi conversado em 2026-11-12 e ainda não foi feito.
- **v0.18.0 (etapa A de `exec-v0.18.md`) corrigida e publicada em 2026-11-13 como v0.18.0** (commit `5350513`, [deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43544284033)); nenhuma corrida jogada no domínio depois da publicação. A primeira versão fechava a calibração, mas o composto não mudava o resultado; a correção trocou a regra de posições da parada (sem ganho de graça) e devolveu aderência e janela de box. Agora cada composto é o melhor em um tipo de pista (duros na técnica, macios na de rua, médios nas demais). 207 testes Node, 44 Playwright e build aprovados; política `a` 12% de títulos (base 13%), `attack` 18%. Números em `calibracao.md`.
- **v0.18.3 incluída na v0.19.0.** Atacar, Ritmo e Poupar persistem entre corridas e são trocáveis nas pausas em pista seca com trecho pela frente. 889 corridas secas por combinação de postura e composto. Poupar teve melhor chegada com macios; Atacar, com médios e duros. Build e troca com retomada do save confirmados em Chrome a 1.440 e 375 px.
- **v0.18.4 incluída na v0.19.0.** Mapas e miniaturas com setas maiores, setores e boxes esquemáticos, enquadramento por pista e ponte em Suzuka. Build e 46 testes Playwright passaram. Capturados os 24 mapas a 375 px em `test-results/tracados/`.
- **v0.18.5 incluída na v0.19.0.** Tutorial da estreia e glossário, texto da nota dos olheiros e mensagens de título da F2 e estreia na F1. Fluxo automatizado conferido até a bandeirada em desktop e celular; falta validação com estreante que não acompanha F1. Próxima implementação conforme `pacotes-1.0.md`.
- **v0.19.0 publicada em 2026-11-15** no commit `356ad93` ([deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43770403753)). HTML público confirmado com versão 0.19.0, tutorial, ponte e opção de armazenamento persistente. Saves da v0.14.7 retomados no kart e na F1. Diagnóstico testado com destino simulado. O ajustador sugeriu chassi +5; o jogo usa +2. Próximo pacote: v0.20 em `pacotes-1.0.md`.
- Achados parciais em `achados-jogada.md`: 28, 30 e 32.
- **v0.17.0 publicada** em `b5e492d` ([deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43348196763)): equipe, gráficos, radar, estatísticas, recordes, companheiro e histórico da base, bandeiras e faixa do legado. HTML servido conferido (versão 0.17.0 e textos novos). Limites em `pacotes-1.0.md`.

## Saves e regras

- ENGINE_VERSION 1 e chaves `apex.slot.N` / `app: 'apex'` preservadas. Campos novos são opcionais (`rating`, `teammateGrid` nas corridas).
- Build normaliza CRLF antes de calcular CSP. Não flexibilizar a política para contornar diferença do Windows.
- GoatCounter: `alexarnoni`. Feedback segue pelo Worker (`worker/README.md`).
- Testes de navegador: ver `testes-interface.md`. Chrome do sistema via config temporária, apagada depois.

Referências: `INDEX.md`, `guia-executor.md`, `DECISIONS.md`, `versoes.md`.
