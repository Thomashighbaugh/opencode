import { HubSubcommand } from "../../hub-data"
import critic from "./critic"
import securityReviewer from "./security-reviewer"
import tdd from "./tdd"
import audit from "./audit"
import codeReview from "./code-review"
import createTests from "./create-tests"
import debuggerSpec from "./debugger"
import deepBugHunt from "./deep-bug-hunt"
import qaTester from "./qa-tester"
import review from "./review"
import testEngineer from "./test-engineer"

export const specs = [
  critic, securityReviewer, tdd, audit, codeReview, createTests, debuggerSpec, deepBugHunt,
  qaTester, review, testEngineer
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
