/**
 * Full OpenCode Plugin Example
 *
 * This file demonstrates a complete plugin with:
 * - Custom tools
 * - Event handling
 * - Chat hooks
 * - Permission handling
 * - Tool execution hooks
 *
 * Plugins provide more comprehensive integrations than standalone tools.
 */

import type { Plugin, Hooks } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"

/**
 * Plugin entry point
 * Receives context about the current project and OpenCode client
 */
const myPlugin: Plugin = async (input) => {
  const { client, project, directory, worktree, $ } = input

  // Log plugin initialization
  console.log(`Plugin loaded for project: ${project.name}`)
  console.log(`Directory: ${directory}`)
  console.log(`Worktree: ${worktree}`)

  // Track statistics for this session
  const stats = {
    eventsReceived: 0,
    messagesProcessed: 0,
    toolsExecuted: 0
  }

  /**
   * Define plugin hooks
   */
  const hooks: Hooks = {
    /**
     * Custom tools registered by this plugin
     */
    tool: {
      /**
       * Project info tool
       * Demonstrates using plugin context in tools
       */
      projectInfo: tool({
        description: "Get information about the current project",
        args: {
          includeFiles: tool.schema
            .boolean()
            .default(false)
            .describe("Include file listing")
        },
        async execute({ includeFiles }) {
          let info = `Project: ${project.name}\nPath: ${worktree}\n`

          if (includeFiles) {
            const { data } = await client.file.list({
              query: { path: worktree, recursive: false }
            })
            if (data) {
              info += `\nFiles:\n${data.map((f: any) => `  ${f.name}`).join("\n")}`
            }
          }

          return info
        }
      }),

      /**
       * Session stats tool
       * Demonstrates maintaining state in plugins
       */
      pluginStats: tool({
        description: "Get statistics about plugin activity",
        args: {},
        async execute() {
          return JSON.stringify(stats, null, 2)
        }
      }),

      /**
       * Git status tool
       * Demonstrates shell command execution
       */
      gitStatus: tool({
        description: "Get the current git status",
        args: {
          short: tool.schema
            .boolean()
            .default(true)
            .describe("Use short format")
        },
        async execute({ short }) {
          try {
            const flag = short ? "-s" : ""
            const result = await $`cd ${worktree} && git status ${flag}`.text()
            return result || "Working tree is clean"
          } catch (error) {
            return `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        }
      })
    },

    /**
     * Event hook
     * Handle real-time server events
     */
    event: async ({ event }) => {
      stats.eventsReceived++

      // Log specific event types
      switch (event.type) {
        case "session.created":
          console.log(`[Plugin] New session: ${event.data?.id}`)
          break
        case "message.created":
          console.log(`[Plugin] New message in session: ${event.data?.sessionID}`)
          break
        case "tool.completed":
          console.log(`[Plugin] Tool completed: ${event.data?.tool}`)
          stats.toolsExecuted++
          break
      }
    },

    /**
     * Config hook
     * Modify configuration on load
     */
    config: async (config) => {
      // Example: Add custom configuration
      console.log(`[Plugin] Config loaded, current theme: ${config.theme}`)
    },

    /**
     * Chat message hook
     * Modify messages before sending to LLM
     */
    "chat.message": async (input, output) => {
      stats.messagesProcessed++

      // Example: Add context to every message
      const contextPart = {
        type: "text" as const,
        text: `\n[Context: Project "${project.name}" | Session ${input.sessionID}]`
      }

      // Uncomment to add context to every message:
      // output.parts.push(contextPart)

      console.log(`[Plugin] Processing message for agent: ${input.agent}`)
    },

    /**
     * Chat params hook
     * Modify LLM parameters
     */
    "chat.params": async (input, output) => {
      // Example: Adjust temperature based on agent
      if (input.agent === "code") {
        output.temperature = 0.3 // Lower for code generation
      } else if (input.agent === "creative") {
        output.temperature = 0.9 // Higher for creative tasks
      }

      console.log(`[Plugin] Params for ${input.agent}: temp=${output.temperature}`)
    },

    /**
     * Permission hook
     * Handle permission requests
     */
    "permission.ask": async (input, output) => {
      // Example: Auto-allow certain safe tools
      const safeTools = ["Read", "Glob", "Grep"]

      if (safeTools.includes(input.tool || "")) {
        output.status = "allow"
        console.log(`[Plugin] Auto-allowed safe tool: ${input.tool}`)
      } else {
        // Let user decide
        output.status = "ask"
      }
    },

    /**
     * Tool execute before hook
     * Pre-process tool arguments
     */
    "tool.execute.before": async (input, output) => {
      console.log(`[Plugin] Tool starting: ${input.tool}`)

      // Example: Add metadata to tool args
      if (typeof output.args === "object" && output.args !== null) {
        output.args._pluginTimestamp = Date.now()
      }
    },

    /**
     * Tool execute after hook
     * Post-process tool output
     */
    "tool.execute.after": async (input, output) => {
      const duration =
        typeof output.metadata?._pluginTimestamp === "number"
          ? Date.now() - output.metadata._pluginTimestamp
          : 0

      console.log(`[Plugin] Tool completed: ${input.tool} (${duration}ms)`)

      // Example: Modify tool title
      output.title = `${output.title} [via plugin]`

      // Track execution
      stats.toolsExecuted++
    }
  }

  return hooks
}

export default myPlugin

/**
 * Alternative: Minimal plugin with just tools
 */
export const minimalPlugin: Plugin = async ({ project }) => ({
  tool: {
    hello: tool({
      description: "Say hello from the plugin",
      args: {},
      async execute() {
        return `Hello from ${project.name}!`
      }
    })
  }
})

/**
 * Alternative: Plugin with custom auth provider
 */
export const authPlugin: Plugin = async () => ({
  auth: {
    provider: "my-api",
    methods: [
      {
        type: "api",
        label: "API Key",
        prompts: [
          {
            type: "text",
            key: "apiKey",
            message: "Enter your API key",
            placeholder: "key_...",
            validate: (value) => {
              if (!value.startsWith("key_")) {
                return "API key must start with 'key_'"
              }
              if (value.length < 10) {
                return "API key is too short"
              }
              return undefined // Valid
            }
          }
        ],
        authorize: async (inputs) => {
          if (!inputs?.apiKey) {
            return { type: "failed" }
          }

          // Validate the key (example)
          const isValid = inputs.apiKey.startsWith("key_")

          if (isValid) {
            return {
              type: "success",
              key: inputs.apiKey
            }
          }

          return { type: "failed" }
        }
      }
    ]
  }
})
