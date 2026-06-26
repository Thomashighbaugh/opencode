---
name: redesign-existing-projects
description: Audit and upgrade existing websites and apps to premium design standards without breaking functionality. Use when redesigning an existing UI — identifies generic AI patterns (overused gradients, Lucide icons, centered card columns) and applies high-end alternatives. Works with any CSS framework.
---

# Redesign Skill

## How This Works

When applied to an existing project, follow this sequence:

1. **Scan** — Read the codebase. Identify the framework, styling method (Tailwind, vanilla CSS, styled-components, etc.), and current design patterns.
2. **Diagnose** — Run through the audit below. List every generic pattern, weak point, and missing state you find.
3. **Fix** — Apply targeted upgrades working with the existing stack. Do not rewrite from scratch. Improve what's there.

## Design Audit

### Typography
- **Browser default fonts or Inter everywhere** → Replace with Geist, Outfit, Cabinet Grotesk, or Satoshi
- **Headlines lack presence** → Increase size, tighten letter-spacing, reduce line-height
- **Body text too wide** → Limit to ~65 characters per line
- **Only Regular/Bold weights** → Add Medium (500) and SemiBold (600)
- **Missing letter-spacing** → Negative tracking for large headers, positive for small caps
- **Orphaned words** → Fix with `text-wrap: balance` or `text-wrap: pretty`

### Color and Surfaces
- **Pure `#000000` background** → Replace with off-black (`#0a0a0a`, `#121212`)
- **Oversaturated accent colors** → Keep saturation below 80%
- **More than one accent color** → Pick one, remove the rest
- **Mixing warm and cool grays** → Stick to one gray family
- **Purple/blue "AI gradient"** → Replace with neutral bases and a single considered accent
- **Flat design with zero texture** → Add subtle noise, grain, or micro-patterns
- **Inconsistent lighting direction** → All shadows suggest a single light source

### Layout
- **Everything centered and symmetrical** → Break symmetry with offset margins
- **Three equal card columns** → Replace with 2-column zig-zag, asymmetric grid, or masonry
- **Using `height: 100vh`** → Replace with `min-height: 100dvh`
- **Cards of equal height forced by flexbox** → Allow variable heights or use masonry
- **No max-width container** → Add constraint (1200-1440px) with auto margins
- **Missing whitespace** → Double the spacing

### Interactivity and States
- **No hover states** → Add background shift, slight scale, or translate
- **No active/pressed feedback** → Add `scale(0.98)` on press
- **Instant transitions** → Add 200-300ms transitions to interactive elements
- **No loading states** → Replace spinners with skeleton loaders
- **No empty states** → Design a composed "getting started" view
- **No error states** → Add clear inline error messages for forms
- **No focus ring** → Ensure visible focus indicators for keyboard nav

### Component Patterns to Avoid
- Generic card (border + shadow + white background)
- Pill-shaped "New" and "Beta" badges
- Accordion FAQ sections
- 3-card carousel testimonials with dots
- Pricing table with 3 equal towers
- Modals for everything
- Lucide or Feather icons exclusively

## Upgrade Techniques

### Typography Upgrades
- Variable font animation on scroll or hover
- Outlined-to-fill transitions on scroll entry
- Text mask reveals — typography as window to video/imagery

### Layout Upgrades
- Broken grid / asymmetry — elements deliberately ignoring column structure
- Whitespace maximization — aggressive use of negative space
- Parallax card stacks — sections that stick and stack over scroll
- Split-screen scroll — two halves sliding in opposite directions

### Motion Upgrades
- Smooth scroll with inertia
- Staggered entry — elements cascade in with delays
- Spring physics — replace linear easing
- Scroll-driven reveals — content entering through expanding masks or wipes

### Surface Upgrades
- True glassmorphism with inner border and inner shadow
- Spotlight borders that illuminate under cursor
- Grain and noise overlays
- Colored, tinted shadows carrying the background hue

## Fix Priority

Apply in this order for maximum visual impact with minimum risk:

1. **Font swap** — biggest instant improvement, lowest risk
2. **Color palette cleanup** — remove clashing or oversaturated colors
3. **Hover and active states** — makes the interface feel alive
4. **Layout and spacing** — proper grid, max-width, consistent padding
5. **Replace generic components** — swap cliche patterns for modern alternatives
6. **Add loading, empty, and error states** — makes it feel finished
7. **Polish typography scale and spacing** — the premium final touch

## Rules

- Work with the existing tech stack. Do not migrate frameworks or styling libraries.
- Do not break existing functionality. Test after every change.
- Before importing any new library, check the project's dependency file first.
- Keep changes reviewable and focused. Small, targeted improvements over big rewrites.
