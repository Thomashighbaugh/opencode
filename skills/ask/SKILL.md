---
name: ask
description: Process-first advisor routing for multi-model consultation via ask commands, with artifact capture and no raw CLI assembly
level: 3
---

# Ask

Use OMC's canonical advisor skill to route a prompt through the local OpenCode, Codex, or Gemini CLI and persist the result as an ask artifact.

## Usage

```bash
/ask <opencode|codex|gemini> <question or task>
```

Examples:

```bash
/ask codex "review this patch from a security perspective"
/ask gemini "suggest UX improvements for this flow"
/ask opencode "draft an implementation plan for issue #123"
```

## Routing

**Required execution path — always use this command:**

```bash
omc ask {{ARGUMENTS}}
```

**Do NOT manually construct raw provider CLI commands.** Never run `codex`, `opencode`, or `gemini` directly to fulfill this skill. The `omc ask` wrapper handles correct flag selection, artifact persistence, and provider-version compatibility automatically. Manually assembling provider CLI flags will produce incorrect or outdated invocations.

## Requirements

- The selected local CLI must be installed and authenticated.
- Verify availability with the matching command:

```bash
opencode --version
codex --version
gemini --version
```

## Artifacts

`omc ask` writes artifacts to:

```text
.opencode/state/artifacts/ask/<provider>-<slug>-<timestamp>.md
```

Task: {{ARGUMENTS}}
