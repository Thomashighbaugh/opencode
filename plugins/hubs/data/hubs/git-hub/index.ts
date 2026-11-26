import { HubSubcommand } from "../../hub-data"
import s0 from "./archive"
import s1 from "./changelog"
import s2 from "./commit-drafter"
import s3 from "./commit"
import s4 from "./gh"
import s5 from "./git-cleanup"
import s6 from "./git-master"
import s7 from "./git-stage-thread"
import s8 from "./pr"
import s9 from "./release"

export const specs = [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
