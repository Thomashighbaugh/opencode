import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { loadConfig } from '../helpers/load-config'

/**
 * efficiency-token.test.ts — TOKEN efficiency.
 *
 * Two budgets are being protected, and conflating them is the usual failure:
 *   REQUEST efficiency  — how many round-trips to the inference host.
 *   TOKEN efficiency    — how big the prompt cobbled together and sent.
 *
 * `efficiency-first.md` draws the line explicitly: neither may ever constrain
 * output code or text the user asked for. A test that only checked "keep it
 * small" would pass an implementation that silently truncated the user's work.
 * So every budget assertion here is paired with a check that the exemption is
 * still stated where the budget is enforced.
 */

const CONFIG_DIR = path.resolve(__dirname, '..', '..')
const { config } = loadConfig(CONFIG_DIR)!
const RULES = path.join(CONFIG_DIR, 'rules')
const HOOKS = fs.readFileSync(path.join(CONFIG_DIR, 'plugins', 'hooks', 'hooks.ts'), 'utf-8')

const readRule = (name: string) => fs.readFileSync(path.join(RULES, name), 'utf-8')

describe('token efficiency: the standing rule exists and is loaded', () => {
  it('rules/efficiency-first.md is registered as an instruction', () => {
    const inst = ((config.instructions as string[]) ?? []).map((i) => path.basename(i))
    expect(inst, 'the standing efficiency rule is not preloaded — it dilutes to nothing').toContain('efficiency-first.md')
  })

  it('the rule defines both budgets explicitly', () => {
    const src = readRule('efficiency-first.md')
    expect(src).toMatch(/request efficiency/i)
    expect(src).toMatch(/token efficiency/i)
  })

  it('the rule forbids constraining output code or requested text', () => {
    // The exemption is the whole reason the rule is safe to apply everywhere.
    const src = readRule('efficiency-first.md')
    expect(src).toMatch(/never constrains output code|never constrains output/i)
    expect(src).toMatch(/no length caps/i)
  })

  it('the rule yields to explicit user instruction', () => {
    const src = readRule('efficiency-first.md')
    expect(src).toMatch(/yields? to the user/i)
  })

  it('the rule is cross-referenced from the standing instruction block', () => {
    const agents = fs.readFileSync(path.join(CONFIG_DIR, 'AGENTS.md'), 'utf-8')
    expect(agents, 'AGENTS.md does not point at the standing rule').toContain('efficiency-first.md')
  })
})

describe('token efficiency: the per-turn reminder is present and small', () => {
  it('every turn carries an efficiency reminder', () => {
    expect(HOOKS).toMatch(/<efficiency>/)
  })

  it('the reminder states the exemption, so it cannot be over-applied', () => {
    // A standing "be efficient" with no carve-out is how agents start
    // truncating the user's requested output.
    expect(HOOKS).toMatch(/never truncated|Never apply this to output/i)
  })

  it('the reminder is small enough to be free', () => {
    const m = HOOKS.match(/`<efficiency>\\n` \+[\s\S]*?<\/efficiency>`/)
    expect(m, 'reminder block not found').toBeTruthy()
    // ~55 tokens today. It is paid on EVERY turn, so its own cost must stay
    // near zero; a bloated reminder spends more than it saves.
    expect(m![0].length, `reminder is ${m![0].length} chars — too expensive for a per-turn cost`).toBeLessThan(600)
  })
})

describe('token efficiency: injected context is budgeted', () => {
  const budgetOf = (name: string) => {
    const m = HOOKS.match(new RegExp(`const ${name} = (\\d+)`))
    return m ? parseInt(m[1], 10) : null
  }

  it('context, code and graph injections each have a declared budget', () => {
    expect(budgetOf('CONTEXT_TOKEN_BUDGET')).toBeGreaterThan(0)
    expect(budgetOf('CODE_TOKEN_BUDGET')).toBeGreaterThan(0)
    expect(budgetOf('GRAPH_TOKEN_BUDGET')).toBeGreaterThan(0)
  })

  it('injection is truncated to its budget, not merely hoped to fit', () => {
    // truncateToTokens is what actually enforces the budget; without the call
    // the constant is decorative.
    const truncations = HOOKS.match(/truncateToTokens\(/g) ?? []
    expect(truncations.length, 'injection budgets are declared but never applied').toBeGreaterThanOrEqual(3)
    expect(HOOKS).toMatch(/function truncateToTokens/)
  })

  it('the graph block is the smallest — it carries structure, not prose', () => {
    const g = budgetOf('GRAPH_TOKEN_BUDGET')!
    const c = budgetOf('CONTEXT_TOKEN_BUDGET')!
    const k = budgetOf('CODE_TOKEN_BUDGET')!
    expect(g, `graph=${g} context=${c} code=${k}`).toBeLessThan(c)
    expect(g).toBeLessThan(k)
  })

  it('total per-turn injection stays within a sane share of a context window', () => {
    const total = budgetOf('CONTEXT_TOKEN_BUDGET')! + budgetOf('CODE_TOKEN_BUDGET')! + budgetOf('GRAPH_TOKEN_BUDGET')!
    // 1800 tokens today. Anything approaching a 32k window on a routine turn
    // would be paying for retrieval on prompts that never needed it.
    expect(total, `total injection budget is ${total} tokens/turn`).toBeLessThan(4_000)
  })
})

describe('token efficiency: the retrieval ladder puts cheap sources first', () => {
  const rule = readRule('efficiency-first.md')

  it('the rule ranks local/vector sources above hosted search', () => {
    const ladderIdx = rule.indexOf('Retrieval Ladder')
    expect(ladderIdx, 'the rule no longer states a retrieval ladder').toBeGreaterThan(-1)
    const localIdx = rule.indexOf('graphQuery', ladderIdx)
    const hostedIdx = rule.indexOf('Web search', ladderIdx)
    expect(localIdx).toBeGreaterThan(-1)
    expect(hostedIdx).toBeGreaterThan(-1)
    expect(localIdx, 'hosted search is ranked above the local vector store').toBeLessThan(hostedIdx)
  })

  it('the rule requires checking caches before re-deriving', () => {
    expect(rule).toMatch(/cache/i)
    expect(rule).toMatch(/before re-deriving|before re-fetching|before re-deriving/i)
  })

  it('the context strategy points at the efficiency rule', () => {
    const cs = readRule('context-strategy.md')
    expect(cs).toContain('efficiency-first.md')
  })

  it('the output-compression rule defers to the efficiency rule for prompts', () => {
    // Two rules with overlapping scope need an explicit precedence, or the
    // model has to guess whether "make it shorter" applies to the prompt or
    // only to the reply.
    const oc = readRule('output-compression.md')
    expect(oc, 'output-compression does not defer to efficiency-first').toContain('efficiency-first.md')
  })
})

describe('token efficiency: expensive lookups are cached or fingerprinted', () => {
  it('the structure fingerprint is computed from fingerprints, not by re-reading everything', () => {
    // Re-hashing 64,000 identifier rows per rebuild cost ~220ms for nothing.
    const veclib = fs.readFileSync(path.join(CONFIG_DIR, 'skills', 'vectorize-context', 'scripts', 'veclib.ts'), 'utf-8')
    expect(veclib).toContain('CREATE TABLE IF NOT EXISTS code_files')
    expect(veclib).toContain('recordFileFacts')
  })

  it('context7 and MCP results are cached before re-fetching', () => {
    expect(HOOKS).toMatch(/context7_query-docs/)
    expect(HOOKS).toMatch(/getCache\('mcp'\)/)
  })

  it('negative results are cached too, so a repeat query is free', () => {
    // Only caching a hit means a query that returns nothing is re-run forever.
    expect(HOOKS).toMatch(/graphRelevant\.length > 0 \? 300_000 : 60_000/)
    expect(HOOKS).toMatch(/ctxRelevant\.length > 0 \? 300_000 : 60_000/)
  })

  it('read results are mtime-validated rather than trusted on a TTL alone', () => {
    expect(HOOKS).toMatch(/mtime/)
    expect(HOOKS).toMatch(/readCacheKey/)
  })
})

describe('token efficiency: nothing silently truncates the user-facing answer', () => {
  it('the compression rule preserves the verdict, disagreement, and error text', () => {
    const oc = readRule('output-compression.md')
    expect(oc, 'no preservation list').toMatch(/Preservation List/i)
    expect(oc).toMatch(/disagreement/i)
    expect(oc).toMatch(/error text/i)
  })

  it('the compression rule yields to an explicit request for detail', () => {
    const oc = readRule('output-compression.md')
    expect(oc).toMatch(/yields? to/i)
  })

  it('the compression rule prefers table over bullets over prose-with-buried-lists', () => {
    const oc = readRule('output-compression.md')
    expect(oc).toMatch(/Format Ladder/i)
    expect(oc, 'the buried-list prohibition is missing').toMatch(/buried list|Never.*buried/i)
  })
})
