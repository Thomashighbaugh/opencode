import { tool } from "@opencode-ai/plugin"
import { $ } from "@opencode-ai/plugin"

export const goCheck = tool({
  name: "go-check",
  description: "Run go vet and golangci-lint with error summary",
  parameters: {
    type: "object",
    properties: {
      vet: { type: "boolean", description: "Run go vet (default: true)", default: true },
      lint: { type: "boolean", description: "Run golangci-lint (default: true)", default: true },
    },
  },
  execute: async (params) => {
    const results: string[] = []

    if (params.vet) {
      try {
        await $`go vet ./... 2>&1`
        results.push("go vet: passed")
      } catch (error: any) {
        results.push(`go vet: failed\n${(error.stderr || error.message || "").slice(0, 1000)}`)
      }
    }

    if (params.lint) {
      try {
        await $`golangci-lint run ./... 2>&1`
        results.push("golangci-lint: passed")
      } catch (error: any) {
        results.push(`golangci-lint: found issues\n${(error.stderr || error.message || "").slice(0, 1000)}`)
      }
    }

    const allPass = results.filter((r) => r.includes("failed")).length === 0
    return {
      output: `## Go Check Results\n\n${results.join("\n\n")}`,
      ...(allPass ? {} : { error: "Some checks failed" }),
    }
  },
})
