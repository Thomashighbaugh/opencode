import { HubSubcommand } from "../../hub-data"
import ralph from "./ralph"
import team from "./team"
import deep from "./deep"
import ccg from "./ccg"
import ultrawork from "./ultrawork"
import autopilot from "./autopilot"
import sciomc from "./sciomc"
import swarm from "./swarm"
import stateMachine from "./state-machine"
import consensus from "./consensus"
import evolutionary from "./evolutionary"
import specDriven from "./spec-driven"
import react from "./react"
import planExecute from "./plan-execute"
import hive from "./hive"
import tdd from "./tdd"
import pair from "./pair"
import pipeline from "./pipeline"
import gsd from "./gsd"
import selfAssess from "./self-assess"
import remediate from "./remediate"
import devin from "./devin"
import maestro from "./maestro"
import metaswarm from "./metaswarm"
import cc10x from "./cc10x"
import gastown from "./gastown"
import ruflo from "./ruflo"
import harden from "./harden"
import subagentDriven from "./subagent-driven"
import brownfield from "./brownfield"
import vibeCode from "./vibe-code"
import resume from "./resume"
import status from "./status"

// All specs — full detail available via loadSubcommandSpec()
export const specs = [
  ralph, team, deep, ccg, ultrawork, autopilot, sciomc, swarm,
  stateMachine, consensus, evolutionary, specDriven, react, planExecute,
  hive, tdd, pair, pipeline, gsd, selfAssess, remediate, devin,
  maestro, metaswarm, cc10x, gastown, ruflo, harden, subagentDriven,
  brownfield, vibeCode, resume, status
]

// Identity slice only — used by the thin hub manifest for menu/routing views
export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))