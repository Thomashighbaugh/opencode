# Phase 4: Project-Specific Provisioning

Create project-specific agents, tools, commands, and skills tailored to the detected project stack. The effort spent here scales with the `--mode` flag: minimal creates placeholders, full creates working artifacts with thorough prompts.

## Delegation

```
Task(subagent_type="executor",
  prompt="Create project-specific Hubs agents, tools, commands, and skills for the detected stack")
```

Or for thorough mode, delegate multiple agents in parallel:
```
Task(subagent_type="config-orchestrator",
  prompt="Analyze project stack and determine which agents, tools, commands, and skills to scaffold")
```

## Input

Read from `.opencode/state/init-plan.json`:
- Language, framework, package manager
- Project directories and structure
- Mode: minimal / standard / full (chosen at the gatekeeping question; `--minimal` / `--full` skip the question)

## Mode Scaling

| Aspect | `--minimal` | Standard | `--full` (thorough) |
|--------|-------------|---------|---------------------|
| **Agents** | 0 (none) | 2-3 stub agents | 5+ custom agents with full prompts |
| **Tools** | 0 (none) | 0 (none) | 1-2 project-specific TypeScript tools |
| **Commands** | 0 (none) | 2-3 stub commands | 5+ commands with full workflow docs |
| **Skills** | 0 (none) | 1-2 stub skills | 3+ project-specific workflow skills |
| **Effort** | 30 seconds | 3-5 minutes | 10-15 minutes |

## Execution Steps

### Step 1: Detect What's Needed

Analyze the project's stack and structure to determine what agents and tools would be valuable:

```bash
# Read detection results
DETECTION_FILE=".opencode/state/init/init-detection.json"
LANG=$(jq -r '.language // "unknown"' "$DETECTION_FILE")
FRAMEWORK=$(jq -r '.framework // ""' "$DETECTION_FILE")
PKG=$(jq -r '.packageManager // ""' "$DETECTION_FILE")
```

Based on stack, determine valuable artifacts:

| Stack Pattern | Suggested Agents | Suggested Skills |
|---------------|-----------------|------------------|
| **TypeScript/React/Next.js** | `frontend-dev`, `component-designer` | `component-patterns`, `state-management` |
| **Python/FastAPI/Django** | `api-dev`, `data-modeler` | `api-patterns`, `orm-conventions` |
| **Rust** | `systems-dev` | `rust-patterns`, `error-handling` |
| **Go** | `backend-dev` | `go-conventions`, `concurrency-patterns` |
| **Generic/CLI** | `dev-agent`, `qa-agent` | `project-conventions` |
| **Full-stack** | `frontend-dev`, `backend-dev`, `db-specialist`, `devops` | Per-stack skills + `deployment-patterns` |

### Step 2: Create Project Agents

Create agent markdown files in `.opencode/agents/`:

**Minimal mode** — skip (no agents created).

**Standard mode** — create stub agents:
```markdown
---
description: Development agent for {project}
mode: subagent
---

You are a development agent for the {language}/{framework} project.

Focus on:
- Writing code that matches project conventions
- Using the correct build commands ({pkg} build/test/lint)
- Following the patterns established in the codebase
```

**Full (thorough) mode** — create detailed agents with:
- Stack-specific prompts with framework conventions
- Tool permissions scoped to project needs
- Temperature preferences
- Custom subagent instructions for the project's patterns

Example full agents:
```markdown
---
description: Frontend component developer for {framework} project
mode: subagent
temperature: 0.3
tools:
  write: false
  edit: true
  bash: false
permission:
  edit: allow
  bash:
    "{pkg} run *": allow
    "{pkg} test": allow
---

You are a frontend component developer for a {framework} project using {language}.

## Conventions
- Use the project's existing component patterns
- Follow the established CSS/styling approach
- Write tests in the project's test framework
- Use the project's state management pattern

## Commands
- `{pkg} run dev` - Start dev server
- `{pkg} run build` - Build for production
- `{pkg} test` - Run tests

## Code Style
{language/framework specific style guidance from detection}
```

### Step 3: Create Project Tools (Full Mode Only)

Create TypeScript tools in `.opencode/plugins/<tool-name>/index.ts` for project-specific automation.

OpenCode 2 removed file-based tool discovery: a file under `.opencode/tools/` is inert. A tool exists only when a plugin registers it, and plugins are auto-discovered from `.opencode/plugins/` — so each tool is its own plugin directory.

**Template:**
```typescript
// .opencode/plugins/{tool-name}/index.ts
interface Args {
  // Define parameters
}

const input = {
  type: "object" as const,
  properties: {
    // Define parameters
  },
}

export default {
  id: "{tool-name}",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()

    ctx.tool.transform((editor: any) => {
      editor.add({
        name: "{tool-name}",
        description: "{description of what this tool does}",
        input,
        options: { codemode: false },
        execute: async (args: Args) => {
          // Implementation
          return { content: "done" }
        },
      })
    })
  },
}
```

No registration in `opencode.jsonc` is needed — OpenCode 2 auto-discovers every directory under `.opencode/plugins/`.

Example project tools:
- `.opencode/plugins/lint-project/index.ts` — Run project-specific linting
- `.opencode/plugins/test-component/index.ts` — Run tests for a specific component
- `.opencode/plugins/deploy-preview/index.ts` — Deploy a preview environment
- `.opencode/plugins/generate-migration/index.ts` — Generate database migrations (for ORM projects)
- `.opencode/plugins/type-check/index.ts` — Run type checking with project config

### Step 4: Create Project Commands

Create command markdown files in `.opencode/commands/` wrapping common workflows.

**Minimal mode** — skip.

**Standard mode** — create 2-3 stub commands:
```markdown
---
description: {description}
invoke: {command-name}
argument-hint: {argument description}
---
```

**Full mode** — create comprehensive commands with task definitions:

```markdown
---
description: Build and test the current feature branch
invoke: verify-feature
argument-hint: [optional scope]
---

Verify the current feature branch by running the full quality gate.

## Usage

\`\`\`
/project verify-feature
/project verify-feature api
\`\`\`

## Steps

\`\`\`
## Task: Run full quality check

1. Run linting: \`{pkg} run lint\`
2. Run type check: \`{pkg} run typecheck\`
3. Run tests: \`{pkg} test\`
4. Run build: \`{pkg} run build\`
5. Report results
\`\`\`
```

Common project commands to scaffold:
- `build` — Build the project
- `test-file <path>` — Test a specific file
- `lint-fix` — Auto-fix lint issues
- `typecheck` — Run type checking
- `ci-status` — Check CI status
- `db-migrate` — Run database migrations
- `dev` — Start development environment

### Step 5: Create Project Skills (Full Mode Only)

Create project-specific skills in `.opencode/skills/{name}/SKILL.md` for repeatable workflows unique to this project.

```markdown
---
name: {skill-name}
description: {description of when this skill is useful}
level: 1
---

# {Skill Name}

{Detailed workflow instructions for the project-specific task}

## When to Use

- {trigger condition 1}
- {trigger condition 2}

## Workflow

{step-by-step procedure}

## Examples

{project-specific examples}
```

Example project skills:
- `deployment-steps` — Project-specific deployment workflow
- `testing-conventions` — How this project writes and organizes tests
- `code-review-patterns` — Project-specific code review checklist
- `migration-procedures` — Database or API migration workflows

### Step 6: Update opencode.jsonc (if needed)

```bash
# Tool plugins are auto-discovered from .opencode/plugins/ — no opencode.jsonc registration needed
# Just ensure each tool has its own plugin directory with an index.ts
echo "  → Tool plugins auto-discovered from .opencode/plugins/"
```

## Output

| Artifact | Location | Mode |
|----------|----------|------|
| Project agents | `.opencode/agents/` | default+ |
| Project tools | `.opencode/plugins/<name>/index.ts` | full only |
| Project commands | `.opencode/commands/` | default+ |
| Project skills | `.opencode/skills/{name}/` | full only |
| Updated opencode.jsonc | `.opencode/opencode.jsonc` | full only |

## Verification

After scaffolding:
```bash
ls .opencode/agents/*.md 2>/dev/null && echo "Agents created" || echo "No agents"
ls -d .opencode/plugins/*/ 2>/dev/null && echo "Tool plugins created" || echo "No tools"
ls .opencode/commands/*.md 2>/dev/null && echo "Commands created" || echo "No commands"
ls .opencode/skills/*/SKILL.md 2>/dev/null && echo "Skills created" || echo "No skills"
```
