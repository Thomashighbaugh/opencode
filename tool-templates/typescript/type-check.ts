import { tool } from "@opencode-ai/plugin"
import { $ } from "@opencode-ai/plugin"

export const typeCheck = tool({
  name: "type-check",
  description: "Run TypeScript type checking (tsc --noEmit) with error count and summary",
  parameters: {
    type: "object",
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
  },
  execute: async (params) => {
    const configFlag = params.project ? `--project ${params.project}` : ""

    try {
      const result = await $`tsc --noEmit ${configFlag} 2>&1`
      return {
        output: `## TypeScript Check Passed\n\nNo type errors found.`,
        metadata: { errorCount: 0 },
      }
    } catch (error: any) {
      const stderr = error.stderr || error.message || ""
      const errorCount = (stderr.match(/error TS\d+/g) || []).length
      return {
        output: `## TypeScript Check Failed\n\n**${errorCount} type error(s) found**\n\n\`\`\`\n${stderr.slice(0, 2000)}\n\`\`\``,
        error: `${errorCount} type error(s) found`,
        metadata: { errorCount },
      }
    }
  },
})
