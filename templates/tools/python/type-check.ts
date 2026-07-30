import { tool } from "@opencode-ai/plugin"
import { $ } from "@opencode-ai/plugin"

export const pythonCheck = tool({
  name: "python-check",
  description: "Run Python type checking (mypy) and linting (ruff) with error summary",
  parameters: {
    type: "object",
    properties: {
      fix: {
        type: "boolean",
        description: "Auto-fix lint issues (ruff --fix)",
        default: false,
      },
    },
  },
  execute: async (params) => {
    const results: string[] = []

    // mypy type check
    try {
      const mypyResult = await $`mypy . 2>&1`
      results.push("mypy: passed")
    } catch (error: any) {
      results.push(`mypy: failed\n${(error.stderr || error.message || "").slice(0, 1000)}`)
    }

    // ruff lint
    const ruffCmd = params.fix ? "ruff check --fix ." : "ruff check ."
    try {
      const ruffResult = await $`${ruffCmd} 2>&1`
      results.push("ruff: passed")
    } catch (error: any) {
      results.push(`ruff: failed\n${(error.stderr || error.message || "").slice(0, 1000)}`)
    }

    const allPass = results.filter((r) => r.includes("failed")).length === 0
    return {
      output: `## Python Check Results\n\n${results.join("\n\n")}`,
      ...(allPass ? {} : { error: "Some checks failed" }),
    }
  },
})
