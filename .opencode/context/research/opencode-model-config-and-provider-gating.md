---
title: OpenCode model config format and provider-level model gating
source: context7 (/anomalyco/opencode) + live CLI probing 2026-09-26
ttl: 7d (provider gating) / 30d (config format)
tags: [opencode, config, model, provider, troubleshooting]
---

# OpenCode model configuration

## Config format (from Context7, `docs/config.mdx` / `docs/models.mdx`)

Global `model` uses `provider/modelID` string form:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-5",
  "small_model": "anthropic/claude-haiku-4-5"
}
```

- `model` — default model for sessions
- `small_model` — lightweight tasks (title generation); falls back to `model`
- Per-agent overrides live in agent frontmatter: `model: provider/modelID`
- `opencode models [provider]` lists registered models; `--verbose` adds JSON metadata
- `opencode auth list` shows which providers have credentials
- `opencode run -m provider/modelID "prompt"` probes a model non-interactively

## CRITICAL: config changes cannot fix account-level model gating

A model can be fully registered and authenticated yet still fail at request
time because of a **server-side account/workspace setting**. Verified cases
(2026-09-26, this machine):

| Model | Error | Layer |
|---|---|---|
| `opencode-go/*` (all) | `This Go model requires Global regions. Select Global in your workspace's Privacy settings to use it.` | OpenCode dashboard → workspace → Privacy settings → Region = **Global** |
| `ollama-cloud/*` | `this model is not included in your free usage, add usage credits to pay as you go` | Ollama billing |
| `opencode/<paid>` (Zen) | `Insufficient account funds` | OpenCode Zen credits |
| `opencode/*-free`, `opencode-go/*-free` | works | none |

**Diagnostic order** (cheap → expensive):
1. `opencode models <provider>` — is it registered? (config problem)
2. `opencode auth list` — is the provider authenticated? (auth problem)
3. `opencode run -m <model> "reply exactly: OK"` — does it actually serve traffic? (account/billing problem)

Only step 3 distinguishes "configured correctly" from "actually usable". Never
assume a registered + authenticated model works.

**Silent fallback gotcha:** when the configured session model is unreachable at
startup, OpenCode falls back to a built-in default without a visible error in
the agent header. If the session header shows a model you didn't configure, the
configured one is broken — check step 3.

## Free models (verified working, no credits)

`opencode/ling-3.0-flash-fin-free`, `opencode/longcat-2.5-preview-free`,
`opencode/mimo-v2.6-flash-free`, `opencode/muse-spark-1.3-contributor-free`,
`opencode/nemotron-3-ultra-free`, `opencode/nemotron-3.5-lightning-free`,
`opencode/space-bunny-free`, `opencode-go/longcat-2.5-preview-free`,
`opencode-go/space-bunny-free`

Note: `opencode/deepseek-v4-flash-free` is referenced in older agent frontmatter
but **is not registered** — `Model not found`. The registered DeepSeek free-tier
names are `opencode/deepseek-v4.1-flash` and `opencode/deepseek-v4-pro` (both
credit-gated, not free).
