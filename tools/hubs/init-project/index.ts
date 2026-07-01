import { HubSubcommand } from "../../hub-data"
import setup from "./setup"
import detect from "./detect"
import recommend from "./recommend"
import docs from "./docs"
import context from "./context"
import verify from "./verify"
import refresh from "./refresh"
import status from "./status"
import mapCodebase from "./map-codebase"
import doctor from "./doctor"
import reset from "./reset"
import provision from "./provision"
import tag from "./tag"
import findSkills from "./find-skills"
import findAgents from "./find-agents"
import findTools from "./find-tools"
import findRules from "./find-rules"

export const specs = [
  setup, detect, recommend, docs, context, verify, refresh, status,
  mapCodebase, doctor, reset, provision, tag, findSkills, findAgents,
  findTools, findRules
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))