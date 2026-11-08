# Próximo pacote: fim de semana mais vivo

Proposta registrada em 2026-11-08. Identificador de trabalho: **v0.10**; não é uma versão publicada. Escopo planejado, ainda não implementado.

## Objetivo

Fazer as decisões da F1 terem consequências conectadas, sem transformar cada corrida numa sequência repetitiva de botões. Entregar o conjunto no site após validar jogo, saves e balanceamento.

## Lista do pacote

- [ ] **Treino livre antes da classificação:** escolher preparação, receber informação útil de ritmo/acerto e carregar o efeito para o fim de semana. Explicar o benefício e o custo de cada opção.
- [ ] **Estratégia e box como momento próprio:** decidir permanecer ou parar conforme pneus, clima e situação. Começar por fases/stints simplificados; definir o contrato do motor antes de alterar telas. Não apresentar isso como tempo por volta real.
- [ ] **Safety car com efeito coletivo:** mudar a situação de todos os classificados elegíveis e abrir decisão de box quando fizer sentido. Evitar um bônus isolado e gratuito para o jogador.
- [ ] **Relato coerente:** conectar preparação, largada, parada, duelo e chegada; citar rivais envolvidos e não inventar ações após abandono.
- [ ] **Ritmo da interface:** permitir simulação segura das novas decisões e evitar interrupções sem escolha relevante. Preservar desfazer e retomada no meio de cada fase.
- [ ] **Validação do conjunto:** testes da engine e navegador, fluxo antigo de saves, carreiras completas, calibração comparável e verificação no site após deploy.

Treino livre é o primeiro incremento interno. Boxes e safety car exigem definir fases e dados compartilhados: se essa base exigir uma reescrita maior, ajustar explicitamente o escopo do pacote e registrar o que foi adiado, sem marcar itens incompletos como feitos.

## Como trabalhar e publicar

1. Trabalhar em branch `codex/` para o pacote; `main` continua com a versão estável. Fazer commits menores por funcionalidade, com o pacote inteiro revisável antes da integração.
2. Antes de codificar fases, fechar estado mínimo, ordem dos efeitos e política automática. Reusar o determinismo; atribuir pontos só após todas as consequências.
3. Validar cada incremento com testes relevantes. Ao fechar o pacote, executar a suite completa e os cenários de navegador; fazer comparação de calibração com a versão publicada, usando mesmas políticas e relatando denominador/incerteza.
4. Atualizar roadmap, versões e handoff. Riscar apenas itens realmente concluídos. Registrar impacto e limites de saves; não apagar carreiras incompatíveis silenciosamente.
5. Integrar o pacote pronto na `main`, fazer push e acompanhar Pages. A intenção do usuário é publicar pacotes concluídos ao final, sem pedir confirmação por cada tarefa interna. Interromper apenas por decisão de produto necessária, risco material ou bloqueio real.
6. Confirmar pipeline e versão servida no domínio. Se falhar, corrigir antes de considerar a atualização entregue.

Não juntar mercado, base e som neste pacote: cada área terá seu próprio conjunto coerente de mudanças. A cadência passa a ser por pacote jogável; o tamanho do commit continua pequeno o bastante para revisão e reversão.
