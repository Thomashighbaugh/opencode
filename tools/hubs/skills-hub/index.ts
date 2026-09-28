import { HubSubcommand } from "../../hub-data"
import add from "./add"
import create from "./create"
import edit from "./edit"
import info from "./info"
import list from "./list"
import packageSpec from "./package"
import remove from "./remove"
import scan from "./scan"
import search from "./search"
import setup from "./setup"
import sync from "./sync"
import update from "./update"
import validate from "./validate"

export const specs = [
  add, create, edit, info, list, packageSpec, remove, scan,
  search, setup, sync, update, validate
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
