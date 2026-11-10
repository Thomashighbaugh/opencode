/**
 * project-info — OpenCode 2 tool plugin.
 *
 * V2 removed file-based tool discovery: a file under `.opencode/tools/` is
 * inert until a plugin registers it. This file *is* that plugin — OpenCode 2
 * auto-discovers every directory under `.opencode/plugins/` and loads its
 * `index.ts`.
 */

interface Args {}

const input = {
  type: "object" as const,
  properties: {},
}

export default {
  id: "project-info",
  setup(ctx: any) {
    ctx.tool.transform((editor: any) => {
      editor.add({
        name: "project-info",
        description: "Returns project metadata including language, framework, build/test/lint commands, and conventions.",
        input,
        options: { codemode: false },
        execute: async (_args: Args) => ({
          content: JSON.stringify(
            {
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
              keyFiles: ["package.json", "tsconfig.json"],
              directories: { test: "tests" },
            },
            null,
            2,
          ),
        }),
      })
    })
  },
}
