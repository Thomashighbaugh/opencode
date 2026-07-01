import { HubSubcommand } from "../../hub-data"
import plan from "./plan"
import brainstorm from "./brainstorm"
import decomposition from "./decomposition"
import refine from "./refine"
import overhaul from "./overhaul"
import deep from "./deep"
import graph from "./graph"
import research from "./research"
import ralplan from "./ralplan"
import ddd from "./ddd"
import eventStorming from "./event-storming"
import doubleDiamond from "./double-diamond"
import jtbd from "./jtbd"
import impactMapping from "./impact-mapping"
import spiral from "./spiral"
import topDown from "./top-down"
import bottomUp from "./bottom-up"
import adversarialDebate from "./adversarial-debate"
import cleanroom from "./cleanroom"
import pwf from "./pwf"
import rpikit from "./rpikit"
import hive from "./hive"
import storyMapping from "./story-mapping"
import leanCanvas from "./lean-canvas"
import constitution from "./constitution"
import quality from "./quality"
import architecture from "./architecture"
import redesign from "./redesign"
import grill from "./grill"
import modularity from "./modularity"
import archPrep from "./arch-prep"
import webResearch from "./web-research"
import techEval from "./tech-eval"
import competitiveAnalysis from "./competitive-analysis"
import treeOfThoughts from "./tree-of-thoughts"
import opro from "./opro"
import resume from "./resume"
import status from "./status"

export const specs = [
  plan, brainstorm, decomposition, refine, overhaul, deep, graph, research,
  ralplan, ddd, eventStorming, doubleDiamond, jtbd, impactMapping, spiral,
  topDown, bottomUp, adversarialDebate, cleanroom, pwf, rpikit, hive,
  storyMapping, leanCanvas, constitution, quality, architecture, redesign,
  grill, modularity, archPrep, webResearch, techEval, competitiveAnalysis,
  treeOfThoughts, opro, resume, status
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))