# Per-Repo Deployment Architecture

> How `/init-project` auto-deploys a project-specific OpenCode Hubs configuration into any codebase, with codebase-aware generation, context synthesis, and vector-accelerated retrieval.

## The Problem

The global configuration (`~/.config/opencode/`) is a **runtime engine** — it provides agents, skills, commands, and orchestration. But every project has unique domain language, architecture patterns, coding conventions, testing practices, and external dependencies. A single global config cannot:

- Understand a project's domain jargon
- Know the project's specific framework version and its patterns
- Generate project-aware agent prompts that reference real code modules
- Create test strategies that match the project's test framework
- Provide security rules that know the project's dependency attack surface

The current solution — manual customization via `.opencode/` — requires a user to decompose their entire project's interlocking mechanics and reason through awful jargon before they can productively use AI assistance.

## The Solution: Self-Deploying Agentic Configuration

`/init-project setup --full` becomes a **zero-to-context pipeline** that, for any codebase:

1. **Analyzes** the project to extract architecture, domain language, and conventions
2. **Researches** the detected stack via Context7 MCP for up-to-date patterns
3. **Synthesizes** analysis + research into durable context
4. **Generates** project-specific agents, rules, commands, tools, and skills
5. **Vectorizes** everything into a local sqlite-vec database for semantic retrieval
6. **Verifies** that the generated configuration is coherent and complete

## Architecture

### Global Engine vs Per-Repo Brain

```
~/.config/opencode/                          (RUNTIME ENGINE — never bloated)
├── agents/          → 29 base agents         (generic, no project context)
├── skills/          → 67 workflow skills     (orchestration, planning, execution)
├── commands/        → 6 hub commands          (init, ideation, orchestrate, harvest, project)
├── tools/           → 10 TypeScript tools     (loadSkill, agentContext, etc.)
├── plugins/         → hook system + TUI       (lifecycle, menus)
├── rules/           → 11 shared rules         (shell_strategy, context-strategy, etc.)
└── opencode.jsonc   → main config             (model providers, permissions)

./my-project/                                  (PROJECT'S BRAIN — auto-deployed)
└── .opencode/
    ├── opencode.jsonc      → project config    (extends global)
    ├── AGENTS.md           → project instructions
    ├── agents/             → project-aware agent wrappers
    ├── skills/             → project-specific workflows
    ├── commands/           → project-specific slash commands
    ├── tools/              → project-specific TypeScript tools
    ├── rules/              → project-specific coding style, testing, security
    ├── context/            → durable project knowledge (committed)
    │   ├── frameworks/     → framework-specific patterns
    │   ├── patterns/       → domain patterns and conventions
    │   ├── research/       → fetched library documentation
    │   └── decisions.md    → project ADRs
    ├── .vector/            → sqlite-vec index (gitignored)
    └── state/              → session state (gitignored)
```

### Key Insight

The **global config is the compiler**. The **per-repo config is the compiled binary**. Every project gets a tailored configuration without the global config accumulating static for unreleated projects. This eliminates the need to:

- Maintain a single bloated config covering all projects
- Switch between multiple global config profiles
- Manually decompose project architecture after wrestling with jargon

## The Pipeline: `/init-project setup --full`

### Phase 0: Verify Global Engine
Check that `~/.config/opencode/` is present and healthy. If missing, offer to install.

### Phase 1: Deep Codebase Scan (enhanced)
Beyond basic language/framework detection, extract:
- **Entry points** — main files, app roots, routers, middleware
- **Domain language** — class names, function names, module names, type definitions
- **Architecture patterns** — monolith, microservices, layered, hexagonal, event-driven
- **API surface** — REST endpoints, GraphQL schemas, RPC methods
- **Dependency graph** — direct and transitive dependencies, version matrix
- **Testing patterns** — test framework, mock strategy, coverage thresholds
- **Configuration conventions** — env vars, config files, secrets management
- **Build system** — bundler, transpiler, build scripts, CI/CD pipeline

### Phase 2: Architecture Analysis
Delegated to `@architect` agent:
- Map module dependencies and identify bounded contexts
- Detect architectural drift (layers violating boundaries)
- Identify hot paths and performance-critical sections
- Classify error handling patterns
- Extract transaction boundaries and data flow

### Phase 3: Context Research
Delegated to `@document-specialist` agent via Context7 MCP:
- Fetch official documentation for every detected framework/library
- Extract version-specific API patterns
- Fetch migration guides for detected versions
- Fetch security best practices for dependencies
- Fetch performance optimization patterns for the stack
- **Output**: Raw research saved to `.opencode/context/research/`

### Phase 4: Context Synthesis
Combine analysis + research into structured knowledge:
- **Framework conventions** → `.opencode/context/frameworks/{name}.md`
  - Version-specific API patterns
  - Configuration conventions
  - Common pitfalls and solutions
- **Domain patterns** → `.opencode/context/patterns/`
  - Domain language glossary
  - Architecture decisions and rationale
  - Discovered anti-patterns
- **Project ADRs** → `.opencode/context/decisions.md`
  - Key architectural decisions extracted from analysis
- **Vector index** → `.opencode/.vector/context.db` (sqlite-vec)
  - All context files automatically indexed for semantic search
  - Agents use `queryChunks()` for context-aware retrieval

### Phase 5: Agent Generation
Generate project-specific agent wrappers in `.opencode/agents/`:

```markdown
# @project-architect
AgentPrompt for project-aware architecture agent.
Includes: project domain language, architecture patterns, key modules,
bounded contexts, data flow, and design conventions.
```

Each wrapper extends the global base agent with:
- Project domain language embedded in instructions
- Key module paths and their responsibilities
- Coding conventions and architectural constraints
- Testing patterns and coverage expectations
- Reference to context files for semantic retrieval

Generated agents include:
| Agent | Purpose |
|-------|---------|
| `@project-architect` | Architecture-aware decisions referencing real project structure |
| `@project-executor` | Implementation with project conventions baked in |
| `@project-critic` | Review against project's actual standards |
| `@project-debugger` | Root cause analysis knowing the project's architecture |
| `@project-tester` | Test generation matching project's test patterns |

### Phase 6: Rule Generation
Generate project-specific rules in `.opencode/rules/`:

```markdown
# .opencode/rules/coding-style.md
- Naming conventions: camelCase for variables, PascalCase for components
- File organization: feature-first, one component per file
- Error handling: Result<T,E> pattern, no raw throws
- ...

# .opencode/rules/testing.md
- Framework: vitest
- Patterns: describe/it blocks, factory functions for fixtures
- Coverage target: 85%
- ...

# .opencode/rules/security.md
- Auth: JWT with refresh tokens
- Input: zod schema validation required
- SQL: Drizzle ORM (no raw SQL)
- ...
```

### Phase 7: Tool + Command Generation
Generate project-specific TypeScript tools:

- Database migration tools
- API client generators
- Build/deploy helper tools
- Custom slash commands for project workflows (e.g., `/build`, `/deploy staging`, `/migrate`)

### Phase 8: Skill Generation
Generate project-specific reusable skills:

- Build pipeline skill (project-specific build/test/deploy)
- Database operation skills
- Domain-specific workflow skills (e.g., "create new payment flow", "add API endpoint")

### Phase 9: Verification
Validate every generated artifact:

- All file references resolve
- Config syntax is valid
- Agent definitions have valid model references
- Skills have valid workflows
- Tools compile (TypeScript check)
- Vector DB indexes all context files
- `.opencode/state/` is gitignored

## How It Solves Specific Problems

### "I don't want global config bloat"

Each project gets its own `.opencode/` with only what it needs. The global config remains a lean engine with 29 agents, 67 skills, 6 commands — generic tools that work for any project. Project specifics go in `.opencode/`.

### "I don't want to decompose my project's mechanics"

`/init-project setup --full` does it automatically:
1. Scans every file, extracts patterns
2. Fetches documentation for every dependency
3. Synthesizes structured knowledge
4. Generates agents that already understand your domain

### "I don't want to wrestle with jargon"

The system extracts your project's actual domain language from:
- Type/class/function names
- Module names and directory structure
- API endpoint patterns
- Comments and documentation
- Configuration key names

This becomes the vocabulary your agents speak. No manual glossary creation.

### "I want agents that understand my niche project"

Agents aren't generic anymore — they're generated with:
- Your project's exact file structure embedded
- Your domain language in their instructions
- Your architecture constraints as rules
- Vector-indexed context for semantic retrieval

### "I want this to work for any project type"

The system is language- and framework-agnostic:
- Detection handles any language (via file extension analysis)
- Research fetches docs for any framework (via Context7 MCP)
- Rules are generated from detected conventions, not templates
- Agents are scaffolded from detected architecture, not hardcoded patterns

## Implementation Plan

### Phase 1: Enhanced Codebase Scanner

Replace the current basic detection with a multi-pass scanner:
1. **Pass 1: File enumeration** — glob all source files, test files, config files
2. **Pass 2: Language detection** — map extensions to languages, detect polyglot projects
3. **Pass 3: Framework detection** — analyze imports, dependencies, config files
4. **Pass 4: Architecture detection** — analyze module structure, entry points, routers
5. **Pass 5: Domain extraction** — extract type/class/function names for domain language
6. **Pass 6: Pattern extraction** — analyze commit history for conventions, detect test patterns

Output: `init-detection-full.json` with comprehensive project profile.

### Phase 2: Context Research Engine

New sub-skill `context-research`:
1. Parse detection results for every unique dependency
2. Query Context7 MCP for each dependency's documentation
3. Filter and deduplicate results
4. Save to `.opencode/context/research/{dependency-slug}.md`
5. Trigger vector auto-indexing

### Phase 3: Context Synthesis Engine

New sub-skill `context-synthesize`:
1. Combine analysis JSON + research docs + codebase patterns
2. Generate framework convention files
3. Generate pattern files
4. Generate ADR entries
5. Generate architect's operating theory (`context/theory.md`)

### Phase 4: Artifact Generator

Enhanced `provision.mjs` with:
1. Agent generation from project profile
2. Rule generation from detected conventions
3. Tool/command generation from detected workflows
4. Skill generation from detected domain operations

### Phase 5: Vector Integration

Already partially implemented via `veclib.mjs`:
1. After context synthesis, auto-call `ensureIndexed()`
2. Agents reference `queryChunks()` for semantic retrieval
3. Vector DB auto-refreshes on context changes

## File Layout After Deployment

```
./my-project/
└── .opencode/
    ├── opencode.jsonc              # Project config (model overrides, tool paths, skill paths)
    ├── AGENTS.md                   # Project instructions (auto-generated + manual sections)
    ├── agents/
    │   ├── project-architect.md    # Architecture-aware agent
    │   ├── project-executor.md     # Convention-aware implementer
    │   ├── project-critic.md       # Project-standard reviewer
    │   ├── project-debugger.md     # Architecture-aware debugger
    │   └── project-tester.md       # Test-pattern-aware tester
    ├── skills/
    │   ├── build/SKILL.md          # Build pipeline skill
    │   ├── deploy/SKILL.md         # Deploy workflow skill
    │   └── migrate/SKILL.md        # Database migration skill
    ├── commands/
    │   ├── build.md                # /build — project build command
    │   └── deploy.md               # /deploy — deployment command
    ├── tools/
    │   ├── project-migrate.ts      # Migration tool
    │   └── project-deploy.ts       # Deployment tool
    ├── rules/
    │   ├── coding-style.md         # Project coding conventions
    │   ├── testing.md              # Test framework and patterns
    │   ├── security.md             # Auth, input validation, secrets
    │   └── architecture.md         # Domain model, bounded contexts
    ├── context/
    │   ├── frameworks/
    │   │   ├── nextjs.md           # Next.js conventions for this project
    │   │   ├── drizzle.md          # Drizzle ORM patterns in use
    │   │   └── tailwind.md         # Tailwind conventions detected
    │   ├── patterns/
    │   │   ├── domain-language.md  # Extracted domain terms with definitions
    │   │   ├── error-handling.md   # Error handling patterns in use
    │   │   └── api-patterns.md     # API endpoint conventions
    │   ├── research/
    │   │   ├── nextjs-docs.md      # Fetched Next.js documentation
    │   │   ├── drizzle-docs.md     # Fetched Drizzle documentation
    │   │   └── tailwind-docs.md    # Fetched Tailwind documentation
    │   └── decisions.md            # Project ADRs
    ├── .vector/
    │   └── context.db              # sqlite-vec index (gitignored)
    └── state/                      # Session state (gitignored)
```

## Benefits Summary

| Concern | Before | After |
|---------|--------|-------|
| **Global config size** | Bloated with project-specific artifacts | Lean engine (agents, skills, commands, tools, rules stay generic) |
| **Per-project setup** | Manual decomposition of project architecture | Zero-touch: `/init-project setup --full` does everything |
| **Agent effectiveness** | Generic agents with no project context | Agents with project domain language, conventions, and architecture embedded |
| **Context retrieval** | Manual README/comment reading | Vector-accelerated semantic search over synthesized project knowledge |
| **Documentation currency** | Stale external docs in context | Auto-fetched via Context7 MCP on initialization |
| **Multi-project support** | Config switching or single bloated config | Each project gets its own tailored `.opencode/` |
| **Domain understanding** | Requires user to explain project jargon | Auto-extracted from codebase + dependencies |
| **Niche/specialized projects** | Struggle to get AI help without massive prompt setup | Full context generated automatically |

## Migration Path

1. **Phase 1** (current): Enhanced scanner + research modules
2. **Phase 2**: Context synthesis engine
3. **Phase 3**: Artifact generator upgrades in `provision.mjs`
4. **Phase 4**: Integration testing across 5 diverse project types
5. **Phase 5**: Documentation and rollout

The architecture is designed for incremental deployment — each phase adds capability without breaking existing workflows.