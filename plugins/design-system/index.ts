/**
 * design-system — standalone V2 plugin. Single access point: one command
 * (/design-system) opens a hub-like menu with all design subcommands hidden
 * inside. Detached from the hubs plugin; self-contained here.
 *
 * Combines design-direction commands (impeccable: shape, critique, audit,
 * polish, bolder, quieter, distill, harden, onboard, animate, colorize,
 * typeset, layout, delight, overdrive, clarify, adapt, optimize, live,
 * generate, craft), anti-slop taste checks (taste-skill gate), DESIGN.md
 * creation, documentation (docs, readme, writer, agents-md), and skill/agent
 * delegation (redesign, icon, designer, frontend-design).
 *
 * Feature flags (all default true, env-overridable):
 *   DESIGN_TASTE_GATE, DESIGN_IMPECCABLE, DESIGN_AGENT_DELEGATION,
 *   DESIGN_SKILL_DELEGATION
 */

import { config } from "./src/config.ts"
import {
  buildMenuItems,
  formatMenu,
  actionFor,
} from "./src/menu.ts"
import { executeSubcommand, listMenuItems, setProjectRoot } from "./src/actions.ts"

const sessionResults = new Map<string, string>()

export default {
  id: "design-system",
  async setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? ctx?.directory ?? process.cwd()
    setProjectRoot(directory)
    const cfg = config()
    const cleanups: Array<() => void | Promise<void>> = []
    const abort = new AbortController()

    // ── Register tools ──────────────────────────────────────────────
    try {
      if (ctx.tool?.transform) {
        await ctx.tool.transform((editor: any) => {
          // Main design-system execution tool
          try {
            editor.add({
              name: "design_system",
              input: {
                type: "object",
                additionalProperties: false,
                properties: {
                  subcommand: {
                    type: "string",
                    description: "Design subcommand to execute (shape, critique, audit, polish, taste, design-md, redesign, icon, designer, docs, readme, writer, agents-md, ...)",
                  },
                  target: {
                    type: "string",
                    description: "Optional target path, URL, or element selector",
                  },
                },
                required: ["subcommand"],
              } as any,
              description:
                "Execute a design-system subcommand. Runs impeccable design commands, taste-skill gate checks, skill/agent delegations, and inline actions (design-md, agents-md).",
              async execute(input: any, context: any) {
                const sub = String(input?.subcommand ?? "")
                const tgt = input?.target ?? undefined
                if (!sub) {
                  return { content: "design_system: subcommand is required. Use design_system_menu to see available subcommands." }
                }
                const result = executeSubcommand(sub, tgt)
                // Cache for session reference
                try { sessionResults.set(context.sessionID, result.output) } catch {}
                return { content: result.ok ? result.output : `design-system error (${sub}): ${result.error}` }
              },
            })
          } catch (e) {
            console.error("[design-system] tool registration error:", e)
          }

          // Menu tool
          try {
            editor.add({
              name: "design_system_menu",
              input: {
                type: "object",
                additionalProperties: false,
                properties: {},
              } as any,
              description: "Open the design-system hub-like menu (single access point for all design subcommands).",
              async execute() {
                const items = listMenuItems()
                return {
                  content: `design-system menu (${items.length} subcommands):\n${formatMenu(items)}\n\nRun design_system with a subcommand name to execute one, or open the /design-system slash command.`,
                }
              },
            })
          } catch (e) {
            console.error("[design-system] menu tool error:", e)
          }
        })
      }
    } catch (e) {
      console.error("[design-system] tool.transform error:", e)
    }

    // ── Shell hook: tag runtime ─────────────────────────────────────
    try {
      if (ctx.shell?.hook) {
        cleanups.push(await ctx.shell.hook("create.before", async (event: any) => {
          try {
            if (!event?.env) return
            event.env.DESIGN_SYSTEM_RUNTIME = event.env.DESIGN_SYSTEM_RUNTIME || "opencode"
          } catch {}
        }))
      }
    } catch (e) {
      console.error("[design-system] shell hook error:", e)
    }

    // ── Session hooks ───────────────────────────────────────────────
    try {
      if (ctx.session?.hook) {
        // On session start, if DESIGN.md exists, run taste gate
        cleanups.push(await ctx.session.hook("start", async (event: any) => {
          try {
            if (!cfg.tasteGate) return
            const fs = await import("fs")
            const designMdPath = path.join(directory, "DESIGN.md")
            if (fs.existsSync(designMdPath)) {
              const result = executeSubcommand("taste")
              if (!result.ok) {
                // Non-fatal: just report
                try {
                  event.system?.push?.({ type: "text", text: `[design-system] taste gate: ${result.error}` })
                } catch {}
              }
            }
          } catch {}
        }))
      }
    } catch (e) {
      console.error("[design-system] session hook error:", e)
    }

    return async () => {
      abort.abort()
      for (const cleanup of cleanups.reverse()) {
        try { await cleanup() } catch {}
      }
    }
  },
}
