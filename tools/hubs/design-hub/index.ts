import { HubSubcommand } from "../../hub-data"
import docs from "./docs"
import archPrep from "./arch-prep"
import architecture from "./architecture"
import modularity from "./modularity"
import redesign from "./redesign"
import designer from "./designer"
import frontendDesign from "./frontend-design"
import readme from "./readme"
import writer from "./writer"

export const specs = [
  docs, archPrep, architecture, modularity, redesign, designer, frontendDesign, readme,
  writer
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
