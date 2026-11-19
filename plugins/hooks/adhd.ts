/**
 * adhd.ts — Session-scoped ADHD output mode (i-have-adhd adaptation).
 *
 * Shapes assistant output for action-first reading: lead with the next
 * action, number multi-step work, end with one concrete next step, suppress
 * tangents, restate state every turn, give specific time estimates, make wins
 * visible, matter-of-fact errors, cap lists at 5 items, no preamble or closer.
 *
 * Persisted to .opencode/state/adhd/state.json so the mode survives across
 * turns within a session. Toggled with /adhd on | off | status. Turned off by
 * "stop adhd mode" or "normal mode".
 *
 * Integrated through the hooks context transform (always-on path) so it works
 * whether or not the rio plugin is loaded; rio also injects an additive block
 * when it is loaded.
 */

import { randomUUID } from "node:crypto"
import { promises as fs, appendFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const STATE_FILE_VERSION = 1
const STATE_SUBPATH = join(".opencode", "state", "adhd", "state.json")

const ADHD_STATES = new Map<string, boolean>() // sessionID -> active

function resolveStateFilePath(directory: string): string {
  return join(directory, STATE_SUBPATH)
}

async function loadPersistedState(directory: string): Promise<boolean | null> {
  const statePath = resolveStateFilePath(directory)
  try {
    const raw = await fs.readFile(statePath, "utf8")
    const parsed = JSON.parse(raw)
    return Boolean(parsed?.active)
  } catch {
    return null
  }
}

async function persistState(directory: string, sessionID: string, active: boolean): Promise<void> {
  const statePath = resolveStateFilePath(directory)
  try {
    await fs.mkdir(join(directory, ".opencode", "state", "adhd"), { recursive: true, mode: 0o700 })
    const tmpPath = statePath + "." + process.pid + "." + randomUUID() + ".tmp"
    await fs.writeFile(tmpPath, JSON.stringify({ version: STATE_FILE_VERSION, sessionID, active, updatedAt: Date.now() }), {
      encoding: "utf8", mode: 0o600,
    })
    await fs.rename(tmpPath, statePath)
  } catch { /* best-effort */ }
}

function emitLedgerEvent(directory: string, sessionID: string, type: string, detail: string) {
  const ledgerPath = resolveStateFilePath(directory) + ".ledger.jsonl"
  try {
    mkdirSync(join(directory, ".opencode", "state", "adhd"), { recursive: true, mode: 0o700 })
    appendFileSync(ledgerPath, JSON.stringify({ ts: Date.now(), sessionID, type, detail }) + "\n", { mode: 0o600 })
  } catch { /* best-effort */ }
}

/**
 * Set ADHD mode on or off for a session. Persisted so rio can read it
 * independently (rio imports nothing from hooks).
 */
export async function setAdhdMode(directory: string, sessionID: string, active: boolean): Promise<boolean> {
  const prev = ADHD_STATES.get(sessionID) ?? false
  if (prev === active) return false // no change
  ADHD_STATES.set(sessionID, active)
  await persistState(directory, sessionID, active)
  emitLedgerEvent(directory, sessionID, active ? "adhd-on" : "adhd-off", active ? "ADHD mode enabled" : "ADHD mode disabled")
  return true
}

/**
 * Is ADHD mode active for this session?
 */
export function isAdhdActive(sessionID: string): boolean {
  return ADHD_STATES.get(sessionID) ?? false
}

/**
 * Load persisted ADHD state for a session (call once at session start).
 */
export async function initializeAdhd(directory: string, sessionID: string): Promise<void> {
  const persisted = await loadPersistedState(directory)
  if (persisted !== null) {
    ADHD_STATES.set(sessionID, persisted)
  }
  void directory
  void sessionID
}

/**
 * Clear ADHD mode for a session (off).
 */
export async function clearAdhdMode(directory: string, sessionID: string): Promise<void> {
  ADHD_STATES.delete(sessionID)
  await persistState(directory, sessionID, false)
  emitLedgerEvent(directory, sessionID, "adhd-off", "ADHD mode disabled")
}

/**
 * Build the ADHD system-context block injected on every turn when active.
 */
export function buildAdhdBlock(sessionID: string): string | null {
  if (!isAdhdActive(sessionID)) return null

  const lines = [
    "<adhd_mode>",
    "ADHD output mode is active. Shape every response per these rules:",
    "1. Lead with the next action — first line is something the reader can do, not context or a plan.",
    "2. Number multi-step tasks — one bounded action per step, fewest steps that work.",
    "3. End with one concrete next action — ONE thing the reader can do in under two minutes.",
    "4. Suppress tangents — finish the first issue, surface others once at the end.",
    "5. Restate state every turn — what is done, what is next, now.",
    "6. Give specific time estimates — minutes, not 'a bit'.",
    "7. Make completed work visible — concrete wins, not buried recaps.",
    "8. Matter-of-fact errors — state cause and fix, no 'uh oh'.",
    "9. Cap lists to 5 items — presentation only, never limits analysis.",
    "10. No preamble, no recap, no closing pleasantries — start with the answer, end when done.",
    "Pre-send check: delete any opening that announces what you are about to do, any closing that asks 'anything else?', and any 'by the way' sidebar.",
    "If the reader reads only the first line and the last line, they must know (a) what to do next and (b) what just happened.",
    "</adhd_mode>",
    "",
  ]
  return lines.join("\n")
}
