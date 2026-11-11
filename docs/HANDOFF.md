# Retomada — Bandeirada

Atualizado em **2026-11-11**, v0.14.5 publicada.

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
- Direção de 2026-11-09: tela de corrida estilo manager do piloto, em duas etapas. Escopo e limites em `roadmap-ideias.md`, seção "Tela de corrida estilo manager".
- Etapa 1 (ilustrativa) publicada em 2026-11-09 no commit `e58611c`, ainda como v0.13.0. [Deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42715980339); HTTP 200 e HTML servido com torre, zebras, luzes de largada e GoatCounter. Cena não foi jogada no domínio publicado. Conteúdo: pista desenhada, voltas com ultrapassagens, luzes, torre, narração, controles e painel do carro em `ui/race-visual.js`, `ui/app.js` e `ui/shell.html`. A view ganhou `map.wet`, `map.tyre` e `map.notes` em `engine/f1.js`, sem mudar regras nem saves. 182 testes Node, 28 Playwright (com Chrome do sistema) e build aprovados.
- Ofertas (kart, base e F1) publicadas em `03329df`: fundo neutro, cor da equipe só na faixa e ao lado do nome, vantagens e riscos em blocos com título. [Deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42716935207); HTML servido conferido. O item amplo de cores do roadmap segue aberto.
- Mapa compacto com narração ao lado publicado em `0221bcb`; a última linha da narração sai na chegada. [Deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42718193473); HTML servido conferido, ritmo da narração não cronometrado no navegador.
- Próximas ideias de carreira no roadmap: caixa de entrada e duelo com o companheiro.
- Etapa 2 (volta a volta na engine) não começou; ordem em relação à v0.14 a combinar.
- Depois: grid real de 2026, base mais fiel, salto excepcional F4–F2 e desenvolvimento persistente. Para F1, aplicar os pacotes ao longo do calendário é proposta. Carreira de chefe de equipe fica para uma etapa própria.

## v0.14 publicada

- Treino opcional por etapa (acerto ou pneus), neutralizações por fase com escolha de troca, bandeirada visual e resultado/pódio após a cena. Movimento reduzido e pular revelam o resultado imediatamente.
- O save conserva escolhas pendentes e usa programa padrão na ausência do novo campo. Sem diferenças de tempo ou pneus dos rivais.
- Validação: 183 testes Node, build e 28 Playwright no Chrome (desktop e celular emulado). Revalidação da chegada automática a 4× passou nos dois perfis.
- Publicada em `5b06c56`. [Deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42723753939). HTTP 200 e HTML servido com v0.14.0, treino, neutralizações, bandeirada e GoatCounter. Teste em aparelho real pendente.

v0.14.4 publicada em 2026-11-11 (commit `ab770cc`, [deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43112338908)): dez correções da carreira jogada e termos em inglês de uso comum devolvidos. HTTP 200 e HTML servido com 0.14.4, sem o texto de variável interna e com o painel de simulação persistente. Achados e destino de cada um em `achados-jogada.md`. Ajuste do chassi do kart revertido: +5 levou a taxa de título de 14% para 22% em 150 carreiras. v0.14.5 "Modo paddock" publicada em 2026-11-11 (commit `8ccc7fd`, [deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/43115122912)): abas, ficha larga, opções presas no celular e decisão após a cena. HTTP 200 e HTML servido com 0.14.5, abas e botão de pular; nenhuma corrida jogada no domínio. 183 Node, 32 Playwright (Chrome) e build aprovados. Limites em `pacotes-1.0.md`. Próximo: v0.15 "Caixa de entrada".

Plano do manager imersivo (2026-11-10) no topo de `roadmap-ideias.md`: seis fases com critério de pronto (Entre corridas, Alicerce, Transmissão, Volta a volta, Paddock, Mundo e base), 1.0, Talvez e Arquivo. Ordem confirmada pelo usuário em 2026-11-10, com volta a volta antes do Paddock. Caminho programado em `pacotes-1.0.md`: 23 pacotes da v0.15 à v1.0, nenhum implementado. v0.14.3 publicada em 2026-11-10 (commit `afa8de5`, [deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42938463916)): revisão de termos, Desfazer removido, tela de corrida enxuta e cabeçalho compacto no celular. HTTP 200 e HTML servido com 0.14.3, sem botão Desfazer e com os termos novos. 183 Node, 30 Playwright (Chrome) e build aprovados. Falta leitura frase a frase das telas, modo paddock com abas e ficha larga. Depois: v0.15 "Caixa de entrada".

Som de rádio publicado em 2026-11-09 (commit `adcd8f4`, [deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42733226495); HTTP 200 e HTML servido com o botão de som e o áudio embutido): bip no recado do engenheiro e botão Som/Mudo, em `ui/sound.js` com `ui/assets/radio.mp3` embutido em base64, sem mudar a CSP. Arquivo fornecido pelo usuário como livre para uso; origem não documentada. 183 testes Node, 28 Playwright (Chrome) e build aprovados; o som não foi ouvido na verificação, só a decodificação e o botão.

## v0.14.1 publicada

- Rádio usa a identidade da decisão para evitar bip duplicado em re-render e tocar em recados iguais de decisões diferentes. Mudo persistente. Áudio em aparelho real pendente.
- No celular, fase, posição e escolha aparecem acima do mapa compacto. Torre recolhida mostra os três primeiros e o jogador, com expansão para o grid. Roadmap reconciliado com o bip publicado e backup JSON existente.

- Validação: 183 testes Node, build e 30 Playwright no Chrome em desktop e celular emulado. Publicada em `16885cd`. [Deploy aprovado](https://github.com/alexarnoni/apex/actions/runs/42736734179). Versão, torre e rádio conferidos no HTML servido. Teste em aparelho real pendente.

Confira `git status --short` e `git log -3 --oneline`. Referências: `v0.11.md`, `proxima-atualizacao.md`, `roadmap-ideias.md` e `DECISIONS.md`.
