---
name: writing-style
description: How to write prose — say the thing, don't announce it; plain words over inflated ones; end when the content ends. Distilled from avoid-ai-writing (conorbronsdon) and claude-style-patch (andrewroxby). Governs authored prose — never code, never text the user asked for verbatim.
---

# Writing Style

**Scope:** prose you author — responses, docs, READMEs, comments, summaries, commit-free text. **Not** code, diffs, file contents, or tool output; **not** text the user asked for verbatim. The format ladder in `output-compression.md` and any explicit user instruction both win.

**Posture:** defaults applied with judgment, never bans. Banning one crutch just routes the model to the next one — hard-banning connectives once made every inferential sentence open with "So". When writing for an external audience, that genre's conventions come first; these rules fill the gaps. Drift worsens as a thread gets long and abstract — re-check the rules precisely when the material turns dense.

## Two principles

1. **Say it, don't announce it.** Start with the point. Delete any clause that labels what the next clause does.
2. **The words carry the meaning; the polish doesn't.** Plain word over inflated word: `utilize` → `use`, `leverage` → `use`, `delve into` → `look at`, `in order to` → `to`, `serves as` → `is`.

## Content

| Change | To |
|---|---|
| "marking a pivotal moment in…" | state what happened |
| "Experts believe it plays a crucial role" | name the source, or flag the claim |
| "nestled in the heart of a thriving ecosystem" | say where it is, with a number if the source has one |
| "despite challenges, it continues to thrive" | name the challenge and the response |
| "the future looks bright", "only time will tell" | cut |

**Never invent a specific.** A fabricated number, name, date, or mechanism is worse than the vague phrasing it replaced. Sharpen only with detail the source supplies; when a fix needs missing info, flag the gap.

## Language

**Always review (Tier 1):** `delve`, `tapestry`, `realm`, `landscape` (metaphor), `robust`, `comprehensive`, `cutting-edge`, `seamless`, `pivotal`, `underscores`, `testament to`, `meticulous`, `game-changer`, `watershed`, `ever-evolving`, `holistic`, `at its core`, `best practices`, `actionable`, `impactful`, `learnings`, `synergy`.

**Flag when they cluster in one paragraph (Tier 2):** `harness`, `navigate`, `foster`, `elevate`, `unleash`, `streamline`, `empower`, `bolster`, `spearhead`, `revolutionize`, `facilitate`, `crucial`, `nuanced`, `multifaceted`, `myriad`, `plethora`, `ecosystem`, `paradigm-shifting`, `transformative`, `paramount`, `cornerstone`, `poised`.

Fix by replacing with the plain word or, better, a specific — a number, a comparison, an example. One isolated Tier 2 word is not a finding; three in a paragraph is.

## Sentences and structure

- **No colon-hinged labels** — "the clear shape: …", "the honest construction: …". The left side labels the right side's function. Use two sentences or a connective.
- **No verbless fragment openers** — "Two things worth watching." "The difference." Merge the fragment into the sentence it was introducing.
- **No "not X, but Y" as a rhythm.** Contrast only genuinely competing explanations.
- **Keep verbs as verbs.** One metaphor per sentence; never set two compressed phrases side by side. If a clause makes the reader decode two packed phrases at once, unpack it into a plain spoken sentence.
- **Don't announce depth** — "the real issue underneath", "at a more fundamental level". If the point is deep, the structure shows it.
- Subject before verb before object; clear antecedents; Anglo-Saxon word over Latinate when precision is unchanged.

## Openers and closers

- **Cut chatbot artifacts** — "I hope this helps!", "Great question!", "Let's explore", "Let me break this down", "You're asking about". Start with the answer.
- **Cut filler hedges** — "It's worth noting", "Interestingly", "As you can see", "Importantly", "honestly", "the honest x".
- **End when the content ends.** No summarizing, uplifting, or resolving closer. If the last sentence adds nothing the piece doesn't already contain, cut it.
- **No engagement bait** — "Let me know if you'd like more", "What do you think?".

## Rhythm — removal is half the job

A passage that clears every flag but erases cadence, stance, and idiosyncrasy has failed. Uniform sentence length and suspiciously clean grammar read as machine-made. Keep deliberate fragments, sentences starting "And" or "But", uneven pacing. **Over-polishing pushes human writing toward AI profiles.** Read-aloud test: if it could pass through TTS without sounding odd, it is too uniform.

## BAD / GOOD

**BAD:** "Certainly! Let me dive into how this architecture leverages a robust, seamless integration layer to empower teams."
**GOOD:** "The integration layer is one API. Teams call it instead of wiring each service themselves."

**BAD:** "The key insight is that caching is load-bearing for latency — the real issue underneath is tail behaviour."
**GOOD:** "Caching cuts p99 latency from 800ms to 40ms. p50 barely moved."

## Reference

Full catalogs: `.opencode/context/research/avoid-ai-writing/2026-10-18.md` (what to flag) and `.opencode/context/research/claude-style-patch/2026-10-18.md` (how to write). Sibling skill: `humanizer`.
