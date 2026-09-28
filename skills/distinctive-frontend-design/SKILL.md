---
name: distinctive-frontend-design
description: Build production-grade frontend interfaces with a bold, intentional aesthetic that avoids generic "AI slop" — distinctive typography, cohesive color, high-impact motion, unexpected layout. Use when asked to build web components, pages, or applications where visual quality matters, not just functional correctness.
level: 2
license: MIT
---

# Distinctive Frontend Design

Generic interfaces erode trust — the difference between a forgettable and a memorable one is intentionality in every detail: font choice, spacing rhythm, color harmony, animation timing. Merges the OpenCode "designer" and "frontend-design" agents, which were near-duplicates of each other.

## Before writing any code: commit to a direction

Answer these first, and write the answer down before touching a file:

- **Purpose**: what problem does this interface solve, for whom?
- **Tone**: pick an extreme — brutally minimal, maximalist chaos, retro-futuristic, organic, luxury/refined, playful, editorial/magazine, brutalist, art deco, soft/pastel, industrial. Bold maximalism and refined minimalism both work; the failure mode is a *timid middle*, not a strong choice at either end.
- **Constraints**: the actual technical requirements (framework, performance, accessibility).
- **Differentiation**: the one thing someone will remember about this interface.

Then: detect the frontend framework from `package.json` and study the existing codebase's component structure, styling approach, and font imports before writing anything — new code should look like the team wrote it, inside a bolder aesthetic envelope.

## Execution guidelines

- **Typography**: distinctive, characterful fonts. Never Arial, Inter, Roboto, system fonts, or Space Grotesk. Pair a distinctive display font with a refined body font.
- **Color**: commit to a cohesive palette via CSS variables — dominant colors with sharp accents outperform timid, evenly-distributed ones. Avoid purple gradients on white; it's the single most recognizable AI-generated tell.
- **Motion**: prioritize CSS-only where possible; use a proper animation library (e.g. Motion for React) when available. One well-orchestrated page-load with staggered reveals beats scattered micro-interactions.
- **Layout**: unexpected composition — asymmetry, overlap, diagonal flow, grid-breaking elements, deliberate negative space or controlled density.
- **Atmosphere**: gradient meshes, noise textures, geometric patterns, layered transparency, dramatic shadows, grain overlays — depth instead of a flat solid background.
- Match implementation complexity to the chosen direction: maximalist calls for elaborate code; minimalist calls for restraint and precision, not less effort.
- Vary choices across generations — converging on the same "safe" font/palette/layout every time defeats the point of this skill.

## Output format

```
## Design Implementation

**Aesthetic Direction**: [tone + what makes it unforgettable]
**Framework**: [detected]

### Components Created/Modified
- `path/Component.tsx` — [what it does, key design decisions]

### Design Choices
- Typography: [...]   Color: [...]   Motion: [...]   Layout: [...]   Atmosphere: [...]

### Verification
- Renders without errors: [y/n]   Responsive: [breakpoints tested]   Accessible: [ARIA, keyboard nav]
```

## Rules

- No scope creep — complete what was asked, nothing more.
- Verify it actually renders before calling it done; a UI change that hasn't been checked isn't finished.
- Never: overused fonts, purple-gradient-on-white, a layout that looks like every other AI-generated page, holding back to the safe default when a bold choice was called for.

## Related

- `redesign-existing-projects` — for auditing/upgrading an *existing* UI's design, as opposed to this skill's from-scratch build
- `design-system-starter` — for building the underlying token/component system this skill's output should draw from, when one doesn't exist yet
- `mui` — framework-specific patterns when the detected stack is Material-UI
