import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"

interface ModeState {
  active: boolean
  started_at?: string
  completed_at?: string
  iteration?: number
  max_iterations?: number
  current_phase?: string
  prompt?: string
  original_prompt?: string
  session_id?: string
  project_path?: string
  reinforcement_count?: number
  awaiting_confirmation?: boolean
  last_checked_at?: string
  linked_ultrawork?: boolean
  linked_team?: boolean
  linked_ralph?: boolean
}

const SUPPORTED_MODES = ['ralph', 'autopilot', 'ultrawork', 'team', 'ultraqa', 'ralplan'] as const
type ModeName = typeof SUPPORTED_MODES[number]

// State stored in .opencode/state/ (gitignored)
function getStatePath(projectRoot: string, mode: ModeName): string {
  return path.join(projectRoot, '.opencode', 'state', `${mode}-state.json`)
}

function getStateDir(projectRoot: string): string {
  return path.join(projectRoot, '.opencode', 'state')
}

function readState(projectRoot: string, mode: ModeName): ModeState | null {
  const statePath = getStatePath(projectRoot, mode)
  try {
    if (!fs.existsSync(statePath)) return null
    return JSON.parse(fs.readFileSync(statePath, 'utf-8'))
  } catch {
    return null
  }
}

function writeState(projectRoot: string, mode: ModeName, state: ModeState): void {
  const stateDir = path.join(projectRoot, '.opencode', 'state')
  fs.mkdirSync(stateDir, { recursive: true })
  const statePath = getStatePath(projectRoot, mode)
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2))
}

const VALID_MODE_ACTIONS = ['start', 'stop', 'status', 'update', 'list-active', 'progress'] as const

export default tool({
  description: "Manage execution modes: start, stop, update, or check status of ralph, autopilot, ultrawork, team, ultraqa modes",
  args: {
    action: tool.schema.string().describe(`Action to perform on mode state. Valid: ${VALID_MODE_ACTIONS.join(', ')}`),
    mode: tool.schema.string().optional().describe("Mode name (ralph, autopilot, ultrawork, team, ultraqa, ralplan)"),
    prompt: tool.schema.string().optional().describe("Task prompt for start action"),
    phase: tool.schema.string().optional().describe("Current phase for update action"),
    iteration: tool.schema.number().optional().describe("Current iteration for update action"),
    data: tool.schema.any().optional().describe("Additional state data for update action")
  },
  async execute(args, context) {
    const projectRoot = context.projectRoot || process.cwd()
    const sessionId = context.sessionID
    
    switch (args.action) {
      case 'start': {
        if (!args.mode || !SUPPORTED_MODES.includes(args.mode as ModeName)) {
          return JSON.stringify({ error: `Mode required. Supported: ${SUPPORTED_MODES.join(', ')}` })
        }
        if (!args.prompt) return JSON.stringify({ error: 'Prompt required for start action' })
        
        const now = new Date().toISOString()
        const state: ModeState = {
          active: true,
          started_at: now,
          prompt: args.prompt,
          original_prompt: args.prompt,
          session_id: sessionId,
          project_path: projectRoot,
          last_checked_at: now,
          ...(args.mode === 'ralph' ? { iteration: 1, max_iterations: 100 } : {}),
          ...(args.mode === 'ultrawork' ? { reinforcement_count: 0 } : {})
        }
        
        writeState(projectRoot, args.mode as ModeName, state)
        return JSON.stringify({ 
          started: args.mode, 
          prompt: args.prompt,
          sessionId,
          path: getStatePath(projectRoot, args.mode as ModeName)
        })
      }
      
      case 'stop': {
        if (!args.mode) return JSON.stringify({ error: 'Mode name required' })
        const statePath = getStatePath(projectRoot, args.mode as ModeName)
        if (!fs.existsSync(statePath)) return JSON.stringify({ error: `No active ${args.mode} mode` })
        
        const state = readState(projectRoot, args.mode as ModeName)
        if (state) {
          state.active = false
          state.completed_at = new Date().toISOString()
          writeState(projectRoot, args.mode as ModeName, state)
        }
        
        return JSON.stringify({ stopped: args.mode, completed_at: new Date().toISOString() })
      }
      
      case 'status': {
        if (!args.mode) return JSON.stringify({ error: 'Mode name required' })
        const state = readState(projectRoot, args.mode as ModeName)
        return JSON.stringify(state ? { active: state.active, ...state } : { active: false, mode: args.mode })
      }
      
      case 'update': {
        if (!args.mode) return JSON.stringify({ error: 'Mode name required' })
        const state = readState(projectRoot, args.mode as ModeName)
        if (!state) return JSON.stringify({ error: `No active ${args.mode} mode` })
        
        if (args.phase) state.current_phase = args.phase
        if (args.iteration !== undefined) state.iteration = args.iteration
        if (args.data) Object.assign(state, args.data)
        state.last_checked_at = new Date().toISOString()
        
        writeState(projectRoot, args.mode as ModeName, state)
        return JSON.stringify({ updated: args.mode, state })
      }
      
      case 'list-active': {
        const activeModes: Array<{mode: string; prompt?: string; iteration?: number; phase?: string; started_at?: string}> = []
        
        for (const mode of SUPPORTED_MODES) {
          const state = readState(projectRoot, mode)
          if (state?.active) {
            activeModes.push({
              mode,
              prompt: state.prompt,
              iteration: state.iteration,
              phase: state.current_phase,
              started_at: state.started_at
            })
          }
        }
        
        return JSON.stringify({ count: activeModes.length, activeModes })
      }
      
      case 'progress': {
        if (!args.mode) return JSON.stringify({ error: 'Mode name required' })
        const state = readState(projectRoot, args.mode as ModeName)
        if (!state) return JSON.stringify({ error: `No state for ${args.mode}` })
        
        const progress = {
          mode: args.mode,
          active: state.active,
          started: state.started_at,
          completed: state.completed_at,
          duration: state.started_at 
            ? Math.round((Date.now() - new Date(state.started_at).getTime()) / 1000 / 60) 
            : 0,
          iteration: state.iteration,
          maxIterations: state.max_iterations,
          phase: state.current_phase
        }
        
        return JSON.stringify(progress)
      }
      
      default:
        return JSON.stringify({ error: `Unknown action: ${args.action}` })
    }
  }
})