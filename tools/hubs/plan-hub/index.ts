import { HubSubcommand } from "../../hub-data"
import bottomUp from "./bottom-up"
import constitution from "./constitution"
import decomposition from "./decomposition"
import impactMapping from "./impact-mapping"
import improvements from "./improvements"
import jtbd from "./jtbd"
import leanCanvas from "./lean-canvas"
import plan from "./plan"
import ralplan from "./ralplan"
import requirementsAnalyzer from "./requirements-analyzer"
import spiral from "./spiral"
import status from "./status"
import storyMapping from "./story-mapping"
import topDown from "./top-down"
import planExecute from "./plan-execute"
import effortEstimator from "./effort-estimator"

export const specs = [
  bottomUp, constitution, decomposition, impactMapping, improvements, jtbd, leanCanvas, plan,
  ralplan, requirementsAnalyzer, spiral, status, storyMapping, topDown, planExecute, effortEstimator
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
