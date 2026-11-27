import { HubSubcommand } from "../../hub-data"
import s0 from "./agents-md"
import s1 from "./capture"
import s2 from "./compact"
import s3 from "./compress"
import s4 from "./consolidate-telemetry"
import s5 from "./consume"
import s6 from "./context-audit"
import s7 from "./context"
import s8 from "./diff"
import s9 from "./docs"
import s10 from "./expand"
import s11 from "./export"
import s12 from "./graph"
import s13 from "./memory"
import s14 from "./prune"
import s15 from "./readme"
import s16 from "./recall"
import s17 from "./resume-memory-lean"
import s18 from "./resume-memory"
import s19 from "./secondbrain"
import s20 from "./session"
import s21 from "./vectorize"
import s22 from "./writer"
import s23 from "./yt-transcript"

export const specs = [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18, s19, s20, s21, s22, s23]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
