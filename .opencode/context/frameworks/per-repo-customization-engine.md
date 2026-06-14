# Per-Repo Customization Engine — Expanded Architecture

> 11 multifaceted approaches for making `/init-project` a zero-touch codebase-aware deployment system that generates project-specific agents, rules, commands, tools, skills, and vector-indexed context — without global config bloat or manual decomposition.

---

## Table of Approaches

| # | Approach | Depth | Payoff |
|---|----------|-------|--------|
| 1 | Multi-Pass Codebase Scanner | Foundation | Complete project profile (language → architecture → domain) |
| 2 | Dependency Graph with Version-Specific Context Research | Research | Every library's exact version docs cached locally |
| 3 | Heuristic Convention Detector | Rules | Coding/testing patterns extracted automatically |
| 4 | Domain Language Extraction (NLP-Lite) | Agents | Agents speak the project's actual jargon |
| 5 | Architecture Pattern Classification | Architecture | Agent prompts reference real module boundaries |
| 6 | Bootstrap Agent Generator | Agents | Zero-shot agents that already know the project |
| 7 | Checkpointed Multi-Stage Pipeline | Reliability | Resume from any phase, never redo work |
| 8 | Cross-Phase Consistency Verification | Reliability | Every generated artifact references real files |
| 9 | Lazy Vector Index with Auto-Merge | Retrieval | Semantic search over synthesized context |
| 10 | Provision Dry-Run + Diff Review | Safety | Preview changes before generating |
| 11 | Post-Production Feedback Loop | Durability | Detect stale context, re-index, repair gaps |

---

## Approach 1: Multi-Pass Codebase Scanner (Foundation)

The current scanner does a single pass — file extension → language → framework. Too shallow.

### Design

A **6-pass pipeline**, each pass building on the previous:

**Pass 1 — File Enumeration**
- Glob everything: `**/*.{ts,js,py,go,rs,java,kt,tsx,jsx,vue,svelte,php,rb,c,cpp,h,hpp,swift}`
- Separate into: source, test, config, docs, build, generated
- Detect monorepo: multiple `package.json`, `Cargo.toml`, `go.mod` in subdirectories

**Pass 2 — Language & Framework Detection**
- Extension → language mapping
- `package.json` → framework (Next.js, Express, Vue, SvelteKit, etc.)
- `Cargo.toml` → Rust framework (Actix, Axum, Rocket, Leptos)
- `go.mod` → Go framework (Gin, Echo, Fiber, Chi)
- `pom.xml`/`build.gradle` → Java framework (Spring, Quarkus, Micronaut)
- `*.tf` → Terraform, `Dockerfile` → containerized, `.github/workflows` → CI
- **Output confidence**: `{ language: "TypeScript", confidence: 1.0, alternatives: [] }`

**Pass 3 — Module Structure & Architecture Detection**
- Parse `import`/`require` statements to build a dependency graph between files
- Detect entry points: `main.ts`, `app.ts`, `index.ts`, `routes/`, `pages/`, `pages/api/`
- Detect layer boundaries: `services/`, `repositories/`, `controllers/`, `middleware/`
- Classify architecture:
  - **Monolith**: single package, flat structure
  - **Layered**: clear `services/repositories/controllers/presenters` separation
  - **Feature-based**: `features/{feature}/{components,api,types}/`
  - **Hexagonal/Ports-Adapters**: `core/`, `adapters/`, `ports/`
  - **Microservices**: multiple packages with independent entry points
  - **Clean Architecture**: `entities/`, `use-cases/`, `interface-adapters/`, `frameworks/`
- Detect data flow: which modules import which, identify circular dependencies

**Pass 4 — API Surface Extraction**
- Parse route/method definitions:
  - Express: `app.get(...)`, `router.post(...)`
  - Next.js: `pages/api/*.ts`, `app/api/*/route.ts`
  - FastAPI: `@app.get(...)`, `@router.post(...)`
  - GraphQL: `resolvers/`, `schema.graphql`, `typeDefs`
  - tRPC: `router({...})`, `procedure()`
- Extract: method, path, handler module, middleware stack
- Generate: API route map (JSON) saved to detection output

**Pass 5 — Database & Schema Detection**
- Parse schema definitions:
  - Prisma: `schema.prisma` models + relations
  - Drizzle: schema files, relations
  - TypeORM: entity decorators
  - SQLAlchemy: model classes
  - Raw SQL: migration SQL files
- Detect: tables, relations, indexes, enums, migration strategy
- Output: `{ database: "PostgreSQL", orm: "Prisma", models: ["User", "Post", "Comment"], relations: [...] }`

**Pass 6 — Error Handling & Testing Pattern Extraction**
- Scan for try/catch vs Result types vs Either vs error middleware
- Detect test framework: vitest, jest, pytest, cargo test, go test, unittest
- Detect mocking strategy: mocks directory, factories, fixtures, testcontainers
- Detect coverage thresholds from config files
- Extract: `{ testFramework: "vitest", mockPattern: "mocks/", coverageTarget: 80, errorPattern: "Result<T,E>" }`

### Output

A single `init-detection.json` with all 6 passes' results:

```json
{
  "projectName": "my-app",
  "monorepo": false,
  "languages": [{ "name": "TypeScript", "version": "5.7", "confidence": 1.0 }],
  "framework": { "name": "Next.js", "version": "15.2", "confidence": 1.0 },
  "architecture": {
    "pattern": "feature-based",
    "layers": ["pages", "components", "lib", "features"],
    "entryPoints": ["src/app/page.tsx", "src/app/layout.tsx"],
    "apiRoutes": [
      { "method": "GET", "path": "/api/users", "handler": "app/api/users/route.ts" },
      { "method": "POST", "path": "/api/users", "handler": "app/api/users/route.ts" }
    ]
  },
  "database": {
    "type": "PostgreSQL",
    "orm": "Prisma",
    "models": ["User", "Post", "Comment", "Tag"],
    "migrationTool": "prisma migrate"
  },
  "testing": {
    "framework": "vitest",
    "mockPattern": "src/mocks/",
    "coverageTarget": 80,
    "errorPattern": "tryCatch → Result<T,E>"
  },
  "buildSystem": "turbopack",
  "ciConfig": "GitHub Actions (test.yml, deploy.yml)",
  "packageManager": "pnpm",
  "deployment": "Vercel (production, preview)",
  "directories": {
    "source": "src/",
    "test": "src/__tests__/",
    "config": "config/",
    "build": "dist/"
  },
  "confidence": "high"
}
```

---

## Approach 2: Dependency Graph with Version-Specific Context Research

Current behavior: detect the framework name. Proposed: resolve every dependency's exact version, fetch docs for that specific version, cache locally.

### Design

**Phase A: Dependency Resolution**
- Parse `package.json` → read exact versions from lockfile (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`)
- Parse `Cargo.toml` → `Cargo.lock`
- Parse `go.mod` → `go.sum`
- Parse `requirements.txt`/`pyproject.toml` → pinned versions
- **Output**: `{ dependencies: { "next": "15.2.1", "react": "19.0.0", "prisma": "6.5.0", ... } }`

**Phase B: Context Research Routing**
For each unique dependency:
1. If it's a framework (next, react, vue, express, etc.) → fetch architecture docs
2. If it's a library (zod, drizzle, dayjs, etc.) → fetch API docs
3. If it's a tool (eslint, prettier, vitest) → fetch configuration docs
4. If it's a cloud service (Vercel, AWS, Supabase) → fetch deployment docs

**Phase C: Multi-Stage Fetch**

| Stage | What | How |
|-------|------|-----|
| 1 | Framework docs | Context7 MCP (`resolve-library-id` + `query-docs`) |
| 2 | Library API docs | Context7 MCP for key libraries |
| 3 | Migration guides | Context7 MCP with "migration from v{current} to v{latest}" |
| 4 | Security advisories | npm audit / `gh security advisories` for CVEs in deps |
| 5 | Performance patterns | Web search for framework-specific optimization guides |

**Phase D: Deduplication & Summarization**
- If 5 dependencies produce overlapping content → merge into one framework doc
- Truncate to MVI format (Most Valuable Information — under 200 lines)
- Save to `.opencode/context/research/{dependency-name}.md`

### Reliability Measures

| Problem | Solution |
|---------|----------|
| Context7 MCP fails | Retry 3x with exponential backoff |
| No docs found | Save a stub: `{name}: no docs found, research manually` |
| API rate limit | Queue fetches, 1 per second |
| Network disconnected | Skip research phase, mark detection with `researchSkipped: true` |

### Output

```json
{
  "research": {
    "fetched": ["next.js", "react", "prisma", "zod", "vitest", "tailwindcss"],
    "failed": ["obscure-lib-v0.1.0"],
    "skipped": ["react-dom", "@types/node", "eslint-config-next"],
    "totalFiles": 6,
    "totalTokens": 45000
  }
}
```

---

## Approach 3: Heuristic Convention Detector (Rules)

Instead of generating generic rules, detect **actual conventions used in the codebase** and codify them.

### Detection Heuristics

**Naming Conventions**
- Scan 200 random function/variable/class/interface names across the codebase
- Detect: camelCase / snake_case / PascalCase / kebab-case / UPPER_CASE
- Detect patterns: `use*` for hooks, `is*` for booleans, `get*` for accessors, `handle*` for event handlers
- Output: `{ variables: "camelCase", functions: "camelCase", classes: "PascalCase", types: "PascalCase", constants: "UPPER_CASE", hooks: "use*", booleans: "is*|has*|can*" }`

**Import Style Detection**
- Named vs default exports ratio
- Absolute vs relative imports
- Barrel files (`index.ts`) usage
- Path alias usage (`@/`, `~/`, `@app/`)
- Output: `{ defaultExports: 0.3, namedExports: 0.7, pathAliases: ["@/"], barrelFiles: true }`

**Error Handling Patterns**
- try/catch blocks percentage
- `.catch()` chains (Promise-based)
- Result/Option type usage
- Error boundary components (React)
- Global error middleware (Express/Fastify)
- Output: `{ pattern: "Result<T,E>", globalHandler: "middleware/errorHandler.ts", boundaries: ["ErrorBoundary.tsx"] }`

**Testing Conventions**
- describe/it vs test() usage ratio
- Factory/ fixture patterns
- Mock import patterns
- Coverage config from vitest.config.ts/jest.config.ts
- Output: `{ framework: "vitest", pattern: "describe/it", mockPattern: "vi.mock()", fixtures: "src/test/factories/", coverageCommand: "pnpm vitest --coverage" }`

**Comment & Documentation Style**
- JSDoc/TSDoc usage percentage
- Inline comment frequency (comments per 100 LOC)
- README structure detection
- Output: `{ jsDocUsage: 0.6, commentFrequency: 2.3, docsDir: "docs/" }`

### Rule Generation

Each detected heuristic generates a project-specific rule file:

```markdown
# .opencode/rules/coding-conventions.md
## Naming
- Variables: camelCase
- Functions: camelCase (prefix hooks with `use`)
- Types/Interfaces: PascalCase
- Constants: UPPER_CASE
- Booleans: prefix with `is`, `has`, `can`

## Imports
- Use `@/` path alias for internal modules
- Prefer named exports
- Barrel files via `index.ts` in feature directories

## Error Handling
- Use `Result<T, E>` type for fallible operations
- Global error handler in `middleware/errorHandler.ts`
- React error boundaries for UI failures
```

---

## Approach 4: Domain Language Extraction (NLP-Lite)

Make agents speak the project's actual domain language without a manual glossary.

### Method A: Frequency-Based Extraction

Count the top 50 most frequent **noun phrases** across the codebase:

```bash
# Simple extraction: class names, type names, function names
src/services/ PaymentService, InvoiceService, SubscriptionService
src/types/    User, Invoice, Subscription, PaymentMethod, BillingCycle
src/utils/    calculateTotal, applyDiscount, generateInvoice
```

Generated context entry:
```markdown
# Domain Language
| Term | Category | Used In |
|------|----------|---------|
| Invoice | Entity | services/, types/, components/ |
| Subscription | Entity | services/, types/, api/ |
| BillingCycle | Value Object | types/, utils/ |
| PaymentMethod | Value Object | types/, services/ |
| calculateTotal | Service Method | utils/invoice.ts |
```

### Method B: Module-Co-occurrence Graph

Build a graph of which modules import which, then extract domain clusters:

```
invoices/   ←→ payments/   ←→ subscriptions/
    ↓                           ↓
customers/                  billing/
```

Each cluster becomes a domain concept. Generated agent prompt:
```
"This project has 4 domain clusters: Invoicing (invoices/, billing/, payments/),
Customer Management (customers/, auth/), Subscriptions (subscriptions/, plans/),
and Notifications (emails/, push/)."
```

### Method C: API Endpoint Language

Extract domain language from API routes:
```
GET    /api/invoices         → "invoices"
POST   /api/invoices/:id/pay → "pay invoice"
PUT    /api/subscriptions    → "subscriptions"
DELETE /api/users/:id        → "users"
```

These become the vocabulary for agent prompts about the API surface.

---

## Approach 5: Architecture Pattern Classification

Detect the architectural style and embed it in agent prompts.

### Classification Algorithm

```python
def classify_architecture(modules, imports, entry_points):
    scores = {
        "layered": score_layered(modules),      # services/, repositories/
        "feature": score_feature(modules),       # features/{name}/{...}
        "hexagonal": score_hexagonal(modules),   # core/, ports/, adapters/
        "clean": score_clean(modules),           # entities/, use-cases/
        "microservices": score_microservices(packages, entry_points),
        "event-driven": score_event_driven(imports),  # event bus, pub/sub
    }
    return max(scores, key=scores.get)
```

### Generated Architecture Rule

```markdown
# .opencode/rules/architecture.md
This project follows a **feature-based architecture**:

src/
├── features/
│   ├── invoices/     # Invoice CRUD, PDF generation, email delivery
│   ├── payments/     # Payment processing, refunds, reconciliation
│   ├── customers/    # Customer profiles, preferences, history
│   └── subscriptions/ # Plan management, billing cycles, renewals
├── shared/           # Shared UI components, utilities, types
├── app/              # Next.js App Router pages and API routes
└── middleware/       # Global middleware (auth, logging, error handling)

Key constraints:
- Features import from shared/ but NOT from other features
- API routes in app/api/ delegate to feature modules
- Database access through Prisma service layer
```

### Agent Prompt Injection

The architecture classification is embedded into every generated agent:

```markdown
# @project-executor
You are working on a [feature-based] project.
The codebase is organized into:
- features/invoices/ — ...
- features/payments/ — ...
- shared/ — shared UI + utilities

When adding new functionality:
1. Place feature code in the appropriate features/{name}/ directory
2. Place shared code in shared/
3. Follow the existing import conventions
```

---

## Approach 6: Bootstrap Agent Generator

Generate agents that already understand the project without requiring any user input.

### Scaffold Templates

Each agent template references the detection output:

```
# .opencode/agents/project-executor.md
---
description: Project-aware implementation agent for {projectName} ({framework})
model: {suggestedModel}
---

<Agent_Prompt>
  <Role>
    You are a {language} developer specialized in {framework} v{version}.
    This project follows a {architecture} architecture.
  </Role>

  <Project_Context>
    - Language: {language} {version}
    - Framework: {framework} {version}
    - Package Manager: {packageManager}
    - Architecture: {architecture} ({description})
    - API Pattern: {apiPattern}
    - Database: {database} via {orm}
    - Testing: {testFramework}
    - Error Handling: {errorPattern}
  </Project_Context>

  <Directory_Map>
    {generated directory tree with key files}
  </Directory_Map>

  <Coding_Conventions>
    {generated from heuristic detector}
  </Coding_Conventions>

  <Known_Patterns>
    {generated from pattern extraction}
  </Known_Patterns>
</Agent_Prompt>
```

### Generated Agents

| Agent | Prompt Injection | Purpose |
|-------|-----------------|---------|
| `@project-architect` | Architecture rules + domain clusters + dependency graph | Architecture decisions |
| `@project-executor` | Directory map + naming conventions + imports | Implementation |
| `@project-critic` | Architecture rules + error patterns + test conventions | Review |
| `@project-debugger` | Module map + error handling patterns + known issues | Root-cause analysis |
| `@project-tester` | Test conventions + mock patterns + coverage targets | Test generation |
| `@project-documenter` | Domain language + API routes + schema | Documentation |

---

## Approach 7: Checkpointed Multi-Stage Pipeline (Reliability)

The generation pipeline must survive failures, interruptions, and partial completions.

### Design

Each phase writes a checkpoint file before proceeding. On resume, skip completed phases.

```json
// .opencode/state/init/provision-checkpoint.json
{
  "version": 2,
  "pipelineId": "a1b2c3d4",
  "started": "2026-06-14T10:00:00Z",
  "completedPhases": [1, 2, 3],
  "currentPhase": 4,
  "phases": {
    "1_scan": {
      "status": "completed",
      "output": ".opencode/state/init/init-detection.json",
      "duration": 4500,
      "errors": []
    },
    "2_research": {
      "status": "completed",
      "output": ".opencode/context/research/",
      "duration": 120000,
      "errors": ["obscure-lib: no docs found"],
      "skipped": ["@types/node", "eslint-config-next"]
    },
    "3_analyze": {
      "status": "completed",
      "output": ".opencode/state/init/provision-plan.json",
      "duration": 3000,
      "errors": []
    },
    "4_generate": {
      "status": "in_progress",
      "subphases": {
        "agents": "pending",
        "rules": "pending",
        "tools": "pending",
        "commands": "pending",
        "skills": "pending"
      }
    },
    "5_verify": {
      "status": "pending"
    }
  },
  "heartbeat": {
    "lastPhaseUpdate": "2026-06-14T10:05:00Z",
    "lastToolCall": "2026-06-14T10:04:55Z"
  }
}
```

### Resume Behavior

| Scenario | Behavior |
|----------|----------|
| `resume` subcommand | Load checkpoint, continue from `currentPhase` |
| Idempotent re-run | Skip completed phases, re-run incomplete/failed |
| Phase failure → rerun | `--retry-failed` flag: only redo failed phases |
| Force full re-run | `--force` flag: clear checkpoint, start from phase 0 |

### Error Recovery Per Phase

| Phase | Error Handling |
|-------|---------------|
| Scan (1) | Mark with `warnings: [...]`, continue with partial data |
| Research (2) | Skip failed deps, mark `researchSkipped: true`, continue |
| Analyze (3) | Log analysis gaps, use defaults for missing data |
| Generate (4) | Skip individual artifact failures, log to `errors` |
| Verify (5) | Report all failures, do NOT proceed — require user intervention |

---

## Approach 8: Cross-Phase Consistency Verification (Reliability)

Every generated artifact must reference real files and valid configurations.

### Verification Checks

**Phase 5 runs after generation completes:**

```
CHECK 1: Agent definitions reference valid models
  → All agent models exist in opencode.jsonc provider lists
  → If model not found, warn + suggest alternative

CHECK 2: Rule files reference real project paths
  → Any path in a rule file must exist in the project
  → e.g., "Source files in src/" — must verify src/ exists

CHECK 3: Skill workflows reference real scripts
  → Every script referenced in SKILL.md must exist on disk
  → Every tool name must be exported from its .ts file

CHECK 4: Generated AGENTS.md parent refs resolve
  → `<!-- Parent: ../AGENTS.md -->` — must trace to a real file

CHECK 5: Vector DB indexes all context files
  → Run `ensureIndexed()`, verify `totalChunks > 0`

CHECK 6: TypeScript tools compile
  → `bun build --check .opencode/tools/*.ts` (or equivalent)

CHECK 7: No orphaned references
  → If rule says "See services/payment.ts", that file must exist

CHECK 8: Docker/CI files have corresponding tool entries
  → If Dockerfile detected, deploy tool should reference docker
  → If CI config detected, ci tool should reference workflows
```

### Verification Report

```markdown
# Provision Verification Report
Generated: 2026-06-14

✓ PASS (8/8 checks)

| Check | Status | Detail |
|-------|--------|--------|
| Agent models valid | ✓ | 6 agents → all reference available models |
| Rule paths real | ✓ | 0 missing paths in 4 rule files |
| Skill scripts exist | ✓ | 3 skills → all scripts found |
| AGENTS.md parent refs | ✓ | All 7 parent refs resolve |
| Vector DB indexed | ✓ | 12 files → 342 chunks |
| Tools compile | ✓ | 3 tools → 0 errors, 0 warnings |
| No orphaned refs | ✓ | 0 dangling references |
| Docker/CI coverage | ✓ | Dockerfile → deploy tool references docker |
```

---

## Approach 9: Lazy Vector Index with Auto-Merge (Retrieval)

Current `veclib.mjs` indexes by file-level chunks. Expand to cross-file merging.

### Design

**Index Layers:**

| Layer | Content | Chunk Size | Purpose |
|-------|---------|------------|---------|
| L1 — File headers | Title + description + first 50 lines | ~100 tokens | Fast relevance filtering |
| L2 — Section chunks | H2/H3 sections from all context files | ~300 tokens | Precise retrieval |
| L3 — Cross-file merges | Related content from multiple files | ~500 tokens | Synthesis queries |

**Cross-file merge algorithm:**

When a query matches content in 3+ files within the same subdirectory, merge them into a single synthetic chunk:
```
Query: "how do I add a new payment method?"
→ Matches: research/prisma.md, patterns/domain-language.md, frameworks/nextjs.md
→ Merged chunk: "Payment flow context: [Prisma model patterns] + [domain terms] + [API route patterns]"
```

**Auto-merge triggers:**
- Query matches 3+ files → merge
- Files have same creation timestamp → merge (likely written together)
- Files cross-reference each other → merge

### Storage

```
.opencode/.vector/
├── context.db              # sqlite-vec chunks (current)
├── merge-index.json        # Cross-file merge map
└── freshness.json          # Per-file mtimes for lazy re-index
```

---

## Approach 10: Provision Dry-Run + Diff Review (Safety)

Before generating any artifacts, show the user what will happen and let them approve/customize.

### Design

```bash
/init-project provision --dry-run
```

Output:

```
Provision Dry Run — .opencode/ will be modified:

NEW FILES (14):
  agents/project-executor.md      # Project-aware executor
  agents/project-architect.md     # Architecture-aware designer
  agents/project-critic.md        # Project-standard reviewer
  agents/project-debugger.md      # Architecture-aware debugger
  agents/project-tester.md        # Test-pattern-aware tester
  rules/coding-conventions.md     # Naming, imports, error handling
  rules/architecture.md           # Feature-based structure
  rules/testing.md                # Vitest + mocks + coverage
  rules/security.md               # Auth patterns, input validation
  tools/project-info.ts           # Project metadata tool
  tools/db-migrate.ts             # Prisma migration helper
  skills/build/SKILL.md           # Build pipeline
  skills/deploy/SKILL.md          # Deploy workflow
  skills/api/SKILL.md             # API development workflow

MODIFIED FILES (1):
  opencode.jsonc                  # Add skill paths

CONTEXT RESEARCH (6):
  context/research/nextjs.md      # Next.js 15.2 docs
  context/research/react.md       # React 19 docs
  context/research/prisma.md      # Prisma 6.5 docs
  context/research/zod.md         # Zod docs
  context/research/vitest.md      # Vitest config docs
  context/research/tailwindcss.md # Tailwind v4 docs

DETECTED PATTERNS (5):
  → Feature-based architecture
  → Result<T,E> error handling
  → describe/it testing pattern
  → Prisma with PostgreSQL
  → Next.js App Router + API routes

Proceed? [Y/n] (or specify: --skip-agents --only-skills)
```

### Interactive Customization

```bash
/init-project provision --interactive
```

Walk through each phase:
1. "Scan detected 6 languages. Correct? [Y/n/edit]"
2. "Framework: Next.js 15.2. Correct? [Y/n/edit]"
3. "Architecture: feature-based. Correct? [Y/n/edit]"
4. "Generate 6 agents? [Y/n/edit: --only agent1,agent2]"
5. "Research 6 dependencies? [Y/n/edit: --skip dep3]"
6. "Proceed? [Y/n]"

---

## Approach 11: Post-Production Feedback Loop (Durability)

After initial provision, the system should detect when context is stale and self-repair.

### Stale Detection Triggers

| Trigger | Detection | Action |
|---------|-----------|--------|
| New dependency added | `package.json` changed since last scan | Re-run research phase for new dep |
| File moved/renamed | Rule paths resolve to 404 | Update orphane refs in rules |
| Architecture changed | New directory structure detected | Offer to re-classify architecture |
| Framework updated | Version in lockfile > version in research | Re-fetch docs for new version |
| Agent not used in N days | Stats show zero invocations | Flag for possible removal |

### Feedback Loop Implementation

A **weekly maintenance skill** (`/project provision-refresh`):

```bash
/project provision-refresh
```

1. Compare current project state with last detection snapshot
2. Generate diff: `files added (+12), files removed (-3), deps changed (+2, -1)`
3. Re-run affected phases only (not full pipeline)
4. Report changes: "Updated 2 research files, 1 rule file, 1 agent prompt"

### Self-Healing Rules

When a rule references a deleted file:

```
Old rule: "See src/services/payment.ts"
→ Detect: payment.ts deleted (moved to features/payments/payment.ts)
→ Fix: Update rule to reference new path
→ Log: "Auto-repaired rule reference: payment.ts → features/payments/payment.ts"
```

---

## Putting It All Together: The End-to-End Pipeline

```
/init-project setup --full
```

| Phase | Approaches Used | Output | Est. Time |
|-------|----------------|--------|-----------|
| 0 — Preflight | Checkpointed pipeline (A7) | Checkpoint created | <1s |
| 1 — Deep Scan | Multi-pass scanner (A1) + Domain language (A4) | `init-detection.json` | 5-30s |
| 2 — Research | Dependency graph (A2) | `.opencode/context/research/` | 30-120s |
| 3 — Analysis | Architecture classification (A5) + Heuristic conventions (A3) | `provision-plan.json` | 10-30s |
| 4 — Generation | Bootstrap agents (A6) + Rules + Tools + Skills | `.opencode/agents/`, `.opencode/rules/`, etc. | 10-30s |
| 5 — Verification | Cross-phase consistency (A8) | `provision-report.md` | 5-10s |
| 6 — Vectorization | Lazy vector index (A9) | `.opencode/.vector/context.db` | 5-15s |
| 7 — Feedback | Dry-run diff (A10) → report to user | Summary | <1s |
| 8 — Post-Provision | Feedback loop (A11) — wait for triggers | Monitor | (ongoing) |

### Cumulative Reliability

| Property | Without Approaches | With Approaches |
|----------|------------------|-----------------|
| Partial failure recovery | Restart from scratch | Resume from checkpoint |
| Stale context | User must manually refresh | Auto-detected + self-healing |
| Broken references | Undetected until agent fails | Verified before generation |
| Wrong architecture guess | User must correct manually | Interactive correction during dry-run |
| Missing docs | User must fetch manually | Auto-fetched + cached |
| Agent doesn't know domain | User must explain every session | Domain language embedded in prompt |

---

## Implementation Priority

| Priority | Approaches | Effort | Impact |
|----------|-----------|--------|--------|
| **P0** | A1 (Scanner) + A7 (Checkpoints) | 3-5 days | Foundation — everything depends on these |
| **P1** | A5 (Architecture) + A3 (Conventions) | 2-3 days | High impact: agents understand project structure |
| **P1** | A8 (Verification) | 1-2 days | Reliability: prevents broken references |
| **P2** | A2 (Research) | 3-5 days | Context quality: version-specific docs |
| **P2** | A9 (Vector) | 1-2 days | Retrieval: semantic search over context |
| **P3** | A4 (Domain Language) | 2-3 days | Nuance: agents speak project jargon |
| **P3** | A6 (Agent Generation) | 2-3 days | Convenience: zero-touch agent creation |
| **P4** | A10 (Dry-run) + A11 (Feedback) | 3-5 days | Polish: safety + durability |

Total: ~15-25 days for full implementation. Each priority tier is independently shippable.

---

## See Also

- `.opencode/context/frameworks/per-repo-deployment-architecture.md` — Original architecture proposal
- `.opencode/context/decisions.md` — ADR: Self-Deploying Per-Repository Configuration
- `skills/provision/SKILL.md` — Current provision skill
- `skills/init-project/SKILL.md` — Current init-project skill