import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { buildCsp, buildHead, sha256 } from '../tools/site-head.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('sha256 segue o formato do CSP (vetor conhecido de "abc")', () => {
  assert.equal(sha256('abc'), "'sha256-ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0='");
});

test('política padrão: tudo fechado, script e estilo só por hash, nada de unsafe-inline em script', () => {
  const csp = buildCsp({ scriptHashes: ["'sha256-AAA'"], styleHashes: ["'sha256-BBB'"] });
  assert.match(csp, /(^|; )default-src 'none'(;|$)/);
  assert.match(csp, /script-src 'sha256-AAA'(;|$)/);
  assert.match(csp, /style-src-elem 'sha256-BBB' https:\/\/fonts\.googleapis\.com/);
  assert.match(csp, /style-src-attr 'unsafe-inline'/);
  assert.match(csp, /font-src https:\/\/fonts\.gstatic\.com/);
  assert.match(csp, /connect-src 'self'(;|$)/);
  assert.match(csp, /base-uri 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /form-action 'none'/);
  const scriptDirective = csp.split('; ').find((d) => d.startsWith('script-src '));
  assert.doesNotMatch(scriptDirective, /unsafe-inline|unsafe-eval/);
  assert.doesNotMatch(csp, /unsafe-eval/);
});

test('endereço do Worker e GoatCounter entram na política só quando configurados', () => {
  const base = buildCsp({ scriptHashes: ["'sha256-AAA'"], styleHashes: [] });
  assert.doesNotMatch(base, /workers\.dev|goatcounter|zgo\.at/);
  const full = buildCsp({ scriptHashes: ["'sha256-AAA'"], styleHashes: [], endpoint: 'https://fb.exemplo.workers.dev/feedback?x=1', goatcounter: 'meusite' });
  assert.match(full, /connect-src 'self' https:\/\/fb\.exemplo\.workers\.dev https:\/\/meusite\.goatcounter\.com(;|$)/);
  assert.match(full, /script-src 'sha256-AAA' https:\/\/gc\.zgo\.at/);
  assert.match(full, /img-src 'self' data: https:\/\/meusite\.goatcounter\.com/);
  assert.doesNotMatch(full, /fb\.exemplo\.workers\.dev\/feedback/, 'só a origem, nunca o caminho');
});

test('o cabeçalho leva a política como primeiro item, escapada', () => {
  const h = buildHead({ siteUrl: 'https://bandeirada.alexarnoni.com', csp: "default-src 'none'" });
  assert.ok(h.startsWith('<meta http-equiv="Content-Security-Policy" content="default-src \'none\'">'));
  assert.doesNotMatch(buildHead({ siteUrl: 'https://bandeirada.alexarnoni.com' }), /Content-Security-Policy/);
});

test('build real: os hashes da política batem com o script e o estilo embutidos na página', () => {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (k.startsWith('BANDEIRADA_')) delete env[k];
  const r = spawnSync(process.execPath, ['tools/build-ui.js'], { cwd: root, env, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);

  const html = readFileSync(join(root, 'dist/index.html'), 'utf8');
  const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)?.[1];
  assert.ok(csp, 'página sem política');
  assert.ok(html.indexOf('Content-Security-Policy') < html.indexOf('<script'), 'a política vem antes de qualquer script');

  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  assert.equal(scripts.length, 1, 'um único script embutido (sem análise configurada)');
  assert.ok(csp.includes(sha256(scripts[0])), 'hash do script na política');
  const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  assert.equal(styles.length, 1);
  assert.doesNotMatch(styles[0], /\r/, 'hash calculado com LF, como o parser HTML, mesmo com checkout CRLF no Windows');
  assert.ok(csp.includes(sha256(styles[0])), 'hash do estilo na política');

  // Regressão: o PowerShell em pt-BR gerou "x=""10,5""" (vírgula decimal) no logotipo e no ícone. SVG só aceita ponto.
  assert.doesNotMatch(html, /\s(x|y|width|height|cx|cy|r|rx|ry)="-?\d+,\d+"/, 'número com vírgula decimal em atributo SVG');
  assert.doesNotMatch(decodeURIComponent(html.match(/<link rel="icon"[^>]*href="([^"]+)"/)[1]), /\s(x|y|width|height)="-?\d+,\d+"/, 'favicon com vírgula decimal');
  // Sem scripts externos além dos permitidos (nenhum, no build padrão).
  assert.doesNotMatch(html, /<script[^>]*\ssrc=/);
  assert.doesNotMatch(html, /\son(click|load|error)=/i, 'sem manipuladores inline, que a política bloquearia');
});

test('build real publica o contato de segurança nos dois caminhos', () => {
  assert.ok(existsSync(join(root, 'dist/.well-known/security.txt')));
  assert.ok(existsSync(join(root, 'dist/security.txt')));
  const txt = readFileSync(join(root, 'dist/.well-known/security.txt'), 'utf8');
  assert.match(txt, /^Contact: https:\/\//m);
  assert.match(txt, /^Expires: \d{4}-\d{2}-\d{2}T/m);
  const exp = new Date(txt.match(/^Expires: (.+)$/m)[1]);
  assert.ok(exp > new Date(), 'security.txt não pode estar vencido');
});
