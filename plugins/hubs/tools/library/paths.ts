/**
 * library/paths.ts — where captured documents live.
 *
 * Durable pages sit under `.opencode/context/library/`; the derived lookup cache
 * sits under `.opencode/state/context-library/`. That split is the same
 * state-vs-context rule the rest of the configuration follows.
 */

import path from "node:path"

export function projectRoot(explicit?: string): string {
  return explicit ?? process.env.HUBS_PROJECT_ROOT ?? process.env.OPENCODE_CONFIG_DIR ?? process.cwd()
}

export function libraryRoot(directory?: string): string {
  return path.join(projectRoot(directory), ".opencode", "context", "library")
}

export function archiveRoot(directory?: string): string {
  return path.join(libraryRoot(directory), "archive")
}

export function stateDir(directory?: string): string {
  return path.join(projectRoot(directory), ".opencode", "state", "context-library")
}

export function indexFile(directory?: string): string {
  return path.join(stateDir(directory), "index.json")
}

export function logFile(directory?: string): string {
  return path.join(projectRoot(directory), ".opencode", "context", "log.md")
}

export function researchRoot(directory?: string): string {
  return path.join(projectRoot(directory), ".opencode", "context", "research")
}

export function relativeId(directory: string, file: string): string {
  const rel = path.relative(libraryRoot(directory), file).replace(/\\/g, "/")
  return rel.endsWith("/index.md") ? rel.slice(0, -"/index.md".length) : rel.replace(/\.md$/, "")
}
