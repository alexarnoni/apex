// Entrada do Worker de feedback. A classe EmailMessage só existe no runtime da Cloudflare,
// por isso o import fica aqui e o resto da lógica (testada em Node) fica em feedback-core.js.

import { EmailMessage } from 'cloudflare:email';
import { handleFeedback } from './feedback-core.js';

export default {
  fetch(request, env) {
    return handleFeedback(request, env, {
      makeMessage: (from, to, raw) => new EmailMessage(from, to, raw),
    });
  },
};
