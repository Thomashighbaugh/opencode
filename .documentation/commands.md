# Commands Reference

> Complete reference for all 16 Hubs custom commands

## Table of Contents

- [Overview](#overview)
- [Command Architecture](#command-architecture)
- [Project Initialization](#project-initialization)
- [Agent Creation](#agent-creation)
- [Git Operations](#git-operations)
- [Documentation](#documentation)
- [Code Analysis](#code-analysis)
- [File Organization](#file-organization)
- [Command Definition Format](#command-definition-format)
- [Creating Custom Commands](#creating-custom-commands)
- [Best Practices](#best-practices)

## Overview

Commands are slash-prefixed invocations that trigger specific workflows. Each command has:

- **Name**: Unique identifier (e.g., `/init-project`)
- **Description**: What the command does
- **Arguments**: Expected parameters (optional)
- **Workflow**: Steps executed when invoked

## Command Architecture

### How Commands Work

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Input                                   │
│                     /command arg1 arg2                            │
│                           │                                       │
│                           ▼                                       │
│              ┌─────────────────────┐                              │
│              │  Command Parser     │                              │
│              │  (extract name,     │                              │
│              │   arguments)        │                              │
│              └─────────────────────┘                              │
│                           │                                       │
│                           ▼                                       │
│              ┌─────────────────────┐                              │
│              │  Command Lookup     │                              │
│              │  (find .md file)    │                              │
│              └─────────────────────┘                              │
│                           │                                       │
│                           ▼                                       │
│              ┌─────────────────────┐                              │
│              │  Command Execution  │                              │
│              │  (follow workflow)  │                              │
│              └─────────────────────┘                              │
│                           │                                       │
│                           ▼                                       │
│              ┌─────────────────────┐                              │
│              │  Result Output      │                              │
│              └─────────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### Command Resolution

Commands are resolved in this order:

1. **Project-level**: `.opencode/commands/`
2. **User-wide**: `~/.config/opencode/commands/`

## Project Initialization

### /init-project

| Property | Value |
|----------|-------|
| **Description** | Initialize or refine project — global Hubs config, project .opencode/, hierarchical docs, and context capture in one pass |

**Purpose:**

Creates project-specific configuration with language detection and framework setup.

**Arguments:** None (auto-detects from project)

**Workflow:**

1. Detect project language (TypeScript, Python, Rust, etc.)
2. Detect framework (React, Next.js, Django, etc.)
3. Detect test framework (Jest, pytest, etc.)
4. Detect linter/formatter (ESLint, Prettier, etc.)
5. Create `.opencode/opencode.jsonc` with detected settings
6. Create `.opencode/AGENTS.md` with project instructions
7. Create `.opencode/state/` directory
8. Update `.gitignore` if present

**Output:**

```
.opencode/
├── opencode.jsonc      # Project configuration
├── AGENTS.md           # Project instructions
└── state/              # Session state (gitignored)
```

**Example:**

```bash
/init-project

# Output:
# Detected: TypeScript, React, Jest, ESLint
# Created: .opencode/opencode.jsonc
# Created: .opencode/AGENTS.md
# Created: .opencode/state/
# Updated: .gitignore
```

**Generated opencode.jsonc:**

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "opencode": { "options": {} },
    "ollama": {
      "models": {
        "glm-5.1:cloud": { "_launch": true }
      }
    }
  },
  "instructions": ["AGENTS.md"],
  "skills": { "paths": ["./.opencode/skills"] },
  "agents": { "paths": ["./.opencode/agent"] },
  "commands": { "paths": ["./.opencode/commands"] },
  "project": {
    "language": "typescript",
    "framework": "react",
    "testFramework": "jest",
    "linter": "eslint"
  }
}
```

---

## Agent Creation

### /create-agent

| Property | Value |
|----------|-------|
| **Description** | Create new OpenCode agents following research-backed best practices |

**Purpose:**

Guides creation of new agent definitions with proper structure.

**Arguments:**
- `name`: Agent name (required)
- `--model`: Model to use (default: sonnet)
- `--template`: Template to use (optional)

**Workflow:**

1. Prompt for agent name
2. Prompt for agent purpose
3. Ask about capabilities
4. Ask about constraints
5. Generate agent definition
6. Create file in `.opencode/agent/`
7. Validate structure

**Example:**

```bash
/create-agent my-agent --model sonnet

# Prompts:
# Agent name: data-processor
# Purpose: Process and transform data files
# Capabilities (comma-separated): read, write, transform
# Constraints (comma-separated): no-network, read-only-input
# 
# Created: .opencode/agent/data-processor.md
```

**Generated Agent:**

```markdown
---
name: data-processor
description: Process and transform data files
model: opencode/sonnet
mode: subagent
permission:
  read: allow
  write: allow
---

## Purpose

Process and transform data files according to specified rules.

## Capabilities

- Read data files
- Write processed output
- Transform data formats

## Constraints

- No network access
- Input files are read-only

## Workflow

1. Read input files
2. Apply transformations
3. Write output
```

---

### /create-tests

| Property | Value |
|----------|-------|
| **Description** | Generate comprehensive test suites for OpenCode agents with 8 essential test types |

**Purpose:**

Creates test suites for agent validation.

**Arguments:**
- `agent`: Agent name to test (required)

**Test Types Generated:**

1. **Unit Tests**: Individual function tests
2. **Integration Tests**: Component interaction tests
3. **E2E Tests**: Full workflow tests
4. **Performance Tests**: Speed/efficiency tests
5. **Security Tests**: Vulnerability tests
6. **Edge Case Tests**: Boundary condition tests
7. **Regression Tests**: Bug prevention tests
8. **Accessibility Tests**: A11y compliance tests

**Example:**

```bash
/create-tests executor

# Creates:
# tests/agents/executor/
# ├── unit.test.ts
# ├── integration.test.ts
# ├── e2e.test.ts
# ├── performance.test.ts
# ├── security.test.ts
# ├── edge-cases.test.ts
# ├── regression.test.ts
# └── accessibility.test.ts
```

---

## Git Operations

### /commit

| Property | Value |
|----------|-------|
| **Description** | Create well-formatted commits with conventional commit messages and emoji |

**Purpose:**

Creates commits following Conventional Commits specification.

**Arguments:**
- `--type`: Commit type (feat, fix, docs, etc.)
- `--scope`: Commit scope (optional)
- `--breaking`: Mark as breaking change
- `--body`: Commit body (optional)

**Commit Types:**

| Type | Emoji | Description |
|------|-------|-------------|
| `feat` | ✨ | New feature |
| `fix` | 🐛 | Bug fix |
| `docs` | 📚 | Documentation |
| `style` | 💄 | Formatting |
| `refactor` | ♻️ | Code refactor |
| `perf` | ⚡ | Performance |
| `test` | ✅ | Tests |
| `chore` | 🔧 | Maintenance |
| `ci` | 👷 | CI/CD |
| `revert` | ⏪ | Revert |

**Example:**

```bash
/commit --type feat --scope auth "Add OAuth2 support"

# Creates commit:
# ✨ feat(auth): Add OAuth2 support
#
# - Implement OAuth2 authentication flow
# - Add token refresh handling
# - Support multiple providers
```

---

### /pr

| Property | Value |
|----------|-------|
| **Description** | Pull request operations - create, view, merge, and manage PRs |

**Purpose:**

Manages GitHub pull requests via gh CLI.

**Arguments:**
- `create`: Create new PR
- `view`: View PR details
- `merge`: Merge PR
- `list`: List PRs

**Subcommands:**

```bash
/pr create --title "Feature" --body "Description"
/pr view 123
/pr merge 123 --squash
/pr list --state open
```

**Example:**

```bash
/pr create --title "Add authentication" --base main

# Creates PR with:
# - Auto-generated body from commits
# - Labels based on changed files
# - Reviewers from CODEOWNERS
```

---

### /gh

| Property | Value |
|----------|-------|
| **Description** | GitHub operations via gh CLI - repositories, issues, releases, workflows |

**Purpose:**

GitHub CLI wrapper for common operations.

**Arguments:**
- `repo`: Repository operations
- `issue`: Issue operations
- `release`: Release operations
- `workflow`: Workflow operations
- `run`: Run workflows

**Examples:**

```bash
/gh repo create my-repo --public
/gh issue create --title "Bug" --body "Description"
/gh release create v1.0.0 --title "v1.0.0"
/gh workflow run ci.yml
```

---

### /git-stage-thread

| Property | Value |
|----------|-------|
| **Description** | Stage git changes for files modified in the current conversation thread |

**Purpose:**

Stages only files discussed in current conversation.

**Workflow:**

1. Analyze conversation for mentioned files
2. Check which files were modified
3. Stage those files
4. Show summary

**Example:**

```bash
# In conversation about auth.ts and user.ts
/git-stage-thread

# Stages:
# - src/auth.ts
# - src/user.ts
# - tests/auth.test.ts
```

---

## Documentation

### /changelog

| Property | Value |
|----------|-------|
| **Description** | Generate user-facing changelogs from git commits for releases |

**Purpose:**

Creates changelogs from git history.

**Arguments:**
- `--from`: Starting tag/commit
- `--to`: Ending tag/commit (default: HEAD)
- `--format`: Output format (markdown, json)

**Changelog Sections:**

- 🚀 Features
- 🐛 Bug Fixes
- 📚 Documentation
- ♻️ Refactoring
- ⚡ Performance
- ✅ Tests
- 🔧 Maintenance

**Example:**

```bash
/changelog --from v1.0.0 --to v1.1.0

# Output:
# # v1.1.0
# 
# ## 🚀 Features
# - Add OAuth2 support (#123)
# - Implement dark mode (#125)
#
# ## 🐛 Bug Fixes
# - Fix authentication timeout (#130)
# - Resolve memory leak (#132)
```

---

### /docs

| Property | Value |
|----------|-------|
| **Description** | Fetch official library documentation via Context7 MCP for any npm package |

**Purpose:**

Fetches library documentation from official sources.

**Arguments:**
- `library`: Library name (required)
- `topic`: Specific topic (optional)

**Supported Libraries:**

- React, Next.js, Vue, Svelte
- Tailwind CSS, styled-components
- TypeScript, JavaScript
- Node.js, Express
- Any npm package

**Example:**

```bash
/docs react useEffect

# Fetches React docs for useEffect hook
# Returns structured documentation
```

---

### /context

| Property | Value |
|----------|-------|
| **Description** | Manage context files - harvest summaries, extract knowledge, organize documentation |

**Purpose:**

Manages project context and knowledge.

**Arguments:**
- `harvest`: Extract summaries
- `extract`: Extract knowledge
- `organize`: Organize documentation

**Example:**

```bash
/context harvest --output .opencode/state/context.json
/context extract src/ --output knowledge.json
/context organize docs/
```

---

### /skill

| Property | Value |
|----------|-------|
| **Description** | Create or update skills that extend AI capabilities with specialized knowledge |

**Purpose:**

Skill management operations.

**Arguments:**
- `list`: List skills
- `create`: Create new skill
- `edit`: Edit skill
- `remove`: Remove skill
- `search`: Search skills

**Example:**

```bash
/skill list
/skill create my-skill
/skill edit my-skill
/skill remove my-skill
/skill search "test"
```

---

## Code Analysis

### /analyze-patterns

| Property | Value |
|----------|-------|
| **Description** | Analyze codebase for patterns and similar implementations |

**Purpose:**

Finds patterns and similar code in the codebase.

**Arguments:**
- `pattern`: Pattern to analyze
- `--output`: Output format

**Example:**

```bash
/analyze-patterns "error handling"

# Finds all error handling patterns
# Grouped by: try-catch, promises, callbacks
```

---

### /optimize

| Property | Value |
|----------|-------|
| **Description** | Analyze and optimize code for performance, security, and potential issues |

**Purpose:**

Analyzes code for optimization opportunities.

**Categories:**

- Performance optimizations
- Security vulnerabilities
- Code simplification
- Memory efficiency
- Bundle size

**Example:**

```bash
/optimize src/

# Analysis:
# - 3 performance issues
# - 1 security warning
# - 5 simplification opportunities
```

---

## File Organization

### /organize

| Property | Value |
|----------|-------|
| **Description** | Organize files and folders - find duplicates, suggest structures, automate cleanup |

**Purpose:**

Reorganizes project file structure.

**Arguments:**
- `--dry-run`: Preview changes
- `--strategy`: Organization strategy

**Example:**

```bash
/organize src/ --dry-run

# Suggestions:
# - Move utils/ to src/utils/
# - Consolidate types/ into single file
# - Remove 3 duplicate files
```

---

### /decompose

| Property | Value |
|----------|-------|
| **Description** | Decompose component into smaller units |

**Purpose:**

Breaks down large components/files.

**Example:**

```bash
/decompose LargeComponent.tsx

# Creates:
# - LargeComponent/
#   ├── index.tsx
#   ├── styles.ts
#   ├── types.ts
#   ├── hooks.ts
#   └── utils.ts
```

---

### /icon

| Property | Value |
|----------|-------|
| **Description** | Generate web UI/UX icon assets from a single SVG or PNG source |

**Purpose:**

Generates favicon, apple-touch-icon, PWA icons from source.

**Arguments:**
- `source`: Source image (required)
- `--output`: Output directory

**Generated Sizes:**

- favicon.ico (16x16, 32x32)
- apple-touch-icon.png (180x180)
- android-chrome-*.png (192x192, 512x512)
- PWA maskable icons

**Example:**

```bash
/icon logo.svg --output public/icons/

# Generates:
# - favicon.ico
# - apple-touch-icon.png
# - android-chrome-192x192.png
# - android-chrome-512x512.png
```

---

## Command Definition Format

Commands are defined in `.opencode/commands/*.md` files:

```markdown
---
name: my-command
description: What this command does
arguments:
  - name: arg1
    required: true
    description: First argument
  - name: arg2
    required: false
    default: "default"
    description: Second argument
---

## Purpose

Detailed explanation of what the command does.

## Workflow

1. Step 1
2. Step 2
3. Step 3

## Arguments

### arg1 (required)

Description of first argument.

### arg2 (optional)

Description of second argument.
Default: "default"

## Examples

```bash
/my-command value1 value2
```

## Output

Expected output format.
```

## Creating Custom Commands

### Step 1: Create Command File

```bash
touch .opencode/commands/my-command.md
```

### Step 2: Define Command

```markdown
---
name: my-command
description: My custom command
---

## Purpose

This command does X and Y.

## Workflow

1. Check prerequisites
2. Execute main logic
3. Report results

## Examples

```bash
/my-command --option value
```
```

### Step 3: Test Command

```bash
# Invoke in OpenCode
/my-command
```

## Best Practices

### Command Naming

- Use kebab-case: `/init-project`
- Be descriptive: `/create-agent` not `/ca`
- Group related: `/git-stage-thread`, `/gh`

### Argument Design

- Use clear argument names
- Provide sensible defaults
- Support dry-run where applicable
- Document required vs optional

### Output Format

- Clear success/failure indication
- Actionable feedback
- Progress for long operations
- Summary at the end

### Error Handling

- Validate inputs early
- Provide helpful error messages
- Suggest fixes for common errors
- Exit gracefully on failure

## See Also

- [Agents](./agents.md) - Agents commands may invoke
- [Skills](./skills.md) - Skills that may be triggered by commands
- [Tools](./tools.md) - Tools for command development