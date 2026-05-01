# Phase 2: Planning

Generate initialization plan based on Phase 1 detection results.

## Delegation

```
Task(subagent_type="planner",
  prompt="Create initialization plan from detection results")
```

## Input

Read detection results from `.opencode/state/init-detection.json`:

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

## Planning Steps

### Step 1: Load Detection Results

```bash
DETECTION_FILE=".opencode/state/init-detection.json"

if [[ ! -f "$DETECTION_FILE" ]]; then
    echo "Error: Detection results not found. Run Phase 1 first."
    exit 1
fi

LANGUAGE=$(jq -r '.language' "$DETECTION_FILE")
FRAMEWORK=$(jq -r '.framework' "$DETECTION_FILE")
PACKAGE_MANAGER=$(jq -r '.packageManager' "$DETECTION_FILE")
BUILD_SYSTEM=$(jq -r '.buildSystem' "$DETECTION_FILE")
DIRECTORIES=$(jq -r '.directories[]' "$DETECTION_FILE")
CI=$(jq -r '.ci' "$DETECTION_FILE")
```

### Step 2: Determine Configuration Scope

Based on mode flag:

| Mode | Files to Create |
|------|------------------|
| `minimal` | `.opencode/opencode.jsonc`, `.opencode/AGENTS.md`, `.opencode/state/` |
| `full` | All files including rules, templates, custom agents |
| `refresh` | Merge with existing, preserve manual sections |

### Step 3: Select Rules Templates

Map detection to rule templates:

| Language | Rules Files |
|----------|-------------|
| `typescript` | `naming.typescript.md`, `patterns.typescript.md`, `conventions.typescript.md` |
| `javascript` | `naming.javascript.md`, `patterns.javascript.md` |
| `python` | `naming.python.md`, `patterns.python.md`, `conventions.python.md` |
| `rust` | `naming.rust.md`, `patterns.rust.md`, `safety.rust.md` |
| `go` | `naming.go.md`, `patterns.go.md` |
| `java` | `naming.java.md`, `patterns.java.md` |
| `ruby` | `naming.ruby.md`, `patterns.ruby.md` |
| `cpp` | `naming.cpp.md`, `patterns.cpp.md` |
| `c` | `naming.c.md`, `patterns.c.md` |
| `generic` | `naming.generic.md`, `patterns.generic.md` |

### Step 4: Determine Tool Configuration

Map language to required tools:

| Language | Required Tools |
|----------|----------------|
| `typescript` | `tsc`, `eslint`, `prettier` |
| `javascript` | `eslint`, `prettier` |
| `python` | `ruff`, `black`, `mypy` |
| `rust` | `cargo clippy`, `rustfmt` |
| `go` | `golint`, `go fmt` |
| `java` | `mvn` / `gradle` |
| `ruby` | `rubocop`, `rspec` |

### Step 5: Plan AGENTS.md Content

Generate AGENTS.md outline based on detection:

```markdown
# Project AGENTS.md Plan

## Detected Configuration
- Language: {language}
- Framework: {framework}
- Package Manager: {packageManager}
- Build System: {buildSystem}

## Required Sections

### Project Overview
- Description placeholder (user to edit)
- Technology stack summary

### Build Commands
- Install: {packageManager} install
- Build: {buildCommand}
- Test: {testCommand}
- Lint: {lintCommand}

### Code Organization
- Key directories explanation
- Module structure

### Git Workflow
- Branch naming
- Commit conventions

### Development Guidelines
- Language-specific patterns
- Framework conventions
- Testing requirements

## Manual Sections
- User customization notes
- Project-specific rules
```

### Step 6: Create Execution Plan

Generate ordered task list for Phase 3:

```json
{
  "tasks": [
    {
      "id": "create-directories",
      "description": "Create .opencode directory structure",
      "command": "mkdir -p .opencode/{agent,skills,commands,tools,rules,templates,state/{state,plans,logs,artifacts}}"
    },
    {
      "id": "generate-opencode-jsonc",
      "description": "Generate opencode.jsonc with language-specific tools",
      "template": "opencode.jsonc.{language}.template"
    },
    {
      "id": "generate-agents-md",
      "description": "Generate root AGENTS.md",
      "template": "agents.md.template"
    },
    {
      "id": "copy-rules",
      "description": "Copy language-specific rules",
      "templates": ["naming.{language}.md", "patterns.{language}.md"]
    },
    {
      "id": "update-gitignore",
      "description": "Add .opencode/state/ to .gitignore"
    }
  ]
}
```

## Delegation Example

```
Task(
  subagent_type="planner",
  prompt="Create initialization plan from detection results.

Detection results (from .opencode/state/init-detection.json):
- Language: {language}
- Framework: {framework}
- Package Manager: {packageManager}
- Build System: {buildSystem}
- Directories: {directories}
- CI: {ci}

Mode: {minimal|full|refresh}

Generate execution plan with:
1. Directory structure to create
2. Configuration files to generate
3. Rules templates to copy
4. Tools to configure
5. AGENTS.md sections to include

Output JSON plan to .opencode/state/init-plan.json"
)
```

## Mode-Specific Planning

### --minimal Mode

Create only essential files:
- `.opencode/opencode.jsonc` - Basic config
- `.opencode/AGENTS.md` - Root instructions
- `.opencode/state/` - State directories

Skip:
- Rules directory
- Custom agents
- Templates

### --full Mode

Create complete structure:
- All minimal files
- `.opencode/rules/*.md` - Language-specific rules
- `.opencode/agent/` - Custom agent templates
- `.opencode/skills/` - Project skill placeholders
- `.opencode/commands/` - Project command placeholders
- `.opencode/tools/` - Project tool placeholders
- `.opencode/templates/` - Project templates

### --refresh Mode

Merge with existing:
- Read existing `.opencode/AGENTS.md`
- Preserve `<!-- MANUAL -->` sections
- Update auto-generated sections
- Keep user customizations

## Output

Save plan to `.opencode/state/init-plan.json`:

```json
{
  "language": "typescript",
  "framework": "nextjs",
  "mode": "full",
  "tasks": [...],
  "config": {
    "tools": ["tsc", "eslint", "prettier"],
    "rules": ["naming.typescript.md", "patterns.typescript.md"],
    "buildCommands": {
      "install": "npm install",
      "build": "npm run build",
      "test": "npm test",
      "lint": "npm run lint"
    }
  }
}
```

## Next Phase

After planning completes, proceed to **Phase 3: Configuration**.