/**
 * type-check — OpenCode 2 tool plugin.
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
  strict?: boolean
  project?: string
}

const input = {
  type: "object" as const,
  properties: {
    strict: {
      type: "boolean",
      description: "Use strict TypeScript config",
      default: true,
    },
    project: {
      type: "string",
      description: "Path to tsconfig.json (default: ./tsconfig.json)",
      default: "./tsconfig.json",
    },
  },
}

export default {
  id: "type-check",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()

    ctx.tool.transform((editor: any) => {
      editor.add({
        name: "type-check",
        description: "Run TypeScript type checking (tsc --noEmit) with error count and summary",
        input,
        options: { codemode: false },
        execute: async (args: Args) => {
          const configFlag = args.project ? ["--project", args.project] : []

          try {
            await exec("npx", ["tsc", "--noEmit", ...configFlag], { cwd: directory, maxBuffer: 10 * 1024 * 1024 })
            return { content: `## TypeScript Check Passed\n\nNo type errors found.` }
          } catch (error: any) {
            const stderr = String(error.stderr || error.message || "")
            const errorCount = (stderr.match(/error TS\d+/g) || []).length
            return {
              content: `## TypeScript Check Failed\n\n**${errorCount} type error(s) found**\n\n\`\`\`\n${stderr.slice(0, 2000)}\n\`\`\``,
              metadata: { errorCount },
            }
          }
        },
      })
    })
  },
}
