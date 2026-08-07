import { existsSync } from "fs";
import { join } from "path";

/**
 * Vectorize hook — watches all scoped per-project markdown sources
 * (.opencode/context/, .opencode/rules/, .opencode/docs/, AGENTS.md)
 * and vectorizes changed files via veclib.mjs for semantic injection.
 *
 * Uses polling fallback on Linux (recursive watch not supported).
 * Storage: .opencode/state/vector/context.db (gitignored).
 */
export function setupVectorizeHook(directory: string): void {
  const scopedDirs = [
    join(directory, ".opencode", "context"),
    join(directory, ".opencode", "rules"),
    join(directory, ".opencode", "docs"),
  ];
  const agentsFile = join(directory, "AGENTS.md");
  const veclibPath = join(directory, "skills", "vectorize-context", "scripts", "veclib.mjs");

  const pollInterval = 10000; // 10 seconds
  const seenFiles = new Map<string, number>(); // path → mtime

  const checkAndVectorize = async () => {
    try {
      if (!existsSync(veclibPath)) return;
      const { vectorizeFile } = await import(veclibPath);
      const candidates: string[] = [];
      for (const dir of scopedDirs) {
        if (!existsSync(dir)) continue;
        candidates.push(...listMarkdownRecursive(dir));
      }
      if (existsSync(agentsFile)) candidates.push(agentsFile);

      for (const fullPath of candidates) {
        try {
          const stat = require("fs").statSync(fullPath);
          const mtime = stat.mtimeMs;
          const prev = seenFiles.get(fullPath);
          if (prev !== mtime) {
            seenFiles.set(fullPath, mtime);
            await vectorizeFile(fullPath, directory);
          }
        } catch {}
      }
    } catch {}
  };

  setInterval(checkAndVectorize, pollInterval);
}

function listMarkdownRecursive(dir: string): string[] {
  const { readdirSync, statSync } = require("fs");
  const out: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true }) as any[];
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
        out.push(...listMarkdownRecursive(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        out.push(fullPath);
      }
    }
  } catch {}
  return out;
}
