# OpenCode JOC (Joint Operations Center)

> Hub-driven multi-agent orchestration for OpenCode — interactive menus, not memorization.

_Named after the military field command post. Yes, another milspec acronym in dev tooling. We know._

## The problem

OpenCode configs pile up capabilities faster than anyone can keep track of. 64 skills. 29 agents. 6 commands. At some point you stop discovering things and start hoping they exist. JOC's answer: four hub commands that give you a menu instead of a scavenger hunt.

## The four hubs

| Hub | What it's for | Example |
|-----|---------------|---------|
| `/ideation` | Plan and research before you paint yourself into a corner | `/ideation plan sprint 5` |
| `/orchestrate` | Pick an execution pattern and let it run | `/orchestrate ralph fix TS errors` |
| `/project` | Git, reviews, PRs, tests, icons, changelogs | `/project review` |
| `/harvest-context` | Save things before the context window forgets them | `/harvest-context session` |

No arguments? You get a menu. Know what you want? Skip it: `/project commit`, `/orchestrate ultrawork`.

## How hubs work

1. No arguments —> interactive menu with a description for each option
2. With subcommand —> terse reminder, check for prior state, delegate to the skill or agent
3. After completion —> suggest the next hub (ideation -> orchestrate -> harvest-context, project -> harvest-context)

Three of the four hubs (ideation, orchestrate, harvest-context) save progress to `.opencode/state/` so you can resume later. Project is stateless, which is probably for the best.

## Hub subcommands

### `/ideation` — plan before you build

| Subcommand | Delegates to | What it does |
|-----------|-------------|-------------|
| `plan` | `plan` skill | Interview -> structured work plan (or direct/consensus mode) |
| `refine` | `idea-refine` skill | Diverge/converge on an idea |
| `deep` | `deep-interview` skill | Socratic interview with ambiguity gating |
| `graph` | `graph-thinking` skill | Map complex relationships as graphs |
| `research` | `ccg` skill | Multi-model consultation |
| `ralplan` | `ralplan` skill | Planner -> Architect -> Critic consensus loop |

### `/orchestrate` — pick a pattern, let it run

| Subcommand | Delegates to | What it does |
|-----------|-------------|-------------|
| `ralph` | `ralph` skill | Persistent loop until verified complete |
| `team` | `team` skill | N coordinated agents on shared tasks |
| `deep` | `deep-dive` skill | Trace -> deep-interview pipeline |
| `ccg` | `ccg` skill | Multi-model synthesis |
| `ultrawork` | `ultrawork` skill | Maximum parallel execution |
| `autopilot` | `autopilot` skill | Autonomous from idea to code |
| `sciomc` | `sciomc` skill | Parallel scientist agents |

### `/project` — ship it

| Subcommand | Delegates to | What it does |
|-----------|-------------|-------------|
| `tests` | `create-tests` command | Generate 8-type test suite |
| `commit` | `conventional-commit` skill | Conventional commit with emoji prefixes |
| `stage` | `git-stage-thread` command | Stage files from current thread |
| `review` | `code-reviewer` agent | Code review: smells, security, architecture |
| `pr` | `pr` command | Create, view, merge, manage PRs |
| `gh` | `github-ops` skill | Full GitHub CLI operations |
| `optimize` | `optimize` command | Performance, security, maintainability |
| `icon` | `icon-generator` skill | Web/PWA/UE icon assets from source image |
| `organize` | `file-organizer` skill | Find duplicates, suggest structures |
| `analyze` | `analyze-patterns` command | Code pattern and architecture analysis |
| `changelog` | `changelog-generator` skill | User-facing changelog from git history |

### `/harvest-context` — save things before the context window forgets them

| Subcommand | Delegates to | What it does |
|-----------|-------------|-------------|
| `session` | inline | Extract decisions and patterns from the conversation |
| `codebase` | `deepinit` skill | Deep codebase documentation |
| `skill` | `skill-creator` skill | Create or update a workflow skill |
| `agent` | `opencode-agent-creator` skill | Create agent definitions |
| `rule` | inline | Codify a reusable rule or pattern |
| `command` | `opencode-command-creator` skill | Create custom slash commands |
| `memory` | `remember` + `wiki` | Classify and persist project knowledge |
| `docs` | Context7 MCP | Fetch up-to-date library docs |
| `decompose` | planner agent | Break requirements into implementable units |
| `context` | inline | Capture full session context |

## Magic keywords

Skip the menu with natural language triggers. They call the subcommand directly. Convenient, until you accidentally type "don't stop" in a normal sentence and ralph mode activates.

| Keyword | Hub | Subcommand |
|---------|-----|-----------|
| `"ralph"`, `"don't stop"` | orchestrate | ralph |
| `"autopilot"`, `"build me"` | orchestrate | autopilot |
| `"ultrawork"`, `"ulw"` | orchestrate | ultrawork |
| `"deep interview"` | ideation | deep |
| `"plan"` | ideation | plan |
| `"cancel"`, `"stop"` | — | cancel active mode |

## Quick start

```bash
# Explore — menus guide you
/ideation                  # -> interactive menu
/orchestrate               # -> interactive menu
/project                   # -> interactive menu
/harvest-context           # -> interactive menu

# Go direct
/orchestrate ralph fix all TypeScript errors
/project commit
/project review
/ideation plan redesign the auth module
/harvest-context memory
```

## What's inside

### Agents (29)

| Category | Agents |
|----------|--------|
| Implementation | @executor, @code-simplifier, @refactoring, @frontend-design |
| Architecture | @architect, @planner, @analyst, @deep-thinker, @designer |
| Review | @code-reviewer, @security-reviewer, @critic, @verifier, @qa-tester, @test-engineer |
| Research | @scientist, @explore, @writer, @document-specialist |
| Workflow | @tracer, @git-master, @debugger, @config-orchestrator |
| Specialized | @effort-estimator, @prompt-simplifier, @skill-creator, @requirements-analyzer, @commit-drafter |

### Skills (64)

| Category | Key skills |
|----------|------------|
| Execution modes | ralph, autopilot, ultrawork, team, ultraqa, cancel |
| Planning | plan, ralplan, deep-interview, deep-dive, sciomc |
| Quality | ai-slop-cleaner, self-improve, verify, visual-verdict |
| Development | deepinit, changelog-generator, skillify, learner |
| Setup | init-project, joc-doctor, joc-reference, mcp-setup |
| Hubs | ideation, orchestrate, project, harvest-context |

Yes, 64 skills. Nobody has them all memorized. That's the point of the hubs.

### Commands (6)

| Command | Purpose |
|---------|---------|
| `/init-project` | Initialize or refresh project config + docs |
| `/ideation` | Planning and research hub |
| `/orchestrate` | Execution hub |
| `/project` | Project operations hub |
| `/harvest-context` | Context and artifact hub |
| `/skill` | Manage workflow skills |

### Tools (10)

| Tool | Description |
|------|-------------|
| `loadSkill` | Load skill content and metadata |
| `runSkillScript` | Execute skill scripts |
| `agentContext` | Manage project memory and notepad |
| `listAgents` | List and filter agents |
| `modeState` | Manage execution mode state |
| `taskTodos` | Create and manage task lists |
| `artifacts` | Save and load skill artifacts |
| `getSessionID` | Get current session ID |
| `saveCommitMessage` | Save commit message |
| `getCommitMessage` | Retrieve saved commit message |

## Installation

```bash
# Install globally
curl -fsSL https://raw.githubusercontent.com/Thomashighbaugh/opencode/main/install.sh | bash -s -- --global

# Or install per-project
curl -fsSL https://raw.githubusercontent.com/Thomashighbaugh/opencode/main/install.sh | bash
```

## Model configuration

| Model | Context | Output | Best for |
|-------|---------|--------|----------|
| glm-5.1:cloud | 202K | 131K | General purpose |
| kimi-k2.5:cloud | 262K | 262K | Extended context |
| minimax-m2.7:cloud | 205K | 128K | High performance |
| qwen3.5:cloud | 262K | 32K | Long documents |

## Directory structure

```
~/.config/opencode/
├── opencode.jsonc       # Main configuration
├── AGENTS.md            # Project-level instructions
├── agents/              # 29 agent definitions
├── skills/              # 64 workflow skills
├── commands/            # 6 hub commands + init-project
├── tools/               # 10 TypeScript tools
├── plugins/             # Hook system plugin
├── rules/               # 9 shared rules
├── state/               # Session state (gitignored)
├── templates/           # File templates
└── docs/                # Documentation
```

## Documentation

| File | Description |
|------|-------------|
| [installation.md](./.documentation/installation.md) | Installation methods, configuration, upgrading |
| [execution-modes.md](./.documentation/execution-modes.md) | Ralph, autopilot, ultrawork, team, ultraqa |
| [agents.md](./.documentation/agents.md) | All 29 agents with descriptions and usage |
| [skills.md](./.documentation/skills.md) | All 64 skills organized by category |
| [commands.md](./.documentation/commands.md) | All 6 commands with examples |
| [tools.md](./.documentation/tools.md) | TypeScript tools API reference |
| [model-configuration.md](./.documentation/model-configuration.md) | Model setup and routing |
| [state-management.md](./.documentation/state-management.md) | Session state persistence |
| [plugin-system.md](./.documentation/plugin-system.md) | Hook system and keyword detection |
| [path-conventions.md](./.documentation/path-conventions.md) | File and directory structure |

## License

MIT