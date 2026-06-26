/**
 * Skill Categories — groups all available skills by functional domain.
 *
 * Reads SKILL.md frontmatter from every skill directory, categorizes each
 * using authoritative AGENTS.md data, hub subcommand matching, and
 * description keyword heuristics as fallback.
 */

import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { homedir } from "os"

const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), '.config', 'opencode')
const SKILLS_DIR = path.join(USER_CONFIG_DIR, 'skills')

// ─── Types ───────────────────────────────────────────────────────────────

interface SkillMeta {
  name: string
  description: string
}

interface CategoryGroup {
  category: string
  skills: SkillMeta[]
}

// ─── Authoritative Category Map (from AGENTS.md) ────────────────────────

const AUTHORITATIVE_CATEGORIES: Record<string, string> = {
  // Init
  'init-project': 'Init',
  'hubs-setup': 'Init',
  'deepinit': 'Init',
  'hubs-doctor': 'Init',
  'provision': 'Init',
  // Ideation
  'ideation': 'Ideation',
  'plan': 'Ideation',
  'deep-interview': 'Ideation',
  'graph-thinking': 'Ideation',
  'idea-refine': 'Ideation',
  'ralplan': 'Ideation',
  'overhaul': 'Ideation',
  // Orchestrate
  'orchestrate': 'Orchestrate',
  'ralph': 'Orchestrate',
  'autopilot': 'Orchestrate',
  'ultrawork': 'Orchestrate',
  'team': 'Orchestrate',
  'ccg': 'Orchestrate',
  'sciomc': 'Orchestrate',
  'deep-dive': 'Orchestrate',
  'trace': 'Orchestrate',
  'cancel': 'Orchestrate',
  // Harvest
  'harvest-context': 'Harvest',
  'remember': 'Harvest',
  'wiki': 'Harvest',
  'skill-creator': 'Harvest',
  'opencode-agent-creator': 'Harvest',
  'opencode-command-creator': 'Harvest',
  'skillify': 'Harvest',
  'conventional-commit': 'Harvest',
  'humanizer': 'Harvest',
  // Project
  'project': 'Project',
  'changelog-generator': 'Project',
  'file-organizer': 'Project',
  'icon-generator': 'Project',
  'github-ops': 'Project',
  'release': 'Project',
  'ai-slop-cleaner': 'Project',
  // UX/Design
  'design-system-starter': 'UX/Design',
  'mui': 'UX/Design',
  // External
  'context7-docs': 'External',
  'external-context': 'External',
  'mcp-setup': 'External',
  'autoresearch-agent': 'External',
  // Meta
  'self-improve': 'Meta',
  'learner': 'Meta',
  'agent-md-refactor': 'Meta',
  'agent-format-enforcer': 'Meta',
  'config-sync': 'Meta',
  'hubs-reference': 'Meta',
  'hubs-teams': 'Meta',
  'project-session-manager': 'Meta',
  // QA/Verify
  'verify': 'QA/Verify',
  'visual-verdict': 'QA/Verify',
  'ultraqa': 'QA/Verify',
  'debug': 'QA/Verify',
  // Docs
  'crafting-effective-readmes': 'Docs',
  'writer-memory': 'Docs',
  'naming-cheatsheet': 'Docs',
  'web-to-markdown': 'Docs',
  'professional-communication': 'Docs',
  'deliberate-practice': 'Docs',
  'hud': 'Docs',
  'dependency-updater': 'Docs',
  'configure-notifications': 'Docs',
}

// ─── Hub Subcommand → Hub Mapping ────────────────────────────────────────

const SUBCOMMAND_TO_HUB: Record<string, string> = {
  // Orchestrate subcommands → Orchestrate
  'ralph': 'Orchestrate',
  'team': 'Orchestrate',
  'deep': 'Orchestrate',
  'ccg': 'Orchestrate',
  'ultrawork': 'Orchestrate',
  'autopilot': 'Orchestrate',
  'sciomc': 'Orchestrate',
  'swarm': 'Orchestrate',
  'state-machine': 'Orchestrate',
  'consensus': 'Orchestrate',
  'evolutionary': 'Orchestrate',
  'spec-driven': 'Orchestrate',
  'react': 'Orchestrate',
  'plan-execute': 'Orchestrate',
  'hive': 'Orchestrate',
  'tdd': 'Orchestrate',
  'pair': 'Orchestrate',
  'pipeline': 'Orchestrate',
  'gsd': 'Orchestrate',
  'self-assess': 'Orchestrate',
  'remediate': 'Orchestrate',
  'devin': 'Orchestrate',
  'maestro': 'Orchestrate',
  'metaswarm': 'Orchestrate',
  'cc10x': 'Orchestrate',
  'gastown': 'Orchestrate',
  'ruflo': 'Orchestrate',
  'harden': 'Orchestrate',
  'brownfield': 'Orchestrate',
  'vibe-code': 'Orchestrate',
  // Ideation subcommands → Ideation
  'brainstorm': 'Ideation',
  'decomposition': 'Ideation',
  'refine': 'Ideation',
  'graph': 'Ideation',
  'research': 'Ideation',
  'ddd': 'Ideation',
  'event-storming': 'Ideation',
  'double-diamond': 'Ideation',
  'jtbd': 'Ideation',
  'impact-mapping': 'Ideation',
  'spiral': 'Ideation',
  'top-down': 'Ideation',
  'bottom-up': 'Ideation',
  'adversarial-debate': 'Ideation',
  'cleanroom': 'Ideation',
  'pwf': 'Ideation',
  'rpikit': 'Ideation',
  'story-mapping': 'Ideation',
  'lean-canvas': 'Ideation',
  'constitution': 'Ideation',
  'quality': 'Ideation',
  'modularity': 'Ideation',
  'arch-prep': 'Ideation',
  // Harvest subcommands → Harvest
  'session': 'Harvest',
  'codebase': 'Harvest',
  'skill': 'Harvest',
  'agent': 'Harvest',
  'rule': 'Harvest',
  'command': 'Harvest',
  'memory': 'Harvest',
  'docs': 'Harvest',
  'decompose': 'Harvest',
  'context': 'Harvest',
  'consume': 'Harvest',
  'compress': 'Harvest',
  'secondbrain': 'Harvest',
  'journal': 'Harvest',
  'search': 'Harvest',
  'prune': 'Harvest',
  'export': 'Harvest',
  'diff': 'Harvest',
  'sweep': 'Harvest',
  // Project subcommands → Project
  'tests': 'Project',
  'commit': 'Project',
  'stage': 'Project',
  'pr': 'Project',
  'gh': 'Project',
  'optimize': 'Project',
  'refactor': 'Project',
  'simplify': 'Project',
  'cleanup': 'Project',
  'modernize': 'Project',
  'icon': 'Project',
  'organize': 'Project',
  'analyze': 'Project',
  'changelog': 'Project',
  'converge': 'Project',
  'scan': 'Project',
  'sandbox': 'Project',
  'retrospect': 'Project',
  'purge': 'Project',
  'review': 'Project',
  'audit': 'Project',
  'archive': 'Project',
  'git-cleanup': 'Project',
  'workspace': 'Project',
  // Init subcommands → Init
  'setup': 'Init',
  'detect': 'Init',
  'verify': 'Init',
  'refresh': 'Init',
  'status': 'Init',
  'map-codebase': 'Init',
  'doctor': 'Init',
  'reset': 'Init',
}

// ─── Description Keyword Heuristics (for unlisted skills) ────────────────

function categorizeByDescription(name: string, description: string): string {
  const lowerDesc = description.toLowerCase()
  const lowerName = name.toLowerCase()

  // Check for hub subcommand partial match (e.g., hive-methodology → hive)
  for (const [subcommand, hub] of Object.entries(SUBCOMMAND_TO_HUB)) {
    if (lowerName === subcommand || lowerName.startsWith(subcommand + '-') || lowerName.endsWith('-' + subcommand)) {
      return hub
    }
  }

  // Keyword-based categorization for remaining skills
  if (/multi.model|consultation|external|documentation|docs?/.test(lowerDesc) && /fetch|api/.test(lowerDesc)) {
    return 'External'
  }

  if (/session|context|save|artifact|extract|memory|wiki|knowledge/.test(lowerDesc) && /compact|harvest|save/.test(lowerDesc)) {
    return 'Harvest'
  }

  if (/config|plugin|agent|cache|reference|meta|self.improv|learner|skill|format/.test(lowerDesc) &&
      /opencode|self|agent|plugin/.test(lowerName)) {
    return 'Meta'
  }

  if (/document|convert|pandoc|pdf|epub|markdown/.test(lowerDesc)) {
    return 'Docs'
  }

  if (/react|typescript|interface|type|key|prop|naming|guidance/.test(lowerDesc) &&
      /best.practices|guide|when.to.use/.test(lowerDesc)) {
    return 'Docs'
  }

  if (/privacy|secret|pii|scan|cleanup|security/.test(lowerDesc) && /scan|sweep/.test(lowerDesc)) {
    return 'Project'
  }

  if (/break.down|decompos|task|actionable|acceptance.criteria/.test(lowerDesc)) {
    return 'Ideation'
  }

  if (/router|intent|dispatch|orchestrat/.test(lowerDesc)) {
    return 'Orchestrate'
  }

  // Default: Meta (infrastructure/tooling)
  return 'Meta'
}

// ─── Core Logic ──────────────────────────────────────────────────────────

function parseSkillMeta(skillDir: string): SkillMeta | null {
  const skillName = path.basename(skillDir)
  const skillMdPath = path.join(skillDir, 'SKILL.md')

  if (!fs.existsSync(skillMdPath)) return null

  try {
    const content = fs.readFileSync(skillMdPath, 'utf-8')
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)

    if (!frontmatterMatch) {
      return { name: skillName, description: '' }
    }

    const frontmatter = frontmatterMatch[1]
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
    const descMatch = frontmatter.match(/^description:\s*(.+)$/m)

    return {
      name: nameMatch ? nameMatch[1].trim() : skillName,
      description: descMatch ? descMatch[1].trim() : '',
    }
  } catch {
    return { name: skillName, description: '' }
  }
}

function categorizeSkill(meta: SkillMeta): string {
  // 1. Check authoritative map first
  if (AUTHORITATIVE_CATEGORIES[meta.name]) {
    return AUTHORITATIVE_CATEGORIES[meta.name]
  }

  // 2. Check hub subcommand match
  if (SUBCOMMAND_TO_HUB[meta.name]) {
    return SUBCOMMAND_TO_HUB[meta.name]
  }

  // 3. Use description-based heuristic
  return categorizeByDescription(meta.name, meta.description)
}

function getAllCategorizedSkills(): CategoryGroup[] {
  if (!fs.existsSync(SKILLS_DIR)) {
    return []
  }

  const categoryMap = new Map<string, SkillMeta[]>()
  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const skillDir = path.join(SKILLS_DIR, entry.name)
    const meta = parseSkillMeta(skillDir)
    if (!meta) continue

    const category = categorizeSkill(meta)

    if (!categoryMap.has(category)) {
      categoryMap.set(category, [])
    }
    categoryMap.get(category)!.push(meta)
  }

  // Sort skills within each category alphabetically
  const categoryOrder = ['Init', 'Ideation', 'Orchestrate', 'Harvest', 'Project', 'UX/Design', 'External', 'Meta', 'QA/Verify', 'Docs']
  const result: CategoryGroup[] = []

  for (const cat of categoryOrder) {
    const skills = categoryMap.get(cat)
    if (skills) {
      skills.sort((a, b) => a.name.localeCompare(b.name))
      result.push({ category: cat, skills })
    }
  }

  // Add any categories not in the predefined order
  for (const [cat, skills] of categoryMap) {
    if (!categoryOrder.includes(cat)) {
      skills.sort((a, b) => a.name.localeCompare(b.name))
      result.push({ category: cat, skills })
    }
  }

  return result
}

function searchAllSkills(query: string): SkillMeta[] {
  const lowerQuery = query.toLowerCase()
  const results: SkillMeta[] = []

  if (!fs.existsSync(SKILLS_DIR)) return results

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const skillDir = path.join(SKILLS_DIR, entry.name)
    const meta = parseSkillMeta(skillDir)
    if (!meta) continue

    if (
      meta.name.toLowerCase().includes(lowerQuery) ||
      meta.description.toLowerCase().includes(lowerQuery)
    ) {
      results.push(meta)
    }
  }

  results.sort((a, b) => a.name.localeCompare(b.name))
  return results
}

// ─── Tool Export ─────────────────────────────────────────────────────────

export default tool({
  description: "Browse and search skills grouped by functional category (Init, Ideation, Orchestrate, Harvest, Project, UX/Design, External, Meta, QA/Verify, Docs). Reads SKILL.md frontmatter from all skill directories, categorizes using authoritative AGENTS.md data plus keyword heuristics.",
  args: {
    action: tool.schema.string().describe(
      "Action: 'list-categories' shows all skills grouped by category, 'search' searches across all skills by name or description"
    ),
    query: tool.schema.string().optional().describe(
      "Search query for 'search' action — matches against skill name and description"
    ),
  },
  async execute(args) {
    if (args.action === 'list-categories') {
      const categories = getAllCategorizedSkills()
      return JSON.stringify({ categories, totalSkills: categories.reduce((sum, c) => sum + c.skills.length, 0) }, null, 2)
    }

    if (args.action === 'search') {
      if (!args.query) {
        return JSON.stringify({ error: "Query required for 'search' action" })
      }
      const results = searchAllSkills(args.query)
      return JSON.stringify({ query: args.query, results, count: results.length }, null, 2)
    }

    return JSON.stringify({ error: `Invalid action '${args.action}'. Valid: list-categories, search` })
  },
})
