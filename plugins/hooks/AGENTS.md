<!-- Parent: ../AGENTS.md -->

# hooks (V1)

Session/tool lifecycle hooks for OpenCode 1.19.x. Not loadable by OpenCode 2 — the V2 port replaces string-keyed hooks with `ctx.<domain>.hook()`.

| File | Role |
| --- | --- |
| `hooks.ts` | Entry: registers session, tool, chat, permission, compaction and system-prompt hooks |
| `session.ts` | Session state, context injection, hub-route prefetch/cache |
| `modes.ts`, `keywords.ts` | Mode detection and magic-keyword context injection |
| `telemetry.ts` | SRCL event classification, `hubMenu` telemetry |
| `cache-hook.ts`, `vectorize-hook.ts` | Tool cache substitution, vector index maintenance |
| `goal.ts` | Session goal state and budget tracking |
| `runtime.ts`, `child-registry.ts` | Runtime helpers and child-session registry |

Depends on tools (`hubMenu` was removed from V1 scope in the V2 cleanup; the references remain inert until this plugin is ported or retired).
