import { HubSubcommand } from "../../hub-data"
import s0 from "./add"
import s1 from "./config-orchestrator"
import s2 from "./config"
import s3 from "./create"
import s4 from "./detect"
import s5 from "./doctor"
import s6 from "./edit"
import s7 from "./find-assets"
import s8 from "./find"
import s9 from "./info"
import s10 from "./init-resources"
import s11 from "./list"
import s12 from "./map-codebase"
import s13 from "./migrate-v2"
import s14 from "./package"
import s15 from "./prompt-simplifier"
import s16 from "./provision"
import s17 from "./recommend"
import s18 from "./refresh"
import s19 from "./remove"
import s20 from "./reset"
import s21 from "./scan"
import s22 from "./setup-status"
import s23 from "./setup"
import s24 from "./sync"
import s25 from "./tag"
import s26 from "./update"
import s27 from "./validate"
import s28 from "./verify"

export const specs = [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18, s19, s20, s21, s22, s23, s24, s25, s26, s27, s28]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
