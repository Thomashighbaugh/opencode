import { tool } from "@opencode-ai/plugin"
import { $ } from "@opencode-ai/plugin"

export const dockerUtils = tool({
  name: "docker-utils",
  description: "Docker Compose lifecycle utilities — up, down, logs, rebuild",
  parameters: {
    type: "object",
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
  },
  execute: async (params) => {
    const serviceArg = params.service ? ` ${params.service}` : ""
    let command: string

    switch (params.action) {
      case "up":
        command = `docker compose up${params.detached ? " -d" : ""}${serviceArg}`
        break
      case "down":
        command = `docker compose down${serviceArg}`
        break
      case "logs":
        command = `docker compose logs${params.follow ? " -f" : " --tail=100"}${serviceArg}`
        break
      case "rebuild":
        command = `docker compose up -d --build${serviceArg}`
        break
      case "ps":
        command = "docker compose ps"
        break
      case "exec":
        command = `docker compose exec${serviceArg}`
        break
      default:
        return { output: "Unknown action", error: "Invalid action" }
    }

    try {
      const result = await $`${command} 2>&1`
      return { output: result.stdout || result.stderr || "Done" }
    } catch (error: any) {
      return {
        output: `## Docker Error\n\n${error.stderr || error.message || ""}`,
        error: `docker compose ${params.action} failed`,
      }
    }
  },
})
