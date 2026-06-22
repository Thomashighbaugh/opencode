# BROS Harness — OpenCode Plugin for Disciplined Agent Delivery

**Source:** https://www.npmjs.com/package/bros-harness (v0.6.7)
**Fetched:** 2026-06-22
**Author:** thanhbinhne (thanhbinh2003195@gmail.com)
**Tags:** opencode, plugin, agents, harness, BROS, gated-delivery, disciplined-engineering

---

## Summary

BROS Harness is a **package-first OpenCode plugin** for engineering teams that want AI-assisted delivery without losing discipline. It packages a reviewed set of BROS agents, commands, skills, templates, and documentation, then exposes them through a narrow OpenCode plugin and a read-only helper CLI. The core philosophy: **"Move slower than chaos. Ship faster than rework."**

BROS is explicitly **not** an AI swarm — it is a gated delivery harness: clarify the work, challenge weak assumptions, implement only approved scope, verify the result, and hand off remaining risk clearly.

---

## Core Philosophy

**BE THE BRO** = bringing useful pressure to AI-assisted delivery:
- Ask what is approved
- Pick the lightest safe lane
- Build only inside the packet
- Verify the result
- Report the remaining risk

BROS keeps fun names visible, but **gates stay in charge**. No auto-merge, no auto-publish, no hidden production moves.

---

## How BROS Differs from AI Swarms

| AI Swarm Pattern | BROS Harness Pattern |
|---|---|
| Many agents run at once by default | Roles are explicit and gated by task packets |
| Speed is the main measure | Quality, security, and reviewability come first |
| Agents may expand scope to "finish" the goal | Builders implement only approved scope |
| Failures are patched until output looks plausible | Blockers, uncertainty, and residual risk are reported |
| Tooling may mutate broad config surfaces | Package plugin uses a narrow in-memory OpenCode hook only |

---

## The Bros (Agent Roles)

"Bro" names are display aliases, not authority overrides. Technical IDs, OpenCode config, permissions, user instructions, security gates, and QA gates remain the source of truth.

| Agent | Role |
|---|---|
| **Mighty Bro** | Orchestrates gates, packets, and final review flow |
| **Bro Build** | Implements approved task packets with smallest correct change |
| **Bro Test** | Verifies behavior, pushes back on weak test evidence |
| **Bro Shield** | Reviews security-sensitive changes, blocks unsafe shortcuts |
| **Bro Explore** | Gathers evidence before the team relies on assumptions |
| **Bro Docs** | Turns verified implementation context into maintainable docs |
| **Bro UI / Bro Design** | Design direction when UI work requires it |

---

## Workflow

```
Intake
  ↓
Clarify objective, risk, and scope
  ↓
Plan approved task packet
  ↓
Explore evidence when required
  ↓
Implement only approved scope
  ↓
Validate with approved checks
  ↓
Security / QA / review gates
  ↓
Handoff with changes, verification, and remaining risks
```

---

## Workflow Modes

| Mode | When to Use | Gate Reminder |
|---|---|---|
| **Normal prompt** | Quick questions, small clarifications, status checks | If scope is unclear or touches secrets/security/production, quick mode stops |
| **`/bros-plan`** | Need a real plan before anyone builds | Planning does not auto-build. Continue with `/bros-build` only after plan approved |
| **`/bros-build`** | Have an approved task packet, want local implementation | Missing packet, missing acceptance criteria, failed checks block the build |
| **`/bros-review`** | Want independent audit of plan, PR, delivery claim, or local result | Review does not patch by default. Remediation needs separate approval |
| **`/bros-assemble`** | One-prompt convenience for safe-scope work without skipping discipline | Not a shortcut: no auto-publish, no auto-merge, no deploy, no destructive action |

---

## Principles

1. **No rubber stamps** — Risky or unclear requests should be challenged respectfully
2. **Scope is a safety boundary** — A builder does not become product owner, architect, QA approver, or security approver
3. **Evidence beats vibes** — Required evidence packets must exist before dependent work proceeds
4. **Small changes win** — Prefer the narrowest implementation that satisfies the approved packet
5. **Security is not a final garnish** — Secrets, permissions, providers, MCP servers, telemetry, and production mutations require explicit review paths
6. **Readable handoff matters** — Future maintainers should know what changed, why, how verified, and what remains risky

---

## Safety by Design (Plugin Architecture)

The package plugin is intentionally **narrow**. On load, it uses OpenCode's in-memory `config(cfg)` hook to add only:
- Package-relative BROS skills directory to `skills.paths`
- Packaged BROS agent entries to `agent` (without overwriting existing keys)
- Packaged command prompt entries to `command` (without overwriting existing keys)

It does **not**:
- Collect provider credentials or write `.env` files
- Install dependencies
- Publish packages
- Register providers
- Add MCP servers
- Change top-level permissions
- Configure telemetry
- Read, validate, or write secrets

### Permission Profiles
Optional BROS-specific config in `bros.config.json` supports:
- `fallback_models` — model routing fallbacks
- `categories` — semantic routing/capability registry
- `routing_profiles` — explicit-depth routing
- `agents` — agent-specific overrides
- `permission_profiles` — scoped permission profiles
- `approval_packages` — approval packages

Permission profiles and approval packages are: opt-in, repo-scoped, expiry-bound, reason-logged. They keep **hard denies** for: secret reads, publish, destructive actions, force push, protected branch mutation, production/cloud mutation.

`bro-build` defaults to flexible local Bash for routine development. Git mutation, dependency installs, Docker mutation, deploy/publish, secret-reading, destructive, force-push, and production/cloud command classes remain **ask-gated or denied**.

---

## Installation

```bash
# Project install
bunx bros-harness@latest install

# Project update
bunx bros-harness@latest update

# Verify
opencode agent list
opencode run --agent mighty-bro "hello"
```

Read-only helpers:
```bash
bros install --dry-run
bros doctor
bros status
bros config-status
bros list-assets
bros snippet
```

---

## Package Contents

- `assets/opencode/` — packaged agents, commands, skills, templates, and docs
- `assets/manifest.json` — package asset manifest with `sourceRef`
- `assets/skills.lifecycle.json` — skill lifecycle metadata (active, deprecated, skipped, redacted, blocked)
- `src/plugin.mjs` — OpenCode plugin entrypoint
- `bin/bros.mjs` — package-native install/update CLI + read-only helpers
- `docs/configuration.md` — rich config guide for routing and permission profiles
- `docs/instruction-system/` — routing map, packet-schema references, safety/trust labels
- `examples/` — config templates, schema, category routing reference

---

## Relevance to OpenCode Hubs

1. **Package-first plugin model** — BROS is the cleanest example of an OpenCode plugin that ships agents, skills, and commands as a versioned npm package. This is the reference pattern for OpenCode Hubs plugin distribution.

2. **Narrow hook surface** — BROS uses only the `config(cfg)` in-memory hook, never writing to disk or mutating config outside its scope. This is the ideal safety model for OpenCode plugins.

3. **Gated delivery workflow** — The `/bros-plan` → `/bros-build` → `/bros-review` → handoff pipeline maps directly to OpenCode's orchestration patterns (plan-execute, pipeline, pair).

4. **Permission profiles** — BROS's opt-in, repo-scoped, expiry-bound permission profiles with hard denies for dangerous operations is a model for OpenCode's security model.

5. **"Bro" naming convention** — Display aliases that don't override technical IDs, permissions, or gates. Persona is style-only.

6. **Evidence-before-action** — The packet-based approach (define scope, gates, evidence, acceptance criteria before implementation) aligns with OpenCode's karpathy-guidelines (think before coding, goal-driven execution).

---

## References

1. npm package: https://www.npmjs.com/package/bros-harness
2. GitHub: https://github.com/Thanhbinh1905/bros
3. Installation guide: https://raw.githubusercontent.com/Thanhbinh1905/bros/main/docs/installation.md
4. Config schema: https://raw.githubusercontent.com/Thanhbinh1905/bros/main/examples/bros.config.schema.json
