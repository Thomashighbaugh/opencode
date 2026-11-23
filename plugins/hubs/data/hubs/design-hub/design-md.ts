import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "design-md",
  description: "Create a DESIGN.md describing the front end / interface of a project",
  reminder: "Writes DESIGN.md from project context: page type, site kind, visual direction, brand, tone.",
  inline: true,

  detailedDescription: `Creates DESIGN.md — the design brief file that the taste-skill gate reads when present. It describes the front end or interface of the project so agents and the gate know what visual standard to aim for.

The DESIGN.md contains:

- **Page type & site kind** — software / gaming / tech / product / service / place, derived from what the project sells
- **Category** — what is sold (e.g. "SaaS dashboard", "coffee shop", "game studio", "AI developer tool")
- **Primary action** — the main user action on the page (e.g. "sign up", "order", "book", "download")
- **Visual direction** — tone (quiet / bold / playful / technical), color strategy, typography approach, photography stance
- **Brand** — name, real icon reference if any, edge treatment, hover micro-interaction stance
- **Constraints** — no shader scenes on non-tech pages, real photographs over illustration, equal left/right content edges, hero enters on load, one dealt moment per page

When DESIGN.md exists, /design-hub taste reads it automatically to set --kind, --category, and --primary for the gate. DESIGN.md is optional — the taste gate runs without it — but having it makes the gate's checks targeted instead of generic.

## Examples

| Input | Approach |
|-------|----------|
| /design-hub design-md | Interviews briefly, writes DESIGN.md in the project root |
| /design-hub design-md --path docs/DESIGN.md | Writes DESIGN.md to a specific path |

## Warnings

- DESIGN.md is a design brief, not a spec. It describes intent, not implementation.
- The taste gate reads page-type / site-kind metas from HTML pages; DESIGN.md supplies the same intent when no page yet exists.

`,
  tools: ["read", "write", "edit", "bash"],
  rules: ["file-operations", "writing-style"],
  relatedSkills: ["taste-skill"],
}

export default spec
