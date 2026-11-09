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

- [x] ~~Deixar claro quando a corrida começa e termina~~ — **Feito localmente (2026-11-08).** Fase da corrida no cabeçalho. Resultado do GP anterior com posição, largada, pontos e relato antes da próxima etapa.
- [x] ~~Três propostas de estreia no kart~~ — **Feito localmente (2026-11-08).** Projeto vencedor, equilibrado e de formação com efeitos próprios.
- [x] ~~Histórico da base e primeiro evento que o consulta~~ — **Feito localmente (2026-11-08).** Vice do kart pode disputar prova de convidados e perder a abertura da F4.
- [x] ~~Primeiro GP de casa~~ — **Feito localmente (2026-11-08).** Destaque no calendário, agenda da torcida ou preparação, e chamada que lembra resultado no save. Estatísticas agregadas ficam para a ampliação da ficha.

## v0.13 proposta — corrida visual

**Corrida visual interativa.** Prototipar uma volta no traçado com a câmera no jogador, pausas nas decisões existentes e transição clara para a bandeirada. [Escopo no roadmap](roadmap-ideias.md#corrida-visual-interativa).

Começar pelo botão **Acompanhar próxima corrida**, com opção de acelerar ou pular. O valor de rejogar vem das escolhas, equipes e consequências diferentes em cada carreira.

## Outros candidatos seguintes

1. **Rotas alternativas jogáveis:** pedido recente do usuário inclui WEC e NASCAR, além de IndyCar/FE/Super Fórmula; especificar ofertas por desempenho/experiência, adaptação, estatísticas e retorno possível à F1. Não implementado.
2. **Mercado e silly season:** notícias, perfis de contratação e história dos contratos (D.8/D.14).
3. **Base dinâmica:** etapas-chave e metas (D.3/D.5).
4. **Corrida por fases:** treino, boxes e safety car coletivo, quando houver estado que sustente escolhas interessantes (D.2). Não acrescentar telas obrigatórias apenas para aumentar cliques.
5. **Sons:** acabamento discreto e opcional (D.15).
6. **Grid e histórico real de 2026.** Revisar titulares e reservas e registrar os campeões reais no ponto de partida. Ver [escopo no roadmap](roadmap-ideias.md#atualizar-o-grid-inicial-da-f1-em-2026).

A ordem dos próximos pacotes deve ser fechada na conversa. Não começar todos ao mesmo tempo.

## Forma de entrega

Branch `codex/`, commits internos pequenos, pacote jogável e documentado, verificações proporcionais e integração na main só quando validado. O usuário autorizou publicar o conjunto pronto ao final sem confirmação por tarefa interna. Conferir pipeline e conteúdo servido antes de anunciar publicação concluída. Riscar apenas itens realmente feitos.
