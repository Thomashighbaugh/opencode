---
title: "opencode-websearch-cited — LLM-Grounded Web Search with Citations for OpenCode"
type: source-summary
tags: [opencode, plugin, websearch, citations, agent, google, openai, openrouter]
created: 2026-07-05
updated: 2026-07-05
sources: [github-readme, npm-registry]
status: active
---

# opencode-websearch-cited

LLM-grounded web search plugin for OpenCode, with inline citations and a `Sources:` list when available.

- **Package**: `opencode-websearch-cited` on npm
- **Repository**: [ghoulr/opencode-websearch-cited](https://github.com/ghoulr/opencode-websearch-cited)
- **License**: Apache-2.0
- **Latest Version**: 1.2.0

## Features

- `websearch_cited` tool backed by builtin web search from:
  - **Google** (Gemini API — Google Search grounding)
  - **OpenAI** (platform web search tool)
  - **OpenRouter** (web search plugin support)
- Outputs results with inline citations and a `Sources:` list
- Compatible with any OpenCode agent that can use tools

Example output:
```markdown
Answer with citations[1] based on web search results[2].

Sources:
[1] Example Source (https://example.test/source-1)
[2] Another Source (https://example.test/source-2)
```

## Installation

Add to `~/.config/opencode/opencode.json` — put it **LAST** in the `plugin` list:

```json
{
  "plugin": [
    "...other plugins",
    "opencode-websearch-cited@1.2.0"
  ]
}
```

OpenCode does not auto-upgrade plugins — pin the version.

## Configuration

Requires provider auth via `opencode auth login` + a `websearch_cited` model config:

```json
{
  "provider": {
    "openrouter": {
      "options": {
        "websearch_cited": {
          "model": "x-ai/grok-4.1-fast"
        }
      }
    },
    "openai": {
      "options": {
        "websearch_cited": {
          "model": "gpt-5.2"
        }
      }
    },
    "google": {
      "options": {
        "websearch_cited": {
          "model": "gemini-2.5-flash"
        }
      }
    }
  }
}
```

The plugin scans `provider` entries in order and uses the first provider with `options.websearch_cited.model`. If multiple providers are configured, **order matters**.

## Key Concepts

- Single tool `websearch_cited` that agents can call when they need web search with proper citations
- Provider-agnostic — works with Google, OpenAI, or OpenRouter
- Must be last in the plugin list to avoid interfering with other plugins' auth processes
- Compatible with `opencode-antigravity-auth` for Google auth
- Development with Bun + TypeScript, uses `@opencode-ai/plugin` SDK
