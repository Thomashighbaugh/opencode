/**
 * prompt-queue/gate.ts — "is this turn asking the user something?"
 *
 * The whole feature hinges on one predicate: run a queued prompt only when the
 * assistant's output has *not* ended on a question. A queue that fires during a
 * question interrupts the user mid-decision, and the model loses focus on the
 * task in front of it — which is the exact failure the queue exists to prevent.
 *
 * So the predicate is wrong in one direction by default: it errs toward
 * HOLDING. A false hold costs one turn of latency. A false release costs the
 * user's attention and the model's focus, and it is not recoverable.
 *
 * Three signals, strongest first:
 *
 *   1. `popup`    — the turn used an interactive ask (permission, `question`).
 *                   Definitive. No text analysis can beat an actual question
 *                   being put to the user through a UI they must answer.
 *   2. `text`     — the final text reads as an ask: a trailing interrogative, or
 *                   an explicit request for a decision.
 *   3. `manual`   — a human said so, via the UI.
 *
 * This module is pure. No I/O, no clock, no client — so the hardest logic in the
 * plugin is testable without a runtime.
 */

/** Tool names that put a question to the user through the UI. */
const INTERACTIVE_ASK_TOOLS = new Set(['question', 'permission.ask', 'ask_user'])

/**
 * Phrases that request a decision even when the sentence does not end in `?`.
 *
 * Modelled outputs routinely end a task with "Let me know if you want X" or
 * "Shall I proceed?" — the latter ends in `?` and is caught by the interrogative
 * test, the former does not and is genuinely an ask.
 */
const ASK_PHRASES = [
  /\blet me know\b/i,
  /\bshall i\b/i,
  /\bshould i\b/i,
  /\bwould you like\b/i,
  /\bdo you want\b/i,
  /\bwhich (?:one|option|approach|of these)\b/i,
  /\bwhat do you think\b/i,
  /\bhow would you like\b/i,
  /\bany (?:preferences|objections|concerns)\b/i,
  /\bconfirm\b/i,
  /\bproceed\??\s*$/i,
  /\bready for me to\b/i,
]

/** How far back from the end of the output an interrogative still counts. */
const TAIL_WINDOW = 400

export type GateReason =
  | 'popup'
  | 'interrogative'
  | 'ask-phrase'
  | 'manual'
  | 'empty-output'
  | 'trailing-incomplete'
  | 'clear'

export interface GateVerdict {
  /** True when the queue must NOT fire. */
  holds: boolean
  reason: GateReason
  /** Human-readable evidence, for the UI and for tests. */
  evidence?: string
}

export interface TurnFacts {
  /** Tool names invoked during the turn. */
  tools?: string[]
  /** The assistant's final visible text. */
  finalText?: string
  /** A human explicitly forced or blocked the drain. */
  manual?: 'hold' | 'release' | null
  /** True when the turn is still running. */
  busy?: boolean
}

/** Strip markdown scaffolding that is not prose. */
function prose(text: string): string {
  return String(text ?? '')
    .replace(/```[\s\S]*?```/g, ' ')        // fenced code
    .replace(/`[^`\n]*`/g, ' ')             // inline code
    .replace(/^\s*[-*+]\s+/gm, '')          // list bullets
    .replace(/^\s*#{1,6}\s+/gm, '')         // headings
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → text
    .replace(/[*_~]/g, '')
    .trim()
}

/** The trailing sentence-ish span, which is where an ask would live. */
function tail(text: string): string {
  return text.length <= TAIL_WINDOW ? text : text.slice(-TAIL_WINDOW)
}

export function evaluateTurn(facts: TurnFacts): GateVerdict {
  // A human override beats every other signal, in both directions.
  if (facts.manual === 'hold') return { holds: true, reason: 'manual', evidence: 'held by user' }
  if (facts.manual === 'release') return { holds: false, reason: 'manual', evidence: 'released by user' }

  // Still running: nothing has completed, so nothing may be injected.
  if (facts.busy) return { holds: true, reason: 'trailing-incomplete', evidence: 'turn still busy' }

  // 1. An interactive ask is definitive. The user has a dialog on screen; firing
  //    a queued prompt underneath it hides the question that is being asked.
  const asks = (facts.tools ?? []).filter((t) => INTERACTIVE_ASK_TOOLS.has(t))
  if (asks.length) {
    return { holds: true, reason: 'popup', evidence: `interactive ask: ${asks.join(', ')}` }
  }

  const text = prose(facts.finalText ?? '')

  // Nothing to read. A turn that produced no prose has not made a statement and
  // has not asked anything; hold rather than assume it concluded.
  if (!text) return { holds: true, reason: 'empty-output', evidence: 'no prose in final text' }

  // 2. A trailing interrogative. Checked last-character-first so "Done. Which
  //    do you prefer?" holds while "All tests pass." does not.
  const t = tail(text)
  if (t.endsWith('?') || t.endsWith('??')) {
    return { holds: true, reason: 'interrogative', evidence: t.slice(-120) }
  }

  // 3. An explicit request for a decision, with or without a question mark.
  for (const re of ASK_PHRASES) {
    const m = re.exec(t)
    if (m) return { holds: true, reason: 'ask-phrase', evidence: m[0] }
  }

  return { holds: false, reason: 'clear' }
}

/**
 * The decision, plus the anti-deadlock guard.
 *
 * A gate that only ever holds is a feature that silently does nothing — the
 * queue grows, nothing runs, and it looks like the plugin is broken. So holding
 * is only permitted for `maxHoldTurns` consecutive turns; after that the
 * verdict flips to release and says why.
 *
 * That is a deliberate choice of a wrong answer over no answer, and it is
 * surfaced (`deadlock-break`) rather than hidden, so the user can see that the
 * gate gave up rather than that the queue happened to be empty.
 */
export function decide(
  facts: TurnFacts,
  consecutiveHolds: number,
  maxHoldTurns: number,
): GateVerdict & { deadlockBreak: boolean } {
  const verdict = evaluateTurn(facts)
  if (!verdict.holds) return { ...verdict, deadlockBreak: false }

  const limit = Math.max(1, maxHoldTurns)
  if (consecutiveHolds + 1 >= limit) {
    return {
      holds: false,
      reason: 'clear',
      evidence: `released after ${consecutiveHolds + 1} consecutive held turns`,
      deadlockBreak: true,
    }
  }
  return { ...verdict, deadlockBreak: false }
}

/**
 * Extract a "left unaddressed" list from the assistant's output.
 *
 * This is the rollover source: when a turn is held because the model asked
 * something, anything it explicitly deferred stays outstanding and should ride
 * along with the next drain rather than being forgotten. Only an explicit,
 * unambiguous marker is honoured — inferring deferred work from prose would
 * manufacture tasks the model never proposed.
 */
export function extractDeferred(text: string): string[] {
  const src = String(text ?? '')
  const out: string[] = []

  // <deferred>…</deferred> and "Left unaddressed:" style blocks.
  const tagged = /<deferred>([\s\S]*?)<\/deferred>/gi
  let m: RegExpExecArray | null
  while ((m = tagged.exec(src))) out.push(...bullets(m[1]))

  const headed = /(?:left unaddressed|not (?:yet )?addressed|deferred|still outstanding|remains? to be done)[:\n]+([\s\S]{0,1200}?)(?:\n\s*\n|$)/gi
  while ((m = headed.exec(src))) out.push(...bullets(m[1]))

  return [...new Set(out.map((s) => s.trim()).filter(Boolean))]
}

function bullets(block: string): string[] {
  return block
    .split('\n')
    .map((l) => l.replace(/^\s*(?:[-*+]|\d+[.)])\s*/, '').trim())
    .filter((l) => l.length > 2)
}
