import { z } from "zod/v4"
import * as fs from "fs"
import * as path from "path"
import { execFileSync, spawn } from "child_process"
import { homedir } from "os"
import type { ToolDefinition } from "./types"

// ── Async Process Throttle ──────────────────────────────────────────────
// Cap concurrent async subprocesses at 5 to prevent resource exhaustion.
const MAX_ASYNC_PROCS = 5
const _activeAsyncProcs = new Set<string>()

// Path conventions:
// - User-wide skills: ~/.config/opencode/skills/ (shared across all projects)
// - Project-level skills: .opencode/skills/ (project-specific)
// - Skill scripts are searched in both locations, project-level takes precedence

const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), '.config', 'opencode')

// Supported script types. `.sh` runs under bash; `.ts` runs under bun (the
// OpenCode-internal runtime, which is guaranteed present).
const SCRIPT_EXTS = ['.sh', '.ts'] as const

function stripExt(file: string): string {
  return file.replace(/\.(sh|ts)$/, '')
}

function runnerFor(file: string): string {
  return file.endsWith('.ts') ? 'bun' : 'bash'
}

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
    const files = fs.readdirSync(basePath).filter(f => SCRIPT_EXTS.some(e => f.endsWith(e)))

    for (const file of files) {
      if (scriptName && stripExt(file) !== scriptName && file !== scriptName) continue
      scripts.push({
        name: stripExt(file),
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
        .filter(f => SCRIPT_EXTS.some(e => f.endsWith(e)))
        .map(f => stripExt(f))
      if (scripts.length > 0) {
        results.push({ skill, scripts })
      }
    }
  }

  return results
}

const VALID_SCRIPT_ACTIONS = ['list', 'list-skill', 'run', 'run-async', 'read'] as const

const input = z.object({
  action: z
    .string()
    .describe(
      `Action: list all/for skill, run script, or read script content. Valid: ${VALID_SCRIPT_ACTIONS.join(", ")}`,
    ),
  skill: z.string().optional().describe("Skill name (e.g., 'mcp-setup')"),
  script: z.string().optional().describe("Script name without extension (e.g., 'install-servers')"),
  args: z.array(z.string()).optional().describe("Additional arguments for the script"),
  async: z.boolean().optional().describe("Run in background (for run action)"),
})

/** V2 tool results carry `{ content }`; this tool's payloads are JSON. */
const json = (value: unknown) => ({ content: JSON.stringify(value) })

export default {
  name: "runSkillScript",
  description:
    "List or execute skill scripts. Scripts are shell (.sh, run with bash) or TypeScript (.ts, run with bun) files bundled with skills for automation.",
  input,
  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()

    switch (args.action) {
      case 'list': {
        const results = listSkillScripts(projectRoot)
        return json({
          count: results.length,
          skills: results
        })
      }

      case 'list-skill': {
        if (!args.skill) return json({ error: 'Skill name required for list-skill' })
        const scripts = findSkillScript(projectRoot, args.skill)
        return json({
          skill: args.skill,
          count: scripts.length,
          scripts: scripts.map(s => ({
            name: s.name,
            path: s.path,
            runner: runnerFor(s.script),
            hasContent: fs.existsSync(s.path)
          }))
        })
      }

      case 'read': {
        if (!args.skill || !args.script) return json({ error: 'Both skill and script name required' })
        const scripts = findSkillScript(projectRoot, args.skill, args.script)
        if (scripts.length === 0) return json({ error: `Script '${args.script}' not found in skill '${args.skill}'` })

        const content = fs.readFileSync(scripts[0].path, 'utf-8')
        return json({
          skill: args.skill,
          script: args.script,
          content,
          path: scripts[0].path
        })
      }

      case 'run':
      case 'run-async': {
        if (!args.skill || !args.script) return json({ error: 'Both skill and script name required' })
        const scripts = findSkillScript(projectRoot, args.skill, args.script)
        if (scripts.length === 0) return json({ error: `Script '${args.script}' not found in skill '${args.skill}'` })

        const scriptPath = scripts[0].path
        const runner = runnerFor(scripts[0].script)
        const scriptArgs = args.args || []

        try {
          if (args.action === 'run-async') {
            // Check concurrent process limit before launching
            if (_activeAsyncProcs.size >= MAX_ASYNC_PROCS) {
              return json({ error: `Max async processes (${MAX_ASYNC_PROCS}) reached. Try again later.`, active: _activeAsyncProcs.size })
            }
            const procId = `${args.skill}:${args.script}`
            _activeAsyncProcs.add(procId)
            const child = spawn(runner, [scriptPath, ...scriptArgs], {
              stdio: 'ignore',
              detached: true,
            })
            child.unref()
            child.on('exit', () => { _activeAsyncProcs.delete(procId) })
            return json({ launched: true, command: args.script, runner, skill: args.skill, activeProcs: _activeAsyncProcs.size })
          } else {
            const output = execFileSync(runner, [scriptPath, ...scriptArgs], { encoding: 'utf-8', timeout: 30000 })
            return json({
              success: true,
              skill: args.skill,
              script: args.script,
              runner,
              output: output.slice(-2000),
              path: scriptPath
            })
          }
        } catch (e: any) {
          return json({
            error: e.message,
            skill: args.skill,
            script: args.script,
            runner,
            exitCode: e.status,
            stderr: e.stderr?.toString().slice(-1000)
          })
        }
      }

      default:
        return json({ error: `Unknown action: ${args.action}` })
    }
  },
} satisfies ToolDefinition<z.infer<typeof input>>
