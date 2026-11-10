/**
 * db-migrate — OpenCode 2 tool plugin (Prisma).
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
  name?: string
  generate?: boolean
  reset?: boolean
}

const input = {
  type: "object" as const,
  properties: {
    name: {
      type: "string",
      description: "Migration name (creates a named migration)",
    },
    generate: {
      type: "boolean",
      description: "Also run prisma generate after migration",
      default: true,
    },
    reset: {
      type: "boolean",
      description: "Reset the database instead of migrating",
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
        description: "Run Prisma migration and generate client — dev mode with interactive guard",
        input,
        options: { codemode: false },
        execute: async (args: Args) => {
          const results: string[] = []

          if (args.reset) {
            // Reset is destructive — refuse here and let a human run it.
            return {
              content:
                "db-migrate:reset requires explicit confirmation. Run `npx prisma migrate reset --force` manually.",
            }
          }

          if (args.name) {
            try {
              await exec("npx", ["prisma", "migrate", "dev", "--name", args.name], {
                cwd: directory,
                maxBuffer: 10 * 1024 * 1024,
              })
              results.push(`Migration created: ${args.name}`)
            } catch (error: any) {
              return { content: `## Migration Failed\n\n${String(error.stderr || error.message || "")}` }
            }
          } else {
            try {
              await exec("npx", ["prisma", "migrate", "dev"], {
                cwd: directory,
                maxBuffer: 10 * 1024 * 1024,
              })
              results.push("Migration applied")
            } catch (error: any) {
              const stderr = String(error.stderr || "")
              if (stderr.includes("No pending migrations")) {
                results.push("No pending migrations to apply")
              } else {
                return { content: `## Migration Failed\n\n${stderr || String(error.message || "")}` }
              }
            }
          }

          if (args.generate !== false) {
            try {
              await exec("npx", ["prisma", "generate"], { cwd: directory, maxBuffer: 10 * 1024 * 1024 })
              results.push("Prisma client generated")
            } catch (error: any) {
              results.push(`Prisma generate failed: ${String(error.stderr || error.message || "")}`)
            }
          }

          return { content: `## Database Migration\n\n${results.join("\n")}` }
        },
      })
    })
  },
}
