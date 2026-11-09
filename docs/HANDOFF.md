# Retomada — Bandeirada

Atualizado em **2026-11-08**, pacote v0.11.0.

- Repo `alexarnoni/apex`; push na main aciona GitHub Pages. Site: https://bandeirada.alexarnoni.com.
- v0.11 publicada no commit `9e9738e`. [Deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42538364924); HTTP 200, versão, perfis, treino, GoatCounter, Worker e hashes CSP conferidos no HTML servido.
- Entregue: seis atributos e overall sem carro, treino direcionado, declínio por competência, pilotos sem assento preservados, reservas e retorno, grid completo após transferência, painéis de perfis e histórico recente.
- Verificação local: suíte Node (178 casos), Playwright (22 em desktop/celular), carreira completa e captura de 1920 px. Calibração com 80 carreiras por política/versão e 15.000 temporadas por versão. Duas sementes tiveram dinastia máxima de 9; dados em `calibracao.md`.
- Build normaliza CRLF antes de calcular CSP. Não flexibilizar a política para contornar diferenças do Windows.
- Saves: ENGINE_VERSION 1 e chaves Apex preservadas; atributos inferidos de saves antigos. Não há como recompor pilotos que já desapareceram em saves anteriores.
- GoatCounter configurado como `alexarnoni`; painel https://alexarnoni.goatcounter.com. Feedback segue pelo Worker. Painel de visitas não foi inspecionado.
- Reservas não substituem automaticamente por lesão. Sem rotas alternativas jogáveis, rumores ou pré-contratos. Chromium móvel emulado não substitui testes em aparelhos reais.

## v0.12 em validação local

- Prioridade da revisão visual: cartão do GP encerrado com posição, largada, pontos e relato recolhível. A próxima etapa e a fase atual têm identificação própria.
- Novas carreiras do navegador recebem três propostas de kart. Histórico da base registra temporada por temporada e permite o convite de volta ao kart após um vice, com ausência na abertura da F4.
- GP de casa nas novas carreiras: escolha de agenda, memória por circuito e destaque em Etapas. Estatísticas agregadas ficam para a ampliação da ficha.
- Build e 22 testes Playwright aprovados. A suíte Node anterior à última mudança de exibição passou 178 casos, e os três testes específicos de v0.12 passaram após a mudança.
- Alterações locais. Revisar o pacote antes de publicar. Saves anteriores recebem a nova tela e passam a acumular histórico daqui em diante. A decisão de GP de casa está ativa nas novas carreiras.

Próximos candidatos: grid real de 2026 por data de corte e retrospectiva com Antonelli e Mercedes campeões, além das rotas alternativas jogáveis. Ver prioridades em `proxima-atualizacao.md`.

Feedback de teste: texto de estratégia usa “rádio” e “equipe”. Relargada e demais eventos na pista mostram a posição atual. Corrida visual com pausas nas decisões entrou no roadmap como protótipo para v0.13.

Confira `git status --short` e `git log -3 --oneline`. Referências: `v0.11.md`, `proxima-atualizacao.md`, `roadmap-ideias.md` e `DECISIONS.md`.
