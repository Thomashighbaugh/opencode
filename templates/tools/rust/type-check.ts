import { tool } from "@opencode-ai/plugin"
import { $ } from "@opencode-ai/plugin"

export const cargoCheck = tool({
  name: "cargo-check",
  description: "Run cargo check plus clippy with warning count summary",
  parameters: {
    type: "object",
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
  },
  execute: async (params) => {
    const workspaceFlag = params.all ? "" : "-p {{CRATE_NAME}}"
    const results: string[] = []

    // cargo check
    try {
      const checkResult = await $`cargo check ${workspaceFlag} 2>&1`
      results.push("cargo check: passed")
    } catch (error: any) {
      const msg = error.stderr || error.message || ""
      const warningCount = (msg.match(/warning:/g) || []).length
      const errorCount = (msg.match(/error\[/g) || []).length
      results.push(`cargo check: ${errorCount} error(s), ${warningCount} warning(s)`)
    }

    // clippy
    if (params.clippy) {
      try {
        const clippyResult = await $`cargo clippy ${workspaceFlag} -- -D warnings 2>&1`
        results.push("clippy: passed")
      } catch (error: any) {
        results.push(`clippy: found issues\n${(error.stderr || error.message || "").slice(0, 1000)}`)
      }
    }

    const allPass = results.filter((r) => r.includes("error")).length === 0
    return {
      output: `## Cargo Check Results\n\n${results.join("\n\n")}`,
      ...(allPass ? {} : { error: "Some checks failed" }),
    }
  },
})
