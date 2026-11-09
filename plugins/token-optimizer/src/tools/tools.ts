import { Service, config, historyReport, qualityReport, savingsReport } from "../service.ts"

const STATUS_INPUT = {
  type: "object",
  properties: {
    detail: { type: "boolean", description: "Include per-signal breakdown" },
    sessionID: { type: "string", description: "Session to inspect; defaults to the current session" },
  },
  additionalProperties: false,
} as const

const OPTIMIZER_INPUT = {
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["quality", "savings", "checkpoint", "resume", "mode", "history"],
      description: "Operation to perform",
    },
    sessionID: { type: "string" },
    days: { type: "number" },
    detail: { type: "boolean" },
    subaction: { type: "string", enum: ["capture", "list", "prune"], description: "checkpoint sub-action" },
    prompt: { type: "string", description: "resume: prompt text to match" },
    dryRun: { type: "boolean" },
    limit: { type: "number" },
  },
  required: ["action"],
  additionalProperties: false,
} as const

function sessionOf(input: any, context: any): string {
  return String(input?.sessionID || context?.sessionID || "")
}

export function registerTools(editor: any, service: Service): void {
  editor.add({
    name: "token_status",
    options: { codemode: false },
    description:
      "Report current context health: ResourceHealth, SessionEfficiency, context fill, tool calls, compactions, and warnings. Deterministic; reads OpenCode's session database.",
    input: STATUS_INPUT,
    async execute(input: any, context: any) {
      const sessionID = sessionOf(input, context)
      if (!sessionID) return { content: "No session selected." }
      if (!service.session(sessionID)) return { content: "No quality data available yet. Quality scoring starts after the first session turn." }
      return { content: qualityReport(service.quality(sessionID), sessionID, Boolean(input?.detail)) }
    },
  })

  editor.add({
    name: "tokenOptimizer",
    options: { codemode: false },
    description:
      "Token Optimizer actions: quality, savings, checkpoint (capture/list/prune), resume (dry-run continuity), mode, history. Compact deterministic reports; no model call.",
    input: OPTIMIZER_INPUT,
    async execute(input: any, context: any) {
      const action = String(input?.action ?? "")
      const sessionID = sessionOf(input, context)
      if (!sessionID && action !== "savings" && action !== "history") {
        return { content: "No session selected." }
      }
      if (action === "quality") {
        return { content: qualityReport(service.quality(sessionID), sessionID, Boolean(input?.detail)) }
      }
      if (action === "savings") {
        const days = Math.max(1, Math.min(365, Number(input?.days ?? 30)))
        return { content: savingsReport(service.savings(days), days) }
      }
      if (action === "checkpoint") {
        const sub = String(input?.subaction ?? "list")
        if (sub === "capture") {
          const cp = service.checkpoint(sessionID, "manual")
          return { content: `Checkpoint ${cp.id} captured for ${cp.sessionID} (${cp.rawBytes} bytes).\n\n${cp.content}` }
        }
        if (sub === "prune") {
          const removed = service.store.pruneCheckpoints(service.cfg.retentionDays)
          return { content: `Pruned ${removed} checkpoint(s).` }
        }
        const rows = service.store.listCheckpoints(service.projectID || undefined, Math.max(1, Math.min(50, Number(input?.limit ?? 10))))
        if (!rows.length) return { content: "No checkpoints." }
        const lines = ["## Checkpoints", "", "| ID | Session | Mode | Score | Created |", "| ---: | --- | --- | ---: | --- |"]
        for (const cp of rows) {
          lines.push(`| ${cp.id} | ${cp.sessionID.slice(0, 12)} | ${cp.mode} | ${cp.qualityScore === null ? "—" : Math.round(cp.qualityScore)} | ${new Date(cp.createdAt * 1000).toISOString()} |`)
        }
        return { content: lines.join("\n") }
      }
      if (action === "resume") {
        const prompt = String(input?.prompt ?? "continue")
        const match = service.restoreFor(sessionID, prompt)
        if (!match) return { content: `No matching checkpoint for prompt: ${prompt}` }
        return { content: `Matched checkpoint ${match.checkpoint.id} (score ${Math.round(match.score * 100)}%).\n\n${match.block}` }
      }
      if (action === "mode") {
        return { content: `Session mode: ${service.mode(sessionID)}` }
      }
      if (action === "history") {
        const days = Math.max(1, Math.min(365, Number(input?.days ?? 30)))
        const rows = service.history(days)
        return { content: historyReport(rows) }
      }
      return { content: `Unknown action: ${action}` }
    },
  })
}

export function registerWithContext(ctx: any, directory: string, projectID: string): Service {
  const service = new Service(directory, projectID, config())
  return service
}
