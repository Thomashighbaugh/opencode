import { HubSubcommand } from "../../hub-data"
import tests from "./tests"
import commit from "./commit"
import stage from "./stage"
import pr from "./pr"
import gh from "./gh"
import optimize from "./optimize"
import refactor from "./refactor"
import simplify from "./simplify"
import cleanup from "./cleanup"
import modernize from "./modernize"
import icon from "./icon"
import organize from "./organize"
import analyze from "./analyze"
import changelog from "./changelog"
import converge from "./converge"
import scan from "./scan"
import sandbox from "./sandbox"
import retrospect from "./retrospect"
import purge from "./purge"
import release from "./release"
import review from "./review"
import audit from "./audit"
import archive from "./archive"
import gitCleanup from "./git-cleanup"
import workspace from "./workspace"
import readme from "./readme"

export const specs = [
  tests, commit, stage, pr, gh, optimize, refactor, simplify, cleanup,
  modernize, icon, organize, analyze, changelog, converge, scan, sandbox,
  retrospect, purge, release, review, audit, archive, gitCleanup, workspace, readme
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))