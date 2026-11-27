import { HubSubcommand } from "../../hub-data"
import s0 from "./runtime-doctor"
import s1 from "./runtime-flags"
import s2 from "./runtime-status"
import s3 from "./token-use-audit"
import s4 from "./token-use-coach"
import s5 from "./token-use-report"
import s6 from "./token-use-route"
import s7 from "./token-use-savings"

export const specs = [s0, s1, s2, s3, s4, s5, s6, s7]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
