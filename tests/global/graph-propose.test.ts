import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

/**
 * graph-propose.test.ts — the review-gated edge proposals and the deterministic
 * half of the supersede detector.
 *
 * The model-backed half (does a page *claim* to supersede?) is asserted in
 * `onnx.test.ts`, next to the primitive it uses. What is tested here is the part
 * that must hold regardless of the model: target resolution is deterministic and
 * picks the *longest* match, proposals round-trip through the review file, and
 * only `accept-candidates` turns a proposal into an edge.
 */

const CONFIG_DIR = path.resolve(__dirname, '..', '..')

let g: any
beforeAll(async () => {
  g = await import(path.join(CONFIG_DIR, 'skills', 'graph-context', 'scripts', 'graphlib.ts'))
}, 60_000)

function tmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-propose-'))
  fs.mkdirSync(path.join(dir, '.opencode', 'state', 'vector'), { recursive: true })
  return dir
}

describe('graph: supersede target resolution', () => {
  const page = { id: 'decision:context/decisions', type: 'decision', title: 'decisions', path: null }

  it('picks the longest title that appears in the page', () => {
    // "cache" and "caching strategy" both match; the specific one must win, or
    // the edge points at the wrong page.
    const nodes = [
      page,
      { id: 'pattern:cache', type: 'pattern', title: 'cache', path: null },
      { id: 'pattern:caching-strategy', type: 'pattern', title: 'caching strategy', path: null },
    ]
    const target = g.resolveSupersedeTarget(
      page,
      'This decision supersedes the caching strategy described earlier.',
      nodes,
    )
    expect(target?.id).toBe('pattern:caching-strategy')
  })

  it('returns null rather than guessing when no title is named', () => {
    const nodes = [
      page,
      { id: 'pattern:unrelated', type: 'pattern', title: 'unrelated thing', path: null },
    ]
    expect(g.resolveSupersedeTarget(page, 'nothing relevant is mentioned here', nodes)).toBeNull()
  })

  it('never resolves a page to itself', () => {
    expect(g.resolveSupersedeTarget(page, 'decisions decisions decisions', [page])).toBeNull()
  })
})

describe('graph: candidate review surface', () => {
  it('round-trips proposals and promotes them to edges only on accept', () => {
    const dir = tmpProject()
    try {
      g.upsertNode(dir, { id: 'pattern:old', type: 'pattern', title: 'old thing' })
      g.upsertNode(dir, { id: 'pattern:new', type: 'pattern', title: 'new thing' })

      const file = g.writeEdgeCandidates(dir, [
        { src: 'pattern:new', dst: 'pattern:old', type: 'supersedes', confidence: 0.9, evidence: 'test' },
      ])
      expect(fs.existsSync(file)).toBe(true)
      expect(g.readEdgeCandidates(dir)).toHaveLength(1)

      // Writing a candidate must NOT create the edge — the whole point of the
      // review gate.
      const before = g.getNeighbors(dir, 'pattern:new', 1)
      expect(before.some((n: any) => n.id === 'pattern:old')).toBe(false)

      const accepted = g.acceptEdgeCandidates(dir, g.readEdgeCandidates(dir))
      expect(accepted).toBe(1)
      const after = g.getNeighbors(dir, 'pattern:new', 1)
      expect(after.some((n: any) => n.id === 'pattern:old' && n.edge_type === 'supersedes')).toBe(true)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('tolerates an absent or malformed candidate file', () => {
    const dir = tmpProject()
    try {
      expect(g.readEdgeCandidates(dir)).toEqual([])
      const file = g.edgeCandidatePath(dir)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, '{ not json')
      expect(g.readEdgeCandidates(dir)).toEqual([])
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('propose degrades to no candidates when the graph store is absent', async () => {
    const dir = tmpProject()
    try {
      const r = await g.proposeEdgeCandidates(dir)
      expect(r.candidates).toEqual([])
      expect(r.modelAvailable).toBe(false)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
