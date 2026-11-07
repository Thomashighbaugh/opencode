/**
 * agents.ts — the agent definitions the hub subcommands delegate to.
 *
 * These are coupled to hubs: a subcommand's `agent:` field names one of them,
 * and the agent's body assumes the hub payload and skills it was written for.
 * Shipping them with the package keeps that bundle intact.
 *
 * V2's `ctx.agent.transform` editor exposes list/get/update/remove/default but
 * no `add` (packages/plugin/src/promise/agent.ts), so a plugin cannot register
 * a brand-new agent programmatically. The package therefore vendors the files
 * and installs them into the host's global `agents/` directory on setup —
 * write-if-missing-or-changed, never deleting anything the user owns.
 */

import fs from "node:fs"
import os from "node:os"
import path from "node:path"

export interface VendoredAgent {
  id: string
  path: string
  content: string
}

export function agentsRoot(): string {
  return path.join(__dirname, "..", "data", "agents")
}

export function loadVendoredAgents(): VendoredAgent[] {
  const root = agentsRoot()
  if (!fs.existsSync(root)) return []
  return fs
    .readdirSync(root)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => {
      const full = path.join(root, file)
      return { id: file.slice(0, -3), path: full, content: fs.readFileSync(full, "utf-8") }
    })
}

export function configAgentsDir(): string {
  const config = process.env.OPENCODE_CONFIG_DIR ?? path.join(os.homedir(), ".config", "opencode")
  return path.join(config, "agents")
}

/**
 * Enforce the single-primary invariant: `hubs` is the only primary agent.
 * Every other bundled agent is a subagent, whether or not its source said so.
 */
export function normalizeAgent(id: string, content: string): string {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content)
  if (!match) return content
  const frontmatter = match[1]!
  const body = content.slice(match[0].length)
  const lines = frontmatter.split(/\r?\n/).filter((line) => !/^mode:\s*/.test(line))
  lines.push(id === "hubs" ? "mode: primary" : "mode: subagent")
  return `---\n${lines.join("\n")}\n---${body}`
}

export interface InstallResult {
  written: string[]
  unchanged: string[]
}

/** Copy vendored agents into the host config, skipping identical files. */
export function installAgents(destination = configAgentsDir()): InstallResult {
  const written: string[] = []
  const unchanged: string[] = []
  try {
    fs.mkdirSync(destination, { recursive: true })
    for (const agent of loadVendoredAgents()) {
      const target = path.join(destination, `${agent.id}.md`)
      const content = normalizeAgent(agent.id, agent.content)
      if (fs.existsSync(target) && fs.readFileSync(target, "utf-8") === content) {
        unchanged.push(agent.id)
        continue
      }
      fs.writeFileSync(target, content)
      written.push(agent.id)
    }
  } catch {
    // A read-only config must not take the whole plugin down; agents simply
    // stay uninstalled and the hub payload still names them.
  }
  return { written, unchanged }
}
