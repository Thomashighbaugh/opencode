---
name: hook-developer
description: Complete Claude Code hooks reference - input/output schemas, registration, testing patterns
level: 2
license: MIT
updated: 2026-09-27
---

# Hook Developer

Complete reference for developing Claude Code hooks. Use this to write hooks with correct input/output schemas. Refreshed 2026-09-27 against the official docs (`code.claude.com/docs/en/hooks`) — the event list below is the full ~28-event set; earlier versions of this file only covered about a dozen.

## When to Use

- Creating a new hook
- Debugging hook input/output format
- Understanding what fields are available
- Setting up hook registration in settings.json
- Learning what hooks can block vs inject context

## Quick Reference

| Hook | Fires When | Can Block? | Matcher |
|------|-----------|------------|---------|
| **SessionStart** | Session begins or resumes | No | Yes (`startup`\|`resume`\|`clear`\|`compact`\|`fork`) |
| **Setup** | CLI flags `--init-only`/`--init`/`--maintenance` in `-p` mode | No | Yes (`init`\|`maintenance`) |
| **UserPromptSubmit** | User submits prompt, before processing | Yes | No |
| **UserPromptExpansion** | A slash command expands into a prompt | Yes | Yes (command name) |
| **PreToolUse** | Before tool execution | Yes | Yes (tool name) |
| **PermissionRequest** | Tool needs a permission decision | No | Yes (tool name) |
| **PermissionDenied** | Auto mode denies a tool call | No | Yes (tool name) |
| **PostToolUse** | After tool succeeds | No | Yes (tool name) |
| **PostToolUseFailure** | After tool fails | No | Yes (tool name) |
| **PostToolBatch** | After a parallel tool batch resolves | No | No |
| **Notification** | Claude Code sends a notification | No | Yes (notification type) |
| **MessageDisplay** | Assistant message text streams | No | No |
| **SubagentStart** | Subagent spawned | No | Yes (agent type) |
| **SubagentStop** | Subagent finishes | Yes | Yes (agent type) |
| **TaskCreated** | Task created via `TaskCreate` | Yes | No |
| **TaskCompleted** | Task marked completed | No | No |
| **Stop** | Claude finishes responding | Yes | No |
| **StopFailure** | Turn ends due to an API error | No | Yes (error type) |
| **TeammateIdle** | Agent team teammate about to go idle | Yes | No |
| **InstructionsLoaded** | CLAUDE.md or `.claude/rules/*.md` loaded | No | Yes (load reason) |
| **ConfigChange** | Config file changes mid-session | No | Yes (source) |
| **CwdChanged** | Working directory changes | No | No |
| **DirectoryAdded** | Directory added via `/add-dir` or SDK | No | Yes (`slash_command`\|`register_repo_root`) |
| **FileChanged** | A watched file changes on disk | No | Yes (literal filenames) |
| **WorktreeCreate** | Worktree created | Yes | No |
| **WorktreeRemove** | Worktree removed | Yes | No |
| **PreCompact** | Before context compaction | No | Yes (`manual`\|`auto`) |
| **PostCompact** | After compaction completes | No | Yes (`manual`\|`auto`) |
| **PreModelSwitch** | Before a model switch applies | Yes | Yes (canonical model name) |
| **PostModelSwitch** | After the session model changes | No | Yes (canonical model name) |
| **Elicitation** | MCP server requests user input | No | Yes (MCP server name) |
| **ElicitationResult** | User responds to an MCP elicitation | No | Yes (MCP server name) |
| **SessionEnd** | Session terminates | No | Yes (`clear`\|`resume`\|`logout`\|`prompt_input_exit`\|`other`) |

**Hook type options:** `command` (shell), `http` (POST endpoint), `mcp_tool` (call an MCP server tool), `prompt` (LLM evaluation), `agent` (subagent evaluation). All five are **external** — hooks never run in-process.

---

## Hook Input/Output Schemas

### Common input fields (every event)

```json
{
  "session_id": "string",
  "prompt_id": "UUID (absent until first user input)",
  "transcript_path": "string",
  "cwd": "string",
  "scratchpad_dir": "string (optional)",
  "permission_mode": "default | plan | acceptEdits | auto | dontAsk | bypassPermissions",
  "effort": { "level": "low | medium | high | xhigh | max" },
  "hook_event_name": "string"
}
```

Inside a subagent, also: `"agent_id"`, `"agent_type"`.

### PreToolUse / PermissionRequest / PermissionDenied

**Purpose:** Decide whether a tool call proceeds, before it runs.

**Extra input:** `tool_name`, `tool_input`, `tool_use_id`.

**Output:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow | deny | ask",
    "permissionDecisionReason": "string",
    "updatedInput": {}
  }
}
```
`PermissionRequest` uses a top-level `decision` (`allow`|`deny`) + `reason` instead of `hookSpecificOutput`. `PermissionDenied` supports a `retry` boolean.

**Exit code 2:** blocks the tool, stderr shown to Claude.

**Common matchers:** `Bash`, `Edit|Write`, `Read`, `Task`, `mcp__.*`

### PostToolUse / PostToolUseFailure

**Purpose:** React to a tool's result. **Cannot** undo the action — it already ran.

**CRITICAL:** the field is `tool_response`, **not** `tool_result`.

**Output:** only `additionalContext` / `systemMessage` under `hookSpecificOutput` — there is no `"decision": "block"` for this event. (An earlier version of this file claimed there was; that was wrong. If you need to force a correction, use a `Stop` hook instead, which genuinely can block.)

### UserPromptSubmit / UserPromptExpansion

**Purpose:** Validate or inject context before Claude processes the prompt.

**Output (plain text):** any stdout text is added to context verbatim.

**Output (JSON):**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "permissionDecision": "deny",
    "permissionDecisionReason": "string",
    "additionalContext": "string"
  }
}
```

**Exit code 2:** blocks the prompt; stderr is shown to the **user only**, not Claude.

### Stop / SubagentStop

**Purpose:** Force continuation instead of letting Claude stop.

**CRITICAL:** check `stop_hook_active: true` in the input to avoid an infinite loop.

**Output:** `{"decision": "block", "reason": "..."}` — blocking forces Claude to continue, with `reason` as the next prompt.

### SessionStart / SessionEnd

**SessionStart** input: `"start_reason": "startup|resume|clear|compact|fork"`. Output can be plain-text stdout (added as context) or `hookSpecificOutput.additionalContext`. `CLAUDE_ENV_FILE` env var: write `export VAR=value` lines to persist env vars for the session.

**SessionEnd** cannot affect the session — cleanup only.

### PreModelSwitch / PostModelSwitch

Input: `from_model` / `to_model` (canonical model names). `PreModelSwitch` can block via `permissionDecision: deny`.

### Notification

Input: `notification_type` — one of `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog`, `elicitation_url_dialog`, `elicitation_complete`, `elicitation_response`, `agent_needs_input`, `agent_completed`, `quota_auto_resume_fired`, `quota_auto_resume_stale`, `quota_auto_resume_disabled`.

### PreCompact / PostCompact

Input: `"trigger": "manual|auto"`, plus `custom_instructions` on `PreCompact`. Output: `{"continue": true, "systemMessage": "..."}`.

---

## Registration in settings.json

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/my-hook.sh", "timeout": 60 }
        ]
      }
    ]
  }
}
```

Events **without** matcher support (`UserPromptSubmit`, `Stop`, `TaskCreated`, `CwdChanged`, `PostToolBatch`, `MessageDisplay`, `TeammateIdle`, `TaskCompleted`) take a bucket with no `matcher` key:

```json
{ "hooks": { "UserPromptSubmit": [ { "hooks": [{ "type": "command", "command": "/path/to/hook.sh" }] } ] } }
```

**Matcher patterns:** exact tool name (`Bash`), alternation (`Edit|Write`), regex (`Read.*`, `mcp__.*`). Case-sensitive.

**Locations:** `~/.claude/settings.json` (user, not shareable), `.claude/settings.json` (project, shareable), `.claude/settings.local.json` (project-local, gitignored), a plugin's `hooks/hooks.json` (bundled, merges with whatever the manifest also declares), or inline in a skill/subagent's own frontmatter `hooks:` key (scoped to that skill/subagent's lifetime).

## Hook Types

- **`command`** (default): `{type, command, args, async, asyncRewake, shell, timeout, statusMessage}`. Async + `asyncRewake: true` wakes Claude on exit 2.
- **`http`**: `{type: "http", url, headers, allowedEnvVars, timeout, statusMessage}`.
- **`mcp_tool`**: `{type: "mcp_tool", server, tool, input, timeout, statusMessage}` — the MCP tool's text output is treated as command-hook stdout.
- **`prompt`**: `{type: "prompt", prompt, model, timeout, statusMessage}` — LLM evaluates and returns the same decision JSON shape.
- **`agent`** (experimental): `{type: "agent", prompt, model, timeout, statusMessage}` — spawns a subagent with Read/Grep/Glob to decide.

## MCP Tool Naming for Matchers

`mcp__<server>__<tool>` — e.g. `mcp__github__.*` matches all GitHub MCP tools, `mcp__.*__write.*` matches all MCP write-shaped tools across every server.

## Environment Variables

| Variable | Available to | Description |
|----------|--------------|--------------|
| `CLAUDE_PROJECT_DIR` | all hooks | Absolute path to project root |
| `CLAUDE_CODE_REMOTE` | all hooks | `"true"` if remote/web, empty if local CLI |
| `CLAUDE_ENV_FILE` | `SessionStart` only | Path to write `export VAR=value` lines |
| `CLAUDE_PLUGIN_ROOT` | plugin hooks only | Absolute path to that plugin's installed version dir |
| `CLAUDE_PLUGIN_DATA` | plugin hooks only | Absolute path to that plugin's persistent data dir |

## Exit Codes

| Exit Code | Behavior | stdout | stderr |
|-----------|----------|--------|--------|
| **0** | Success | Parsed as JSON if it looks like an object; else plain text added as context on `UserPromptSubmit`/`UserPromptExpansion`/`SessionStart`/`PostModelSwitch` | Debug log only |
| **2** | Blocking (only on events that support it: `PreToolUse`, `UserPromptSubmit`, `UserPromptExpansion`, `Stop`, `SubagentStop`, `TeammateIdle`, `TaskCreated`, `PreModelSwitch`, `WorktreeCreate`) | Ignored | Shown as the block reason |
| **other** | Non-blocking error; JSON output still honored if valid | — | Verbose mode only |

## Shell Wrapper Pattern

```bash
#!/bin/bash
set -e
cd "$CLAUDE_PROJECT_DIR/.claude/hooks"
cat | npx tsx src/my-hook.ts
```

A hook doesn't need a shell wrapper at all if it's directly executable — a `#!/usr/bin/env node` (or `python3`) script with the execute bit set works as `command` on its own. See `~/.config/opencode/claude/hooks/*.mjs` for a working example of that pattern (a `PreToolUse` bash-safelist hook and a `UserPromptSubmit` semantic-context hook, both plain Node ESM, no build step).

## Testing Hooks

```bash
# PreToolUse (Bash)
echo '{"tool_name":"Bash","tool_input":{"command":"ls"},"session_id":"test"}' | ./my-hook.sh

# PostToolUse — note tool_response, not tool_result
echo '{"tool_name":"Write","tool_input":{"file_path":"test.md"},"tool_response":{"success":true},"session_id":"test"}' | ./my-hook.sh

# UserPromptSubmit
echo '{"prompt":"test prompt","session_id":"test"}' | ./my-hook.sh
```

## Debugging Checklist

- [ ] Hook registered in the right settings.json (user vs project vs local)?
- [ ] Script has the execute bit, or is invoked via an interpreter (`node`, `npx tsx`, `python3`)?
- [ ] Using `tool_response` not `tool_result` on `PostToolUse`?
- [ ] Output is valid JSON (or plain text where that's accepted)?
- [ ] Checking `stop_hook_active` in `Stop`/`SubagentStop` hooks to avoid an infinite loop?
- [ ] Using `$CLAUDE_PROJECT_DIR` (project) or an absolute path (user-scope) rather than a relative path?

## Key Learnings from Past Sessions

1. **Field names matter** — `tool_response` not `tool_result`.
2. **`PostToolUse` cannot block** — only `additionalContext`/`systemMessage`. Use `Stop` if you actually need to force a correction.
3. **Exit code 2** — stderr becomes the block reason; stdout is ignored on a blocking exit.
4. **Check `stop_hook_active`** before blocking in `Stop`/`SubagentStop`, or you'll loop forever.
5. **Test manually first** — `echo '{...}' | ./hook.sh` before relying on registration working.
6. **A plain executable script needs no shell wrapper** — a shebang + execute bit is enough for `type: "command"`.

## See Also

- `hooks` skill — condensed quick-reference version of this file
- `~/.config/opencode/claude/hooks/` — two working hooks kept in sync with this reference
