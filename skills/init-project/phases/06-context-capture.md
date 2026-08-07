# Phase 6: Codebase Mapping & Context Capture (--full only)

Deep-map the codebase, extract domain knowledge and architecture patterns, save durable context, and upgrade provisioned agents with full project context instead of shallow detection data.

**Skip condition:** This phase ONLY runs when `--full` flag is active. Default `setup` skips it.

## Purpose

This is the phase that makes AI assistance immediately productive for a new project. Instead of agents knowing only "this is a TypeScript/Next.js project" (shallow detection from Phase 1), agents after Phase 6 know the architecture, conventions, domain language, key patterns, integration points, and critical paths. The user no longer has to manually explain their project — the system decomposed it and injected the understanding into the agents.

## Input

- `.opencode/state/init/init-detection.json` — shallow detection from Phase 1
- `.opencode/state/init/provision-checkpoint.json` — provisioned artifacts from Phase 4
- The codebase itself (read-only analysis)

## Execution Steps

### Step 1: Parallel Codebase Mapping

Spawn 3 agents in parallel to deep-map the codebase. Each produces a structured JSON artifact saved to `.opencode/state/init/`.

**Agent 1: Architecture Map (@architect)**

```
Task(
  subagent_type="architect",
  prompt="Map the architecture of this codebase. Analyze:

1. Module structure: top-level modules, their boundaries, dependencies between them
2. Design patterns: which patterns are used (MVC, repository, factory, etc.)
3. Coupling: tight vs loose coupling, circular dependencies
4. Layering: presentation → business logic → data access, or other layering
5. Data flow: how data moves through the system (request → response, event → handler, etc.)
6. Key abstractions: core interfaces/classes that the system is built around
7. Module depth: which modules are deep (small interface, large implementation) vs shallow

Output a JSON architecture map:
{
  \"modules\": [{ \"name\": \"...\", \"path\": \"...\", \"responsibility\": \"...\", \"depends_on\": [...], \"depended_by\": [...] }],
  \"patterns\": [{ \"name\": \"...\", \"where\": \"...\", \"description\": \"...\" }],
  \"layering\": { \"layers\": [...], \"direction\": \"...\" },
  \"dataFlow\": \"...description...\",
  \"keyAbstractions\": [{ \"name\": \"...\", \"type\": \"interface|class|module\", \"path\": \"...\", \"purpose\": \"...\" }],
  \"coupling\": { \"tight\": [...], \"loose\": [...], \"circular\": [...] }
}

Project root: $(pwd)
Language: {language}
Framework: {framework}"
)
```

Save to `.opencode/state/init/architecture-map.json`.

**Agent 2: Conventions Fingerprint (@convention-extractor)**

```
Task(
  subagent_type="convention-extractor",
  prompt="Extract coding conventions from this codebase. Analyze:

1. Naming: variables, functions, classes, files, constants, components
2. File organization: how files are grouped, directory naming, co-location patterns
3. Error handling: try/catch, Result types, error classes, where errors are caught
4. Testing patterns: test file location, naming, framework idioms, mocking approach
5. Import style: ES modules vs CommonJS, path aliases, import ordering, barrel files
6. Code style: indentation, semicolons, quotes, trailing commas, line length
7. Git conventions: commit message format, branch naming (check recent git log)
8. API patterns: REST/GraphQL/RPC, endpoint naming, request/response shape, validation
9. State management: how state is managed (if frontend), stores, context, hooks
10. Database access: ORM patterns, query style, migration conventions

Output a JSON conventions fingerprint:
{
  \"naming\": { \"variables\": \"...\", \"functions\": \"...\", \"classes\": \"...\", \"files\": \"...\", \"constants\": \"...\", \"components\": \"...\" },
  \"fileOrganization\": { \"sourceDir\": \"...\", \"testDir\": \"...\", \"co-location\": \"...\", \"barrelFiles\": true|false },
  \"errorHandling\": { \"style\": \"...\", \"customErrors\": true|false, \"globalHandler\": \"...\" },
  \"testing\": { \"framework\": \"...\", \"location\": \"...\", \"naming\": \"...\", \"mocking\": \"...\" },
  \"imports\": { \"style\": \"...\", \"aliases\": {...}, \"ordering\": \"...\" },
  \"codeStyle\": { \"indent\": \"...\", \"semicolons\": true|false, \"quotes\": \"...\", \"lineLength\": \"...\" },
  \"git\": { \"commitFormat\": \"...\", \"branchNaming\": \"...\" },
  \"api\": { \"style\": \"...\", \"endpointPattern\": \"...\", \"validation\": \"...\" },
  \"stateManagement\": \"...\" (if applicable),
  \"database\": { \"orm\": \"...\", \"queryStyle\": \"...\", \"migrations\": \"...\" } (if applicable)
}

Project root: $(pwd)"
)
```

Save to `.opencode/state/init/conventions-fingerprint.json`.

**Agent 3: Integration & Domain Map (@explore)**

```
Task(
  subagent_type="explore",
  prompt="Map external integrations and domain language in this codebase. Find:

1. External services: APIs called, databases connected, message queues, cache layers
2. Third-party SDKs: which libraries are integrated and how
3. Environment variables: what config the app needs (list .env keys referenced in code)
4. Domain language: key business terms used in code (model names, domain events, business logic concepts)
5. Critical paths: the main user flows or request paths through the system
6. Entry points: main files, server bootstrap, CLI entry, job runners
7. Scheduled jobs/cron: background tasks, scheduled workers
8. Security boundaries: auth middleware, permission checks, rate limiting

Output JSON:
{
  \"externalServices\": [{ \"name\": \"...\", \"type\": \"api|database|queue|cache\", \"purpose\": \"...\", \"configKey\": \"...\" }],
  \"sdks\": [{ \"name\": \"...\", \"purpose\": \"...\", \"version\": \"...\" }],
  \"envVars\": [{ \"key\": \"...\", \"purpose\": \"...\", \"required\": true|false }],
  \"domainLanguage\": [{ \"term\": \"...\", \"definition\": \"...\", \"where\": \"...\" }],
  \"criticalPaths\": [{ \"name\": \"...\", \"steps\": [...] }],
  \"entryPoints\": [{ \"file\": \"...\", \"type\": \"server|cli|job|worker\" }],
  \"scheduledJobs\": [{ \"name\": \"...\", \"schedule\": \"...\", \"file\": \"...\" }],
  \"securityBoundaries\": [{ \"type\": \"auth|permissions|rateLimit\", \"location\": \"...\" }]
}

Project root: $(pwd)"
)
```

Save to `.opencode/state/init/integration-map.json`.

### Step 2: Synthesize Durable Context

Merge the three parallel outputs into durable context artifacts saved to `.opencode/context/` (committed to version control — this knowledge compounds across sessions).

**2a. Architecture Context**

Write `.opencode/context/frameworks/architecture.md`:

```markdown
# Architecture — {project_name}

> Auto-generated by /init-project setup --full (Phase 6). Re-run to update.

## Module Structure

{from architecture-map.json: modules table with responsibility + dependencies}

## Design Patterns

{from architecture-map.json: patterns list}

## Layering

{from architecture-map.json: layering description}

## Data Flow

{from architecture-map.json: dataFlow description}

## Key Abstractions

{from architecture-map.json: keyAbstractions table}

## Coupling Analysis

{from architecture-map.json: coupling summary — flag circular deps as anti-patterns}
```

**2b. Conventions Context**

Write `.opencode/context/patterns/conventions.md`:

```markdown
# Coding Conventions — {project_name}

> Auto-generated by /init-project setup --full (Phase 6). Re-run to update.

## Naming

{from conventions-fingerprint.json: naming table}

## File Organization

{from conventions-fingerprint.json: fileOrganization}

## Error Handling

{from conventions-fingerprint.json: errorHandling}

## Testing

{from conventions-fingerprint.json: testing}

## Imports

{from conventions-fingerprint.json: imports}

## Code Style

{from conventions-fingerprint.json: codeStyle}

## Git Conventions

{from conventions-fingerprint.json: git}

## API Patterns

{from conventions-fingerprint.json: api}

## Database Access

{from conventions-fingerprint.json: database} (if applicable)
```

**2c. Domain & Integration Context**

Write `.opencode/context/theory.md`:

```markdown
# Project Theory — {project_name}

> Auto-generated by /init-project setup --full (Phase 6). Re-run to update.
> Living documentation of how this system works.

## Domain Language

{from integration-map.json: domainLanguage table — business terms and definitions}

## External Services

{from integration-map.json: externalServices table}

## Environment Configuration

{from integration-map.json: envVars table}

## Critical Paths

{from integration-map.json: criticalPaths — main user flows}

## Entry Points

{from integration-map.json: entryPoints}

## Scheduled Jobs

{from integration-map.json: scheduledJobs}

## Security Boundaries

{from integration-map.json: securityBoundaries}
```

**2d. Architecture Decisions (inferred)**

Write `.opencode/context/decisions.md` (append if exists):

```markdown
# Architecture Decisions — {project_name}

> Auto-extracted by /init-project setup --full (Phase 6).
> These are decisions inferred from the codebase, not manually written ADRs.

## Decisions

{from architecture-map.json + conventions-fingerprint.json: infer decisions}
- **Pattern: {pattern}** — used in {where}. Rationale: {inferred from context}.
- **Layering: {layering}** — {why this layering was chosen, inferred}.
- **State management: {approach}** — {inferred rationale}.
- **Database access: {orm/style}** — {inferred rationale}.
```

**2e. Project Memory**

Write `.opencode/state/project-memory.json`:

```json
{
  "project": "{project_name}",
  "generated": "{ISO timestamp}",
  "language": "{language}",
  "framework": "{framework}",
  "architecture": "{one-line architecture summary}",
  "keyFacts": [
    {from integration-map.json: key domain facts},
    {from architecture-map.json: key structural facts}
  ],
  "conventions": {
    "naming": "{summary}",
    "testing": "{summary}",
    "errorHandling": "{summary}"
  },
  "domainTerms": [{from integration-map.json: domainLanguage terms only}],
  "criticalPaths": [{from integration-map.json: criticalPath names}]
}
```

### Step 3: Upgrade Provisioned Agents with Deep Context

Re-generate the agent wrappers from Phase 4, but this time inject the full context from Phase 6 instead of the shallow detection data. This is the critical step — agents go from "you work on a TypeScript project" to "you work on a project with this architecture, these conventions, this domain, these integration points."

Read the three map files and re-generate each agent in `.opencode/agents/`:

```markdown
---
extends: ../../agents/{name}.md
description: Project-aware wrapper for {name} with deep {lang}/{fw} context
model: ollama/deepseek-v4-flash:0731-cloud
mode: subagent
---

You are a project-aware {name} agent for a {lang}/{fw} project.

<Agent_Prompt>
  <Project_Context>
    ### Stack
    - Language: {lang} {version}
    - Framework: {fw} {frameworkVersion}
    - Package manager: {packageManager}
    - Build: {buildSystem}
    - Test: {testFramework} — `{testCommand}`
    - Lint: `{lintCommand}`

    ### Architecture
    {from architecture-map.json: modules, patterns, layering, data flow — condensed}

    ### Conventions
    {from conventions-fingerprint.json: naming, imports, error handling, testing, code style — condensed}

    ### Domain
    {from integration-map.json: domain language terms, key business concepts}

    ### Integrations
    {from integration-map.json: external services, SDKs, env vars}

    ### Critical Paths
    {from integration-map.json: main user flows}

    ### Security
    {from integration-map.json: auth, permissions, rate limits}

    ### Entry Points
    {from integration-map.json: main files, bootstrap}
  </Project_Context>

  <Commands>
    - Build: `{buildCommand}`
    - Test: `{testCommand}`
    - Lint: `{lintCommand}`
    - Dev: `{devCommand}`
  </Commands>

  <Context_Files>
    Deep context is available in:
    - `.opencode/context/frameworks/architecture.md` — full architecture map
    - `.opencode/context/patterns/conventions.md` — full conventions fingerprint
    - `.opencode/context/theory.md` — domain language and integration map
    - `.opencode/context/decisions.md` — architecture decisions
    Load these when you need deeper context about the project.
  </Context_Files>
</Agent_Prompt>
```

Use `--force` to overwrite the Phase 4 wrappers with the upgraded deep-context versions.

### Step 4: Update Root AGENTS.md

Append a "Project Architecture" section to the root `AGENTS.md` with a condensed summary from the Phase 6 maps:

```markdown
## Project Architecture

> Auto-generated by /init-project setup --full. Re-run to update.

### Architecture Summary
{one-paragraph summary from architecture-map.json}

### Module Map
{condensed table from architecture-map.json}

### Domain Language
{key terms from integration-map.json}

### Conventions Summary
{condensed from conventions-fingerprint.json}

### Deep Context
Full context files in `.opencode/context/`:
- `frameworks/architecture.md` — architecture details
- `patterns/conventions.md` — coding conventions
- `theory.md` — domain and integration map
- `decisions.md` — architecture decisions
```

Preserve any `<!-- MANUAL -->` sections — only update/append the auto-generated section.

### Step 5: Run Privacy Scan

Before saving context files, scan them for secrets, API keys, or PII:

```bash
PRIVACY_SCAN="$GLOBAL_DIR/skills/privacy-scan/scripts/scan-privacy.mjs"
if [ -f "$PRIVACY_SCAN" ]; then
  for ctx_file in .opencode/context/frameworks/architecture.md \
                  .opencode/context/patterns/conventions.md \
                  .opencode/context/theory.md \
                  .opencode/context/decisions.md; do
    if [ -f "$ctx_file" ]; then
      RISK=$(node "$PRIVACY_SCAN" --file "$ctx_file" 2>/dev/null | jq -r '.risk' 2>/dev/null)
      if [ "$RISK" = "high" ]; then
        echo "⚠  $ctx_file — high risk content detected, stripping sensitive data"
        # Redact secrets, re-scan, or exclude from commit
      fi
    fi
  done
fi
```

Do not save content with `high` privacy risk to committed context files. Redact or exclude.

## Delegation Example

```
// Step 1: Parallel agents (dispatch all 3 in one message)
Task(subagent_type="architect", prompt="...architecture map...")
Task(subagent_type="convention-extractor", prompt="...conventions fingerprint...")
Task(subagent_type="explore", prompt="...integration and domain map...")

// Wait for all 3, then:
// Step 2: Synthesize context files (inline — read JSON, write MD)
// Step 3: Re-generate agent wrappers with deep context (inline — read maps + detection, write agent files)
// Step 4: Update AGENTS.md (inline — read, append section, write)
// Step 5: Privacy scan (bash)
```

## Output

After Phase 6:
- `.opencode/state/init/architecture-map.json` — raw architecture analysis
- `.opencode/state/init/conventions-fingerprint.json` — raw conventions analysis
- `.opencode/state/init/integration-map.json` — raw integration analysis
- `.opencode/context/frameworks/architecture.md` — durable architecture context
- `.opencode/context/patterns/conventions.md` — durable conventions context
- `.opencode/context/theory.md` — durable domain/integration context
- `.opencode/context/decisions.md` — inferred architecture decisions
- `.opencode/state/project-memory.json` — cross-session durable facts
- `.opencode/agents/*.md` — upgraded with deep context (overwrites Phase 4 shallow versions)
- `AGENTS.md` — updated with Project Architecture section

## Checkpoint

Save checkpoint to `.opencode/state/init/init-checkpoint.json`:

```json
{
  "lastCompletedPhase": 6,
  "timestamp": "2026-07-01T12:00:00Z",
  "subcommand": "setup",
  "mode": "full",
  "files": [
    ".opencode/context/frameworks/architecture.md",
    ".opencode/context/patterns/conventions.md",
    ".opencode/context/theory.md",
    ".opencode/context/decisions.md",
    ".opencode/state/project-memory.json"
  ],
  "contextMaps": [
    ".opencode/state/init/architecture-map.json",
    ".opencode/state/init/conventions-fingerprint.json",
    ".opencode/state/init/integration-map.json"
  ],
  "agentsUpgraded": true
}
```

## Merge Mode (refresh --full only)

When Phase 6 runs as part of `refresh --full` instead of `setup --full`, all steps run in **merge mode** — existing context files are diffed against new analysis rather than being created from scratch.

### Merge Rules

1. **Read existing context**: Before writing, read all existing `.opencode/context/` files (architecture.md, conventions.md, theory.md, decisions.md, project-memory.json)
2. **Diff analysis**: Compare new agent outputs (architecture-map.json, conventions-fingerprint.json, integration-map.json) against the previous run's artifacts stored in `.opencode/state/init/`
3. **Update changed sections**: Only update sections of context files where the analysis has changed. Unchanged sections are left untouched.
4. **Preserve MANUAL blocks**: Any `<!-- MANUAL -->` sections in existing context files are preserved verbatim. Only auto-generated sections are updated.
5. **Agent re-upgrade**: Re-generate Phase 4 agent wrappers with refreshed context. Preserve `<!-- MANUAL -->` blocks in existing agent files. Overwrite auto-generated `<Project_Context>` and `<Context_Files>` sections with updated content.
6. **AGENTS.md update**: Update the "Project Architecture" section. Preserve MANUAL blocks. Only update auto-generated subsections.
7. **Report changes**: After merge, output a diff summary showing:
   - New sections added
   - Existing sections updated
   - Unchanged sections (preserved)
   - Manual sections preserved
   - Stale resources flagged (agents/skills/tools that no longer match detected stack — flagged, NOT deleted)

### Re-run Detection

To determine if Phase 6 needs to run during refresh:

```bash
# Compare current codebase state against last analysis
LAST_ANALYSIS=".opencode/state/init/init-checkpoint.json"
CODEBASE_HASH=$(find . -name '*.ts' -o -name '*.js' -o -name '*.py' -o -name '*.go' -o -name '*.rs' | grep -v node_modules | grep -v .opencode | sort | xargs md5sum 2>/dev/null | md5sum | cut -d' ' -f1)
LAST_HASH=$(jq -r '.codebaseHash // "none"' "$LAST_ANALYSIS" 2>/dev/null)

if [ "$CODEBASE_HASH" = "$LAST_HASH" ]; then
  echo "  ℹ  Codebase unchanged since last Phase 6 — skipping deep re-mapping"
  PHASE6_SKIP=true
else
  echo "  ℹ  Codebase changed since last Phase 6 — running deep re-mapping"
  PHASE6_SKIP=false
fi
```

If codebase is unchanged, Phase 6 can be safely skipped during refresh — existing context is still valid.

### Stale Resource Handling

During merge mode, provisioned resources that no longer match the detected stack are **flagged, not deleted**:

```json
{
  "staleResources": [
    {
      "type": "agent",
      "path": ".opencode/agents/graphql-specialist.md",
      "reason": "GraphQL no longer detected in stack",
      "recommendation": "Review and remove manually if no longer needed"
    }
  ]
}
```

The user reviews stale resources and removes them manually. This prevents accidental deletion of resources the user may still want.

## Next Phase

After context capture completes, proceed to **Phase 7: Routing & Integration**.