# OpenCode: Agents, Skills, Sessions — Research Notes

Source: Context7 MCP — 2026-05-02

## OpenCode Core (anomalyco/opencode)

### Agent Creation (`opencode agent create`)
- Interactive CLI command to create custom agents with system prompt + permissions
- Flags for non-interactive mode: `--path`, `--description`, `--mode` (all|primary|subagent), `--permissions` (tools), `--model`
- Permissions: bash, read, edit, glob, grep, webfetch, task, todowrite, websearch, lsp, skill
- Output: `.opencode/agents/{name}.md` (project) or global agents dir

### Skill Format (SKILL.md)
- YAML frontmatter: `name`, `description` (required), `license`, `compatibility`, `metadata`
- Stored in `.opencode/skills/<name>/SKILL.md`
- Skills are reusable markdown files with procedural workflows and when-to-use triggers

## OpenCode SDK (@opencode-ai/sdk)

### Streaming Responses
```ts
import Opencode from '@opencode-ai/sdk';
const client = new Opencode();
const stream = await client.event.list();
for await (const eventListResponse of stream) {
  console.log(eventListResponse);
}
```

### Error Handling
- Typed error classes: `BadRequestError`, `AuthenticationError`, `PermissionDeniedError`, `NotFoundError`, `RateLimitError`, `InternalServerError`, `APIConnectionError`, `APIConnectionTimeoutError`, `APIUserAbortError`
- Base class: `APIError` (has `status`, `name`, `headers`, `error` fields)
- `instanceof` checks for granular handling

### Retries
- Automatic retry (up to 2x) with exponential backoff on connection errors, timeouts, server errors
- Configurable via `maxRetries` option (global client or per-request)

## OpenCode Skills Plugin (malhashemi/opencode-skills — deprecated as of v1.0.190)

- Skills are **natively integrated** as of OpenCode v1.0.190
- Tool naming convention: `skills_{{skill_name}}` (underscores from path segments)
- Agent-level access control via `tools` config in `opencode.json`
- Per-agent skill permissions overrideable in agent config

## OpenCode Sessions Plugin (malhashemi/opencode-sessions)

### Session Modes
| Mode | Purpose |
|------|---------|
| `new` | Clean start, discards previous context |
| `message` | Send message within current session context |
| `compact` | Compress history before processing message |
| `fork` | Branch session preserving state — parallel exploration |

### Workflow Patterns
- **Research → Plan → Implement**: Clean phase handoffs using `mode: "new"`
- **Build → Review loop**: Use `mode: "message"` with different agents
- **Parallel exploration**: Use `mode: "fork"` for architectural divergence (e.g., microservices vs monolith vs serverless)
- **Long conversation compression**: Use `mode: "compact"` when approaching token limit
