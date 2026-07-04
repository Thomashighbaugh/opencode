#!/usr/bin/env node
// @file        journal.mjs
// @section     orchestrate
// @brief       Event-sourced journal for orchestration runs
//
// Modes:
//   append  <type> <agent> <taskHash> [payloadFile]  — append a new event
//   read    [seqStart] [seqEnd]                       — print event range
//   tail    [N]                                       — print last N events
//   verify                                            — verify checksums, report tampering
//   replay                                            — print full event stream, sorted by seq
//   rotate                                            — close current.jsonl, archive by session ID
//   stats                                             — event counts by type + size + first/last ts
//
// Each event line in current.jsonl:
//   {"seq":1,"ts":"...Z","type":"dispatch","agent":"executor",
//    "taskHash":"abc123","callID":"...","payload":{},"checksum":"sha256:..."}
//
// Checksum is SHA-256 over the canonicalized event body (everything except
// the checksum field, sorted keys, no whitespace), hex digest. Verify mode
// re-computes the hash for each line and flags drift.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, statSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const JOURNAL_DIR = process.env.JOURNAL_DIR ||
  join(process.cwd(), '.opencode', 'state', 'orchestration', 'journal')
const CURRENT = join(JOURNAL_DIR, 'current.jsonl')
const ARCHIVED = join(JOURNAL_DIR, 'archived')
const MANIFEST = join(JOURNAL_DIR, 'manifest.json')

// ── Helpers ──────────────────────────────────────────────────────────

function ensureDir(p) { if (!existsSync(p)) mkdirSync(p, { recursive: true }) }

function loadManifest() {
  if (!existsSync(MANIFEST)) return { schemaVersion: 1, sessionId: null, rotation: 0, lineCount: 0 }
  return JSON.parse(readFileSync(MANIFEST, 'utf-8'))
}

function saveManifest(m) {
  ensureDir(JOURNAL_DIR)
  writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n')
}

function nextSeq() {
  if (!existsSync(CURRENT)) return 1
  const lines = readFileSync(CURRENT, 'utf-8').split('\n').filter(l => l.trim())
  if (lines.length === 0) return 1
  const last = JSON.parse(lines[lines.length - 1])
  return (last.seq || 0) + 1
}

function computeChecksum(eventBody) {
  // Sort top-level keys into a new object so the hash is deterministic
  // independent of property insertion order. Do NOT use the array-replacer
  // form of JSON.stringify — that acts as a whitelist and silently drops
  // nested properties whose names aren't in the parent's key set.
  const sorted = {}
  for (const k of Object.keys(eventBody).sort()) sorted[k] = eventBody[k]
  return 'sha256:' + createHash('sha256').update(JSON.stringify(sorted)).digest('hex')
}

function coercePayload(arg) {
  if (!arg) return {}
  // Inline JSON string (starts with { or [) — parse directly
  if (arg.startsWith('{') || arg.startsWith('[')) {
    try { return JSON.parse(arg) } catch { return {} }
  }
  // Otherwise treat as file path
  try { return JSON.parse(readFileSync(arg, 'utf-8')) } catch { return {} }
}

function appendEvent(type, agent, taskHash, callID = '', payload = {}) {
  ensureDir(JOURNAL_DIR)
  const m = loadManifest()
  const seq = nextSeq()
  const ts = new Date().toISOString()
  const body = { seq, ts, type, agent, taskHash, callID, payload }
  if (type === 'session.open' && !m.sessionId) {
    m.sessionId = callID || `s-${ts.replace(/[:.]/g, '')}`
    saveManifest(m)
  }
  const checksum = computeChecksum(body)
  const line = JSON.stringify({ ...body, checksum })
  appendFileSync(CURRENT, line + '\n')
  m.lineCount = (m.lineCount || 0) + 1
  saveManifest(m)
  process.stdout.write(JSON.stringify({ ok: true, seq, checksum }) + '\n')
}

function readLines() {
  if (!existsSync(CURRENT)) return []
  return readFileSync(CURRENT, 'utf-8').split('\n').filter(l => l.trim())
}

function readRange(start, end) {
  const lines = readLines()
  const out = []
  for (const line of lines) {
    try {
      const e = JSON.parse(line)
      if ((start === undefined || e.seq >= start) && (end === undefined || e.seq <= end)) {
        out.push(e)
      }
    } catch {/* skip malformed */}
  }
  process.stdout.write(JSON.stringify(out, null, 2) + '\n')
}

function tailEvents(n = 10) {
  const lines = readLines()
  const tail = lines.slice(-n)
  const out = tail.map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
  process.stdout.write(JSON.stringify(out, null, 2) + '\n')
}

function verifyJournal() {
  const lines = readLines()
  let ok = 0, bad = 0
  const drift = []
  for (const line of lines) {
    try {
      const e = JSON.parse(line)
      const stored = e.checksum
      const body = { ...e }; delete body.checksum
      const computed = computeChecksum(body)
      if (stored !== computed) {
        bad++
        drift.push({ seq: e.seq, stored, computed })
      } else {
        ok++
      }
    } catch { bad++ }
  }
  process.stdout.write(JSON.stringify({ ok, bad, drift }, null, 2) + '\n')
  process.exit(bad > 0 ? 1 : 0)
}

function replayJournal() {
  const lines = readLines()
  const events = lines.map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
  events.sort((a, b) => a.seq - b.seq)
  for (const e of events) {
    process.stdout.write(`[${e.seq}] ${e.ts} ${e.type} agent=${e.agent} task=${(e.taskHash || '').slice(0, 8)}${e.callID ? ` call=${e.callID.slice(0, 8)}` : ''}\n`)
  }
}

function rotateJournal() {
  if (!existsSync(CURRENT)) { process.stdout.write('no current journal to rotate\n'); return }
  const m = loadManifest()
  const sid = m.sessionId || `s-${Date.now()}`
  const archivePath = join(ARCHIVED, `session-${sid}.jsonl`)
  ensureDir(ARCHIVED)
  renameSync(CURRENT, archivePath)
  m.rotation = (m.rotation || 0) + 1
  m.lineCount = 0
  saveManifest(m)
  process.stdout.write(JSON.stringify({ rotated: archivePath, rotation: m.rotation }) + '\n')
}

function stats() {
  const lines = readLines()
  const events = lines.map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
  const counts = {}
  for (const e of events) counts[e.type] = (counts[e.type] || 0) + 1
  const first = events[0]?.ts
  const last = events[events.length - 1]?.ts
  const m = loadManifest()
  const sizeBytes = existsSync(CURRENT) ? statSync(CURRENT).size : 0
  process.stdout.write(JSON.stringify({
    total: events.length, counts, first, last, sizeBytes,
    sessionId: m.sessionId, rotation: m.rotation || 0,
  }, null, 2) + '\n')
}

// ── CLI ──────────────────────────────────────────────────────────────

const [mode, ...rest] = process.argv.slice(2)

ensureDir(JOURNAL_DIR)

switch (mode) {
  case 'append': {
    const [type, agent, taskHash, callID, payloadArg] = rest
    const payload = coercePayload(payloadArg)
    appendEvent(type, agent, taskHash, callID, payload)
    break
  }
  case 'read': {
    const start = rest[0] ? parseInt(rest[0], 10) : undefined
    const end = rest[1] ? parseInt(rest[1], 10) : undefined
    readRange(start, end)
    break
  }
  case 'tail': {
    tailEvents(rest[0] ? parseInt(rest[0], 10) : 10)
    break
  }
  case 'verify': {
    verifyJournal()
    break
  }
  case 'replay': {
    replayJournal()
    break
  }
  case 'rotate': {
    rotateJournal()
    break
  }
  case 'stats': {
    stats()
    break
  }
  default: {
    process.stderr.write(`journal.mjs: unknown mode '${mode}'\n`)
    process.stderr.write('usage: journal.mjs <append|read|tail|verify|replay|rotate|stats> [args]\n')
    process.exit(2)
  }
}