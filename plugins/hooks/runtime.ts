/**
 * runtime.ts — resolve a script interpreter that can actually execute a
 * TypeScript file we spawn as a child process.
 *
 * WHY THIS IS NOT process.execPath
 * OpenCode ships as a Bun-compiled single-file binary. Two consequences, both
 * verified on this machine:
 *
 *   1. `spawn(process.execPath, ['script.ts'])` does NOT run the script. The
 *      compiled binary treats the first argument as a directory to chdir into:
 *          Error: Failed to change directory to /tmp/opencode/probe.ts
 *   2. There is no bun or node in the OpenCode store path to fall back on —
 *      the derivation contains only the one ELF binary.
 *
 * So the interpreter has to come from PATH, which is also the convention the
 * rest of this codebase already follows: runSkillScript spawns `bash` from
 * PATH rather than execPath.
 *
 * WHY NODE FIRST, NOT BUN
 * This originally preferred Bun, reasoning that the host is a Bun process and
 * that Bun understands the full TypeScript language. That was wrong, and
 * measurably so: Bun 1.3.14 hard-crashes with
 *
 *   panic(main thread): NAPI FATAL ERROR: Error::New napi_get_last_error_info
 *
 * on `require('better-sqlite3')` — in isolation, with no duplicate install in
 * play. Both veclib and graphlib load better-sqlite3, so under Bun every
 * vector child died on startup and the query silently returned nothing. Node
 * loads the same module without complaint.
 *
 * Bun's full TypeScript support is not worth anything if the child cannot open
 * its database. Node 23.6+ strips types by default and Node 22 needs only
 * --experimental-strip-types, neither of which the scripts here require (they
 * use no enums, namespaces, or parameter properties), so node is the correct
 * choice on both correctness and capability grounds.
 */

import { execFileSync } from "node:child_process"

export interface ResolvedRuntime {
  /** Executable to spawn. */
  cmd: string
  /** Arguments that must precede the script path (e.g. Node type-strip flags). */
  args: string[]
  /** Which interpreter was chosen — for diagnostics. */
  kind: "node" | "bun" | "execPath"
}

let cached: ResolvedRuntime | null = null

function onPath(bin: string): boolean {
  try {
    // `command -v` via a shell is the portable test; avoid spawning the binary
    // itself in case it has side effects.
    const out = execFileSync("sh", ["-c", `command -v ${bin}`], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    })
    return out.trim().length > 0
  } catch {
    return false
  }
}

function nodeMajor(): number | null {
  try {
    const out = execFileSync("node", ["-p", "process.versions.node.split('.')[0]"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    })
    return parseInt(out.trim(), 10) || null
  } catch {
    return null
  }
}

/**
 * Pick an interpreter that can run a .ts child script AND load the native
 * modules these scripts depend on. Cached — PATH does not change during a
 * session, and this is called on every spawn.
 */
export function resolveRuntime(): ResolvedRuntime {
  if (cached) return cached

  if (onPath("node")) {
    const major = nodeMajor()
    // 23.6 enabled type stripping by default; earlier versions need the flag.
    const needsFlag = major !== null && major < 23
    cached = {
      cmd: "node",
      args: needsFlag ? ["--experimental-strip-types"] : [],
      kind: "node",
    }
    return cached
  }

  // Bun is a last resort, not a peer. It is listed second deliberately: on
  // this machine it cannot load better-sqlite3 at all (see the header).
  if (onPath("bun")) {
    cached = { cmd: "bun", args: [], kind: "bun" }
    return cached
  }

  // Nothing usable on PATH. Fall back to the host, which is correct whenever
  // the host is a plain node process (as in tests) and is the least-bad
  // option when it is not. Callers spawn defensively either way.
  cached = { cmd: process.execPath, args: [], kind: "execPath" }
  return cached
}

/** Test seam — forces the next resolveRuntime() to re-probe. */
export function __resetRuntimeCache(): void {
  cached = null
}
