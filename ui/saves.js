// Salvamento local em slots + exportar/importar arquivo (roadmap F.7).
// Sem DOM: recebe o storage (localStorage em produção, um Map nos testes), a versão do jogo e
// duas funções da engine (describe/validate). Cada slot guarda { app, version, savedAt, info, state }.

export const SLOT_COUNT = 3;
// Ids internos antigos (do tempo em que o jogo se chamava Apex) ficam como estão: mudar apagaria saves existentes.
export const SAVE_SCHEMA_VERSION = 1;
const APP = 'apex';
const key = (i) => `apex.slot.${i}`;

// O envelope da v0.14 e seguintes não tinha schemaVersion. A engine continua na versão 1.
function migrate(entry) {
  if (!entry?.state || typeof entry.state !== 'object' || Array.isArray(entry.state)) throw new Error('Estado inválido');
  if (entry.schemaVersion === SAVE_SCHEMA_VERSION) return entry;
  if (entry.schemaVersion !== undefined && entry.schemaVersion !== 0) return null;
  const state = { ...entry.state, history: entry.state.history ?? [] };
  if (state.f1) state.f1 = { ...state.f1, racePosture: state.f1.racePosture ?? 'pace' };
  return { ...entry, schemaVersion: SAVE_SCHEMA_VERSION, state };
}

export function createSaves({ storage, version, describe, validate }) {
  const available = !!storage;
  const observed = new Map();

  function readRaw(i) {
    let raw;
    try { raw = storage.getItem(key(i)); } catch { return { status: 'corrupt' }; }
    if (raw == null) return { status: 'empty' };
    let entry;
    try { entry = JSON.parse(raw); } catch { return { status: 'corrupt' }; }
    if (!entry || entry.app !== APP || !entry.state || typeof entry.state !== 'object') return { status: 'corrupt' };
    if (entry.version !== version) return { status: 'old', entry };
    try {
      const migrated = migrate(entry);
      if (!migrated) return { status: 'old', entry };
      validate(migrated.state);
      return { status: 'ok', entry: migrated, raw };
    } catch { return { status: 'corrupt' }; }
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
      if (r.status === 'ok') observed.set(slot, r.raw);
      return r.status === 'ok' ? r.entry.state : null;
    },

    changed(slot) {
      if (!observed.has(slot)) return false;
      try { return storage.getItem(key(slot)) !== observed.get(slot); } catch { return false; }
    },

    // true se gravou; false se o storage recusou (cheio, bloqueado, modo privado).
    write(slot, state, { newSlot = false } = {}) {
      if (!available) return false;
      try {
        const raw = JSON.stringify({ app: APP, version, schemaVersion: SAVE_SCHEMA_VERSION, savedAt: Date.now(), info: describe(state), state });
        if (storage.getItem(key(slot)) !== (newSlot ? null : observed.get(slot) ?? null)) return false;
        storage.setItem(key(slot), raw);
        observed.set(slot, raw);
        return true;
      } catch { return false; }
    },

    remove(slot) {
      if (!available) return;
      try { storage.removeItem(key(slot)); observed.delete(slot); } catch { /* ignora */ }
    },

    // Conteúdo do arquivo de exportação (mesmo formato do slot).
    exportFile(state) {
      const info = describe(state);
      const text = JSON.stringify({ app: APP, version, schemaVersion: SAVE_SCHEMA_VERSION, exportedAt: Date.now(), info, state });
      const safe = String(state.player?.name ?? 'piloto').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'piloto';
      return { filename: `bandeirada-${safe}-${state.year}-seed${state.seed}.json`, text };
    },

    // Lê o texto de um arquivo exportado. Lança Error com mensagem em português se não servir.
    parseImport(text) {
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('Este arquivo não é um save da Bandeirada (não é JSON válido).'); }
      if (!data || data.app !== APP || typeof data.state !== 'object') throw new Error('Este arquivo não é um save da Bandeirada.');
      if (data.version !== version) throw new Error(`Este save é da versão ${data.version} do jogo e o jogo está na versão ${version}. Não dá para continuar essa carreira.`);
      let migrated;
      try { migrated = migrate(data); if (migrated) validate(migrated.state); } catch { throw new Error('O save está corrompido e não pôde ser lido.'); }
      if (!migrated) throw new Error('Este save usa uma versão de formato incompatível.');
      return migrated.state;
    },
  };
}
