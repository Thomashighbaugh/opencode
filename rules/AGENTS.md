<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-01 | Updated: 2026-05-01 -->

# rules

## Purpose
Shared rule files loaded as agent instructions. These provide behavioral guidance, conventions, and strategies that apply across all agents in the Hubs hub system.

## Key Files

| File | Description |
|------|-------------|
| `shell_strategy.md` | Non-interactive shell strategy — CI-safe command patterns, banned commands, environment variables |
| `context-strategy.md` | Durable project memory model — state vs context separation, auto-load/save conventions, frame retrieval |
| `hub-state.md` | Hub state conventions — state paths, context paths, auto-load/save triggers, cross-hub hand-off |
| `hub-routing.md` | Hub command routing — delegation tables, TUI integration, magic keyword compatibility |
| `karpathy-guidelines.md` | Coding guidelines — think before coding, simplicity first, surgical changes, goal-driven execution |
| `coding-style.md` | Coding style rules — immutability, file organization, error handling, input validation |
| `testing.md` | Testing rules — mandatory TDD, 80% coverage, edge cases, quality checklist |
| `security.md` | Security rules — mandatory checks, secret management, security response protocol |
| `performance.md` | Performance rules — model selection strategy, context window management, algorithm efficiency |
| `git-workflow.md` | Git workflow rules — commit message format, PR workflow, branch naming, feature implementation |

## For AI Agents

### Working In This Directory
- Rules are auto-loaded into agent context at session start
- Rules follow a strict hierarchy: shell_strategy overrides general behavior, security overrides convenience
- The `context-strategy.md` defines the foundational state-vs-context separation model
- Do not create rules that conflict with `shell_strategy.md` — non-interactive mode is mandatory

### Testing Requirements
- Rule consistency validated by Hubs doctor
- Hub routing table must match `tools/hubMenu.ts`

### Common Patterns
- Markdown format with actionable checklists
- BAD vs GOOD patterns for behavior enforcement
- Progressive disclosure — rules reference each other in a hierarchy

## Dependencies

### Internal
- `tools/hubMenu.ts` — Must stay in sync with `hub-routing.md`
- `AGENTS.md` — Root instructions auto-load these rules

### External
- OpenCode instruction loading system

<!-- MANUAL: -->
