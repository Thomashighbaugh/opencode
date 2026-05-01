# Hub Command Routing

Five hub commands provide unified access to related capabilities. When a hub is invoked, follow this routing pattern consistently.

## hubMenu Tool

All hub menu data and routing lives in the **`hubMenu` TypeScript tool** (`tools/hubMenu.ts`). It is the single source of truth for:

- Menu options (labels, descriptions)
- Subcommand delegation targets (skill, agent, command, or inline)
- Terse reminders for each subcommand
- State directory paths
- Phase assignments

**How to use it:**

| When | Action | hubMenu call |
|------|--------|-------------|
| Hub invoked with no args | List subcommands as plain text (no tool call) | Just output the options directly — do NOT call `hubMenu` for menus, it wastes a request |
| Hub invoked with subcommand | Route and get reminder + state | `hubMenu(action: "route", hub: "init-project", subcommand: "setup", flags: "--full")` |
| User asks for hub status | Show state and checkpoint | `hubMenu(action: "status", hub: "init-project")` |
| User wants to resume | Get latest checkpoint | `hubMenu(action: "resume", hub: "init-project")` |
| Listing all hubs | Enumerate hubs | `hubMenu(action: "list")` |

**Adding a subcommand:** Add one `HubSubcommand` entry to `HUBS` in `hubMenu.ts`. The menu, routing, and reminders update automatically — no changes needed in `.md` files.

**Adding a new hub:** Add a `HubDefinition` to the `HUBS` array in `hubMenu.ts`.

## Hub Command Pattern

All five hubs (`/ideation`, `/orchestrate`, `/harvest-context`, `/init-project`, `/project`) follow the same interaction pattern:

### No Arguments

List the subcommands as plain text directly. Do NOT call `hubMenu(action: "menu")` — it burns an LLM request for something that should be static text. The TUI plugin handles native DialogSelect menus when triggered from the command palette. Just output the numbered list and ask the user to choose.

### With Subcommand

1. Call `hubMenu(action: "route", hub: "<name>", subcommand: "<sub>", flags: "<flags>")` to get the routing info, reminder, and state
2. Print the **static terse reminder** from the tool response
3. If `canResume: true`, offer to **resume** or **start fresh**
4. Execute the subcommand by **delegating to the target** indicated in `delegation.type` / `delegation.target`
5. **Cache progress** at each significant stage (ideation, orchestration, harvest, init only — project is stateless)
6. On completion, offer the **next logical hub** (ideation → orchestrate → harvest-context, init → harvest-context, project → harvest-context)

### Resume Subcommand

Call `hubMenu(action: "resume", hub: "<name>")` to get the latest checkpoint, then load and continue. (ideation, orchestration, harvest, init only)

### Status Subcommand

Call `hubMenu(action: "status", hub: "<name>")` to list state files with timestamps. (ideation, orchestration, harvest, init only)

## Subcommand → Skill/Command Delegation

This table is maintained in `tools/hubMenu.ts`. The canonical source is the `HUBS` constant. Below is a snapshot for reference:

| Hub | Subcommand | Delegates To | Type |
|-----|-----------|-------------|------|
| `/init-project` | setup | phase pipeline (0-7) | phases |
| `/init-project` | detect | `explore` | agent |
| `/init-project` | docs | `deepinit` | skill |
| `/init-project` | context | `remember` + `wiki` | skill |
| `/init-project` | verify | `verifier` | agent |
| `/init-project` | refresh | self (merge mode) | — |
| `/init-project` | status | self (inline) | — |
| `/ideation` | plan | `plan` | skill |
| `/ideation` | refine | `idea-refine` | skill |
| `/ideation` | deep | `deep-interview` | skill |
| `/ideation` | graph | `graph-thinking` | skill |
| `/ideation` | research | `ccg` | skill |
| `/ideation` | ralplan | `ralplan` | skill |
| `/orchestrate` | ralph | `ralph` | skill |
| `/orchestrate` | team | `team` | skill |
| `/orchestrate` | deep | `deep-dive` | skill |
| `/orchestrate` | ccg | `ccg` | skill |
| `/orchestrate` | ultrawork | `ultrawork` | skill |
| `/orchestrate` | autopilot | `autopilot` | skill |
| `/orchestrate` | sciomc | `sciomc` | skill |
| `/harvest-context` | session | inline | — |
| `/harvest-context` | codebase | `deepinit` | skill |
| `/harvest-context` | skill | `skill-creator` | skill |
| `/harvest-context` | agent | `opencode-agent-creator` | skill |
| `/harvest-context` | rule | inline | — |
| `/harvest-context` | command | `opencode-command-creator` | skill |
| `/harvest-context` | memory | `remember` + `wiki` | skill |
| `/harvest-context` | docs | Context7 MCP | tool |
| `/harvest-context` | decompose | `planner` | agent |
| `/harvest-context` | context | inline | — |
| `/project` | tests | `create-tests` | command |
| `/project` | commit | `conventional-commit` | skill |
| `/project` | stage | `git-stage-thread` | command |
| `/project` | review | `code-reviewer` | agent |
| `/project` | pr | `pr` | command |
| `/project` | gh | `github-ops` | skill |
| `/project` | optimize | `optimize` | command |
| `/project` | icon | `icon-generator` | skill |
| `/project` | organize | `file-organizer` | skill |
| `/project` | analyze | `analyze-patterns` | command |
| `/project` | changelog | `changelog-generator` | skill |

## Magic Keyword Compatibility

These natural language triggers still activate the corresponding subcommand:

| Keyword | Hub | Subcommand |
|---------|-----|-----------|
| "ralph", "don't stop" | orchestrate | ralph |
| "autopilot", "build me" | orchestrate | autopilot |
| "ultrawork", "ulw" | orchestrate | ultrawork |
| "deep interview" | ideation | deep |
| "plan" | ideation | plan |
| "cancel", "stop" | — | cancel active mode |

Magic keywords bypass the hub menu and invoke the subcommand directly.