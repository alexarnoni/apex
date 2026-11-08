// Bandeiras em SVG (flag-icons, licença MIT: ver ui/assets/flags/LICENSE-flag-icons.txt), embutidas no jogo.
// O emoji de bandeira não aparece no Windows (vira duas letras), por isso as imagens.
// Brasão do México e da Espanha foram removidos de propósito: pesavam 80 KB cada e não aparecem em 20 px.

import au from './assets/flags/au.svg';
import cn from './assets/flags/cn.svg';
import jp from './assets/flags/jp.svg';
import bh from './assets/flags/bh.svg';
import sa from './assets/flags/sa.svg';
import us from './assets/flags/us.svg';
import ca from './assets/flags/ca.svg';
import mc from './assets/flags/mc.svg';
import es from './assets/flags/es.svg';
import at from './assets/flags/at.svg';
import gb from './assets/flags/gb.svg';
import be from './assets/flags/be.svg';
import hu from './assets/flags/hu.svg';
import nl from './assets/flags/nl.svg';
import it from './assets/flags/it.svg';
import az from './assets/flags/az.svg';
import sg from './assets/flags/sg.svg';
import mx from './assets/flags/mx.svg';
import br from './assets/flags/br.svg';
import qa from './assets/flags/qa.svg';
import ae from './assets/flags/ae.svg';
import ar from './assets/flags/ar.svg';
import pt from './assets/flags/pt.svg';
import de from './assets/flags/de.svg';
import fr from './assets/flags/fr.svg';
import fi from './assets/flags/fi.svg';

const IMG = { AU: au, CN: cn, JP: jp, BH: bh, SA: sa, US: us, CA: ca, MC: mc, ES: es, AT: at, GB: gb, BE: be, HU: hu, NL: nl, IT: it, AZ: az, SG: sg, MX: mx, BR: br, QA: qa, AE: ae, AR: ar, PT: pt, DE: de, FR: fr, FI: fi };

export const COUNTRY = {
  BR: 'Brasil', AR: 'Argentina', PT: 'Portugal', GB: 'Reino Unido', DE: 'Alemanha', FR: 'França', IT: 'Itália', ES: 'Espanha',
  NL: 'Países Baixos', FI: 'Finlândia', JP: 'Japão', US: 'Estados Unidos', MX: 'México', AU: 'Austrália', CN: 'China', BH: 'Bahrein',
  SA: 'Arábia Saudita', CA: 'Canadá', MC: 'Mônaco', AT: 'Áustria', BE: 'Bélgica', HU: 'Hungria', AZ: 'Azerbaijão', SG: 'Singapura',
  QA: 'Catar', AE: 'Emirados Árabes',
};

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// <img> da bandeira (4:3). Código desconhecido vira o próprio texto. alt vazio quando o nome do país já está ao lado.
export function flagImg(code, { alt = true, h = 15 } = {}) {
  // Saves feitos antes das imagens guardam o emoji de bandeira: converte de volta para o código do país.
  const raw = String(code ?? '');
  const c = (/^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(raw)
    ? [...raw].map((ch) => String.fromCharCode(ch.codePointAt(0) - 0x1F1E6 + 65)).join('')
    : raw).toUpperCase();
  const src = IMG[c];
  if (!src) return c ? `<span class="flag-code">${esc(c)}</span>` : '';
  const name = COUNTRY[c] ?? c;
  return `<img class="flag" src="${esc(src)}" width="${Math.round(h * 4 / 3)}" height="${h}" alt="${alt ? esc(name) : ''}" title="${esc(name)}">`;
}
