import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"

interface ArtifactsManifest {
  created: string
  skill: string
  artifacts: Record<string, string>
}

// Artifacts stored in .opencode/state/artifacts/ (gitignored)
function getArtifactsDir(projectRoot: string, skill?: string): string {
  const base = path.join(projectRoot, '.opencode', 'state', 'artifacts')
  return skill ? path.join(base, skill) : base
}

function getManifestPath(projectRoot: string, skill: string): string {
  return path.join(getArtifactsDir(projectRoot, skill), 'manifest.json')
}

const VALID_ARTIFACT_ACTIONS = ['save', 'load', 'list', 'list-all', 'delete', 'get-latest'] as const
const VALID_ARTIFACT_TYPES = ['text', 'json', 'markdown'] as const

export default tool({
  description: "Manage skill artifacts: save, load, list, or delete artifacts created by skills",
  args: {
    action: tool.schema.string().describe(`Action to perform. Valid: ${VALID_ARTIFACT_ACTIONS.join(', ')}`),
    skill: tool.schema.string().optional().describe("Skill name for artifact scope"),
    name: tool.schema.string().optional().describe("Artifact name (for save/load/delete)"),
    content: tool.schema.string().optional().describe("Content for save action"),
    type: tool.schema.string().optional().describe(`Content type (default: markdown). Valid: ${VALID_ARTIFACT_TYPES.join(', ')}`),
    limit: tool.schema.number().optional().describe("Max items for list action")
  },
  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()
    
    switch (args.action) {
      case 'save': {
        if (!args.skill || !args.name || !args.content) {
          return JSON.stringify({ error: 'skill, name, and content required for save' })
        }
        
        const artifactsDir = getArtifactsDir(projectRoot, args.skill)
        fs.mkdirSync(artifactsDir, { recursive: true })
        
        const ext = args.type === 'json' ? '.json' : '.md'
        const fname = `${args.name}${ext}`
        const artifactPath = path.join(artifactsDir, fname)
        fs.writeFileSync(artifactPath, args.content)
        
        const manifestPath = getManifestPath(projectRoot, args.skill)
        let manifest: ArtifactsManifest
        try {
          manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
          manifest.artifacts[args.name] = artifactPath
        } catch {
          manifest = {
            created: new Date().toISOString(),
            skill: args.skill,
            artifacts: { [args.name]: artifactPath }
          }
        }
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
        
        return JSON.stringify({ saved: args.name, path: artifactPath, skill: args.skill })
      }
      
      case 'load': {
        if (!args.skill || !args.name) return JSON.stringify({ error: 'skill and name required for load' })
        
        const manifestPath = getManifestPath(projectRoot, args.skill)
        let artifactPath: string | undefined
        
        if (fs.existsSync(manifestPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
          artifactPath = manifest.artifacts[args.name]
        }
        
        if (!artifactPath) {
          const artifactsDir = getArtifactsDir(projectRoot, args.skill)
          for (const ext of ['.md', '.json', '.txt']) {
            const p = path.join(artifactsDir, `${args.name}${ext}`)
            if (fs.existsSync(p)) { artifactPath = p; break }
          }
        }
        
        if (!artifactPath || !fs.existsSync(artifactPath)) {
          return JSON.stringify({ error: `Artifact '${args.name}' not found for skill '${args.skill}'` })
        }
        
        return JSON.stringify({
          name: args.name,
          skill: args.skill,
          content: fs.readFileSync(artifactPath, 'utf-8'),
          path: artifactPath,
          type: artifactPath.endsWith('.json') ? 'json' : 'markdown'
        })
      }
      
      case 'list': {
        if (!args.skill) return JSON.stringify({ error: 'skill required for list' })
        
        const artifactsDir = getArtifactsDir(projectRoot, args.skill)
        if (!fs.existsSync(artifactsDir)) return JSON.stringify({ skill: args.skill, artifacts: [] })
        
        const files = fs.readdirSync(artifactsDir)
          .filter(f => f.endsWith('.md') || f.endsWith('.json'))
          .map(f => ({
            name: f.replace(/\.(md|json)$/, ''),
            path: path.join(artifactsDir, f),
            modified: fs.statSync(path.join(artifactsDir, f)).mtime
          }))
          .sort((a, b) => b.modified.getTime() - a.modified.getTime())
          .slice(0, args.limit || 50)
        
        return JSON.stringify({ skill: args.skill, count: files.length, artifacts: files })
      }
      
      case 'list-all': {
        const baseDir = getArtifactsDir(projectRoot)
        if (!fs.existsSync(baseDir)) return JSON.stringify({ skills: [] })
        
        const skills = fs.readdirSync(baseDir)
          .filter(d => fs.statSync(path.join(baseDir, d)).isDirectory())
          .map(skill => {
            const skillDir = path.join(baseDir, skill)
            const count = fs.readdirSync(skillDir).filter(f => 
              f.endsWith('.md') || f.endsWith('.json')
            ).length
            return { skill, artifactCount: count }
          })
        
        return JSON.stringify({ skills })
      }
      
      case 'delete': {
        if (!args.skill || !args.name) return JSON.stringify({ error: 'skill and name required for delete' })
        
        const manifestPath = getManifestPath(projectRoot, args.skill)
        let artifactPath: string | undefined
        
        if (fs.existsSync(manifestPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
          artifactPath = manifest.artifacts[args.name]
          delete manifest.artifacts[args.name]
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
        }
        
        if (!artifactPath) {
          const artifactsDir = getArtifactsDir(projectRoot, args.skill)
          for (const ext of ['.md', '.json', '.txt']) {
            const p = path.join(artifactsDir, `${args.name}${ext}`)
            if (fs.existsSync(p)) { artifactPath = p; break }
          }
        }
        
        if (artifactPath && fs.existsSync(artifactPath)) {
          fs.unlinkSync(artifactPath)
          return JSON.stringify({ deleted: args.name, skill: args.skill })
        }
        
        return JSON.stringify({ error: `Artifact '${args.name}' not found` })
      }
      
      case 'get-latest': {
        if (!args.skill) return JSON.stringify({ error: 'skill required for get-latest' })
        
        const artifactsDir = getArtifactsDir(projectRoot, args.skill)
        if (!fs.existsSync(artifactsDir)) return JSON.stringify({ error: 'No artifacts for this skill' })
        
        const files = fs.readdirSync(artifactsDir)
          .filter(f => f.endsWith('.md') || f.endsWith('.json'))
          .map(f => ({
            name: f.replace(/\.(md|json)$/, ''),
            path: path.join(artifactsDir, f),
            modified: fs.statSync(path.join(artifactsDir, f)).mtime
          }))
          .sort((a, b) => b.modified.getTime() - a.modified.getTime())
        
        if (files.length === 0) return JSON.stringify({ error: 'No artifacts found' })
        
        const latest = files[0]
        return JSON.stringify({
          name: latest.name,
          skill: args.skill,
          content: fs.readFileSync(latest.path, 'utf-8'),
          path: latest.path,
          modified: latest.modified.toISOString()
        })
      }
      
      default:
        return JSON.stringify({ error: `Unknown action: ${args.action}` })
    }
  }
})