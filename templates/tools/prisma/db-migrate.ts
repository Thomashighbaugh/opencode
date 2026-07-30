import { tool } from "@opencode-ai/plugin"
import { $ } from "@opencode-ai/plugin"

export const dbMigrate = tool({
  name: "db-migrate",
  description: "Run Prisma migration and generate client — dev mode with interactive guard",
  parameters: {
    type: "object",
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
  },
  execute: async (params) => {
    const results: string[] = []

    if (params.reset) {
      // Reset is dangerous — require CREATE override
      throw new Error("db-migrate:reset requires explicit confirmation. Run `npx prisma migrate reset --force` manually.")
    }

    if (params.name) {
      try {
        const result = await $`npx prisma migrate dev --name ${params.name} 2>&1`
        results.push(`Migration created: ${params.name}`)
      } catch (error: any) {
        return {
          output: `## Migration Failed\n\n${error.stderr || error.message || ""}`,
          error: "Migration failed",
        }
      }
    } else {
      try {
        const result = await $`npx prisma migrate dev 2>&1`
        results.push("Migration applied")
      } catch (error: any) {
        // If no changes, prisma exits with non-zero
        if ((error.stderr || "").includes("No pending migrations")) {
          results.push("No pending migrations to apply")
        } else {
          return {
            output: `## Migration Failed\n\n${error.stderr || error.message || ""}`,
            error: "Migration failed",
          }
        }
      }
    }

    if (params.generate) {
      try {
        await $`npx prisma generate 2>&1`
        results.push("Prisma client generated")
      } catch (error: any) {
        results.push(`Prisma generate failed: ${error.stderr || error.message || ""}`)
      }
    }

    return { output: `## Database Migration\n\n${results.join("\n")}` }
  },
})
