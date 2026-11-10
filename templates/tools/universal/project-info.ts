/**
 * project-info — OpenCode 2 tool plugin.
 *
 * V2 removed file-based tool discovery: a file under `.opencode/tools/` is
 * inert until a plugin registers it. This file *is* that plugin — OpenCode 2
 * auto-discovers every directory under `.opencode/plugins/` and loads its
 * `index.ts`.
 */

import * as fs from "node:fs"
import * as path from "node:path"

interface Args {}

const input = {
  type: "object" as const,
  properties: {},
}

export default {
  id: "project-info",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()

    ctx.tool.transform((editor: any) => {
      editor.add({
        name: "project-info",
        description: "Show {{PROJECT_NAME}} project metadata, version, and build status",
        input,
        options: { codemode: false },
        execute: async (_args: Args) => {
          const projectName = "{{PROJECT_NAME}}"
          const language = "{{LANGUAGE}}"
          const packageManager = "{{PACKAGE_MANAGER}}"

          let output = `# ${projectName}\n\n`
          output += `**Language:** ${language}\n`
          output += `**Package Manager:** ${packageManager}\n`

          if (language === "typescript" || language === "javascript") {
            try {
              const pkg = JSON.parse(await fs.promises.readFile(path.join(directory, "package.json"), "utf-8"))
              output += `**Version:** ${pkg.version || "not set"}\n`
              output += `**Scripts:** ${Object.keys(pkg.scripts || {}).join(", ") || "none"}\n`
            } catch {
              /* no package.json */
            }
          }

          return { content: output }
        },
      })
    })
  },
}
