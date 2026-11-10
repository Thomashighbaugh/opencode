/**
 * db-migrate — OpenCode 2 tool plugin (Drizzle Kit).
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
  push?: boolean
  generate?: boolean
  studio?: boolean
}

const input = {
  type: "object" as const,
  properties: {
    push: {
      type: "boolean",
      description: "Push schema to database (default: true)",
      default: true,
    },
    generate: {
      type: "boolean",
      description: "Generate SQL migration files (default: false)",
      default: false,
    },
    studio: {
      type: "boolean",
      description: "Open Drizzle Studio after migration",
      default: false,
    },
  },
}

export default {
  id: "db-migrate",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()

    ctx.tool.transform((editor: any) => {
      editor.add({
        name: "db-migrate",
        description: "Run Drizzle Kit push and generate — sync schema with database",
        input,
        options: { codemode: false },
        execute: async (args: Args) => {
          const results: string[] = []

          if (args.generate) {
            try {
              await exec("npx", ["drizzle-kit", "generate"], { cwd: directory, maxBuffer: 10 * 1024 * 1024 })
              results.push("Migration SQL generated")
            } catch (error: any) {
              return { content: `## Generate Failed\n\n${String(error.stderr || error.message || "")}` }
            }
          }

          if (args.push !== false) {
            try {
              await exec("npx", ["drizzle-kit", "push"], { cwd: directory, maxBuffer: 10 * 1024 * 1024 })
              results.push("Schema pushed to database")
            } catch (error: any) {
              return { content: `## Push Failed\n\n${String(error.stderr || error.message || "")}` }
            }
          }

          if (args.studio) {
            // Studio is a long-running server; start it detached and move on.
            exec("npx", ["drizzle-kit", "studio"], { cwd: directory }).catch(() => {})
            results.push("Opening Drizzle Studio (runs in background)")
          }

          return { content: `## Database Sync\n\n${results.join("\n")}` }
        },
      })
    })
  },
}
