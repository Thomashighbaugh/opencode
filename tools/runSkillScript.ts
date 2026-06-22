import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { execSync, spawn } from "child_process"
import { homedir } from "os"

// ── Async Process Throttle ──────────────────────────────────────────────
// Cap concurrent async subprocesses at 5 to prevent resource exhaustion.
const MAX_ASYNC_PROCS = 5
const _activeAsyncProcs = new Set<string>()

// Path conventions:
// - User-wide skills: ~/.config/opencode/skills/ (shared across all projects)
// - Project-level skills: .opencode/skills/ (project-specific)
// - Skill scripts are searched in both locations, project-level takes precedence

const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), '.config', 'opencode')

interface SkillScript {
  name: string
  script: string
  path: string
  skill: string
}

function findSkillScript(projectRoot: string, skillName: string, scriptName?: string): SkillScript[] {
  const projectSkillsPath = path.join(projectRoot, '.opencode', 'skills', skillName, 'scripts')
  const userSkillsPath = path.join(USER_CONFIG_DIR, 'skills', skillName, 'scripts')
  
  const scripts: SkillScript[] = []
  
  for (const basePath of [projectSkillsPath, userSkillsPath]) {
    if (!fs.existsSync(basePath)) continue
    const files = fs.readdirSync(basePath).filter(f => f.endsWith('.sh'))
    
    for (const file of files) {
      if (scriptName && file !== scriptName) continue
      scripts.push({
        name: file.replace('.sh', ''),
        script: file,
        path: path.join(basePath, file),
        skill: skillName
      })
    }
  }
  
  return scripts
}

function listSkillScripts(projectRoot: string, skillName?: string): Array<{skill: string; scripts: string[]}> {
  const results: Array<{skill: string; scripts: string[]}> = []
  const searchPaths = [
    { type: 'project', path: path.join(projectRoot, '.opencode', 'skills') },
    { type: 'user', path: path.join(USER_CONFIG_DIR, 'skills') }
  ]
  
  for (const basePath of searchPaths) {
    if (!fs.existsSync(basePath.path)) continue
    const skills = skillName ? [skillName] : fs.readdirSync(basePath.path).filter(d => 
      fs.existsSync(path.join(basePath.path, d, 'scripts'))
    )
    
    for (const skill of skills) {
      const scriptsDir = path.join(basePath.path, skill, 'scripts')
      if (!fs.existsSync(scriptsDir)) continue
      
      const scripts = fs.readdirSync(scriptsDir)
        .filter(f => f.endsWith('.sh'))
        .map(f => f.replace('.sh', ''))
      if (scripts.length > 0) {
        results.push({ skill, scripts })
      }
    }
  }
  
  return results
}

const VALID_SCRIPT_ACTIONS = ['list', 'list-skill', 'run', 'run-async', 'read'] as const

export default tool({
  description: "List or execute skill scripts. Scripts are shell scripts bundled with skills for automation.",
  args: {
    action: tool.schema.string().describe(`Action: list all/for skill, run script, or read script content. Valid: ${VALID_SCRIPT_ACTIONS.join(', ')}`),
    skill: tool.schema.string().optional().describe("Skill name (e.g., 'mcp-setup')"),
    script: tool.schema.string().optional().describe("Script name without .sh (e.g., 'install-servers')"),
    args: tool.schema.array(tool.schema.string()).optional().describe("Additional arguments for the script"),
    async: tool.schema.boolean().optional().describe("Run in background (for run action)")
  },
  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()
    
    switch (args.action) {
      case 'list': {
        const results = listSkillScripts(projectRoot)
        return JSON.stringify({ 
          count: results.length,
          skills: results 
        })
      }
      
      case 'list-skill': {
        if (!args.skill) return JSON.stringify({ error: 'Skill name required for list-skill' })
        const scripts = findSkillScript(projectRoot, args.skill)
        return JSON.stringify({ 
          skill: args.skill,
          count: scripts.length,
          scripts: scripts.map(s => ({
            name: s.name,
            path: s.path,
            hasContent: fs.existsSync(s.path)
          }))
        })
      }
      
      case 'read': {
        if (!args.skill || !args.script) return JSON.stringify({ error: 'Both skill and script name required' })
        const scripts = findSkillScript(projectRoot, args.skill, `${args.script}.sh`)
        if (scripts.length === 0) return JSON.stringify({ error: `Script '${args.script}' not found in skill '${args.skill}'` })
        
        const content = fs.readFileSync(scripts[0].path, 'utf-8')
        return JSON.stringify({
          skill: args.skill,
          script: args.script,
          content,
          path: scripts[0].path
        })
      }
      
      case 'run':
      case 'run-async': {
        if (!args.skill || !args.script) return JSON.stringify({ error: 'Both skill and script name required' })
        const scripts = findSkillScript(projectRoot, args.skill, `${args.script}.sh`)
        if (scripts.length === 0) return JSON.stringify({ error: `Script '${args.script}' not found in skill '${args.skill}'` })
        
        const scriptPath = scripts[0].path
        const scriptArgs = args.args?.join(' ') || ''
        const cmd = `bash "${scriptPath}" ${scriptArgs}`
        
        try {
          if (args.action === 'run-async') {
            // Check concurrent process limit before launching
            if (_activeAsyncProcs.size >= MAX_ASYNC_PROCS) {
              return JSON.stringify({ error: `Max async processes (${MAX_ASYNC_PROCS}) reached. Try again later.`, active: _activeAsyncProcs.size })
            }
            const procId = `${args.skill}:${args.script}`
            _activeAsyncProcs.add(procId)
            const child = spawn('bash', [scriptPath, ...(args.args || [])], {
              stdio: 'ignore',
              detached: true,
            })
            child.unref()
            child.on('exit', () => { _activeAsyncProcs.delete(procId) })
            return JSON.stringify({ launched: true, command: args.script, skill: args.skill, activeProcs: _activeAsyncProcs.size })
          } else {
            const output = execSync(cmd, { encoding: 'utf-8', timeout: 30000 })
            return JSON.stringify({
              success: true,
              skill: args.skill,
              script: args.script,
              output: output.slice(-2000),
              path: scriptPath
            })
          }
        } catch (e: any) {
          return JSON.stringify({
            error: e.message,
            skill: args.skill,
            script: args.script,
            exitCode: e.status,
            stderr: e.stderr?.slice(-1000)
          })
        }
      }
      
      default:
        return JSON.stringify({ error: `Unknown action: ${args.action}` })
    }
  }
})