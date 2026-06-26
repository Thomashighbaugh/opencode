---
name: improve-codebase-architecture
description: Analyze codebases for architectural friction and propose module-deepening refactors as testability improvements. Use when the codebase feels hard to change, tests are brittle, or modules seem shallow. Applies John Ousterhout's deep module principle — small interfaces hiding large implementations for better testability and AI navigability.
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

## Process

### 1. Explore

Use the `explore` agent to walk the codebase organically. Note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the codebase are untested, or hard to test through their current interface?

Apply the **deletion test**: would deleting this module concentrate complexity, or just move it?

### 2. Present Candidates as Markdown Tables

For each candidate found, present a card-like section with markdown tables:

```
## Candidate: [module name]

### Files
| File | Role |
|------|------|
| src/x.ts | [description] |
| src/y.ts | [description] |

### Problem
[Why the current architecture is causing friction]

### Solution
[Plain English description of what would change]

### Benefits
| Dimension | Improvement |
|-----------|-------------|
| Locality | [how locality improves] |
| Leverage | [how leverage improves] |
| Testability | [how tests improve] |

### Recommendation Strength: [Strong | Worth exploring | Speculative]
```

If the candidate contradicts an existing ADR, note it clearly:
```
> ⚠️  Contradicts ADR-0007 — but worth reopening because [reason]
```

End with a **Top Recommendation** section stating which candidate to tackle first and why.

### 3. Grilling Loop

Once the user picks a candidate, run the `grilling` skill (/ideation grill) to walk the design tree — constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.

Side effects as decisions crystallize:
- **Naming a deepened module after a new concept?** Note it for CONTEXT.md
- **Sharpening a fuzzy term?** Update documentation
- **User rejects candidate with a load-bearing reason?** Offer an ADR
- **Want to explore alternative interfaces?** Iterate on designs

## Architecture Vocabulary

Use these terms consistently in every suggestion:

| Term | Definition |
|------|-----------|
| **Module** | A unit of code with an interface and implementation |
| **Interface** | The public surface — functions, types, exports |
| **Depth** | Ratio of implementation complexity to interface complexity |
| **Seam** | A place where you can change behavior without changing the module |
| **Adapter** | A module that translates one interface to another |
| **Leverage** | How much behavior you get per line of interface code |
| **Locality** | How much of a change stays within one module |

### Principles

- **The deletion test**: Would deleting this module concentrate complexity elsewhere? If yes, it's a good deep module
- **The interface is the test surface**: If testing requires reaching through the interface, the module is shallow
- **One adapter = hypothetical seam, two = real**: A single adapter for a concept is speculative; a second implementation validates the abstraction
