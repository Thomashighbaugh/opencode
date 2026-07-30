import { tool } from "@opencode-ai/plugin"
import { $ } from "@opencode-ai/plugin"

export const runChecks = tool({
  name: "run-checks",
  description: "Run all project checks in sequence: lint → type-check → test, with aggregated summary",
  parameters: {
    type: "object",
    properties: {
      skip: {
        type: "array",
        items: { type: "string", enum: ["lint", "typecheck", "test"] },
        description: "Steps to skip",
      },
    },
  },
  execute: async (params) => {
    const skip = new Set(params.skip || [])
    const results: Record<string, { status: string; output: string }> = {}

    {{CHECK_COMMANDS}}

    const summary = Object.entries(results)
      .map(([name, r]) => `  ${r.status === "pass" ? "✓" : "✗"} ${name}: ${r.status}`)
      .join("\n")

    const allPass = Object.values(results).every((r) => r.status === "pass")
    return {
      output: allPass ? `## All Checks Pass\n\n${summary}` : `## Check Failures\n\n${summary}`,
      ...(allPass ? {} : { error: "Some checks failed" }),
    }
  },
})
