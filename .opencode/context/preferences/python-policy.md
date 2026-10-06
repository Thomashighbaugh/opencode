---
title: "Preference: Python Policy"
type: concept
tags: [preferences, python, data-science, internal-tooling]
relatedSkills: scientist
created: 2026-10-05
updated: 2026-10-05
status: active
---

# Python Policy

Python is kept only where it is the better tool, and is banned from internal machinery.

## Allowed

- **Pure-Python projects** — the `python-api` archetype applies as-is.
- **Data science** — Python computes numbers well (automatic conversion to heap-allocated
  arbitrary-precision ints, mature numeric/visualisation stack). The `@scientist` agent may use
  `python3` / `.py` files, and **MATLAB or Julia** when the situation calls for them.
- **Project-facing documentation** about Python projects (CI examples, Dockerfiles, dependency
  management guidance).

## Not allowed

- OpenCode internal tooling: tools, plugins, skill scripts, config helpers, index/build scripts.
  Rewritten to shell or TypeScript; see [[language-selection]].
- Internal one-liners: use `jq` / shell instead of `python3 -c`.

Projects that merely *trend* toward Python should prefer TypeScript where it fits, with Python
noted as an alternative — not assumed.
