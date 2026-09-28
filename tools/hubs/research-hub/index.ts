import { HubSubcommand } from "../../hub-data"
import conventionExtractor from "./convention-extractor"
import analyst from "./analyst"
import analyzePatterns from "./analyze-patterns"
import competitiveAnalysis from "./competitive-analysis"
import graph from "./graph"
import research from "./research"
import techEval from "./tech-eval"
import webResearch from "./web-research"
import scientist from "./scientist"
import tracer from "./tracer"
import libraryDocs from "./library-docs"
import documentSpecialist from "./document-specialist"
import explore from "./explore"

export const specs = [
  conventionExtractor, analyst, analyzePatterns, competitiveAnalysis, graph, research, techEval, webResearch,
  scientist, tracer, libraryDocs, documentSpecialist, explore
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
