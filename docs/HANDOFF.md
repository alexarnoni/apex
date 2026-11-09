# Retomada — Bandeirada

Atualizado em **2026-11-08**, pacote v0.11.0.

- Repo `alexarnoni/apex`; push na main aciona GitHub Pages. Site: https://bandeirada.alexarnoni.com.
- v0.11 implementada; confirmar workflow e conteúdo servido antes de considerar publicação concluída. v0.10 publicada até `7ec7fc9`.
- Entregue: seis atributos e overall sem carro, treino direcionado, declínio por competência, pilotos sem assento preservados, reservas e retorno, grid completo após transferência, painéis de perfis e histórico recente.
- Verificação local: suíte Node (178 casos), Playwright (22 em desktop/celular), carreira completa e captura de 1920 px. Calibração com 80 carreiras por política/versão e 15.000 temporadas por versão. Duas sementes tiveram dinastia máxima de 9; dados em `calibracao.md`.
- Build normaliza CRLF antes de calcular CSP. Não flexibilizar a política para contornar diferenças do Windows.
- Saves: ENGINE_VERSION 1 e chaves Apex preservadas; atributos inferidos de saves antigos. Não há como recompor pilotos que já desapareceram em saves anteriores.
- GoatCounter configurado como `alexarnoni`; painel https://alexarnoni.goatcounter.com. Feedback segue pelo Worker. Painel de visitas não foi inspecionado.
- Reservas não substituem automaticamente por lesão. Sem rotas alternativas jogáveis, rumores ou pré-contratos. Chromium móvel emulado não substitui testes em aparelhos reais.

## Próximo pacote

Candidato: rotas alternativas jogáveis (WEC/NASCAR/IndyCar/FE/Super Fórmula), começando com um recorte que tenha corridas, resultados e possível retorno à F1. Para a base: três ofertas iniciais de kart com carro/pressão/formação distintos e eventos que retomem fatos do save, sem copiar a referência visual.

Confira `git status --short` e `git log -3 --oneline`. Referências: `v0.11.md`, `proxima-atualizacao.md`, `roadmap-ideias.md` e `DECISIONS.md`.
