/**
 * Hub-like menu — single access point, self-contained within this plugin,
 * detached from the hubs plugin. All subcommands are hidden behind one
 * command (e.g. /rio) and presented as a selectable menu.
 */

export type MenuItem = {
  id: string
  label: string
  detail: string
}

export function buildMenuItems(): MenuItem[] {
  return [
    { id: "status", label: "Status", detail: "Live context health, fill %, tool count, quality grade" },
    { id: "compact", label: "Compact", detail: "Checkpoint before compact, restore after" },
    { id: "resume", label: "Resume Lean", detail: "Reopen a cold session from checkpoint" },
    { id: "compress", label: "Compress", detail: "Mechanical alternative — compress large tool output locally" },
    { id: "route", label: "Route", detail: "Model + effort recommendation before spending" },
    { id: "savings", label: "Savings", detail: "Dollar and token savings report" },
    { id: "audit", label: "Audit", detail: "Full context audit with guided fixes" },
    { id: "config", label: "Config", detail: "Feature flags and nudge delivery" },
  ]
}

export function formatMenu(items: MenuItem[]): string {
  return items.map((it) => `• ${it.label} — ${it.detail}`).join("\n")
}

export async function runMenuAction(
  sub: string,
  service: any,
  ctx: any,
  sessionID?: string,
): Promise<string> {
  const id = sessionID ?? String(ctx.data.session.message.list?.()?.sessionID ?? ctx.ui.router.current()?.sessionID ?? "")

  switch (sub) {
    case "status": {
      if (!id) return "No active session"
      const q = service.quality(id)
      const re = service.requestEfficiency?.(id) ?? { requestCount: 0, totalTokens: 0, tokensPerRequest: 0, efficiency: 0 }
      return [
        `rio · ${id.slice(0, 12)}`,
        `Quality: ${Math.round(q.score)}/100 (${q.grade})`,
        `Health: ${Math.round(q.resourceHealth)}/100`,
        `Fill: ${Math.round(q.fillPct * 100)}%`,
        `Tool Calls: ${q.toolCalls}`,
        `Requests: ${re.requestCount} · ${Math.round(re.tokensPerRequest)} tok/req`,
        `Efficiency: ${Math.round(re.efficiency * 100)}%`,
        q.fillWarning ? `⚠ ${q.fillWarning.message}` : "",
        q.toolCallWarning ? `⚠ ${q.toolCallWarning.message}` : "",
        q.regimeChange ? `⚠ ${q.regimeChange.message}` : "",
      ].filter(Boolean).join("\n")
    }
    case "compact": {
      if (!id) return "No active session"
      try {
        await ctx.client.session.compact?.({ sessionID: id })
        return `Compact triggered for session ${id.slice(0, 12)}`
      } catch {
        return "Compact API not available"
      }
    }
    case "resume": {
      if (!id) return "No active session"
      const checkpoints = service.store.findCheckpointCandidates(service.projectID, 30, 10)
      if (!checkpoints.length) return "No checkpoints available"
      const best = checkpoints[0]
      return `Most recent checkpoint: ${best.trigger} · ${best.mode} · quality ${best.qualityScore ?? "N/A"}/100`
    }
    case "compress": {
      if (!id) return "No active session"
      const entries = service.entries(id)
      let saved = 0
      for (const e of entries) {
        if (e.output && e.output.length > 8192) saved += e.output.length - Math.min(e.output.length, 2048)
      }
      return `Estimated ${Math.round(saved / 4)} tokens savable via local compression`
    }
    case "route": {
      if (!id) return "No active session"
      const q = service.quality(id)
      const rec = q.resourceHealth >= 70 ? "standard" : q.resourceHealth >= 40 ? "reasoning" : "high"
      return `Recommended routing: ${rec} · health ${Math.round(q.resourceHealth)}/100 · fill ${Math.round(q.fillPct * 100)}%`
    }
    case "savings": {
      const events = service.store.savings(30)
      const tokens = events.reduce((n: number, e: { tokens: number }) => n + e.tokens, 0)
      const cost = events.reduce((n: number, e: { costUsd: number }) => n + e.costUsd, 0)
      return `Last 30 days: ${tokens} tokens saved, $${cost.toFixed(4)} estimated savings across ${events.length} events`
    }
    case "audit": {
      if (!id) return "No active session"
      const q = service.quality(id)
      const re = service.requestEfficiency?.(id) ?? { requestCount: 0, totalTokens: 0, tokensPerRequest: 0, efficiency: 0 }
      const advice: string[] = []
      if (q.fillPct >= 0.85) advice.push("CRITICAL: compact now")
      else if (q.fillPct >= 0.75) advice.push("WARNING: consider compacting")
      if (service.shouldPreferLargerRequest?.(id)) advice.push("Prefer one larger request over several small ones")
      if (q.toolCallWarning) advice.push(q.toolCallWarning.message)
      return [
        `rio · Audit for ${id.slice(0, 12)}`,
        `Quality: ${Math.round(q.score)}/100 (${q.grade})`,
        `Fill: ${Math.round(q.fillPct * 100)}%`,
        `Requests: ${re.requestCount} · efficiency ${Math.round(re.efficiency * 100)}%`,
        advice.length ? `Advice: ${advice.join("; ")}` : "No issues",
      ].join("\n")
    }
    case "config": {
      return [
        `rio · Config`,
        `precisePrompts: ${service.cfg.precisePrompts}`,
        `antiDuplication: ${service.cfg.antiDuplication}`,
        `singleConcern: ${service.cfg.singleConcern}`,
        `quickRouting: ${service.cfg.quickRouting}`,
        `preComputation: ${service.cfg.preComputation}`,
        `cutExploreAgent: ${service.cfg.cutExploreAgent}`,
        `nudgeDelivery: ${service.cfg.nudgeDelivery}`,
        `preferFewerLargerRequests: ${service.cfg.preferFewerLargerRequests}`,
        `mechanicalAlternatives: ${service.cfg.mechanicalAlternatives}`,
        `promoteToProjectTooling: ${service.cfg.promoteToProjectTooling}`,
        `preferTypeScriptOverPython: ${service.cfg.preferTypeScriptOverPython}`,
      ].join("\n")
    }
    default:
      return `Unknown rio subcommand "${sub}". Use: status, compact, resume, compress, route, savings, audit, config`
  }
}
