# Pacotes de atualização

## v0.10 — ritmo e propósito (implementada)

Código `36bc86f`, em 2026-11-08. Detalhes e limites em `v0.10.md`. Publicação a conferir no pipeline da integração na main.

- [x] ~~Plano persistente no lugar da abordagem repetida~~ — **Feito**.
- [x] ~~Avançar até uma decisão relevante e explicar a interrupção~~ — **Feito**; modo passo a passo preservado.
- [x] ~~Automático competente com as mesmas regras do manual~~ — **Feito**; considera plano, ritmo, pontos e meta no fim da temporada.
- [x] ~~Objetivos proporcionais ao carro e consequências na confiança~~ — **Feito na F1**; sem bônus de habilidade ou barra extra.
- [x] ~~Painel de temporada com companheiro e histórico recente~~ — **Feito**, usando resultados registrados.
- [x] ~~Validar carreira completa, saves e redução de entradas~~ — **Feito**: 167 testes Node, 18 de navegador e comparação de calibração.
- [x] ~~Novo piloto acima dos saves e laterais da página inicial~~ — **Feito**; laterais apenas no desktop.

## v0.11 — perfis de pilotos e mercado vivo (implementada)

Detalhes, calibração e limitações em `v0.11.md`. **Feito em 2026-11-08:**

- [x] ~~Seis atributos, incluindo contribuição técnica, para jogador e adversários~~ — **Feito**; overall sem carro.
- [x] ~~Treino direcionado e evolução/declínio por dimensão~~ — **Feito**; potencial individual preservado.
- [x] ~~Preservar piloto substituído, mercado livre, reservas e retorno~~ — **Feito**; sem substituição automática por lesão.
- [x] ~~Perfis de contratação e grid completo após transferência~~ — **Feito**; negociação por rumores fica futura.
- [x] ~~Consulta de perfis, cores, largura desktop e histórico recente~~ — **Feito**, com dados registrados.
- [x] ~~Testar e calibrar pacote~~ — **Feito**: 178 Node, 22 Playwright; limites quantitativos em `calibracao.md`.

## v0.12 — corrida legível e histórias da carreira

- [x] ~~Mostrar a posição atual na relargada e em outros eventos de pista.~~ **Feito (2026-11-08).** A posição vem da ordem da corrida após a largada e exclui quem abandonou.

- [x] ~~Deixar claro quando a corrida começa e termina~~ — **Feito localmente (2026-11-08).** Fase da corrida no cabeçalho. Resultado do GP anterior com posição, largada, pontos e relato antes da próxima etapa.
- [x] ~~Três propostas de estreia no kart~~ — **Feito localmente (2026-11-08).** Projeto vencedor, equilibrado e de formação com efeitos próprios.
- [x] ~~Histórico da base e primeiro evento que o consulta~~ — **Feito localmente (2026-11-08).** Vice do kart pode disputar prova de convidados e perder a abertura da F4.
- [x] ~~Primeiro GP de casa~~ — **Feito localmente (2026-11-08).** Destaque no calendário, agenda da torcida ou preparação, e chamada que lembra resultado no save. Estatísticas agregadas ficam para a ampliação da ficha.

## v0.13 — corrida visual e estratégia de box

**Publicada em 2026-11-09.** A cena mostra trechos ilustrativos nos traçados existentes e abre as decisões normais do jogo. A janela de box usa desgaste estimado e mudanças de condição, com efeito sobre posições antes da distribuição dos pontos.

**Corrida visual interativa.** Prototipar uma volta no traçado com a câmera no jogador, pausas nas decisões existentes e transição clara para a bandeirada. [Escopo no roadmap](roadmap-ideias.md#corrida-visual-interativa).

O mapa lateral acompanha **Acompanhar próxima corrida** e **Avançar até próxima decisão**, com carros nas cores das equipes. O movimento representa trechos entre decisões. É possível acelerar ou pular.

- **Janela de pit stop.** Pausar quando houver uma escolha relevante entre parar agora ou estender o stint. Mostrar composto, condição estimada dos pneus, clima e disputa por posição quando houver dados para sustentar a decisão.
- **Consequência na pista.** Mostrar a saída dos boxes e o efeito da escolha. No seco, testar a vantagem de parar antes do rival ou de ficar na pista com ritmo e ar livre. Com mudança de clima, decidir quando trocar o composto.
- **Modo rápido.** A equipe usa as mesmas regras e o plano de corrida para decidir quando o jogador delega. O relato e a bandeirada mostram o que aconteceu.

## v0.14 — treino e neutralizações (publicada em 2026-11-09)

- **Treino livre.** Programa opcional por GP. Acerto melhora o ritmo na classificação e na corrida. Teste de pneus melhora a condição estimada na janela de box.
- **Safety car.** Agrupa os carros no mapa. Escolha entre parar com custo reduzido ou manter os pneus para a relargada.
- **Bandeira vermelha.** Suspende a cena. A troca na suspensão preserva a posição.
- **Bandeirada.** Os carros passam pela linha antes de revelar o resultado e o pódio. Pular a animação ou usar movimento reduzido revela o resultado imediatamente.

As neutralizações são decisões por fase. O desgaste dos rivais, as diferenças em segundos e a relargada volta a volta continuam no pacote de simulação.

As três fases se apoiam no fluxo de corrida e na janela de box da v0.13. O ritmo volta a volta completo segue no item D.2 do roadmap.

**Foco atual: carreira de piloto.** As próximas melhorias de corrida aprofundam as decisões do próprio piloto, com os demais carros simulados pelo jogo. O ritmo volta a volta deve partir desse formato.

**Carreira de chefe de equipe (modo manager futuro).** Inclui o comando de dois carros, o desenvolvimento da equipe e a gestão de orçamento e contratos.

## Outros candidatos seguintes

1. **Rotas alternativas jogáveis:** pedido recente do usuário inclui WEC e NASCAR, além de IndyCar/FE/Super Fórmula; especificar ofertas por desempenho/experiência, adaptação, estatísticas e retorno possível à F1. Não implementado.
2. **Mercado e silly season:** notícias, perfis de contratação e história dos contratos (D.8/D.14).
3. **Base com grids e equipes persistentes.** Usar os grids reais de [F2](https://www.fiaformula2.com/en/drivers) e [F3](https://www.fiaformula3.com/en/drivers) em um recorte datado. Para F4, escolher um campeonato nacional ou regional como referência. Ajustar vagas, calendários e formatos por categoria e preservar a evolução das equipes e dos pilotos entre anos.
   - **Salto excepcional de F4 para F2.** Uma temporada de destaque pode gerar proposta direta se houver vaga, idade e elegibilidade. O jogador também pode aceitar F3 ou ficar na F4 quando tiver propostas nessas categorias. Mostrar o motivo da oferta e o desafio de adaptação ao carro.
   - **Evolução dos carros na base.** Guardar a competitividade de cada equipe no save. Considerar acerto, preparação e execução para o desempenho mudar ao longo da carreira. Na F1, aproveitar o desenvolvimento já existente e mostrar o que melhorou ou piorou em relação ao grid.
4. **Ritmo volta a volta.** Evoluir a simulação de posições, desgaste e diferenças entre carros por volta (D.2).
5. **Sons:** acabamento discreto e opcional (D.15).
6. **Grid e histórico real de 2026.** Revisar titulares e reservas e registrar os campeões reais no ponto de partida. Ver [escopo no roadmap](roadmap-ideias.md#atualizar-o-grid-inicial-da-f1-em-2026).

A ordem dos próximos pacotes deve ser fechada na conversa. Não começar todos ao mesmo tempo.

## Experiência no celular

Critério para as próximas versões de corrida. Na tela estreita, priorizar fase, posição, decisão e botões de ação. Manter o mapa compacto e recolher a torre para mostrar os três primeiros e o jogador, com opção de abrir o grid. Conferir largada, box, bandeirada e retomada de save em tela estreita e validar a legibilidade e os toques em aparelho real quando disponível.

Usar o recorte por tamanho de tela do GoatCounter para medir onde as visitas acontecem. Acessos e partidas jogadas são métricas diferentes.

## Forma de entrega

Branch `codex/`, commits internos pequenos, pacote jogável e documentado, verificações proporcionais e integração na main só quando validado. O usuário autorizou publicar o conjunto pronto ao final sem confirmação por tarefa interna. Conferir pipeline e conteúdo servido antes de anunciar publicação concluída. Riscar apenas itens realmente feitos.
