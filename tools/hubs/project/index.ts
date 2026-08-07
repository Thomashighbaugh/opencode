import { HubSubcommand } from "../../hub-data"
import createTests from "./create-tests"
import codeReview from "./code-review"
import ponytailReview from "./pt-review"
import ponytailAudit from "./pt-audit"
import ponytailDebt from "./pt-debt"
import ponytailGain from "./pt-gain"
import commit from "./commit"
import gitStageThread from "./git-stage-thread"
import pr from "./pr"
import gh from "./gh"
import optimize from "./optimize"
import refactor from "./refactor"
import simplify from "./simplify"
import cleanup from "./cleanup"
import modernize from "./modernize"
import icon from "./icon"
import organize from "./organize"
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
import consolidateTelemetry from "./consolidate-telemetry"
import extractStandards from "./extract-standards"
import simplifyCode from "./simplify-code"

export const specs = [
  codeReview, ponytailReview, ponytailAudit, ponytailDebt, ponytailGain,
  createTests, commit, gitStageThread, pr, gh, optimize, refactor, simplify, cleanup,
  modernize, icon, organize, changelog, converge, scan, sandbox,
  retrospect, purge, release, review, audit, archive, gitCleanup, workspace, readme,
  consolidateTelemetry, extractStandards, simplifyCode
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
