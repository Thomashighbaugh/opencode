---
title: "Preference: Language Selection"
type: concept
tags: [preferences, language, tooling, best-tool]
relatedSkills: hubs
created: 2026-10-05
updated: 2026-10-05
status: active
---

# Language Selection

Choose the best tool for the job — never default to one language by reflex.

- **Shell (sh/bash/zsh)** is the default for orchestration, one-liners, and coordinating unix
  tools. If the shell already owns the capability, use it.
- **TypeScript** for genuine logic (parsing, generation, validation). Which runner to use is
  defined in [[package-managers-runtimes]].
- **Python** only where it is the genuinely better tool — see [[python-policy]].
- **MATLAB / Julia** when the numeric situation calls for them.

Anti-pattern: reaching for TypeScript (or any single language) because it is familiar, when a
shell one-liner or an existing CLI does the job exactly.
