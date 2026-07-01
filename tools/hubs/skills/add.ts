import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "add",
  description: "Interactive wizard for quick skill creation — prompts for name, description, triggers, scope (user or project), writes SKILL.md with frontmatter",
  reminder: "Quick-add a skill via interactive wizard.",
  inline: true,

  detailedDescription: `Quick-add wizard for skill creation. Prompts for:

- Skill name (kebab-case).
- Description (one line — what it does).
- Triggers (when should it activate?).
- Scope: user (~/.config/opencode/skills/omc-learned/) or project (.opencode/state/skills/).

Writes a minimal SKILL.md with YAML frontmatter. This is the fast path — for full skill creation with scripts, references, and validation, use /skills create instead.

Use when you have a simple skill to add quickly without the full creation workflow.`,

  tools: ["bash"],
  relatedSkills: ["skill-creator"],
}

export default spec