# OpenCode Hubs Coding Conventions

> Generated: 2026-07-02 by /init-project refresh --full Phase 6
> Source: Convention extraction analysis

## TypeScript Tool Definition Pattern

Every tool in `tools/<name>.ts` exports a `default` via `@opencode-ai/plugin` SDK.

**Canonical structure:**
1. `VALID_ACTIONS` declared as `const` tuple at top
2. `description` — single line, action verbs + valid actions inlined
3. `args` — all params have `.describe()` embedding valid values; optional params use `.optional()`
4. `execute()` — validate required args early, validate action against allowlist, try/catch I/O, return `ok()`/`err()`
5. `ok()` / `err()` helpers at file bottom — return `JSON.stringify(...)` (strings, not objects)
6. `dryRun` parameter universally supported on mutation tools

### BAD vs GOOD — tool args
```typescript
// BAD: no allowlist, generic description, returns object
action: tool.schema.string().describe("operation"),
async execute(args) { return { result: "done" } }

// GOOD: const tuple, embedded valid values, string return
const VALID_ACTIONS = ["get", "set"] as const
action: tool.schema.string().describe(`Operation. Valid: ${VALID_ACTIONS.join(", ")}`),
async execute(args) {
  if (!VALID_ACTIONS.includes(args.action as any)) return err(`Invalid action. Valid: ${VALID_ACTIONS.join(", ")}`)
  return ok({ action: args.action, result: "done" })
}
```

## CacheManager Pattern

- Singleton accessor: `getCache("tool", projectRoot)` — never `new CacheManager()`
- Composite keys: `CacheManager.key("Read", filePath)` — SHA256, 32-char
- Memoize: `withToolCache(toolName, args, () => computation(), ttl)`
- Invalidation: `cache.invalidatePrefix("Glob")` for all Glob:* keys
- Silent failure on disk ops: `try { fs.writeFileSync(...) } catch { /* silently fail */ }`

## Plugin Hook Registration

`plugins/hooks/hooks.ts` exports a `Plugin` factory. All hooks assigned to a `Hooks` object:

- `hooks.event` — switches on `event.type` (session.created/deleted)
- `tool.execute.before` — pre-cache check + mtime staleness + agent context injection
- `tool.execute.after` — cache writes (tiers 1-4), heartbeat, stall detection, write-invalidation
- `experimental.chat.system.transform` — `output.system.push(...)` with XML wrapper tags
- `experimental.session.compacting` — `output.context.push(...)` for state preservation

**Context injection uses XML wrapper tags**: `<hubs-plugin-context>`, `<Relevant_Context>`, `<hub-state-summary>`

**All hook code wrapped in `try {} catch {}`** — plugin never crashes the session.

## Agent Definition Pattern

Agent files: `agents/<name>.md`. Structure: YAML frontmatter + `<Agent_Prompt>` XML wrapper.

**Frontmatter:** `description`, `model` (provider/model format), `mode` (`subagent` or primary).

**Required XML sections:** `<Role>`, `<Token_Budget>`, `<AvailableTools>`, `<Success_Criteria>`, `<Constraints>`, `<Output_Format>`.

**Output format mandated:** `## Changes Made`, `## Verification`, `## Summary`.

## Skill Definition Pattern

Skills: `skills/<name>/SKILL.md`. YAML frontmatter + XML-tagged body sections.

**Frontmatter:** `name`, `description`, `argument-hint`, `level` (1-4).

**Standard body sections:** `<Purpose>`, `<Use_When>`, `<Do_Not_Use_When>`, `<Why_This_Exists>`, `<Execution_Policy>`, `<Steps>`.

**Step numbering:** Explicit and hierarchical: `1. a. b. 2. 3. a. b. c.`

## Hub Subcommand Spec Pattern

Specs: `tools/hubs/<hub>/<subcommand>.ts`, export `HubSubcommandSpec` default.

**Fields:** `label` (matches filename), `description` (action verb first, embeds tool/buzzwords per `hub-description-directive.md`), `reminder` (terse 1-line), `skill`/`agent`/`command` (mutually exclusive delegation), `detailedDescription` (1-3 paragraphs), `tools`, `rules`, `relatedSkills`, `examples` ({input, approach}), `warnings`.

**Two-tier loading:** Identity slice (label+description+reminder) for menus; full spec on selection.

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Tool files | kebab-case | `json-edit.ts` |
| Hub spec files | kebab-case, match subcommand | `tools/hubs/orchestrate/ralph.ts` |
| Agent files | kebab-case `.md` | `agents/code-reviewer.md` |
| Skill dirs | kebab-case | `skills/ai-slop-cleaner/` |
| Skill entry | `SKILL.md` (uppercase) | `skills/ralph/SKILL.md` |
| Functions | camelCase | `getCache`, `withToolCache` |
| Constants | UPPER_SNAKE | `VALID_ACTIONS`, `CACHE_CONFIGS` |
| Types/Interfaces | PascalCase | `CacheManager`, `HubSubcommandSpec` |
| XML tags | PascalCase with underscores | `<Agent_Prompt>`, `<Success_Criteria>` |
| Hook keys | dot.notation | `tool.execute.before` |
| Cache namespaces | lowercase single word | `tool`, `mcp`, `llm`, `agent` |
| State dirs | match hub name | `.opencode/state/orchestration/` |

## Error Handling — Three Tiers

1. **Tool-facing errors** — return `err("message")` (JSON string with `success: false`). Never throw.
2. **Internal cache/IO errors** — silent swallow: `try { ... } catch { /* silently fail */ }`. Never propagate.
3. **Plugin hook errors** — always wrapped in `try {} catch {}`. Plugin never breaks session.

### BAD vs GOOD — error handling
```typescript
// BAD: throws, breaks caller
async execute(args) {
  const data = JSON.parse(fs.readFileSync(args.file))  // throws on bad JSON
  return data
}

// GOOD: validates, catches, returns structured error string
async execute(args) {
  if (!args.file) return err("file is required")
  try { return ok({ data: JSON.parse(fs.readFileSync(args.file, "utf-8")) }) }
  catch (e: any) { return err(`Cannot read/parse: ${e.message}`) }
}
```

**Silent failure is intentional** in hot paths (cache lookups, hook handlers, disk persistence). Caching is an optimization layer — a miss means recompute, not user-visible failure.

## Cross-Cutting Rules

1. Tools return strings — `ok()`/`err()` helpers, JSON-stringified
2. Validate early, fail fast — check required args before any I/O
3. `try {} catch {}` everywhere in hooks — plugin never crashes
4. Cache keys are hashed — `CacheManager.key(...)` (SHA256, 32-char)
5. Singletons for caches — `getCache()` factory, never `new CacheManager()`
6. XML wrapper tags for injected context
7. `dryRun` on all mutation tools — preview before apply
8. Action allowlists as const tuples — validated against `.includes()`
9. No inline scripts for file editing — use regex-edit, json-edit, yaml-edit, conf-edit, multi-edit
10. Two-tier loading — identity slice for menus, full spec on selection only