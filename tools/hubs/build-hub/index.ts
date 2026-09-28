import { HubSubcommand } from "../../hub-data"
import overhaul from "./overhaul"
import brownfield from "./brownfield"
import pipeline from "./pipeline"
import vibeCode from "./vibe-code"
import cleanup from "./cleanup"
import executor from "./executor"
import extractStandards from "./extract-standards"
import modernize from "./modernize"
import optimize from "./optimize"
import refactor from "./refactor"
import simplify from "./simplify"
import simplifyCode from "./simplify-code"

export const specs = [
  overhaul, brownfield, pipeline, vibeCode, cleanup, executor, extractStandards, modernize,
  optimize, refactor, simplify, simplifyCode
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
