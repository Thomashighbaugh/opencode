import { HubSubcommand } from "../../hub-data"
import config from "./config"
import detect from "./detect"
import doctor from "./doctor"
import mapCodebase from "./map-codebase"
import provision from "./provision"
import recommend from "./recommend"
import refresh from "./refresh"
import reset from "./reset"
import setup from "./setup"
import status from "./status"
import tag from "./tag"
import verify from "./verify"

export const specs = [
  config, detect, doctor, mapCodebase, provision, recommend, refresh, reset,
  setup, status, tag, verify
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
