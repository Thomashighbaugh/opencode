import { HubSubcommand } from "../../hub-data"
import converge from "./converge"
import insights from "./insights"
import organize from "./organize"
import purge from "./purge"
import retrospect from "./retrospect"
import sandbox from "./sandbox"
import selfImprove from "./self-improve"
import workspace from "./workspace"
import sweep from "./sweep"

export const specs = [
  converge, insights, organize, purge, retrospect, sandbox, selfImprove, workspace, sweep
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
