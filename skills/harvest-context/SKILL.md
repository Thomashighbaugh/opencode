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

## No-Argument Behavior

When invoked without arguments (`/harvest-context`), list the subcommands as plain text and ask the user to choose. Do NOT call `hubMenu` or any other tool — just output the list directly. Available operations: session, codebase, skill, agent, rule, command, memory, docs, consume, decompose, context, compress, secondbrain, journal, sweep.

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

### `/harvest-context sweep` — Sweep Bloated `.opencode/` Artifacts

Proactively scan `.opencode/` for files and directories that should be gitignored but aren't. Prevents the `.opencode/` directory from swelling to sizes that break `git push`.

**Process:**
1. Scan `.opencode/` for files that should be in `.gitignore` but aren't:
   - `.opencode/node_modules/` — project-scoped tool deps
   - `.opencode/.vector/` — regenerable vector search DB
   - Large generated files (>1MB) in `state/` or `harvest/`
   - Session artifacts that reference commits not in git history
2. Check `.gitignore` exists and contains expected patterns
3. Report any missing entries — offer to add them
4. Report oversized files with paths and sizes
5. If `--fix` flag passed, auto-append missing patterns to `.gitignore`
6. Save a report to `.opencode/state/harvest/sweep-{timestamp}.md`

**Reminder:**
> Sweep: I'll scan your `.opencode/` directory for files that should be gitignored but aren't — preventing bloat that breaks git push.

---

## Auto-Sweep on Harvest

Every `/harvest-context` subcommand automatically runs a lightweight sweep check after saving its artifact. If it finds files that should be gitignored, it warns the user:

```
⚠  .opencode/ sweep: found 2 files that should be gitignored
   - .opencode/node_modules/ (58M) — missing from .gitignore
   - .opencode/.vector/ (12M) — missing from .gitignore
   Run /harvest-context sweep to fix.
```

---

## Shared Lifecycle

Every subcommand follows this pattern:

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

### Step 3: Save Artifact

Write the output to the appropriate location:

| Subcommand | Save Location |
|------------|---------------|
| `session` | `.opencode/state/harvest/session-{ts}.md` + promotions |
| `codebase` | `{directory}/AGENTS.md` files across codebase |
| `skill` | `.opencode/skills/{name}/SKILL.md` or `~/.config/opencode/skills/{name}/SKILL.md` |
| `agent` | `.opencode/agents/{name}.md` or `~/.config/opencode/agents/{name}.md` |
| `rule` | `.opencode/rules/{name}.md` |
| `command` | `.opencode/commands/{name}.md` |
| `memory` | `.opencode/state/project-memory.json`, `notepad.md`, wiki articles |
| `docs` | On screen, optionally `.opencode/context/` |
| `consume` | `.opencode/context/research/{name}.md` |
| `decompose` | On screen, optionally `.opencode/context/` |
| `context` | `.opencode/context/` organized by function |
| `sweep` | `.opencode/state/harvest/sweep-{ts}.md` + `.gitignore` updates |

### Step 4: Auto-Sweep Check

After saving any artifact, run a lightweight sweep:

```bash
# Quick scan for bloat risk
total_kb=$(du -sk .opencode/ 2>/dev/null | cut -f1)
if [ "$total_kb" -gt 10240 ]; then  # >10MB
  echo "⚠  .opencode/ is ${total_kb}KB — run /harvest-context sweep to check gitignore"
fi

# Check for known bloat vectors
for pattern in ".opencode/node_modules" ".opencode/.vector"; do
  if [ -d "$pattern" ] && ! grep -q "^$pattern" .gitignore 2>/dev/null; then
    echo "⚠  $pattern exists but is not gitignored — add it or run /harvest-context sweep --fix"
  fi
done
```

### Step 5: Confirm and Print

```
✓ Harvested: {artifact type}
  Saved to: {file path}
  {Description of what was created}

Related:
  - /ideation to plan next steps
  - /orchestrate to execute a plan
```

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