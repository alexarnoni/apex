# Retomada — Bandeirada

Atualizado em **2026-11-09**, v0.13 publicada.

- Repo `alexarnoni/apex`; push na main aciona GitHub Pages. Site: https://bandeirada.alexarnoni.com.
- v0.11 publicada no commit `9e9738e`. [Deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42538364924); HTTP 200, versão, perfis, treino, GoatCounter, Worker e hashes CSP conferidos no HTML servido.
- Entregue: seis atributos e overall sem carro, treino direcionado, declínio por competência, pilotos sem assento preservados, reservas e retorno, grid completo após transferência, painéis de perfis e histórico recente.
- Verificação local: suíte Node (178 casos), Playwright (22 em desktop/celular), carreira completa e captura de 1920 px. Calibração com 80 carreiras por política/versão e 15.000 temporadas por versão. Duas sementes tiveram dinastia máxima de 9; dados em `calibracao.md`.
- Build normaliza CRLF antes de calcular CSP. Não flexibilizar a política para contornar diferenças do Windows.
- Saves: ENGINE_VERSION 1 e chaves Apex preservadas; atributos inferidos de saves antigos. Não há como recompor pilotos que já desapareceram em saves anteriores.
- GoatCounter configurado como `alexarnoni`; painel https://alexarnoni.goatcounter.com. Feedback segue pelo Worker. Painel de visitas não foi inspecionado.
- Reservas não substituem automaticamente por lesão. Sem rotas alternativas jogáveis, rumores ou pré-contratos. Chromium móvel emulado não substitui testes em aparelhos reais.

## v0.12 publicada

- Publicada em `ad8b11b`. [Deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42541834359). HTTP 200 e HTML com versão, ofertas, resultado, posição em pista e GoatCounter conferidos no domínio.

- Prioridade da revisão visual: cartão do GP encerrado com posição, largada, pontos e relato recolhível. A próxima etapa e a fase atual têm identificação própria.
- Novas carreiras do navegador recebem três propostas de kart. Histórico da base registra temporada por temporada e permite o convite de volta ao kart após um vice, com ausência na abertura da F4.
- GP de casa nas novas carreiras: escolha de agenda, memória por circuito e destaque em Etapas. Estatísticas agregadas ficam para a ampliação da ficha.
- Build, 181 testes Node e 22 testes Playwright aprovados.
- Saves anteriores recebem a nova tela e passam a acumular histórico daqui em diante. A decisão de GP de casa está ativa nas novas carreiras.

Próximos candidatos: grid real de 2026 por data de corte e retrospectiva com Antonelli e Mercedes campeões, além das rotas alternativas jogáveis. Ver prioridades em `proxima-atualizacao.md`.

## v0.13 publicada

- Os dois botões principais agora avançam no máximo uma etapa. **Acompanhar etapa** pausa nas escolhas, **Só decisões importantes** delega a rotina e para em escolha relevante ou na bandeirada. Simulação em lote fica nos controles de acompanhamento.

- Os dois botões usam o mapa lateral com minimonopostos nas cores das equipes. Na bandeirada, entra o pódio. O painel central agrupa GP, fase, posição e última parada.
- A janela de box informa composto, condição estimada, clima e posição. A escolha altera a ordem antes de pontuar e aparece no relato. Desgaste e mudanças de clima são simplificados por fase.
- Ofertas do kart à F1 usam cores das equipes. O rádio descreve a estratégia. Confiança baixa pesa na vaga, mas top 5 à frente do companheiro reduz o risco. Ofertas externas consideram até três temporadas recentes.
- Validação final de 2026-11-09: 182 testes Node, 28 Playwright e build com o aviso MIT dos traçados. Publicada no commit 4915f02. [Deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42708906210). Versão, mapa, pódio, box e GoatCounter conferidos no HTML servido.
- README apresenta o Bandeirada como jogo independente. Avisos MIT de traçados e bandeiras acompanham o build. Nomes reais e marcas no jogo continuam como tema separado para revisão antes de monetizar.
- Próxima etapa proposta: v0.14 com treino livre, safety car e bandeira vermelha. Escopo em `proxima-atualizacao.md`.
- Direção de 2026-11-09: tela de corrida estilo manager do piloto, em duas etapas. Escopo e limites em `roadmap-ideias.md`, seção "Tela de corrida estilo manager".
- Etapa 1 (ilustrativa) publicada em 2026-11-09 no commit `e58611c`, ainda como v0.13.0. [Deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42715980339); HTTP 200 e HTML servido com torre, zebras, luzes de largada e GoatCounter. Cena não foi jogada no domínio publicado. Conteúdo: pista desenhada, voltas com ultrapassagens, luzes, torre, narração, controles e painel do carro em `ui/race-visual.js`, `ui/app.js` e `ui/shell.html`. A view ganhou `map.wet`, `map.tyre` e `map.notes` em `engine/f1.js`, sem mudar regras nem saves. 182 testes Node, 28 Playwright (com Chrome do sistema) e build aprovados.
- Ofertas (kart, base e F1) publicadas em `03329df`: fundo neutro, cor da equipe só na faixa e ao lado do nome, vantagens e riscos em blocos com título. [Deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42716935207); HTML servido conferido. O item amplo de cores do roadmap segue aberto.
- Mapa compacto com narração ao lado publicado em `0221bcb`; a última linha da narração sai na chegada. [Deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42718193473); HTML servido conferido, ritmo da narração não cronometrado no navegador.
- Ideias seguintes (tela de corrida e manager do piloto) listadas no roadmap, nenhuma implementada. Sugestão de início: resultado só depois da cena e bandeirada um a um; depois caixa de entrada e duelo com o companheiro.
- Etapa 2 (volta a volta na engine) não começou; ordem em relação à v0.14 a combinar.
- Depois: grid real de 2026, base mais fiel, salto excepcional F4–F2 e desenvolvimento persistente. Para F1, aplicar os pacotes ao longo do calendário é proposta. Carreira de chefe de equipe fica para uma etapa própria.

Confira `git status --short` e `git log -3 --oneline`. Referências: `v0.11.md`, `proxima-atualizacao.md`, `roadmap-ideias.md` e `DECISIONS.md`.
