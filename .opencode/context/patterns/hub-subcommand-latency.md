# Pattern: Hub Subcommand Responsiveness

## Problem
Clicking a hub subcommand from the TUI dialog menu takes 3+ minutes to respond. This is the time-to-first-token for the cloud LLM API, not plugin code or disk I/O.

## Root Cause
Every hub subcommand selection goes through `session.command()` or `session.prompt()` which both require full LLM inference. There is no SDK path to execute a custom command or tool without invoking the AI.

Measured cloud API latency through Ollama proxy (`127.0.0.1:11434`):
- Small prompt (9 tokens): **1.4 seconds**
- Full context (~10KB instructions): **~110 seconds**

## Solution
Separate the "selection" step from the "execution" step:

1. **Subcommand click** → toast (instant UI feedback) + `appendPrompt()` (pre-fill prompt bar)
2. **User presses Enter** → LLM processes the full command (the unavoidable 90s wait)

This way the dialog interaction is instant, and the user controls when the LLM wait starts.

## Key Insight
There is NO way to bypass LLM inference in the current OpenCode SDK (v1.14.31):
- `session.command()` and `session.prompt()` always go through LLM
- `command.execute.before` hook cannot short-circuit
- `Tui.executeCommand()` only handles built-in TUI commands
- `client.tool` and `client.command` are read-only (list only, no execute)

The only fix is at the OpenCode SDK level — adding a tool-execution or command-execution API that bypasses the AI session.
