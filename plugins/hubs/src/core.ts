/**
 * core.ts — the hub registry and router, shared by every face of the package
 * (server tool, TUI picker, MCP adapter, tests).
 *
 * Data is vendored under `../data`; nothing here imports the OpenCode SDK, so
 * the module is usable from a plugin, a stdio MCP process, or a plain script.
 * Route payloads match the V1 `hubMenu` tool byte for byte.
 */

import {
  HUB_FILE_MAP,
  LEGACY_ROUTE_MAP,
  getDelegation,
  getLatestCheckpoint,
  getStateDir,
  getStateInfo,
  loadHub,
  loadSubcommandSpecFull,
} from "../data/hub-data"
import type { HubDefinition } from "../data/hub-data"

export { HUB_FILE_MAP, LEGACY_ROUTE_MAP, getDelegation, getLatestCheckpoint, getStateDir, getStateInfo, loadHub }

export type RouteResult = { ok: true; payload: Record<string, unknown> } | { ok: false; error: string; available?: string[] }

export function hubNames(): string[] {
  return Object.keys(HUB_FILE_MAP)
}

export interface HubSummary {
  name: string
  description: string
  subcommands: string[]
  subcommandCount: number
  hasState: boolean
}

export function hubSummaries(): HubSummary[] {
  return hubNames()
    .map((name) => loadHub(name))
    .filter((hub): hub is HubDefinition => hub !== null)
    .map((hub) => ({
      name: hub.name,
      description: hub.description,
      subcommands: hub.subcommands.map((sub) => sub.label),
      subcommandCount: hub.subcommands.length,
      hasState: Boolean(hub.stateDir),
    }))
}

export function hub(name: string): HubDefinition | null {
  return HUB_FILE_MAP[name] ? loadHub(name) : null
}

function resolveLegacy(hubName: string, subcommand: string): [string, string] {
  const mapped = LEGACY_ROUTE_MAP[`${hubName}/${subcommand}`]
  if (!mapped) return [hubName, subcommand]
  const slash = mapped.indexOf("/")
  return [mapped.slice(0, slash), mapped.slice(slash + 1)]
}

/** Same payload as the V1 `hubMenu` route action, including state and checkpoint. */
export function route(hubNameInput: string, subcommandInput: string, flags?: string): RouteResult {
  const [hubName, subcommand] = resolveLegacy(hubNameInput, subcommandInput)
  const definition = hub(hubName)
  if (!definition) return { ok: false, error: `Unknown hub: ${hubName}`, available: hubNames() }

  const sub = definition.subcommands.find((entry) => entry.label === subcommand)
  if (!sub) {
    return {
      ok: false,
      error: `Unknown subcommand '${subcommand}' for ${definition.name}`,
      available: definition.subcommands.map((entry) => entry.label),
    }
  }

  const { spec, rulesContent, relatedSkillMeta } = loadSubcommandSpecFull(hubName, subcommand)
  const payload = {
    hub: definition.name,
    description: definition.description,
    subcommand: sub.label,
    subDescription: sub.description,
    reminder: sub.reminder,
    phases: sub.phases || null,
    delegation: getDelegation(sub),
    flags: flags || null,
    state: getStateInfo(definition),
    checkpoint: getLatestCheckpoint(definition),
    canResume: Boolean(getLatestCheckpoint(definition)),
    detailedDescription: spec?.detailedDescription || null,
    tools: spec?.tools || null,
    rules: spec?.rules || null,
    rulesContent: rulesContent.length > 0 ? rulesContent : null,
    relatedSkills: spec?.relatedSkills || null,
    relatedSkillMeta: relatedSkillMeta.length > 0 ? relatedSkillMeta : null,
    examples: spec?.examples || null,
    warnings: spec?.warnings || null,
  }
  return { ok: true, payload }
}

export function status(hubName: string): RouteResult {
  const definition = hub(hubName)
  if (!definition) return { ok: false, error: `Unknown hub: ${hubName}`, available: hubNames() }
  return {
    ok: true,
    payload: {
      hub: definition.name,
      state: getStateInfo(definition),
      checkpoint: getLatestCheckpoint(definition),
      subcommands: definition.subcommands.map((sub) => ({ label: sub.label, ...getDelegation(sub) })),
    },
  }
}

export function resume(hubName: string): RouteResult {
  const definition = hub(hubName)
  if (!definition) return { ok: false, error: `Unknown hub: ${hubName}`, available: hubNames() }
  if (!definition.stateDir) return { ok: false, error: `${definition.name} is stateless — no resume available` }
  const checkpoint = getLatestCheckpoint(definition)
  if (!checkpoint) {
    return {
      ok: true,
      payload: {
        resumable: false,
        hub: definition.name,
        statePath: getStateDir(definition),
        message: `No checkpoint found for ${definition.name}. Start a new session with a subcommand.`,
        stateFiles: getStateInfo(definition),
      },
    }
  }
  return {
    ok: true,
    payload: {
      resumable: true,
      hub: definition.name,
      checkpoint,
      statePath: getStateDir(definition),
      message: `Resuming ${definition.name} from checkpoint: ${(checkpoint as { file?: string }).file ?? ""}`,
    },
  }
}

/** Exact serialization used for tool results and picker payloads. */
export function render(result: RouteResult): string {
  return JSON.stringify(result.ok ? result.payload : { error: result.error, available: result.available })
}

export function renderIndex(): string {
  return JSON.stringify({ hubs: hubSummaries() })
}
