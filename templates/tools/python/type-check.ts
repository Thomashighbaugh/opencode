/**
 * python-check — OpenCode 2 tool plugin.
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
  fix?: boolean
}

const input = {
  type: "object" as const,
  properties: {
    fix: {
      type: "boolean",
      description: "Auto-fix lint issues (ruff --fix)",
      default: false,
    },
  },
}

export default {
  id: "python-check",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()

    ctx.tool.transform((editor: any) => {
      editor.add({
        name: "python-check",
        description: "Run Python type checking (mypy) and linting (ruff) with error summary",
        input,
        options: { codemode: false },
        execute: async (args: Args) => {
          const results: string[] = []

          try {
            await exec("mypy", ["."], { cwd: directory, maxBuffer: 10 * 1024 * 1024 })
            results.push("mypy: passed")
          } catch (error: any) {
            results.push(`mypy: failed\n${String(error.stderr || error.message || "").slice(0, 1000)}`)
          }

          const ruffArgs = args.fix ? ["check", "--fix", "."] : ["check", "."]
          try {
            await exec("ruff", ruffArgs, { cwd: directory, maxBuffer: 10 * 1024 * 1024 })
            results.push("ruff: passed")
          } catch (error: any) {
            results.push(`ruff: failed\n${String(error.stderr || error.message || "").slice(0, 1000)}`)
          }

          const allPass = results.filter((r) => r.includes("failed")).length === 0
          return { content: `## Python Check Results\n\n${results.join("\n\n")}` }
        },
      })
    })
  },
}
