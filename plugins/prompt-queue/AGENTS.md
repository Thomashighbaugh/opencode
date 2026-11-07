<!-- Parent: ../AGENTS.md -->

# prompt-queue (V2 + V1)

Defers queued prompts until the assistant finishes a turn without asking a question.

| Path | Role |
| --- | --- |
| `index.ts` | **V2 server entry** — `ctx.event.subscribe` for idle/fire, `ctx.session.prompt` to drain |
| `tui.tsx` | **V2 TUI entry** — `/queue` menu: add, edit, reorder, remove, fire now, hold |
| `plugin.ts` | V1 loader entry, re-exports `v1-hooks.ts` |
| `v1-hooks.ts` | V1 hooks implementation (frozen with the `v1` branch) |
| `v1` TUI half moved | `queue-commands.ts` (composer capture; no V2 equivalent) |
| `queue.ts` | State file + fire requests (shared, host-free) |
| `gate.ts`, `classifier.ts` | Release decision (phrase list + optional ONNX classifier) |

V2 has no composer-text API, so adding an item uses `dialog.prompt` instead of capturing the editor.
