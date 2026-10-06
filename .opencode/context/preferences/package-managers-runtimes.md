---
title: "Preference: Package Managers & Runtimes"
type: concept
tags: [preferences, pnpm, bun, typescript, runtimes]
relatedSkills: hubs
created: 2026-10-05
updated: 2026-10-05
status: active
---

# Package Managers & Runtimes

| Context | Runtime | Why |
|---------|---------|-----|
| OpenCode internals (`tools/`, `plugins/`, `tools/hubs/`) | **bun** | bundled with OpenCode; unavoidable |
| Non-internal TS (skill scripts, config helpers, one-offs) | **pnpm / `pnpx`** | predictable, clearer errors than bun |

- `bun` is reserved for work that must run inside the OpenCode runtime.
- For everything else, run TypeScript with `pnpx tsx <file>`.
- Prefer `pnpx` over `npx` / `bunx` for one-off package execution.
- If `pnpx` is broken, `corepack enable --install-directory <dir> pnpm` restores working shims.

See [[language-selection]] for when TypeScript is the right choice at all.
