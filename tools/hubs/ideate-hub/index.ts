import { HubSubcommand } from "../../hub-data"
import adversarialDebate from "./adversarial-debate"
import brainstorm from "./brainstorm"
import cleanroom from "./cleanroom"
import ddd from "./ddd"
import interview from "./interview"
import deepDive from "./deep-dive"
import deepThinker from "./deep-thinker"
import doubleDiamond from "./double-diamond"
import eventStorming from "./event-storming"
import grill from "./grill"
import opro from "./opro"
import pwf from "./pwf"
import refine from "./refine"
import rpikit from "./rpikit"
import spark from "./spark"
import treeOfThoughts from "./tree-of-thoughts"

export const specs = [
  adversarialDebate, brainstorm, cleanroom, ddd, interview, deepDive, deepThinker, doubleDiamond,
  eventStorming, grill, opro, pwf, refine, rpikit, spark, treeOfThoughts
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
