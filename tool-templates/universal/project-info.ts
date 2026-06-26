import { tool } from "@opencode-ai/plugin"

export const projectInfo = tool({
  name: "project-info",
  description: "Show {{PROJECT_NAME}} project metadata, version, and build status",
  parameters: {
    type: "object",
    properties: {},
  },
  execute: async () => {
    const projectName = "{{PROJECT_NAME}}"
    const language = "{{LANGUAGE}}"
    const packageManager = "{{PACKAGE_MANAGER}}"

    let output = `# ${projectName}\n\n`
    output += `**Language:** ${language}\n`
    output += `**Package Manager:** ${packageManager}\n`

    // Try to read package metadata
    const { $ } = await import("@opencode-ai/plugin")

    if (language === "typescript" || language === "javascript") {
      try {
        const pkg = JSON.parse(await fs.promises.readFile("package.json", "utf-8"))
        output += `**Version:** ${pkg.version || "not set"}\n`
        output += `**Scripts:** ${Object.keys(pkg.scripts || {}).join(", ") || "none"}\n`
      } catch { /* no package.json */ }
    }

    return { output }
  },
})
