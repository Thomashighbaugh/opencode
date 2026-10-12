import { HubSubcommand } from "../../hub-data"
import docs from "./docs"
import redesign from "./redesign"
import designer from "./designer"
import frontendDesign from "./frontend-design"
import readme from "./readme"
import writer from "./writer"
import icon from "./icon"

export const specs = [
  docs, redesign, designer, frontendDesign, readme, writer, icon
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
