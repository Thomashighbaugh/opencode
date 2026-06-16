/**
 * Mode state management module for the Hubs plugin.
 *
 * Provides ModeState interface, CRUD operations for mode state files,
 * active mode detection with in-memory cache, orphaned mode detection,
 * and mode activation/clearance functions.
 */
import { existsSync, readdirSync, unlinkSync } from "fs"
import { join } from "path"
import { readJsonFile, writeJsonFile, getStatePath, getStateDir, isValidSessionId, getHeartbeatPath, STALL_CONFIG, type HeartbeatEntry } from "./session"
import type { StallStatus } from "./session"

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ModeState {
  active: boolean
  started_at?: string
  completed_at?: string
  iteration?: number
  max_iterations?: number
  current_phase?: string
  prompt?: string
  original_prompt?: string
  session_id?: string
  project_path?: string
  reinforcement_count?: number
  awaiting_confirmation?: boolean
  last_checked_at?: string
  linked_ultrawork?: boolean
  linked_team?: boolean
  linked_ralph?: boolean
}

export interface OrphanedMode {
  name: string
  state: ModeState
}

// ============================================================================
// Constants
// ============================================================================

export const MODE_STATE_FILES = [
  'autopilot-state.json',
  'ralph-state.json',
  'ultrawork-state.json',
  'ralplan-state.json',
  'team-state.json',
  'ultraqa-state.json',
]

// ============================================================================
// State Management
// ============================================================================

export function readState(directory: string, stateName: string, sessionId?: string): ModeState | null {
  const paths = [
    getStatePath(directory, stateName, sessionId),
    getStatePath(directory, stateName),
  ]

  for (const path of paths) {
    const state = readJsonFile<ModeState>(path)
    if (state) {
      if (sessionId && state.session_id && state.session_id !== sessionId) {
        continue
      }
      return state
    }
  }
  return null
}

export function writeState(directory: string, stateName: string, state: ModeState, sessionId?: string): void {
  const path = getStatePath(directory, stateName, sessionId)
  writeJsonFile(path, state)
}

export function clearState(directory: string, stateName: string, sessionId?: string): void {
  const paths = [
    getStatePath(directory, stateName, sessionId),
    getStatePath(directory, stateName),
  ]

  for (const path of paths) {
    try {
      if (existsSync(path)) {
        unlinkSync(path)
      }
    } catch {
      // Best-effort cleanup
    }
  }
}

// ============================================================================
// Active Mode Detection — With In-Memory Cache
// ============================================================================

const MODE_CACHE_TTL = 2000 // invalidate after 2 seconds
const modeActiveCache = new Map<string, { result: boolean; timestamp: number }>()

function getModeCacheKey(directory: string, sessionId?: string): string {
  return `${directory}:${sessionId || 'global'}`
}

export function hasActiveMode(directory: string, sessionId?: string): boolean {
  const cacheKey = getModeCacheKey(directory, sessionId)
  const cached = modeActiveCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < MODE_CACHE_TTL) {
    return cached.result
  }

  const stateDir = join(directory, '.opencode', 'state')

  if (sessionId && isValidSessionId(sessionId)) {
    const sessionDir = join(stateDir, 'sessions', sessionId)
    for (const file of MODE_STATE_FILES) {
      const state = readJsonFile<ModeState>(join(sessionDir, file))
      if (state?.active === true) {
        modeActiveCache.set(cacheKey, { result: true, timestamp: Date.now() })
        return true
      }
    }
  }

  for (const file of MODE_STATE_FILES) {
    const state = readJsonFile<ModeState>(join(stateDir, file))
    if (state?.active === true && !state.session_id) {
      modeActiveCache.set(cacheKey, { result: true, timestamp: Date.now() })
      return true
    }
  }

  modeActiveCache.set(cacheKey, { result: false, timestamp: Date.now() })
  return false
}

/** Invalidate mode cache (call when mode state changes). */
export function invalidateModeCache(directory: string, sessionId?: string): void {
  const cacheKey = getModeCacheKey(directory, sessionId)
  modeActiveCache.delete(cacheKey)
  // Also clear the global key since modes can affect all
  modeActiveCache.delete(getModeCacheKey(directory))
}

// ============================================================================
// Orphaned Mode Detection
// ============================================================================

export function detectOrphanedModes(directory: string, sessionId?: string): OrphanedMode[] {
  const stateDir = join(directory, '.opencode', 'state')
  const orphaned: OrphanedMode[] = []

  // Check session-scoped state files
  if (sessionId && isValidSessionId(sessionId)) {
    const sessionDir = join(stateDir, 'sessions', sessionId)
    for (const file of MODE_STATE_FILES) {
      const state = readJsonFile<ModeState>(join(sessionDir, file))
      if (state?.active === true) {
        // Check if there's a recent heartbeat
        const hbPath = getHeartbeatPath(directory, sessionId)
        const heartbeat = readJsonFile<HeartbeatEntry>(hbPath)
        const modeName = file.replace('-state.json', '')
        if (!heartbeat || (Date.now() - new Date(heartbeat.lastToolCall).getTime()) > STALL_CONFIG.hardThreshold) {
          orphaned.push({ name: modeName, state })
        }
      }
    }
  }

  // Check global state files
  for (const file of MODE_STATE_FILES) {
    const state = readJsonFile<ModeState>(join(stateDir, file))
    if (state?.active === true && !state.session_id) {
      const modeName = file.replace('-state.json', '')
      orphaned.push({ name: modeName, state })
    }
  }

  return orphaned
}

export function generateRecoveryContext(orphaned: OrphanedMode[]): string {
  if (orphaned.length === 0) return ''

  const details = orphaned.map(o => {
    const age = o.state.last_checked_at
      ? Math.round((Date.now() - new Date(o.state.last_checked_at).getTime()) / 1000)
      : 'unknown'
    return `- Mode: ${o.name} (active as of ${o.state.last_checked_at || 'unknown'}, ~${age}s ago)
  Original task: ${(o.state.prompt || o.state.original_prompt || 'Unknown').substring(0, 200)}`
  }).join('\n')

  return `<session-recovery>
Previous session was interrupted. Found orphaned mode state:
${details}

The state has been preserved. You can:
- Resume by continuing the original task
- Use /cancel to clear the state and start fresh
- Proceed with a new request (orphaned state will be ignored)
</session-recovery>`
}

// ============================================================================
// Mode Activation / Clearance
// ============================================================================

export function activateModeState(directory: string, prompt: string, stateName: string, sessionId?: string): void {
  const now = new Date().toISOString()

  let state: ModeState

  if (stateName === 'ralph') {
    state = {
      active: true,
      iteration: 1,
      max_iterations: 100,
      started_at: now,
      prompt,
      session_id: sessionId,
      project_path: directory,
      linked_ultrawork: true,
      awaiting_confirmation: true,
      last_checked_at: now
    }
  } else if (stateName === 'ralplan') {
    state = {
      active: true,
      started_at: now,
      session_id: sessionId,
      project_path: directory,
      awaiting_confirmation: true,
      last_checked_at: now
    }
  } else {
    state = {
      active: true,
      started_at: now,
      original_prompt: prompt,
      session_id: sessionId,
      project_path: directory,
      reinforcement_count: 0,
      awaiting_confirmation: true,
      last_checked_at: now
    }
  }

  writeState(directory, stateName, state, sessionId)
}

export function clearModeStates(directory: string, modeNames: string[], sessionId?: string): void {
  for (const name of modeNames) {
    clearState(directory, name, sessionId)
  }
}