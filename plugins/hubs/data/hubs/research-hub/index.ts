import { HubSubcommand } from "../../hub-data"
import s0 from "./analyst"
import s1 from "./analyze-patterns"
import s2 from "./compare"
import s3 from "./competitive-analysis"
import s4 from "./convention-extractor"
import s5 from "./deep-research"
import s6 from "./document-specialist"
import s7 from "./explore"
import s8 from "./extract-standards"
import s9 from "./library-docs"
import s10 from "./research"
import s11 from "./scientist"
import s12 from "./sciomc"
import s13 from "./tech-eval"
import s14 from "./web-research"

export const specs = [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
