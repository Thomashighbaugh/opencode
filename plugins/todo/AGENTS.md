<!-- Parent: ../AGENTS.md -->

# todo (V2)

The human's project todo list. Committed, distinct from the agent's `todowrite` list.

| Path | Role |
| --- | --- |
| `index.ts` | Server entry: intentional no-op (no agent tool — the human owns this list) |
| `tui.tsx` | `/todo` + palette menu: Enter sends the item to the agent and keeps it open; ctrl+a add, ctrl+i insert, ctrl+d delete, ctrl+r archive, ctrl+o open archive |
| `ops.ts` | Pure operations (add/list/archiveItem/remove/archive/resolveId) used by TUI and tests |
| `todo-store.ts` | Store: `.opencode/todo/todos.json` + `archive.jsonl` (append-only) |

Tests: `tests/plugins/todo-ops.test.ts`.
