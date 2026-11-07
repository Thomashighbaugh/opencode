import { HubSubcommand } from "../../hub-data"
import configOrchestrator from "./config-orchestrator"
import promptSimplifier from "./prompt-simplifier"
import knowledgeGraph from "./knowledge-graph"
import graph from "./graph"
import create from "./create"
import add from "./add"
import edit from "./edit"
import info from "./info"
import list from "./list"
import remove from "./remove"
import scan from "./scan"
import search from "./search"
import validate from "./validate"
import packageSpec from "./package"
import sync from "./sync"
import setup from "./setup"
import update from "./update"
import find from "./find"

export const specs = [
  configOrchestrator, promptSimplifier, create, add, edit, info, list, remove,
  scan, search, validate, packageSpec, sync, setup, update, find, knowledgeGraph, graph
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
