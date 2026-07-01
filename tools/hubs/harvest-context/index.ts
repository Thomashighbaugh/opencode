import { HubSubcommand } from "../../hub-data"
import session from "./session"
import codebase from "./codebase"
import skill from "./skill"
import agent from "./agent"
import rule from "./rule"
import command from "./command"
import memory from "./memory"
import docs from "./docs"
import webResearch from "./web-research"
import compare from "./compare"
import decompose from "./decompose"
import context from "./context"
import consume from "./consume"
import compress from "./compress"
import secondbrain from "./secondbrain"
import journal from "./journal"
import search from "./search"
import prune from "./prune"
import exportCtx from "./export"
import diff from "./diff"
import sweep from "./sweep"

export const specs = [
  session, codebase, skill, agent, rule, command, memory, docs,
  webResearch, compare, decompose, context, consume, compress,
  secondbrain, journal, search, prune, exportCtx, diff, sweep
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))