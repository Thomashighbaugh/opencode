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

## Subcommand Routing

| Subcommand | Skill/Delegate | What It Does |
|------------|----------------|--------------|
| `session` | inline | Extract decisions, patterns, and learnings from the current session |
| `codebase` | `deepinit` skill | Generate/update hierarchical AGENTS.md documentation across codebase |
| `skill` | `skill-creator` skill | Create a reusable skill from session knowledge |
| `agent` | `opencode-agent-creator` skill | Create a specialized agent definition |
| `rule` | inline | Create a project rule in `.opencode/rules/` |
| `command` | `opencode-command-creator` skill | Create a slash command |
| `memory` | `remember` skill | Promote session knowledge to durable project memory, notepad, or wiki |
| `docs` | Context7 MCP | Fetch up-to-date official documentation for any library via Context7 API |
| `web-research` | inline | Multi-source web research — parallel searches, synthesize findings into report |
| `compare` | inline | Compare alternatives — structured comparison table with recommendations |
| `decompose` | `@planner` agent | Break down concepts, problems, or goals into actionable units |
| `consume` | inline | Ingest file, directory, or URL — extract, summarize, save as durable context |
| `context` | inline | Manage context files — harvest summaries, extract from docs, organize, compact |
| `compress` | inline | Apply token compression strategies — density filtering, output compression, caching |
| `secondbrain` | inline | Set up privacy-first local knowledge base with markdown+Git, role packs |
| `journal` | inline | Set up event-sourced journal for orchestration runs with deterministic replay |
| `search` | inline | Semantic search across all context files — find decisions, patterns, research |
| `prune` | inline | Identify and archive/delete old or superseded context files |
| `export` | inline | Export project context as summary, markdown bundle, or team report |
| `diff` | inline | Compare current context state to previous checkpoint — new, changed, removed |
| `sweep` | inline | Scan `.opencode/` for files that should be gitignored — prevent bloat and leaks |

### Subcommand Behavior

Each subcommand follows the hub pattern:

1. **Print a terse reminder** (1-2 lines, see Terse Reminders table below)
2. **Scan existing state** — check for overlapping artifacts before creating new ones
3. **Privacy scan** before saving anything to `.opencode/context/` (committed knowledge)
4. **Execute** by delegating to the appropriate skill or running inline (see routing table above)
5. **Save artifact** to the correct location based on subcommand type
6. **Confirm and report inline** — do NOT offer to implement code changes

### Terse Reminders

| Subcommand | Reminder on Invoke |
|------------|-------------------|
| `session` | Session: Review conversation, extract key decisions, patterns, and learnings. |
| `codebase` | Codebase: Generate hierarchical AGENTS.md documentation across the codebase. |
| `skill` | Skill: Extract a repeatable workflow from session, structure as a skill. |
| `agent` | Agent: Define a specialized agent with role, instructions, and tool access. |
| `rule` | Rule: Capture a convention or constraint as a project rule for agents. |
| `command` | Command: Create a slash command wrapping a repeatable workflow. |
| `memory` | Memory: Classify session knowledge — project memory, notes, wiki, or AGENTS.md. |
| `docs` | Docs: Fetch official library docs via Context7 MCP API. |
| `web-research` | Web Research: Parallel searches, fetch top results, synthesize into report. |
| `compare` | Compare: Research and compare alternatives with structured comparison table. |
| `decompose` | Decompose: Break down concepts, problems, or goals into actionable units. |
| `consume` | Consume: Ingest file, directory, or URL — extract, summarize, save as context. |
| `context` | Context: Harvest summaries, extract from docs, organize, or compact context files. |
| `compress` | Compress: Apply token compression — density filtering, output compression, caching. |
| `secondbrain` | Secondbrain: Privacy-first local knowledge base with markdown+Git and role packs. |
| `journal` | Journal: Event-sourced orchestration journal with deterministic replay. |
| `search` | Search: Semantic search across all context files for matching decisions/patterns. |
| `prune` | Prune: Scan for old or superseded context files and archive or delete them. |
| `export` | Export: Create summary, bundle, or team report from project context. |
| `diff` | Diff: Compare current context against last checkpoint — new, changed, removed. |
| `sweep` | Sweep: Scan `.opencode/` for un-gitignored files — prevent bloat and privacy leaks. |

---

## Shared Lifecycle

Every subcommand follows this pattern:

### Step 0: Parse Flags

Check for flags:
- `--quiet`: when present, suppress all inline progress narration. Only print the final result and any errors.
- `--compress`: when present, run the context compression script after saving artifacts (see Step 4).
- `--compress-threshold=N`: set the compression line threshold (default 200). Files with fewer than N lines are not compressed.

### Step 1: Scan Existing State

Scan both durable context (committed) and state (gitignored) for overlapping artifacts:

```bash
ls .opencode/context/research/ 2>/dev/null
ls .opencode/context/patterns/ 2>/dev/null
ls .opencode/context/frameworks/ 2>/dev/null
ls .opencode/state/harvest/ 2>/dev/null
```

If overlapping artifacts exist, ask user: "Found prior harvest on [topic]. Use as context, overwrite, or skip?"

### Step 2: Execute Subcommand

Load and execute the appropriate skill or inline process (see Subcommand Routing table).

### Step 3: Privacy Scan (Before Saving to Context)

Before saving any artifact to `.opencode/context/` (durable, committed knowledge), run a privacy scan to detect secrets, PII, or privacy-compromising content:

```bash
PRIVACY_SCAN="$HOME/.config/opencode/skills/privacy-scan/scripts/scan-privacy.mjs"
if [[ -f "$PRIVACY_SCAN" ]]; then
    SCAN_RESULT=$(echo "$ARTIFACT_CONTENT" | node "$PRIVACY_SCAN" --stdin 2>/dev/null)
    SCAN_RISK=$(echo "$SCAN_RESULT" | jq -r '.risk' 2>/dev/null)
    case "$SCAN_RISK" in
        high|medium|uncertain)
            # Save to state/harvest (gitignored) instead of context (committed) — review before promoting
            STATE_PATH="${SAVE_PATH/.opencode\/context\//.opencode\/state\/harvest\/}"
            mkdir -p "$(dirname "$STATE_PATH")"
            echo "$ARTIFACT_CONTENT" > "$STATE_PATH"
            echo "Saved to $STATE_PATH (gitignored) — review before promoting to context/"
            ;;
        low)
            echo "✓ Privacy scan: LOW risk — safe to commit as durable context"
            ;;
    esac
fi
```

**Important distinction**: Privacy scan distinguishes between:
- **Derived knowledge** (safe to commit): ADRs, pattern descriptions, architectural decisions, lessons learned, summaries
- **Raw data** (risky): Full session transcripts, raw logs, config files with real values, API responses

### Step 4: Save Artifact

Write the output to the appropriate location:

| Subcommand | Save Location | Privacy Scan? |
|------------|---------------|---------------|
| `session` | `.opencode/state/harvest/session-{ts}.md` + promotions | Yes (promotions to context/) |
| `codebase` | `{directory}/AGENTS.md` files across codebase | No (metadata) |
| `skill` | `.opencode/skills/{name}/SKILL.md` or `~/.config/opencode/skills/{name}/SKILL.md` | No (definition) |
| `agent` | `.opencode/agents/{name}.md` or `~/.config/opencode/agents/{name}.md` | No (definition) |
| `rule` | `.opencode/rules/{name}.md` | No (definition) |
| `command` | `.opencode/commands/{name}.md` | No (definition) |
| `memory` | memory/notepad/wiki files | Yes (if promoting to context/) |
| `docs` | On screen, optionally `.opencode/context/` | Yes (if saving) |
| `consume` | `.opencode/context/research/{name}.md` | **Yes — always** |
| `context` | `.opencode/context/` organized by function | **Yes — always** |
| `web-research` | `.opencode/context/research/{topic}.md` | **Yes — always** |
| `compare` | `.opencode/context/patterns/{a}-vs-{b}.md` | **Yes — always** |
| `decompose` | `.opencode/context/frameworks/{topic}-decomposition.md` | Yes |
| `compress` | On screen, compressed output | No (computational) |
| `secondbrain` | `.opencode/context/` organized by role pack | Yes (for context) |
| `journal` | `.opencode/state/harvest/journal/` | No (state) |
| `search` | On screen (results only) | No (read-only) |
| `prune` | `.opencode/context/` with archive staging | Yes (for archived) |
| `export` | `.opencode/state/harvest/export-{ts}.md` | Yes (may include sensitive) |
| `diff` | On screen, optionally `.opencode/state/harvest/` | Yes (if saved) |
| `sweep` | `.opencode/state/harvest/sweep-{ts}.md` + `.gitignore` | No (about gitignore) |

**If `--compress` flag was set**: after saving, run the compression script to reduce verbose artifacts:

```bash
COMPRESS_SCRIPT="$HOME/.config/opencode/skills/harvest-context/scripts/compress-context.mjs"
if [[ -f "$COMPRESS_SCRIPT" ]]; then
    THRESHOLD="${COMPRESS_THRESHOLD:-200}"
    node "$COMPRESS_SCRIPT" --file "$SAVE_PATH" --backup --threshold "$THRESHOLD"
fi
```

Exemptions: `decisions.md` is never compressed by the script (hardcoded exemption).

### Step 5: Confirm and Report

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
ls .opencode/skills/*/SKILL.md 2>/dev/null
ls .opencode/agents/*.md 2>/dev/null
ls .opencode/rules/*.md 2>/dev/null
ls ~/.config/opencode/skills/*/SKILL.md 2>/dev/null
ls ~/.config/opencode/agents/*.md 2>/dev/null
```

If overlap found: "A similar '{name}' already exists at {path}. Update it, or create a new one with a different name?"

## Related

- `/ideation` — Plan before you build
- `/orchestrate` — Execute with a specific pattern
- `remember` skill — Classify and promote knowledge
- `wiki` skill — Persistent knowledge base
- `skill-creator` skill — Deep skill creation guide
- `opencode-agent-creator` skill — Deep agent creation guide