---
title: "Preference: Toolchain Fallbacks"
type: concept
tags: [preferences, nix, nixos, shell, tooling]
relatedSkills: hubs
created: 2026-10-05
updated: 2026-10-05
status: active
---

# Toolchain Fallbacks

This is a NixOS system. Prefer tools already on PATH; fall back to Nix only when one is missing.

- Missing tool: `nix-shell -p <pkg> --run '<cmd>'` (or `nix run nixpkgs#<pkg>`).
- Fallbacks must be non-interactive — always supply flags, never launch a REPL or pager.
- Commonly present and preferred: `jq`, `zip`/`unzip`, `rsvg-convert`, ImageMagick
  (`magick` / `convert` / `identify`), `bun`, `pnpx`, `nix-shell`.

Scripts that coordinate unix tools should stay in shell and call these directly rather than
re-implementing them in another language. This underpins [[language-selection]].
