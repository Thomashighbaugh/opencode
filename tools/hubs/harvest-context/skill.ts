import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "skill",
  description: "Create a reusable skill from session knowledge",
  reminder: "Extract a repeatable workflow as a skill.",
  skill: "skill-creator",

  detailedDescription: `Extracts a repeatable workflow from the current session and packages it as a reusable OpenCode skill. The skill-creator workflow:

1. Identify the repeatable pattern in the session (what did the agent do that could be reused?).
2. Define the skill: name, description, triggers (when should this skill activate?).
3. Write the skill content: workflow steps, heuristics, examples.
4. Bundle any scripts or references the skill needs.
5. Save to skills/{name}/SKILL.md with proper YAML frontmatter.

The new skill is immediately available for future sessions. Use when you notice the agent did something useful and repeatable — "extract this as a skill so it's available next time".`,

  tools: ["loadSkill", "bash"],
  relatedSkills: ["learner", "skillify"],
}

export default spec