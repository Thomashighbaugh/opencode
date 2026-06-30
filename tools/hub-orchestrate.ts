import { HubDefinition } from "./hub-data"

const hub: HubDefinition = {
  name: "orchestrate",
  description: "Execution hub — pick an orchestration pattern, load a plan, and build",
  stateDir: "orchestration",
  subcommands: [
    { label: "ralph", description: "Persistent loop — keeps working until task is verified complete", skill: "ralph", reminder: "Persistent loop until verified complete." },
    { label: "team", description: "N coordinated agents with shared task list and real-time messaging", skill: "team", reminder: "N coordinated agents on shared tasks." },
    { label: "deep", description: "2-stage: causal trace → deep interview to crystallize requirements", skill: "deep-dive", reminder: "Trace root cause, then crystallize requirements." },
    { label: "ccg", description: "Multi-model synthesis — query diverse models, merge perspectives", skill: "ccg", reminder: "Synthesize multiple model perspectives." },
    { label: "ultrawork", description: "Maximum parallel execution for high-throughput tasks", skill: "ultrawork", reminder: "Execute all independent tasks in parallel." },
    { label: "autopilot", description: "Full autonomous execution from idea to working code", skill: "autopilot", reminder: "From idea to working code autonomously." },
    { label: "sciomc", description: "Parallel scientist agents for comprehensive analysis", skill: "sciomc", reminder: "Parallel scientist agents for analysis." },
    { label: "swarm", description: "Architect-led team of 11 specialized agents with gated QA pipeline", skill: "swarm", reminder: "Architect-led swarm with gated QA." },
    { label: "state-machine", description: "State-machine orchestration — agents as states with explicit transitions and guards", inline: true, reminder: "Model workflow as state machine." },
    { label: "consensus", description: "Multi-agent consensus/voting — run agents independently, resolve via majority, weighting, or synthesis", inline: true, reminder: "Multi-agent consensus and voting." },
    { label: "evolutionary", description: "Evolutionary delivery — incremental builds with fitness validation at each generation", inline: true, reminder: "Incremental builds with fitness validation." },
    { label: "spec-driven", description: "Spec-first development — formalize spec, validate it, then implement against it", inline: true, reminder: "Spec-first: formalize, validate, implement." },
    { label: "react", description: "ReAct pattern — interleaved Reasoning and Acting: think → act → observe → reason → repeat until goal met", inline: true, reminder: "ReAct loop: think, act, observe, repeat." },
    { label: "plan-execute", description: "Classic plan-then-execute — architect builds complete plan, executor implements step by step", inline: true, reminder: "Plan first, then execute step by step." },
    { label: "hive", description: "Agent Hive execution — Swarm Bee phase: batched parallelism with worktree isolation, best-effort worker verification, blocked worker protocol, orchestrator batch testing", skill: "hive-methodology", reminder: "Swarm Bee: batched parallel execution." },
    { label: "tdd", description: "Test-driven development loop — red-green-refactor: write failing test, make it pass, refactor, repeat until all features covered", inline: true, reminder: "Red-green-refactor TDD loop." },
    { label: "pair", description: "Pair programming — two agents on one task: Driver writes code, Navigator reviews in real-time, catching mistakes early", inline: true, reminder: "Driver/Navigator pair programming." },
    { label: "pipeline", description: "Declarative multi-stage pipeline — Stage 1: lint → Stage 2: test → Stage 3: build → Stage 4: deploy, each stage gates the next", inline: true, reminder: "Multi-stage pipeline with hard gates." },
    { label: "gsd", description: "Get Shit Done pipeline — discuss → plan → execute → verify → ship with wave-based parallel execution, fresh context per task, and atomic commits", inline: true, reminder: "Discuss→plan→execute→verify→ship pipeline." },
    { label: "self-assess", description: "Iterative self-evaluation — agent executes, critically evaluates against quality thresholds, reflects and refines until targets met", skill: "self-improve", reminder: "Self-evaluate and iterate until quality met." },
    { label: "remediate", description: "CI/build failure auto-remediation — monitor failures, analyze root causes, auto-apply fixes, re-run until green", inline: true, reminder: "Auto-remediate build failures until green." },
    { label: "devin", description: "Autonomous Plan→Code→Debug→Deploy pipeline with iterative debugging cycles and root-cause analysis loops", inline: true, reminder: "Plan→Code→Debug→Deploy pipeline." },
    { label: "maestro", description: "Strict role separation — PMs gather requirements, Architects design/review (never code), Coders implement/test (never self-review)", inline: true, reminder: "Strict role separation factory." },
    { label: "metaswarm", description: "Autonomous issue-to-PR with 12 agents, 7 phases, adversarial reviews with fresh reviewers to block anchoring bias", inline: true, reminder: "12-agent autonomous issue-to-PR pipeline." },
    { label: "cc10x", description: "Intent-detecting router → dispatches to BUILD/DEBUG/REVIEW/PLAN workflows with evidence-first validation and confidence gating", inline: true, reminder: "Intent-detecting workflow router." },
    { label: "gastown", description: "GUPP principle — 'if work on your hook, YOU MUST RUN IT' with git-backed work units and NDI for reliable outcomes from unreliable processes", inline: true, reminder: "Git-backed work units with GUPP principle." },
    { label: "ruflo", description: "60+ agent swarm with Q-Learning smart routing, 4 consensus protocols, and Queen/Worker hierarchical topologies", inline: true, reminder: "60+ agent swarm with Q-Learning." },
    { label: "harden", description: "Composable robustness — safeTask (error+deviation tracking), circuitBreaker (halt on failure rate), verificationGate (block downstream until verified)", inline: true, reminder: "Wrap workflow with robustness composables." },
    { label: "subagent-driven", description: "Execute implementation plans via fresh subagent per task with automated review gates — spec compliance + code quality after each task, broad final review. Includes hub-to-hub handoff protocol for bridging ideation→orchestration→harvest-context", skill: "subagent-driven-development", reminder: "Dispatch subagents per task with automated review gates." },
    { label: "brownfield", description: "Feature addition to existing codebase — analyze system, identify integration points, validate strategy before implementation", inline: true, reminder: "Analyze and integrate into existing codebase." },
    { label: "vibe-code", description: "Conversational rapid prototyping — describe app in natural language, generate full-stack, iterate with feedback through conversational rounds", inline: true, reminder: "Conversational rapid prototyping." },
    { label: "resume", description: "Resume last orchestration session", inline: true, reminder: "Resume last orchestration session." },
    { label: "status", description: "Show current orchestration state", inline: true, reminder: "Show orchestration state." }
  ]
}

export default hub
