// Som do rádio. O arquivo vai embutido em base64 no bundle e é decodificado pelo Web Audio:
// não há <audio> nem download, então a CSP continua sem liberar mídia.
import radioB64 from './assets/radio.mp3';

const KEY = 'bandeirada.sound';
let on = readSound();
let ctx = null;
let buffer = null;
let loading = null;

function readSound() {
  try { return window.localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}

export const soundOn = () => on;

export function toggleSound() {
  on = !on;
  try { window.localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* sem armazenamento: vale só nesta sessão */ }
  if (on) playRadio();
  return on;
}

function load() {
  if (loading) return loading;
  const bytes = Uint8Array.from(atob(radioB64), (c) => c.charCodeAt(0));
  loading = ctx.decodeAudioData(bytes.buffer).then((b) => { buffer = b; return b; });
  return loading;
}

// Toca o bip do rádio. Só depois de um gesto do usuário: antes disso o navegador segura o áudio
// e ele sairia atrasado, fora de contexto.
export function playRadio() {
  if (!on || typeof window === 'undefined') return;
  const Ctx = window.AudioContext ?? window.webkitAudioContext;
  if (!Ctx || navigator.userActivation?.hasBeenActive === false) return;
  try {
    ctx ??= new Ctx();
    if (ctx.state === 'suspended') ctx.resume();
    load().then((b) => {
      if (!on) return;
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = 0.45;
      src.buffer = b;
      src.connect(gain).connect(ctx.destination);
      src.start();
    }).catch(() => { /* formato não suportado: o jogo segue mudo */ });
  } catch { /* áudio indisponível */ }
}
