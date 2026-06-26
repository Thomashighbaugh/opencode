import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { homedir } from "os"
import { withToolCache } from "./cache-utils"

// Path conventions:
// - User-wide skills: ~/.config/opencode/skills/ (shared across all projects)
// - Project-level skills: .opencode/skills/ (project-specific)
// - Skills are searched in both locations, project-level takes precedence

const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), '.config', 'opencode')

interface SkillMetadata {
  name: string
  description: string
  level?: number
  triggers?: string[]
  allowedTools?: string[]
  [key: string]: unknown
}

interface SkillContent {
  metadata: SkillMetadata
  content: string
  scripts: string[]
  references: string[]
  source: 'project' | 'user'
}

const SKILL_PATHS = (projectRoot: string) => [
  { type: 'project' as const, path: path.join(projectRoot, '.opencode', 'skills') },
  { type: 'user' as const, path: path.join(USER_CONFIG_DIR, 'skills') }
]

function parseSkillFile(filePath: string, source: 'project' | 'user'): SkillContent | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    
    if (!frontmatterMatch) return null
    
    const metadataLines = frontmatterMatch[1]
    const body = frontmatterMatch[2]
    
    const metadata: SkillMetadata = { name: '', description: '' }
    let currentKey = ''
    
    for (const line of metadataLines.split('\n')) {
      if (line.startsWith('  ') && currentKey) {
        metadata[currentKey] = (metadata[currentKey] as string || '') + ' ' + line.trim()
      } else if (line.includes(':')) {
        const [key, ...valueParts] = line.split(':')
        currentKey = key.trim()
        const value = valueParts.join(':').trim()
        if (value.startsWith('[')) {
          metadata[currentKey] = value
            .replace(/[[\]"]/g, '')
            .split(',')
            .map(s => s.trim())
        } else if (value.startsWith('|')) {
          metadata[currentKey] = ''
        } else {
          metadata[currentKey] = value
        }
      }
    }
    
    const skillDir = path.dirname(filePath)
    const scripts = fs.existsSync(path.join(skillDir, 'scripts'))
      ? fs.readdirSync(path.join(skillDir, 'scripts')).filter(f => f.endsWith('.sh'))
      : []
    const references = fs.existsSync(path.join(skillDir, 'references'))
      ? fs.readdirSync(path.join(skillDir, 'references')).filter(f => f.endsWith('.md'))
      : []
    
    return { metadata, content: body, scripts, references, source }
  } catch {
    return null
  }
}

function findSkill(skillName: string, projectRoot: string): { path: string; source: 'project' | 'user' } | null {
  for (const { type, path: basePath } of SKILL_PATHS(projectRoot)) {
    const skillPath = path.join(basePath, skillName, 'SKILL.md')
    if (fs.existsSync(skillPath)) {
      return { path: skillPath, source: type }
    }
  }
  return null
}

export default tool({
  description: "Load a skill's content, metadata, scripts, and references for an agent to use",
  args: {
    skill: tool.schema.string().describe("Name of the skill to load (e.g., 'ralph', 'autopilot', 'verify')"),
    section: tool.schema.string().describe("Section to extract. Available common sections: workflow, steps, heuristics, examples, advanced, final-checklist"),
  },
  async execute(args, context) {
    return withToolCache("loadSkill", args, () => {
      const projectRoot = context.directory || process.cwd()
      const skillLocation = findSkill(args.skill, projectRoot)
      
      if (!skillLocation) {
        const available: string[] = []
        for (const { type, path: basePath } of SKILL_PATHS(projectRoot)) {
          if (!fs.existsSync(basePath)) continue
          const skills = fs.readdirSync(basePath).filter(d => 
            fs.existsSync(path.join(basePath, d, 'SKILL.md'))
          )
          for (const s of skills) {
            available.push(`${s} (${type})`)
          }
        }
        return JSON.stringify({
          error: `Skill '${args.skill}' not found`,
          available: [...new Set(available)]
        })
      }
      
      const parsed = parseSkillFile(skillLocation.path, skillLocation.source)
      if (!parsed) return JSON.stringify({ error: `Failed to parse skill file at ${skillLocation.path}` })
      
      if (!args.section) {
        return JSON.stringify({
          error: "Section parameter is required. Available common sections: workflow, steps, heuristics, examples, advanced, final-checklist"
        })
      }
      
      const sectionRegex = new RegExp(`## ${args.section}[\\s\\S]*?(?=## |$)`, 'i')
      const sectionMatch = parsed.content.match(sectionRegex)
      if (sectionMatch) {
        return JSON.stringify({
          skill: args.skill,
          section: args.section,
          content: sectionMatch[0].trim(),
          path: skillLocation.path,
          source: skillLocation.source
        })
      }
      return JSON.stringify({
        error: `Section '${args.section}' not found in skill '${args.skill}'`,
        availableSections: parsed.content.match(/^## [^\n]+/gm) || []
      })
    }, 86_400_000) // 24h — skill content is static
  }
})