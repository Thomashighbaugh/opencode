import { HubSubcommand } from "../../hub-data"
import s0 from "./agents-md"
import s1 from "./capture"
import s2 from "./compress"
import s3 from "./consolidate-telemetry"
import s4 from "./consume"
import s5 from "./context"
import s6 from "./diff"
import s7 from "./docs"
import s8 from "./export"
import s9 from "./graph"
import s10 from "./memory"
import s11 from "./prune"
import s12 from "./readme"
import s13 from "./search-context"
import s14 from "./secondbrain"
import s15 from "./session"
import s16 from "./vectorize"
import s17 from "./writer"
import s18 from "./yt-transcript"

export const specs = [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
