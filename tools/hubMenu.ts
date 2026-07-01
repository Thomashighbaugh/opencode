import { tool } from "@opencode-ai/plugin"
import { HubDefinition, HubSubcommand, getDelegation, getStateInfo, getLatestCheckpoint, getStateDir, loadHub, loadSubcommandSpecFull, HUB_FILE_MAP } from "./hub-data"
import { withToolCache } from "./cache-utils"

// ─── Lazy Hub Loader ────────────────────────────────────────────────────
// Each hub is in its own file. Only the requested hub is loaded.
// When a subcommand is specified, only that subcommand's data is returned.

const VALID_HUBS = Object.keys(HUB_FILE_MAP)

function findSubcommand(hub: HubDefinition, label: string): HubSubcommand | undefined {
  return hub.subcommands.find(s => s.label === label)
}

const VALID_ACTIONS = ['menu', 'route', 'status', 'resume', 'list'] as const
type ActionName = typeof VALID_ACTIONS[number]

export default tool({
  description: "Hub menu router — lazy-loads per-hub data. Use 'route' to get delegation info for a specific subcommand (only that subcommand's data is returned). Use 'status' or 'resume' for state queries. Do NOT use 'menu' action — list subcommands as plain text instead (saves an LLM request).",
  args: {
    action: tool.schema.string().describe(
      `Action: 'menu' returns interactive menu JSON, 'route' parses args and returns routing, 'status' shows hub state, 'resume' gets latest checkpoint, 'list' lists all hubs. Valid: ${VALID_ACTIONS.join(', ')}`
    ),
    hub: tool.schema.string().optional().describe(`Hub command name. Valid: ${VALID_HUBS.join(', ')}`),
    subcommand: tool.schema.string().optional().describe("Subcommand to route to (for 'route' action)"),
    flags: tool.schema.string().optional().describe("Flags string to parse (e.g., '--full --force')")
  },
  async execute(args, context) {
    if (!VALID_ACTIONS.includes(args.action as ActionName)) {
      return JSON.stringify({ error: `Invalid action '${args.action}'. Valid: ${VALID_ACTIONS.join(', ')}` })
    }
    if (args.hub && !VALID_HUBS.includes(args.hub)) {
      return JSON.stringify({ error: `Invalid hub '${args.hub}'. Valid: ${VALID_HUBS.join(', ')}` })
    }

    switch (args.action) {
      case 'list': {
        // List all hubs — loads each hub file to get name + description + subcommand count
        return withToolCache("hubMenu", args, () => {
          const hubs = VALID_HUBS.map(name => {
            const hub = loadHub(name)
            return hub ? {
              name: hub.name,
              description: hub.description,
              subcommandCount: hub.subcommands.length,
              subcommands: hub.subcommands.map(s => s.label),
              hasState: !!hub.stateDir
            } : { name, error: "Failed to load" }
          })
          return JSON.stringify({ hubs })
        })
      }

      case 'menu': {
        // Full hub listing — only loads the requested hub
        if (!args.hub) return JSON.stringify({ error: "Hub name required for menu action" })
        const hub = loadHub(args.hub)
        if (!hub) return JSON.stringify({ error: `Unknown hub: ${args.hub}` })

        const stateInfo = getStateInfo(hub)
        return JSON.stringify({
          hub: hub.name,
          description: hub.description,
          options: hub.subcommands.map(s => ({ label: s.label, description: s.description })),
          state: stateInfo
        })
      }

      case 'route': {
        // ⭐ KEY OPTIMIZATION: When both hub + subcommand are provided (user selected
        // a subcommand → no routing needed), return the FULL HubSubcommandSpec with
        // detailedDescription, inlined rules, related skill pointers, and examples.
        // This is the single payload sent with the prompt — eliminates follow-up
        // loadSkill/rule-read calls for the common case.
        //
        // When only hub is provided (bare hub + NL task → routing needed), the caller
        // should use the 'menu' action instead to get the slim subcommand list.
        if (!args.hub) return JSON.stringify({ error: "Hub name required for route action" })
        if (!args.subcommand) return JSON.stringify({ error: "Subcommand required for route action" })

        const hub = loadHub(args.hub)
        if (!hub) return JSON.stringify({ error: `Unknown hub: ${args.hub}` })

        const sub = findSubcommand(hub, args.subcommand)
        if (!sub) {
          return JSON.stringify({
            error: `Unknown subcommand '${args.subcommand}' for ${hub.name}`,
            available: hub.subcommands.map(s => s.label)
          })
        }

        // Load the full spec (detailedDescription, tools, rules content, related skills)
        const { spec, rulesContent, relatedSkillMeta } = loadSubcommandSpecFull(args.hub, args.subcommand)

        // Only read state/checkpoint on route — these are lightweight
        const stateInfo = getStateInfo(hub)
        const checkpoint = getLatestCheckpoint(hub)

        return JSON.stringify({
          hub: hub.name,
          description: hub.description,
          subcommand: sub.label,
          subDescription: sub.description,
          reminder: sub.reminder,
          phases: sub.phases || null,
          delegation: getDelegation(sub),
          flags: args.flags || null,
          state: stateInfo,
          checkpoint: checkpoint,
          canResume: !!checkpoint,
          // Full spec — only present when the subcommand spec file exists
          detailedDescription: spec?.detailedDescription || null,
          tools: spec?.tools || null,
          rules: spec?.rules || null,
          rulesContent: rulesContent.length > 0 ? rulesContent : null,
          relatedSkills: spec?.relatedSkills || null,
          relatedSkillMeta: relatedSkillMeta.length > 0 ? relatedSkillMeta : null,
          examples: spec?.examples || null,
          warnings: spec?.warnings || null
        })
      }

      case 'status': {
        if (!args.hub) return JSON.stringify({ error: "Hub name required for status action" })
        const hub = loadHub(args.hub)
        if (!hub) return JSON.stringify({ error: `Unknown hub: ${args.hub}` })

        const stateInfo = getStateInfo(hub)
        const checkpoint = getLatestCheckpoint(hub)

        return JSON.stringify({
          hub: hub.name,
          state: stateInfo,
          checkpoint: checkpoint,
          subcommands: hub.subcommands.map(s => ({ label: s.label, ...getDelegation(s) }))
        })
      }

      case 'resume': {
        if (!args.hub) return JSON.stringify({ error: "Hub name required for resume action" })
        const hub = loadHub(args.hub)
        if (!hub) return JSON.stringify({ error: `Unknown hub: ${args.hub}` })

        if (!hub.stateDir) return JSON.stringify({ error: `${hub.name} is stateless — no resume available` })

        const checkpoint = getLatestCheckpoint(hub)
        if (!checkpoint) {
          return JSON.stringify({
            resumable: false,
            hub: hub.name,
            statePath: getStateDir(hub),
            message: `No checkpoint found for ${hub.name}. Start a new session with a subcommand.`,
            stateFiles: getStateInfo(hub)
          })
        }

        return JSON.stringify({
          resumable: true,
          hub: hub.name,
          checkpoint: checkpoint,
          statePath: getStateDir(hub),
          message: `Resuming ${hub.name} from checkpoint: ${checkpoint.file}`
        })
      }

      default:
        return JSON.stringify({ error: `Unknown action: ${args.action}. Available: menu, route, status, resume, list` })
    }
  }
})
