import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createSaves, SLOT_COUNT } from '../ui/saves.js';
import { createCareer, applyDecision, getView, ENGINE_VERSION } from '../engine/game.js';

const describe = (s) => ({ title: s.player.name, seed: s.seed });
const validate = (s) => getView(s);
const fakeStorage = (data = new Map()) => ({
  data,
  getItem: (k) => (data.has(k) ? data.get(k) : null),
  setItem: (k, v) => { data.set(k, v); },
  removeItem: (k) => { data.delete(k); },
});
const make = (storage = fakeStorage()) => createSaves({ storage, version: ENGINE_VERSION, describe, validate });
const career = (seed = 1) => createCareer({ surname: 'Teste', number: 7, style: 'con', seed });

test('slots começam vazios e há 3', () => {
  const saves = make();
  const list = saves.list();
  assert.equal(list.length, SLOT_COUNT);
  assert.ok(list.every((s) => s.status === 'empty'));
  assert.equal(saves.firstEmpty(), 1);
});

test('gravar e carregar devolve a mesma carreira; o slot fica ocupado', () => {
  const saves = make();
  let s = applyDecision(career(5), { option: 'A' });
  assert.equal(saves.write(2, s), true);
  assert.deepEqual(saves.load(2), s);
  assert.equal(saves.list()[1].status, 'ok');
  assert.equal(saves.list()[1].info.title, 'Teste');
  assert.equal(saves.firstEmpty(), 1);
  // a carreira carregada continua jogável e igual
  const a = applyDecision(saves.load(2), saves.load(2).pendingDecision.type === 'offer_pick' ? { id: 'stay' } : { id: 'ok' });
  assert.ok(a);
  s = null;
});

test('apagar libera o slot', () => {
  const saves = make();
  saves.write(1, career());
  saves.remove(1);
  assert.equal(saves.list()[0].status, 'empty');
  assert.equal(saves.load(1), null);
});

test('save de outra versão aparece como "old" e não carrega', () => {
  const store = fakeStorage();
  const old = createSaves({ storage: store, version: ENGINE_VERSION - 1, describe, validate });
  old.write(1, career());
  const saves = make(store);
  const [slot] = saves.list();
  assert.equal(slot.status, 'old');
  assert.equal(slot.version, ENGINE_VERSION - 1);
  assert.equal(saves.load(1), null);
});

test('conteúdo inválido no storage aparece como "corrupt"', () => {
  const store = fakeStorage();
  store.setItem('apex.slot.1', '{ não é json');
  store.setItem('apex.slot.2', JSON.stringify({ app: 'outro', state: {} }));
  store.setItem('apex.slot.3', JSON.stringify({ app: 'apex', version: ENGINE_VERSION, state: { lixo: true } }));
  const saves = make(store);
  assert.deepEqual(saves.list().map((s) => s.status), ['corrupt', 'corrupt', 'corrupt']);
});

test('storage que recusa gravar devolve false; sem storage nada quebra', () => {
  const full = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
  assert.equal(make(full).write(1, career()), false);
  const none = createSaves({ storage: null, version: ENGINE_VERSION, describe, validate });
  assert.equal(none.available, false);
  assert.equal(none.write(1, career()), false);
  assert.equal(none.list().every((s) => s.status === 'empty'), true);
  assert.equal(none.load(1), null);
});

test('exportar e importar fazem ida e volta; nome do arquivo é seguro', () => {
  const saves = make();
  const s = applyDecision(createCareer({ surname: 'Fitti Paldi', number: 9, style: 'agg', seed: 77 }), { option: 'B' });
  const { filename, text } = saves.exportFile(s);
  assert.match(filename, /^bandeirada-Fitti-Paldi-\d{4}-seed77\.json$/);
  assert.deepEqual(saves.parseImport(text), s);
});

test('importar rejeita arquivo que não é save, de outra versão ou corrompido', () => {
  const saves = make();
  assert.throws(() => saves.parseImport('isso não é json'), /não é JSON válido/);
  assert.throws(() => saves.parseImport(JSON.stringify({ foo: 1 })), /não é um save da Bandeirada/);
  const wrongVersion = JSON.stringify({ app: 'apex', version: ENGINE_VERSION + 5, state: career() });
  assert.throws(() => saves.parseImport(wrongVersion), /versão/);
  const bad = JSON.stringify({ app: 'apex', version: ENGINE_VERSION, state: { lixo: true } });
  assert.throws(() => saves.parseImport(bad), /corrompido/);
});
