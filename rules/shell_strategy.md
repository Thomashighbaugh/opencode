# Shell Non-Interactive Strategy (Global)

**Context:** OpenCode's shell environment is strictly **non-interactive**. It lacks a TTY/PTY, meaning any command that waits for user input, confirmation, or launches a UI (editor/pager) will hang indefinitely and timeout.

**Goal:** Achieve parity with OpenCode's shell capabilities through internalized knowledge of non-interactive flags and environment variables.

## Cognitive & Behavioral Standards

To match the high-agency, autonomous capabilities of advanced models (like glm-5.2), this strategy enforces strict cognitive patterns. These are not just shell tips; they are **behavioral requirements** for success in this environment.

**Goal:** Eliminate "human-in-the-loop" dependency during task execution.

**Key Behaviors:**
1. **Process Continuity (Turn-Taking):**
   - **Rule:** Never stop after a tool output to "wait for instructions" unless the task is complete.
   - **Why:** The environment is non-interactive. You must drive the workflow.
   - **Mechanism:** Commands expecting input MUST use timeouts or explicit "yes" pipes.

2. **Explicit Action Framing (Positive Constraints):**
   - **Rule:** Follow "GOOD" (positive) instructions, ignore "BAD" (negative) assumptions.
   - **Why:** Models follow explicit directives ("Use -y") better than prohibitions ("Don't prompt").
   - **Mechanism:** Always preemptively supply non-interactive flags.

3. **Environment Rigor (Context Awareness):**
   - **Rule:** Assume a headless CI environment where any prompt = failure.
   - **Why:** There is no TTY. "Asking the user" via a shell prompt causes a hang.
   - **Mechanism:** Strictly avoid editors, pagers, and interactive modes.

## 1. Core Mandates

1. **Assume `CI=true`**: Act as if running in a headless CI/CD pipeline.
2. **No Editors/Pagers**: `vim`, `nano`, `less`, `more`, `man` are BANNED.
3. **Force & Yes**: Always preemptively supply "yes" or "force" flags.
4. **Use Tools**: Prefer `Read`/`Write`/`Edit` tools over shell manipulation (`sed`, `echo`, `cat`).
5. **No Interactive Modes**: Never use `-i` or `-p` flags that require user input.

## 2. Environment Variables (Auto-Set)

These environment variables help prevent interactive prompts:

| Variable | Value | Purpose |
|----------|-------|---------|
| `CI` | `true` | General CI detection |
| `DEBIAN_FRONTEND` | `noninteractive` | Apt/dpkg prompts |
| `GIT_TERMINAL_PROMPT` | `0` | Git auth prompts |
| `GIT_EDITOR` | `true` | Block git editor |
| `GIT_PAGER` | `cat` | Disable git pager |
| `PAGER` | `cat` | Disable system pager |
| `GCM_INTERACTIVE` | `never` | Git credential manager |
| `HOMEBREW_NO_AUTO_UPDATE` | `1` | Homebrew updates |
| `npm_config_yes` | `true` | NPM prompts |
| `PIP_NO_INPUT` | `1` | Pip prompts |
| `YARN_ENABLE_IMMUTABLE_INSTALLS` | `false` | Yarn lockfile |

---
> **Reference tables** (command-specific flags, banned commands, prompt handling, CI patterns) are in `rules/shell_strategy_reference.md`. Load that file when you need lookup tables for specific commands.
