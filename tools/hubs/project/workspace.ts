import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "workspace",
  description: "Manage .opencode across projects — list Hubs-enabled projects, sync config, init .opencode in new directories, check health",
  reminder: "Manage Hubs workspace across projects.",
  inline: true,

  detailedDescription: `Manages Hubs across multiple projects. Operations:

- List: find all directories with .opencode/ and show their status.
- Sync: propagate global config updates to all projects.
- Init: set up .opencode/ in a new directory.
- Health: check all projects' config integrity.

Use when you work across multiple Hubs-enabled projects and need to manage them collectively.`,

  tools: ["bash"],
  relatedSkills: ["hubs-doctor"],
}

export default spec