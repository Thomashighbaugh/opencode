/**
 * docker-utils — OpenCode 2 tool plugin.
 *
 * V2 removed file-based tool discovery: a file under `.opencode/tools/` is
 * inert until a plugin registers it. This file *is* that plugin — OpenCode 2
 * auto-discovers every directory under `.opencode/plugins/` and loads its
 * `index.ts`.
 */

import { execFile } from "node:child_process"
import { promisify } from "node:util"

const exec = promisify(execFile)

interface Args {
  action: "up" | "down" | "logs" | "rebuild" | "ps" | "exec"
  service?: string
  follow?: boolean
  detached?: boolean
}

const input = {
  type: "object" as const,
  properties: {
    action: {
      type: "string",
      enum: ["up", "down", "logs", "rebuild", "ps", "exec"],
      description: "Docker Compose action to perform",
    },
    service: {
      type: "string",
      description: "Target service name (optional, applies to all if omitted)",
    },
    follow: {
      type: "boolean",
      description: "Follow logs (for 'logs' action)",
      default: true,
    },
    detached: {
      type: "boolean",
      description: "Run in detached mode (for 'up' action)",
      default: false,
    },
  },
  required: ["action"],
}

export default {
  id: "docker-utils",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()

    ctx.tool.transform((editor: any) => {
      editor.add({
        name: "docker-utils",
        description: "Docker Compose lifecycle utilities — up, down, logs, rebuild",
        input,
        options: { codemode: false },
        execute: async (args: Args) => {
          // Arguments are passed as an array, never interpolated into a shell
          // string: a service name is caller-supplied and must not be able to
          // become a command.
          const serviceArg = args.service ? [args.service] : []
          let commandArgs: string[]

          switch (args.action) {
            case "up":
              commandArgs = ["compose", "up", ...(args.detached ? ["-d"] : []), ...serviceArg]
              break
            case "down":
              commandArgs = ["compose", "down", ...serviceArg]
              break
            case "logs":
              commandArgs = ["compose", "logs", ...(args.follow === false ? ["--tail=100"] : ["-f"]), ...serviceArg]
              break
            case "rebuild":
              commandArgs = ["compose", "up", "-d", "--build", ...serviceArg]
              break
            case "ps":
              commandArgs = ["compose", "ps"]
              break
            case "exec":
              commandArgs = ["compose", "exec", ...serviceArg]
              break
            default:
              return { content: "Unknown action" }
          }

          try {
            const { stdout, stderr } = await exec("docker", commandArgs, {
              cwd: directory,
              maxBuffer: 10 * 1024 * 1024,
            })
            return { content: stdout || stderr || "Done" }
          } catch (error: any) {
            return { content: `## Docker Error\n\n${String(error.stderr || error.message || "")}` }
          }
        },
      })
    })
  },
}
