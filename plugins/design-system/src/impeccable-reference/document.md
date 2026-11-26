# document — Generate DESIGN.md from existing project code

Generate a DESIGN.md that reflects the project's actual styling, derived from code — not invented.

## Required steps

1. Examine the codebase:
   - Find all style sources (CSS/SCSS, theme files, tokens, tailwind config, styled-components).
   - Extract the real palette (custom properties, hex values), typography (fonts, scale, weights), spacing, radii, shadows, breakpoints, motion.
   - Identify component patterns and layout conventions.
2. Write DESIGN.md at the project root capturing: visual direction, color strategy, typography approach, spacing/rhythm, component patterns, motion, constraints. Cite the source files.
3. If PRODUCT.md is missing, also create it (or direct to `design-system init`).
4. Do not invent values; only record what the code contains. Label anything inferred.

## Output

A DESIGN.md grounded in the actual codebase, with source references.
