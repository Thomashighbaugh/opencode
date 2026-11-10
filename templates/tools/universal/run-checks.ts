/**
 * run-checks — OpenCode 2 tool plugin.
 *
 * V2 removed file-based tool discovery: a file under `.opencode/tools/` is
 * inert until a plugin registers it. This file *is* that plugin — OpenCode 2
 * auto-discovers every directory under `.opencode/plugins/` and loads its
 * `index.ts`.
 */

import { execFile } from "node:child_process"
import { promisify } from "node:util"

const exec = promisify(execFile)

interface Args {
  skip?: string[]
}

const input = {
  type: "object" as const,
  properties: {
    skip: {
      type: "array",
      items: { type: "string", enum: ["lint", "typecheck", "test"] },
      description: "Steps to skip",
    },
  },
}

export default {
  id: "run-checks",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()

    ctx.tool.transform((editor: any) => {
      editor.add({
        name: "run-checks",
        description: "Run all project checks in sequence: lint → type-check → test, with aggregated summary",
        input,
        options: { codemode: false },
        execute: async (args: Args) => {
          const skip = new Set(args.skip || [])
          const results: Record<string, { status: string; output: string }> = {}

          {{CHECK_COMMANDS}}

          const summary = Object.entries(results)
            .map(([name, r]) => `  ${r.status === "pass" ? "✓" : "✗"} ${name}: ${r.status}`)
            .join("\n")

          const allPass = Object.values(results).every((r) => r.status === "pass")
          return {
            content: allPass ? `## All Checks Pass\n\n${summary}` : `## Check Failures\n\n${summary}`,
          }
        },
      })
    })
  },
}
