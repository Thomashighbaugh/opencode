import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "scan",
  description: "Quick scan of skill directories — non-interactive inventory of both user and project scopes, reports counts and paths",
  reminder: "Quick inventory scan of all skill directories.",
  inline: true,

  detailedDescription: `Quick non-interactive inventory scan of skill directories. Reports:

- Built-in skills: count + path.
- User skills: count + path.
- Project skills: count + path.
- Plugin skill categories (if installed): counts per category.

No interaction — just a summary. Use for a quick overview of what's available without the full /skills list detail.`,

  tools: ["bash", "skill-categories"],
  relatedSkills: [],
}

export default spec