/**
 * go-check — OpenCode 2 tool plugin.
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
  vet?: boolean
  lint?: boolean
}

const input = {
  type: "object" as const,
  properties: {
    vet: { type: "boolean", description: "Run go vet (default: true)", default: true },
    lint: { type: "boolean", description: "Run golangci-lint (default: true)", default: true },
  },
}

export default {
  id: "go-check",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()

    ctx.tool.transform((editor: any) => {
      editor.add({
        name: "go-check",
        description: "Run go vet and golangci-lint with error summary",
        input,
        options: { codemode: false },
        execute: async (args: Args) => {
          const results: string[] = []

          if (args.vet !== false) {
            try {
              await exec("go", ["vet", "./..."], { cwd: directory, maxBuffer: 10 * 1024 * 1024 })
              results.push("go vet: passed")
            } catch (error: any) {
              results.push(`go vet: failed\n${String(error.stderr || error.message || "").slice(0, 1000)}`)
            }
          }

          if (args.lint !== false) {
            try {
              await exec("golangci-lint", ["run", "./..."], { cwd: directory, maxBuffer: 10 * 1024 * 1024 })
              results.push("golangci-lint: passed")
            } catch (error: any) {
              results.push(`golangci-lint: found issues\n${String(error.stderr || error.message || "").slice(0, 1000)}`)
            }
          }

          return { content: `## Go Check Results\n\n${results.join("\n\n")}` }
        },
      })
    })
  },
}
