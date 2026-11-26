---
name: antislop-liveliness
description: Positive liveliness requirements (ENERGY/RHYTHM/MOTION dials) that complement the anti-slop filter.
---

# Anti-slop Liveliness Toolkit

**Scope:** Positive requirements for adding energy after slop is removed. A filter removes slop; it cannot add energy. Removing slop leaves a void the model fills with its most generic output. Liveliness must be added deliberately.

**Source:** dials derived from `DESIGN.md` or a Design Read; held from the first section to the last.

---

## Three Dials (required)

Every design sets three dials explicitly. Three levels each — binary-enforceable, not a continuous uncheckable scale.

| Dial | 1 (Calm) | 2 (Balanced) | 3 (Bold) | What it answers |
|------|----------|--------------|----------|-----------------|
| **ENERGY** | Linear, GOV.UK | Stripe, Vercel | Awwwards, agency portfolio | How hard does this design say hello? |
| **RHYTHM** | Uniform grid, predictable | Consistent with a few breaks | Asymmetric, mixed compositions | How much do sections change from each other? |
| **MOTION** | Hover states only | Scroll-reveal, transitions | Parallax, pin, choreography | How much motion, and why? |

The anchors (Linear, GOV.UK, Stripe, Vercel, Awwwards) are taste references for judging a value, not things to imitate.

**Example sets:** designer portfolio sets ENERGY 3, RHYTHM 3, MOTION 2. Public-service site sets ENERGY 1, RHYTHM 1, MOTION 1.

## Design Read (how the dials are set)

Before generating, declare one line:

> Reading this as: `<page kind>` for `<audience>`, in a `<visual language>` style, dial `<ENERGY/RHYTHM/MOTION>`.

## Levers (how the dials become visual decisions)

Tools for hitting dial values, not bans:

- **One focal point per screen**: exactly one element clearly most important; the rest defer to it.
- **Hierarchical contrast**: size, weight, color differentiated on purpose, not randomly.
- **Whitespace as structure**: empty space separates and sets rhythm, not leftover space.
- **One deliberate accent**: one color or gesture used sparingly at the key moment. Zero accents is sterile; an accent everywhere is slop.
- **Identity motif**: one pattern, gesture, or typographic voice specific and repeated, making the design "belong" to the product.

## Draft-without-direction rule

When no `DESIGN.md` exists and direction cannot be obtained:

- Label the output *"draft without direction"*.
- Use honest default dials **ENERGY 1 / RHYTHM 1 / MOTION 1**.
- Never silently fall back to a neutral sterile default.
- The result is a draft, not a shippable deliverable.
