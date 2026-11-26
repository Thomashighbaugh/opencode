/**
 * Server entrypoint (OpenCode 2). Plain object rather than `Plugin.define`:
 * importing `@opencode/plugin` here would load `@opencode/schema` against the
 * host binary's embedded effect, which is the failure mode the skills-TUI
 * project documents. The loader accepts `{ id, setup }` all the same.
 *
 * Registers, once:
 *   - the vendored skill corpus (47 skills) via ctx.skill.transform
 *   - the `hubMenu` tool via ctx.tool.transform (native tool list, as in V1)
 *   - the `/hubs` command via ctx.command.transform
 */

import fs from "node:fs"
import path from "node:path"

import { hubNames, hubSummaries, render, renderIndex, resume, route, status } from "./src/core"
import { loadVendoredSkills } from "./src/skills"
import { installAgents, loadVendoredAgents } from "./src/agents"
import { registerLibraryTool } from "./tools/library/index.ts"

/**
 * Roster for the agent-dispatch tool description. The subagents are deliberately
 * `hidden: true` so the user's @ menu stays uncluttered, but the model must still
 * know they exist: a hidden subagent is omitted from the dispatcher description
 * even though it stays dispatchable by name. Appending the roster here keeps the
 * model aware without exposing 30 names in the user's autocomplete.
 */
function dispatcherRoster(): string {
  const agents = loadVendoredAgents().filter((a) => a.id !== "hubs")
  if (agents.length === 0) return ""
  const lines = agents.map((a) => {
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(a.content)
    const desc = fm ? (/^description:\s*(.+)$/m.exec(fm[1]!)?.[1] ?? "") : ""
    return `- ${a.id}: ${desc}`
  })
  return `\n\nDispatchable subagents (hidden from the @ menu, invoke by name):\n${lines.join("\n")}`
}

/** Does this tool look like the agent dispatcher? */
function looksLikeDispatch(tool: any): boolean {
  const id = String(tool?.id ?? tool?.name ?? "")
  if (id === "subagent" || id === "task") return true
  const desc = String(tool?.description ?? "")
  if (/spawns an agent|child session|dispatch(?:es)? (?:a )?subagent|subagent/i.test(desc)) return true
  const props = tool?.input?.properties ?? tool?.parameters?.properties ?? {}
  return typeof props === "object" && props !== null && "agent" in props
}

/**
 * Registry ids for the agent-dispatch tool. If the registry has none, search
 * local tool definitions (tools/, plugins/) for a tool that matches the
 * signature, then fall back to whatever those definitions name. This is the
 * "search locally, then use the enumerated sources" path instead of a silent
 * no-op.
 */
function resolveDispatchToolIds(editor: any): string[] {
  const ids = new Set<string>()
  const registered: any[] = typeof editor?.list === "function" ? Array.from(editor.list()) : []
  for (const tool of registered) {
    if (looksLikeDispatch(tool)) {
      const id = String(tool?.id ?? tool?.name ?? "")
      if (id) ids.add(id)
    }
  }
  if (ids.size > 0) return [...ids]

  // Local definition search: bounded scan of this repo's tool and plugin entry
  // files for the dispatch signature, extracting a `name: "..."` if present.
  const roots = [path.join(__dirname, "..", "..", "tools"), path.join(__dirname, "..", "..", "plugins")]
  const sig = /spawns an agent|child session|dispatch(?:es)? (?:a )?subagent/i
  const seen = new Set<string>()
  const scan = (dir: string, depth: number) => {
    if (depth > 2 || !fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "test" || entry.name === "data") continue
        scan(full, depth + 1)
        continue
      }
      if (!entry.name.endsWith(".ts")) continue
      let text = ""
      try {
        text = fs.readFileSync(full, "utf-8")
      } catch {
        continue
      }
      if (!sig.test(text)) continue
      const name = /name:\s*["']([A-Za-z0-9_-]+)["']/.exec(text)?.[1]
      if (name && !seen.has(name)) {
        seen.add(name)
        ids.add(name)
      }
    }
  }
  for (const root of roots) scan(root, 0)
  // Only ids actually in the registry can be updated; a local name that is not
  // registered is not updatable, so return it out and let the caller register
  // the fallback listSubagents tool instead.
  const available = new Set(registered.map((t: any) => String(t?.id ?? t?.name ?? "")))
  return [...ids].filter((id) => available.has(id))
}

const HUBMENU_INPUT = {
  type: "object",
  properties: {
    action: { type: "string", enum: ["list", "menu", "route", "status", "resume"], description: "Operation to perform" },
    hub: { type: "string", enum: hubNames(), description: "Hub name" },
    subcommand: { type: "string", description: "Subcommand label (for action=route)" },
    flags: { type: "string", description: "Flags string, e.g. '--full --force'" },
  },
  required: ["action"],
  additionalProperties: false,
} as const

export default {
  id: "hubs",
  async setup(ctx: any) {
    const directory: string | undefined = ctx?.location?.directory ?? ctx?.directory
    if (directory) process.env.HUBS_PROJECT_ROOT = directory

    await ctx.skill.transform((editor: any) => {
      for (const skill of loadVendoredSkills()) {
        editor.add({
          id: skill.id,
          name: skill.name,
          description: skill.description,
          path: skill.path,
          content: skill.content,
          autoinvoke: true,
        })
      }
    })

    // Agents are files in V2 (the agent transform has no `add`), so the
    // package installs its coupled agent definitions beside the config.
    installAgents()

    await ctx.tool.transform((editor: any) => {
      editor.add({
        name: "hubMenu",
        options: { codemode: false },
        description:
          "Hub menu router — 'route' returns the full subcommand spec (detailedDescription, inlined rules, related skills); 'list'/'menu' return identity slices; 'status'/'resume' read hub state.",
        input: HUBMENU_INPUT,
        async execute(input: any) {
          const action = String(input?.action ?? "")
          const hub = input?.hub ? String(input.hub) : undefined
          const subcommand = input?.subcommand ? String(input.subcommand) : undefined
          const flags = input?.flags ? String(input.flags) : undefined

          if (action === "list") return { content: renderIndex() }
          if (action === "menu" || action === "status" || action === "resume" || action === "route") {
            if (!hub) return { content: JSON.stringify({ error: "hub is required" }) }
            if (action === "menu") return { content: JSON.stringify(hubSummaries().find((entry) => entry.name === hub) ?? { error: `Unknown hub: ${hub}` }) }
            if (action === "status") return { content: render(status(hub)) }
            if (action === "resume") return { content: render(resume(hub)) }
            if (!subcommand) return { content: JSON.stringify({ error: "subcommand is required for route" }) }
            return { content: render(route(hub, subcommand, flags)) }
          }
          return { content: JSON.stringify({ error: `Unknown action: ${action}` }) }
        },
      })

      registerLibraryTool(editor, directory)

      // Make the hidden subagents visible to the dispatcher without exposing
      // them in the user's @ autocomplete. Search order: the tool registry by
      // id, then by description/schema signature, then local tool definitions.
      // If the dispatch tool is still not found, register a fallback
      // `listSubagents` tool so the roster reaches the model regardless.
      try {
        const roster = dispatcherRoster()
        if (roster) {
          const ids = resolveDispatchToolIds(editor)
          for (const id of ids) {
            editor.update(id, (t: any) => {
              if (typeof t.description === "string" && !t.description.includes("Dispatchable subagents")) {
                t.description += roster
              }
            })
          }
          if (ids.length === 0) {
            // Last resort: the dispatch tool lives outside this registry. Give
            // the model the roster as its own tool, using the same vendored
            // agent source the hubs already enumerate.
            editor.add({
              name: "listSubagents",
              options: { codemode: false },
              description: `List the dispatchable subagents.${roster}`,
              input: { type: "object", properties: {}, additionalProperties: false },
              async execute() {
                return { content: roster }
              },
            })
          }
        }
      } catch {
        // Tool registry shape varies by host version; never block setup on it.
      }
    })

    await ctx.command.transform((editor: any) => {
      editor.add({
        name: "hubs",
        description: "Print the hub index (all hubs and their subcommands)",
        async execute(invocation: any) {
          await ctx.session.prompt({ sessionID: invocation.sessionID, text: renderIndex(), resume: true, delivery: "steer" })
        },
      })
    })
  },
}
