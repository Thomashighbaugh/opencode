/**
 * Nudge messages — injected into system context (not toast). User wants
 * injections only; toast and off are not used.
 */

export function verbosityNudge(fillPct: number): { tier: "gentle" | "strong" | "none"; message: string | null } {
  const pct = Math.round(fillPct * 100)
  if (fillPct >= 0.75) {
    return { tier: "strong", message: `[rio] Context at ${pct}% capacity. Reason deeply, keep visible output lean: no preamble, no restating the request.` }
  }
  if (fillPct >= 0.25) {
    return { tier: "gentle", message: `[rio] Context at ${pct}% capacity. Reason fully, skip unnecessary preamble.` }
  }
  return { tier: "none", message: null }
}

export function qualityNudge(previous: number | null, current: number): { fire: boolean; message: string | null } {
  if (previous === null) return { fire: false, message: null }
  const drop = previous - current
  const crossed = previous >= 60 && current < 60
  if (drop > 15 || crossed) {
    return {
      fire: true,
      message: crossed
        ? `[rio] Context health dropped below critical: ${Math.round(current)}/100. Compact or start a fresh session.`
        : `[rio] Context health dropped ${Math.round(drop)} points to ${Math.round(current)}/100.`,
    }
  }
  return { fire: false, message: null }
}
