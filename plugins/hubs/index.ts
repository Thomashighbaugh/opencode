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
      // them in the user's @ autocomplete. Best-effort: the dispatch tool may
      // live outside this registry, in which case the AGENTS.md roster covers it.
      try {
        const roster = dispatcherRoster()
        if (roster && typeof editor.list === "function") {
          for (const tool of editor.list()) {
            const id = String(tool?.id ?? tool?.name ?? "")
            const desc = String(tool?.description ?? "")
            const isDispatch = id === "subagent" || id === "task" || /child session/i.test(desc) || /Spawns an agent/i.test(desc)
            if (!isDispatch) continue
            editor.update(id, (t: any) => {
              if (typeof t.description === "string" && !t.description.includes("Dispatchable subagents")) {
                t.description += roster
              }
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
