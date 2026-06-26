import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { homedir } from "os"
import { CacheManager, getCache, withToolCache } from "./cache-utils"

// Path conventions:
// - User-wide config: ~/.config/opencode/agents/ (shared agents across all projects)
// - Project-level config: .opencode/agents/ (project-specific agents)
// - Agents are searched in both locations, project-level takes precedence

const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), '.config', 'opencode')

interface AgentMetadata {
  name: string
  description: string
  model?: string
  mode?: string
  permission?: Record<string, string>
}

function parseAgentFile(filePath: string): AgentMetadata | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!frontmatterMatch) return null
    
    const metadata: AgentMetadata = { name: '', description: '' }
    for (const line of frontmatterMatch[1].split('\n')) {
      if (line.includes(':')) {
        const [key, ...valueParts] = line.split(':')
        const value = valueParts.join(':').trim()
        if (key === 'permissions' || key === 'permission') {
          continue
        }
        (metadata as any)[key.trim()] = value
      }
    }
    return metadata
  } catch {
    return null
  }
}

function getAgentPath(agentName: string, projectRoot: string): string | null {
  // Project-level first (takes precedence), then user-wide
  const searchPaths = [
    path.join(projectRoot, '.opencode', 'agents', `${agentName}.md`),
    path.join(USER_CONFIG_DIR, 'agents', `${agentName}.md`)
  ]
  for (const p of searchPaths) {
    if (fs.existsSync(p)) return p
  }
  return null
}

const VALID_AGENT_ACTIONS = ['list', 'get', 'get-content', 'find-by-capability'] as const

export default tool({
  description: "List available agents or get details about a specific agent for delegation or reference",
  args: {
    action: tool.schema.string().describe(`Action: list all agents, get specific agent details, or find by capability. Valid: ${VALID_AGENT_ACTIONS.join(', ')}`),
    agent: tool.schema.string().optional().describe("Agent name for 'get' actions"),
    capability: tool.schema.string().optional().describe("Capability keyword to search for (e.g., 'review', 'test', 'debug', 'plan')")
  },
  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()
    
    switch (args.action) {
      case 'list': {
        return withToolCache("listAgents", args, () => {
          const agentPaths = [
            { type: 'project', path: path.join(projectRoot, '.opencode', 'agents') },
            { type: 'user', path: path.join(USER_CONFIG_DIR, 'agents') }
          ]
          
          const agents: Array<{name: string; description: string; model?: string; mode?: string; path: string; source: string}> = []
          const seen = new Set<string>()
          
          for (const agentDir of agentPaths) {
            if (!fs.existsSync(agentDir.path)) continue
            for (const file of fs.readdirSync(agentDir.path)) {
              if (!file.endsWith('.md')) continue
              const name = file.replace('.md', '')
              if (seen.has(name)) continue
              seen.add(name)
              
              const meta = parseAgentFile(path.join(agentDir.path, file))
              if (meta) {
                agents.push({
                  name: meta.name,
                  description: meta.description,
                  model: meta.model,
                  mode: meta.mode,
                  path: path.join(agentDir.path, file),
                  source: agentDir.type
                })
              }
            }
          }
          
          return JSON.stringify({ 
            count: agents.length,
            agents: agents.sort((a, b) => a.name.localeCompare(b.name))
          })
        }, 86_400_000) // 24h — agent list is static
      }
      
      case 'get': {
        return withToolCache("listAgents", args, () => {
          if (!args.agent) return JSON.stringify({ error: 'Agent name required for get action' })
          const agentPath = getAgentPath(args.agent, projectRoot)
          if (!agentPath) return JSON.stringify({ error: `Agent '${args.agent}' not found` })
          
          const meta = parseAgentFile(agentPath)
          if (!meta) return JSON.stringify({ error: 'Failed to parse agent metadata' })
          
          return JSON.stringify({
            name: meta.name,
            description: meta.description,
            model: meta.model,
            mode: meta.mode,
            path: agentPath
          })
        }, 86_400_000)
      }
      
      case 'get-content': {
        return withToolCache("listAgents", args, () => {
          if (!args.agent) return JSON.stringify({ error: 'Agent name required for get-content action' })
          const agentPath = getAgentPath(args.agent, projectRoot)
          if (!agentPath) return JSON.stringify({ error: `Agent '${args.agent}' not found` })
          
          return JSON.stringify({
            name: args.agent,
            content: fs.readFileSync(agentPath, 'utf-8'),
            path: agentPath
          })
        }, 86_400_000)
      }
      
      case 'find-by-capability': {
        return withToolCache("listAgents", args, () => {
          if (!args.capability) return JSON.stringify({ error: 'Capability keyword required' })
          const keyword = args.capability.toLowerCase()
          const agentPaths = [
            { type: 'project', path: path.join(projectRoot, '.opencode', 'agents') },
            { type: 'user', path: path.join(USER_CONFIG_DIR, 'agents') }
          ]
          
          const matches: Array<{name: string; description: string; matchReason: string}> = []
          
          for (const agentDir of agentPaths) {
            if (!fs.existsSync(agentDir.path)) continue
            for (const file of fs.readdirSync(agentDir.path)) {
              if (!file.endsWith('.md')) continue
              const name = file.replace('.md', '')
              
              if (name.toLowerCase().includes(keyword)) {
                const meta = parseAgentFile(path.join(agentDir.path, file))
                if (meta) {
                  matches.push({ name, description: meta.description, matchReason: 'name match' })
                }
              } else {
                const meta = parseAgentFile(path.join(agentDir.path, file))
                if (meta && meta.description.toLowerCase().includes(keyword)) {
                  matches.push({ name, description: meta.description, matchReason: 'description match' })
                }
              }
            }
          }
          
          return JSON.stringify({ 
            capability: args.capability,
            count: matches.length,
            matches: matches.sort((a, b) => a.name.localeCompare(b.name))
          })
        }, 86_400_000)
      }
      
      default:
        return JSON.stringify({ error: `Unknown action: ${args.action}` })
    }
  }
})