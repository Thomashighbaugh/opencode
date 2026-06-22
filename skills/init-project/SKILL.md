# Init Project

Unified project initialization hub with subcommand routing. Detects, scaffolds, documents, and refines an OpenCode Hubs project. Works for both first-time setup and iterative re-runs.

## When to Use

- First time setting up Hubs in a project
- Adding Hubs to an existing codebase
- Refreshing config after major changes (refactors, new deps, team growth)
- Re-running to capture new context and refine docs
- Replacing `/hubs-setup`, `/deepinit`, or `/init-project-config`

## No-Argument Behavior

When invoked without arguments (`/init-project`), list the subcommands as plain text and ask the user to choose. Do NOT call `hubMenu` or any other tool — just output the list directly. Available phases: setup, detect, docs, context, verify, refresh, status, map-codebase, doctor, reset, provision.

## With-Argument Behavior

Directly invoke the matching subcommand. Print the reminder, then delegate to the appropriate phase or agent.

## Subcommand Routing

| Subcommand | Phases | Skill/Delegate | What It Does |
|------------|--------|----------------|--------------|
| `setup` | 0-7 | self (all phases) | Full project initialization from scratch |
| `detect` | 0-1 | `explore` agent | Verify global Hubs + detect language, framework, tooling |
| `docs` | 4 | `deepinit` skill | Regenerate hierarchical AGENTS.md documentation |
| `context` | 5 | `remember` + `wiki` | Capture session knowledge, promote insights |
| `verify` | 7 | `verifier` agent | Validate configuration completeness and integrity, including .gitignore privacy protections |
| `refresh` | 0-7 (merge) | self (all phases, merge mode) | Update existing config, preserve manual edits |
| `status` | — | self (inline) | List state files and show checkpoint progress |
| `map-codebase` | — | inline | Analyze existing codebase — spawn parallel agents to map stack, architecture, conventions |
| `doctor` | — | inline | Run diagnostic health check — validate Hubs installation, config integrity, state consistency |
| `reset` | — | inline | Reset project state — archive .opencode/state and .opencode/context, start fresh |
| `provision` | Provision 1-7 | `provision` skill | Analyze codebase and auto-generate project-specific agents, skills, tools, and rules |

### Subcommand Behavior

Each subcommand follows the hub pattern:

1. **Print a terse reminder** (1-2 lines, hardcoded below — never generated dynamically)
2. **Check for prior state** in `.opencode/state/init/`
3. If prior state exists, resume automatically or start fresh based on subcommand context
4. **Execute** by delegating to the appropriate phase or agent
5. **Report results** inline — do NOT offer next steps or chain into other subcommands

### Terse Reminders

| Subcommand | Reminder on Invoke |
|------------|-------------------|
| `setup` | Full init from scratch. I'll verify global Hubs, detect your stack, scaffold config, generate docs, and validate. |
| `detect` | Detecting your project stack. I'll identify language, framework, package manager, build system, and CI. |
| `docs` | Generating codebase documentation. I'll create hierarchical AGENTS.md files across your directories. |
| `context` | Capturing session knowledge. I'll promote insights to project memory, notepad, and AGENTS.md. |
| `verify` | Validating configuration. I'll check file existence, config syntax, parent refs, and gitignore. |
| `refresh` | Updating existing config. I'll preserve your manual edits and merge new detections. |
| `status` | Showing init state and checkpoint progress. |
| `map-codebase` | Mapping existing codebase. I'll spawn parallel agents to analyze stack, architecture, and conventions. |
| `doctor` | Running Hubs health diagnostics. I'll validate installation, config integrity, and state consistency. |
| `reset` | Resetting project state. I'll archive .opencode/state and .opencode/context to a timestamped backup and start fresh. |
| `provision` | Provisioning project-aware agents, skills, tools, and rules. I'll analyze your codebase and generate tailored artifacts. |

### Flag Parsing

Flags modify subcommand behavior and are passed through:

| Flag | Effect | Applies To |
|------|--------|------------|
| `--minimal` | Essential files only, no docs | `setup`, `refresh` |
| `--full` | Everything including context and routing | `setup`, `refresh` |
| `--force` | Skip "already exists" checks | `setup`, `refresh`, `docs` |
| `--language <lang>` | Force language, skip detection | `setup`, `detect`, `refresh` |
| `--no-detect` | Use generic defaults | `setup`, `refresh` |
| `--no-docs` | Skip Phase 4 | `setup`, `refresh` |

Default (no flags, `setup` subcommand): Phases 0-5 (full scaffold + provision + docs, no context/routing).

## State Management

Init state lives in `.opencode/state/init/` (gitignored).

### State Paths

| Path | Purpose |
|------|---------|
| `.opencode/state/init/init-checkpoint.json` | Last completed phase checkpoint |
| `.opencode/state/init/init-detection.json` | Phase 1 detection results |
| `.opencode/state/init/init-plan.json` | Phase 2 initialization plan |
| `.opencode/state/init/init-report.md` | Phase 7 verification report |
| `.opencode/state/init/` | All init state files |

### Checkpoint Format

```json
{
  "lastCompletedPhase": 3,
  "timestamp": "2024-01-15T10:30:00Z",
  "subcommand": "setup",
  "mode": "full",
  "files": [
    ".opencode/opencode.jsonc",
    ".opencode/AGENTS.md",
    ".opencode/state/"
  ]
}
```

### Resume Behavior

- **Resume**: Load latest checkpoint, continue from the next phase
- **Status**: List all state files in `.opencode/state/init/` with timestamps

### Cross-Hub Hand-Off

- `/init-project setup --full` completion can trigger `/harvest-context` offer
- `/init-project docs` output feeds into `/ideation` as project context
- `/init-project verify` results can inform `/project` operations
- `/ideation` final plans may reference `/init-project` detection results

## Architecture

| Phase | Agent/Skill | Purpose |
|-------|-------------|---------|
| 0 - Global Verify | self | Ensure `~/.config/opencode/` is healthy |
| 1 - Detection | `explore` | Scan project files, detect language/framework, detect available LSPs |
| 2 - Planning | `planner` | Generate initialization plan from detection |
| 3 - Scaffolding | `executor` | Create `.opencode/` structure, opencode.jsonc, AGENTS.md |
| 4 - Provisioning | `executor` + `config-orchestrator` | Create project-specific agents, tools, commands, skills scaled to mode |
| 5 - Docs | `deepinit` | Hierarchical AGENTS.md across codebase |
| 6 - Context Capture | `remember` + `wiki` | Promote session knowledge, scan state artifacts |
| 7 - Routing | `architect` | Optimize agent selection for detected stack |
| 8 - Verification | `verifier` | Validate completeness, references, config |

The effort in Phase 4 scales with the init mode:
- `--minimal`: Create empty directories only
- Default: Stub agents + basic commands
- `--full`: Thorough agents with full prompts + project-specific TypeScript tools + comprehensive commands + reusable skills

## Subcommand: setup

Full project initialization from scratch. Runs all applicable phases (0-8 by default, 0-3 with `--minimal`, 0-8 with `--full`).

### Pre-Flight

Before starting any phases, determine scope:

```bash
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
OPENCODE_DIR="$PROJECT_ROOT/.opencode"
GLOBAL_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"

if [ -d "$OPENCODE_DIR" ] && [ -f "$OPENCODE_DIR/opencode.jsonc" ]; then
  IS_RERUN="true"
  echo "Existing .opencode/ configuration found — running in refresh mode"
else
  IS_RERUN="false"
  echo "No .opencode/ found — running initial setup"
fi

if [ -f "$GLOBAL_DIR/AGENTS.md" ] && [ -f "$GLOBAL_DIR/opencode.jsonc" ]; then
  GLOBAL_HEALTHY="true"
else
  GLOBAL_HEALTHY="false"
  echo "WARNING: Global Hubs config incomplete or missing"
fi
```

If `IS_RERUN=true` and no `--force` or `--refresh` flag was passed, ask:

**Question:** "This project already has `.opencode/` configured. What would you like to do?"

**Options:**
1. **Refresh** - Update configuration and docs, preserve manual edits
2. **Full re-init** - Re-run all phases from scratch (`--force`)
3. **Docs only** - Regenerate AGENTS.md documentation only (`docs` subcommand)
4. **Cancel** - Exit without changes

### Phase Execution

Run phases sequentially, saving checkpoints after each phase:

1. Phase 0: Verify global Hubs
2. Phase 1: Detect project stack
3. Phase 2: Plan configuration
4. Phase 3: Scaffold `.opencode/`
5. Phase 4: Provision project-specific agents, tools, commands, skills (scales with mode)
6. Phase 5: Generate docs (skip if `--minimal` or `--no-docs`)
7. Phase 6: Capture context (skip if not `--full`)
8. Phase 7: Optimize routing (skip if not `--full`)
9. Phase 8: Validate everything

Save checkpoint after each phase to `.opencode/state/init/init-checkpoint.json`.

On completion, display summary and offer next step:
- If `--minimal`: Offer `/init-project docs`
- If default: Offer `/init-project context` or `/init-project verify`
- If `--full`: Offer `/harvest-context` or `/project workspace` to manage the new setup

## Subcommand: detect

Verify global Hubs installation and detect project configuration. Phases 0-1 only.

### Behavior

1. Check `~/.config/opencode/` for essential files
2. Fix missing global directories/files if needed
3. Scan project for language, framework, package manager, build system, CI
4. Save detection results to `.opencode/state/init/init-detection.json`

Delegate Phase 1 to `explore` agent. See `phases/01-detection.md` for full detection sequence.

### Output

```json
{
  "language": "typescript",
  "framework": "nextjs",
  "packageManager": "npm",
  "buildSystem": "tsc",
  "directories": ["src", "tests", "docs", ".github"],
  "ci": "github-actions",
  "confidence": "high"
}
```

On completion, offer next step: `/init-project setup` or `/init-project docs`

## Subcommand: docs

Regenerate hierarchical AGENTS.md documentation. Phase 4 only.

### Behavior

1. Check for `.opencode/state/init/init-detection.json` — if missing, run detect first
2. Delegate to `deepinit` skill for documentation generation
3. See `phases/04-documentation.md` for full workflow

### Re-Run Behavior

When AGENTS.md files already exist:

1. Read and parse existing content
2. Identify auto-generated vs manual sections
3. Detect structural changes (new/removed files)
4. Update auto-generated content only
5. Preserve all `<!-- MANUAL -->` annotations
6. Update timestamps

On completion, offer next step: `/init-project context` or `/init-project verify`

## Subcommand: context

Capture session knowledge and promote insights to durable documentation. Phase 5 only.

### Behavior

1. Scan `.opencode/state/` for useful artifacts
2. Invoke `remember` skill to classify session knowledge
3. Promote insights to project memory, notepad, or AGENTS.md
4. See SKILL.md Phase 5 for full workflow

### Output

- Updated `project-memory.json` with durable project facts
- Updated `notepad.md` with high-signal session context
- Optional AGENTS.md additions for project-specific patterns

On completion, offer next step: `/init-project verify`

## Subcommand: verify

Validate configuration completeness and integrity. Phase 7 only.

### Behavior

1. Check file existence
2. Validate opencode.jsonc syntax
3. Check AGENTS.md structure
4. Verify parent references resolve
5. Confirm .gitignore configured
6. Validate state directory structure
7. Test config loadability

See `phases/05-verification.md` for full verification checklist.

### Output

Display verification report:

```
✓ Project initialized: {project_name}

Created/Updated:
  .opencode/opencode.jsonc     ✓
  .opencode/AGENTS.md          ✓
  .opencode/rules/*.md         3 files
  .opencode/state/             ✓

Verified:
  ✓ All required files present
  ✓ Configuration syntax valid
  ✓ AGENTS.md structure complete
  ✓ Parent references valid
  ✓ .gitignore configured (state, sessions, chat-history, node_modules)
  ✓ Privacy scan — no secrets in context files
  ✓ State directories created
```

## Subcommand: refresh

Update existing configuration, preserving manual edits. Phases 0-7 in merge mode.

### Behavior

Identical to `setup` but in merge mode:

1. **Read existing** — parse current `.opencode/opencode.jsonc` and `AGENTS.md`
2. **Diff structure** — compare current directory tree vs what AGENTS.md describes
3. **Preserve manual edits** — keep `<!-- MANUAL -->` blocks in AGENTS.md files
4. **Update generated sections** — refresh file tables, directories, dependencies
5. **Add new detections** — add newly found files/dirs, mark removed ones
6. **Merge configs** — add new fields to opencode.jsonc, don't remove user-set values

Equivalent to `setup` with `--refresh` flag.

## Subcommand: status

List initialization state files and show checkpoint progress. No phases.

### Behavior

```bash
STATE_DIR=".opencode/state/init"

echo "=== Init Project State ==="

if [ -f "$STATE_DIR/init-checkpoint.json" ]; then
  echo "Last checkpoint:"
  cat "$STATE_DIR/init-checkpoint.json"
else
  echo "No checkpoint found — project not yet initialized"
fi

echo ""
echo "State files:"
ls -la "$STATE_DIR/" 2>/dev/null || echo "  (none)"

echo ""
echo "Detection results:"
if [ -f "$STATE_DIR/init-detection.json" ]; then
  cat "$STATE_DIR/init-detection.json"
else
  echo "  No detection results — run detect first"
fi
```

## Phase Details

Detailed phase documentation is in `phases/`:

- `phases/01-detection.md` — Language, framework, tooling detection
- `phases/02-planning.md` — Configuration planning
- `phases/03-configuration.md` — Scaffolding and file generation
- `phases/04-documentation.md` — Hierarchical AGENTS.md generation
- `phases/05-verification.md` — Validation and integrity checks

## Idempotency

This command is **safe to re-run**. It:

- Preserves `<!-- MANUAL -->` blocks in AGENTS.md files
- Merges new fields into opencode.jsonc without removing user values
- Only adds new AGENTS.md files, updates existing ones in-place
- Detects and respects existing configuration
- Never deletes user-created project skills, agents, or commands
- Archives stale state artifacts instead of deleting them

## Resume on Failure

If a phase fails, save checkpoint:

```bash
mkdir -p ".opencode/state/init"
echo "{\"lastCompletedPhase\":$COMPLETED_PHASE,\"timestamp\":\"$(date -Iseconds)\"}" > ".opencode/state/init/init-checkpoint.json"
```

Resume with `/init-project setup --force` or `/init-project refresh`.

## Related

- `deepinit` skill — Standalone docs generation (called by `docs` subcommand)
- `remember` skill — Context promotion (called by `context` subcommand)
- `wiki` skill — Persistent knowledge base (used by `context` subcommand)
- `mcp-setup` skill — MCP server configuration
- `hubs-doctor` skill — Diagnose installation issues
- `/ideation` hub — Planning and research
- `/orchestrate` hub — Execution patterns
- `/harvest-context` hub — Context and artifact extraction