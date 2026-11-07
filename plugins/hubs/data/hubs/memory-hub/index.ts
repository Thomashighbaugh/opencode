import { HubSubcommand } from "../../hub-data"
import capture from "./capture"
import compress from "./compress"
import consume from "./consume"
import context from "./context"
import diff from "./diff"
import exportSpec from "./export"
import memory from "./memory"
import prune from "./prune"
import search from "./search"
import secondbrain from "./secondbrain"
import session from "./session"
import consolidateTelemetry from "./consolidate-telemetry"
import vectorize from "./vectorize"

export const specs = [
  capture, compress, consume, context, diff, exportSpec, memory, prune, search, secondbrain,
  session, consolidateTelemetry, vectorize
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
