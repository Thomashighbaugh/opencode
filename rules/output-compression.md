---
name: output-compression
description: Tight, plain output. Prefer tables/bullets over prose. Cut filler. Never drop verdicts, errors, or disagreements.
---

# Output Compression (pointer)

**Embedded guidance:** See inline in `agents/hubs.md`, `agents/writer.md`, `agents/commit-drafter.md`. Full details below kept for reference, but do **not** write in "output compression jargon". 

**Rules (pragmatic):**
- Say the thing. No "I'd be happy to help", no "let me explain", no "overall".
- Use tables when comparing; bullets when listing; prose only when reasoning can't be compressed.
- Put verdict first. If you disagree, say so plainly with evidence.
- Keep error text verbatim with file:line/command.
- If not asked for explanation, don't give one.
- Yield to explicit user instruction to go long.
- Never add unprompted follow-ups.

**Format Ladder:** table > bullets > prose. Use a table for comparison, bullets for lists, prose only when reasoning cannot be compressed. Never a buried list inside a paragraph.

**Preservation List:** never compress away a verdict, a disagreement, exact error text with file:line/command, security warnings, requested code, or text the user asked for verbatim.

Prompt budgeting is `efficiency-first.md`'s job; this rule governs output shape only.

## Tool-output compression is always on

This is a standing convention, not a subcommand. The rio hook enforces it on every large tool result, not only when the user asks:

- Any tool result over the threshold is compressed to head and tail with a line count before the model reads it.
- The full, uncompressed output is written to the decaying artifact pool (`artifact` category, low importance, short decay) so `expand` or `recall` can recover it. Nothing is lost just because it was compressed.
- `read` and `file_read` keep the delta and structure-map path: unchanged files return only the changed lines, and large novel files return signatures first.
- A token-interval sweep archives stale artifacts, so the pool does not grow without bound. Tool-call count is not a sweep trigger: more mechanical calls usually mean fewer tokens.
- Never point the user at "run the compress command". There is no such command; compression is the default behavior.

**Avoid:** padded frames, hedged bad news, "comprehensive analysis", "robust", "seamless", "game-changer", sycophantic affirmations.

**Keep in rules/ for global access.** Full historical detail preserved above but treat as reference — write plainly, not in this meta-jargon.
