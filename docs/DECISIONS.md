# Decisões e armadilhas

Consulte conforme a tarefa. Estado atual fica no handoff; histórico em versões e calibração.

- Engine pura/isomórfica; UI apresenta e coleta decisões. Balanceamento em `engine/config.js`, categorias em `data/categories.js`. Sem economia de dinheiro por enquanto.
- Aplique mudanças de resultado **antes dos pontos**. Alterar posições após `awardRace` produz campeonato incoerente.
- Preserve determinismo, estado RNG e contador de novatos. Mudar consumo de RNG muda as carreiras de cada seed.
- Preserve `apex.slot.N` e `app: 'apex'`. Não há migração automática. `ENGINE_VERSION` identifica formato compatível, não a versão exata das regras para replay.
- Sem corte fixo de potencial na entrada da F1. Talento de berço (média atual 84,5) e treino com rendimento decrescente substituíram o teto 87. Não recolocar esse remendo para calibrar títulos.
- Declínio do jogador é previsível, não sorteado; treino atenua. Curvas de idade são design do jogo, não leis físicas comprovadas.
- F2 aos 17 é convenção do jogo. Existe corte de progressão da base por `typicalAge[1] + altRouteOverAge`, apesar da intenção anterior de só penalizar idade. Não confundir esse corte com regra oficial.
- Taxa de títulos de `calibrate:player` considera só quem chegou à F1. Políticas fixas não representam todo jogador. Reporte amostra e denominador; erro-padrão não é intervalo de 95%, nem meta de design comprova realismo.
- Pressão de equipe só cobra desempenho abaixo do esperado. Bônus positivo já duplicou o prêmio de desenvolvimento e inflou títulos. Desenvolvimento extra da ponta exige corresponder ao esperado.
- Academias, equipes irmãs e calendário são simplificações. Saves antigos podem conservar nomes, nacionalidades e decisões antigas. Não prometer atualização retroativa.
- Preserve UTF-8. PowerShell em pt-BR já gerou vírgula decimal no SVG e quebrou o logo: use geração independente de cultura e `Get-Content -Encoding UTF8` nas leituras.
- Push na `main` publica no Pages. Confirme o pipeline antes de afirmar sucesso. Segredos/variáveis de plataforma não estão no Git; não enviar feedback real durante testes.
- Direção (2026-11-10): F1 Manager do piloto no navegador, imersivo até onde o meio permitir. Ordem das fases em `roadmap-ideias.md`, com volta a volta antes do Paddock. Limites: arquivo único de até 1 MB, sem servidor antes da 1.0, cena fluida em celular intermediário. Corrida inteira em 3D fica fora por peso.
- Sem botão Desfazer (2026-11-10, pedido do usuário): decisão tomada não volta. Não reintroduzir. O histórico de decisões continua no save para o determinismo.
