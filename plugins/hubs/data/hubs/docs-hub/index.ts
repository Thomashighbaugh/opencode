import { HubSubcommand } from "../../hub-data"
import docs from "./docs"
import readme from "./readme"
import writer from "./writer"
import agentsMd from "./agents-md"

export const specs = [
  docs, readme, writer, agentsMd
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
