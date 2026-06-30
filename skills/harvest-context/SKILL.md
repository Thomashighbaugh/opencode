---
name: harvest-context
description: Context and artifact hub — extract, generate, and manage project context from sessions and codebase
level: 2
---

# Harvest Context

Unified entry point for extracting, generating, and managing project context. Each subcommand captures a different type of knowledge artifact, with a shared pattern of scanning existing state, checking for overlaps, and saving to the right location.

## When to Use

- After a productive session, extract what you learned
- After orchestration, capture decisions and patterns
- When the codebase needs documentation (AGENTS.md hierarchy)
- When session knowledge should become a reusable skill, agent, or rule
- When project memory needs updating
- When context needs compression, pruning, or diff against previous checkpoints
- When you need to search or export project context as a report
- When you need to research a topic via web search and save findings as durable context
- When you need to compare alternatives (libraries, tools, approaches) with structured analysis

## No-Argument Behavior

When invoked without arguments (`/harvest-context`), list the subcommands as plain text and ask the user to choose. Do NOT call `hubMenu` or any other tool — just output the list directly. Available operations: session, codebase, skill, agent, rule, command, memory, docs, web-research, compare, consume, decompose, context, compress, secondbrain, journal, search, prune, export, diff, sweep.

## With-Argument Behavior

Directly invoke the matching subcommand. Print the reminder, then delegate to the corresponding skill or agent.

## Subcommands

### `/harvest-context session` — Extract Session Context

Extract decisions, patterns, and learnings from the current session.

**Process:**
1. Review the full conversation for:
   - Decisions made (and why)
   - Patterns discovered
   - Errors encountered and solutions
   - Architecture choices
   - Things that worked well
   - Things that didn't work
2. Classify each item:
   - **Durable project fact** → project memory
   - **Temporary working note** → notepad
   - **Reusable procedure** → potential skill/rule
   - **Duplicate/stale** → skip
3. Present summary to user for review
4. Save to appropriate destinations

**Output:** `.opencode/state/harvest/session-{timestamp}.md` + promotions to memory/notepad/wiki

**Reminder:**
> Session: I'll review our conversation, extract key decisions, patterns, and learnings, then classify them for memory, notepad, or reusable artifacts.

---

### `/harvest-context codebase` — Generate Codebase Context

Run deepinit to create/update hierarchical AGENTS.md documentation across the codebase.

**Process:**
1. Map all directories (excluding node_modules, .git, dist, etc.)
2. Generate AGENTS.md files with Purpose, Key Files, Subdirectories, AI Agent Instructions
3. Create parent reference links for navigation
4. Preserve `<!-- MANUAL -->` sections in existing files
5. Validate all parent references resolve

**Delegates to:** `deepinit` skill

**Output:** Hierarchical AGENTS.md files across the codebase

**Reminder:**
> Codebase: I'll generate hierarchical AGENTS.md documentation across your codebase, preserving any manual sections in existing files.

---

### `/harvest-context skill` — Create a Skill

Create a reusable skill from session knowledge.

**Process:**
1. Identify the repeatable workflow or procedure from the session
2. Ask: "What should this skill be called? What triggers it?"
3. Structure the knowledge into a SKILL.md with:
   - YAML frontmatter (name, description, level)
   - Procedural workflow steps
   - When-to-use triggers
   - Examples
4. Save to `.opencode/skills/{name}/SKILL.md` (project) or `~/.config/opencode/skills/{name}/SKILL.md` (user)
5. Ask: "Project or user scope?"

**Delegates to:** `skill-creator` skill for complex skills

**Output:** `.opencode/skills/{name}/SKILL.md` or `~/.config/opencode/skills/{name}/SKILL.md`

**Reminder:**
> Skill: I'll extract a repeatable workflow from our session, structure it as a skill with triggers and steps, and save it for future reuse.

---

### `/harvest-context agent` — Create an Agent

Create a project-specific agent definition.

**Process:**
1. Identify the agent role needed from session context
2. Ask: "What should this agent be called? What's its primary focus?"
3. Structure as agent markdown with:
   - Description and when-to-use
   - System prompt / instructions
   - Model preference (if any)
   - Tools it should have access to
4. Save to `.opencode/agents/{name}.md` (project) or `~/.config/opencode/agents/{name}.md` (user)

**Delegates to:** `opencode-agent-creator` skill

**Output:** `.opencode/agents/{name}.md` or `~/.config/opencode/agents/{name}.md`

**Reminder:**
> Agent: I'll define a specialized agent from our session's needs, including its role, instructions, and tool access.

---

### `/harvest-context rule` — Create a Project Rule

Create a project rule in `.opencode/rules/`.

**Process:**
1. Identify the convention, pattern, or constraint from the session
2. Ask: "What should this rule be called? (e.g., api-conventions, error-handling)"
3. Write a focused rule file covering:
   - The convention or constraint
   - Examples of correct and incorrect usage
   - When the rule applies
4. Save to `.opencode/rules/{name}.md`
5. Verify `.opencode/opencode.jsonc` includes the rules path

**Output:** `.opencode/rules/{name}.md`

**Reminder:**
> Rule: I'll capture a convention or constraint from our session as a project rule that agents will automatically load.

---

### `/harvest-context command` — Create a Slash Command

Create a project slash command.

**Process:**
1. Identify the repeatable workflow that warrants a command
2. Ask: "What should the command be called? What's its description?"
3. Structure as command markdown with:
   - YAML frontmatter (description, invoke name, argument-hint)
   - Usage examples
   - Task section invoking the appropriate skill(s)
4. Save to `.opencode/commands/{name}.md`

**Delegates to:** `opencode-command-creator` skill

**Output:** `.opencode/commands/{name}.md`

**Reminder:**
> Command: I'll create a slash command that wraps a repeatable workflow, making it accessible with a single invocation.

---

### `/harvest-context memory` — Promote to Memory

Promote session knowledge to durable project memory, notepad, or wiki.

**Process:**
1. Scan session for facts worth preserving
2. Classify each item:
   - Project memory (`.opencode/state/project-memory.json`) — durable team knowledge
   - Notepad (`.opencode/state/notepad.md`) — high-signal context for next turns
   - Wiki (`wiki` skill) — persistent knowledge base articles
   - AGENTS.md updates — facts that belong in instructions
3. Present proposed promotions to user
4. Write approved items to the appropriate destination
5. Flag conflicts or duplicates with existing entries

**Delegates to:** `remember` skill for classification, `wiki` skill for articles

**Output:** Updated memory/notepad/wiki files

**Reminder:**
> Memory: I'll review what we've learned, classify it as project memory, session notes, wiki articles, or AGENTS.md updates, and save it to the right place.

---

### `/harvest-context docs` — Fetch Library Docs via Context7 MCP API

Fetch up-to-date official documentation for any library, framework, or package by querying the **Context7 MCP API**. This is the primary way to access Context7's documentation database — it resolves library IDs, queries docs, and returns structured results with code examples.

**Use this for:** React, Next.js, Vue, Tailwind CSS, Prisma, Express, Django, FastAPI, Spring Boot, any npm/PyPI/Cargo package — even well-known ones. Your training data may be stale; Context7 always returns current docs.

**Do NOT use for:** refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

**Process:**
1. Resolve the library name to a Context7-compatible ID
2. Query documentation for the specified topic (or general docs if no topic)
3. Present results with headers, code blocks, and key concepts highlighted
4. Optional: save as a context file in `.opencode/context/`

**Delegates to:** Context7 MCP (resolve-library-id + query-docs)

**Usage:**
- `/harvest-context docs react` — General React documentation
- `/harvest-context docs react hooks` — React hooks topic
- `/harvest-context docs next.js app router` — Next.js App Router

**Output:** Documentation content on screen, optionally saved to `.opencode/context/`

**Reminder:**
> Docs: I'll fetch up-to-date official documentation for any library via the Context7 MCP API. Give me a library name and optional topic — e.g., `/harvest-context docs react hooks` or `/harvest-context docs next.js app router`.

---

### `/harvest-context web-research` — Multi-Source Web Research

Multi-source web research using `websearch` + `webfetch`. Searches multiple queries in parallel, fetches top results, and synthesizes findings into a structured research report saved to `.opencode/state/harvest/`. Good for investigating topics, gathering current information, or exploring unfamiliar domains.

**Process:**
1. Accept a research topic or question from the user
2. Decompose the topic into 3-5 parallel search queries covering different angles
3. Execute all searches simultaneously via `websearch`
4. Fetch the top 2-3 results per query via `webfetch` (parallel fetches)
5. Synthesize findings into a structured report with:
   - Executive summary
   - Key findings organized by theme
   - Source citations with URLs
   - Contradictions or disagreements found
   - Gaps in available information
   - Recommendations or conclusions
6. Save report to `.opencode/state/harvest/web-research-{timestamp}-{topic-slug}.md`
7. Present summary to user with option to refine, expand, or promote to durable context

**Usage:**
- `/harvest-context web-research "best practices for micro-frontend architecture"` — Research a topic
- `/harvest-context web-research "React Server Components vs traditional SSR"` — Compare approaches

**Output:** `.opencode/state/harvest/web-research-{timestamp}-{topic-slug}.md`

**Reminder:**
> Web Research: I'll search multiple queries in parallel, fetch top results, and synthesize findings into a structured research report.

---

### `/harvest-context compare` — Compare Alternatives via Web Research

Research and compare multiple options (libraries, tools, approaches, services) via `websearch` + `webfetch`. Produces a structured comparison table with recommendations. Good for making informed technology or design decisions.

**Process:**
1. Accept the items to compare (2-5 options) and optionally the comparison criteria
2. For each option, research via `websearch` + `webfetch`:
   - Official documentation / landing page
   - GitHub repository (stars, issues, activity)
   - Package registry (downloads, version, maintenance)
   - Recent blog posts or comparison articles
3. Produce a structured comparison report with:
   - Overview and description of each option
   - Feature comparison matrix (rows = criteria, columns = options)
   - Performance benchmarks (if available)
   - Community health metrics
   - Learning curve and DX assessment
   - Integration complexity
   - Pros and cons per option
   - Recommendation with rationale
4. Save report to `.opencode/state/harvest/compare-{timestamp}-{topic-slug}.md`
5. Present to user with option to refine, expand, or promote to durable context

**Usage:**
- `/harvest-context compare "Prisma vs Drizzle ORM"` — Compare two ORMs
- `/harvest-context compare "Redis vs Memcached for caching"` — Compare caching solutions

**Output:** `.opencode/state/harvest/compare-{timestamp}-{topic-slug}.md`

**Reminder:**
> Compare: I'll research multiple options and produce a structured comparison table with recommendations.

---

### `/harvest-context decompose` — Decompose Concepts

Break down concepts, problems, goals, or code into smaller actionable units.

**Process:**
1. Identify the type: concept, problem, goal, feature, code component
2. Analyze structure: find natural boundaries, dependencies, relationships
3. Break down into hierarchical or sequential smaller units
4. Prioritize actionability — units should be concrete and executable

**Delegates to:** `planner` agent

**Output:** Structured decomposition with units, dependencies, effort estimates, and recommended sequence

**Reminder:**
> Decompose: I'll break down your concept, problem, or goal into smaller, independently actionable units with dependencies and effort estimates.

---

### `/harvest-context consume` — Ingest Content into Context

Ingest a file, directory, or URL — extract text content, summarize, and save as durable context in `.opencode/context/research/`.

**Process:**
1. Determine what to consume:
   - **File path**: Read the file, extract text content
   - **Directory**: Walk the directory, read all text files
   - **URL**: Fetch the URL via `webfetch` tool, convert to markdown
2. Extract and summarize key points
3. Save to `.opencode/context/research/{name}.md` with:
   - Source metadata (path, URL, timestamp)
   - Summary of content
   - Key points or findings
   - Relevance to the project
4. Confirm with the user

**Usage:**
- `/harvest-context consume ./docs/api.md` — Ingest a local file
- `/harvest-context consume ./src/components/` — Ingest a directory
- `/harvest-context consume https://example.com/docs` — Ingest a URL
- `/harvest-context consume ./docs/ https://api.example.com` — Ingest multiple sources

**Output:** `.opencode/context/research/{name}.md`

**Reminder:**
> Consume: I'll ingest the specified file, directory, or URL — extract text content, summarize key points, and save to `.opencode/context/research/` as durable context.

---

### `/harvest-context context` — Manage Context Files

Manage OpenCode context files for knowledge persistence and organization.

**Process:**
1. **No args or `map`**: Scan workspace for harvestable summary files and show context structure
2. **`harvest [path]`**: Convert summaries to permanent context files in MVI format
3. **`extract from <source>`**: Create context from documentation, URLs, or code
4. **`organize <category>`**: Restructure flat files into function-based structure
5. **`compact <file>`**: Reduce verbose file to MVI format (under 200 lines)

**Usage:**
- `/harvest-context context` — Scan and show status
- `/harvest-context context harvest` — Convert summaries to context
- `/harvest-context context extract from https://docs.example.com` — Extract from URL
- `/harvest-context context organize concepts/` — Organize by function
- `/harvest-context context compact verbose.md` — Compact a file

**Output:** Context files in `.opencode/context/` organized by function

**Reminder:**
> Context: I'll manage your context files — harvest summaries, extract from docs, organize by function, or compact verbose files.

---

### `/harvest-context compress` — Token Compression

Apply multi-layer token compression strategies to reduce context window usage.

**Process:**
1. **Density filtering**: Remove low-information lines (whitespace, repeated logs, boilerplate)
2. **Command output compression**: Truncate or summarize verbose command output
3. **Library cache compression**: Cache expensive documentation lookups locally
4. Report token savings for each layer applied

**Usage:**
- `/harvest-context compress` — Apply all compression layers
- `/harvest-context compress file.md` — Compress a specific file

**Output:** Compressed versions with token savings reported

**Reminder:**
> Compress: I'll apply token compression strategies — density filtering, command output compression, and library cache compression to reduce context usage.

---

### `/harvest-context secondbrain` — Local Knowledge Base

Set up a privacy-first local knowledge base using markdown and Git, with role packs and self-healing cross-references.

**Process:**
1. Initialize or load the local knowledge base structure
2. Organize content by role packs (developer, architect, PM, etc.)
3. Maintain cross-references between related knowledge nodes
4. Detect and repair broken references

**Output:** Local knowledge base in `.opencode/context/` with role-based organization

**Reminder:**
> Secondbrain: I'll set up a privacy-first local knowledge base with markdown+Git, role packs, and self-healing cross-references.

---

### `/harvest-context journal` — Event-Sourced Journal

Set up an event-sourced journal for orchestration runs with deterministic replay, time-travel debugging, and SHA-256 checksums.

**Process:**
1. Initialize journal database
2. Record orchestration events with timestamps and checksums
3. Enable deterministic replay of past runs
4. Support time-travel debugging by navigating event history

**Output:** Event-sourced journal in `.opencode/state/harvest/`

**Reminder:**
> Journal: I'll set up an event-sourced orchestration journal with deterministic replay and time-travel debugging.

---

### `/harvest-context search` — Semantic Search Across Context

Semantic search across all context files in `.opencode/context/` — find decisions, patterns, and research matching a natural language query.

**Process:**
1. Index `.opencode/context/` files for semantic search
2. Accept a natural language query
3. Return ranked results with file paths, relevance scores, and matching excerpts
4. Optionally load matched context into the current session

**Usage:**
- `/harvest-context search "auth patterns"` — Find context about auth
- `/harvest-context search "database migration"` — Find context about DB migrations

**Output:** Ranked search results with file paths and excerpts

**Reminder:**
> Search: I'll semantically search across all context files for decisions, patterns, and research matching your query.

---

### `/harvest-context prune` — Stale Context Management

Identify old or superseded context files in `.opencode/context/` and archive or delete them to keep the context directory healthy.

**Process:**
1. Scan `.opencode/context/` for files by age and relevance
2. Identify candidates: old timestamps, superseded patterns, duplicate content
3. Present candidates with file paths, ages, and rationale
4. Ask user: archive, delete, or keep each candidate

**Output:** Cleaned-up `.opencode/context/` with stale files moved to archive or deleted

**Reminder:**
> Prune: I'll scan for old or superseded context files and help you archive or delete them.

---

### `/harvest-context export` — Export Context as Report

Export project context as a readable summary, markdown bundle, or team report — share what the project knows.

**Process:**
1. Aggregate context from `.opencode/context/` and `.opencode/state/`
2. Format as requested: summary, bundle, or report
3. Include metadata (generated date, source scope, file count)
4. Save to `.opencode/state/harvest/export-{timestamp}.md`

**Usage:**
- `/harvest-context export` — Default summary export
- `/harvest-context export --format bundle` — Full markdown bundle
- `/harvest-context export --format report` — Team report format

**Output:** `.opencode/state/harvest/export-{timestamp}.md`

**Reminder:**
> Export: I'll create a readable summary, markdown bundle, or team report from your project context.

---

### `/harvest-context diff` — Context Diff

Compare current context state to a previous checkpoint, showing new decisions, patterns, and changes since the last harvest.

**Process:**
1. Load the most recent context checkpoint
2. Scan current `.opencode/context/` state
3. Compare: new files, modified files, removed files
4. Summarize additions, changes, and deletions

**Output:** Diff report showing what's changed since last harvest

**Reminder:**
> Diff: I'll diff the current context against the last checkpoint, showing what's new, changed, or removed.

---

### `/harvest-context sweep` — Sweep Bloated `.opencode/` Artifacts

Proactively scan `.opencode/` for files and directories that should be gitignored but aren't. Prevents the `.opencode/` directory from swelling to sizes that break `git push`.

**Process:**
1. Scan `.opencode/` for files that should be in `.gitignore` but aren't:
   - `.opencode/node_modules/` — project-scoped tool deps
   - `.opencode/.vector/` — regenerable vector search DB
   - `.opencode/state/sessions/` — session transcripts and secrets
   - `.opencode/chat-history/` — raw chat history
   - `.opencode/chat/` — alternative chat data path
   - Large generated files (>1MB) in `state/` or `harvest/`
   - Session artifacts that reference commits not in git history
2. Run privacy scan on `.opencode/context/` files to detect any that may contain secrets:
   ```bash
   PRIVACY_SCAN="$HOME/.config/opencode/skills/privacy-scan/scripts/scan-privacy.mjs"
   if [[ -f "$PRIVACY_SCAN" ]]; then
     find .opencode/context/ -name "*.md" -type f | while read -r file; do
       result=$(node "$PRIVACY_SCAN" --file "$file" 2>/dev/null)
       risk=$(echo "$result" | jq -r '.risk')
       if [[ "$risk" == "high" ]] || [[ "$risk" == "medium" ]]; then
         echo "⚠  $file — privacy risk: $risk"
       fi
     done
   fi
   ```
3. Check `.gitignore` exists and contains expected patterns
4. Report any missing entries — offer to add them
5. Report oversized files with paths and sizes
6. If `--fix` flag passed, auto-append missing patterns to `.gitignore`
7. Save a report to `.opencode/state/harvest/sweep-{timestamp}.md`

**Reminder:**
> Sweep: I'll scan your `.opencode/` directory for files that should be gitignored but aren't — preventing bloat and privacy leaks that break git push.

---

## Auto-Sweep on Harvest

Auto-sweep REMOVED — manual-only per API call reduction directive. Use `/harvest-context sweep` explicitly when needed.

---

## Shared Lifecycle

Every subcommand follows this pattern:

### Step 0: Parse Flags

Check for `--quiet` flag: when present, suppress all inline progress narration. Only print the final result and any errors. Saves tokens on long-running research tasks where intermediate status is not needed.

### Step 1: Scan Existing State

```bash
# Check for relevant prior artifacts
ls .opencode/state/harvest/ 2>/dev/null
ls .opencode/state/ideation/ 2>/dev/null
ls .opencode/state/orchestration/ 2>/dev/null
```

If overlapping artifacts exist, ask user: "Found prior harvest on [topic]. Use as context, overwrite, or skip?"

### Step 2: Execute Subcommand

Load and execute the appropriate skill or inline process (see each subcommand above).

### Step 3: Privacy Scan (Before Saving to Context)

Before saving any artifact to `.opencode/context/` (durable, committed knowledge), run a privacy scan to detect secrets, PII, or privacy-compromising content:

```bash
# Run privacy scan on the content before saving
PRIVACY_SCAN="$HOME/.config/opencode/skills/privacy-scan/scripts/scan-privacy.mjs"
if [[ -f "$PRIVACY_SCAN" ]]; then
    SCAN_RESULT=$(echo "$ARTIFACT_CONTENT" | node "$PRIVACY_SCAN" --stdin 2>/dev/null)
    SCAN_RISK=$(echo "$SCAN_RESULT" | jq -r '.risk' 2>/dev/null)
    SCAN_RECOMMENDATION=$(echo "$SCAN_RESULT" | jq -r '.recommendation' 2>/dev/null)

    case "$SCAN_RISK" in
        high)
            echo "⚠  Privacy scan: HIGH risk detected in context artifact"
            echo "   → Adding to .gitignore instead of committing"
            echo "$SCAN_RESULT" | jq -r '.findings[]' | while read -r finding; do
                echo "   - $finding"
            done
            # Add the file to .gitignore
            if ! grep -q "^${SAVE_PATH}$" .gitignore 2>/dev/null; then
                echo "${SAVE_PATH}" >> .gitignore
            fi
            # Save to state (gitignored) instead of context (committed)
            STATE_PATH="${SAVE_PATH/.opencode\/context\//.opencode\/state\/harvest\/}"
            mkdir -p "$(dirname "$STATE_PATH")"
            echo "$ARTIFACT_CONTENT" > "$STATE_PATH"
            echo "   → Saved to $STATE_PATH (gitignored) instead"
            return
            ;;
        medium)
            echo "⚠  Privacy scan: MEDIUM risk detected in context artifact"
            echo "   → Flagging for review, saving to state (gitignored)"
            echo "$SCAN_RESULT" | jq -r '.findings[]' | while read -r finding; do
                echo "   - $finding"
            done
            # Save to state (gitignored) for review
            STATE_PATH="${SAVE_PATH/.opencode\/context\//.opencode\/state\/harvest\/}"
            mkdir -p "$(dirname "$STATE_PATH")"
            echo "$ARTIFACT_CONTENT" > "$STATE_PATH"
            echo "   → Saved to $STATE_PATH (gitignored) — review before promoting to context/"
            return
            ;;
        low)
            echo "✓ Privacy scan: LOW risk — safe to commit as durable context"
            ;;
        uncertain)
            echo "⚠  Privacy scan: UNCERTAIN — flagging for human review"
            echo "   → Saving to state (gitignored) for review"
            STATE_PATH="${SAVE_PATH/.opencode\/context\//.opencode\/state\/harvest\/}"
            mkdir -p "$(dirname "$STATE_PATH")"
            echo "$ARTIFACT_CONTENT" > "$STATE_PATH"
            echo "   → Saved to $STATE_PATH (gitignored) — review before promoting"
            return
            ;;
    esac
fi
```

**Important distinction**: Privacy scan distinguishes between:
- **Derived knowledge** (safe to commit): ADRs, pattern descriptions, architectural decisions, lessons learned, summaries, code snippets without credentials
- **Raw data** (risky): Full session transcripts, raw logs, environment dumps, config files with real values, API responses

The scan uses heuristics to tell these apart. Only raw data with actual secrets gets flagged.

### Step 4: Save Artifact

Write the output to the appropriate location:

| Subcommand | Save Location | Privacy Scan? |
|------------|---------------|---------------|
| `session` | `.opencode/state/harvest/session-{ts}.md` + promotions | Yes (promotions to context/) |
| `codebase` | `{directory}/AGENTS.md` files across codebase | No (AGENTS.md is metadata) |
| `skill` | `.opencode/skills/{name}/SKILL.md` or `~/.config/opencode/skills/{name}/SKILL.md` | No (skill definitions) |
| `agent` | `.opencode/agents/{name}.md` or `~/.config/opencode/agents/{name}.md` | No (agent definitions) |
| `rule` | `.opencode/rules/{name}.md` | No (rule definitions) |
| `command` | `.opencode/commands/{name}.md` | No (command definitions) |
| `memory` | `.opencode/state/project-memory.json`, `notepad.md`, wiki articles | Yes (if promoting to context/) |
| `docs` | On screen, optionally `.opencode/context/` | Yes (if saving to context/) |
| `consume` | `.opencode/context/research/{name}.md` | **Yes — always** |
| `decompose` | On screen, optionally `.opencode/context/` | Yes (if saving to context/) |
| `context` | `.opencode/context/` organized by function | **Yes — always** |
| `compress` | On screen, compressed output | No (computational) |
| `secondbrain` | `.opencode/context/` organized by role pack | Yes (for context files) |
| `journal` | `.opencode/state/harvest/journal/` | No (state, not committed) |
| `search` | On screen (results only) | No (read-only) |
| `prune` | `.opencode/context/` with archive staging | Yes (for archived context) |
| `export` | `.opencode/state/harvest/export-{ts}.md` | Yes (may include sensitive content) |
| `diff` | On screen, optionally `.opencode/state/harvest/` | Yes (if saved) |
| `sweep` | `.opencode/state/harvest/sweep-{ts}.md` + `.gitignore` updates | No (sweep is about gitignore) |

### Step 5: Confirm and Print

```
✓ Harvested: {artifact type}
  Saved to: {file path}
  {Description of what was created}

Related:
  - /ideation to plan next steps
  - /orchestrate to execute a plan
```

**⚠️ COMPLETION GUARDRAIL: After reporting the result, STOP. Do NOT offer to implement. Do NOT start coding. The user must explicitly approve before any code is written. See `rules/completion-guardrail.md`.**

## Scope Selection

For `skill` and `agent`, ask user about scope:

- **Project** (`.opencode/skills/` or `.opencode/agents/`) — specific to this project, committed to VCS
- **User** (`~/.config/opencode/skills/` or `~/.config/opencode/agents/`) — available across all projects

Default to project scope unless user specifies otherwise.

## Overlap Detection

Before creating a new skill, agent, or rule, check if something similar already exists:

```bash
# Check for existing artifacts with similar names
ls .opencode/skills/*/SKILL.md 2>/dev/null
ls .opencode/agents/*.md 2>/dev/null
ls .opencode/rules/*.md 2>/dev/null
ls ~/.config/opencode/skills/*/SKILL.md 2>/dev/null
ls ~/.config/opencode/agents/*.md 2>/dev/null
```

If overlap found: "A similar '{name}' already exists at {path}. Update it, or create a new one with a different name?"

## Post-Orchestration Harvest

When invoked after `/orchestrate`, automatically scan:

1. `.opencode/state/orchestration/` for completion reports
2. `.opencode/state/orchestration/progress/` for stage reports
3. `.opencode/state/orchestration/checkpoints/` for decision records

Extract decisions, patterns, and lessons learned into the appropriate artifact type.

## Related

- `/ideation` — Plan before you build
- `/orchestrate` — Execute with a specific pattern
- `remember` skill — Classify and promote knowledge
- `wiki` skill — Persistent knowledge base
- `skill-creator` skill — Deep skill creation guide
- `opencode-agent-creator` skill — Deep agent creation guide