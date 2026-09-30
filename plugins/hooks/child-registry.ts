/**
 * child-registry.ts — tracks every child process the hook plugin spawns so
 * none of them outlive the session that owns them.
 *
 * WHY THIS EXISTS
 * The plugin runs several long-lived children (a warm vector-query server, and
 * an on-demand sync child). Without a registry, each of those is a stray on
 * the machine whenever the parent exits abnormally — a SIGKILLed OpenCode, a
 * crash in another hook, a plugin reload. They hold a SQLite handle, an ONNX
 * model in memory, and CPU time.
 *
 * POLICY
 *   - register() every spawn. There is no untracked spawn path.
 *   - reap() drops children that have already exited (frees the handle and,
 *         for our vector children, nothing else is left running).
 *   - reapOverdue() SIGTERMs anything past its max age, then SIGKILLs it
 *     after a grace period. This is the actual garbage collector: a child
 *     that outlives its usefulness is killed even if the parent is healthy.
 *   - reapAll() on shutdown — SIGTERM, then SIGKILL survivors.
 *
 * SIGTERM before SIGKILL so SQLite gets a chance to close cleanly; a SIGKILL
 * on a live writer can leave a -wal file behind.
 */

import type { ChildProcess } from "node:child_process"

interface Tracked {
  proc: ChildProcess
  label: string
  spawnedAt: number
  maxAgeMs: number
  termSentAt: number | null
}

const DEFAULT_MAX_AGE_MS = 10 * 60 * 1000 // 10 min
const SIGKILL_GRACE_MS = 2_000
const REAP_INTERVAL_MS = 60_000

export class ChildRegistry {
  private tracked = new Map<ChildProcess, Tracked>()
  private timer: ReturnType<typeof setInterval> | null = null
  private terminated = false

  /** Start the periodic reaper. Idempotent. */
  start(): void {
    if (this.timer) return
    this.timer = setInterval(() => this.reap(), REAP_INTERVAL_MS)
    // Never hold the event loop open just to reap.
    this.timer.unref?.()
  }

  /** Track a spawned child. Returns the same child for chaining. */
  register<T extends ChildProcess>(proc: T, label: string, maxAgeMs = DEFAULT_MAX_AGE_MS): T {
    this.tracked.set(proc, { proc, label, spawnedAt: Date.now(), maxAgeMs, termSentAt: null })
    // Stop tracking the moment it dies; reap() is then a no-op for it.
    proc.once?.("exit", () => { this.tracked.delete(proc) })
    return proc
  }

  /** Number of live children. */
  get size(): number {
    return this.tracked.size
  }

  /** Live children with their ages, for diagnostics. */
  describe(): Array<{ label: string; ageMs: number; pid?: number }> {
    const now = Date.now()
    return [...this.tracked.values()].map((t) => ({
      label: t.label,
      ageMs: now - t.spawnedAt,
      pid: t.proc.pid,
    }))
  }

  /**
   * Drop exited children and SIGKILL anything that ignored a SIGTERM.
   * Called on an interval; cheap because the set only holds live children.
   */
  reap(): void {
    const now = Date.now()
    for (const [proc, t] of [...this.tracked]) {
      if (proc.exitCode !== null || proc.signalCode !== null) {
        this.tracked.delete(proc)
        continue
      }
      if (now - t.spawnedAt < t.maxAgeMs) continue

      if (t.termSentAt === null) {
        t.termSentAt = now
        try { proc.kill("SIGTERM") } catch { /* already gone */ }
        continue
      }
      if (now - t.termSentAt >= SIGKILL_GRACE_MS) {
        console.error(`[child-registry] ${t.label} exceeded ${t.maxAgeMs}ms and ignored SIGTERM — SIGKILL`)
        try { proc.kill("SIGKILL") } catch { /* already gone */ }
        this.tracked.delete(proc)
      }
    }
  }

  /**
   * Shut everything down. SIGTERM now, SIGKILL after the grace period.
   * Safe to call more than once; a second call is a no-op.
   */
  reapAll(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.terminated = true
    const pending: Array<{ proc: ChildProcess; label: string }> = []
    for (const t of this.tracked.values()) {
      try {
        t.proc.kill("SIGTERM")
        pending.push({ proc: t.proc, label: t.label })
      } catch { /* already gone */ }
    }
    this.tracked.clear()
    if (pending.length === 0) return

    // Escalate anything still alive shortly after. unref'd so a hung child
    // cannot keep the plugin process alive on its own.
    const esc = setTimeout(() => {
      for (const p of pending) {
        if (p.proc.exitCode !== null || p.proc.signalCode !== null) continue
        console.error(`[child-registry] ${p.label} ignored SIGTERM — SIGKILL`)
        try { p.proc.kill("SIGKILL") } catch { /* already gone */ }
      }
    }, SIGKILL_GRACE_MS)
    esc.unref?.()
  }

  /** True once reapAll() has run. */
  get isTerminated(): boolean {
    return this.terminated
  }
}
