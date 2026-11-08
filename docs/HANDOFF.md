# Retomada — Bandeirada

Atualizado em **2026-11-08**, pacote v0.10.0.

## Estado verificável

- v0.10 publicada: código **`36bc86f`**, integração **`651f1ef`** na main; repositório `alexarnoni/apex`. Git limpo ao conferir a publicação, antes destas notas de acompanhamento.
- Site: https://bandeirada.alexarnoni.com. [Deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42524571094); HTTP 200, beta 0.10.0, fluxo contextual, página inicial e hashes CSP conferidos.
- **167 testes Node e 18 testes Playwright aprovados**, incluindo carreira inteira por cliques em desktop/375 px; build e capturas conferidos.
- Comparação 120 sementes/cenário com `007b831`: agregados da política antiga iguais; equipe a 22% com título contra 17% antigo, notrain 4,3% contra 5,2%. Denominador só quem chegou à F1; incerteza relevante. Detalhes em `calibracao.md`.
- Ritmo pareado: 27 temporadas, 648 etapas, 2528 → 994 entradas (−60,7%) com mesmos resultados; não é medida de diversão humana.

## Entregue

- Plano persistente (ajustável), avanço até decisão importante, recomendação contextual e delegação, modo manual preservado.
- Metas proporcionais ao carro inicial, progresso, cobrança na confiança sem barra extra, comparação com companheiro e situação do contrato.
- Novo piloto acima dos saves; laterais de jornada/ajuda apenas no desktop. Beta 0.10.0 visível.
- EngineVersion continua 1; campos aditivos. Saves antigos recebem fallback equilibrado e meta ao preparar a próxima corrida. Chaves Apex preservadas.
- Organização de contexto enxuto já commitada em `5d8abe9`; global/índice pessoais fora do Git.

## Acompanhamento de acessos

**B.5 ativado em 2026-11-08.** Usuário forneceu código `alexarnoni`; variável `BANDEIRADA_GOATCOUNTER` configurada no GitHub. [Deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42524872452); script, endpoint, marcos e CSP conferidos no site. Painel: https://alexarnoni.goatcounter.com. Recebimento de visitas no painel não foi inspecionado. Sem histórico retroativo pelo contador; notas incluídas no lote de documentação desta publicação.

## Ajuste local dos botões

Ação principal agora é **Avançar até próxima decisão** (roxo, primeiro); secundária **Acompanhar próxima corrida**. Só ordem, estilo e rótulos mudaram; lógica preservada. Na jornada lateral, F1 agora diz **O ápice do automobilismo**, a pedido do usuário. Build aprovado; ajustes incluídos no lote de publicação autorizado desta etapa, a conferir no workflow do commit.

## Próxima atualização proposta: v0.11

**Perfis de pilotos e mercado vivo**, antes das rotas jogáveis: atributos separados (classificação, corrida, consistência, chuva e pneus), evolução/declínio por dimensão, valor da experiência conforme necessidade da equipe e preservação dos pilotos que perdem assento.

Pedido: veteranos não devem piorar em tudo nem desaparecer. Ao jogador substituir Hamilton na Ferrari, manter Hamilton como piloto sem vaga, com possibilidade de outra equipe, reserva ou aposentadoria contextual. Não recuperar retroativamente pilotos apagados sem dados suficientes. O usuário pode testar com save novo.

Depois dessa base, rotas alternativas WEC/NASCAR/IndyCar/FE/Super Fórmula. Ambas as frentes estão **planejadas, não implementadas**. Não começar tudo ao mesmo tempo.

## Limites

- Corrida ainda simulada de uma vez; decisões reordenam antes dos pontos. Sem tempos por volta ou gaps reais.
- Rotas alternativas atuais terminam a carreira. Sem migração automática de formato.
- Chromium móvel emulado não substitui aparelhos reais. Regras/armadilhas em `DECISIONS.md`.

## Retomar

Confira `git status --short` e `git log -3 --oneline`. Leia só referências necessárias; não repetir suítes sem mudança/dúvida. Pacote: `v0.10.md`; testes: `testes-interface.md`; tarefas: início de `roadmap-ideias.md`.
