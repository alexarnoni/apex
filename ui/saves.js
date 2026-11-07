// Salvamento local em slots + exportar/importar arquivo (roadmap F.7).
// Sem DOM: recebe o storage (localStorage em produção, um Map nos testes), a versão do jogo e
// duas funções da engine (describe/validate). Cada slot guarda { app, version, savedAt, info, state }.

export const SLOT_COUNT = 3;
const APP = 'apex';
const key = (i) => `apex.slot.${i}`;

export function createSaves({ storage, version, describe, validate }) {
  const available = !!storage;

  function readRaw(i) {
    let raw;
    try { raw = storage.getItem(key(i)); } catch { return { status: 'corrupt' }; }
    if (raw == null) return { status: 'empty' };
    let entry;
    try { entry = JSON.parse(raw); } catch { return { status: 'corrupt' }; }
    if (!entry || entry.app !== APP || typeof entry.state !== 'object') return { status: 'corrupt' };
    if (entry.version !== version) return { status: 'old', entry };
    try { validate(entry.state); } catch { return { status: 'corrupt' }; }
    return { status: 'ok', entry };
  }

  return {
    available,

    // [{ slot, status: 'empty'|'ok'|'old'|'corrupt', info?, savedAt?, version? }]
    list() {
      return Array.from({ length: SLOT_COUNT }, (_, n) => {
        const slot = n + 1;
        if (!available) return { slot, status: 'empty' };
        const r = readRaw(slot);
        return { slot, status: r.status, info: r.entry?.info, savedAt: r.entry?.savedAt, version: r.entry?.version };
      });
    },

    firstEmpty() {
      return this.list().find((s) => s.status === 'empty')?.slot ?? null;
    },

    load(slot) {
      const r = available ? readRaw(slot) : { status: 'empty' };
      return r.status === 'ok' ? r.entry.state : null;
    },

    // true se gravou; false se o storage recusou (cheio, bloqueado, modo privado).
    write(slot, state) {
      if (!available) return false;
      try {
        storage.setItem(key(slot), JSON.stringify({ app: APP, version, savedAt: Date.now(), info: describe(state), state }));
        return true;
      } catch { return false; }
    },

    remove(slot) {
      if (!available) return;
      try { storage.removeItem(key(slot)); } catch { /* ignora */ }
    },

    // Conteúdo do arquivo de exportação (mesmo formato do slot).
    exportFile(state) {
      const info = describe(state);
      const text = JSON.stringify({ app: APP, version, exportedAt: Date.now(), info, state });
      const safe = String(state.player?.name ?? 'piloto').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'piloto';
      return { filename: `apex-${safe}-${state.year}-seed${state.seed}.json`, text };
    },

    // Lê o texto de um arquivo exportado. Lança Error com mensagem em português se não servir.
    parseImport(text) {
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('Este arquivo não é um save do Apex (não é JSON válido).'); }
      if (!data || data.app !== APP || typeof data.state !== 'object') throw new Error('Este arquivo não é um save do Apex.');
      if (data.version !== version) throw new Error(`Este save é da versão ${data.version} do jogo e o jogo está na versão ${version}. Não dá para continuar essa carreira.`);
      try { validate(data.state); } catch { throw new Error('O save está corrompido e não pôde ser lido.'); }
      return data.state;
    },
  };
}
