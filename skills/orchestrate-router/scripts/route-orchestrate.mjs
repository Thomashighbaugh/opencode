#!/usr/bin/env node
/**
 * route-orchestrate.mjs — Orchestration Router
 *
 * Analyzes a user's natural language request and routes it to the best
 * /orchestrate subcommand. Uses intent classification across multiple
 * dimensions: task type, autonomy, complexity, confidence, scale, quality.
 *
 * Usage:
 *   node route-orchestrate.mjs "build me a login system"
 *   node route-orchestrate.mjs "fix this TypeScript error"
 *   node route-orchestrate.mjs "research authentication tradeoffs"
 */

// ─── Subcommand Profiles ──────────────────────────────────────────────────
// Each profile defines where this subcommand excels across routing dimensions.
// Dimensions are 0-1 normalized — higher = stronger fit.

const SUBCMDS = [
  {
    name: "ralph",
    label: "ralph",
    tagline: "Persistent loop — won't stop until verified",
    taskType:   { build: 0.9, fix: 0.8, refactor: 0.8, analyze: 0.2 },
    autonomy:   { guided: 0.3, periodic: 0.4, fireAndForget: 0.9 },
    complexity: { simple: 0.7, moderate: 0.9, complex: 0.6, multi: 0.3 },
    confidence: { clear: 0.9, vague: 0.7, bugReport: 0.8 },
    scale:      { solo: 0.9, smallTeam: 0.5, swarm: 0.1 },
    quality:    { draft: 0.5, production: 0.8, critical: 0.4 },
    time:       { asap: 0.8, balanced: 0.6, thorough: 0.3 },
    keywords: ["keep working", "don't stop", "persist", "until done", "loop", "fix all", "won't stop"],
    antiKeywords: ["research", "explore", "design", "plan", "think about"],
    description: "Best for: executing a clear task that needs persistence — keep fixing/improving until it's right. Good for multi-issue bug bashes, incremental feature building, any task where the agent should self-correct and keep going."
  },
  {
    name: "team",
    label: "team",
    tagline: "N coordinated agents on shared task list",
    taskType:   { build: 0.6, fix: 0.5, refactor: 0.5, analyze: 0.5 },
    autonomy:   { guided: 0.5, periodic: 0.7, fireAndForget: 0.4 },
    complexity: { simple: 0.3, moderate: 0.7, complex: 0.8, multi: 0.9 },
    confidence: { clear: 0.7, vague: 0.4, bugReport: 0.5 },
    scale:      { solo: 0.3, smallTeam: 0.9, swarm: 0.7 },
    quality:    { draft: 0.4, production: 0.7, critical: 0.6 },
    time:       { asap: 0.3, balanced: 0.7, thorough: 0.5 },
    keywords: ["parallel", "multiple agents", "team", "divide", "split work", "concurrent"],
    antiKeywords: [],
    description: "Best for: parallelizable work across multiple files/areas. Good for implementing a set of related features, running coordinated tasks that can be split among specialized agents."
  },
  {
    name: "deep",
    label: "deep",
    tagline: "2-stage: causal trace → deep interview → requirements",
    taskType:   { build: 0.1, fix: 0.9, refactor: 0.3, analyze: 0.8 },
    autonomy:   { guided: 0.8, periodic: 0.3, fireAndForget: 0.1 },
    complexity: { simple: 0.2, moderate: 0.5, complex: 0.8, multi: 0.7 },
    confidence: { clear: 0.3, vague: 0.5, bugReport: 0.9 },
    scale:      { solo: 0.8, smallTeam: 0.5, swarm: 0.2 },
    quality:    { draft: 0.2, production: 0.5, critical: 0.8 },
    time:       { asap: 0.1, balanced: 0.4, thorough: 0.9 },
    keywords: ["root cause", "trace", "debug", "investigate", "why", "broken", "not working", "fail", "error"],
    antiKeywords: ["build", "create", "implement", "design"],
    description: "Best for: debugging complex issues where the root cause is unclear. Traces backward from symptoms, then crystallizes requirements for the fix."
  },
  {
    name: "ccg",
    label: "ccg",
    tagline: "Multi-model synthesis — query diverse models",
    taskType:   { build: 0.1, fix: 0.2, refactor: 0.2, analyze: 0.9 },
    autonomy:   { guided: 0.5, periodic: 0.5, fireAndForget: 0.4 },
    complexity: { simple: 0.5, moderate: 0.8, complex: 0.7, multi: 0.5 },
    confidence: { clear: 0.6, vague: 0.8, bugReport: 0.3 },
    scale:      { solo: 0.9, smallTeam: 0.4, swarm: 0.1 },
    quality:    { draft: 0.7, production: 0.5, critical: 0.3 },
    time:       { asap: 0.5, balanced: 0.6, thorough: 0.4 },
    keywords: ["research", "synthesis", "perspectives", "tradeoff", "compare", "alternatives", "options"],
    antiKeywords: ["implement", "code", "build", "fix", "deploy"],
    description: "Best for: research and analysis — gathering multiple perspectives on a technical question, comparing approaches, synthesizing information from different sources."
  },
  {
    name: "ultrawork",
    label: "ultrawork",
    tagline: "Maximum parallel execution — high throughput",
    taskType:   { build: 0.9, fix: 0.7, refactor: 0.8, analyze: 0.3 },
    autonomy:   { guided: 0.2, periodic: 0.5, fireAndForget: 0.9 },
    complexity: { simple: 0.8, moderate: 0.9, complex: 0.6, multi: 0.4 },
    confidence: { clear: 0.9, vague: 0.4, bugReport: 0.5 },
    scale:      { solo: 0.7, smallTeam: 0.6, swarm: 0.3 },
    quality:    { draft: 0.8, production: 0.5, critical: 0.2 },
    time:       { asap: 0.9, balanced: 0.4, thorough: 0.1 },
    keywords: ["fast", "quick", "parallel", "many", "bulk", "batch", "high throughput"],
    antiKeywords: ["careful", "production", "critical", "security"],
    description: "Best for: getting lots of work done quickly — parallel execution of independent tasks. Good for bulk refactoring, generating boilerplate, running many small changes."
  },
  {
    name: "autopilot",
    label: "autopilot",
    tagline: "Full autonomy — idea to working code",
    taskType:   { build: 0.9, fix: 0.4, refactor: 0.6, analyze: 0.2 },
    autonomy:   { guided: 0.1, periodic: 0.3, fireAndForget: 1.0 },
    complexity: { simple: 0.4, moderate: 0.8, complex: 0.9, multi: 0.7 },
    confidence: { clear: 0.5, vague: 0.9, bugReport: 0.3 },
    scale:      { solo: 0.9, smallTeam: 0.5, swarm: 0.2 },
    quality:    { draft: 0.9, production: 0.4, critical: 0.1 },
    time:       { asap: 0.7, balanced: 0.5, thorough: 0.2 },
    keywords: ["build me", "create", "generate", "make", "build from scratch", "full app", "autonomous"],
    antiKeywords: ["debug", "fix specific", "refactor", "existing"],
    description: "Best for: building something from scratch with minimal guidance. Go from idea to working code autonomously. Good for MVPs, prototypes, new features."
  },
  {
    name: "sciomc",
    label: "sciomc",
    tagline: "Parallel scientist agents — comprehensive analysis",
    taskType:   { build: 0.1, fix: 0.3, refactor: 0.2, analyze: 1.0 },
    autonomy:   { guided: 0.4, periodic: 0.6, fireAndForget: 0.3 },
    complexity: { simple: 0.2, moderate: 0.6, complex: 0.9, multi: 0.8 },
    confidence: { clear: 0.5, vague: 0.7, bugReport: 0.6 },
    scale:      { solo: 0.6, smallTeam: 0.7, swarm: 0.5 },
    quality:    { draft: 0.5, production: 0.6, critical: 0.6 },
    time:       { asap: 0.2, balanced: 0.5, thorough: 0.8 },
    keywords: ["analyze", "comprehensive", "deep analysis", "thorough", "audit", "review", "evaluate"],
    antiKeywords: ["build", "implement", "code", "fix"],
    description: "Best for: thorough analysis from multiple angles — code review, security audit, architecture evaluation. Parallel agents each analyze independently, then merge."
  },
  {
    name: "swarm",
    label: "swarm",
    tagline: "11 specialized agents with gated QA pipeline",
    taskType:   { build: 0.7, fix: 0.5, refactor: 0.6, analyze: 0.4 },
    autonomy:   { guided: 0.3, periodic: 0.6, fireAndForget: 0.7 },
    complexity: { simple: 0.2, moderate: 0.6, complex: 0.9, multi: 1.0 },
    confidence: { clear: 0.7, vague: 0.4, bugReport: 0.5 },
    scale:      { solo: 0.2, smallTeam: 0.6, swarm: 1.0 },
    quality:    { draft: 0.2, production: 0.8, critical: 0.9 },
    time:       { asap: 0.1, balanced: 0.4, thorough: 0.9 },
    keywords: ["architect", "swarm", "pipeline", "multi-agent", "production quality", "gated"],
    antiKeywords: ["quick", "simple", "fast"],
    description: "Best for: complex multi-file changes requiring production quality. Architect-led team with coder, reviewer, test engineer, critic. Gated pipeline ensures quality."
  },
  {
    name: "state-machine",
    label: "state-machine",
    tagline: "Explicit state transitions with guards",
    taskType:   { build: 0.5, fix: 0.3, refactor: 0.6, analyze: 0.4 },
    autonomy:   { guided: 0.6, periodic: 0.5, fireAndForget: 0.3 },
    complexity: { simple: 0.2, moderate: 0.5, complex: 0.8, multi: 0.7 },
    confidence: { clear: 0.8, vague: 0.3, bugReport: 0.3 },
    scale:      { solo: 0.7, smallTeam: 0.6, swarm: 0.3 },
    quality:    { draft: 0.3, production: 0.7, critical: 0.8 },
    time:       { asap: 0.2, balanced: 0.5, thorough: 0.8 },
    keywords: ["state machine", "workflow", "pipeline", "stages", "transition", "stateful", "multi-step"],
    antiKeywords: ["simple", "one thing", "quick fix"],
    description: "Best for: multi-stage workflows with clear state boundaries. Model the process as states with entry/exit actions and guard conditions."
  },
  {
    name: "consensus",
    label: "consensus",
    tagline: "Multi-agent voting — majority, weighted, synthesis",
    taskType:   { build: 0.1, fix: 0.3, refactor: 0.2, analyze: 0.8 },
    autonomy:   { guided: 0.6, periodic: 0.5, fireAndForget: 0.3 },
    complexity: { simple: 0.4, moderate: 0.7, complex: 0.8, multi: 0.6 },
    confidence: { clear: 0.4, vague: 0.8, bugReport: 0.5 },
    scale:      { solo: 0.5, smallTeam: 0.8, swarm: 0.6 },
    quality:    { draft: 0.4, production: 0.6, critical: 0.7 },
    time:       { asap: 0.3, balanced: 0.5, thorough: 0.7 },
    keywords: ["vote", "consensus", "decide", "weigh", "compare options", "best approach", "tiebreak"],
    antiKeywords: ["implement", "build", "code"],
    description: "Best for: decisions where multiple approaches exist and you want a vote. Agents independently evaluate options, then aggregate via majority or weighted scoring."
  },
  {
    name: "evolutionary",
    label: "evolutionary",
    tagline: "Incremental builds with fitness validation",
    taskType:   { build: 0.7, fix: 0.3, refactor: 0.6, analyze: 0.2 },
    autonomy:   { guided: 0.5, periodic: 0.6, fireAndForget: 0.5 },
    complexity: { simple: 0.4, moderate: 0.7, complex: 0.8, multi: 0.6 },
    confidence: { clear: 0.6, vague: 0.6, bugReport: 0.3 },
    scale:      { solo: 0.7, smallTeam: 0.6, swarm: 0.4 },
    quality:    { draft: 0.5, production: 0.7, critical: 0.6 },
    time:       { asap: 0.3, balanced: 0.6, thorough: 0.7 },
    keywords: ["iterative", "evolve", "generation", "refine", "improve gradually", "successive"],
    antiKeywords: ["urgent", "asap", "quick"],
    description: "Best for: iterative refinement — build incrementally, test each generation, select the strongest and carry forward. Good for algorithms, optimization, design exploration."
  },
  {
    name: "spec-driven",
    label: "spec-driven",
    tagline: "Formal spec → validate → implement",
    taskType:   { build: 0.7, fix: 0.2, refactor: 0.4, analyze: 0.4 },
    autonomy:   { guided: 0.7, periodic: 0.5, fireAndForget: 0.3 },
    complexity: { simple: 0.3, moderate: 0.6, complex: 0.8, multi: 0.7 },
    confidence: { clear: 0.9, vague: 0.2, bugReport: 0.3 },
    scale:      { solo: 0.8, smallTeam: 0.6, swarm: 0.3 },
    quality:    { draft: 0.2, production: 0.8, critical: 1.0 },
    time:       { asap: 0.1, balanced: 0.4, thorough: 0.9 },
    keywords: ["spec", "formal", "specification", "requirements", "contract", "traceable"],
    antiKeywords: ["quick", "draft", "exploratory"],
    description: "Best for: mission-critical features where correctness is paramount. Write a formal spec first, validate through adversarial review, then implement strictly against it."
  },
  {
    name: "react",
    label: "react",
    tagline: "ReAct loop — think → act → observe → reason → repeat",
    taskType:   { build: 0.5, fix: 0.7, refactor: 0.5, analyze: 0.5 },
    autonomy:   { guided: 0.5, periodic: 0.6, fireAndForget: 0.5 },
    complexity: { simple: 0.5, moderate: 0.8, complex: 0.7, multi: 0.5 },
    confidence: { clear: 0.6, vague: 0.6, bugReport: 0.7 },
    scale:      { solo: 0.9, smallTeam: 0.4, swarm: 0.2 },
    quality:    { draft: 0.5, production: 0.6, critical: 0.5 },
    time:       { asap: 0.5, balanced: 0.6, thorough: 0.5 },
    keywords: ["interactive", "step by step", "think then do", "reason", "debug loop"],
    antiKeywords: ["fire and forget", "autonomous", "background"],
    description: "Best for: interactive debugging or development where you want to see each reasoning step. THINK about the problem, ACT with a tool, OBSERVE the result, repeat."
  },
  {
    name: "plan-execute",
    label: "plan-execute",
    tagline: "Architect plans → executor builds step by step",
    taskType:   { build: 0.8, fix: 0.3, refactor: 0.6, analyze: 0.2 },
    autonomy:   { guided: 0.6, periodic: 0.7, fireAndForget: 0.3 },
    complexity: { simple: 0.5, moderate: 0.8, complex: 0.9, multi: 0.7 },
    confidence: { clear: 0.8, vague: 0.5, bugReport: 0.3 },
    scale:      { solo: 0.7, smallTeam: 0.7, swarm: 0.4 },
    quality:    { draft: 0.4, production: 0.8, critical: 0.7 },
    time:       { asap: 0.2, balanced: 0.6, thorough: 0.7 },
    keywords: ["plan first", "architect", "design then build", "structured", "organized"],
    antiKeywords: ["spontaneous", "just try", "experiment"],
    description: "Best for: complex builds that need a clear plan first. Architect designs the full approach, executor implements step by step with verification at each step."
  },
  {
    name: "hive",
    label: "hive",
    tagline: "Agent Hive Swarm Bee — batched parallelism",
    taskType:   { build: 0.7, fix: 0.4, refactor: 0.6, analyze: 0.3 },
    autonomy:   { guided: 0.4, periodic: 0.6, fireAndForget: 0.6 },
    complexity: { simple: 0.3, moderate: 0.6, complex: 0.8, multi: 0.9 },
    confidence: { clear: 0.7, vague: 0.4, bugReport: 0.4 },
    scale:      { solo: 0.2, smallTeam: 0.6, swarm: 1.0 },
    quality:    { draft: 0.3, production: 0.7, critical: 0.7 },
    time:       { asap: 0.3, balanced: 0.5, thorough: 0.7 },
    keywords: ["agent hive", "bee", "batch", "isolated", "worktree", "orchestrated"],
    antiKeywords: ["simple", "one file"],
    description: "Best for: complex multi-file features with isolated worktrees. Tasks execute in batches with worker agents, best-effort verification, and orchestrator-level testing."
  },
  {
    name: "gsd",
    label: "gsd",
    tagline: "Full pipeline: discuss → plan → execute → verify → ship",
    taskType:   { build: 0.8, fix: 0.4, refactor: 0.5, analyze: 0.2 },
    autonomy:   { guided: 0.5, periodic: 0.6, fireAndForget: 0.5 },
    complexity: { simple: 0.4, moderate: 0.8, complex: 0.9, multi: 0.8 },
    confidence: { clear: 0.7, vague: 0.5, bugReport: 0.4 },
    scale:      { solo: 0.6, smallTeam: 0.8, swarm: 0.5 },
    quality:    { draft: 0.3, production: 0.8, critical: 0.7 },
    time:       { asap: 0.2, balanced: 0.6, thorough: 0.7 },
    keywords: ["ship", "pipeline", "end to end", "deliver", "production ready", "complete", "done right"],
    antiKeywords: ["quick hack", "just test", "explore"],
    description: "Best for: taking a feature from discussion to shipped PR. Complete lifecycle with research, parallel implementation waves, UAT verification, and atomic commits."
  },
  {
    name: "self-assess",
    label: "self-assess",
    tagline: "Self-evaluate and refine against quality thresholds",
    taskType:   { build: 0.5, fix: 0.4, refactor: 0.7, analyze: 0.3 },
    autonomy:   { guided: 0.4, periodic: 0.6, fireAndForget: 0.6 },
    complexity: { simple: 0.5, moderate: 0.7, complex: 0.6, multi: 0.4 },
    confidence: { clear: 0.7, vague: 0.5, bugReport: 0.4 },
    scale:      { solo: 0.8, smallTeam: 0.5, swarm: 0.2 },
    quality:    { draft: 0.3, production: 0.7, critical: 0.8 },
    time:       { asap: 0.2, balanced: 0.5, thorough: 0.8 },
    keywords: ["self review", "quality", "improve", "polish", "refine", "meet standard"],
    antiKeywords: ["new feature", "from scratch", "draft"],
    description: "Best for: quality improvement — execute a task, then critically self-evaluate against defined criteria, reflecting and refining until thresholds are met."
  },
  {
    name: "remediate",
    label: "remediate",
    tagline: "CI/build failure auto-remediation",
    taskType:   { build: 0.1, fix: 1.0, refactor: 0.2, analyze: 0.3 },
    autonomy:   { guided: 0.2, periodic: 0.4, fireAndForget: 0.9 },
    complexity: { simple: 0.6, moderate: 0.8, complex: 0.6, multi: 0.4 },
    confidence: { clear: 0.3, vague: 0.4, bugReport: 0.9 },
    scale:      { solo: 0.8, smallTeam: 0.5, swarm: 0.2 },
    quality:    { draft: 0.3, production: 0.7, critical: 0.8 },
    time:       { asap: 0.8, balanced: 0.5, thorough: 0.3 },
    keywords: ["CI", "build fail", "test fail", "compile error", "red", "pipeline broken"],
    antiKeywords: ["design", "feature", "refactor"],
    description: "Best for: fixing CI/build/test failures. Monitors failure, analyzes root cause, applies fix, re-runs until green. Human review breakpoints for risky changes."
  },
  {
    name: "devin",
    label: "devin",
    tagline: "Autonomous Plan→Code→Debug→Deploy",
    taskType:   { build: 0.8, fix: 0.7, refactor: 0.5, analyze: 0.2 },
    autonomy:   { guided: 0.3, periodic: 0.4, fireAndForget: 0.8 },
    complexity: { simple: 0.3, moderate: 0.7, complex: 0.8, multi: 0.6 },
    confidence: { clear: 0.6, vague: 0.6, bugReport: 0.5 },
    scale:      { solo: 0.8, smallTeam: 0.5, swarm: 0.3 },
    quality:    { draft: 0.6, production: 0.6, critical: 0.5 },
    time:       { asap: 0.5, balanced: 0.5, thorough: 0.5 },
    keywords: ["deploy", "plan code deploy", "end to end", "full pipeline", "autonomous dev"],
    antiKeywords: ["quick fix", "just"],
    description: "Best for: building and deploying a feature autonomously. Plan the feature, write code, test, debug, and deploy with appropriate approval gates."
  },
  {
    name: "maestro",
    label: "maestro",
    tagline: "Strict role separation factory",
    taskType:   { build: 0.7, fix: 0.3, refactor: 0.4, analyze: 0.3 },
    autonomy:   { guided: 0.7, periodic: 0.5, fireAndForget: 0.2 },
    complexity: { simple: 0.2, moderate: 0.5, complex: 0.8, multi: 0.9 },
    confidence: { clear: 0.8, vague: 0.3, bugReport: 0.3 },
    scale:      { solo: 0.3, smallTeam: 0.7, swarm: 0.8 },
    quality:    { draft: 0.2, production: 0.8, critical: 0.9 },
    time:       { asap: 0.1, balanced: 0.4, thorough: 0.9 },
    keywords: ["role separation", "factory", "pm", "architect", "coder", "review", "strict"],
    antiKeywords: ["quick", "simple", "informal"],
    description: "Best for: projects demanding rigorous role separation. PM gathers requirements, Architect designs (never codes), Coders implement (never self-review), with institutional memory."
  },
  {
    name: "metaswarm",
    label: "metaswarm",
    tagline: "12 agents, 7 phases, adversarial review",
    taskType:   { build: 0.7, fix: 0.4, refactor: 0.5, analyze: 0.4 },
    autonomy:   { guided: 0.3, periodic: 0.4, fireAndForget: 0.8 },
    complexity: { simple: 0.1, moderate: 0.4, complex: 0.8, multi: 1.0 },
    confidence: { clear: 0.7, vague: 0.3, bugReport: 0.4 },
    scale:      { solo: 0.1, smallTeam: 0.4, swarm: 1.0 },
    quality:    { draft: 0.1, production: 0.7, critical: 1.0 },
    time:       { asap: 0.1, balanced: 0.3, thorough: 1.0 },
    keywords: ["metaswarm", "adversarial", "anchoring bias", "12 agents", "independent validation"],
    antiKeywords: ["simple", "quick", "tiny"],
    description: "Best for: the most critical, complex work. 12 agents across 7 phases with adversarial reviews using fresh reviewers to prevent anchoring bias, mandatory TDD, 100% coverage targets."
  },
  {
    name: "cc10x",
    label: "cc10x",
    tagline: "Intent-detecting router — auto-dispatches to right pipeline",
    taskType:   { build: 0.6, fix: 0.6, refactor: 0.5, analyze: 0.5 },
    autonomy:   { guided: 0.5, periodic: 0.6, fireAndForget: 0.5 },
    complexity: { simple: 0.5, moderate: 0.7, complex: 0.7, multi: 0.5 },
    confidence: { clear: 0.6, vague: 0.6, bugReport: 0.5 },
    scale:      { solo: 0.7, smallTeam: 0.6, swarm: 0.4 },
    quality:    { draft: 0.5, production: 0.6, critical: 0.6 },
    time:       { asap: 0.5, balanced: 0.6, thorough: 0.5 },
    keywords: ["cc10x", "auto route", "intent", "dispatch"],
    antiKeywords: [],
    description: "Best for: when you're not sure which pattern to use — acts as its own router to BUILD, DEBUG, REVIEW, or PLAN pipelines."
  },
  {
    name: "gastown",
    label: "gastown",
    tagline: "GUPP principle — git-backed work units, NDI",
    taskType:   { build: 0.6, fix: 0.4, refactor: 0.6, analyze: 0.2 },
    autonomy:   { guided: 0.5, periodic: 0.5, fireAndForget: 0.6 },
    complexity: { simple: 0.3, moderate: 0.6, complex: 0.8, multi: 0.7 },
    confidence: { clear: 0.7, vague: 0.4, bugReport: 0.3 },
    scale:      { solo: 0.5, smallTeam: 0.7, swarm: 0.6 },
    quality:    { draft: 0.3, production: 0.7, critical: 0.7 },
    time:       { asap: 0.2, balanced: 0.5, thorough: 0.8 },
    keywords: ["gastown", "gupp", "ndi", "git-backed", "work units", "reliable"],
    antiKeywords: ["quick hack"],
    description: "Best for: reliable outcomes from unreliable multi-agent processes. Git-backed work units, GUPP principle, MEOW decomposition, Nondeterministic Idempotence."
  },
  {
    name: "ruflo",
    label: "ruflo",
    tagline: "60+ agent swarm with Q-Learning routing",
    taskType:   { build: 0.6, fix: 0.4, refactor: 0.5, analyze: 0.3 },
    autonomy:   { guided: 0.2, periodic: 0.4, fireAndForget: 0.9 },
    complexity: { simple: 0.1, moderate: 0.3, complex: 0.7, multi: 1.0 },
    confidence: { clear: 0.7, vague: 0.3, bugReport: 0.3 },
    scale:      { solo: 0.1, smallTeam: 0.2, swarm: 1.0 },
    quality:    { draft: 0.2, production: 0.6, critical: 0.8 },
    time:       { asap: 0.2, balanced: 0.4, thorough: 0.8 },
    keywords: ["ruflo", "q-learning", "queen worker", "consensus protocol", "raft", "gossip"],
    antiKeywords: ["simple", "small", "one file"],
    description: "Best for: massive-scale coordination with 60+ agents. Uses Q-Learning to route to the right agent tier, hierarchical topologies, and 4 consensus protocols."
  },
  {
    name: "harden",
    label: "harden",
    tagline: "safeTask + circuitBreaker + verificationGate",
    taskType:   { build: 0.3, fix: 0.5, refactor: 0.5, analyze: 0.4 },
    autonomy:   { guided: 0.6, periodic: 0.5, fireAndForget: 0.4 },
    complexity: { simple: 0.3, moderate: 0.6, complex: 0.8, multi: 0.7 },
    confidence: { clear: 0.7, vague: 0.4, bugReport: 0.5 },
    scale:      { solo: 0.6, smallTeam: 0.7, swarm: 0.5 },
    quality:    { draft: 0.2, production: 0.7, critical: 0.9 },
    time:       { asap: 0.2, balanced: 0.5, thorough: 0.8 },
    keywords: ["harden", "robust", "safe", "circuit breaker", "resilient", "fault tolerant"],
    antiKeywords: ["new feature", "from scratch"],
    description: "Best for: wrapping an existing workflow with resilience — error recovery, failure rate circuit breakers, downstream verification gates."
  },
  {
    name: "brownfield",
    label: "brownfield",
    tagline: "Feature addition to existing codebase",
    taskType:   { build: 0.7, fix: 0.3, refactor: 0.6, analyze: 0.4 },
    autonomy:   { guided: 0.5, periodic: 0.6, fireAndForget: 0.3 },
    complexity: { simple: 0.3, moderate: 0.6, complex: 0.8, multi: 0.8 },
    confidence: { clear: 0.7, vague: 0.5, bugReport: 0.4 },
    scale:      { solo: 0.6, smallTeam: 0.7, swarm: 0.5 },
    quality:    { draft: 0.3, production: 0.7, critical: 0.7 },
    time:       { asap: 0.2, balanced: 0.6, thorough: 0.7 },
    keywords: ["existing codebase", "brownfield", "add feature", "legacy", "integration point"],
    antiKeywords: ["greenfield", "from scratch", "new project"],
    description: "Best for: adding features to existing codebases. Analyze the system, identify integration points, validate strategy before implementation, cross-system compatibility."
  },
  {
    name: "vibe-code",
    label: "vibe-code",
    tagline: "Conversational rapid prototyping",
    taskType:   { build: 0.9, fix: 0.2, refactor: 0.3, analyze: 0.1 },
    autonomy:   { guided: 0.8, periodic: 0.3, fireAndForget: 0.2 },
    complexity: { simple: 0.7, moderate: 0.8, complex: 0.5, multi: 0.3 },
    confidence: { clear: 0.3, vague: 0.9, bugReport: 0.2 },
    scale:      { solo: 0.9, smallTeam: 0.3, swarm: 0.1 },
    quality:    { draft: 1.0, production: 0.2, critical: 0.1 },
    time:       { asap: 0.9, balanced: 0.3, thorough: 0.1 },
    keywords: ["prototype", "vibe code", "rapid", "conversational", "iterative feedback", "try out"],
    antiKeywords: ["production", "deploy", "secure", "critical"],
    description: "Best for: rapid prototyping with conversational feedback. Describe in natural language, get a working prototype, iterate with feedback rounds."
  }
];

// ─── Helper: escape regex special characters ──────────────────────────────

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Intent Classifier ────────────────────────────────────────────────────

function classify(text) {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);

  // Score each subcommand
  const results = SUBCMDS.map(scmd => {
    let score = 0;

    // Keyword matches (strong signal) — word-boundary regex
    for (const kw of scmd.keywords) {
      const kwRegex = new RegExp('\\b' + escapeRegex(kw) + '\\b', 'i');
      if (kwRegex.test(lower)) score += 0.15;
    }

    // Anti-keyword penalty — word-boundary regex
    for (const akw of scmd.antiKeywords) {
      const akwRegex = new RegExp('\\b' + escapeRegex(akw) + '\\b', 'i');
      if (akwRegex.test(lower)) score -= 0.1;
    }

    // Task type via key verbs
    if (/\bbuild\b|\bcreate\b|\bgenerate\b|\bnew\b|\bmake\b/.test(lower)) score += scmd.taskType.build * 0.12;
    if (/\bfix\b|\bdebug\b|\bbroken\b|\berror\b|\bfail\b|\bissue\b|\bbug\b/.test(lower)) score += scmd.taskType.fix * 0.12;
    if (/\brefactor\b|\bclean\b|\bimprove\b|\boptimize\b/.test(lower)) score += scmd.taskType.refactor * 0.12;
    if (/\bresearch\b|\banalyze\b|\bcompare\b|\bexplore\b|\bwhat\b|\bhow\b|\boptions\b/.test(lower)) score += scmd.taskType.analyze * 0.12;

    // Quality signals
    if (/\bproduction\b|\bprod\b|\bship\b|\brelease\b|\bdeploy\b/.test(lower)) score += scmd.quality.production * 0.08;
    if (/\bdraft\b|\bprototype\b|\bquick\b|\btry\b/.test(lower)) score += scmd.quality.draft * 0.08;
    if (/\bcritical\b|\bmission\b|\bsecure\b|\bsafety\b|\bcorrect\b/.test(lower)) score += scmd.quality.critical * 0.08;

    // Autonomy signals
    if (/\bautonomous\b|\bfire.*forget\b|\bbackground\b|\bkeep.*working\b/.test(lower)) score += scmd.autonomy.fireAndForget * 0.08;
    if (/\bwithm\b|\bapprove\b|\breview\b|\bcheckpoint\b|\bguide\b|\bwalk.*through\b/.test(lower)) score += scmd.autonomy.guided * 0.08;

    // Complexity signals
    const mentionsComplexity = /\bcomplex\b|\bmulti.*\b|\badvanced\b|\blarge\b|\bmany\b/.test(lower);
    const mentionsSimple = /\bsimple\b|\btiny\b|\bsmall\b|\bjust\b|\btrivial\b/.test(lower);
    if (mentionsComplexity) score += scmd.complexity.complex * 0.08;
    if (mentionsSimple) score += scmd.complexity.simple * 0.08;

    // Confidence signals
    if (/\bspec\b|\brequirements\b|\bexact\b|\bprecise\b|\bclear\b/.test(lower)) score += scmd.confidence.clear * 0.08;
    if (/\bvague\b|\bidea\b|\bthink about\b|\bexplore\b|\bwhat if\b/.test(lower)) score += scmd.confidence.vague * 0.08;

    return { name: scmd.name, label: scmd.label, tagline: scmd.tagline, score, description: scmd.description };
  });

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
}

// ─── Main ──────────────────────────────────────────────────────────────────

function main() {
  const query = process.argv.slice(2).join(' ') || process.env.REQUEST || '';
  if (!query) {
    console.error('Usage: node route-orchestrate.mjs "what do you want to do?"');
    console.error('   or: REQUEST="build me an app" node route-orchestrate.mjs');
    process.exit(1);
  }

  console.error(`Routing request: "${query}"`);
  console.error('');

  const results = classify(query);
  const top = results[0];

  const MIN_CONFIDENCE = 0.3; // Minimum score to consider a valid match

  // Disambiguation: if top 2 scores are within 20% of each other, flag ambiguity
  const isAmbiguous = results.length >= 2 &&
    results[0].score > 0 &&
    results[1].score > 0 &&
    (results[0].score - results[1].score) / Math.max(results[0].score, 0.01) < 0.2;

  // Check confidence threshold
  if (top.score < MIN_CONFIDENCE) {
    console.log(JSON.stringify({
      request: query,
      recommended: null,
      confidence: Math.min(100, Math.round((top.score / 2.25) * 100)),
      ambiguous: true,
      reason: "Confidence too low — please be more specific",
      description: "No subcommand matched confidently. Try describing what you want more specifically.",
      ranked: results.slice(0, 5).map(r => ({
        subcommand: r.label,
        score: Math.min(100, Math.round((r.score / 2.25) * 100)),
        tagline: r.tagline
      }))
    }, null, 2));
    return;
  }

  // Output: machine-readable JSON on stdout
  console.log(JSON.stringify({
    request: query,
    recommended: top.label,
    // Normalize to 0-100 scale: divide by theoretical max
    // Max possible: 7 keyword matches (7*0.15=1.05) + all regex signals (~1.2) ≈ 2.25 max
    confidence: Math.min(100, Math.round((top.score / 2.25) * 100)),
    ambiguous: isAmbiguous || undefined,
    alternatives: isAmbiguous ? results.slice(0, 3).map(r => ({
      subcommand: r.label,
      score: Math.min(100, Math.round((r.score / 2.25) * 100)),
      tagline: r.tagline,
      description: r.description
    })) : undefined,
    reason: top.tagline,
    description: top.description,
    ranked: results.slice(0, 5).map(r => ({
      subcommand: r.label,
      score: Math.min(100, Math.round((r.score / 2.25) * 100)),
      tagline: r.tagline
    }))
  }, null, 2));
}

main();
