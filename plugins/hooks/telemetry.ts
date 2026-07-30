/**
 * Telemetry — deterministic, zero-LLM signal capture for the
 * Self-Refining Config Loop (SRCL).
 *
 * Every relevant tool event appends one NDJSON line to
 * `.opencode/state/telemetry.ndjson`. No LLM calls in the hot path.
 * The log is consolidated on demand by `/project consolidate-telemetry`
 * into ADRs in `.opencode/context/decisions.md`.
 *
 * Event kinds (6):
 *   hub.invoc          — hubMenu with action=route|status|resume
 *   cache.{hit,miss}   — cache tool actions
 *   agent.{dispatch,complete} — Task tool entries
 *   rule.loaded        — rules referenced via instructions
 *   skill.loaded       — loadSkill / Skill tool
 *   file.read          — Read tool (mtime + size)
 *
 * Volume estimate: ≤1KB/event × 200 events/session × 50 sessions ≈ 10MB.
 * No rotation in MVP — add when log exceeds 50MB.
 */
import { appendFile, mkdir, stat } from "fs/promises"
import { join, dirname } from "path"

const LOG_REL = join(".opencode", "state", "telemetry.ndjson")

/**
 * Append one event. Silent on failure — telemetry must never
 * break the main hook pipeline.
 */
export async function recordTelemetry(
  directory: string,
  event: Record<string, unknown>
): Promise<void> {
  try {
    const path = join(directory, LOG_REL)
    await mkdir(dirname(path), { recursive: true })
    const line = JSON.stringify({ ts: new Date().toISOString(), ...event }) + "\n"
    await appendFile(path, line, "utf-8")
  } catch {
    // Best-effort — never throw
  }
}

/**
 * Classify a tool.execute.after event into one of the SRCL kinds.
 * Returns null if the tool is uninteresting (saves a log line).
 */
export function classifyToolEvent(
  toolName: string,
  args: Record<string, unknown>,
  output: unknown
): Record<string, unknown> | null {
  switch (toolName) {
    case "hubMenu": {
      const a = args as { action?: string; hub?: string; subcommand?: string }
      if (!a.action || a.action === "menu" || a.action === "list") return null
      return {
        kind: "hub.invoc",
        action: a.action,
        hub: a.hub,
        subcommand: a.subcommand,
        ok: typeof output === "string" ? !output.startsWith("Error") : true,
      }
    }
    case "loadSkill":
    case "Skill":
    case "skill": {
      const a = args as { skill?: string; name?: string }
      const name = a.skill || a.name
      if (!name) return null
      return { kind: "skill.loaded", skill: name }
    }
    case "Task": {
      const a = args as { subagent_type?: string; description?: string }
      return {
        kind: "agent.dispatched",
        type: a.subagent_type || "general",
        task_hash: hashString(a.description || ""),
      }
    }
    case "cache": {
      const a = args as { action?: string; namespace?: string; key?: string }
      if (a.action === "stats" || a.action === "clear" || a.action === "clear-all") return null
      return { kind: `cache.${a.action || "lookup"}`, ns: a.namespace, key: a.key }
    }
    case "read":
    case "Read": {
      const a = args as { filePath?: string; path?: string }
      const p = a.filePath || a.path
      if (!p) return null
      return { kind: "file.read", path: p, size: typeof output === "string" ? output.length : 0 }
    }
    case "bash":
    case "Bash": {
      const a = args as { command?: string; description?: string }
      const cmd = (a.command || a.description || "").trim()
      if (!cmd) return null
      // Only log cat/ls/grep-style reads, not writes
      if (/^(\s*)(cat|head|tail|less|more|grep|rg|find|ls|wc|tree)\b/.test(cmd)) {
        return { kind: "shell.read", cmd: cmd.substring(0, 200) }
      }
      return null
    }
    default:
      return null
  }
}

/**
 * Tiny FNV-1a hash — deterministic, fast, no crypto needed.
 * Used to dedupe agent task descriptions without leaking the prompt.
 */
function hashString(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return ("00000000" + (h >>> 0).toString(16)).slice(-8)
}

/**
 * Read log size in bytes — used by consolidation to warn about rotation.
 */
export async function telemetryLogSize(directory: string): Promise<number> {
  try {
    const s = await stat(join(directory, LOG_REL))
    return s.size
  } catch {
    return 0
  }
}
