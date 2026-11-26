import { HubSubcommand } from "../../hub-data"
import s0 from "./arch-prep"
import s1 from "./architecture"
import s2 from "./brownfield"
import s3 from "./cleanup"
import s4 from "./executor"
import s5 from "./modernize"
import s6 from "./modularity"
import s7 from "./optimize"
import s8 from "./overhaul"
import s9 from "./pipeline"
import s10 from "./refactor"
import s11 from "./simplify"
import s12 from "./vibe-code"

export const specs = [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
