/**
 * sessionSnapshot — one-call read of everything needed to resume or orient.
 *
 * Today, resuming a session or checking "where was I" costs 3–5 separate
 * reads: todos.json, notepad.md, project-memory.json, latest state checkpoint.
 * This tool reads all of them in one call and returns a compact summary.
 */

import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"

interface TodoItem {
  content: string
  status: string
  priority: string
}

function readJsonSafe<T>(p: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T
  } catch {
    return null
  }
}

function readTextSafe(p: string, maxChars = 3000): string | null {
  try {
    const s = fs.readFileSync(p, "utf-8")
    return s.length > maxChars ? s.slice(0, maxChars) + "\n…[truncated]" : s
  } catch {
    return null
  }
}

function latestFile(dir: string): string | null {
  try {
    if (!fs.existsSync(dir)) return null
    const files = fs
      .readdirSync(dir)
      .map((f) => ({ f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)
    return files.length ? path.join(dir, files[0].f) : null
  } catch {
    return null
  }
}

export default tool({
  description:
    "One-call snapshot of session state: pending todos, notepad, project memory, latest checkpoint per hub state dir. Use at session start or when resuming to avoid reading state files one by one.",
  args: {
    stateDir: tool.schema
      .string()
      .optional()
      .describe("Override state dir (default: .opencode/state under project root)"),
    fullTodos: tool.schema
      .boolean()
      .optional()
      .describe("Include all todos, not just pending/in-progress (default false)"),
  },
  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()
    const stateDir = args.stateDir ?? path.join(projectRoot, ".opencode", "state")

    // Todos
    const todosRaw = readJsonSafe<{ todos?: TodoItem[] }>(path.join(stateDir, "todos.json"))
    const allTodos: TodoItem[] = todosRaw?.todos ?? []
    const activeTodos = allTodos.filter((t) => t.status !== "completed" && t.status !== "cancelled")
    const completedCount = allTodos.filter((t) => t.status === "completed").length

    // Notepad
    const notepad = readTextSafe(path.join(stateDir, "notepad.md"))

    // Project memory
    const memory = readJsonSafe<Record<string, unknown>>(path.join(stateDir, "project-memory.json"))

    // Latest checkpoints per hub state dir
    const hubDirs = ["init", "ideation", "orchestration", "harvest"]
    const checkpoints: Record<string, string | null> = {}
    for (const h of hubDirs) {
      const d = path.join(stateDir, h)
      checkpoints[h] = fs.existsSync(d) ? latestFile(d) : null
    }

    // Goal
    const goal = readTextSafe(path.join(stateDir, "goal", "current.md"), 500)

    return JSON.stringify(
      {
        todos: {
          pending: activeTodos,
          completedCount,
          ...(args.fullTodos ? { all: allTodos } : {}),
        },
        notepad: notepad ?? "(empty)",
        projectMemory: memory ?? "(empty)",
        goal: goal ?? "(none set)",
        latestCheckpoints: checkpoints,
        stateDir,
      },
      null,
      2
    )
  },
})
