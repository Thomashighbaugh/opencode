import { HubDefinition } from "./hub-data"

const hub: HubDefinition = {
  name: "ideation",
  description: "Planning, research, and ideation hub",
  stateDir: "ideation",
  subcommands: [
    { label: "plan", description: "Interview-style strategic planning — clarify goals, break into tasks", skill: "plan", reminder: "Strategic planning: clarify goals → ordered tasks." },
    { label: "brainstorm", description: "Free-form idea generation — throw ideas at the wall on any topic, then cluster and prioritize", inline: true, reminder: "Generate, cluster, and prioritize ideas." },
    { label: "decomposition", description: "Decompose a task into actionable subtasks — break complex work into ordered, verifiable steps", inline: true, reminder: "Break complex tasks into actionable subtasks." },
    { label: "refine", description: "Diverge/converge iteration — expand ideas, then sharpen them", skill: "idea-refine", reminder: "Diverge and converge to sharpen ideas." },
    { label: "overhaul", description: "Analyze project across 8 refinement dimensions — architecture, performance, security, code quality, testing, deps, DX — and produce a prioritized phased implementation plan", skill: "overhaul", reminder: "Analyze project and produce phased improvement plan." },
    { label: "deep", description: "Socratic interview with ambiguity gating — crystallize vague requirements", skill: "deep-interview", reminder: "Socratic interview to crystallize requirements." },
    { label: "graph", description: "Visual relationship mapping — dependencies, components, tradeoffs", skill: "graph-thinking", reminder: "Map relationships as visual graphs." },
    { label: "research", description: "Multi-model synthesis — diverse perspectives merged into one answer", skill: "ccg", reminder: "Synthesize diverse model perspectives." },
    { label: "ralplan", description: "Consensus planning gate — validate plan is concrete enough to execute", skill: "ralplan", reminder: "Validate plan concreteness via consensus." },
    { label: "ddd", description: "Domain-driven design — model bounded contexts, aggregates, domain events", inline: true, reminder: "Model bounded contexts and domain events." },
    { label: "event-storming", description: "Collaborative domain exploration via timeline, commands, events, policies", inline: true, reminder: "Explore domain via event timeline." },
    { label: "double-diamond", description: "Design Council framework — discover, define, develop, deliver", inline: true, reminder: "Discover, define, develop, deliver." },
    { label: "jtbd", description: "Jobs-to-be-done — frame requirements around customer functional jobs", inline: true, reminder: "Frame requirements around customer jobs." },
    { label: "impact-mapping", description: "Why-who-how-what goal mapping — trace deliverables to business impact", inline: true, reminder: "Map goals to business impact." },
    { label: "spiral", description: "Risk-driven iterative planning — each cycle targets highest-risk items first", inline: true, reminder: "Risk-driven iterative planning cycles." },
    { label: "top-down", description: "Decompose from high-level vision into components and sub-systems", inline: true, reminder: "Decompose vision into components top-down." },
    { label: "bottom-up", description: "Build up from existing primitives and capabilities into composed systems", inline: true, reminder: "Compose systems from existing primitives." },
    { label: "adversarial-debate", description: "Spec validation via oppositional debate — proposer vs security/performance critics with judge convergence", inline: true, reminder: "Validate specs via adversarial debate." },
    { label: "cleanroom", description: "Formal correctness with box structures — black box → state box → clear box, statistical usage testing, MTTF certification", inline: true, reminder: "Formal correctness via box structures." },
    { label: "pwf", description: "Planning-with-files — treat filesystem as disk, context window as RAM; three-file pattern with quality-gated convergence and session recovery", inline: true, reminder: "Plan with files as persistent disk." },
    { label: "rpikit", description: "Research-Plan-Implement with stakes-based rigor scaling and 'Iron Law' — don't touch code until problem is understood", inline: true, reminder: "Research-Plan-Implement with stakes rigor." },
    { label: "hive", description: "Agent Hive planning — Architect Bee phase: interview, discover, context-gather, produce plan.md with approval gate before execution", inline: true, reminder: "Architect Bee: plan with approval gate." },
    { label: "story-mapping", description: "User story mapping — arrange features along a user journey spine, prioritize by release for iterative delivery", inline: true, reminder: "Map features along user journey." },
    { label: "lean-canvas", description: "Lean business model canvas — one-page framework for problem, solution, key metrics, and competitive advantage", inline: true, reminder: "One-page lean business model canvas." },
    { label: "constitution", description: "Establish project governance — code quality, UX, performance, and security principles as input to spec-driven work", inline: true, reminder: "Establish project governance principles." },
    { label: "quality", description: "Deep-dive code quality audit — complexity hotspots, duplication clusters, naming violations, error handling gaps across the codebase", inline: true, reminder: "Deep-dive code quality analysis across the codebase." },
    { label: "architecture", description: "Analyze codebase for architectural friction, propose module-deepening refactors via John Ousterhout's deep module principle — parallel sub-agents explore, generate candidate refactors, produce markdown tables for comparison, then grill through your pick", skill: "improve-codebase-architecture", reminder: "Surface deepening opportunities with markdown comparison tables." },
    { label: "redesign", description: "Audit and upgrade existing websites/apps to premium design standards — scan codebase, diagnose generic AI patterns (overused gradients, Lucide icons, centered card columns), apply targeted upgrades without breaking functionality", skill: "redesign-existing-projects", reminder: "Audit and upgrade to premium design standards." },
    { label: "grill", description: "Stress-test a plan or design via relentless one-at-a-time questioning — walk down each branch of the design tree, resolve dependencies between decisions, provide recommended answers. Use before building to surface hidden assumptions", skill: "grilling", reminder: "Grill plans relentlessly until shared understanding." },
    { label: "modularity", description: "Analyze module boundaries, coupling and cohesion — detect circular dependencies, suggest reorganization for cleaner module isolation", agent: "architect", reminder: "Analyze module boundaries and coupling." },
    { label: "arch-prep", description: "Architecture preparation for upcoming features — design extension points, plan module additions, anticipate refactoring runway before coding", agent: "architect", reminder: "Design architecture to accommodate upcoming features." },
    { label: "web-research", description: "Multi-source web research — search multiple queries in parallel via websearch, fetch top results via webfetch, synthesize findings into a structured research report saved to .opencode/state/ideation/work-products/", inline: true, reminder: "Search, fetch, and synthesize web research into a structured report." },
    { label: "tech-eval", description: "Technology evaluation — research a library/framework/tool via websearch + webfetch, compare against alternatives, produce structured evaluation with pros/cons/recommendations", inline: true, reminder: "Research and evaluate technologies with structured comparison." },
    { label: "competitive-analysis", description: "Competitive landscape analysis — research competitors via websearch, fetch product pages/docs via webfetch, produce structured competitive analysis with feature comparison matrix", inline: true, reminder: "Research competitors and produce feature comparison matrix." },
    { label: "tree-of-thoughts", description: "⚠️ EXPENSIVE: Explore multiple solution branches in parallel (~10× cost). Warns user and asks for confirmation before proceeding. Use for open-ended design problems where the best path is unclear", skill: "tree-of-thoughts", reminder: "Branching exploration with cost warning." },
    { label: "opro", description: "⚠️ EXPENSIVE: Generate prompt variations and test each against a benchmark (~many× cost). Warns user and asks for confirmation before proceeding. Use for prompt optimization and periodic maintenance", skill: "opro", reminder: "Prompt optimization with cost warning." },
    { label: "resume", description: "Resume last ideation session", inline: true, reminder: "Resume last ideation session." },
    { label: "status", description: "Show current ideation state", inline: true, reminder: "Show ideation state." }
  ]
}

export default hub
