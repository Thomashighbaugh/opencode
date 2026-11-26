import { HubSubcommand } from "../../hub-data"
import s0 from "./antislop-audit"
import s1 from "./audit"
import s2 from "./code-review"
import s3 from "./converge"
import s4 from "./create-tests"
import s5 from "./critic"
import s6 from "./debugger"
import s7 from "./deep-bug-hunt"
import s8 from "./insights"
import s9 from "./organize"
import s10 from "./purge"
import s11 from "./qa-tester"
import s12 from "./retrospect"
import s13 from "./review"
import s14 from "./sandbox"
import s15 from "./sec-scan"
import s16 from "./security-reviewer"
import s17 from "./self-improve"
import s18 from "./sweep"
import s19 from "./tdd"
import s20 from "./test-engineer"
import s21 from "./tracer"
import s22 from "./workspace"

export const specs = [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18, s19, s20, s21, s22]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
