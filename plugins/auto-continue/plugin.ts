/**
 * auto-continue — recover a stalled turn by sending "continue".
 *
 * When the assistant message in a session errors with a transient, retryable
 * fault (bad request, dropped stream, malformed tool call, …), the session goes
 * idle with nothing left to run. This plugin watches for that combination and
 * sends "continue" once the session is idle, so the work resumes without a
 * human typing it.
 *
 * Scoped to the Profundo provider by default (`providers` in
 * `.opencode/auto-continue.jsonc`). No commands, no remote version checks.
 *
 * Safety rails:
 *   - exclude patterns win, so a user abort is never retried
 *   - per-session throttle and consecutive-retry cap
 *   - the counter resets when an assistant message completes without error
 */

import type { Plugin } from '@opencode-ai/plugin'
import {
  isRetryableError,
  loadConfig,
  providerAllowed,
  type AutoContinueConfig,
} from './core.ts'

interface SessionState {
  lastContinueTime: number
  pendingContinue: boolean
  consecutiveCount: number
}

function getState(states: Map<string, SessionState>, sessionID: string): SessionState {
  let state = states.get(sessionID)
  if (!state) {
    state = { lastContinueTime: 0, pendingContinue: false, consecutiveCount: 0 }
    states.set(sessionID, state)
  }
  return state
}

const plugin: Plugin = async ({ client, directory }) => {
  const config: AutoContinueConfig = await loadConfig(directory)
  const sessions = new Map<string, SessionState>()
  /** Last provider seen for a session — errors themselves do not carry one. */
  const providers = new Map<string, string>()

  function noteProvider(sessionID: string | undefined, providerID: string | undefined) {
    if (sessionID && providerID) providers.set(sessionID, providerID)
  }

  function allowed(sessionID: string): boolean {
    return providerAllowed(providers.get(sessionID), config)
  }

  /** session.error has no provider field; recover it from the stored messages. */
  async function resolveProvider(sessionID: string): Promise<string | undefined> {
    const known = providers.get(sessionID)
    if (known) return known

    try {
      const res = await client.session.messages({ path: { id: sessionID } })
      const messages = res.data ?? []
      for (let i = messages.length - 1; i >= 0; i--) {
        const info = messages[i].info
        const providerID =
          info.role === 'assistant' ? info.providerID : info.role === 'user' ? info.model?.providerID : undefined
        if (providerID) {
          noteProvider(sessionID, providerID)
          return providerID
        }
      }
    } catch {
      // Could not determine the provider — treat as ineligible.
    }
    return undefined
  }

  function markRetryable(sessionID: string, error: unknown) {
    if (!config.enabled) return
    if (!isRetryableError(error, config)) return
    if (!allowed(sessionID)) return

    getState(sessions, sessionID).pendingContinue = true
  }

  async function sendContinue(sessionID: string) {
    const state = sessions.get(sessionID)
    if (!state?.pendingContinue) return
    if (!config.enabled || !allowed(sessionID)) {
      state.pendingContinue = false
      return
    }

    const now = Date.now()
    const remaining = config.throttleMs - (now - state.lastContinueTime)
    if (remaining > 0) {
      setTimeout(() => void sendContinue(sessionID), remaining)
      return
    }

    if (config.maxConsecutive > 0 && state.consecutiveCount >= config.maxConsecutive) {
      state.pendingContinue = false
      return
    }

    state.lastContinueTime = now
    state.consecutiveCount++
    state.pendingContinue = false

    try {
      await client.session.promptAsync({
        path: { id: sessionID },
        body: { parts: [{ type: 'text', text: 'continue' }] },
      })
    } catch {
      // A failed send leaves the turn idle; the next retryable error re-arms it.
    }
  }

  return {
    // The model that will answer this turn — the earliest reliable provider signal.
    'chat.message': async (input) => {
      noteProvider(input.sessionID, input.model?.providerID)
    },

    event: async ({ event }) => {
      if (event.type === 'message.updated') {
        const info = event.properties.info
        if (info.role === 'assistant') {
          noteProvider(info.sessionID, info.providerID)

          if (info.error) {
            markRetryable(info.sessionID, info.error)
          } else if (info.time.completed) {
            // A clean completion ends the retry streak.
            const state = sessions.get(info.sessionID)
            if (state) state.consecutiveCount = 0
          }
        } else if (info.role === 'user') {
          noteProvider(info.sessionID, info.model?.providerID)
        }
        return
      }

      if (event.type === 'session.error') {
        const { sessionID, error } = event.properties
        if (!sessionID || !config.enabled) return
        if (!isRetryableError(error, config)) return

        if (!providers.has(sessionID)) await resolveProvider(sessionID)
        if (!allowed(sessionID)) return
        getState(sessions, sessionID).pendingContinue = true
        return
      }

      if (event.type === 'session.idle') {
        const sessionID = event.properties.sessionID
        if (!sessionID || !config.enabled) return

        const state = sessions.get(sessionID)
        if (!state?.pendingContinue || !allowed(sessionID)) return
        if (config.delayMs <= 0) {
          void sendContinue(sessionID)
          return
        }
        setTimeout(() => void sendContinue(sessionID), config.delayMs)
      }
    },
  }
}

export default plugin
