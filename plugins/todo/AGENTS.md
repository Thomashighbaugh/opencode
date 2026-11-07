<!-- Parent: ../AGENTS.md -->

# todo (V2)

The human's project todo list. Committed, distinct from the agent's `todowrite` list.

| Path | Role |
| --- | --- |
| `index.ts` | Server entry: intentional no-op (no agent tool — the human owns this list) |
| `tui.tsx` | `/todo` + palette menu: select completes, ctrl+a add, ctrl+d delete, ctrl+r archive |
| `ops.ts` | Pure operations (add/list/complete/remove/archive/resolveId) used by TUI and tests |
| `todo-store.ts` | Store: `.opencode/todo/todos.json` + `archive.jsonl` (append-only) |
| `todo-commands.ts` | V1 TUI command module, kept for the frozen `v1` branch |

Tests: `tests/plugins/todo-ops.test.ts`.
