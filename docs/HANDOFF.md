# Retomada do Bandeirada

Atualizado em **2026-11-08**, após defesa final, decisão de largada e validação da interface em navegador isolado.

## Estado confirmado localmente

- Repositório: `alexarnoni/apex`. Site configurado: https://bandeirada.alexarnoni.com.
- Base de código desta revisão: commit `f0d1f05`; marco de funcionalidades **v0.9.2** (`659b46a`). Esses marcos não são releases oficiais nem a versão do save.
- `ENGINE_VERSION = 1`; `package.json` ainda usa nome interno `apex` e versão `0.1.0`.
- Engine pura no cliente, UI empacotada por esbuild, três slots em localStorage e export/import JSON. Chaves internas Apex preservadas por compatibilidade.
- Verificação local: **158 testes Node e 10 testes de navegador passaram**; build aprovado. Capturas de desktop e celular inspecionadas. Produção e calibração estatística completa não foram reconferidas.
- Novos recursos locais: **D.2.a, defesa no final de corrida**, e **D.2.b, decisão de largada**, implementados e testados. Não houve commit, push ou publicação nesta etapa.

## O que já funciona

- Base resumida, equipes reais, ofertas, academias simplificadas e idade inicial/nacionalidade selecionáveis.
- F1 com abordagem, grid/estratégia de pneus, decisão de largada, eventos, ordens de equipe, ataque ou defesa no final e relato; contratos, mercado anual, aposentadoria e legado.
- Pistas, traçados, bandeiras, estatísticas por categoria, tema claro/escuro, saves, desfazer e simulação automática com escolhas seguras.
- Talento de berço e treino sem corte fixo de potencial na entrada da F1. Média atual do talento: **84,5**.
- Perfis de equipe: pressão e desenvolvimento conforme força do carro; bônus de ponta condicionado ao desempenho esperado.
- Feedback por Worker e proteção CSP no site. Configurações externas e segredos precisam existir nos respectivos serviços; não estão no Git.
- Ferramentas portáveis em `tools/calibrate/`, documentadas em `calibracao.md`.
- Suite Playwright em `tests/ui/`, executada por `npm run test:ui`; detalhes em `testes-interface.md`. CI de PR/publicação configurado, ainda sem execução remota desta alteração.
- Aviso de importação ganhou `role="status"`. No celular, a área rolável termina antes da faixa de feedback; o botão continua visível e não cobre opções. Retorno ao topo ajustado para esse contêiner.

## Próximo trabalho, conforme o roadmap

1. **D.2/D.4: dinamismo da F1.** Defesa final e largada já entraram localmente (D.2.a/D.2.b); faltam treino livre, paradas próprias e acontecimentos coletivos. Ritmo por volta é uma reescrita maior, não pré-requisito a impor automaticamente a toda melhoria pequena.
2. **D.8/D.14: mercado e silly season.** Lealdade/renovação/notícias anuais existem; rumores, perfis de contratação e história do contrato ainda não.
3. **D.3/D.5: mini calendário na base e metas.** Hoje a base continua uma decisão por temporada.
4. **D.15: sons.** Ainda não implementados.

O usuário pediu atualizar a documentação e em seguida começar pelo próximo item. Foi iniciada a prioridade D.2, com duas fatias concluídas: defesa e largada. O próximo incremento sugerido é treino livre antes da classificação. A sugestão anterior de começar pela base não substituiu a ordem registrada no roadmap.

## Cuidados e pendências

- Resultados ainda são simulados de uma vez; estratégia/final reordenam posições antes dos pontos. Não descrever como simulação por volta.
- Na defesa, ceder perde uma posição; defender pode manter, perder uma ou perder até duas por erro, conforme o ritmo. A simulação automática cede nessa situação. Isso muda resultados da política automática; as porcentagens históricas de títulos não foram revalidadas para esta alteração. Ataque antigo sem campo `mode` continua compatível.
- A largada `race_start` usa `hold` na simulação: não altera a ordem bruta nem consome RNG na escolha. Atacar pode causar contato; esse abandono não oferece eventos posteriores ao jogador. O relato agora usa a decisão em vez da posição de primeira volta inventada; o consumo global do RNG muda, então não presumir resultados iguais aos de versões anteriores. Saves já em etapas posteriores seguem dali, sem repetir a largada.
- Rotas alternativas continuam terminais. Existe corte de progressão de jogo por idade típica + margem na base, além da regra de temporadas de F2 sem oferta; isso não é idade máxima regulamentar.
- Idade mínima de F2 em 17 é convenção de jogo; não tratar como regra oficial validada.
- Percentual de títulos nas ferramentas é calculado **entre carreiras que chegaram à F1**, não entre todas as tentativas. Medições de políticas fixas não comprovam realismo nem descrevem todos os jogadores.
- Save de formato incompatível não é carregado/importado; não há migração automática. Dados antigos de decisões e pilotos podem permanecer antigos.
- Texto dos eventos aguarda revisão do usuário (1.3). Segurança externa, métricas de uso e testes em aparelhos reais têm pendências no roadmap; reconfirmar o estado das plataformas antes de afirmá-lo.
- Para replay confiável futuro, a versão do formato de save não basta: será necessário identificar também a versão do código/regras.

## Conferência rápida ao retomar

```bash
git status --short
git log -5 --oneline
npm test
npm run build
npm run test:ui
```

Rode testes/build quando for iniciar alterações de código; para revisão exclusivamente textual, confira referências e o diff. Push na `main` dispara Pages. Registre o resultado real de cada verificação, sem assumir deploy concluído apenas por ter enviado o commit.
