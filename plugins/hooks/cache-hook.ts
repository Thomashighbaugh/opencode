import { watch, copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

/**
 * Cache hook — watches .opencode/state/ for work-product JSON files
 * and copies them to .opencode/state/cache/ for cross-session access.
 *
 * Uses polling fallback on Linux (recursive watch not supported).
 */
export function setupCacheHook(directory: string): void {
  const stateDir = join(directory, ".opencode", "state");
  const cacheDir = join(directory, ".opencode", "state", "cache");

  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

  // Copy work-product files on change. Use polling on Linux since
  // recursive watch is not supported there.
  const pollInterval = 5000; // 5 seconds

  const checkAndCopy = () => {
    try {
      if (!existsSync(stateDir)) return;
      const entries = readdirSync(stateDir, { recursive: true }) as string[];
      for (const entry of entries) {
        if (
          typeof entry === "string" &&
          entry.includes("work-products") &&
          entry.endsWith(".json")
        ) {
          const src = join(stateDir, entry);
          const dst = join(cacheDir, entry);
          try {
            mkdirSync(join(dst, ".."), { recursive: true });
            copyFileSync(src, dst);
          } catch {}
        }
      }
    } catch {}
  };

  setInterval(checkAndCopy, pollInterval);
}