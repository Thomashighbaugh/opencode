import { HubSubcommand } from "../../hub-data"
import autopilot from "./autopilot"
import ccg from "./ccg"
import consensus from "./consensus"
import evolutionary from "./evolutionary"
import ralph from "./ralph"
import resume from "./resume"
import sciomc from "./sciomc"
import stateMachine from "./state-machine"
import status from "./status"
import swarm from "./swarm"
import team from "./team"
import ultrawork from "./ultrawork"

export const specs = [
  autopilot, ccg, consensus, evolutionary, ralph, resume, sciomc, stateMachine,
  status, swarm, team, ultrawork
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
