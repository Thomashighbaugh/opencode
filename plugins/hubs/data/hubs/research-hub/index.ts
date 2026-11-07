import { HubSubcommand } from "../../hub-data"
import conventionExtractor from "./convention-extractor"
import analyst from "./analyst"
import analyzePatterns from "./analyze-patterns"
import competitiveAnalysis from "./competitive-analysis"
import research from "./research"
import techEval from "./tech-eval"
import webResearch from "./web-research"
import scientist from "./scientist"
import libraryDocs from "./library-docs"
import documentSpecialist from "./document-specialist"
import explore from "./explore"
import compare from "./compare"
import extractStandards from "./extract-standards"
import sciomc from "./sciomc"
import deepResearch from "./deep-research"

export const specs = [
  conventionExtractor, analyst, analyzePatterns, competitiveAnalysis, research, techEval, webResearch,
  scientist, libraryDocs, documentSpecialist, explore, compare, extractStandards, sciomc, deepResearch
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
