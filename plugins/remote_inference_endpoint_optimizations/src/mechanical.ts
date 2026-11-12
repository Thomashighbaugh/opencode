/**
 * Mechanical alternatives to inference. The maximum possible savings come
 * from achieving a result locally using existing shell commands or readily
 * available TypeScript tooling — never from asking the model to do what a
 * shell pipeline or a durable project-scoped tool can do.
 *
 * Repeated tasks are promoted to durable PROJECT-SCOPED tooling under
 * .opencode/tools/ (TypeScript preferred over Python). No one-off Python
 * scripts are ever created.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs"
import { join } from "node:path"

/** Check whether a task pattern has already been promoted to project-scoped
 *  tooling. Returns the path to the existing tool if found. */
export function findExistingProjectTool(projectDir: string, taskSlug: string): string | null {
  const candidates = [
    join(projectDir, ".opencode", "tools", `${taskSlug}.ts`),
    join(projectDir, ".opencode", "tools", `${taskSlug}.js`),
  ]
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  return null
}

/** Promote a repeated task to durable project-scoped TypeScript tooling.
 *  Writes a tool file into <project>/.opencode/tools/<slug>.ts and returns
 *  its path. Never creates Python or one-off scripts. */
export function promoteToProjectTooling(
  projectDir: string,
  taskSlug: string,
  toolBody: string,
): { path: string; promoted: boolean } {
  const toolsDir = join(projectDir, ".opencode", "tools")
  mkdirSync(toolsDir, { recursive: true })
  const path = join(toolsDir, `${taskSlug}.ts`)
  if (!existsSync(path)) {
    writeFileSync(path, toolBody, "utf8")
    return { path, promoted: true }
  }
  return { path, promoted: false }
}

/** Sanitize a task name into a filesystem-safe slug. */
export function slugify(taskName: string): string {
  return taskName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

/** Estimate tokens saved by using a mechanical alternative instead of an
 *  inference request. Returns saved input + output tokens. */
export function estimateMechanicalSavings(inferenceTokens: number, localTokens: number): number {
  return Math.max(0, inferenceTokens - localTokens)
}
