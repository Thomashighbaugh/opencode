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
import { installAgents } from "./src/agents"
import { registerLibraryTool } from "./tools/library/index.ts"

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
    })

    await ctx.command.transform((editor: any) => {
      editor.add({
        name: "hubs",
        description: "Print the hub index (all hubs and their subcommands)",
        async execute(invocation: any) {
          await ctx.session.prompt({ sessionID: invocation.sessionID, text: renderIndex() })
        },
      })
    })
  },
}
