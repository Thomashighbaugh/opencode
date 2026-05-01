# Phase 3: Configuration

Generate configuration files based on Phase 2 plan.

## Delegation

```
Task(subagent_type="executor",
  prompt="Create .opencode configuration from initialization plan")
```

## Input

Read plan from `.opencode/state/init-plan.json`.

## Execution Steps

### Step 1: Create Directory Structure

```bash
PROJECT_ROOT="$(pwd)"
OPENCODE_DIR="$PROJECT_ROOT/.opencode"

# Always create core directories
mkdir -p "$OPENCODE_DIR"
mkdir -p "$OPENCODE_DIR/state/state"
mkdir -p "$OPENCODE_DIR/state/plans"
mkdir -p "$OPENCODE_DIR/state/logs"
mkdir -p "$OPENCODE_DIR/state/artifacts"

# Full mode directories
if [[ "$MODE" == "full" ]]; then
    mkdir -p "$OPENCODE_DIR/agent"
    mkdir -p "$OPENCODE_DIR/skills"
    mkdir -p "$OPENCODE_DIR/commands"
    mkdir -p "$OPENCODE_DIR/tools"
    mkdir -p "$OPENCODE_DIR/rules"
    mkdir -p "$OPENCODE_DIR/templates"
fi
```

### Step 2: Generate opencode.jsonc

Read language-specific template and generate:

```bash
generate_opencode_jsonc() {
    local output="$1"
    local lang="$2"
    local pkg_manager="$3"

    cat > "$output" << 'JSONC_EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "opencode": { "options": {} },
    "ollama": {
      "models": {
        "glm-5.1:cloud": { "_launch": true, "limit": { "context": 202752, "output": 131072 } },
        "kimi-k2.5:cloud": { "_launch": true, "limit": { "context": 262144, "output": 262144 } },
        "minimax-m2.7:cloud": { "_launch": true, "limit": { "context": 204800, "output": 128000 } },
        "qwen3.5:cloud": { "_launch": true, "limit": { "context": 262144, "output": 32768 } }
      }
    }
  },
  "permission": {
    "edit": { ".opencode/state/**": "allow" }
  },
  "mcp": {},
JSONC_EOF

    # Add language-specific tools
    case "$lang" in
        typescript|javascript)
            cat >> "$output" << 'TOOLS_EOF'
  "tools": {
    "getSessionID": "./tools/getSessionID.ts",
    "saveCommitMessage": "./tools/saveCommitMessage.ts",
    "getCommitMessage": "./tools/getCommitMessage.ts",
    "loadSkill": "./tools/loadSkill.ts",
    "agentContext": "./tools/agentContext.ts",
    "listAgents": "./tools/listAgents.ts",
    "modeState": "./tools/modeState.ts",
    "taskTodos": "./tools/taskTodos.ts",
    "runSkillScript": "./tools/runSkillScript.ts",
    "artifacts": "./tools/artifacts.ts"
  },
TOOLS_EOF
            ;;
        python)
            cat >> "$output" << 'TOOLS_EOF'
  "tools": {
    "getSessionID": "./tools/getSessionID.ts",
    "saveCommitMessage": "./tools/saveCommitMessage.ts",
    "getCommitMessage": "./tools/getCommitMessage.ts",
    "loadSkill": "./tools/loadSkill.ts",
    "agentContext": "./tools/agentContext.ts",
    "listAgents": "./tools/listAgents.ts",
    "modeState": "./tools/modeState.ts",
    "taskTodos": "./tools/taskTodos.ts",
    "runSkillScript": "./tools/runSkillScript.ts",
    "artifacts": "./tools/artifacts.ts"
  },
TOOLS_EOF
            ;;
        *)
            cat >> "$output" << 'TOOLS_EOF'
  "tools": {},
TOOLS_EOF
            ;;
    esac

    # Close JSON
    cat >> "$output" << 'CLOSE_EOF'
  "plugin": ["./plugins/joc-plugin.ts"],
  "instructions": ["AGENTS.md"],
  "skills": { "paths": ["./.opencode/skills"] },
  "agents": { "paths": ["./.opencode/agent"] },
  "commands": { "paths": ["./.opencode/commands"] }
}
CLOSE_EOF
}
```

### Step 3: Generate AGENTS.md

Create project-specific AGENTS.md:

```bash
generate_agents_md() {
    local output="$1"
    local lang="$2"
    local framework="$3"
    local pkg="$4"

    cat > "$output" << AGENTS_EOF
<!-- Generated: $(date -Iseconds) | Updated: $(date -Iseconds) -->

# $(basename "$(pwd)") - Project Instructions

## Overview

TODO: Add project overview

## Technology Stack

- **Language**: $lang
- **Framework**: $framework
- **Package Manager**: $pkg

AGENTS_EOF

    # Add language-specific sections
    case "$lang" in
        typescript|javascript)
            cat >> "$output" << 'TS_EOF'

## Build Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run build` | Build for production |
| `npm test` | Run tests |
| `npm run lint` | Lint code |
| `npm run dev` | Start development server |

## Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Prefer functional components

## Testing Requirements

- Unit tests in `__tests__/` or `*.test.ts`
- E2E tests in `e2e/` or `*.e2e.ts`
- Minimum 80% coverage

## Git Workflow

- Feature branches: `feature/...`
- Fix branches: `fix/...`
- Conventional commits required

TS_EOF
            ;;
        python)
            cat >> "$output" << 'PY_EOF'

## Build Commands

| Command | Description |
|---------|-------------|
| `pip install -e .` | Install in dev mode |
| `python -m pytest` | Run tests |
| `ruff check .` | Lint code |
| `black .` | Format code |
| `mypy .` | Type check |

## Code Style

- Use type hints
- Follow PEP 8
- Use docstrings for public APIs
- Prefer composition over inheritance

## Testing Requirements

- Unit tests in `tests/`
- Coverage via pytest-cov
- Minimum 80% coverage

## Git Workflow

- Feature branches: `feature/...`
- Fix branches: `fix/...`
- Conventional commits required

PY_EOF
            ;;
        rust)
            cat >> "$output" << 'RUST_EOF'

## Build Commands

| Command | Description |
|---------|-------------|
| `cargo build` | Build project |
| `cargo test` | Run tests |
| `cargo clippy` | Lint code |
| `cargo fmt` | Format code |
| `cargo run` | Run application |

## Code Style

- Follow Rust idioms
- Use clippy lints
- Document public APIs
- Prefer safe code

## Testing Requirements

- Unit tests in `#[cfg(test)]` modules
- Integration tests in `tests/`
- Minimum 80% coverage

## Git Workflow

- Feature branches: `feature/...`
- Fix branches: `fix/...`
- Conventional commits required

RUST_EOF
            ;;
        *)
            cat >> "$output" << 'GEN_EOF'

## Build Commands

TODO: Add build commands for this project

## Code Style

TODO: Add code style guidelines

## Testing Requirements

TODO: Add testing requirements

## Git Workflow

- Feature branches: `feature/...`
- Fix branches: `fix/...`
- Conventional commits required

GEN_EOF
            ;;
    esac

    # Add manual section marker
    cat >> "$output" << 'MANUAL_EOF'

<!-- MANUAL: Add custom instructions below this line -->
MANUAL_EOF
}
```

### Step 4: Copy Rules (Full Mode)

```bash
copy_rules() {
    local lang="$1"
    local rules_dir="$OPENCODE_DIR/rules"
    local templates_dir="${SKILL_ROOT}/templates"

    case "$lang" in
        typescript|javascript)
            cp "$templates_dir/rules/naming.typescript.md" "$rules_dir/naming.md"
            cp "$templates_dir/rules/patterns.typescript.md" "$rules_dir/patterns.md"
            [[ -f "$templates_dir/rules/conventions.typescript.md" ]] && \
                cp "$templates_dir/rules/conventions.typescript.md" "$rules_dir/conventions.md"
            ;;
        python)
            cp "$templates_dir/rules/naming.python.md" "$rules_dir/naming.md"
            cp "$templates_dir/rules/patterns.python.md" "$rules_dir/patterns.md"
            [[ -f "$templates_dir/rules/conventions.python.md" ]] && \
                cp "$templates_dir/rules/conventions.python.md" "$rules_dir/conventions.md"
            ;;
        rust)
            cp "$templates_dir/rules/naming.rust.md" "$rules_dir/naming.md"
            cp "$templates_dir/rules/patterns.rust.md" "$rules_dir/patterns.md"
            [[ -f "$templates_dir/rules/safety.rust.md" ]] && \
                cp "$templates_dir/rules/safety.rust.md" "$rules_dir/safety.md"
            ;;
        go)
            cp "$templates_dir/rules/naming.go.md" "$rules_dir/naming.md"
            cp "$templates_dir/rules/patterns.go.md" "$rules_dir/patterns.md"
            ;;
        *)
            cp "$templates_dir/rules/naming.generic.md" "$rules_dir/naming.md"
            cp "$templates_dir/rules/patterns.generic.md" "$rules_dir/patterns.md"
            ;;
    esac
}
```

### Step 5: Update .gitignore

```bash
update_gitignore() {
    local gitignore="$PROJECT_ROOT/.gitignore"

    # Create .gitignore if it doesn't exist
    if [[ ! -f "$gitignore" ]]; then
        touch "$gitignore"
    fi

    # Check if .opencode/state/ is already ignored
    if ! grep -q "^\.opencode/state/" "$gitignore" 2>/dev/null; then
        echo "" >> "$gitignore"
        echo "# OpenCode JOC session state" >> "$gitignore"
        echo ".opencode/state/" >> "$gitignore"
    fi
}
```

### Step 6: Handle Refresh Mode

For `--refresh` mode, preserve existing:

```bash
refresh_config() {
    local existing="$1"
    local new="$2"

    # Read existing AGENTS.md
    if [[ -f "$existing" ]]; then
        # Extract manual sections (after <!-- MANUAL -->)
        local manual_content
        manual_content=$(sed -n '/<!-- MANUAL/,//p' "$existing")

        # Append to new content
        echo "$manual_content" >> "$new"
    fi

    # Read existing opencode.jsonc
    # Merge tool configurations
    # Preserve custom agents/skills/commands paths
}
```

## Delegation Example

```
Task(
  subagent_type="executor",
  prompt="Execute initialization plan from .opencode/state/init-plan.json.

Task list:
{tasks}

For each task:
1. Create directory structure
2. Generate opencode.jsonc from template
3. Create AGENTS.md with language-specific sections
4. Copy rules templates (full mode)
5. Update .gitignore

Mode: {minimal|full|refresh}

Project root: $(pwd)

Write all files and report completion status."
)
```

## Output

After execution:
- `.opencode/opencode.jsonc` created
- `.opencode/AGENTS.md` created
- `.opencode/rules/*.md` created (full mode)
- `.opencode/state/` directory created
- `.gitignore` updated

## Checkpoint

Save checkpoint to `.opencode/state/init-checkpoint.json`:
```json
{
  "lastCompletedPhase": 3,
  "timestamp": "2024-01-15T10:30:00Z",
  "files": [
    ".opencode/opencode.jsonc",
    ".opencode/AGENTS.md",
    ".opencode/state/"
  ]
}
```

## Next Phase

After configuration completes, proceed to **Phase 4: Documentation**.