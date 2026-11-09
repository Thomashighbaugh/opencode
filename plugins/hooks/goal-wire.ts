/**
 * V2 goal wiring: read the finished assistant turn from OpenCode's DB, record it
 * against the goal budget, and ask for a continuation only when the goal is
 * still active and under budget.
 */
import { Database } from "bun:sqlite"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { blockGoal, buildContinueMessage, checkGoalMarkers, completeGoal, getGoal, recordTurn } from "./goal.ts"

const SEEN = new Map<string, string>()

type Turn = { messageID: string; text: string; tokens: number; tools: number }

function dbPath(): string {
  return process.env.OPENCODE_DB?.trim() || join(homedir(), ".local/share/opencode/opencode.db")
}

function readTurn(sessionID: string): Turn | null {
  const path = dbPath()
  if (!existsSync(path)) return null
  let db: Database | null = null
  try {
    db = new Database(path, { readonly: true })
    db.exec("PRAGMA busy_timeout=500")
    const msg = db.query(
      "SELECT id, data FROM message WHERE session_id = ? AND json_extract(data, '$.role') = 'assistant' ORDER BY time_created DESC LIMIT 1",
    ).get(sessionID) as any
    if (!msg) return null
    const info = JSON.parse(msg.data || "{}")
    const parts = db.query(
      "SELECT data FROM part WHERE message_id = ? ORDER BY time_created ASC, id ASC",
    ).all(msg.id) as any[]
    let text = ""
    let tools = 0
    for (const row of parts) {
      const p = JSON.parse(row.data || "{}")
      if (p.type === "text" && typeof p.text === "string") text += p.text + "\n"
      if (p.type === "tool") tools++
    }
    const tokens = Number(info.tokens?.input ?? 0) + Number(info.tokens?.output ?? 0) +
      Number(info.tokens?.cache?.read ?? 0) + Number(info.tokens?.cache?.write ?? 0)
    return { messageID: String(msg.id), text, tokens, tools }
  } catch {
    return null
  } finally {
    try { db?.close() } catch {}
  }
}

export async function maybeContinueGoal(ctx: any, directory: string, sessionID: string): Promise<void> {
  const state = getGoal(sessionID)
  if (!state || state.stopped) return
  const turn = readTurn(sessionID)
  if (!turn) return
  if (SEEN.get(sessionID) === turn.messageID) return
  SEEN.set(sessionID, turn.messageID)

  const marker = checkGoalMarkers(turn.text)
  if (marker.type === "complete") {
    completeGoal(directory, sessionID, marker.evidence || "verified by assistant")
    return
  }
  if (marker.type === "blocked") {
    blockGoal(directory, sessionID, marker.blocker || "blocked by assistant")
    return
  }

  recordTurn(sessionID, turn.tokens, turn.text, turn.tools > 0)
  const next = buildContinueMessage(sessionID)
  if (!next) return
  try {
    await ctx.session.prompt({ sessionID, text: next, resume: true, delivery: "steer" })
  } catch {
    // A failed continuation must not break the hook pipeline.
  }
}
