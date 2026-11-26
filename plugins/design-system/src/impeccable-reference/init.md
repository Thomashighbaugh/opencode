# init — Capture durable product context (PRODUCT.md + DESIGN.md)

Capture durable product context AND the design system. DESIGN.md is the primary deliverable (the actual styling); PRODUCT.md is secondary context. Do NOT invent; derive from the codebase and the user's stated brief.

## Required steps

1. Read existing PRODUCT.md and DESIGN.md directly from the project root (if present). There is no external context binary.
2. **Examine the codebase before writing anything.** Gather evidence:
   - Find style sources: CSS/SCSS/Sass/Less files, theme files, token files, tailwind config, design-token JSON, styled-components, CSS-in-JS.
   - Read them. Extract: color palette (hex/rgb/hsl/custom properties), typography (font families, scale, weights), spacing scale, radii, shadows, breakpoints, component patterns, motion/animation.
   - Identify the product: name, purpose, primary user action, mode (Persuade/Operate/Read/Experience).
   - Note constraints: preserved behaviors, untouched accents, accessibility requirements, platform (web/ios/android).
   - Check for an existing PRODUCT.md / DESIGN.md and read them if present.
3. Write PRODUCT.md at the project root with: product identity, mode, design directive, constraints (labeled), labeled assumptions where evidence is thin, and an implementation summary referencing the actual files found.
4. If a DESIGN.md does not exist, also generate one from the found styling (or direct the user to run `design-system document`). Prefer generating it now from evidence.
5. After writing, resume without rerunning context loading.

## Output

DESIGN.md is the primary deliverable (the real styling, sourced from code). PRODUCT.md is secondary context. Always generate DESIGN.md when styling evidence exists. Never leave either file as pure inference without labeling assumptions.
