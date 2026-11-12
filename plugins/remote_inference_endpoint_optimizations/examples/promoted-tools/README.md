# Promoted Project-Scoped Tools

These are reference implementations of tools promoted via
`promoteToProjectTooling()` from the `remote_inference_endpoint_optimizations`
plugin. Each is a **mechanical alternative to inference** — it performs a
repeated task locally using shell/TypeScript instead of asking the model.

## How promotion works

The `promoteToProjectTooling(projectDir, taskSlug, toolBody)` function in
`src/mechanical.ts` writes a tool file to
`<project>/.opencode/tools/<slug>.ts`. These examples show what gets promoted.

## Tools

| Tool | Mechanical replaces | Inference saved |
|------|-------------------|-----------------|
| `git-diff-summary.ts` | Asking model to summarize `git diff` | ~500 tokens per diff |
| `log-error-extractor.ts` | Asking model to parse log files | ~300 tokens per match |
| `config-validator.ts` | Asking model to review config files | ~100 tokens per key |

## Usage

```ts
import { promoteToProjectTooling, slugify } from "rio/src/mechanical.ts"

promoteToProjectTooling("/path/to/project", "git-diff-summary", toolBody)
```

No Python one-off scripts are ever created — TypeScript only.
