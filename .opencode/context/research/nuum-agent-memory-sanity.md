# Nuum: Agent Memory via Distillation — Sanity Research

**Source:** https://www.sanity.io/blog/how-we-solved-the-agent-memory-problem
**Fetched:** 2026-06-22
**Author:** Simen Svale (Co-founder & CTO, Sanity)
**Tags:** memory, agents, distillation, context-window, Nuum, Miriad, long-term-memory

---

## Summary

Sanity's Nuum architecture solves the "goldfish problem" (agents losing track of decisions as context fills) using **distillation** instead of summarization. Rather than compressing conversation history into a narrative summary, Nuum extracts two distillates per segment: a short narrative and a list of retained operational facts. This preserves actionable intelligence while releasing narrative detail. The system has been running in production for 6+ days with 7,400+ messages on a single agent.

---

## Core Problem: Why Summarization Fails

- **Summarization preserves narrative** — but agents need **operational intelligence** (file paths, values, decisions, gotchas)
- After 3-4 summarization passes, agents retain the "shape" of what happened but not the specifics
- Agents end up re-grepping for things they already knew
- The goldfish problem emerges over **hours of sustained work**, not in 10-minute SWE-bench tasks

---

## Nuum Architecture: Three-Tier Memory

### Tier 1: Temporal Memory (Working Memory)
- Every message stored with full fidelity
- Full-text searchable
- Used by the "reflect" tool for detailed recall

### Tier 2: Distilled Memory (Compressed History)
- Background process monitors context window
- When >60% capacity, distillation agent compresses older segments
- Each distillation produces:
  - **Narrative** (1-3 sentences): what happened
  - **Retained Facts** (bullet list): file paths, values, decisions, gotchas
- Distillations can be **recursively distilled** — early conversations become increasingly abstract

### Tier 3: Long-Term Memory (Knowledge Base)
- Separate curator agent extracts durable knowledge
- User preferences, architectural decisions, learned patterns
- Persists across sessions, injected into system prompt
- Agent returns tomorrow already knowing conventions and past decisions

---

## Distillation Mechanism (Detailed)

### Trigger
- Background process monitors token count after each turn
- When context exceeds ~60% capacity (~60k tokens on 200k model), distillation wakes up
- Works on oldest un-distilled messages first

### Segment Selection
- Conversations cluster into coherent segments (debugging a bug, implementing a feature)
- Distillation agent identifies boundaries via:
  - **Topic shifts** ("Now let's work on authentication")
  - **Natural breakpoints** (bug fixed, feature committed, decision made)
  - **Temporal clustering** (messages close in time about the same thing)
- Typical segment: 10-50 messages

### Two Distillates per Segment

**Operational Context** (1-3 sentences):
> "Debugged the redirect middleware. Root cause was the image asset URLs being rewritten incorrectly. Fixed by updating the path matching regex in middleware.ts."

**Retained Facts** (bullet list):
- Image assets live in /public/assets, served from /\_next/static
- The regex was matching /api/* paths incorrectly—needed negative lookahead
- User preference: don't add backwards-compat shims, just fix the callers
- Related file: src/middleware.ts lines 45-67

### What Gets Kept vs Dropped

**Preserved:**
- File paths and locations
- Specific values, thresholds, configuration
- Decisions and their rationale (the "why")
- User preferences and patterns
- Error messages and their solutions
- Anything hard to rediscover

**Dropped:**
- Exploratory back-and-forth that led nowhere
- Verbose tool outputs
- Social pleasantries
- Redundant restatements
- The "texture" of debugging (false starts, confusion)

### Compression Ratio
- 10-20x compression while keeping everything operationally useful
- 50-message debugging session → 3 sentences + 5 bullet points

### Recursive Distillation (Gradient Effect)
```
Day 1 morning: 50 messages → Distillation A (context + 5 facts)
Day 1 afternoon: 40 messages → Distillation B (context + 4 facts)
Day 2 morning: 60 messages → Distillation C (context + 6 facts)
Later: Distillations A + B + C → Meta-distillation (context + 3 key facts)
```

Creates a natural gradient:
- **Last few hours**: Full message history, complete detail
- **Yesterday**: Distilled segments, narrative + key facts
- **Last week**: Meta-distillations, high-level outcomes + critical facts
- **Older**: Increasingly abstract, only most durable insights remain

---

## Background Workers

### Distillation Agent
- Monitors token count
- Identifies coherent conversation segments
- Compresses them (main agent never sees this happening)
- Uses Claude Opus (reasoning tier)

### LTM Curator
- After each conversation turn, reviews what happened
- Decides whether anything belongs in long-term memory
- Can create, update, or reorganize knowledge entries
- Has web access to research and strengthen existing knowledge

### Reflect Tool
- When main agent needs specific recall, spawns a reflection sub-agent
- Has full-text search over all temporal messages (even pre-distillation)
- Access to complete LTM knowledge base
- Can retrieve specific messages with surrounding context
- Gives the illusion of perfect recall without loading everything into context

---

## Real-World Results

- **7,400+ messages** across 6 days of intensive development on a single agent
- Agent helped design and build its own memory architecture (recursive self-improvement loop)
- Remains coherent — still knows file paths from early days, remembers architectural decisions
- "Holy F" moment in practice

---

## Inspirations

- **Letta** — long-term memory agent using background processing for memory management
  - Core memories representing identity and learned behaviors
  - Background agent maintaining knowledge asynchronously
  - But Letta still uses "compact everything on overflow" for temporal working memory
- **OpenCode** — Nuum borrows its coding tools from OpenCode

---

## Relevance to OpenCode Hubs

Nuum's distillation approach is directly applicable to OpenCode's context management:

1. **Distillation vs Summarization** — OpenCode's current context strategy uses extraction (decisions, patterns, learnings). Nuum's two-distillate model (narrative + facts) could improve this.
2. **Recursive distillation** — Maps to OpenCode's state → context pipeline, where session knowledge gets progressively refined
3. **Reflect tool pattern** — A sub-agent with full-text search over history is analogous to OpenCode's `@tracer` or `@explore` agents
4. **Gradient of detail** — Recent work is vivid, older work is abstracted — matches how durable context should work
5. **Background curator** — An agent that watches sessions and promotes knowledge to durable storage aligns with OpenCode's `/harvest-context` philosophy
6. **60% trigger threshold** — A concrete heuristic for when to compact/compress context

---

## Key Differences from Mastra's Observational Memory

| Aspect | Nuum (Sanity) | Observational Memory (Mastra) |
|--------|---------------|-------------------------------|
| Core mechanism | Distillation (narrative + facts) | Observation (event log with priorities) |
| Compression trigger | ~60% context capacity | Token thresholds (Observer + Reflector) |
| Output format | Narrative sentence + bullet facts | Two-level bulleted lists with emoji priorities |
| Temporal model | Implicit (gradient of detail) | Explicit three-date model |
| Background agents | Distillation agent + LTM Curator | Observer + Reflector |
| Recall mechanism | Reflect tool (sub-agent + full-text search) | Static observations in context |
| Context stability | Stable (append-only distillations) | Stable (append-only observations) |
| Benchmark | Production experience (no formal benchmark) | 94.87% on LongMemEval |

---

## References

1. Nuum open source: `bunx @sanity-labs/nuum --repl`
2. Miriad: https://app.miriad.systems
3. Letta: https://www.letta.com/
4. OpenCode: referenced as inspiration for coding tools
