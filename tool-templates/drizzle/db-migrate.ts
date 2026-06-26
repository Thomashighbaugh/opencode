import { tool } from "@opencode-ai/plugin"
import { $ } from "@opencode-ai/plugin"

export const dbMigrate = tool({
  name: "db-migrate",
  description: "Run Drizzle Kit push and generate — sync schema with database",
  parameters: {
    type: "object",
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
  },
  execute: async (params) => {
    const results: string[] = []

    if (params.generate) {
      try {
        const result = await $`npx drizzle-kit generate 2>&1`
        results.push("Migration SQL generated")
      } catch (error: any) {
        return {
          output: `## Generate Failed\n\n${error.stderr || error.message || ""}`,
          error: "Migration generation failed",
        }
      }
    }

    if (params.push) {
      try {
        const result = await $`npx drizzle-kit push 2>&1`
        results.push("Schema pushed to database")
      } catch (error: any) {
        return {
          output: `## Push Failed\n\n${error.stderr || error.message || ""}`,
          error: "Schema push failed",
        }
      }
    }

    if (params.studio) {
      results.push("Opening Drizzle Studio (runs in background)")
      $`npx drizzle-kit studio &`
    }

    return { output: `## Database Sync\n\n${results.join("\n")}` }
  },
})
