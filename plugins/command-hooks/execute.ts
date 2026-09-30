/**
 * command-hooks/execute.ts — running a hook's commands.
 *
 * Three rules, all of which exist because the alternative breaks a tool call:
 *   1. Commands run SEQUENTIALLY, and a failure does not stop the ones after it.
 *      A lint failure must not hide the typecheck failure behind it.
 *   2. Nothing here throws. A hook is decoration on someone else's operation.
 *   3. Tool arguments reach the command through a temp file, never by
 *      interpolating them into the command string. `{args.path}` in a command
 *      would be a shell-injection hole authored by a config file.
 */

import { spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import type { CommandResult } from './types.js'

const DEFAULT_TRUNCATE = 30_000

/**
 * Per-stream capture cap before any truncation is applied.
 *
 * Output is buffered up to this much regardless of the configured limit, so a
 * command that prints 50MB cannot exhaust memory before the limit trims it.
 * The configured limit then decides what is *reported*, which is a different
 * question from how much was read.
 */
const HARD_CAPTURE_CAP = 4 * 1024 * 1024

export const HOOK_ARGS_ENV = 'OPENCODE_HOOK_ARGS_FILE'

export function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text
  return `${text.slice(0, limit)}\n\n[Output truncated: exceeded ${limit} character limit]`
}

export interface RunOptions {
  cwd: string
  truncateOutput?: number
  timeoutMs?: number
  env?: Record<string, string>
}

function runOne(
  command: string,
  opts: RunOptions,
): Promise<{ exitCode: number; stdout: string; stderr: string; spawnFailed?: boolean }> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      shell: true,
      cwd: opts.cwd,
      env: { ...process.env, ...(opts.env ?? {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    let settled = false
    const finish = (exitCode: number, spawnFailed?: boolean) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ exitCode, stdout, stderr, ...(spawnFailed ? { spawnFailed } : {}) })
    }

    const timer = setTimeout(() => {
      try { child.kill('SIGKILL') } catch { /* already gone */ }
      stderr += `\n[command timed out after ${opts.timeoutMs ?? 120_000}ms]`
      finish(124)
    }, opts.timeoutMs ?? 120_000)

    child.stdout?.on('data', (d: Buffer) => {
      if (stdout.length < HARD_CAPTURE_CAP) stdout += d.toString()
    })
    child.stderr?.on('data', (d: Buffer) => {
      if (stderr.length < HARD_CAPTURE_CAP) stderr += d.toString()
    })

    child.on('error', (err: Error) => {
      stderr += `\n${err.message}`
      finish(127, true)
    })
    child.on('close', (code) => finish(code ?? 0))
  })
}

/**
 * Write tool arguments to a private temp file and return its path plus a cleanup
 * function. The file is per-execution and always removed, so a hook that crashes
 * mid-chain does not leave argument payloads (which may contain file contents)
 * behind in the temp directory.
 */
export function writeArgsFile(args: Record<string, unknown> | undefined): {
  path: string | null
  cleanup: () => void
} {
  let file: string | null = null
  try {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'opencode-hook-args-'))
    file = path.join(dir, 'args.json')
    fs.writeFileSync(file, JSON.stringify(args ?? {}), { mode: 0o600 })
  } catch {
    file = null
  }
  return {
    path: file,
    cleanup: () => {
      if (!file) return
      try {
        const dir = path.dirname(file)
        fs.rmSync(file, { force: true })
        fs.rmSync(dir, { recursive: true, force: true })
      } catch { /* best effort */ }
    },
  }
}

/**
 * Run a hook's commands in order. Every command runs even if an earlier one
 * failed, so the caller sees the full picture rather than the first failure.
 */
export async function runCommands(
  commands: string | string[],
  opts: RunOptions & { args?: Record<string, unknown> },
): Promise<CommandResult[]> {
  const list = Array.isArray(commands) ? commands : [commands]
  const limit = opts.truncateOutput ?? DEFAULT_TRUNCATE
  const results: CommandResult[] = []

  const argsFile = writeArgsFile(opts.args)
  const env = argsFile.path ? { [HOOK_ARGS_ENV]: argsFile.path } : undefined

  try {
    for (const cmd of list) {
      const r = await runOne(cmd, { ...opts, env: { ...(env ?? {}), ...(opts.env ?? {}) } })
      results.push({
        cmd,
        exitCode: r.exitCode,
        stdout: truncate(r.stdout, limit),
        stderr: truncate(r.stderr, limit),
        ...(r.spawnFailed ? { spawnFailed: true } : {}),
      })
    }
  } finally {
    argsFile.cleanup()
  }

  return results
}

/** True when any command in the chain failed. */
export function chainFailed(results: CommandResult[]): boolean {
  return results.some((r) => r.exitCode !== 0)
}
