import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { homedir } from "os"

// Path conventions:
// - User-wide config: ~/.config/opencode/ (agents, skills, settings shared across projects)
// - Project-level config: .opencode/ (project-specific agents, skills, commands, state)
// - State is stored in .opencode/state/ (gitignored via .gitignore)

const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), '.config', 'opencode')

interface AgentContext {
  projectRoot: string
  stateDir: string
  plansDir: string
  logsDir: string
  artifactsDir: string
  projectMemory: Record<string, unknown> | null
  notepad: string | null
  activeModes: string[]
  userConfigDir: string
}

function getContextPaths(projectRoot: string): { stateDir: string; plansDir: string; logsDir: string; artifactsDir: string } {
  const stateDir = path.join(projectRoot, '.opencode', 'state')
  return {
    stateDir,
    plansDir: path.join(stateDir, 'plans'),
    logsDir: path.join(stateDir, 'logs'),
    artifactsDir: path.join(stateDir, 'artifacts')
  }
}

function readProjectMemory(stateDir: string): Record<string, unknown> | null {
  const memoryPath = path.join(stateDir, 'project-memory.json')
  if (!fs.existsSync(memoryPath)) return null
  try {
    return JSON.parse(fs.readFileSync(memoryPath, 'utf-8'))
  } catch {
    return null
  }
}

function readNotepad(stateDir: string): string | null {
  const notepadPath = path.join(stateDir, 'notepad.md')
  if (!fs.existsSync(notepadPath)) return null
  return fs.readFileSync(notepadPath, 'utf-8')
}

function getActiveModes(stateDir: string): string[] {
  if (!fs.existsSync(stateDir)) return []
  const activeModes: string[] = []
  const modeFiles = ['ralph-state.json', 'autopilot-state.json', 'ultrawork-state.json', 'team-state.json', 'ultraqa-state.json']
  for (const file of modeFiles) {
    const filePath = path.join(stateDir, file)
    if (fs.existsSync(filePath)) {
      try {
        const state = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        if (state.active) {
          activeModes.push(file.replace('-state.json', ''))
        }
      } catch {}
    }
  }
  return activeModes
}

const VALID_CTX_ACTIONS = ['get', 'update-memory', 'update-notepad', 'clear-mode', 'list-plans', 'get-state'] as const

export default tool({
  description: "Get or update agent context including project memory, notepad, active modes, and Hubs state directories",
  args: {
    action: tool.schema.string().describe(`Action to perform on the context. Valid: ${VALID_CTX_ACTIONS.join(', ')}`),
    data: tool.schema.any().optional().describe("Data for update operations (memory object, notepad content, or mode name for clear-mode)"),
    mode: tool.schema.string().optional().describe("Mode name for get-state or clear-mode actions")
  },
  async execute(args, context) {
    const projectRoot = context.projectRoot || process.cwd()
    const paths = getContextPaths(projectRoot)
    
    switch (args.action) {
      case 'get': {
        const ctx: AgentContext = {
          projectRoot,
          ...paths,
          projectMemory: readProjectMemory(paths.stateDir),
          notepad: readNotepad(paths.stateDir),
          activeModes: getActiveModes(paths.stateDir),
          userConfigDir: USER_CONFIG_DIR
        }
        return JSON.stringify(ctx)
      }
      
      case 'update-memory': {
        if (!args.data) return JSON.stringify({ error: 'No data provided for memory update' })
        fs.mkdirSync(paths.stateDir, { recursive: true })
        const memoryPath = path.join(paths.stateDir, 'project-memory.json')
        fs.writeFileSync(memoryPath, JSON.stringify(args.data, null, 2), 'utf-8')
        return JSON.stringify({ success: true, path: memoryPath })
      }
      
      case 'update-notepad': {
        if (typeof args.data !== 'string') return JSON.stringify({ error: 'Notepad content must be a string' })
        fs.mkdirSync(paths.stateDir, { recursive: true })
        const notepadPath = path.join(paths.stateDir, 'notepad.md')
        fs.writeFileSync(notepadPath, args.data, 'utf-8')
        return JSON.stringify({ success: true, path: notepadPath })
      }
      
      case 'clear-mode': {
        if (!args.mode) return JSON.stringify({ error: 'Mode name required for clear-mode' })
        const statePath = path.join(paths.stateDir, `${args.mode}-state.json`)
        if (fs.existsSync(statePath)) {
          fs.unlinkSync(statePath)
          return JSON.stringify({ success: true, cleared: args.mode })
        }
        return JSON.stringify({ error: `No state file for mode '${args.mode}'` })
      }
      
      case 'list-plans': {
        if (!fs.existsSync(paths.plansDir)) return JSON.stringify({ plans: [] })
        const plans = fs.readdirSync(paths.plansDir)
          .filter(f => f.endsWith('.md'))
          .map(f => ({
            name: f,
            path: path.join(paths.plansDir, f),
            modified: fs.statSync(path.join(paths.plansDir, f)).mtime
          }))
        return JSON.stringify({ plans })
      }
      
      case 'get-state': {
        if (!args.mode) return JSON.stringify({ error: 'Mode name required for get-state' })
        const statePath = path.join(paths.stateDir, `${args.mode}-state.json`)
        if (!fs.existsSync(statePath)) return JSON.stringify({ error: `No state for mode '${args.mode}'`, exists: false })
        try {
          return JSON.stringify({ 
            mode: args.mode, 
            state: JSON.parse(fs.readFileSync(statePath, 'utf-8')),
            path: statePath 
          })
        } catch {
          return JSON.stringify({ error: 'Failed to parse state file', path: statePath })
        }
      }
      
      default:
        return JSON.stringify({ error: `Unknown action: ${args.action}` })
    }
  }
})