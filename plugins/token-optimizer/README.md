# token-optimizer

Deterministic context-quality, compaction, continuity, and savings tracking for
OpenCode 2. The OpenCode database (`~/.local/share/opencode/opencode.db`) is the
source of truth; hooks capture live state and inject only compaction guidance or
an explicitly enabled nudge.

## Tools

- `token_status` — ResourceHealth, SessionEfficiency, fill, tool calls,
  compactions, warnings. `{ detail: true }` adds the signal table.
- `tokenOptimizer` — `quality`, `savings`, `checkpoint` (`capture|list|prune`),
  `resume`, `mode`, `history`.

## Configuration

Environment only by default:

| Variable | Default |
| --- | --- |
| `TOKEN_OPTIMIZER_DATA_DIR` | `~/.local/share/opencode/token-optimizer` |
| `TOKEN_OPTIMIZER_QUALITY_WINDOW` | 20 |
| `TOKEN_OPTIMIZER_NUDGES` | `toast` (`off`, `toast`, `inject`) |
| `TOKEN_OPTIMIZER_CONTINUITY` | true |
| `TOKEN_OPTIMIZER_SMART_COMPACTION` | true |
| `TOKEN_OPTIMIZER_BASH_COMPRESSION` | false |
| `TOKEN_OPTIMIZER_CHECKPOINT_RETENTION_DAYS` | 7 |
| `TOKEN_OPTIMIZER_RELEVANCE_THRESHOLD` | 0.6 |

`toast` computes the same thresholds as upstream but spends no prompt tokens.
`inject` restores the upstream system-prompt warning behaviour. Bash compression
is opt-in and never truncates output that looks like an error.

## Design

- Read-only SQLite over `session_v2`, `message`, and `part`; exact token/cost
  usage from the DB.
- Pure scoring and matching functions; no model call for any metric, checkpoint,
  or nudge decision.
- Per-project checkpoints and savings live in a separate WAL SQLite store,
  outside the repository.
- Compaction is native; this plugin contributes PRESERVE/DROP instructions and
  a checkpoint only.
