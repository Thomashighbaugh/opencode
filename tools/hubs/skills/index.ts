import { HubSubcommand } from "../../hub-data"
import list from "./list"
import add from "./add"
import create from "./create"
import remove from "./remove"
import edit from "./edit"
import search from "./search"
import info from "./info"
import update from "./update"
import pkg from "./package"
import validate from "./validate"
import sync from "./sync"
import setup from "./setup"
import scan from "./scan"

export const specs = [
  list, add, create, remove, edit, search, info, update, pkg, validate, sync, setup, scan
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))