#!/usr/bin/env node
/**
 * route-ideation.mjs — Ideation Router
 *
 * Analyzes a user's natural language request and routes it to the best
 * /ideation subcommand for planning, research, and design work.
 *
 * Usage:
 *   node route-ideation.mjs "plan the auth system"
 *   node route-ideation.mjs "explore tradeoffs in database choice"
 *   REQUEST="design a payment flow" node route-ideation.mjs
 */

const SUBCMDS = [
  {
    name: "plan",
    tagline: "Interview-style strategic planning — clarify goals, break into ordered tasks with acceptance criteria",
    mode: { clarify: 0.9, explore: 0.3, structure: 1.0, evaluate: 0.2 },
    scope:  { narrow: 0.7, broad: 0.8, vague: 0.9, concrete: 0.8 },
    depth:  { quick: 0.4, thorough: 0.8, exhaustive: 0.6 },
    rigor:  { loose: 0.5, structured: 0.9, formal: 0.6 },
    outcome:{ deliverable: 0.9, understanding: 0.4, decision: 0.5 },
    keywords: ["plan", "roadmap", "steps", "break down", "tasks", "milestone", "sprint", "timeline", "ordered", "sequence", "acceptance criteria"],
    antiKeywords: ["brainstorm", "vibe", "explore freely", "what if"],
    description: "Best for: turning a goal into ordered, actionable tasks with explicit acceptance criteria. Clarifies unknowns through interview."
  },
  {
    name: "brainstorm",
    tagline: "Free-form idea generation — throw ideas at the wall, then cluster and prioritize",
    mode: { clarify: 0.2, explore: 1.0, structure: 0.3, evaluate: 0.5 },
    scope:  { narrow: 0.4, broad: 0.9, vague: 0.9, concrete: 0.3 },
    depth:  { quick: 0.8, thorough: 0.3, exhaustive: 0.2 },
    rigor:  { loose: 1.0, structured: 0.3, formal: 0.1 },
    outcome:{ deliverable: 0.3, understanding: 0.8, decision: 0.4 },
    keywords: ["brainstorm", "ideas", "creative", "think of", "possibilities", "what about", "generate", "throw out", "list"],
    antiKeywords: ["execute", "implement", "build", "decide", "specific"],
    description: "Best for: generating many ideas on a topic without judgment, then clustering and prioritizing. Pure divergence before convergence."
  },
  {
    name: "decomposition",
    tagline: "Break a task down into actionable subtasks with dependencies, ordering, and acceptance criteria",
    mode: { clarify: 0.7, explore: 0.3, structure: 1.0, evaluate: 0.5 },
    scope:  { narrow: 0.8, broad: 0.5, vague: 0.7, concrete: 0.9 },
    depth:  { quick: 0.4, thorough: 0.8, exhaustive: 0.6 },
    rigor:  { loose: 0.2, structured: 0.9, formal: 0.7 },
    outcome:{ deliverable: 0.9, understanding: 0.5, decision: 0.6 },
    keywords: ["decompose", "break down", "subtask", "component", "divide", "split", "modularize", "work breakdown", "wbs", "task breakdown", "actionable steps", "ordered steps", "smaller tasks", "independent pieces"],
    antiKeywords: ["brainstorm", "creative", "vibe", "design thinking"],
    description: "Best for: taking a complex task or goal and breaking it into ordered, actionable subtasks with dependencies and acceptance criteria. Produces a concrete work breakdown structure."
  },
  {
    name: "refine",
    tagline: "Diverge/converge iteration — expand an idea, then sharpen into strongest version",
    mode: { clarify: 0.6, explore: 0.7, structure: 0.6, evaluate: 0.7 },
    scope:  { narrow: 0.6, broad: 0.6, vague: 0.7, concrete: 0.6 },
    depth:  { quick: 0.5, thorough: 0.7, exhaustive: 0.5 },
    rigor:  { loose: 0.6, structured: 0.7, formal: 0.4 },
    outcome:{ deliverable: 0.6, understanding: 0.6, decision: 0.6 },
    keywords: ["refine", "improve", "polish", "hone", "sharpen", "evolve idea", "iterate on"],
    antiKeywords: ["from scratch", "new idea", "brainstorm"],
    description: "Best for: taking a rough idea and iteratively expanding then converging to the strongest version. Structured diverge/converge cycles."
  },
  {
    name: "overhaul",
    tagline: "Analyze project across 8 refinement dimensions — architecture, perf, security, quality, testing, deps, DX — and produce a prioritized phased implementation plan",
    mode: { clarify: 0.3, explore: 0.5, structure: 0.9, evaluate: 0.9 },
    scope:  { narrow: 0.8, broad: 0.8, vague: 0.4, concrete: 0.9 },
    depth:  { quick: 0.2, thorough: 0.9, exhaustive: 0.8 },
    rigor:  { loose: 0.1, structured: 0.9, formal: 0.8 },
    outcome:{ deliverable: 1.0, understanding: 0.8, decision: 0.8 },
    keywords: ["overhaul", "refactor", "improve project", "clean up", "tech debt", "fix codebase", "hardening", "code quality", "performance issues", "security issues", "audit project", "assess codebase", "improve code quality", "fix architecture", "optimize", "clean code", "poor design", "messy code", "analyze project"],
    antiKeywords: ["new feature", "from scratch", "greenfield", "brainstorm", "idea"],
    description: "Best for: analyzing an existing project that needs improvement. Scans across architecture, performance, security, code quality, testing, dependencies, and DX. Produces a prioritized, phased implementation plan."
  },
  {
    name: "deep",
    tagline: "Socratic interview with ambiguity gating — crystallizes vague requirements through probing questions",
    mode: { clarify: 1.0, explore: 0.4, structure: 0.5, evaluate: 0.5 },
    scope:  { narrow: 0.5, broad: 0.6, vague: 1.0, concrete: 0.4 },
    depth:  { quick: 0.1, thorough: 0.9, exhaustive: 0.9 },
    rigor:  { loose: 0.1, structured: 0.8, formal: 0.7 },
    outcome:{ deliverable: 0.5, understanding: 0.9, decision: 0.6 },
    keywords: ["vague", "unclear", "crystallize", "probe", "deep interview", "socratic", "questions", "requirements", "understand"],
    antiKeywords: ["simple", "obvious", "clear", "straightforward"],
    description: "Best for: vague or unclear requirements. Won't proceed past ambiguous points until resolved. Crystallizes by iterative questioning."
  },
  {
    name: "graph",
    tagline: "Visual relationship mapping — dependencies, components, tradeoffs as a graph",
    mode: { clarify: 0.5, explore: 0.6, structure: 0.9, evaluate: 0.6 },
    scope:  { narrow: 0.6, broad: 0.7, vague: 0.5, concrete: 0.7 },
    depth:  { quick: 0.4, thorough: 0.7, exhaustive: 0.6 },
    rigor:  { loose: 0.3, structured: 0.9, formal: 0.7 },
    outcome:{ deliverable: 0.7, understanding: 0.8, decision: 0.6 },
    keywords: ["graph", "map", "dependency", "relationship", "component", "architecture", "visualize", "diagram", "connect"],
    antiKeywords: ["text", "write", "code"],
    description: "Best for: understanding complex relationships — dependencies, component interactions, tradeoff spaces. Visual graph structure reveals non-linear patterns."
  },
  {
    name: "research",
    tagline: "Multi-model synthesis — query diverse perspectives, merge into one coherent answer",
    mode: { clarify: 0.4, explore: 0.8, structure: 0.5, evaluate: 0.8 },
    scope:  { narrow: 0.6, broad: 0.7, vague: 0.6, concrete: 0.6 },
    depth:  { quick: 0.4, thorough: 0.8, exhaustive: 0.6 },
    rigor:  { loose: 0.3, structured: 0.6, formal: 0.5 },
    outcome:{ deliverable: 0.4, understanding: 0.9, decision: 0.7 },
    keywords: ["research", "compare", "tradeoff", "options", "alternatives", "pros cons", "evaluate", "investigate", "synthesis", "perspectives"],
    antiKeywords: ["build", "implement", "code", "make"],
    description: "Best for: researching a topic or comparing approaches. Gathers diverse perspectives and merges them into a synthesized answer."
  },
  {
    name: "ralplan",
    tagline: "Consensus planning gate — validates a plan is concrete enough before execution hand-off",
    mode: { clarify: 0.7, explore: 0.2, structure: 0.8, evaluate: 0.8 },
    scope:  { narrow: 0.8, broad: 0.5, vague: 0.8, concrete: 0.3 },
    depth:  { quick: 0.7, thorough: 0.5, exhaustive: 0.3 },
    rigor:  { loose: 0.2, structured: 0.8, formal: 0.6 },
    outcome:{ deliverable: 0.8, understanding: 0.5, decision: 0.7 },
    keywords: ["gate", "validate plan", "consensus", "ready to execute", "check plan", "is this ready", "approve"],
    antiKeywords: ["explore", "discover", "create"],
    description: "Best for: checking if a plan is concrete enough to execute. Auto-gates vague requests before handing off to /orchestrate."
  },
  {
    name: "ddd",
    tagline: "Domain-driven design — bounded contexts, aggregates, domain events, ubiquitous language",
    mode: { clarify: 0.7, explore: 0.5, structure: 0.9, evaluate: 0.5 },
    scope:  { narrow: 0.5, broad: 0.8, vague: 0.6, concrete: 0.6 },
    depth:  { quick: 0.2, thorough: 0.8, exhaustive: 0.8 },
    rigor:  { loose: 0.1, structured: 0.9, formal: 0.9 },
    outcome:{ deliverable: 0.7, understanding: 0.9, decision: 0.7 },
    keywords: ["domain", "bounded context", "aggregate", "entity", "value object", "domain event", "ubiquitous language", "ddd", "strategic design"],
    antiKeywords: ["simple", "crud", "just"],
    description: "Best for: modeling complex business domains. Identifies bounded contexts, aggregates, entities, domain events, and establishes ubiquitous language."
  },
  {
    name: "event-storming",
    tagline: "Collaborative domain exploration via timeline, commands, events, policies",
    mode: { clarify: 0.6, explore: 0.8, structure: 0.7, evaluate: 0.4 },
    scope:  { narrow: 0.4, broad: 0.8, vague: 0.7, concrete: 0.5 },
    depth:  { quick: 0.3, thorough: 0.7, exhaustive: 0.6 },
    rigor:  { loose: 0.4, structured: 0.7, formal: 0.5 },
    outcome:{ deliverable: 0.6, understanding: 0.9, decision: 0.5 },
    keywords: ["event storm", "timeline", "domain events", "commands", "policies", "workflow discovery", "process modeling"],
    antiKeywords: ["code", "implement", "ui"],
    description: "Best for: discovering and modeling business processes through events. Walk through scenarios chronologically, identify commands, events, policies, and aggregates."
  },
  {
    name: "double-diamond",
    tagline: "Design Council framework — discover, define, develop, deliver",
    mode: { clarify: 0.6, explore: 0.8, structure: 0.8, evaluate: 0.7 },
    scope:  { narrow: 0.5, broad: 0.8, vague: 0.7, concrete: 0.5 },
    depth:  { quick: 0.3, thorough: 0.7, exhaustive: 0.6 },
    rigor:  { loose: 0.3, structured: 0.8, formal: 0.6 },
    outcome:{ deliverable: 0.7, understanding: 0.7, decision: 0.6 },
    keywords: ["double diamond", "design thinking", "discover define", "develop deliver", "problem space", "solution space", "ux process"],
    antiKeywords: [],
    description: "Best for: design challenges needing the full double-diamond cycle. Divergent discovery/definition (problem space) then convergent development/delivery (solution space)."
  },
  {
    name: "jtbd",
    tagline: "Jobs-to-be-done — frame requirements around customer functional jobs, not features",
    mode: { clarify: 0.7, explore: 0.6, structure: 0.6, evaluate: 0.5 },
    scope:  { narrow: 0.6, broad: 0.6, vague: 0.7, concrete: 0.5 },
    depth:  { quick: 0.4, thorough: 0.7, exhaustive: 0.5 },
    rigor:  { loose: 0.4, structured: 0.7, formal: 0.5 },
    outcome:{ deliverable: 0.6, understanding: 0.8, decision: 0.7 },
    keywords: ["job to be done", "jtbd", "customer job", "functional job", "hire", "outcome driven", "user need", "what job"],
    antiKeywords: ["backend", "api", "database"],
    description: "Best for: framing requirements around what users actually need to accomplish. Shifts focus from features to functional jobs. Good for product discovery."
  },
  {
    name: "impact-mapping",
    tagline: "Why-who-how-what goal mapping — trace every output to measurable business impact",
    mode: { clarify: 0.6, explore: 0.5, structure: 0.9, evaluate: 0.7 },
    scope:  { narrow: 0.6, broad: 0.7, vague: 0.6, concrete: 0.6 },
    depth:  { quick: 0.3, thorough: 0.7, exhaustive: 0.6 },
    rigor:  { loose: 0.2, structured: 0.9, formal: 0.7 },
    outcome:{ deliverable: 0.8, understanding: 0.6, decision: 0.8 },
    keywords: ["impact map", "why who how what", "goal mapping", "business impact", "trace", "outcomes", "deliverables", "actors"],
    antiKeywords: ["technical", "code", "implementation detail"],
    description: "Best for: aligning work to business goals. Maps goals → actors → impacts → deliverables. Ensures every output traces back to measurable outcomes."
  },
  {
    name: "spiral",
    tagline: "Risk-driven iterative planning — each cycle targets highest-risk items first",
    mode: { clarify: 0.6, explore: 0.4, structure: 0.8, evaluate: 0.8 },
    scope:  { narrow: 0.5, broad: 0.7, vague: 0.5, concrete: 0.7 },
    depth:  { quick: 0.2, thorough: 0.8, exhaustive: 0.7 },
    rigor:  { loose: 0.1, structured: 0.8, formal: 0.8 },
    outcome:{ deliverable: 0.7, understanding: 0.7, decision: 0.8 },
    keywords: ["spiral", "risk", "iteration", "cycle", "highest risk", "uncertainty", "incremental", "prototype", "validate"],
    antiKeywords: ["waterfall", "all at once", "big bang"],
    description: "Best for: projects with significant uncertainty or risk. Each iterative cycle tackles the highest-risk items — technical, requirements, or integration — first."
  },
  {
    name: "top-down",
    tagline: "Decompose from high-level vision into components, sub-systems, and interfaces",
    mode: { clarify: 0.4, explore: 0.3, structure: 1.0, evaluate: 0.4 },
    scope:  { narrow: 0.5, broad: 0.8, vague: 0.6, concrete: 0.6 },
    depth:  { quick: 0.3, thorough: 0.7, exhaustive: 0.7 },
    rigor:  { loose: 0.2, structured: 0.9, formal: 0.8 },
    outcome:{ deliverable: 0.8, understanding: 0.7, decision: 0.6 },
    keywords: ["top down", "decompose", "high level", "components", "subsystem", "module", "architecture", "vision", "hierarchy"],
    antiKeywords: ["bottom up", "existing", "increment"],
    description: "Best for: designing systems from a high-level vision downward. Decompose into components, sub-systems, and modules with clear interface contracts."
  },
  {
    name: "bottom-up",
    tagline: "Build up from existing primitives and capabilities into composed systems",
    mode: { clarify: 0.4, explore: 0.5, structure: 0.8, evaluate: 0.5 },
    scope:  { narrow: 0.7, broad: 0.5, vague: 0.4, concrete: 0.8 },
    depth:  { quick: 0.4, thorough: 0.6, exhaustive: 0.5 },
    rigor:  { loose: 0.3, structured: 0.7, formal: 0.6 },
    outcome:{ deliverable: 0.7, understanding: 0.7, decision: 0.5 },
    keywords: ["bottom up", "compose", "primitive", "existing", "library", "utility", "building block", "incremental build"],
    antiKeywords: ["vision", "big picture", "architecture"],
    description: "Best for: building systems from existing primitives upward. Survey available capabilities, then compose into higher-level systems and workflows."
  },
  {
    name: "adversarial-debate",
    tagline: "Spec validation via oppositional debate — proposer vs critics with convergence",
    mode: { clarify: 0.4, explore: 0.3, structure: 0.5, evaluate: 1.0 },
    scope:  { narrow: 0.7, broad: 0.4, vague: 0.3, concrete: 0.9 },
    depth:  { quick: 0.2, thorough: 0.7, exhaustive: 0.8 },
    rigor:  { loose: 0.1, structured: 0.7, formal: 0.9 },
    outcome:{ deliverable: 0.6, understanding: 0.6, decision: 0.9 },
    keywords: ["adversarial", "debate", "critique", "validate spec", "opposition", "challenge", "critic", "defend", "weakness"],
    antiKeywords: ["agree", "consensus", "collaborative"],
    description: "Best for: stress-testing a spec or design. Proposer vs security/performance/UX critics debate with judge convergence. Exposes hidden flaws."
  },
  {
    name: "cleanroom",
    tagline: "Formal correctness — black box → state box → clear box, statistical testing, MTTF certification",
    mode: { clarify: 0.3, explore: 0.2, structure: 0.9, evaluate: 0.9 },
    scope:  { narrow: 0.8, broad: 0.3, vague: 0.2, concrete: 0.9 },
    depth:  { quick: 0.1, thorough: 0.6, exhaustive: 1.0 },
    rigor:  { loose: 0.0, structured: 0.6, formal: 1.0 },
    outcome:{ deliverable: 0.8, understanding: 0.5, decision: 0.7 },
    keywords: ["cleanroom", "formal correctness", "box structure", "mttf", "statistical testing", "mathematical verification", "certification"],
    antiKeywords: ["agile", "quick", "prototype"],
    description: "Best for: mission-critical systems requiring mathematical correctness. Box structure specs (black→state→clear), statistical usage testing, MTTF certification."
  },
  {
    name: "pwf",
    tagline: "Planning-with-files — filesystem as disk, context window as RAM, three-file pattern with quality gating",
    mode: { clarify: 0.4, explore: 0.3, structure: 0.9, evaluate: 0.6 },
    scope:  { narrow: 0.6, broad: 0.6, vague: 0.5, concrete: 0.7 },
    depth:  { quick: 0.3, thorough: 0.8, exhaustive: 0.7 },
    rigor:  { loose: 0.2, structured: 0.9, formal: 0.7 },
    outcome:{ deliverable: 0.9, understanding: 0.5, decision: 0.6 },
    keywords: ["pwf", "planning with files", "task plan", "findings", "progress", "three file", "quality gate", "convergence"],
    antiKeywords: [],
    description: "Best for: persistent planning where context window is tight. Creates task_plan.md, findings.md, progress.md with quality-gated convergence and session recovery."
  },
  {
    name: "rpikit",
    tagline: "Research-Plan-Implement with stakes-based rigor and Iron Law — don't touch code until understood",
    mode: { clarify: 0.6, explore: 0.6, structure: 0.8, evaluate: 0.6 },
    scope:  { narrow: 0.6, broad: 0.6, vague: 0.6, concrete: 0.7 },
    depth:  { quick: 0.3, thorough: 0.8, exhaustive: 0.6 },
    rigor:  { loose: 0.2, structured: 0.8, formal: 0.8 },
    outcome:{ deliverable: 0.8, understanding: 0.8, decision: 0.7 },
    keywords: ["rpikit", "research plan implement", "iron law", "stakes", "rigor", "understand first"],
    antiKeywords: ["just code", "hack", "try"],
    description: "Best for: work requiring disciplined approach. Research first (Iron Law), plan with stakes-based rigor, implement with verification-before-completion."
  },
  {
    name: "hive",
    tagline: "Agent Hive planning — Architect Bee: interview, discover, gather context, produce plan.md with approval gate",
    mode: { clarify: 0.8, explore: 0.6, structure: 0.8, evaluate: 0.5 },
    scope:  { narrow: 0.5, broad: 0.7, vague: 0.8, concrete: 0.6 },
    depth:  { quick: 0.3, thorough: 0.8, exhaustive: 0.6 },
    rigor:  { loose: 0.3, structured: 0.8, formal: 0.6 },
    outcome:{ deliverable: 0.8, understanding: 0.7, decision: 0.6 },
    keywords: ["hive", "architect bee", "royal jelly", "comb", "plan.md", "approval gate", "agent hive"],
    antiKeywords: [],
    description: "Best for: Agent Hive methodology planning. Architect Bee interviews, gathers context (royal jelly), designs the comb (task breakdown), produces plan.md. You approve before any execution."
  },
  {
    name: "constitution",
    tagline: "Establish project governance — code quality, UX, performance, security principles",
    mode: { clarify: 0.5, explore: 0.3, structure: 0.8, evaluate: 0.6 },
    scope:  { narrow: 0.4, broad: 0.8, vague: 0.5, concrete: 0.6 },
    depth:  { quick: 0.3, thorough: 0.7, exhaustive: 0.6 },
    rigor:  { loose: 0.2, structured: 0.7, formal: 0.8 },
    outcome:{ deliverable: 0.7, understanding: 0.6, decision: 0.8 },
    keywords: ["constitution", "governance", "principles", "standards", "code quality", "guidelines", "rules", "charter"],
    antiKeywords: ["implement", "code"],
    description: "Best for: establishing project governing principles before work begins. Defines code quality, UX, performance, and security standards that feed into spec-driven work."
  }
];

function classify(text) {
  const lower = text.toLowerCase();

  const results = SUBCMDS.map(scmd => {
    let score = 0;

    // Keyword matches
    for (const kw of scmd.keywords) {
      if (lower.includes(kw)) score += 0.15;
    }
    for (const akw of scmd.antiKeywords) {
      if (lower.includes(akw)) score -= 0.1;
    }

    // Mode signals
    if (/\bclarify\b|\bwhat do i\b|\bhelp me understand\b|\bconfused\b|\bnot sure\b/.test(lower)) score += scmd.mode.clarify * 0.12;
    if (/\bexplore\b|\bpossibilities\b|\boptions\b|\bwhat about\b|\bthink of\b/.test(lower)) score += scmd.mode.explore * 0.12;
    if (/\borganize\b|\bbreak down\b|\bstructure\b|\border\b|\blist\b|\btasks\b/.test(lower)) score += scmd.mode.structure * 0.12;
    if (/\bevaluate\b|\bcompare\b|\bpros.*cons\b|\btradeoff\b|\bvs\b|\bassess\b/.test(lower)) score += scmd.mode.evaluate * 0.12;

    // Scope signals
    if (/\bbroad\b|\boverall\b|\bgeneral\b|\bhigh.level\b|\bbig picture\b/.test(lower)) score += scmd.scope.broad * 0.08;
    if (/\bvague\b|\brough\b|\bidea\b|\bthinking about\b/.test(lower)) score += scmd.scope.vague * 0.08;
    if (/\bspecific\b|\bexact\b|\bconcrete\b|\bdetailed\b/.test(lower)) score += scmd.scope.concrete * 0.08;

    // Depth signals
    if (/\bquick\b|\bfast\b|\bsimple\b|\bjust\b/.test(lower)) score += scmd.depth.quick * 0.08;
    if (/\bthorough\b|\bdeep\b|\bcomprehensive\b|\bdetailed\b/.test(lower)) score += scmd.depth.thorough * 0.08;

    // Outcome signals
    if (/\bdeliver\b|\boutput\b|\bproduce\b|\bcreate\b|\bmake\b|\bbuild\b/.test(lower)) score += scmd.outcome.deliverable * 0.08;
    if (/\bunderstand\b|\blearn\b|\bknow\b|\bwhat is\b|\bhow does\b/.test(lower)) score += scmd.outcome.understanding * 0.08;
    if (/\bdecide\b|\bchoose\b|\bpick\b|\bwhich\b|\bbest\b|\brecommend\b/.test(lower)) score += scmd.outcome.decision * 0.08;

    return { name: scmd.name, tagline: scmd.tagline, score, description: scmd.description };
  });

  results.sort((a, b) => b.score - a.score);
  return results;
}

function main() {
  const query = process.argv.slice(2).join(' ') || process.env.REQUEST || '';
  if (!query) {
    console.error('Usage: node route-ideation.mjs "plan the auth system"');
    console.error('   or: REQUEST="explore database tradeoffs" node route-ideation.mjs');
    process.exit(1);
  }

  console.error(`Routing request: "${query}"`);
  console.error('');

  const results = classify(query);
  const top = results[0];

  console.log(JSON.stringify({
    request: query,
    recommended: top.name,
    confidence: Math.round(top.score * 100),
    reason: top.tagline,
    description: top.description,
    ranked: results.slice(0, 5).map(r => ({
      subcommand: r.name,
      score: Math.round(r.score * 100),
    })
  )}, null, 2));
}

main();
