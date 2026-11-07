import { HubSubcommand } from "../../hub-data"
import hivePlan from "./hive-plan"
import cc10x from "./cc10x"
import devin from "./devin"
import gastown from "./gastown"
import gsd from "./gsd"
import harden from "./harden"
import hive from "./hive"
import maestro from "./maestro"
import metaswarm from "./metaswarm"
import pair from "./pair"
import react from "./react"
import remediate from "./remediate"
import ruflo from "./ruflo"
import selfAssess from "./self-assess"
import specDriven from "./spec-driven"
import subagentDriven from "./subagent-driven"
import delegate from "./delegate"

export const specs = [
  hivePlan, cc10x, devin, gastown, gsd, harden, hive, maestro,
  metaswarm, pair, react, remediate, ruflo, selfAssess, specDriven, subagentDriven,
  delegate
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
