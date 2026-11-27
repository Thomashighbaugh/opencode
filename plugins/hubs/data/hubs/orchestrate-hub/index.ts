import { HubSubcommand } from "../../hub-data"
import s0 from "./autopilot"
import s1 from "./cc10x"
import s2 from "./ccg"
import s3 from "./consensus"
import s4 from "./delegate"
import s5 from "./devin"
import s6 from "./evolutionary"
import s7 from "./gastown"
import s8 from "./gsd"
import s9 from "./harden"
import s10 from "./hive-plan"
import s11 from "./hive"
import s12 from "./journal"
import s13 from "./maestro"
import s14 from "./metaswarm"
import s15 from "./pair"
import s16 from "./ralph"
import s17 from "./react"
import s18 from "./remediate"
import s19 from "./resume-orchestration"
import s20 from "./ruflo"
import s21 from "./run-status"
import s22 from "./self-assess"
import s23 from "./spec-driven"
import s24 from "./state-machine"
import s25 from "./subagent-driven"
import s26 from "./swarm"
import s27 from "./team"
import s28 from "./ultrawork"

export const specs = [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18, s19, s20, s21, s22, s23, s24, s25, s26, s27, s28]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
