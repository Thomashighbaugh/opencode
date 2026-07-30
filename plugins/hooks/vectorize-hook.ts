import { watch, existsSync, readdirSync } from "fs";
import { join } from "path";

/**
 * Vectorize hook — watches .opencode/context/ for markdown file changes
 * and vectorizes them via veclib.mjs for semantic search.
 *
 * Uses polling fallback on Linux (recursive watch not supported).
 */
export function setupVectorizeHook(directory: string): void {
  const contextDir = join(directory, ".opencode", "context");
  const veclibPath = join(directory, "skills", "vectorize-context", "scripts", "veclib.mjs");

  if (!existsSync(contextDir)) return;

  // Poll for new/changed .md files. Recursive watch is not supported on Linux.
  const pollInterval = 10000; // 10 seconds
  const seenFiles = new Map<string, number>(); // path → mtime

  const checkAndVectorize = async () => {
    try {
      if (!existsSync(contextDir)) return;
      const entries = readdirSync(contextDir, { recursive: true }) as string[];
      for (const entry of entries) {
        if (typeof entry !== "string" || !entry.endsWith(".md")) continue;
        const fullPath = join(contextDir, entry);
        try {
          const stat = require("fs").statSync(fullPath);
          const mtime = stat.mtimeMs;
          const prev = seenFiles.get(fullPath);
          if (prev !== mtime) {
            seenFiles.set(fullPath, mtime);
            if (existsSync(veclibPath)) {
              const { vectorizeFile } = await import(veclibPath);
              await vectorizeFile(fullPath);
            }
          }
        } catch {}
      }
    } catch {}
  };

  setInterval(checkAndVectorize, pollInterval);
}