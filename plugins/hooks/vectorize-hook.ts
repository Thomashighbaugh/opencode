import { spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

/**
 * Vectorize hook — keeps the per-project vector stores (context.db, code.db)
 * fresh as files change.
 *
 * ARCHITECTURE (kernel-panic hardening): this hook NEVER imports veclib or
 * any native module (better-sqlite3, sqlite-vec, @huggingface/transformers)
 * into the plugin process. It spawns sync-hook.mjs as a short-lived CHILD
 * process per poll tick:
 *   - One child at a time (overlapping runs are impossible)
 *   - Child is SIGKILLed after a hard timeout (no runaway loops)
 *   - Child runs in maintenance mode: stores that don't exist yet are
 *     SKIPPED — the full initial build is the job of /maintain-hub vectorize.
 *     A fresh store can therefore never trigger a first-run index storm.
 *
 * Storage: .opencode/state/vector/context.db + code.db (gitignored).
 */
export function setupVectorizeHook(directory: string): void {
  const syncScript = join(directory, "skills", "vectorize-context", "scripts", "sync-hook.mjs");

  const pollInterval = 10000; // 10 seconds
  const childTimeoutMs = 90000; // hard kill after 90s
  let childRunning = false;

  const checkAndSync = (): void => {
    if (childRunning) return; // never overlap
    if (!existsSync(syncScript)) return;

    childRunning = true;
    let stderr = "";
    const child = spawn(process.execPath, [syncScript], {
      env: { ...process.env, OPCODE_DIR: directory },
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString();
    });

    const killTimer = setTimeout(() => {
      try { child.kill("SIGKILL"); } catch { /* already gone */ }
    }, childTimeoutMs);

    child.on("close", () => {
      clearTimeout(killTimer);
      childRunning = false;
      if (/fatal|Fatal/.test(stderr)) {
        console.error(`[vectorize-hook] sync error:\n${stderr.slice(0, 500)}`);
      }
    });

    child.on("error", () => {
      clearTimeout(killTimer);
      childRunning = false;
    });
  };

  // First sync shortly after startup (session init takes priority), then poll.
  setTimeout(checkAndSync, 3000);
  setInterval(checkAndSync, pollInterval);
}
