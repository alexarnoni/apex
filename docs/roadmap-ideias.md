# Bandeirada: ideias e melhorias, do mais fácil ao mais difícil

Lista consolidada de tudo que surgiu até agora, ordenada pelo custo de implementar. Esforço é uma estimativa de trabalho de código + teste + calibração (P = horas, M = alguns dias, G = semanas).
Itens já registrados como dívida no README estão marcados com (README).

## Plano do manager imersivo (2026-11-10)

**Visão.** Um F1 Manager do piloto no navegador, imersivo até onde o meio permitir: o jogador vive o fim de semana, assiste à corrida como numa transmissão, decide pelo rádio e administra a carreira no paddock.

**Todo item aberto deste documento está encaixado aqui**, por identificador ou pelo nome da seção onde está descrito; o detalhe continua nas seções abaixo. *Engine* indica regra na engine pura, com `npm test` e, se mexer em resultado, calibração. A lista "Falta, por ordem de importância" do resumo abaixo fica superada por este plano.

**Pacotes.** Cada fase é entregue em pacotes publicáveis, na ordem programada em `pacotes-1.0.md` (23 pacotes, da v0.15 à v1.0).

**Filtro.** Uma ideia entra numa fase se aumentar a imersão ou ajudar em pelo menos um destes pontos: entender em um minuto; cada sessão curta termina com algo que aconteceu; motivo para voltar; não perder o progresso; vontade de mostrar a alguém. O que não passa vai para "Arquivo".

**Limites do navegador (até onde der).** Arquivo único sem servidor nem conta. Orçamento de peso: até 1 MB no `index.html` (hoje cerca de 350 KB). Cena fluida em celular intermediário; se cair, o efeito é desligado nesse aparelho. Tudo que se move respeita movimento reduzido e pode ser pulado. Som sempre com botão de mudo. Sessão de 5 a 15 minutos precisa fechar uma etapa.

**Decisões de ordem, confirmadas pelo usuário em 2026-11-10.**

- Volta a volta vem **antes** do Paddock: é o coração de um manager e responde à queixa principal ("na F1 fica chato"). Os sistemas do Paddock quase não mexem em ritmo de corrida, então a recalibração dupla é pequena.
- Tradução: só a separação dos textos entra cedo (Fase 2, v0.20); traduzir fica para a 1.0.
- Modo fictício: condição de monetizar, não da 1.0.
- Nada de servidor antes da 1.0.

### Agora — pendências curtas, sem versão

- [x] ~~Publicar o bip do rádio.~~ **Feito em 2026-11-09**, commit `adcd8f4`. Efeitos adicionais seguem na Fase 3.
- [ ] Com o usuário, fora do código: 2FA no GitHub e na Cloudflare (S.7), verificar o domínio no GitHub (S.5), e-mail "noreply" nos commits (S.9), renomear o repositório (R.10), conferir marca e domínio (R.11), revisar os textos dos eventos (1.3), jogar uma carreira em celular real (B.11), ouvir o rádio em aparelho real, acompanhar o painel do GoatCounter.
- [ ] v0.14.2, revisão de termos: inglês não adaptado e tradução literal nos textos (parte do 1.3). Trocas publicadas na v0.14.3 em 2026-11-10 (lista em `pacotes-1.0.md`); falta a leitura frase a frase das telas.
- [ ] v0.14.3, modo corrida: primeira arrumação publicada na v0.14.3 em 2026-11-10 (sem Desfazer, tela de corrida enxuta, cabeçalho compacto no celular). Falta o modo paddock com abas e a ficha em página larga; detalhes em `pacotes-1.0.md`. O botão Desfazer (F.6) foi removido a pedido do usuário.
- [ ] Conferir o cartão de compartilhamento aparecendo de verdade no WhatsApp (resto do B.3).
- [ ] Limite de envios do Worker (S.6), cabeçalhos HTTP (S.8), PRs do Dependabot. Proteção da `main` (S.10) segue opcional.

### Fase 1 (v0.15 a v0.18) — Entre corridas

O intervalo entre etapas hoje é o trecho mais vazio. Quase tudo é interface. **Pronto quando:** depois de cada bandeirada o jogador tem algo novo para ler e sabe se foi bem.

- [ ] Caixa de entrada: propostas, recados do chefe, notícias e convites (seção "Ideias de manager do piloto").
- [ ] **Novo:** nota de 1 a 10 por corrida para cada piloto e "piloto do dia".
- [x] ~~Duelo com o companheiro e briefing antes da largada (seção "Ideias de manager do piloto").~~ **Feito** (2026-11-12, v0.16 local, não publicada). Briefing não traz o grid.
- [x] ~~**Novo:** conta do título: quantos pontos faltam e o que acontece em cada cenário.~~ **Feito** (2026-11-12, v0.16 local): pontos do líder, pontos em jogo e média por etapa. **Parcial:** metas na base (D.5) seguem abertas; sem ponto de volta rápida.
- [ ] **Novo:** manchete de jornal em vitórias, títulos e transferências.
- [x] ~~Página da equipe, gráfico da temporada, linha do tempo, radar de atributos e recordes do mundo (seção "Ideias de manager do piloto"); estatísticas completas (2.1), evolução ano a ano (2.2), companheiros de base visíveis (2.3), GP de casa (seção "GP de casa do jogador").~~ **Feito** (2026-11-12, v0.17). Recordes só de temporadas concluídas; ver pacotes-1.0.md.
- [ ] Tutorial na primeira corrida (seção "Ideias de manager do piloto") e **novo:** glossário de F1 em dicas.
- [ ] Talento visível na ficha e troca dos quatro contadores (R.16). **Parcial na v0.16 local (2026-11-12):** talento em faixa e contadores Largadas, Vitórias, Pódios e Pontos; faltam voltas mais rápidas (não existem no save) e o talento de berço. Ficha em faixa horizontal (R.17) segue como ideia guardada.
- [x] ~~Histórico navegável da base e de campeonatos anteriores (seção "Imersão e aproveitamento de tela").~~ **Feito** (2026-11-12, v0.17). Companheiro e campeão só nas temporadas novas.
- [x] ~~Restos de itens já entregues: bandeira nas tabelas de equipes (D.7).~~ **Feito** (2026-11-12, v0.17). 
- [ ] **Novo:** "enquanto você esteve fora" ao reabrir o save e avisos de marco (primeiro pódio, 100 GPs).

### Fase 2 (v0.19 e v0.20) — Alicerce

Protege o progresso e prepara o volta a volta. **Pronto quando:** um save da v0.14 abre em qualquer versão futura e a simulação não trava a tela.

- [ ] Migração de saves (B.7) e captura de erros (B.9).
- [x] ~~Exportar e importar save em arquivo.~~ **Feito**, já disponível antes da v0.14.1, conferido em 2026-11-09. Migração de formato segue em B.7.
- [ ] **Novo:** aviso de duas abas no mesmo save e pedido de armazenamento persistente ao navegador.
- [ ] **Novo:** Web Worker para simular fora da thread da tela.
- [ ] Teste de desempenho em carreira longa e celular fraco (F.17); mais testes de regressão das fórmulas (seção "Pendências de qualidade").
- [ ] Pipeline único de publicação (F.14).
- [ ] **Novo:** ajustador automático de calibração: roda as simulações, compara com as metas de `calibracao.md` e propõe valores para `engine/config.js`. Ferramenta de desenvolvimento, sem IA e fora do navegador; a mudança só entra com aprovação.
- [ ] Separar os textos do código, primeira metade do F.18.
- [ ] Atalhos de teclado (seção "Ideias para evoluir a tela de corrida").
- [ ] **Novo:** acessibilidade além da cor: padrão por equipe, alto contraste e tamanho de fonte. Junto com "cores com significado" (seção "Imersão").
- [ ] Fontes hospedadas no próprio site (B.6, R.9).
- [ ] README para jogadores, changelog e canal da comunidade (B.13).

### Fase 3 (v0.21 a v0.24) — Transmissão

A corrida passa a parecer TV. Só interface, salvo indicação. **Pronto quando:** uma captura da corrida é reconhecida como transmissão de F1 e o jogo soa como uma.

- [ ] **Novo, câmera e carro:** câmera de TV (mapa inclinado em perspectiva, seguindo o carro com zoom); carro com forma (asas, rodas, luz de freio e de chuva); partículas (spray, fumaça de pneu, faíscas, brita). Traçados suavizados (seção "Ideias para evoluir a tela de corrida" e "Depois").
- [ ] **Novo, gráficos de transmissão:** faixa com nome, barra de distância no duelo, volta mais rápida em roxo; volante do piloto com marcha e luzes de giro; pneus vistos de cima; telemetria ilustrativa.
- [ ] Número e rótulos no mapa, destaque do rival da decisão, pit lane, barra de progresso, ícones na narração, classificação animada e carros devagar na pausa (seção "Ideias para evoluir a tela de corrida"). Torre recolhida no celular já publicada na v0.14.1.
- [ ] **Novo, som:** som sintetizado com Web Audio (D.15, 2.8) para luzes de largada, motor, batida e torcida, sem arquivos de áudio.
- [ ] **Novo:** som de rádio no estilo das transmissões de F1 a cada recado do engenheiro. **Parcial (bip publicado em 2026-11-09):** o bip toca quando o recado do engenheiro aparece numa decisão, com botão Som/Mudo no cabeçalho (`ui/sound.js`, `ui/assets/radio.mp3`). O arquivo foi fornecido pelo usuário, que o informou como livre para uso; a origem e a licença não estão documentadas no repositório e entram na revisão prevista antes de monetizar. Vai em base64 no bundle e é decodificado pelo Web Audio, sem mudar a CSP. Falta: bip de fechamento, chiado, filtro de voz e tocar também na narração da cena.
- [ ] **Novo, pista e ambiente:** entorno gerado a partir do traçado (grama, brita, arquibancadas, boxes, zonas de ultrapassagem); corrida noturna com refletores; sombra de nuvem, chuva variável e trilho seco; borracha e marcas de freada.
- [ ] Narrativa da corrida, parte que falta (D.4).
- [ ] **Novo:** gráfico de posições ao final, melhores momentos e replay em câmera lenta do lance decisivo; modo foto da cena.
- [ ] **Novo:** transições entre telas (View Transitions); tela sempre ligada (Wake Lock) e tela cheia durante a cena.
- [ ] **Novo:** radar de chuva com previsão incerta antes da janela de box. *Engine se a incerteza afetar a escolha.*
- [ ] **Novo:** reflexo nas luzes de largada: o tempo de reação vira uma faixa de decisão (boa, média, ruim). *Engine; a faixa entra como decisão para manter o determinismo.*
- [ ] **Novo:** cena em canvas, só se o SVG não sustentar câmera e partículas.

### Fase 4 (v0.25 a v0.27) — Volta a volta

A corrida passa a ser simulada de verdade. *Engine*, com recalibração completa e jogo real como referência (seção "Pendências de qualidade"). **Pronto quando:** a torre mostra diferença em segundos e pneu de cada carro, e as decisões abrem em voltas específicas.

- [ ] Etapa 2 da seção "Tela de corrida estilo manager"; fecha a corrida em momentos (D.2) e a calibração completa da largada (resto do D.2.b).
- [ ] Modelo de tempo de volta, pit stops e pneus de verdade, duelo roda a roda (5.5, 5.6, 5.7).
- [ ] Meteorologia dinâmica (5.3) e regras da FIA: limites de pista, punições e investigações (5.4).
- [ ] Fim de semana completo (5.2): **novo** detalhamento em Q1, Q2 e Q3 com eliminação e fim de semana sprint.
- [ ] **Novo:** acerto simples por pista (asa alta ou baixa) e bateria ou modo de ataque como decisão do piloto.
- [ ] Confiabilidade por componente, troca e punição de grid (4.7).
- [ ] **Novo:** replay de qualquer corrida a partir de seed e decisões guardadas.
- [ ] **Novo, imersão que depende do volta a volta:** câmera onboard em falso 3D nos momentos-chave (largada, ultrapassagem, bandeirada) e volta fantasma contra o companheiro.

### Fase 5 (v0.28 a v0.30) — Paddock

Relações, mercado e contrato. Quase tudo é *engine*. **Pronto quando:** duas carreiras com o mesmo desempenho em pista terminam diferentes por causa das escolhas fora dela.

- [ ] Contratos mais ricos (3.7), com **novo:** status de 1º ou 2º piloto, duração, multa, salário e bônus. Empresário (seção "Ideias de manager do piloto").
- [ ] Rival persistente e rivalidades na história (3.1, 3.2); gatilhos por histórico salvo e convites com conflito de calendário (seção "Imersão").
- [ ] Entrevistas e reputação por equipe, paddock e torcida (seção "Ideias de manager do piloto"); **novo:** promessa pública antes da temporada.
- [ ] Moral e confiança da equipe (3.5); efeito do perfil da equipe nos eventos de equipe (resto do D.17).
- [ ] **Novo:** direção do carro: o piloto dá o feedback que decide se o carro evolui em reta ou em curva.
- [ ] **Novo:** relação com o engenheiro de corrida, afetando a qualidade do recado no rádio.
- [ ] **Novo:** jogo que se adapta ao jogador, sem IA: rivais que aprendem o padrão de decisões (por exemplo, sempre atacar na largada) e passam a responder a ele. Estatística guardada no save, com determinismo por seed e decisões. *Engine.* A dificuldade adaptativa entra com o seletor de dificuldade (F.10), na Fase 6.
- [ ] Mercado, parte 2 (D.8), silly season (D.14), notícias e rumores (3.8), pedir uma equipe específica (2.4).
- [ ] Equipes-satélite (3.3) e academias de verdade (3.4).
- [ ] Ofertas: estrelas e etiqueta de perfil (R.7) e os itens da seção "Entrada no kart por propostas".
- [ ] **Novo:** dinheiro e patrocínio pessoal.
- [ ] **Novo:** capacete e número fixos na carreira, exibidos no mapa e na torre. Junto com a tela própria de criação (R.8).

### Fase 6 (v0.31 a v0.33) — Mundo e base

**Pronto quando:** nenhuma carreira termina em beco sem saída e os anos de base têm corridas.

- [ ] Rotas alternativas em versão leve (3.11, B.12), para as carreiras que caem em "Fim da linha".
- [ ] Mini calendário na base (D.3).
- [ ] Grid real de 2026 e campeões na retrospectiva (seção "Atualizar o grid inicial da F1 em 2026").
- [ ] Pilotos reais na F2 e F3, salto excepcional F4–F2, evolução dos carros da base no save e pacotes da F1 ao longo do calendário (seção "Evolução da carreira de piloto").
- [ ] Orçamento de equipe seguindo o sucesso (3.6).
- [ ] Seletor de dificuldade ou modo assistido (F.10).
- [ ] **Novo:** superlicença por pontos; agenda entre corridas (simulador, físico, patrocinador ou descanso, com fadiga); lesões e forma física; testes de pré-temporada. *Engine e calibração.*
- [ ] Restos e limites conhecidos: nacionalidade nos rivais de base (D.7, D.12), revisão da idade mínima da F2 (D.10), calendário real de 22 etapas contra as 24 do jogo, e dinastia máxima de 9 títulos em parte das sementes (calibração).

### Reta final (v0.34 a v0.36) e v1.0 — Lançamento

**Pronto quando:** quem chega por um link entende, joga, volta e mostra.

- [ ] Desafio da semana por seed e ranking local dos amigos (F.12, 2.5), sem servidor.
- [ ] **Novo:** resultado em emojis para copiar; cartão de resultado em imagem (seção "Ideias de manager do piloto"); retrospectiva de fim de carreira em imagem.
- [ ] Conquistas e hall da fama local (F.16).
- [ ] PWA e modo offline (F.15). Conferir o service worker contra a CSP por hash antes de prometer.
- [ ] Tradução, segunda metade do F.18.
- [ ] **Novo:** ponto de virada da temporada, com opção de rejogar dali; cenários prontos (começar no fundo do grid, salvar a carreira aos 30).
- [ ] **Novo:** mundo persistente: nova carreira no mesmo mundo depois de aposentar, com o piloto antigo no hall da fama ou como mentor. *Engine.*
- [ ] **Novo, 3D leve sem biblioteca (WebGL escrito à mão):** carro girando na garagem com a pintura da equipe e o número, capacete em 3D na criação e pódio em 3D. Dentro do orçamento de peso.

### Talvez — decidir depois de ouvir quem joga

- Modo fictício (B.14, 3.10), obrigatório antes de monetizar.
- "Continuidade fora da F1" completa: WEC, NASCAR, IndyCar, Fórmula E e Super Fórmula com carreira jogável e retorno possível.
- Rádio falado com SpeechSynthesis em pt-BR; vibração no celular.
- Traços de personalidade do piloto; empréstimo a equipe menor; ano de reserva jogável; aposta no regulamento novo; pedir ordem de equipe; vácuo combinado na classificação; corridas-convite únicas; turnê de despedida; apadrinhar um piloto da base. *Engine.*
- Comparador de ofertas lado a lado; calendário com previsão por pista; busca rápida; diário automático da carreira; interface na cor da equipe; apresentação do carro e cena de assinatura; figurinha do piloto.
- Mundo compartilhado por código entre amigos; resultado codificado no link; título e ícone da aba vivos; gestos no celular.

### Arquivo — fora do plano, guardado

- Corrida inteira em 3D com câmera livre. Embutida no bundle não muda a CSP; o custo é o peso (biblioteca 3D leva o arquivo para perto de 1 MB, o orçamento inteiro). Só faria sentido com volta a volta e traçados com largura.
- Aprender com todos os jogadores: usar dados anônimos de partidas para recalibrar o jogo. Depende de servidor e da telemetria (2.6).
- Conteúdo gerado com IA no desenvolvimento (manchetes, narração, eventos), revisado pelo usuário e publicado como texto fixo. Nada de IA rodando no navegador: estoura o orçamento de peso e exige servidor.
- Servidor: backend de ranking e compartilhamento (4.1, B.15), página de compartilhamento (4.2), anti-fraude por replay (4.3), save em nuvem (3.12), telemetria anônima (2.6).
- Mundo profundo: fusões e equipes novas (4.4), pilotos de base com carreira própria (4.5), fornecedor de motor (4.6), teto de custos (5.8), base corrida a corrida (5.9).
- Modo chefe de equipe (seção "Evolução da carreira de piloto").
- Dois jogadores no mesmo aparelho; modo espectador; corrida em janelinha flutuante.
- Paddock como navegação; mapa-múndi do calendário; editor de pintura do capacete; álbum dos pilotos enfrentados; dinastia; comparar carreiras entre slots.

## Resumo do estado (atualizado em 2026-11-08)

O jogo está no ar em https://bandeirada.alexarnoni.com (repositório `alexarnoni/apex`, deploy automático por push na `main`, v0.11.0 implementada: 178 testes Node + 22 de navegador; confirmação da publicação em `HANDOFF.md`). Para retomar, leia também `INDEX.md` e `HANDOFF.md`. Esta seção resume as prioridades; os detalhes de cada item estão nas seções abaixo.

### Feito (neste ciclo)

- **Identidade e publicação:** nome Bandeirada, paleta roxa, logotipo quadriculado, domínio próprio com HTTPS, cartão de compartilhamento, licença "todos os direitos reservados", aviso de projeto de fã e painel de privacidade.
- **Segurança:** política de segurança no site (CSP por hash), Actions fixadas por SHA, Dependabot, alertas, CI, `SECURITY.md`, `security.txt`.
- **Feedback:** botão flutuante, nota de fim de carreira e envio por e-mail por um Worker da Cloudflare (testado de ponta a ponta).
- **Interface:** tema Auto/Claro/Escuro com botão, visual mais vivo e limpo, ficha com medidor circular de habilidade, quadradinhos de Idade/Potencial/Margem, Fama em texto e Estilo, abas "Tabela" e "Etapas", "Sala de troféus", textos de abordagem sem jargão ("pp").
- **Logotipo e favicon corrigidos** (vírgula decimal no SVG), com testes de regressão.
- **Calendário da F1:** 24 pistas reais com nome, local, chance de chuva e traços (rua, potência, técnica) que mexem na corrida; cartão da pista antes de cada etapa.
- **Bandeiras em SVG** (flag-icons, MIT) na ficha, nas pistas e na lista de etapas; seletor de país com nomes.
- **Simulação de corridas corrigida:** resolve eventos sozinha com a opção cautelosa, obedece ordens de equipe, conta o que decidiu, e há caixa para parar nas decisões.
- **Criação e ficha:** idade inicial de 12 a 16 com idade mínima por categoria (F4 15, F3 16, F1 18 confirmadas; F2 17 é convenção do jogo), campo "Nacionalidade" com 255 países e a bandeira dentro da caixa, tabela de estatísticas por categoria e traçado das pistas no cartão da etapa.
- **Corrida em momentos (primeira parte + versão enxuta da segunda):** tela de classificação com o grid de largada, previsão de chuva e estratégia de pneus; decisão de final de corrida (atacar ou administrar); relato da corrida com a causa do abandono.
- **Declínio previsível, veteranos e mercado:** declínio fixo do seu piloto (com a previsão na ficha), veteranos que duram mais e às vezes brigam lá em cima, nomes e nacionalidades por país com bandeira nas tabelas, e mercado com lealdade, equipes irmãs e resumo das trocas na pré-temporada.
- **Realismo do campeão:** grid que não decai (novatos melhores), regulamento com mais peso de orçamento, peso do carro 0,60; teste de regressão em `tests/realism.test.js`.
- **Perfil da equipe nas ofertas (D.17):** ponta (muita pressão, desenvolve rápido se você for bem), meio (pouca pressão, desenvolvimento normal) e fundo (sem pressão, desenvolvimento lento, mais visibilidade a quem se destaca); cartão da oferta redesenhado.
- **Talento de berço e dedicação (D.16):** o corte fixo de potencial na entrada da F1 foi removido; o potencial do jogador é sorteado na criação (poucos geracionais) e cada escolha de treino eleva o teto, com rendimento decrescente. Medido: nunca treina 5% de carreiras com título, treina todo ano na F1 20%, sempre treina 26%.

### Falta, por ordem de importância (critério: o que mais muda a experiência de quem joga, depois o que protege o projeto)

**Pacote v0.10 implementado:** plano persistente, avanço contextual, automático por situação, metas e painel da temporada; página inicial reorganizada. Evidências e limites em `docs/v0.10.md`. Treino livre, boxes e safety car por fases continuam pendentes.

1. **Corrida em momentos completa (D.2, parte 2) e narrativa (D.4).** É a queixa principal ("na F1 fica chato"). Hoje está ativa a **versão enxuta** (classificação com estratégia de pneus, final de corrida e relato); o que falta para a versão completa está listado no item D.2: treino livre, parada de box como momento, safety car e ritmo por volta. Defesa final (D.2.a) e largada (D.2.b) foram publicadas no commit `007b831`.
2. **Mercado de pilotos, parte 2 (D.8) e silly season (D.14).** Falta boato no meio do ano, perfil de cada equipe, academia real e o seu contrato na história. (Declínio previsível D.6, nomes por país D.7 e a primeira parte do mercado já estão feitos.)
3. **Mini calendário na base (D.3) e metas e tensão de temporada (D.5).** Faz a base deixar de ser uma decisão por ano.
4. **Efeitos sonoros (D.15).** Barato e dá muita sensação de jogo; ver o item para as decisões de projeto.
5. **Rivais persistentes (3.1 e 3.2) e estatísticas da carreira com gráfico (2.1 e 2.2).** Sensação de história por pouco custo.
6. **Segurança e lançamento (rápidos, vários são com você):** 2FA no GitHub e na Cloudflare (S.7), verificar o domínio no GitHub (S.5), limite de envios do Worker (S.6), acompanhar os dados do GoatCounter (B.5 já ativado), e-mail "noreply" nos commits (S.9), subdomínio do Worker, 5 PRs do Dependabot.
7. **Rotas alternativas (3.11).** Cerca de 9% das carreiras caem em "Fim da linha", o maior beco sem saída.
8. **Qualidade:** ampliar cenários dos testes de interface (F.13 já implementado), migração de saves (B.7), captura de erros (B.9), teste em aparelhos reais (B.11).
9. **Revisão dos textos dos eventos (1.3):** você lê `docs/textos-eventos.md` e diz o que mudar.
10. **Identidade e acabamento:** mostrar o talento na ficha (hoje só a faixa de potencial), trocar os contadores GP/Vitórias/Pódios/Poles (R.16), lista de países com bandeira em cada linha, ofertas com estrelas (R.7), tela própria de criação (R.8), fontes hospedadas (R.9), ficha em faixa horizontal (R.17), renomear o repositório (R.10), conferir marca e domínio (R.11, é com você).
11. **Mais para frente:** modo fictício antes de qualquer monetização (B.14), ranking e compartilhamento com servidor (4.1 e 4.2), tradução (F.18), o nível "100% real" (seção 5).

### Limites conhecidos

- **Histórico anterior à v0.10; comparação atual em `docs/calibracao.md`.** A taxa de títulos do jogador depende de treinar e das escolhas de oferta: nas simulações históricas de 400 carreiras, nunca treina 5% e a política mista (treina todo ano na F1) 20%. A média do talento de berço (84,5) foi ajustada para compensar o empurrão dos perfis de equipe.
- Na v0.11, em duas das três sementes do balanceamento a maior dinastia chegou a 9 títulos seguidos (alvo < 9).
- Saves antigos guardam textos e dados antigos de uma decisão pendente (abordagens, pista, evento sem `safe`) e pilotos gerados com nomes antigos ("Almeida II") e sem nacionalidade; o potencial do jogador salvo continua o antigo e só passa a subir com o treino daqui para frente. Carreiras novas já saem certas.
- A taxa de títulos depende de a pessoa treinar (5% a 26% nas simulações); o jogador comum fica no meio. O "talento" ainda não aparece de forma legível na ficha (só a faixa de potencial).
- A bandeira em emoji não aparece no Windows; o jogo usa imagens, e códigos de país fora do conjunto embutido caem para o texto do código.
- O calendário real de 2026 caiu para 22 etapas (sem Bahrein e Arábia Saudita); o jogo mantém 24.

## Nível 1: muito fácil (só UI, texto ou dados)

| # | Item | Esforço | Notas |
|---|---|---|---|
| ~~1.1~~ | ~~Mostrar skill, potencial e estilo do jogador na tela~~ | P | ✅ **Feito (2026-11-07).** A tela mostra estilo, Habilidade e faixa de Potencial (rótulos atuais). Decisão tomada: o potencial exato fica escondido; a UI só mostra uma faixa de 10 pontos ("palpite dos olheiros"), calculada em `potentialBand`. Reverter para o valor exato é trocar uma linha em `getView`. |
| ~~1.2~~ | ~~Tutorial curto e glossário (status p1/p2, scouting, confiança, academia)~~ | P | ✅ **Feito (2026-11-07).** Botão "Ajuda" na tela inicial e em toda tela de carreira, com 12 verbetes recolhíveis (objetivo, scouting, academia, estilos, status, ordem de equipe, contrato, eventos, salvar). Os textos não citam números de regra, para não desatualizar com o `config.js`. |
| 1.3 | Revisar e reescrever os textos dos eventos | P | A spec pede revisão sua antes de divulgar. Tudo em `data/events.js`. **Em revisão (2026-11-07):** passada de redação feita por mim nos 28 textos (tom de rádio e manchete, nomes de piloto, rival e equipe, sem frases do tipo "efeito: revelação", rótulos próprios nos botões, "Nada muda" não repete mais). Mecânica e números intactos; resultados de texto agora podem citar nomes (`outcomeText`). **Falta o seu OK:** leia `docs/textos-eventos.md` (gerado por `npm run events`), me diga o que mudar e o item é riscado. |
| ~~1.4~~ | ~~Resumo curto depois de cada corrida (o que decidiu o resultado)~~ | P | ✅ **Feito (2026-11-07).** Cada corrida tem uma frase: largada x chegada (com +/−), chuva, abordagem, evento e ordem de equipe (`raceSummary`). Atualizado em D.4: o relato agora inclui uma causa narrativa de abandono; isso não é uma simulação física por componente. |
| ~~1.5~~ | ~~Revisar nomes e vínculos reais das equipes de base e academias~~ | P | ✅ **Feito (2026-11-07), com ressalva.** Conferido na web: F2 (11 equipes) e F3 (10 equipes) batem com os grids de 2026. Correções: F3 sem a Jenzer (a DAMS entrou no lugar em 2025-2027, grid de 20), "Invicta Virtuosi Racing" virou "Invicta Racing", e duas marcas de kart que não consegui confirmar foram trocadas (Exprit e Kosmic). Calibração da base mantida (91% chegam à F1). Ressalvas: F4 e kart variam por país e por ano, então são equipes reais, mas não um grid oficial; Prema-Ferrari é parceria longa e documentada, mas DAMS-Alpine continua aproximação de jogo (não achei confirmação atual). |
| ~~1.6~~ | ~~Cartão de oferta com mais dados (histórico recente, vantagens e riscos)~~ | P | ✅ **Feito (2026-11-07), sem o histórico.** Cada oferta, na base e na F1, lista vantagens (+) e riscos (−): carro, companheiro (quem é mais forte), academia, confiança perdida ao trocar. O histórico recente da equipe não entrou: as equipes de base não guardam histórico (força fixa), e na F1 só o campeão do ano é registrado. Fica como ideia se o histórico passar a existir (item 4.4/4.5). |
| ~~1.7~~ | ~~Ajustes de mobile e acessibilidade~~ | P | ✅ **Feito (2026-11-07).** Foco vai ao título a cada troca de tela; `#app` deixou de ser `aria-live` (relia a tela inteira a cada clique), com avisos como `role="status"`/`alert`; contornos de foco em campo de texto, resumo e links; texto só para leitor de tela nas vantagens e riscos; cor de "vantagem" escurecida no tema claro para contraste. Conferido a 375px percorrendo uma carreira inteira (399 passos, 260 telas): nenhuma tela estourou na horizontal. Não testei com leitor de tela de verdade. |
| ~~1.8~~ | ~~Mais eventos narrativos (patrocínio, família, mídia, engenheiro de pista)~~ | P por evento | ✅ **Feito (2026-11-07).** 8 narrativos novos (patrocínio, engenheiro de pista, simulador, conselho de família, crise na equipe, entrevista viral, revelação do ano, fã-clube) e 2 de corrida (largada confusa, bandeira amarela), só em `data/events.js`. Total: 19 narrativos e 9 de corrida. Textos são rascunho meu, sujeitos à revisão do 1.3. |

## Nível 2: fácil (pouca lógica nova na engine)

| # | Item | Esforço | Notas |
|---|---|---|---|
| 2.1 | Estatísticas de carreira completas (por equipe, recordes, comparação com o companheiro) | P-M | A engine guarda `seasons`; falta agregar e exibir. |
| 2.2 | Gráfico de evolução do jogador ano a ano | P-M | Guardar um ponto por temporada no estado. |
| 2.3 | Companheiros de base visíveis (quem correu ao seu lado) | M | Hoje o grid de base é descartável; guardar o companheiro de equipe por temporada. |
| 2.4 | Pedir uma equipe específica numa oferta | M | Regra nova: aceita ou recusa pela nota. |
| 2.5 | Ranking local e botão de "copiar carreira" mais completo | P | Já existe o resumo copiável; ampliar com linha do tempo. |
| 2.6 | Telemetria anônima para calibrar com jogo real | M | Exige um destino para os dados (ver 4.1). |
| ~~2.7~~ | ~~Salvar carreira de verdade (export e import de arquivo)~~ | M | ✅ **Feito (2026-11-07)** em F.7: três slots e arquivos JSON com versão. Migração de formato permanece aberta em B.7. |
| 2.8 | Som e animação leve | M | Só front-end. |

## Nível 3: médio (sistemas novos, mas isolados)

| # | Item | Esforço | Notas |
|---|---|---|---|
| 3.1 | Rival persistente do kart até a F1 (evento `rival_reencontro`) | M | Mantê-lo no estado e inseri-lo no mundo da F1. Hoje o "rival do ano" é só o piloto de skill mais próxima. |
| 3.2 | Rivalidades na história (quem te venceu, duelos marcantes) | M | Depende de 3.1. |
| 3.3 | Equipes-satélite e cláusula de renovação na entrada da F1 | M | Descrito em `spec-sistemas`. |
| 3.4 | Academias de verdade (benefícios e cobranças) | M | Vincula convite de academia a equipes da F1. |
| 3.5 | Moral e confiança da equipe como força invisível (README) | M | Modulador sobre ofertas e desenvolvimento. |
| 3.6 | Orçamento de equipe seguindo o sucesso, com piso (README) | M | Mexe no desenvolvimento do carro; recalibrar o `npm run balance`. |
| 3.7 | Contratos mais ricos (cláusula de performance, rescisão) | M | Estende o `contract_terms`. |
| 3.8 | Mercado de transferências com notícias e rumores | M | Texto gerado a partir do mercado que já existe. |
| ~~3.9~~ | ~~Atributos separados do piloto~~ | M-G | **Feito (2026-11-08), v0.11.** Classificação, corrida, consistência, chuva, pneus e contribuição técnica; largada continua escolha/risco, sem atributo separado. Treino e declínio por dimensão. |
| 3.10 | Modo fictício (arquivo de substituição de nomes) (README) | M | Dados já estão em arquivos; falta um seletor e geração de nomes. |
| 3.11 | Rotas alternativas (Super Fórmula, IndyCar, Fórmula E) como tabela leve que regenera o scouting (README) | M-G | Hoje a rota alternativa é tela terminal. Inclui legado e `altRouteTitles`. |
| 3.12 | Salvar e recarregar em nuvem | M | Depende de 4.1. |

## Nível 4: difícil (infraestrutura ou mudança grande de escopo)

| # | Item | Esforço | Notas |
|---|---|---|---|
| 4.1 | Backend de ranking e compartilhamento (FastAPI + Postgres) | G | Especificado em `spec-backend`: nota recalculada no servidor, plausibilidade, rate limit. |
| 4.2 | Página de compartilhamento com card da carreira | M-G | Depende de 4.1. |
| 4.3 | Anti-fraude forte por replay determinístico no servidor | G | A arquitetura já permite (engine isomórfica + seed + decisões); falta o executor. |
| 4.4 | Mundo vivo mais rico (fusões, saída de marcas, equipes novas) | G | Reescreve partes do mercado e do orçamento. |
| 4.5 | Pilotos de base com carreiras próprias (sobem e caem) | G | O grid deixa de ser descartável; custo de simulação aumenta. |
| 4.6 | Fornecedor de motor e mudança de regulamento por fábrica | G | Substitui o `regulation` atual; recalibrar dinastias. |
| 4.7 | Confiabilidade por componente, troca e punição de grid | G | Exige estado de componentes por carro. |

## Nível 5: muito difícil (o caminho do "100% real")

Cada item muda decisões já fechadas (base resumida, sem economia, resultado por ordem de chegada). Fazer em ordem, porque um depende do outro.

| # | Item | Esforço | Notas |
|---|---|---|---|
| ~~5.1~~ | ~~Calendário e pistas reais com características diferentes~~ | G | ✅ **Feito (2026-11-07)** na versão simplificada D.1: 24 pistas, traços e chuva por pista com efeito no motor. Meteorologia dinâmica e modelo detalhado continuam em 5.3/5.5. |
| 5.2 | Fim de semana completo (treinos livres, Q1/Q2/Q3, sprint, corrida) | G | Muda o ritmo e o número de decisões por corrida. |
| 5.3 | Meteorologia dinâmica durante a corrida | G | Hoje a chuva é sorteada uma vez por corrida. |
| 5.4 | Regras da FIA (limites de pista, punições, bandeira vermelha, safety car) | G | O invariante do README vale: aplicar antes da premiação. |
| 5.5 | Modelo de tempo de volta (degradação de pneu, combustível, tráfego) | G+ | Substitui o `simWeekend`; é a maior reescrita da engine. |
| 5.6 | Pit stops e estratégia de pneus de verdade | G+ | Depende de 5.5. |
| 5.7 | Duelo roda a roda, DRS e incidentes com consequência | G+ | Depende de 5.5 e 5.6. |
| 5.8 | Desenvolvimento com teto de custos e túnel de vento limitado | G | Depende de 4.6. |
| 5.9 | Base simulada corrida a corrida (e não uma temporada resumida) | G+ | Contradiz a decisão atual de 3 a 5 minutos até a F1; precisa de nova decisão de produto. |

## Funcional: o que faz o jogo funcionar de verdade (transversal)

Itens que não são "recurso de jogo", mas decidem se dá para jogar sem perder progresso e testar com amigos. Ordenados do mais fácil ao mais difícil. Vários valem mais que itens dos níveis 3 a 5; a coluna Nível indica onde caberiam na tabela principal.

| # | Item | Esforço | Nível | Notas |
|---|---|---|---|---|
| ~~F.1~~ | ~~Transformar o projeto em repositório git~~ | P | 1 | ✅ **Feito (2026-11-07).** `git init` na branch `main`, `.gitignore` (node_modules, dist) e primeiro commit. |
| ~~F.2~~ | ~~Mostrar a seed na tela durante o jogo~~ | P | 1 | ✅ **Feito (2026-11-07).** Chip "seed N" no cabeçalho de toda tela de carreira; a view expõe `seed`. |
| ~~F.3~~ | ~~Explicar o porquê (nota de scouting, status, oferta) em uma linha~~ | P | 1 | ✅ **Feito (2026-11-07).** Nota de scouting com as parcelas somadas (resultado, carro fraco, academia, fama, idade) e o que cada tipo de oferta exige; status com "Por quê" (sem mostrar skill); cada oferta de base e de F1 com uma linha de motivo. A engine expõe `scoutingBreakdown` e `statusWhy`. |
| ~~F.4~~ | ~~Tela de erro útil com "copiar relatório" (estado, seed, últimas decisões)~~ | P | 1 | ✅ **Feito (2026-11-07).** O estado guarda `history` (tipo e resposta de cada decisão); o botão "Copiar relatório do erro" junta mensagem, seed, versão, fase, últimas 15 decisões e navegador. Esse histórico também serve de base para o replay do item 4.3. |
| ~~F.5~~ | ~~`engineVersion` no snapshot e aviso de save antigo~~ | P | 1 | ✅ **Feito (2026-11-07).** `ENGINE_VERSION` em `engine/game.js` (subir quando o formato do estado mudar); save de outra versão é descartado com aviso na tela inicial. |
| ~~F.6~~ | ~~Desfazer a última decisão~~ | P-M | 2 | ✅ **Feito (2026-11-07).** Botão "Desfazer" no cabeçalho, até 30 passos, só em memória (some ao recarregar a página). Repetir a mesma decisão depois de desfazer dá o mesmo resultado (testado). |
| ~~F.7~~ | ~~Salvar na máquina (`localStorage`), com alguns slots e exportar arquivo~~ | M | 2 | ✅ **Feito (2026-11-07).** 3 slots com autosave a cada decisão (`ui/saves.js`, testado em Node), tela "Suas carreiras" (continuar, salvar em arquivo, apagar com confirmação), importar arquivo `.json` (rejeita arquivo inválido, de outra versão ou corrompido) e botão "Menu" sem perder a carreira. Sem `localStorage` (modo privado, `data:`), o jogo avisa e segue sem salvar. No Artifact o arquivo sai pela capacidade `downloads` (o viewer confirma o download). Não migra saves antigos de `sessionStorage`. |
| ~~F.8~~ | ~~Controle de velocidade (simular 5 corridas, até o próximo evento, pular eventos sem escolha)~~ | M | 2 | ✅ **Feito (2026-11-07).** Botões "Simular 5 corridas" e "Simular o resto da temporada" (abordagem equilibrada); por padrão resolve estratégia, final e eventos de corrida com opção segura e obedece às ordens; a caixa de parada permite decidir essas situações. Eventos narrativos com escolha continuam interrompendo. Mostra resultados e motivo da parada. "Até o próximo evento" é esse mesmo comportamento, então não virou botão separado. Opção "Resolver sozinho eventos sem escolha" (ligada por padrão): evento de uma opção só é resolvido na hora e o resultado aparece no cartão seguinte. |
| ~~F.9~~ | ~~Formulário de feedback com resumo da carreira, seed e texto~~ | M | 2 | ✅ **Feito (2026-11-07).** Botão "Feedback" na tela inicial e em toda tela de carreira: tipo (bug, balanceamento, ideia, outro), texto, opção de incluir seed, versão e últimas decisões (ou todas, para repetir o problema) e "Copiar feedback" (com campo de apoio se o navegador negar o clipboard). Com `BANDEIRADA_FEEDBACK_URL` no build, aparece também "Enviar pelo GitHub" (issue com título e corpo preenchidos, corpo cortado para caber na URL). Lógica em `ui/feedback.js`, testada. |
| F.10 | Seletor de dificuldade ou modo assistido | M | 2 | Ajusta potencial e frequência de eventos; exige recalibrar cada nível. |
| ~~F.11~~ | ~~Hospedagem fora do Artifact (Cloudflare Pages ou GitHub Pages)~~ | M | 2 | ✅ **Feito (2026-11-07).** Site público em **https://bandeirada.alexarnoni.com** (endereço antigo `alexarnoni.github.io/apex` redireciona), repositório público https://github.com/alexarnoni/apex. O workflow `.github/workflows/pages.yml` roda `npm test` (Node 22, Linux) e `npm run build` a cada push na `main` e publica sozinho; o botão "Enviar pelo GitHub" do feedback abre issue nesse repositório. O Artifact antigo continua no ar, mas a versão pública é a do GitHub Pages. |
| F.12 | Desafio diário (uma seed por dia) e ranking local dos amigos | M | 3 | Funciona sem backend, com o resumo copiado. |
| ~~F.13~~ | ~~Testes automáticos da interface~~ | M | 3 | ✅ **Feito na v0.10 (2026-11-08).** Comando separado `npm run test:ui`: 18 testes desktop/celular incluindo carreira inteira por cliques, contratos e legado. CI executa Node e navegador. Ampliações de cenários continuam possíveis; aparelhos reais são B.11. |
| ~~F.13.a~~ | ~~Suite inicial de navegador para os fluxos de corrida e save~~ | M | 3 | ✅ **Feito e publicado (2026-11-08), commit `007b831`.** 10 testes passaram localmente e no pipeline; capturas inspecionadas. Corrigidos anúncio acessível da importação e sobreposição do feedback no celular. |
| F.14 | Pipeline único de publicação (`npm run release`) | M | 3 | Roda testes e balanceamento, constrói e publica; evita publicar versão quebrada. |
| F.15 | PWA e modo offline | M | 3 | O jogo todo já roda no cliente. |
| F.16 | Conquistas e hall da fama local | M | 3 | Dá objetivo a quem já ganhou um título. |
| F.17 | Teste de desempenho em carreira longa e celular fraco | M | 3 | Cada transição clona o estado inteiro; medir antes de o mundo crescer. |
| F.18 | Tradução (i18n): separar os textos do código | M-G | 4 | Mais barato fazer antes de o volume de texto crescer. |

## Beta público e profissional (transversal)

O que separa "amigos testando" de um beta público com cara profissional. O jogo roda todo no navegador, então o site é estático (CDN, custo zero, muita gente jogando ao mesmo tempo não pesa); o Worker de feedback já é um componente de servidor; backend de ranking e compartilhamento continua planejado (4.1). Ordenado do mais fácil ao mais difícil.

| # | Item | Esforço | Notas |
|---|---|---|---|
| ~~B.1~~ | ~~Aviso de projeto de fã e painel "Sobre e privacidade"~~ | P | ✅ **Feito (2026-11-07).** Rodapé em toda tela e painel com aviso (sem vínculo com a F1, a FIA, equipes e pilotos), privacidade (save só no navegador, análise sem cookies se ativada, Google Fonts vê o IP) e link do código. |
| ~~B.2~~ | ~~LICENSE~~ | P | ✅ **Feito (2026-11-07).** Todos os direitos reservados (decisão sua), em português e inglês; `package.json` com `UNLICENSED`. Mantém a porta aberta para monetizar e dá para abrir depois. |
| ~~B.3~~ | ~~Favicon, descrição e cartão de compartilhamento~~ | P | ✅ **Feito (2026-11-07), a confirmar no ar.** Título, descrição, ícone, `canonical`, `og:*` e `twitter:*` no cabeçalho do site (`tools/site-head.js`, testado) e imagem 1200×630 em `ui/assets/og.jpg`. Falta ver o cartão aparecendo de verdade no WhatsApp depois do deploy: os raspadores guardam cache e eu não consigo testá-los daqui. |
| ~~B.4~~ | ~~Domínio `bandeirada.alexarnoni.com`~~ | P | ✅ **Feito (2026-11-07).** CNAME `bandeirada` → `alexarnoni.github.io` (proxy desligado), domínio ligado no Pages, certificado aprovado, HTTPS obrigatório. Verificado no ar: título, `canonical`, `og:image` e `og.jpg` já usam o endereço novo; `alexarnoni.github.io/apex` e `http://` redirecionam (301) para o HTTPS novo. |
| ~~B.5~~ | ~~Análise de uso (GoatCounter)~~ | P | ✅ **Ativado (2026-11-08).** Código `alexarnoni` fornecido pelo usuário, variável configurada e deploy `42524872452` aprovado. Script `gc.zgo.at/count.js`, endpoint e CSP conferidos no site; marcos de carreira ligados. Painel `https://alexarnoni.goatcounter.com`; dados recebidos no painel ainda não inspecionados. Sem histórico retroativo pelo contador. [Condições atuais do serviço](https://www.goatcounter.com/): gratuito para uso público razoável, incluindo pequenos/médios negócios; milhões de pageviews/dia fora desse uso. |
| B.6 | Fontes hospedadas no próprio site (sai o Google Fonts) | P-M | Evita expor o IP do visitante ao Google e acelera o primeiro carregamento. Exige baixar os arquivos das fontes (Barlow, Barlow Condensed, IBM Plex Mono, todas com licença livre). |
| B.7 | Migrar saves entre versões do jogo | M | Hoje, ao mudar o formato, o save antigo é descartado. Com muita gente jogando isso vira perda de carreira. Mínimo: avisar para exportar antes; ideal: migração por versão. |
| ~~B.8~~ | ~~Feedback sem conta no GitHub~~ | M | ✅ **Feito (2026-11-07).** Worker `bandeirada-feedback` publicado na Cloudflare e ligado ao jogo (`BANDEIRADA_FEEDBACK_ENDPOINT`). Testado no ar: origem errada e robô sem `Origin` recebem 403, o pré-voo CORS libera só o domínio do jogo, e um envio feito pelo próprio jogo em `bandeirada.alexarnoni.com` chegou na caixa de entrada, sem violação de CSP. Pendências do Worker: regra de Rate Limiting da Cloudflare (S.6) e decidir o subdomínio `workers.dev`, que hoje contém parte do e-mail pessoal. |
| B.9 | Captura automática de erros | M | Hoje um erro só chega se o jogador copiar o relatório. Opções: Sentry (plano gratuito) ou um envio próprio. |
| ~~B.10~~ | ~~Teste automático da interface no CI (F.13)~~ | M | ✅ **Feito**; workflows de PR e Pages executam a suite. V0.10 amplia para 18 testes, incluindo carreira inteira. A instalação/pipeline já foi comprovada no deploy `42520319063`; execução da suite ampliada acompanha o lote v0.10. |
| B.11 | Teste em aparelhos reais (iOS Safari, Android, Firefox) | M | Só foi testado em Chromium emulado. Cuidado com `localStorage` no modo privado do iOS. |
| B.12 | Rotas alternativas (3.11) | M-G | Cerca de 9% das carreiras caem em "Fim da linha". Para público de fora, é o maior beco sem saída. |
| B.13 | README para jogadores, changelog e canal da comunidade | M | O README atual é de quem desenvolve. Já existe histórico técnico em `docs/versoes.md`; faltam uma página voltada ao jogador e um grupo (WhatsApp ou Discord) para o feedback. |
| B.14 | Modo fictício antes de qualquer monetização (3.10) | M | O jogo usa nomes e marcas reais. Isso é aceitável como projeto de fã sem fins lucrativos; com anúncios, venda ou assinatura o risco de notificação por marca e direito de imagem sobe muito. Troca de nomes é só trocar arquivos de dados. Reavaliar as condições dos serviços e a licença conforme a forma de monetização; o GoatCounter atualmente admite pequenos/médios negócios no uso público razoável. |
| B.15 | Backend de ranking e compartilhamento (4.1) | G | Só aqui entra servidor (FastAPI + Postgres, atrás da Cloudflare, com limite de requisições e backup). A carga é pequena: um envio por carreira terminada. O risco real é fraude no ranking (replay no servidor, 4.3). |
| ~~B.16~~ | ~~Botão de feedback flutuante e janela de envio~~ | P | ✅ **Feito (2026-11-07).** Botão fixo no canto, em todas as telas; abre uma janela por cima (Esc e clique fora fecham, foco e leitor de tela tratados). O botão do cabeçalho foi removido. |
| ~~B.17~~ | ~~Pedir nota e comentário no fim da carreira~~ | P | ✅ **Feito (2026-11-07).** Cartão com nota de 1 a 5 e comentário opcional na tela de legado e na de fim da linha; leva o resumo da carreira se o jogador deixar marcado. |

## Segurança (2026-11-07)

O jogo é um site estático, sem conta de usuário nem cookies; a superfície de ataque é pequena. Medido: `npm audit` com 0 vulnerabilidades, nenhuma dependência de produção, varredura de segredos e proteção contra push de segredo ativas.

| # | Item | Estado |
|---|---|---|
| ~~S.1~~ | ~~Content-Security-Policy com hashes (script e estilo embutidos), sem `unsafe-inline` nem `unsafe-eval` em script~~ | ✅ Feito. Gerada no build (`buildCsp`) e testada: os hashes batem com a página real. Conferido num navegador: carreira completa sem violações, e confirmado que bloqueia script injetado, script e imagem de fora, `fetch` externo e `eval`. |
| ~~S.2~~ | ~~GitHub Actions fixadas por SHA de commit~~ | ✅ Feito. Os 5 SHAs foram conferidos contra as tags. O Dependabot propõe as atualizações. |
| ~~S.3~~ | ~~Dependabot (npm e Actions), alertas e correções automáticas, CI em pull requests~~ | ✅ Feito. `dependabot.yml`, `ci.yml` (testa e constrói sem publicar). |
| ~~S.4~~ | ~~`SECURITY.md`, `security.txt` (RFC 9116) e relato privado de vulnerabilidade~~ | ✅ Feito. O contato é o relato privado do GitHub, sem expor e-mail. |
| S.5 | Verificar o domínio no GitHub (evita sequestro do subdomínio) | Aberto, é com você: GitHub (conta) > Settings > Pages > Add a domain, e um registro TXT na Cloudflare. |
| S.6 | Worker de feedback: regra de Rate Limiting da Cloudflare e, se houver spam, Turnstile | Aberto. O limite por IP em memória é só a primeira barreira, e a checagem de origem não é segurança de verdade (qualquer cliente fora do navegador forja o cabeçalho). |
| S.7 | 2FA (de preferência passkey) no GitHub e na Cloudflare | Aberto, é com você. |
| S.8 | Cabeçalhos HTTP (HSTS, `X-Content-Type-Options`, `frame-ancestors`, `Referrer-Policy`) | Aberto. O GitHub Pages não deixa configurar; exige pôr a Cloudflare na frente (proxy ligado, SSL Full strict). |
| S.9 | E-mail pessoal nos commits públicos | Aberto, decisão sua. Passar a usar o e-mail "noreply" do GitHub nos próximos commits; o histórico só muda com reescrita e `force push`. |
| S.10 | Proteção da branch `main` | Opcional: com uma pessoa só e deploy por push, exigir PR atrapalha mais do que protege. |
## Identidade e redesenho: Bandeirada (2026-11-07)

O jogo se chamava Apex e usava preto com amarelo, que é a identidade da equipe fictícia do filme de F1. Passou a se chamar **Bandeirada** ("Da largada à bandeirada"), com uma identidade própria. O F1 Glory é só inspiração de estrutura de informação: layout, textos, ícones e logotipos de equipes não foram copiados.

| # | Item | Estado |
|---|---|---|
| ~~R.1~~ | ~~Nome Bandeirada e slogan "Da largada à bandeirada"~~ | ✅ Feito. Nome internos antigos (`apex.slot`, `app: 'apex'`) ficaram de propósito, para não apagar saves existentes. |
| ~~R.2~~ | ~~Paleta roxo de cronometragem, tema claro e escuro~~ | ✅ Feito. O roxo é a cor da volta mais rápida na telemetria; as cores das equipes aparecem só como dado (faixas e bolinhas). Em 2026-11-07 ganhou um botão de tema no cabeçalho (Auto, Claro, Escuro; Auto segue o sistema), salvo no navegador. |
| ~~R.3~~ | ~~Logotipo (bandeira quadriculada 4x3), favicon e cartão de compartilhamento~~ | ✅ Feito. O cartão `ui/assets/og.jpg` foi refeito com a marca nova. |
| ~~R.4~~ | ~~Layout em 3 colunas no desktop (ficha, decisão, painel) e decisão primeiro no celular~~ | ✅ Feito. Conferido a 375 px numa carreira inteira, sem estouro horizontal. |
| ~~R.5~~ | ~~Ficha do piloto: habilidade em destaque, dorsal, bandeira, estilo, idade, fama, equipe, GP, vitórias, pódios, poles, sala de troféus, contrato e confiança~~ | ✅ Feito. A engine entrega os totais da carreira (`career`). |
| ~~R.6~~ | ~~Painel da temporada: abas Tabela e Etapas, pilotos e construtores, setas de variação~~ | ✅ Feito. As abas se chamavam "Classificação" e "Corrida a corrida" (R.15 trocou). |
| R.7 | Ofertas com estrelas do carro e etiqueta curta de perfil (texto nosso) | Aberto. Hoje as ofertas têm vantagens e riscos. |
| R.8 | Tela de criação de piloto própria: número com prévia ao vivo, bandeiras em imagem com busca, estilos com arquétipos | **Parcial.** As bandeiras em SVG já estão no jogo (flag-icons, MIT, 26 países, embutidas; o brasão do México e da Espanha foi removido por peso), na ficha, nas pistas e na lista de etapas, e a lista de países da criação mostra nomes. Faltam prévia ao vivo, busca e arquétipos. |
| R.9 | Fontes hospedadas no próprio site (junto com B.6) | Aberto. |
| R.10 | Renomear o repositório do GitHub para `bandeirada` | Aberto, decisão sua: muda o endereço do Pages e os comandos do README. |
| R.11 | Conferir marca e domínio (INPI, Registro.br, Google e lojas de apps) | Aberto, é com você: não dá para verificar daqui. |
| ~~R.12~~ | ~~Logotipo e favicon com número inválido (`x="10,5"`)~~ | ✅ Feito (2026-11-07). O PowerShell em pt-BR escreveu vírgula decimal e 9 dos 12 quadrados sumiram no ar. Corrigido, com testes de regressão no logotipo, no favicon e no build, e conferido no site publicado. |
| ~~R.13~~ | ~~Visual mais vivo: cartões arredondados com filete roxo, faixa quadriculada no topo, gradientes e brilho nos botões, cor por categoria na pirâmide, medalhas no top 3, selos verde e vermelho nas variações, contadores em quadradinhos~~ | ✅ Feito (2026-11-07). Pedido: as primeiras cores ficaram "chapadas". A segunda rodada limpou o excesso (fundo neutro, ficha sem banner pesado) para ficar no espírito de um painel de jogo de gestão, sem copiar. |
| ~~R.14~~ | ~~Atributos do piloto em barras na ficha: Habilidade (com a faixa do Potencial marcada), Fama em texto (Desconhecido, Promessa, Conhecido, Famoso, Estrela, Lenda) e Estilo com explicação~~ | ✅ Feito (2026-11-07). Nomes escolhidos por você: **Habilidade** (antes "Nível", o overall) e **Potencial** (antes "Teto estimado"). Os cortes da fama (2, 6, 12, 22, 35) são palpite e podem ser calibrados. |
| ~~R.15~~ | ~~Diferenciar do F1 Glory nos detalhes: "Vitrine" virou "Sala de troféus", abas viraram "Tabela" e "Etapas", e o quadrado do overall virou um medidor circular (anel da habilidade e arco fino do potencial)~~ | ✅ Feito (2026-11-07). |
| R.16 | Trocar os quatro contadores (hoje GP, Vitórias, Pódios, Poles, na mesma ordem do F1 Glory), por exemplo para Largadas, Vitórias, Pódios e Voltas mais rápidas | Aberto. Era a sugestão 2 da diferenciação; ficou de fora por ora. |
| R.17 | Ficha em faixa horizontal no topo e duas colunas embaixo, em vez de três colunas | **Salvo para depois (ideia 4 da diferenciação).** Muda bastante o layout (R.4); fazer só se o resto não bastar para ter identidade própria. |
## Dinamismo: o jogo ficou repetitivo (2026-11-07)

Feedback de quem jogou: na F1 cada corrida é a mesma escolha de três botões (Arriscado, Equilibrado, Conservador, com efeito de ±2) e um resultado em uma linha; na base é uma decisão por temporada. Pedido: pistas com nome, F1 mais dinâmica e a base também. Ordem combinada: calendário com pistas, corrida em momentos (F1), mini calendário na base.

| # | Item | Estado |
|---|---|---|
| ~~D.1~~ | ~~Calendário da F1 com 24 pistas reais (`data/circuits.js`): nome do GP, local, bandeira, etiquetas e chance de chuva por pista~~ | ✅ Feito (2026-11-07). Etiquetas mexem no motor (`CONFIG.tracks`): **rua** (largada vale mais, +2pp de abandono), **potência** (o carro pesa +0,04), **técnica** (o piloto pesa mais, −0,04). Chuva por pista, média ≈ 0,14 (antes 0,15 fixo). Balanceamento mantido (12,0 campeões por era, alvo 8–13). A UI mostra o cartão da pista antes de cada corrida, o nome do GP no título, na lista de etapas e no resultado. O calendário real de 2026 caiu para 22 etapas (sem Bahrein e Arábia Saudita); o jogo mantém as 24 originais. Sem mudar o formato do save. |
| D.2 | Corrida em momentos (F1): treino livre, classificação e corrida viram telas curtas com decisões de verdade (pneus, quando parar, atacar ou defender, chuva) | **Primeira parte feita (2026-11-08).** O fim de semana agora tem: abordagem, **classificação com estratégia de pneus** (nova decisão `race_strategy`: grid de largada, previsão de chuva, traços da pista e três opções), evento de corrida (os 9 que já existiam), ordem de equipe e resultado. A estratégia é uma aposta de 1 ou 2 posições cuja chance depende de quão bem a escolha combina com a pista (macios na rua, duros na pista técnica), a largada (quem sai atrás precisa arriscar) e o clima (pneus de chuva no molhado), em `engine/strategy.js` e `CONFIG.strategy`. A escolha padrão tem encaixe 0 (média zero), então a simulação automática não desequilibra o campeonato; a simulação usa sempre a padrão. Medido com a política passiva (900 carreiras): 92% chegam à F1, 17% ganham ao menos um título (antes da estratégia: 14% em 300 carreiras; o ruído com 300 é de uns 2 pontos), 0,28 títulos e 8,8 vitórias por carreira. **Segunda parte, VERSÃO ENXUTA ATIVA (2026-11-08):** só entrou o **final de corrida** (`race_finale`): nas etapas em que há um rival logo à frente (de outra equipe, 50% das vezes) o jogo pergunta se você ataca ou administra. Atacar rende +1 ou −1 posição e a chance depende de quem tem mais ritmo (carro e habilidade pelo peso da categoria, `paceEdge` em `engine/strategy.js`); a tela diz se o rival parece mais rápido, mais lento ou parecido. Administrar não muda nada e é a escolha da simulação automática. Entra no relato como "Final (Atacar)". Testes em `tests/finale.test.js`. **Estado dos passos para a versão completa (concluídos riscados):** (1) **treino livre** como tela (aprender o carro, dados para a classificação); (2) ~~**decisão de largada** (atacar ou segurar na primeira curva, com risco de toque)~~: **feito localmente em D.2.b (2026-11-08)**; (3) ~~**defender** posição quando o rival vem atrás~~: **feito localmente em D.2.a (2026-11-08)**; (4) **parada de box como momento próprio** (quando parar, undercut e overcut, em vez de a estratégia ser um sorteio único antes da corrida); (5) **safety car e bandeira vermelha** como eventos que mudam a corrida de todos; (6) **abandonos e ultrapassagens dos rivais** no relato, com nome; (7) **ritmo por volta** de verdade, que exige reescrever o `simWeekend` (itens 5.5 a 5.7) e é o que torna as decisões acima consequência da simulação e não apostas sobre um resultado já sorteado. O item 1 é médio; os itens 2 e 3 estão implementados localmente; 4 a 6 são grandes; 7 é a maior reescrita do motor. O resultado ainda é simulado de uma vez e a estratégia move o jogador depois (aposta sobre o resultado), não por volta; fazer por fases de verdade exigiria reescrever o `simWeekend` (itens 5.5 a 5.7). |
| ~~D.2.a~~ | ~~Defender posição no final da corrida~~ | ✅ **Feito e publicado (2026-11-08), commit `007b831`.** Rival mais rápido atrás pode gerar defesa, inclusive quando o jogador lidera. Defender pode manter a posição, perder uma ou até duas por erro; ceder perde uma sem disputar. Chance de segurar depende do ritmo relativo, com parâmetros em `CONFIG.strategy.finale.defense`. Companheiros e abandonos não geram perseguidor elegível. Resultado e relato entram antes dos pontos; decisões antigas sem `mode` seguem como ataque. A simulação automática cede nessas situações, portanto as taxas históricas precisam de nova medição. Testes de defesa, save JSON, imutabilidade e pontuação: **153 testes passando**, build aprovado. Não conclui o D.2 inteiro. |
| ~~D.2.b~~ | ~~Decisão de largada e risco na primeira curva~~ | ✅ **Feito e publicado (2026-11-08), commit `007b831`.** Nova decisão `race_start` entre pneus e eventos: atacar ou largar com margem. Ataque pode ganhar uma posição, perder uma, manter ou causar abandono por toque; chuva e rua elevam contato, e estilo agressivo melhora a chance de ganhar. Na pole só há largada com margem; a opção única é resolvida se o modo de resolução automática estiver ligado. Simulação usa `hold`, neutro sobre a ordem bruta e sem sorteio extra nessa escolha. Não é simulação por volta: aplica efeito sobre o resultado já sorteado, antes dos pontos. Relato registra a decisão e a causa específica de abandono, sem inventar eventos posteriores ao toque. Saves JSON e políticas de simulação atualizados; **158 testes e build aprovados**. Calibração completa ainda pendente. |
| D.3 | Mini calendário na base: 3 a 5 etapas-chave por temporada, com pista e uma decisão em cada | Aberto. Reaproveita D.1 e D.2 em versão curta; a base ainda não tem pistas. |
| D.4 | Narrativa da corrida: resumo do que aconteceu (largada, ultrapassagens, safety car, abandonos de rivais) em vez de uma linha | **Parcial (2026-11-08).** Cada corrida tem um relato do jogador: largada (posição na primeira volta, um caminho plausível entre o grid e a chegada), estratégia e seu resultado, evento de corrida e ordem de equipe, e chegada ou **causa do abandono** (motor, suspensão, toque, erro de pilotagem, sorteada pelo estilo e pelo carro). Aparece no cartão da última corrida e, recolhido, na aba "Etapas". **Falta:** safety car, abandonos dos rivais e ultrapassagens por nome. |
| D.5 | Metas e tensão de temporada: objetivos da equipe, pressão do contrato, briga de título com o rival | **Parcial na v0.10 (2026-11-08).** Metas de F1 fixadas pela força inicial do carro, progresso, confiança sem punição duplicada, comparação com companheiro, distância ao líder e aviso de fim de contrato. Faltam metas na base e narrativa de título mais profunda. |
| ~~D.6~~ | ~~Declínio previsível do piloto do jogador~~ | ✅ Feito (2026-11-08). Curva fixa por idade, sem sorteio (`playerDeclineDelta`): começa aos 30 (agressivo), 31 (consistente) ou 32 (técnico), perde 0,5 no primeiro ano e mais 0,2 a cada ano, até −1,8; escolher "Treinar" na pré-temporada corta a queda do ano em 35%. A ficha mostra "Fase da carreira" com a previsão. O crescimento antes do pico segue com variação. **A pedido seu, o declínio não pode ser uma parede:** a curva é bem mais gentil que a primeira versão, e os veteranos controlados pelo jogo ganharam "ano bom" (30% de chance, a partir dos 34 anos, de quase não cair), aposentadoria mais lenta para a elite (fator 0,45 acima de 86 de habilidade, `retirePerYear` de 0,07 para 0,035) e idade máxima de 47 anos. Resultado medido (120 mundos de 25 anos): campeão com 35+ anos em 8% das temporadas, 0,67 piloto com 38+ por temporada (antes 0,18) e veteranos no top 3 de vez em quando, sem desequilibrar dinastias. Testes em `tests/decline.test.js` e `tests/realism.test.js`. |
| ~~D.7~~ | ~~Nomes genéricos por país, com bandeira nas tabelas~~ | ✅ Feito (2026-11-08). Todo piloto tem nacionalidade (`nat`; os 22 reais em `data/world2026.js`, os gerados sorteados por peso em `NAME_POOLS`: 24 países, dez nomes e doze sobrenomes cada). Nome gerado no formato "I. Sobrenome" (sem "II" e sem colidir com os reais). A bandeira aparece na tabela de pilotos e no grid de largada. Testes em `tests/names.test.js`. Falta nacionalidade nos rivais de base (hoje só têm nome) e bandeira nas tabelas de equipes. |
| D.8 | Mercado de pilotos inteligente | **Parcial (2026-11-08).** Feito: renovação por força do carro (melhor carro renova 65%, pior 38%, mais 10 pontos para a elite, além do top 3 do mundial que continua renovando 85%), lealdade (o ex-piloto tem preferência na vaga), equipes irmãs (Red Bull e Racing Bulls, Ferrari e Haas, Mercedes e Williams), duas estrelas só em carro top 2 e resumo "Mercado de pilotos" na pré-temporada (trocas, estreias e aposentadorias do ano). Ajustes em `CONFIG.market`; métricas e desvios dos alvos em `calibracao.md`. Testes em `tests/market.test.js`. **v0.11 feita:** preservação de livres/reservas, retorno, preferências por contribuição técnica/consistência e dupla complementar. **Falta:** boatos de mercado no meio do ano, academias com vínculos reais e o seu contrato entrando na história. É a base da silly season (D.14). |
| ~~D.10~~ | ~~Idade inicial escolhida (12 a 16) e idade mínima por categoria~~ | ✅ Feito (2026-11-07). A criação tem um seletor de idade. Idade mínima para subir (`CONFIG.base.minAge`): F4 15, F3 16, F2 17 e F1 18. **Confirmado por você (2026-11-07):** F4 15 (FIA e CBA), F3 16 e F1 18 (17 só por exceção da FIA, e a superlicença exige 40 pontos). A F2 não tem mínimo oficial; o 17 é convenção do jogo, porque a F2 só leva à F1 com 18 (as fontes sobre a F2 que você trouxe eram fóruns e redes sociais, então vale conferir no regulamento da FIA se um dia isso importar). Nenhuma categoria tem idade máxima oficial, o que confirma a escolha de só penalizar a idade alta. Quem ainda não tem idade repete o ano e isso **não** conta como "sem oferta" (a tela explica). Além da penalidade dos olheiros, **o código atual tem um corte de progressão de jogo**: `startNextSeason` encerra a base quando a idade supera `typicalAge[1] + CONFIG.base.altRouteOverAge` (margem atual: 3). Isso não é limite regulamentar e diverge da intenção de não impor corte rígido; revisão permanece pendente. Abaixo de 14 anos a habilidade inicial cai 3 por ano e o teto fica em 100. Medido (150 carreiras por idade): começar aos 12 leva à F1 aos 18,6 em média (99% chegam), aos 16 só aos 22,6 (83%). Quem começa novo ainda sai um pouco na frente (0,32 títulos por carreira contra 0,24), porque o teto é maior. Sem idade informada a API continua sorteando 14 a 16. Testes em `tests/ages.test.js`. |
| ~~D.11~~ | ~~Estatísticas separadas por categoria~~ | ✅ Feito (2026-11-07). A ficha mostra a tabela "Por categoria" (temporadas, GP, vitórias, pódios, poles e títulos de kart, F4, F3, F2 e F1), somando o total. Carreiras salvas antes não têm o detalhe da base (só os totais). Testes em `tests/bycat.test.js`. |
| ~~D.12~~ | ~~Bandeiras de todos os países na criação (255, nome em português pelo navegador)~~ | ✅ Feito (2026-11-07). As 26 mais usadas ficam embutidas; as outras são arquivos em `flags/` no site (flag-icons, MIT, 1,5 MB, carregados só quando aparecem). Lista em `ui/countries.js`, gerada dos arquivos. Nacionalidade dos pilotos da F1 também foi implementada (D.7); rivais da base continuam pendentes. |
| ~~D.13~~ | ~~Traçado das pistas no cartão da etapa~~ | ✅ Feito (2026-11-07). Contornos das 24 pistas do projeto bacinger/f1-circuits (MIT; inclui a Madring) convertidos em SVG (`data/trackPaths.js`, 20 KB), com o ponto de largada. Crédito no painel "Sobre". |
| D.14 | Silly season: o mercado de pilotos como evento do ano (boatos, anúncios, contratos que vencem, quem sai de onde) | Ideia sua, **deixada para outra hora**. Depende de D.8 (mercado inteligente) e de D.7 (nomes e nacionalidade). Esboço: no meio do ano, notícias de quem negocia com quem; o seu contrato entra na história; o resultado do mercado aparece antes da pré-temporada. |
| D.15 | Efeitos sonoros | Ideia sua, **a decidir**. Sugestão técnica: gerar os sons no próprio navegador (Web Audio, sem baixar arquivos, sem mexer na política de segurança do site e sem peso extra), curtos e discretos: clique, confirmação, abandono, pódio, vitória, título, alerta de evento. Botão de som (mudo por padrão ou lembrando a escolha) e respeito a "reduzir movimento". Sons gravados exigiriam baixar arquivos de licença livre (peço permissão antes) e deixam o site mais pesado. Também é o item 2.8. |
| ~~D.16~~ | ~~Talento de berço e dedicação no lugar do corte de potencial (87)~~ | ✅ Feito (2026-11-08), pedido seu ("o corte fixo não é real"). Antes, ao assinar com uma equipe de F1, o potencial do jogador era cortado num número fixo (84, depois 88, depois 87): um remendo de calibração que o jogador não entendia. Agora: **talento de berço** sorteado na criação (`rollPotential`, curva em sino originalmente com média 85,5 e desvio 4,5; média atual 84,5 após D.17; poucos passam de 95, os geracionais; começar cedo dá um pequeno bônus) e **dedicação** (`raisePotential`): cada escolha de treino, na base e na F1, eleva o teto em 0,30, com rendimento decrescente (quanto mais alto o potencial, menos rende). Quem treina muito pode virar um talento geracional; quem não treina fica no que nasceu. Não há mais corte na entrada da F1. Medido (300 carreiras por política, `CONFIG.talent`): nunca treina 94% chegam à F1 e 5% ganham título; política mista (treina todo ano na F1) 88% e 20%; sempre treina (inclusive na base) 85% e 26%. Ou seja, a escolha de treinar muda bastante o resultado, mas nenhuma carreira vira campeã sozinha. **Ainda falta:** mostrar o "talento" de forma legível na ficha (hoje só aparece a faixa do potencial), "talento tardio" (quem floresce depois dos 20) e a dedicação por outros caminhos além do treino (simulador, mídia, equipe). |
| ~~D.17~~ | ~~Perfil da equipe nas ofertas: pressão x desenvolvimento~~ | ✅ Feito (2026-11-08), pedido seu (redesenhar as ofertas). Cada oferta, na base e na F1, mostra o perfil da equipe pela posição do carro (engine/profile.js, CONFIG.teamProfile): **ponta** (3 melhores; na F1 pelos cortes de carTierRank), **meio** e **fundo** (3 piores). **Ponta:** muita pressão, desenvolvimento +15%, mas o bônus só vale se você correspondeu ao esperado no ano ("se for bem, evolui bem"). **Meio:** pressão média (metade), desenvolvimento normal. **Fundo:** nenhuma pressão, desenvolvimento −15% e, em troca, quem se destaca num carro fraco ganha 40% mais de nota de scouting por bater carros melhores (a sua dúvida sobre o fundo). **Pressão** = só cobrança: ficar abaixo do esperado para o carro (2 x posição do carro + 1) custa nota de scouting na base e confiança na F1; superar o esperado não rende nota extra (isso duplicava o prêmio do desenvolvimento e inflava os títulos). **Desenvolvimento** multiplica o crescimento de habilidade e o ganho de teto por treino, nunca o declínio. A oferta traz o cartão com o perfil em bolinhas e palavras (pressão: alta, média, nenhuma; desenvolvimento: rápido, médio, lento) e uma frase. **Calibração** (400 carreiras por política): nunca treina 96% chegam à F1 e 5% ganham título; política mista (treina todo ano na F1) 85% e 20%. Para manter essas faixas a média do talento de berço baixou de 85,5 para 84,5. Medição de ablação: sem pressão e sem visibilidade extra a mista dava 20% e com o bônus positivo da pressão 27%. Base: sem oferta 38%, ofertas boas 13%. Testes em `tests/profile.test.js`. **Ainda falta:** mostrar o perfil da equipe atual na ficha, perfis por piloto de equipe (companheiro) e o efeito do perfil nos eventos de equipe. |
| ~~D.9~~ | ~~Realismo do campeão e do grid~~ | ✅ Feito (2026-11-07), ver o parágrafo "Realismo do campeão" abaixo. |

Realismo do campeão (corrigido em 2026-11-07, pedido: "o Colapinto campeão com a Racing Bulls"): medi 150 mundos de 25 anos. Dois problemas: (1) o nível do grid caía com o tempo, porque os novatos gerados eram fracos (campeão com habilidade média 93 nos anos 1–7 e 83 nos anos 15–25, 81% dos campeões tardios abaixo de 85); (2) 55% do carro novo, a cada virada de regulamento, era sorteio puro, e equipes de orçamento baixo (Racing Bulls, Haas, Williams) levavam 11% dos títulos. Ajustes em `engine/config.js` e `data/categories.js`: novatos melhores (potencial 78–92, 15% de estrelas), regulamento com mais peso de orçamento (0,45) e menos sorteio (0,25), peso do carro na F1 de 0,75 para 0,60. Resultado: habilidade média do campeão ≈ 90 em qualquer época, equipes pequenas com 6–8% dos títulos; campeões por era 11,3 (alvo 8–13), dinastia média 4,2. O jogador ficou mais difícil, então o teto de potencial na entrada da F1 subiu de 84 para 88, mantendo ~14% das carreiras passivas com título. Teste de regressão em `tests/realism.test.js`. Limite conhecido: numa das três sementes do balanceamento a maior dinastia chegou a 9 títulos seguidos (alvo < 9).

Simulação de corridas (corrigido em 2026-11-07): "Simular 5 corridas" e "Simular o resto da temporada" paravam no primeiro evento de corrida com escolha (54% de chance por etapa) e, se nenhuma corrida tinha terminado, não avisavam nada, parecendo quebrados. Agora a simulação decide sozinha os eventos com a opção cautelosa de cada um (`safe` em `data/events.js`, testado) e obedece às ordens de equipe, e o aviso no topo conta as posições e o que foi decidido. Há uma caixa "Parar a simulação nos eventos de corrida e ordens de equipe" para quem quer decidir. Notícias de temporada com escolha (meio e fim do ano) continuam parando. Saves antigos com um evento já pendente param nele uma vez, porque o payload salvo não tem `safe`.

Texto para leigos: as descrições com "pp" (ponto percentual) foram reescritas em palavras ("mais risco de abandonar a corrida", "aumenta bastante a chance de uma academia te convidar"). Saves em andamento guardam o texto antigo na decisão pendente; carreiras novas já saem com o novo.

## Pendências de qualidade (transversais)

- Calibrar com jogo real, não com política passiva: taxa de título (última medição: 20% na política mista e 5% sem treino, entre quem chegou à F1), crescimento do jogador na base, frequência de eventos, frequência de `fia_polemica_titulo` e `contrato_vazado` (nunca dispararam em simulação passiva).
- Mais testes de regressão para as fórmulas e ferramentas de balanceamento para a carreira do jogador.
- Jogar uma carreira inteira numa tela real de celular.
- ~~Incluir `story_event` formalmente na spec-loop-jogador~~ — **Feito (2026-11-08)**, junto com `race_strategy` e `race_finale`.

## Ordem histórica de implantação (superada)

A sequência abaixo registra o planejamento inicial. Para trabalho novo, siga **Falta, por ordem de importância**, no início deste documento.

0. Funcional barato primeiro: F.1 a F.7 e F.11. São baratos e dão segurança (git, desfazer, salvar, link público) para o resto.
1. Nível 1 inteiro, junto com 2.1 a 2.3: deixa o jogo mais rico rápido e dá material para os amigos testarem. Depois, F.8 e F.9 (ritmo e feedback), que os amigos mais vão sentir.
2. 3.1 e 3.2 (rival persistente): é o que dá alma à narrativa.
3. 3.3, 3.4 e 3.11 (satélites, academias, rotas alternativas): fecham os becos sem saída da carreira.
4. 4.1 e 4.2 (ranking e compartilhamento): quando o jogo já agradar.
5. Nível 5 só depois de decidir qual camada de realismo importa mais.

## Continuidade entre agentes

- ~~Organizar instruções, índice, handoff curto e decisões estáveis~~ — **Feito (2026-11-08)**. Entrada em `AGENTS.md`, mapa em `docs/INDEX.md`, estado em `docs/HANDOFF.md`, decisões em `docs/DECISIONS.md`. Global e índice mestre pessoais criados no Codex; rotina em `docs/contexto-agentes.md`. Esta atualização documental ainda não foi commitada.

## Continuidade fora da F1 — proposta ampliada

Pedido do usuário em 2026-11-08, inspirado nas ofertas de outras categorias para pilotos experientes no F1 Glory. Amplia 3.11/B.12; **planejado, ainda não implementado**. A rota alternativa atual é terminal.

- [ ] Ofertas de **WEC, NASCAR, IndyCar e Fórmula E**, além das opções já citadas no planejamento (Super Fórmula).
- [ ] Elegibilidade por desempenho recente, experiência, reputação, perfil da categoria e vagas; idade é contexto, não gatilho único nem expulsão automática da F1.
- [ ] Poder aceitar outra categoria, continuar buscando F1 ou encerrar; a nova série precisa ter carreira jogável e estatísticas próprias.
- [ ] Adaptação esportiva: endurance, ovais e monopostos exigem perfis diferentes; não apenas trocar nomes na tela.
- [ ] Retorno à F1 possível quando fizer sentido; decisão por avaliação e oportunidades, sem retorno garantido.
- [ ] Preservar legado e conquistas de cada categoria no save; conferir regras/dados oficiais ao especificar campeonatos reais.

Pacote posterior à v0.10 de ritmo e objetivos; não foi adicionado silenciosamente ao escopo atual.

## Entrega v0.10 — ritmo e propósito

- ~~Plano persistente, avanço contextual e automático por situação~~ — **Feito (2026-11-08)**. Código `36bc86f`; política utiliza as mesmas regras do manual. A abordagem repetida saiu do caminho principal, mas acompanhamento passo a passo permanece.
- ~~Metas e história da temporada na F1~~ — **Feito no escopo desta versão**. Carro inicial define expectativa; painel acompanha pontos, companheiro, confrontos recentes e contrato. D.5 completo, sobretudo na base, continua parcial.
- ~~Criar piloto acima dos saves e aproveitar laterais no desktop~~ — **Feito**, com teste de ordem/responsividade.
- ~~Validação do conjunto~~ — **Feito**: 167 testes Node, 18 de navegador, comparação 120 sementes por cenário e 60,7% menos entradas em roteiro pareado de 27 temporadas completas.

Detalhes em `docs/v0.10.md`; os próximos candidatos em `docs/proxima-atualizacao.md`. WEC/NASCAR e demais rotas alternativas permanecem planejadas, sem implementação nesta versão.

## ~~Pacote v0.11 — pilotos e mercado vivo~~ — Feito

Pedido do usuário: dar valor aos veteranos e continuar a história de quem perde assento para o jogador. **Feito em 2026-11-08**; detalhamento em `docs/v0.11.md`.

Atributos por dimensão (3.9), curvas distintas de evolução/declínio e mercado preservando pilotos sem vaga vêm antes das rotas alternativas jogáveis (3.11). Destinos implementados: nova equipe, reserva ou aposentadoria contextual; outras categorias serão expansão posterior. As notas atuais do grid são estimativas manuais, sem avaliação oficial por dimensão.

## Entrada no kart por propostas — pedido para atualização futura

Referência visual enviada pelo usuário em 2026-11-08. Primeiras propostas entregues localmente na v0.12. Calendário detalhado da base, estrelas e academias vinculadas à F1 seguem no roadmap.

- [x] ~~Oferecer três equipes de kart antes da primeira temporada.~~ **Feito (2026-11-08).** A escolha é salva e afeta o carro e a formação.
- [ ] Cartões comparáveis com equipe real, força do carro, pressão, formação e visibilidade. Estrelas, se usadas, precisam representar um critério explicado, não uma classificação oficial inventada.
- [x] ~~Adaptar os três arquétipos ao Bandeirada.~~ **Feito (2026-11-08).** Projeto vencedor com carro forte e bônus de formação condicionado ao desempenho, equilibrado com crescimento regular e formação com carro mais fraco e bônus de aprendizado independente do resultado.
- [ ] Separar força do carro, capacidade de formação e pressão quando necessário: hoje `profile.js` associa desenvolvimento à posição do carro; equipe fraca não significa automaticamente boa formação. Não prometer bônus que o código ainda não concede.
- [ ] Escolha deve alterar a carreira, com efeitos visíveis nas ofertas e evolução; nenhuma opção pode ser universalmente melhor.
- [ ] Diferenciar equipe/escola de kart de academia vinculada à F1; o convite de academia da carreira é outro sistema.

Imagem é inspiração, não especificação copiada. Fechar os efeitos e a calibração quando esse pacote começar.

## Atualizar o grid inicial da F1 em 2026

- [ ] Revisar `data/world2026.js` em uma atualização posterior ao pacote da base. Usar a [escalação oficial de 2026](https://www.formula1.com/en/latest/article/2026-line-ups-confirmed-in-full-who-is-on-the-grid-for-next-season.3TyLfOUjOwpBKOp3KX1PiS) como ponto de partida e registrar a data de corte das mudanças permanentes. Separar titulares, reservas e substituições pontuais.
- [ ] Incluir Hadjar na Red Bull, Lindblad ao lado de Lawson na Racing Bulls e Tsunoda no mercado como reserva. Conferir a situação da Haas no corte adotado. Em 3 de novembro, a equipe confirmou que Ocon não voltaria a correr por ela em 2026 e anunciou Rafael Câmara para São Paulo. [Anúncio da Fórmula 1](https://www.formula1.com/en/latest/article/f2-racer-camara-to-make-f1-debut-at-sao-paulo-grand-prix-as-haas-confirm-esteban-ocon-will-not-return.12Qa0tpaMZ9kgnEuGJBKFp)
- [ ] Aplicar a escalação inicial a novas carreiras e preservar as transferências dos saves existentes. Conferir 22 titulares, dois por equipe, e ausência de pilotos duplicados entre grid e mercado.
- [ ] Registrar os campeões reais de 2026 na retrospectiva do ponto de partida. Antonelli conquistou o Mundial de Pilotos no México e a Mercedes confirmou o título de Construtores em São Paulo. Temporadas disputadas pelo simulador têm resultados próprios. [Pilotos](https://www.formula1.com/en/latest/article/antonelli-crowned-youngest-ever-f1-champion-as-verstappen-wins-eventful-mexico-git-grand-prix.xpMMeef0KmRURs9IDs3LH) · [Construtores](https://www.formula1.com/en/latest/article/norris-beats-verstappen-in-wet-sao-paulo-gp-thriller-as-mercedes-win-constructors-championship.7JN7MXLZf5lk5l0C3gfKGI)

## GP de casa do jogador

- [x] ~~Identificar e destacar etapas em casa pela nacionalidade do piloto.~~ **Feito (2026-11-08).** Destaque em Etapas e no cartão da corrida.
- [x] ~~Oferecer agenda com fãs ou preparação.~~ **Feito (2026-11-08).** Fama ou menor risco de abandono naquela etapa nas novas carreiras.
- [x] ~~Variar a chamada conforme resultados no save.~~ **Feito (2026-11-08).** Estreia registrada, último resultado, abandono ou vitória anterior.
- [ ] Mostrar corridas em casa, melhor resultado e vitórias no histórico do piloto. Destacar o primeiro pódio em casa na retrospectiva da temporada.

## Evolução da carreira de piloto

- [ ] Atualizar o ponto de partida da F1 com titulares, reservas e histórico de 2026, usando um recorte datado.
- [ ] Usar pilotos reais e vagas por equipe na F2 e F3. Escolher um campeonato nacional ou regional como referência para a F4 e aproximar o formato de cada categoria.
- [ ] Oferecer salto excepcional da F4 para a F2 quando desempenho, idade, elegibilidade e vaga permitirem. Apresentar as alternativas de F3 e permanência quando disponíveis.
- [ ] Guardar no save a evolução dos carros da base e aplicar os pacotes da F1 ao longo do calendário. Mostrar o efeito no desempenho e a posição relativa no grid.
- [ ] Planejar a carreira de chefe de equipe como modo futuro, com comando dos dois carros, orçamento, contratos e desenvolvimento.

## Corrida visual interativa

- [x] ~~Prototipar corrida no traçado, com destaque para o carro e a fase.~~ **Feito na v0.13.** O mapa lateral usa os traçados existentes, e o pódio ocupa esse espaço na bandeirada.
- [x] ~~Pausar nas decisões e mostrar as consequências.~~ **Feito na v0.13, publicada em 2026-11-09.** Janela de box informa posição, clima e condição dos pneus. A escolha muda a ordem antes dos pontos e entra no relato.
- [x] ~~Permitir acelerar ou pular a animação.~~ **Feito na v0.13, publicada em 2026-11-09.** A cena é independente das regras, respeita a preferência de movimento reduzido e pode ser pulada sem responder à escolha pendente.

## Tela de corrida estilo manager

Direção definida em 2026-11-09: o jogo deve funcionar como um F1 Manager/Football Manager do piloto. A corrida vira a "tela de partida", com decisões do piloto pausando a prova. A etapa visual foi publicada na v0.13 e ganhou acabamento na v0.14 publicada.

**Etapa 1 — tela ilustrativa (só interface).** Usa a ordem por fase que a engine já calcula; não muda regras, saves nem balanceamento.

- [x] ~~Mapa 2D com voltas, ultrapassagens visíveis e pista desenhada (asfalto, zebras, linha de largada).~~ **Feito e publicado (2026-11-09), commit `e58611c`.** Cada trecho entre decisões vira uma volta (duas até a bandeirada), com luzes de largada, chuva e abandonos. Os carros param na pausa da decisão; o espaçamento é fixo, sem distâncias reais.
- [x] ~~Torre de posições com piloto, cor da equipe e setas de ganho ou perda.~~ **Feito e publicado (2026-11-09).** Sem diferença em segundos e sem pneu dos rivais enquanto a engine não gerar esses dados. Abandonos aparecem no fim da lista.
- [x] ~~Narração progressiva.~~ **Feito e publicado (2026-11-09).** Usa o relato parcial da engine (`map.notes`) e movimentos derivados da troca de ordem. Sem número de volta. Setas e linhas derivadas ficam só na aba: somem ao recarregar ou desfazer.
- [x] ~~Controles: pausar, 1×, 2×, 4× e pular.~~ **Feito e publicado (2026-11-09).** Pular leva ao fim do trecho sem responder à decisão. Movimento reduzido mostra a cena parada.
- [x] ~~Pausa nas decisões existentes, com o recado do engenheiro em balão.~~ **Feito e publicado (2026-11-09).** A decisão continua disponível durante a cena; nada é bloqueado.
- [x] ~~Painel do carro do jogador.~~ **Feito e publicado (2026-11-09).** Posição, pneus, pista, plano e meta; condição estimada só na janela de box.

Limites da etapa 1: ao simular várias etapas, só a última bandeirada é animada. Celular conferido apenas em emulação. Nesta máquina o Playwright rodou com o Chrome instalado (`channel: 'chrome'`), porque o navegador do Playwright não estava baixado.

**Fim de semana da v0.14.**

- [x] ~~Treino livre por etapa.~~ **Feito e publicado na v0.14 em 2026-11-09.** Acerto influencia ritmo, teste de pneus influencia a condição estimada. A escolha vale para um GP.
- [x] ~~Neutralizações na janela de box.~~ **Feito e publicado na v0.14 em 2026-11-09.** Safety car e bandeira vermelha abrem escolha de pneus antes da retomada. Os efeitos são resolvidos por fase antes dos pontos.

**Etapa 2 — simulação volta a volta (engine, liga com D.2).** Pacote grande, exige recalibrar.

- [ ] Tempo por volta para cada carro, a partir de ritmo, carro, pista, clima e variação por seed.
- [ ] Desgaste e composto de pneus para todos os carros, com paradas dos rivais simuladas.
- [ ] Diferenças reais em segundos, ar sujo e ultrapassagem dependente de ritmo e pista.
- [ ] Decisões abertas em voltas específicas, no lugar das fases fixas. Alterações continuam antes da atribuição dos pontos, com determinismo por seed e decisões.
- [ ] Torre com diferença para o da frente e pneu de cada carro; narração volta a volta para o grid inteiro ("Volta 12: Teste passa Albon na chicane").
- [ ] Safety car e bandeira vermelha compactando o pelotão (a v0.14 publicada tem neutralizações por fase, sem diferenças em segundos).
- [ ] Definir o que acontece com saves no meio de uma corrida no formato antigo.

**Ideias para evoluir a tela de corrida (2026-11-09).** Só interface, salvo indicação.

- [x] ~~Resultado só depois da cena.~~ **Feito e publicado na v0.14 em 2026-11-09.** Pódio e resultado aparecem ao concluir ou pular a animação.
- [x] ~~Bandeirada um a um.~~ **Feito e publicado na v0.14 em 2026-11-09.** Os carros cruzam a linha em sequência na cena ilustrativa e a torre recebe o título final ao fim.
- [ ] Número do carro e rótulo dos três primeiros no mapa.
- [ ] Destaque no mapa do rival citado na decisão de ataque ou defesa.
- [ ] Pit stop visível, com pit lane desenhada (os traçados atuais só têm a pista).
- [ ] Carros circulando devagar durante a pausa, no lugar de congelados. Decidir com o usuário.
- [ ] Suavizar os traçados sem trocar a fonte dos dados.
- [ ] Barra de progresso da corrida (largada, meio, final) enquanto não há número de volta.
- [x] ~~Torre recolhida no celular.~~ **Feito e publicado na v0.14.1 (2026-11-09).** Três primeiros e jogador, com opção de abrir o grid.
- [ ] Narração com ícone por tipo (ultrapassagem, abandono, rádio).
- [ ] Classificação animada: volta rápida com setores coloridos e torre se montando. Reaproveita a cena.
- [ ] Atalhos de teclado: espaço pausa, números mudam a velocidade, setas escolhem a opção.

**Ideias de manager do piloto (2026-11-09, nenhuma implementada).**

- [ ] Caixa de entrada para propostas, recados do chefe, notícias e convites. Prioridade sugerida.
- [ ] Duelo com o companheiro: placar fixo de classificações e corridas. Prioridade sugerida.
- [ ] Briefing antes da largada: expectativa da equipe, clima e vizinhos de grid.
- [ ] Entrevista pós-corrida com efeito em confiança, fama ou relação com o companheiro. Exige regra na engine.
- [ ] Empresário que traz sondagens e negocia, com qualidade variável. Exige regra na engine.
- [ ] Rivalidades guardadas no save e retomadas em eventos e na narração. Exige regra na engine.
- [ ] Reputação separada por equipe, paddock e torcida. Exige regra na engine e calibração.
- [ ] Linha do tempo da carreira com os marcos em ordem.
- [ ] Radar de atributos comparando com companheiro ou rival.
- [ ] Gráfico da temporada: posição por corrida e curva de pontos.
- [ ] Página da equipe: evolução do carro, pacotes e posição no grid.
- [ ] Recordes do mundo: vitórias, poles e campeões por ano.
- [ ] Cartão de resultado compartilhável em imagem.
- [ ] Conquistas de longo prazo.
- [ ] Tutorial na primeira corrida, com o engenheiro explicando cada decisão uma vez.

**Depois.** Câmera seguindo o carro (pede traçados suavizados; os atuais têm coordenadas inteiras em 200×140), e sons (2.8/D.15). Visão 3D: ver o plano por versões (3D leve na 1.0, corrida inteira depois).

## Imersão e aproveitamento de tela — referências para evoluir

Pedido em 2026-11-08: eventos que retomem fatos reais da própria carreira (ex.: título de kart que escapou, voltar a disputar com custo no calendário), histórico de temporadas mais legível, cores com significado e mais informação útil na largura disponível. Referências visuais são inspiração, preservando identidade Bandeirada.

Na v0.11: perfis coloridos, notícias de destino de pilotos, consulta de mercado e histórico recente de F1 com dados registrados. Expansão narrativa da base fica para outro pacote:

- [x] ~~Separar o GP encerrado da próxima etapa.~~ **Feito (2026-11-08), v0.12 local.** Posição, largada e pontos em destaque. Relato recolhível e indicação de classificação, largada, corrida em andamento ou voltas finais.
- [x] ~~Primeiro convite que retoma o histórico da base.~~ **Feito (2026-11-08).** Vice no kart pode voltar para uma prova de convidados com conflito real na abertura da F4. O histórico guarda equipe, posição e números por temporada.

- [ ] Gatilhos por histórico salvo (vice de kart, lesão, ex-companheiro), sem inventar títulos/anos passados.
- [ ] Convites opcionais com conflito de calendário e consequências simuladas (resultado, confiança, reputação), não só bônus textual.
- [ ] Histórico navegável também para base e campeonatos anteriores do mundo, com estatísticas preservadas desde a temporada correspondente.
- [ ] Cores por equipe, categoria e tipo de notícia, com texto/ícone e contraste; não depender só da cor para informar.
