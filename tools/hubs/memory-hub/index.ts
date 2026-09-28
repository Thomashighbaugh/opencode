import { HubSubcommand } from "../../hub-data"
import capture from "./capture"
import resume from "./resume"
import codebase from "./codebase"
import compare from "./compare"
import compress from "./compress"
import consume from "./consume"
import context from "./context"
import decompose from "./decompose"
import diff from "./diff"
import exportSpec from "./export"
import journal from "./journal"
import memory from "./memory"
import prune from "./prune"
import search from "./search"
import secondbrain from "./secondbrain"
import session from "./session"
import sweep from "./sweep"
import webResearch from "./web-research"

export const specs = [
  capture, resume, codebase, compare, compress, consume, context, decompose,
  diff, exportSpec, journal, memory, prune, search, secondbrain, session,
  sweep, webResearch
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
