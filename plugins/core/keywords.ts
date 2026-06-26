/**
 * Magic keyword detection and mode routing module for the Hubs plugin.
 *
 * Detects keywords in user prompts (ralph, autopilot, ultrawork, etc.),
 * resolves conflicts between multiple detected keywords, and determines
 * the appropriate mode action. Includes informational context filtering
 * to avoid false positives from questions about these keywords.
 */

// ============================================================================
// Types
// ============================================================================

export interface KeywordMatch {
  name: string
  args: string
}

// ============================================================================
// Keyword Patterns
// ============================================================================

export const KEYWORD_PATTERNS = {
  cancel: /\b(cancelomc|stopomc)\b/i,
  ralph: /\b(ralph|don't stop|must complete|until done)\b/i,
  autopilot: /\b(autopilot|auto pilot|auto-pilot|autonomous|full auto|fullsend)\b/i,
  autopilotBuild: /\b(build|create|make)\s+me\s+(an?\s+)?(app|feature|project|tool|plugin|website|api|server|cli|script|system|service|dashboard|bot|extension)\b/i,
  autopilotWant: /\bi\s+want\s+a\s+/i,
  ultrawork: /\b(ultrawork|ulw|uw)\b/i,
  ralplan: /\b(ralplan)\b/i,
  deepInterview: /\b(deep[\s-]interview|ouroboros)\b/i,
  aiSlopCleaner: /\b(ai[\s-]?slop|anti[\s-]?slop|deslop|de[\s-]?slop)\b/i,
  tdd: /\b(tdd)\b/i,
  tddTestFirst: /\btest\s+first\b/i,
  codeReview: /\b(code\s+review|review\s+code)\b/i,
  securityReview: /\b(security\s+review|review\s+security)\b/i,
  ultrathink: /\b(ultrathink|think hard|think deeply)\b/i,
  deepsearch: /\b(deepsearch)\b/i,
  analyze: /\b(deep[\s-]?analyze|deepanalyze)\b/i,
  newAgent: /\b(create[\s-]?agent|new[\s-]?agent|agent[\s-]?creator)\b/i,
  swarm: /\b(architect[\s-]?led|quality\s+pipeline|gated\s+pipeline|swarm)\b/i,
  vibeCode: /\b(vibe[\s-]?code|prototype|rapid\s+app|conversational\s+prototyping)\b/i,
  brownfield: /\b(existing\s+codebase|brownfield|legacy\s+project|add\s+feature)\b/i,
  remediate: /\b(fix\s+build|ci\s+fail|build\s+fail|pipeline\s+broken|remediate)\b/i,
  planExecute: /\b(plan\s+first|design\s+then\s+build|structured\s+approach|plan[\s-]?execute)\b/i,
  pair: /\b(pair\s+program|pairing|driver\s+navigator|pair)\b/i,
  commitProject: /\b(commit\s+changes|stage\s+files|git\s+commit)\b/i,
  harvestSession: /\b(save\s+session|harvest\s+context|extract\s+knowledge|session\s+memory)\b/i,
}

// ============================================================================
// Mode Messages (context injected when keyword triggers a mode)
// ============================================================================

export const MODE_MESSAGES: Record<string, string> = {
  ultrathink: `<think-mode>
**ULTRATHINK MODE ENABLED** - Extended reasoning activated.
You are now in deep thinking mode. Take your time to:
1. Thoroughly analyze the problem from multiple angles
2. Consider edge cases and potential issues
3. Think through the implications of each approach
4. Reason step-by-step before acting
</think-mode>`,

  deepsearch: `<search-mode>
MAXIMIZE SEARCH EFFORT. Launch multiple background agents IN PARALLEL:
- explore agents (codebase patterns, file structures)
- librarian agents (remote repos, official docs, GitHub examples)
Plus direct tools: Grep, Glob
NEVER stop at first result - be exhaustive.
</search-mode>`,

  analyze: `<analyze-mode>
ANALYSIS MODE. Gather context before diving deep:
- Search relevant code paths first
- Compare working vs broken behavior
- Synthesize findings before proposing changes
</analyze-mode>`,

  tdd: `<tdd-mode>
[TDD MODE ACTIVATED]
Write or update tests first when practical, confirm they fail for the right reason, then implement the minimal fix and re-run verification.
</tdd-mode>`,

  codeReview: `<code-review-mode>
[CODE REVIEW MODE ACTIVATED]
Perform a comprehensive code review of the relevant changes or target area. Focus on correctness, maintainability, edge cases, regressions, and test adequacy before recommending changes.
</code-review-mode>`,

  securityReview: `<security-review-mode>
[SECURITY REVIEW MODE ACTIVATED]
Perform a focused security review of the relevant changes or target area. Check trust boundaries, auth/authz, data exposure, input validation, command/file access, secrets handling, and escalation risks before recommending changes.
</security-review-mode>`,

  newAgent: `<new-agent-mode>
[NEW AGENT CREATOR MODE ACTIVATED]
Create a new agent following research-backed best practices:
1. Gather agent requirements (name, purpose, use cases)
2. Create minimal system prompt (~500 tokens)
3. Define tool usage patterns
4. Generate test suite (8 essential tests)
5. Register and validate
Use /new-agents create-agent command for the full workflow.
</new-agent-mode>`,
}

// ============================================================================
// Keyword Detection
// ============================================================================

export function sanitizeForKeywordDetection(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(\w[\w-]*)[\s>][\s\S]*?<\/\1>/g, '')
    .replace(/<\w[\w-]*(?:\s[^>]*)?\s*\/>/g, '')
    .replace(/https?:\/\/[^\s)>\]]+/g, '')
    .replace(/(?<=^|[\s"'`(])(?:\/)?(?:[\w.-]+\/)+[\w.-]+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
}

export function isAntiSlopCleanupRequest(text: string): boolean {
  const explicitPattern = /\b(ai[\s-]?slop|anti[\s-]?slop|deslop|de[\s-]?slop)\b/i
  const actionPattern = /\b(clean(?:\s*up)?|cleanup|refactor|simplify|dedupe|de-duplicate|prune)\b/i
  const smellPattern = /\b(slop|duplicate(?:d|s)?|duplication|dead\s+code|unused\s+code|over[\s-]?abstract(?:ion|ed)?|wrapper\s+layers?|boundary\s+violations?|needless\s+abstractions?|unnecessary\s+abstractions?|ai[\s-]?generated|generated\s+code|tech\s+debt)\b/i

  return explicitPattern.test(text) || (actionPattern.test(text) && smellPattern.test(text))
}

const INFORMATIONAL_INTENT_PATTERNS = [
  /\b(?:what(?:'s|\s+is)|what\s+are|how\s+(?:to|do\s+i)\s+use|explain|explanation|tell\s+me\s+about|describe)\b/i,
]

function isInformationalKeywordContext(text: string, position: number, keywordLength: number): boolean {
  const CONTEXT_WINDOW = 80
  const start = Math.max(0, position - CONTEXT_WINDOW)
  const end = Math.min(text.length, position + keywordLength + CONTEXT_WINDOW)
  const context = text.slice(start, end)

  return INFORMATIONAL_INTENT_PATTERNS.some(pattern => pattern.test(context))
}

function hasActionableKeyword(text: string, pattern: RegExp): boolean {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  const globalPattern = new RegExp(pattern.source, flags)

  for (const match of text.matchAll(globalPattern)) {
    if (match.index === undefined) continue
    if (isInformationalKeywordContext(text, match.index, match[0].length)) continue
    return true
  }

  return false
}

export function detectKeywords(prompt: string): KeywordMatch[] {
  const matches: KeywordMatch[] = []
  const cleanPrompt = sanitizeForKeywordDetection(prompt).toLowerCase()

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.cancel)) {
    matches.push({ name: 'cancel', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.ralph)) {
    matches.push({ name: 'ralph', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.autopilot) ||
      hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.autopilotBuild) ||
      hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.autopilotWant)) {
    matches.push({ name: 'autopilot', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.ultrawork)) {
    matches.push({ name: 'ultrawork', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.ralplan)) {
    matches.push({ name: 'ralplan', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.deepInterview)) {
    matches.push({ name: 'deep-interview', args: '' })
  }

  if (isAntiSlopCleanupRequest(cleanPrompt)) {
    matches.push({ name: 'ai-slop-cleaner', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.tdd) ||
      hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.tddTestFirst)) {
    matches.push({ name: 'tdd', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.codeReview)) {
    matches.push({ name: 'code-review', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.securityReview)) {
    matches.push({ name: 'security-review', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.ultrathink)) {
    matches.push({ name: 'ultrathink', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.deepsearch)) {
    matches.push({ name: 'deepsearch', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.analyze)) {
    matches.push({ name: 'analyze', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.newAgent)) {
    matches.push({ name: 'new-agent', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.swarm)) {
    matches.push({ name: 'swarm', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.vibeCode)) {
    matches.push({ name: 'vibe-code', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.brownfield)) {
    matches.push({ name: 'brownfield', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.remediate)) {
    matches.push({ name: 'remediate', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.planExecute)) {
    matches.push({ name: 'plan-execute', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.pair)) {
    matches.push({ name: 'pair', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.commitProject)) {
    matches.push({ name: '/project commit', args: '' })
  }

  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.harvestSession)) {
    matches.push({ name: '/harvest-context session', args: '' })
  }

  return matches
}

/**
 * Determine if mode activation requires user confirmation.
 * All modes except 'cancel' require explicit user consent before activation.
 * This prevents expensive multi-agent pipelines from auto-starting.
 */
export function shouldConfirmMode(matches: KeywordMatch[]): boolean {
  return matches.some(m => m.name !== 'cancel')
}

export function resolveConflicts(matches: KeywordMatch[]): KeywordMatch[] {
  const names = matches.map(m => m.name)

  if (names.includes('cancel')) {
    return [matches.find(m => m.name === 'cancel')!]
  }

  const priorityOrder = [
    'cancel', 'ralph',
    'swarm', 'vibe-code', 'brownfield', 'remediate', 'plan-execute', 'pair',
    'autopilot', 'ultrawork', 'ralplan',
    'deep-interview', 'ai-slop-cleaner', 'tdd', 'code-review',
    'security-review', 'ultrathink', 'deepsearch', 'analyze', 'new-agent',
    '/project commit', '/harvest-context session'
  ]

  const resolved = [...matches]
  resolved.sort((a, b) => priorityOrder.indexOf(a.name) - priorityOrder.indexOf(b.name))

  return resolved
}