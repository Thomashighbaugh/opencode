import { tool } from "@opencode-ai/plugin"

export default tool({
  name: "project-info",
  description: "Returns project metadata including language, framework, build/test/lint commands, and conventions.",
  args: {},
  async execute(args, context) {
    return JSON.stringify({
      language: "typescript",
      version: "5.x",
      framework: "",
      packageManager: "npm",
      buildCommand: "npm run build",
      testCommand: "npx vitest run",
      lintCommand: "Not configured",
      devCommand: "npm run dev",
      sourceDir: "src/",
      testDir: "tests",
      style: "CSS Modules",
      testing: "vitest",
      architecture: "Not detected",
      lint: "Not detected",
      ci: "github-actions",
      deployment: "Not configured",
      keyFiles: ["package.json","tsconfig.json"],
      directories: {"test":"tests"}
    }, null, 2)
  }
})
