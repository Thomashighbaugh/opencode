import { HubSubcommand } from "../../hub-data"
import archive from "./archive"
import changelog from "./changelog"
import commit from "./commit"
import commitDrafter from "./commit-drafter"
import gh from "./gh"
import gitCleanup from "./git-cleanup"
import gitMaster from "./git-master"
import gitStageThread from "./git-stage-thread"
import pr from "./pr"
import release from "./release"

export const specs = [
  archive, changelog, commit, commitDrafter, gh, gitCleanup, gitMaster, gitStageThread,
  pr, release
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
