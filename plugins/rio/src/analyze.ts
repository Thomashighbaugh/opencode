/**
 * Re-exports from quality.ts plus compaction-mode instructions and resume
 * intent. Kept as a separate module for a clean import surface.
 */

import type { Mode, Quality, Signals } from "./quality.ts"

export {
  deriveSignals,
  classifyMode,
  computeQuality,
  fillFraction,
  staleReads,
  bloatedResults,
  decisionDensity,
  agentEfficiency,
  grade,
  type Signals,
  type Quality,
  type Mode,
} from "./quality.ts"

export function compactModeInstructions(mode: Mode): string {
  const map: Record<Mode, string> = {
    code: "PRESERVE: edited/created paths; Edit/Write intents; build/test outcomes. DROP: full file bodies already on disk; reads superseded by edits.",
    debug: "PRESERVE: errors, stack traces, hypotheses tested and outcomes, remaining candidates. DROP: analyzed logs; reads of files confirmed unrelated.",
    review: "PRESERVE: files reviewed, findings per file, severity, coverage gaps. DROP: full file bodies; scans with no findings.",
    infra: "PRESERVE: commands and outcomes, service states, deployment steps, config changes. DROP: verbose output already summarized; identical status checks.",
    general: "PRESERVE: decisions and reasoning; action items; relevant paths. DROP: exploratory reads; verbose output already summarized.",
  }
  return map[mode]
}

export function resumeIntent(text: string): boolean {
  const RESUME_RE = /(?:^|\b)(?:continue|resume|pick up|where we left off|keep going|carry on)(?:\b|$)/i
  return RESUME_RE.test(text)
}
