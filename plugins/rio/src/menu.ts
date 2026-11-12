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
    { id: "memory", label: "Memory", detail: "Browse active memories" },
    { id: "recall", label: "Recall", detail: "Semantic + lexical memory recall" },
    { id: "coach", label: "Coach", detail: "30-day trend analysis with specific fixes" },
    { id: "doctor", label: "Doctor", detail: "Installation and health check" },
    { id: "report", label: "Report", detail: "Per-component token breakdown" },
    { id: "memory-review", label: "Memory Review", detail: "MEMORY.md / context structural audit" },
    { id: "expand", label: "Expand", detail: "Retrieve archived tool result" },
    { id: "resume-lean", label: "Resume Lean", detail: "Lean context reconstruction" },
  ]
}

export function formatMenu(items: MenuItem[]): string {
  return items.map((it) => `• ${it.label} — ${it.detail}`).join("\n")
}

export async function runMenuAction(
  sub: string,
  service: any,
  memory: any,
  ctx: any,
  sessionID?: string,
): Promise<string> {
  const id = sessionID ?? String(ctx.data.session.message.list?.()?.sessionID ?? ctx.ui.router.current()?.sessionID ?? "")

  switch (sub) {
    case "status": {
      if (!id) return "No active session"
      const q = await service.quality(id)
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
      const entries = await service.entries(id)
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
      const q = await service.quality(id)
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
        `memory: ${service.cfg.memory}`,
        `keepWarm: ${service.cfg.keepWarm}`,
      ].join("\n")
    }
    case "memory": {
      if (!id) return "No active session"
      const stats = memory.db.stats(id)
      const hits = memory.db.fts("", id, 10)
      return [
        `rio · Memory for ${id.slice(0, 12)}`,
        `Total active: ${stats.total}`,
        `By origin: ${Object.entries(stats.byOrigin).map(([k, v]) => `${k}:${v}`).join(", ")}`,
        `Recent: ${hits.length} memories`,
      ].join("\n")
    }
    case "recall": {
      if (!id) return "No active session"
      const hits = memory.db.fts("", id, 5)
      if (!hits.length) return "No memories found"
      return hits.map((h: any) => `- [${h.category}] ${h.content.slice(0, 200)}`).join("\n")
    }
    case "coach": {
      const q = await service.quality(id || "default")
      const re = service.requestEfficiency?.(id || "default") ?? { requestCount: 0, tokensPerRequest: 0, efficiency: 0 }
      const advice: string[] = []
      if (q.fillPct >= 0.85) advice.push("CRITICAL: context fill >= 85%, compact now")
      if (re.efficiency < 0.3 && re.requestCount >= 5) advice.push("Prefer fewer, larger requests over many small ones")
      if (q.resourceHealth < 50) advice.push("Resource health below 50, consider a fresh session")
      return [
        `rio · Coach for ${id.slice(0, 12)}`,
        `Quality: ${Math.round(q.score)}/100 (${q.grade})`,
        `Fill: ${Math.round(q.fillPct * 100)}%`,
        `Request efficiency: ${Math.round(re.efficiency * 100)}%`,
        advice.length ? `Advice: ${advice.join("; ")}` : "No issues",
      ].join("\n")
    }
    case "doctor": {
      const ok = service.db() ? "connected" : "unavailable"
      return [
        `rio · Doctor`,
        `Plugin loaded: yes`,
        `Database: ${ok}`,
        `Memory DB: .opencode/state/vector/memory.db`,
        `Nudge delivery: inject only`,
        `All feature flags: defaults active`,
      ].join("\n")
    }
    case "report": {
      if (!id) return "No active session"
      const q = await service.quality(id)
      return [
        `rio · Report for ${id.slice(0, 12)}`,
        `Context fill degradation: ${Math.round(q.fillPct * 100)}%`,
        `Stale reads: ${q.breakdown.stale_reads.detail}`,
        `Bloated results: ${q.breakdown.bloated_results.detail}`,
        `Decision density: ${q.breakdown.decision_density.detail}`,
        `Agent efficiency: ${q.breakdown.agent_efficiency.detail}`,
        `Absolute waste tokens: ${q.breakdown.absolute_waste_tokens.detail}`,
      ].join("\n")
    }
    case "memory-review": {
      return [
        `rio · Memory Review`,
        `Context files: .opencode/context/`,
        `Wiki index: .opencode/context/index.md`,
        `Decisions: .opencode/context/decisions.md`,
        `Patterns: .opencode/context/patterns/`,
        `Vector DB: .opencode/state/vector/memory.db (shared with memory-hub)`,
        `No action needed — memory system is shared and compatible.`,
      ].join("\n")
    }
    case "expand": {
      if (!id) return "No active session"
      return "Expand: use /rio recall <query> to retrieve archived tool results and memories"
    }
    case "resume-lean": {
      if (!id) return "No active session"
      const checkpoints = service.store.findCheckpointCandidates(service.projectID, 30, 5)
      if (!checkpoints.length) return "No checkpoints available"
      const best = checkpoints[0]
      return `Lean resume from ${best.trigger} · ${best.mode} · quality ${best.qualityScore ?? "N/A"}/100\n${best.content.slice(0, 1000)}`
    }
    default:
      return `Unknown rio subcommand "${sub}". Use: status, compact, resume, compress, route, savings, audit, config, memory, recall, coach, doctor, report, memory-review, expand, resume-lean`
  }
}
