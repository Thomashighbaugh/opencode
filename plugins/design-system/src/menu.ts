/**
 * design-system menu — hub-like menu, self-contained within this plugin,
 * detached from the hubs plugin. All subcommands are hidden behind one
 * command (/design-system) and presented as a selectable menu.
 *
 * Subcommands (no `impeccable-` prefix — the prefix is stripped here):
 *
 * Steer (impeccable build commands):
 *   shape      — Plan UX/UI before writing code
 *   init       — Capture durable product context in PRODUCT.md
 *   document   — Generate DESIGN.md from existing project code
 *   extract    — Pull reusable tokens/components into design system
 *
 * Evaluate (impeccable review commands):
 *   critique   — Scored UX design review
 *   audit      — Technical quality report (a11y, perf, responsive)
 *
 * Refine (impeccable refinement commands):
 *   polish     — Final quality pass before shipping
 *   bolder     — Amplify safe or bland designs
 *   quieter    — Tone down loud designs
 *   distill    — Strip to essence, remove complexity
 *   harden     — Production-ready: errors, i18n, edge cases
 *   onboard    — Design first-run flows, empty states
 *
 * Enhance (impeccable enhancement commands):
 *   animate    — Add purposeful animations and motion
 *   colorize   — Add strategic color to monochromatic UIs
 *   typeset    — Improve typography hierarchy and fonts
 *   layout     — Fix spacing, rhythm, visual hierarchy
 *   delight    — Add personality and memorable touches
 *   overdrive  — Push past conventional limits (shaders/effects)
 *
 * Fix (impeccable fix commands):
 *   clarify    — Improve UX copy, labels, error messages
 *   adapt      — Adapt for different devices and screen sizes
 *   optimize   — Diagnose and fix UI performance
 *
 * Iterate (impeccable live commands):
 *   live       — Visual variant mode in the browser
 *   generate   — Generate variants of a named element
 *
 * Build (impeccable deprecated alias):
 *   craft      — Ordinary new-work build request (deprecated alias)
 *
 * Taste (anti-slop frontend skill):
 *   taste      — Run tasteskill finish gate checks
 *   design-md  — Create DESIGN.md describing the front end
 *
 * Delegation (skill/agent targets):
 *   redesign   — Audit and upgrade UI to premium design standards (skill)
 *   icon       — Generate web/PWA/UE icon assets (skill)
 *   designer   — UI/UX designer-developer (@designer agent)
 *   frontend-design — Hand production frontend work (@frontend-design agent)
 *   writer     — Technical documentation writer (@writer agent)
 *
 * Docs (documentation commands):
 *   docs       — Generate hierarchical AGENTS.md documentation (skill)
 *   readme     — Rewrite README to match current codebase (skill)
 *   agents-md  — Update root AGENTS.md + one per directory (inline)
 */

export type MenuItem = {
  id: string
  label: string
  detail: string
  category: string
}

const IMPECCABLE_CMDS = [
  "shape", "init", "document", "extract",
  "critique", "audit",
  "polish", "bolder", "quieter", "distill", "harden", "onboard",
  "animate", "colorize", "typeset", "layout", "delight", "overdrive",
  "clarify", "adapt", "optimize",
  "live", "generate",
  "craft",
] as const

const DESIGN_SYSTEM_MENU_ITEMS: MenuItem[] = [
  // Steer
  { id: "shape", label: "Shape", detail: "Plan UX/UI before writing code (impeccable)", category: "Steer" },
  { id: "init", label: "Init", detail: "Capture product + design context (DESIGN.md primary) (impeccable)", category: "Steer" },
  { id: "document", label: "Document", detail: "Generate DESIGN.md from existing code (impeccable)", category: "Steer" },
  { id: "extract", label: "Extract", detail: "Pull tokens/components into design system (impeccable)", category: "Steer" },

  // Evaluate
  { id: "critique", label: "Critique", detail: "Scored UX design review (impeccable)", category: "Evaluate" },
  { id: "audit", label: "Audit", detail: "Technical quality report: a11y, perf, responsive (impeccable)", category: "Evaluate" },

  // Refine
  { id: "polish", label: "Polish", detail: "Final quality pass before shipping (impeccable)", category: "Refine" },
  { id: "bolder", label: "Bolder", detail: "Amplify safe or bland designs (impeccable)", category: "Refine" },
  { id: "quieter", label: "Quieter", detail: "Tone down loud designs (impeccable)", category: "Refine" },
  { id: "distill", label: "Distill", detail: "Strip to essence, remove complexity (impeccable)", category: "Refine" },
  { id: "harden", label: "Harden", detail: "Production-ready: errors, i18n, edge cases (impeccable)", category: "Refine" },
  { id: "onboard", label: "Onboard", detail: "Design first-run flows, empty states (impeccable)", category: "Refine" },

  // Enhance
  { id: "animate", label: "Animate", detail: "Add purposeful animations (impeccable)", category: "Enhance" },
  { id: "colorize", label: "Colorize", detail: "Add strategic color to monochrome UIs (impeccable)", category: "Enhance" },
  { id: "typeset", label: "Typeset", detail: "Improve typography hierarchy and fonts (impeccable)", category: "Enhance" },
  { id: "layout", label: "Layout", detail: "Fix spacing, rhythm, visual hierarchy (impeccable)", category: "Enhance" },
  { id: "delight", label: "Delight", detail: "Add personality, memorable touches (impeccable)", category: "Enhance" },
  { id: "overdrive", label: "Overdrive", detail: "Shaders, effects, scroll scenes (impeccable)", category: "Enhance" },

  // Fix
  { id: "clarify", label: "Clarify", detail: "Improve UX copy, labels, errors (impeccable)", category: "Fix" },
  { id: "adapt", label: "Adapt", detail: "Adapt for devices and screen sizes (impeccable)", category: "Fix" },
  { id: "optimize", label: "Optimize", detail: "Diagnose and fix UI performance (impeccable)", category: "Fix" },

  // Iterate
  { id: "live", label: "Live", detail: "Browser variant mode (impeccable)", category: "Iterate" },
  { id: "generate", label: "Generate", detail: "Generate element variants (impeccable)", category: "Iterate" },

  // Build
  { id: "craft", label: "Craft", detail: "Ordinary new-work build (impeccable, deprecated)", category: "Build" },

  // Taste
  { id: "taste", label: "Taste", detail: "Run tasteskill finish gate checks", category: "Taste" },
  { id: "design-md", label: "Design MD", detail: "Create DESIGN.md describing the front end", category: "Taste" },

  // Delegation
  { id: "redesign", label: "Redesign", detail: "Audit and upgrade UI to premium design standards (skill)", category: "Delegation" },
  { id: "icon", label: "Icon", detail: "Generate web/PWA/UE icon assets (skill)", category: "Delegation" },
  { id: "designer", label: "Designer", detail: "UI/UX designer-developer (@designer agent)", category: "Delegation" },
  { id: "frontend-design", label: "Frontend Design", detail: "Hand production frontend work (@frontend-design agent)", category: "Delegation" },

  // Docs commands live in knowledge-hub (part of hubs), not in design-system
]

export function isImpeccableCmd(id: string): id is (typeof IMPECCABLE_CMDS)[number] {
  return IMPECCABLE_CMDS.includes(id as any)
}

export function buildMenuItems(): MenuItem[] {
  return [...DESIGN_SYSTEM_MENU_ITEMS].sort((a, b) => {
    const catOrder: Record<string, number> = {
      Steer: 0, Evaluate: 1, Refine: 2, Enhance: 3, Fix: 4, Iterate: 5, Build: 6,
      Taste: 7, Delegation: 8,
    }
    const ca = catOrder[a.category] ?? 99
    const cb = catOrder[b.category] ?? 99
    if (ca !== cb) return ca - cb
    return a.label.localeCompare(b.label)
  })
}

export function formatMenu(items: MenuItem[]): string {
  const byCat = new Map<string, MenuItem[]>()
  for (const it of items) {
    const arr = byCat.get(it.category) ?? []
    arr.push(it)
    byCat.set(it.category, arr)
  }
  const lines: string[] = []
  for (const [cat, catItems] of byCat) {
    lines.push(`\n## ${cat}`)
    for (const it of catItems) {
      lines.push(`• ${it.label} - ${it.detail}`)
    }
  }
  return lines.join("\n")
}

/** Return a formatted full definition for a subcommand (the "expand" view). */
export function expandSubcommand(id: string): string | null {
  const item = DESIGN_SYSTEM_MENU_ITEMS.find((it) => it.id === id)
  if (!item) return null

  const action = actionFor(id)

  const lines: string[] = []
  lines.push(`${item.label} - ${id}`)
  lines.push("")
  lines.push(`Category: ${item.category}`)
  lines.push(`Description: ${item.detail}`)
  lines.push("")
  lines.push("## Action")
  lines.push(`Type: ${action.type}`)
  if (action.target) lines.push(`Target: ${action.target}`)
  if (action.skill) lines.push(`Skill: ${action.skill}`)
  if (action.agent) lines.push(`Agent: ${action.agent}`)
  if (action.command) lines.push(`Command: ${action.command}`)

  return lines.join("\n")
}

export function actionFor(id: string): {
  type: "impeccable" | "taste" | "skill" | "agent" | "inline"
  target?: string
  skill?: string
  agent?: string
  command?: string
} {
  // Taste subcommands
  if (id === "taste") {
    return { type: "taste", command: "gate" }
  }
  if (id === "design-md") {
    return { type: "inline", command: "design-md" }
  }

  // Impeccable subcommands (no prefix)
  if (isImpeccableCmd(id)) {
    return { type: "impeccable", target: id }
  }

  // Skill delegations
  if (id === "redesign") return { type: "skill", skill: "redesign-existing-projects" }
  if (id === "icon") return { type: "skill", skill: "icon-generator" }

  // Agent delegations
  if (id === "designer") return { type: "agent", agent: "@designer" }
  if (id === "frontend-design") return { type: "agent", agent: "@frontend-design" }

  // Inline
  return { type: "inline", command: id }
}
