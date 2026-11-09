export function verbosityNudge(fillPct: number): { tier: "gentle" | "strong" | "suppressed" | "none"; message: string | null } {
  const pct = Math.round(fillPct * 100)
  if (fillPct >= 0.9) return { tier: "suppressed", message: null }
  if (fillPct >= 0.75) {
    return { tier: "strong", message: `[Token Optimizer] Context at ${pct}% capacity. Reason fully, but keep visible output lean: no preamble, no restating the request, no explanation unless asked.` }
  }
  if (fillPct >= 0.25) {
    return { tier: "gentle", message: `[Token Optimizer] Context at ${pct}% capacity. Reason fully, then skip unnecessary preamble and restating.` }
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
        ? `[Token Optimizer] Context health dropped below critical: ${Math.round(current)}/100. Compact or start a fresh session.`
        : `[Token Optimizer] Context health dropped ${Math.round(drop)} points to ${Math.round(current)}/100.`,
    }
  }
  return { fire: false, message: null }
}
