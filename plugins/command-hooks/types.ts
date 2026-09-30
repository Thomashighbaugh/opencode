/**
 * command-hooks/types.ts — the configuration surface.
 *
 * Ported from github.com/shanebishop1/opencode-command-hooks (MIT) and extended.
 * Everything the config file can express is declared here; `schema.ts` validates
 * untrusted input against it so a malformed project config degrades to "that file
 * is ignored" rather than "the plugin throws on every tool call".
 *
 * Local extensions, marked LOCAL below:
 *   - `injectOn` — report only on failure, so a passing check costs no tokens.
 *   - `injectLimit` — token-budget the injected message is trimmed to, so a
 *     chatty command cannot flood the context window of the next turn.
 */

export type HookPhase = 'before' | 'after'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface HookToast {
  title?: string
  message: string
  variant?: ToastVariant
  duration?: number
}

export interface HookReport {
  toast?: HookToast
  inject?: string
  /**
   * LOCAL: when to inject.
   * "always"   — report every run (upstream behaviour, the default).
   * "failure"  — report only when the last command exited non-zero.
   *
   * The distinction is the whole point of a hook that runs on every subagent
   * completion: a green run that injects "exit 0 / all tests passed" spends
   * tokens on information nobody needed, and the cheapest way to get a hook
   * switched off is for it to be noisy when things are fine.
   */
  injectOn?: 'always' | 'failure'
}

export type ToolArgGlobMatcher = { glob: string; regex?: never }
export type ToolArgRegexMatcher = { regex: string; glob?: never }
export type ToolArgMatcher =
  | string
  | string[]
  | ToolArgGlobMatcher
  | ToolArgRegexMatcher

export interface ToolHookWhen {
  phase: HookPhase
  /** Omitted or "*" matches every tool. */
  tool?: string | string[]
  /** Calling agent / subagent name. Omitted matches all. */
  callingAgent?: string | string[]
  /**
   * Tool argument filters. Every configured key must match (AND). Values may be
   * an exact string, a list of exact strings, `{glob}`, or `{regex}`.
   * Pattern matchers only match runtime string values.
   */
  toolArgs?: Record<string, ToolArgMatcher>
}

export interface ToolHook extends HookReport {
  id: string
  when: ToolHookWhen
  run?: string | string[]
  /** Suppress global hooks matching the same phase+tool. */
  overrideGlobal?: boolean
  /** LOCAL: skip this hook entirely. Lets a project turn off an inherited default. */
  disabled?: boolean
}

/**
 * The dispatch context may carry either spelling of the start event. The config
 * accepts both too — `session.start` is documented as an alias for
 * `session.created` and the matcher canonicalises them, so a hook written either
 * way fires. A union that omitted the alias here would have forced the plugin
 * to normalise before matching, which is where the alias originally got lost.
 */
export type SessionEvent =
  | 'session.created'
  | 'session.start'
  | 'session.idle'

export interface SessionHookWhen {
  /** `session.start` is an alias for `session.created`. */
  event: SessionEvent
  agent?: string | string[]
  /** Defaults to true for `session.idle`, false otherwise. */
  rootSessionOnly?: boolean
}

export interface SessionHook extends HookReport {
  id: string
  when: SessionHookWhen
  run?: string | string[]
  overrideGlobal?: boolean
  disabled?: boolean
}

export interface CommandHooksConfig {
  /**
   * Maximum characters reported per stdout/stderr after a command completes.
   * Defaults to 30_000, matching OpenCode's own bash tool.
   */
  truncationLimit?: number
  /**
   * LOCAL: maximum characters of the fully rendered injection message.
   * Defaults to 4_000. The character cap above bounds each stream; this bounds
   * the assembled message that actually reaches the model.
   */
  injectLimit?: number
  /** Skip ~/.config/opencode/command-hooks.jsonc entirely. */
  ignoreGlobalConfig?: boolean
  tool?: ToolHook[]
  session?: SessionHook[]
}

export interface ResolvedConfig extends CommandHooksConfig {
  truncationLimit: number
  injectLimit: number
  tool: ToolHook[]
  session: SessionHook[]
}

export interface CommandResult {
  cmd: string
  exitCode: number
  stdout: string
  stderr: string
  /** True when the process could not be spawned at all, as opposed to exiting non-zero. */
  spawnFailed?: boolean
}

/** Everything a template can interpolate. Missing values render as "". */
export interface TemplateContext {
  id: string
  agent?: string
  tool?: string
  event?: string
  results: CommandResult[]
  args?: Record<string, unknown>
}

export interface HookRunOutcome {
  hookId: string
  matched: boolean
  /** False when the hook had no `run`, or threw before producing a result. */
  ran: boolean
  results: CommandResult[]
  /** Present only for a hook that actually ran. */
  exitCode?: number
  stdout?: string
  stderr?: string
  injected?: string
  toast?: { title?: string; message: string; variant?: ToastVariant; duration?: number }
  error?: string
}
