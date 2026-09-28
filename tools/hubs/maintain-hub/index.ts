import { HubSubcommand } from "../../hub-data"
import consolidateTelemetry from "./consolidate-telemetry"
import converge from "./converge"
import icon from "./icon"
import insights from "./insights"
import organize from "./organize"
import purge from "./purge"
import retrospect from "./retrospect"
import sandbox from "./sandbox"
import scan from "./scan"
import selfImprove from "./self-improve"
import vectorize from "./vectorize"
import workspace from "./workspace"

export const specs = [
  consolidateTelemetry, converge, icon, insights, organize, purge, retrospect, sandbox,
  scan, selfImprove, vectorize, workspace
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
