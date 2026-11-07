# Segurança

## Como relatar uma vulnerabilidade

Use o relato privado do GitHub: aba **Security** do repositório > **Report a vulnerability**
(https://github.com/alexarnoni/apex/security/advisories/new). Assim o relato não fica público
até existir uma correção. Por favor, não abra uma issue pública para falhas de segurança.

Respondo assim que possível. É um projeto de fã, mantido por uma pessoa, então não há prazo garantido.

## O que há para proteger

- O jogo é um site estático: roda inteiro no navegador, sem conta de usuário e sem cookies. A carreira
  fica salva só no `localStorage` do navegador de quem joga.
- O único ponto com servidor é o Worker de feedback (`worker/`), que recebe texto e envia um e-mail.
  Ele valida origem, tamanho e campos, e o endereço de destino fica em um *secret* da Cloudflare.
- O site publica uma Content-Security-Policy (por `<meta>`, com hashes calculados no build) e o código
  não tem dependências de produção, só o `esbuild` para construir.

## Fora do escopo

Trapaça em saves locais (qualquer jogador pode editar o próprio `localStorage`) e nomes ou marcas
de terceiros usados para ambientação.
