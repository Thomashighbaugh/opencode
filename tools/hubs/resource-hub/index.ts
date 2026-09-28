import { HubSubcommand } from "../../hub-data"
import configOrchestrator from "./config-orchestrator"
import findAgents from "./find-agents"
import findRules from "./find-rules"
import findSkills from "./find-skills"
import findTools from "./find-tools"
import effortEstimator from "./effort-estimator"
import promptSimplifier from "./prompt-simplifier"
import agent from "./agent"
import command from "./command"
import rule from "./rule"
import skill from "./skill"
import knowledgeGraph from "./knowledge-graph"

export const specs = [
  configOrchestrator, findAgents, findRules, findSkills, findTools, effortEstimator, promptSimplifier, agent,
  command, rule, skill, knowledgeGraph
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
