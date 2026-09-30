import { spawn } from "child_process";
import { existsSync } from "fs";
import { join, relative, extname, sep } from "path";
import type { ChildRegistry } from "./child-registry";
import { resolveRuntime } from "./runtime";

/**
 * vectorize-hook.ts — keeps the per-project vector stores (context.db, code.db)
 * fresh as files change.
 *
 * ARCHITECTURE (kernel-panic hardening): this hook NEVER imports veclib or
 * any native module (better-sqlite3, sqlite-vec, @huggingface/transformers)
 * into the plugin process. It spawns sync-hook.mjs as a short-lived CHILD
 * process when there is a reason to:
 *   - One child at a time (overlapping runs are impossible)
 *   - Child is SIGKILLed after a hard timeout (no runaway loops)
 *   - Child runs in maintenance mode: stores that don't exist yet are
 *     SKIPPED — the full initial build is the job of /maintain-hub vectorize.
 *     A fresh store can therefore never trigger a first-run index storm.
 *
 * EVENT-DRIVEN, NOT POLLED
 * The previous version spawned a sync child every 10 seconds, forever, whether
 * or not anything had changed: 6 children/minute, ~0.4s each, ~4% of a core
 * burnt continuously, and it competed for CPU with the query child on the
 * inference path. That is the majority of the "waste" this replaces.
 *
 * Now a sync happens only when all of these hold:
 *   1. The session was told about a real file change (file.edited /
 *      file.watcher.updated), AND
 *   2. The changed path is one the stores actually index (see isIndexable —
 *      same rules as veclib's walkCode/collectMarkdown, so a change to
 *      node_modules/ or .opencode/state/ wakes nothing), AND
 *   3. The debounce window has elapsed, AND
 *   4. No sync is already running.
 * A burst of 50 edits coalesces into exactly one sync.
 *
 * Storage: .opencode/state/vector/context.db + code.db (gitignored).
 */
export interface VectorizeHandle {
  /** Feed a file change. Safe to call on every event; most calls are ignored. */
  notifyFileChanged(absPath: string): void;
  /** Sync now if anything is pending, bypassing the debounce. */
  flush(): void;
  /** Last sync outcome, for diagnostics. */
  stats(): { running: boolean; pending: number; lastRunAt: number; lastResult: string; spawns: number; skipped: number };
  /** Stop the debounce timer. The registry reaps the child itself. */
  dispose(): void;
}

const DEBOUNCE_MS = 2_000;
const CHILD_TIMEOUT_MS = 90_000; // hard kill after 90s
const FIRST_SYNC_DELAY_MS = 3_000; // after plugin start, once, to catch startup drift

/** Must match veclib.mjs CODE_EXTENSIONS. */
const CODE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".cts", ".mts",
  ".py", ".go", ".rs", ".java", ".kt", ".kts", ".c", ".h", ".cpp", ".hpp", ".cc",
  ".cs", ".rb", ".php", ".swift", ".scala", ".sh", ".bash", ".zsh", ".sql",
  ".vue", ".svelte", ".css", ".scss", ".html", ".json", ".yaml", ".yml", ".toml",
  ".proto", ".graphql", ".lua", ".r", ".dart", ".zig", ".ex", ".exs", ".tf",
]);

/** Must match veclib.mjs CODE_SKIP_DIRS. */
const CODE_SKIP_DIRS = new Set([
  "node_modules", "dist", "build", "out", "target", "coverage", "venv", "vendor", "tmp", "Pods",
]);

export function setupVectorizeHook(directory: string, registry: ChildRegistry): VectorizeHandle {
  const syncScript = join(directory, "skills", "vectorize-context", "scripts", 'sync-hook.ts');

  const projectRoot = directory;

  let childRunning = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let startupTimer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;
  let pending = 0;           // indexable changes seen since the last sync
  let skipped = 0;           // changes ignored by the filter
  let lastRunAt = 0;
  let lastResult = "none";
  let spawns = 0;

  // The context store's scan roots, from veclib's collectScopedFiles():
  // .opencode/context/** + .opencode/rules/** + .opencode/docs/** + AGENTS.md
  const scopedDirs = [
    join(directory, ".opencode", "context"),
    join(directory, ".opencode", "rules"),
    join(directory, ".opencode", "docs"),
  ];
  const agentsFile = join(directory, "AGENTS.md");

  /**
   * Does this path belong to a store we maintain?
   * Mirrors veclib: the context store takes .md under those three scoped dirs
   * (plus AGENTS.md); the code store takes CODE_EXTENSIONS under the project
   * root, skipping dot dirs (except .opencode), CODE_SKIP_DIRS, and
   * .opencode/{state,cache}. A change to node_modules/ or .opencode/state/
   * therefore wakes nothing, which is the point.
   */
  function isIndexable(absPath: string): boolean {
    if (!absPath) return false;
    const rel = relative(projectRoot, absPath);
    if (!rel || rel.startsWith("..")) return false; // outside the project

    // --- context store ---
    if (extname(rel) === ".md") {
      if (absPath === agentsFile) return true;
      return scopedDirs.some((d) => absPath === d || absPath.startsWith(d + sep));
    }

    // --- code store ---
    if (!CODE_EXTENSIONS.has(extname(rel))) return false;
    const parts = rel.split(sep);
    if (parts[0] === ".opencode" && (parts[1] === "state" || parts[1] === "cache")) return false;
    for (const p of parts.slice(0, -1)) {
      if (CODE_SKIP_DIRS.has(p)) return false;
      if (p.startsWith(".") && p !== ".opencode") return false;
    }
    return true;
  }

  const checkAndSync = (): void => {
    if (disposed || childRunning) return;
    if (!existsSync(syncScript)) return;
    // Nothing changed since the last sync — do not spend a child on it.
    if (pending === 0) return;

    const changed = pending;
    pending = 0;
    childRunning = true;
    spawns++;
    lastRunAt = Date.now();

    let stderr = "";
    let child;
    try {
      // Interpreter comes from PATH, not process.execPath — the OpenCode host
      // is a Bun-compiled binary that cannot run a script passed as argv[1].
      const rt = resolveRuntime();
      child = spawn(rt.cmd, [...rt.args, syncScript], {
        env: { ...process.env, OPCODE_DIR: directory },
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (err) {
      childRunning = false;
      lastResult = `spawn failed: ${err instanceof Error ? err.message : err}`;
      return;
    }
    // Registered so a crash, a plugin reload, or an over-age child can never
    // leave this process on the machine.
    registry.register(child, "vectorize-sync", CHILD_TIMEOUT_MS + 30_000);

    child.stderr?.on("data", (d: Buffer) => {
      if (stderr.length < 4000) stderr += d.toString();
    });

    const killTimer = setTimeout(() => {
      try { child.kill("SIGKILL"); } catch { /* already gone */ }
    }, CHILD_TIMEOUT_MS);
    killTimer.unref?.();

    child.on("close", (code) => {
      clearTimeout(killTimer);
      childRunning = false;
      const summary = stderr.split("\n").filter((l) => l.includes("[sync-hook]")).slice(-2).join(" | ");
      lastResult = summary || `exit ${code}`;
      if (/fatal/i.test(stderr)) {
        console.error(`[vectorize-hook] sync error:\n${stderr.slice(0, 500)}`);
      }
      // More changes arrived while we were syncing — go again after the
      // debounce, otherwise those changes sit unindexed until the next edit.
      if (pending > 0 && !disposed) schedule();
    });

    child.on("error", (err) => {
      clearTimeout(killTimer);
      childRunning = false;
      lastResult = `error: ${err.message}`;
    });
  };

  const schedule = (): void => {
    if (disposed) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      checkAndSync();
    }, DEBOUNCE_MS);
    debounceTimer.unref?.();
  };

  // One startup sync to catch drift accumulated while the plugin was down.
  // Bypasses the "pending" gate because we have no event to count from.
  startupTimer = setTimeout(() => {
    startupTimer = null;
    if (disposed || childRunning) return;
    if (!existsSync(syncScript)) return;
    pending = 1;
    checkAndSync();
  }, FIRST_SYNC_DELAY_MS);
  startupTimer.unref?.();

  return {
    notifyFileChanged(absPath: string) {
      if (disposed) return;
      if (!isIndexable(absPath)) { skipped++; return; }
      pending++;
      schedule();
    },
    flush() {
      if (disposed || childRunning || pending === 0) return;
      if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
      checkAndSync();
    },
    stats() {
      return { running: childRunning, pending, lastRunAt, lastResult, spawns, skipped };
    },
    dispose() {
      disposed = true;
      if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
      if (startupTimer) { clearTimeout(startupTimer); startupTimer = null; }
    },
  };
}
