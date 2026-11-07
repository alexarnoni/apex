# Worker de feedback (e-mail)

O botão "Feedback" do jogo faz um `POST` neste Worker da Cloudflare, que valida a mensagem e envia um e-mail para a sua caixa pelo Email Routing. O jogador não precisa de conta em lugar nenhum, e nenhum serviço de terceiros entra no caminho.

```
jogo (navegador) --POST--> Worker (Cloudflare) --Email Routing--> sua caixa de entrada
```

O que chega no e-mail: tipo, nota (no fim da carreira), mensagem, contato opcional (vira o `Reply-To`, então é só responder), versão do jogo e, se o jogador deixou marcado, a seed e as últimas decisões da carreira.

## Passos (uma vez, na sua conta)

Pré-requisito: o Email Routing já está ativo em `alexarnoni.com` (os MX do domínio são da Cloudflare).

1. **Destino verificado.** Cloudflare > Email > Email Routing > Destination addresses: o Worker só consegue enviar para um destino **verificado** aqui. Um endereço *criado* no Routing (um alias que só encaminha, como `contato@seudominio`) não conta; use o endereço real da caixa para onde o alias encaminha.
2. **Entrar e publicar o Worker** (o `wrangler login` abre o navegador para você autorizar):
   ```bash
   cd worker
   npx wrangler login
   npx wrangler secret put FEEDBACK_TO     # digite o destino verificado do passo 1
   npx wrangler deploy
   ```
   O `FEEDBACK_TO` é um *secret* de propósito: o seu e-mail não fica neste repositório público.
3. **Ligar o jogo ao Worker.** O deploy imprime o endereço (`https://bandeirada-feedback.<sua-conta>.workers.dev`):
   ```bash
   gh variable set BANDEIRADA_FEEDBACK_ENDPOINT --body https://bandeirada-feedback.<sua-conta>.workers.dev
   gh workflow run "Publicar no GitHub Pages"
   ```
4. **Testar:** abra o jogo, clique em "Feedback", mande uma mensagem e confira a caixa de entrada (e o spam, na primeira vez).

Se o envio falhar por causa do remetente, crie `feedback@alexarnoni.com` no Email Routing (qualquer destino) ou troque `FEEDBACK_FROM` em `wrangler.toml`. Para ver erros em tempo real: `npx wrangler tail`.

## Proteção contra abuso

- Só aceita chamadas vindas do jogo (`ALLOWED_ORIGINS` em `wrangler.toml`: o endereço do GitHub Pages e `bandeirada.alexarnoni.com`).
- Corpo de até 16 KB, mensagem de até 2.000 caracteres, campos cortados no tamanho máximo.
- Campo-isca invisível: robôs que o preenchem recebem "ok", mas nada é enviado.
- Até 5 envios por 10 minutos por IP. Esse limite vive na memória de cada instância do Worker, então é só uma primeira barreira. Para valer de verdade, crie uma regra de **Rate Limiting** da Cloudflare para esta rota. Se aparecer spam, o próximo passo é o Cloudflare Turnstile (gratuito).
- Quebras de linha no contato e no assunto são removidas (nada de injeção de cabeçalhos de e-mail).

## Testes

`npm test` roda `tests/worker.test.js`, que cobre o núcleo (`feedback-core.js`): origem, pré-voo CORS, validação, isca, limite, UTF-8 no assunto e no corpo, falha de envio e injeção de cabeçalho. A classe `EmailMessage` só existe no runtime da Cloudflare, por isso `index.js` fica fino e o resto é testado em Node.

## Custos

O plano gratuito de Workers (100 mil requisições por dia) e o Email Routing (gratuito) cobrem de longe o volume de um beta.
