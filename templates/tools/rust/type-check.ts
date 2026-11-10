/**
 * cargo-check — OpenCode 2 tool plugin.
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
  clippy?: boolean
  all?: boolean
}

const input = {
  type: "object" as const,
  properties: {
    clippy: {
      type: "boolean",
      description: "Also run clippy (default: true)",
      default: true,
    },
    all: {
      type: "boolean",
      description: "Check all workspace members",
      default: true,
    },
  },
}

export default {
  id: "cargo-check",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()

    ctx.tool.transform((editor: any) => {
      editor.add({
        name: "cargo-check",
        description: "Run cargo check plus clippy with warning count summary",
        input,
        options: { codemode: false },
        execute: async (args: Args) => {
          const workspaceFlag = args.all === false ? ["-p", "{{CRATE_NAME}}"] : []
          const results: string[] = []

          try {
            await exec("cargo", ["check", ...workspaceFlag], { cwd: directory, maxBuffer: 10 * 1024 * 1024 })
            results.push("cargo check: passed")
          } catch (error: any) {
            const msg = String(error.stderr || error.message || "")
            const warningCount = (msg.match(/warning:/g) || []).length
            const errorCount = (msg.match(/error\[/g) || []).length
            results.push(`cargo check: ${errorCount} error(s), ${warningCount} warning(s)`)
          }

          if (args.clippy !== false) {
            try {
              await exec("cargo", ["clippy", ...workspaceFlag, "--", "-D", "warnings"], {
                cwd: directory,
                maxBuffer: 10 * 1024 * 1024,
              })
              results.push("clippy: passed")
            } catch (error: any) {
              results.push(`clippy: found issues\n${String(error.stderr || error.message || "").slice(0, 1000)}`)
            }
          }

          return { content: `## Cargo Check Results\n\n${results.join("\n\n")}` }
        },
      })
    })
  },
}
