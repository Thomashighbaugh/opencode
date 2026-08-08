/**
 * Test helpers for the vectorize-context suite.
 *
 * Hermetic design: a deterministic hash-based embedder stands in for Ollama,
 * so tests run with ZERO network access and ZERO native-model dependencies.
 * Embeddings are token-overlap-correlated: texts sharing tokens get similar
 * vectors, texts with disjoint vocabularies get near-orthogonal vectors.
 * Fixtures use disjoint token vocabularies per file, which makes ranking
 * assertions deterministic (not probabilistic).
 */
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SCRIPTS_DIR = path.resolve(__dirname, '..', 'scripts');
export const EMBEDDING_DIM = 1024;
export const EMBED_MODEL = 'test-embed-model';

// ─── Deterministic hash embedder ───────────────────────────────────────────

function tokenVector(token) {
  // FNV-1a hash → xorshift PRNG → 16 ±1 entries in a 1024-dim vector.
  const v = new Float64Array(EMBEDDING_DIM);
  let h = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let x = h >>> 0;
  for (let i = 0; i < 16; i++) {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5; x >>>= 0;
    const dim = x % EMBEDDING_DIM;
    const sign = ((x >>> 9) & 1) ? 1 : -1;
    v[dim] += sign;
  }
  return v;
}

export function embedText(text) {
  const tokens = text.toLowerCase().match(/[a-z0-9_]{2,}/g) || [];
  const v = new Float64Array(EMBEDDING_DIM);
  for (const t of tokens) {
    const tv = tokenVector(t);
    for (let i = 0; i < EMBEDDING_DIM; i++) v[i] += tv[i];
  }
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm);
  if (norm === 0) {
    v[0] = 1; // empty/degenerate text — deterministic vector
  } else {
    for (let i = 0; i < EMBEDDING_DIM; i++) v[i] /= norm;
  }
  return Array.from(v);
}

// ─── Mock Ollama /api/embed server ─────────────────────────────────────────

export async function startMockEmbedServer() {
  const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || !req.url.startsWith('/api/embed')) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end('{}');
      return;
    }
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const { input } = JSON.parse(body);
        const list = Array.isArray(input) ? input : [input];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ embeddings: list.map(embedText) }));
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end('{}');
      }
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}`;
  return {
    url,
    close() {
      server.closeAllConnections();
      return new Promise((r) => server.close(r));
    },
  };
}

// ─── Fixture ───────────────────────────────────────────────────────────────
// Design rules (determinism, not prose quality):
//   1. Each file uses a DISJOINT distinctive-token vocabulary.
//   2. Target files REPEAT their vocabulary (3-4×) so shared tokens dominate
//      the embedding → cosine ≈ 0.85+, far above both distance floors.
//   3. No camelCase (tokenizer splits on non-alphanumerics only).
// Expected chunk counts (veclib semantics):
//   context store: AGENTS.md 2, auth.md 3 (tiny section dropped), pagination.md 2,
//                  security.md 1, guide.md 1  → 9 chunks / 5 files
//   code store:    auth.ts 2, pagination.ts 1, helpers.js 2, old.py 1,
//                  my-tool.ts 1              → 7 chunks / 5 files

const FIXTURE_FILES = {
  'AGENTS.md': `# Hubs

The hubs orchestration project defines hubs agents workflows and hubs skills for autonomous hubs coding sessions.

## Orchestration

Ralph orchestration loops orchestrate tasks until orchestration completes with verification gates.
`,

  '.opencode/context/frameworks/auth.md': `---
title: Auth
---
# Auth Overview

The auth login token refresh flow repeats: auth login, token refresh, auth login, token refresh, auth login.

## Authentication

The authentication flow: auth login, token issue, refresh rotation. Token refresh checks auth login before issuing a fresh token.

### Token Refresh

Refresh rotates: a refresh token refreshes the auth login. Token refresh keeps auth login valid and issues a new token.

## Tiny
short
`,

  '.opencode/context/patterns/pagination.md': `# Pagination

The pagination guide shows cursor pages with pagination limits and pagination offsets for large pagination result sets.

## Pagination

Cursor based pagination pages through large result sets. Each pagination page carries a pagination cursor and pagination limit with pagination offset values.
`,

  '.opencode/rules/security.md': `## Secrets

Secrets api keys leak through logs. Secrets leak api key values when api key errors are logged. Never log secrets or api keys.
`,

  '.opencode/docs/guide.md': `## Guide

The guide lists guide examples for every guide command flag and guide option. Run each guide example with the guide command flags to see guide output.
`,

  'src/auth.ts': `export function login(auth, password) {
  const ok = verifyAuth(auth, password);
  return ok ? makeToken(auth) : null;
}

export async function refreshToken(token, auth) {
  const claims = verifyToken(token, auth);
  return claims && token ? makeToken(auth) : null;
}
`,

  'src/pagination.ts': `export function paginate(query, limit, offset) {
  const rows = queryRows(query, limit, offset);
  return cursorPage(rows, limit, offset);
}
`,

  'src/utils/helpers.js': `export function formatDate(date) {
  return date.toISOString();
}

export function clampValue(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
`,

  'src/legacy/old.py': `def parse_config(path):
    yaml_text = read_file(path)
    return yaml_load(yaml_text)
`,

  '.opencode/tools/my-tool.ts': `export function scanEmbeddings() {
  const index = loadVectorIndex();
  return index.search();
}
`,

  // MUST be excluded from the code store:
  'node_modules/dep/index.js': `export const shadow = 'must not be indexed';`,
  'dist/bundle.js': `export const bundle = 'must not be indexed';`,
  '.opencode/state/session.json': `{"token": "sk-secret-xyz"}`,
  '.opencode/cache/embeddings.json': `{}`,
  'README.md': `# Readme — markdown is not code and not scoped context.`,

  // Non-md in context dirs + node_modules inside context — must be excluded:
  '.opencode/context/notes.txt': 'plain text, not markdown',
  '.opencode/context/node_modules/secret.md': '# secret — must not be indexed',
};

// Expected chunk counts keyed by file suffix (rel-path bases differ between stores).
export const EXPECTED_CONTEXT_CHUNKS = {
  'AGENTS.md': 2,
  'auth.md': 3,
  'pagination.md': 2,
  'security.md': 1,
  'guide.md': 1,
};
export const EXPECTED_CONTEXT_TOTAL = 9;

export const EXPECTED_CODE_CHUNKS = {
  'auth.ts': 2,
  'pagination.ts': 1,
  'helpers.js': 2,
  'old.py': 1,
  'my-tool.ts': 1,
};
export const EXPECTED_CODE_TOTAL = 7;

const trackedDirs = new Set();

export function makeFixture(extraFiles = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vec-test-'));
  trackedDirs.add(root);
  for (const [rel, content] of Object.entries({ ...FIXTURE_FILES, ...extraFiles })) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return { root, opencodeDir: path.join(root, '.opencode') };
}

export function cleanupFixture() {
  for (const dir of trackedDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  trackedDirs.clear();
}

export function touchFile(absPath, secondsAhead = 2) {
  const future = new Date(Date.now() + secondsAhead * 1000);
  fs.utimesSync(absPath, future, future);
}

// ─── Child-process helpers ─────────────────────────────────────────────────

/**
 * Run a scripts/ CLI as an ASYNC child process (spawn, not spawnSync —
 * spawnSync would block the event loop and starve the in-process mock
 * embed server, deadlocking every child that calls /api/embed).
 */
export function runScript(scriptName, args = [], extraEnv = {}, opts = {}) {
  const child = spawn(process.execPath, [path.join(SCRIPTS_DIR, scriptName), ...args], {
    env: { ...process.env, ...extraEnv },
    ...opts,
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => (stdout += d));
  child.stderr.on('data', (d) => (stderr += d));
  return new Promise((resolve) => {
    const timer = setTimeout(() => child.kill('SIGKILL'), opts.timeoutMs ?? 60_000);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

let mockUrl = '';
export function setMockUrl(url) { mockUrl = url; }

export function testEnv(root) {
  return {
    OLLAMA_URL: mockUrl,
    EMBED_MODEL,
    OPCODE_DIR: path.join(root, '.opencode'),
    RERANK_DISABLED: '1',
  };
}

export { crypto };
