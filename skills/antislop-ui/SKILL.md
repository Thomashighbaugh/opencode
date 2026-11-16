---
name: antislop-ui
description: UI and visual slop filter — color, layout, components, decoration, motion, structure, performance
level: 3
license: MIT
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# antislop-ui — UI & Visual Slop Filter

Load this skill when the AI builds or restyles anything you can see: color, layout, cards, buttons, motion, structure, performance. Sized media and load priority are built in.

The core antislop rules (`rules/antislop.md`) always apply first. This skill adds depth to them; it references the core rules by number and never duplicates them.

## What it covers

| Area | Core rules |
|------|------------|
| Visual & Color | R-01 color/gradients purpose-gate, R-29 palette (2–3 core + 1 accent max), R-10 glassmorphism dose cap, R-13 glow dose cap, R-12 shadow elevation |
| Layout & Components | R-05 layout/page structure (no AI templates), R-11 border radius (no pill-everything), R-14 feature cards (variation, not identical) |
| Decorative Elements | R-04 icons (relevant, not Lucide-default), R-08 button arrows, R-09 badges (functional only), R-22 illustrations (real connection or none) |
| Structural & Flow | R-05 section composition variety, R-31 every decision needs a written one-line reason |
| Motion | R-19 animations (clear UX purpose, matches MOTION dial), R-39 non-essential motion stops under `prefers-reduced-motion` |
| Performance | R-40 sized media, eager hero image, no render-blocking script, no unmeasured numbers |
| Page Basics | R-35 click-through smoke test evidence |

## Pattern table — name it, reject it unless purpose-stated

| Pattern | Telltale signs | Rule |
|---------|---------------|------|
| Generic Blue-Purple Gradient | blue→purple, blue→cyan, purple→pink full-page glow | R-01 |
| Excessive Glassmorphism | blur on navbar+cards+modals+sidebar at once | R-10 |
| Excessive Border Radius | every element pill-shaped | R-11 |
| Overly Soft Shadows | every component floating with a large shadow | R-12 |
| Glow Everywhere | glow on card+button+badge+icon+background+border | R-13 |
| AI Default Palette | harsh/rainbow gradients, purple-black, neon, radial orbs | R-01 |
| Background Grid | grid squares, blueprint lines, dot grids | R-07 |
| Too Much Decoration / Trend-Stacking | blob+mesh+glow+noise+pattern+grid stacked | R-01, R-07 |
| Dark Mode Default for No Reason | entire page dark just because "tech" | R-21 |
| Too Many Colors in Palette | 5–7 colors without a design system | R-29 |
| Excessive Accent Color | one accent on buttons, icons, badges, links, lines, glows | R-01, R-29 |
| Sterile Default | flat white, thin grey borders, no texture, generic font | R-20, R-31 |
| Monotonous Layout | Hero, subtitle, 2 CTAs, screenshot, feature grid, testimonials, FAQ, CTA, footer | R-05 |
| Copy-Paste Feature Cards | identical size/icon/layout/padding across all cards | R-14 |
| Bento Grid | mosaic of differently-sized cards as default layout | R-05 |
| Fake Terminal Window | styled terminal with typed commands as hero/feature | R-05 |
| Uniform Spacing | identical padding/margin/gap across every section | R-05 |
| Template Animations | every element Fade Up + Floating + Scale + Bounce | R-19 |
| "How It Works" Always 3 Steps | round icon + number 1,2,3 + short text, always three | R-05 |
| "Trusted By" Logo Bar | generic company logos below hero | R-05 |
| "Most Popular" Pricing Card | middle tier highlighted with capsule badge | R-05, R-09 |
| 3 Pricing Tiers | always three columns whatever the real structure | R-05 |
| 4-Column Template Footer | Product/Company/Resources/Legal, no variation | R-05 |
| Uniform Section Rhythm | every section centered title+subtitle+identical card grid | R-05 |
| Generic AI Icons | sparkle, star, magic, lightning, diamond, cube, robot | R-04 |
| Lucide Icons | every icon from the same thin-stroke rounded library | R-04 |
| Colored Left Stripe | thin colored bar on left edge of cards/rows/headers | R-01 |
| Small Arrows | →/↗ on almost every button as decoration | R-08 |
| AI Capsule Badges | pill, thin border, glow, dot, uppercase: "AI Powered"/"Beta"/"New" | R-09 |
| Eyebrow Badge | pill above H1 with dot and thin border | R-09 |
| Generic AI Typography | large monospace headings, uppercase wide tracking | R-06 |
| Generic Illustrations | Undraw/Storyset/3D blobs with no product connection | R-22 |
| Non-Functional Interactive Elements | buttons do nothing, dropdowns won't open, forms can't submit | R-26 |
| Happy Path Only Design | no empty/loading/error state | R-27 |
| Demo Without a Product | sells a product never shown working | R-38 |
| Unsized Media | img/video/iframe without width/height, shifting layout | R-40 |
| Hero Image Lazy-Loaded | hero image not `fetchpriority="high"` or not `` in HTML | R-40 |

## Livlieness dials (set explicitly, per rules/antislop-liveliness.md)

Before generating UI, declare:

> Reading this as: `<page kind>` for `<audience>`, in a `<visual language>` style, dial `<ENERGY/RHYTHM/MOTION>`.

Dial anchors:
- ENERGY: 1 Linear/GOV.UK · 2 Stripe/Vercel · 3 Awwwards/agency
- RHYTHM: 1 uniform grid · 2 consistent with breaks · 3 asymmetric
- MOTION: 1 hover only · 2 scroll-reveal/transitions · 3 parallax/pin/choreography

## Delivery Gate (pre-ship)

Run R-35 click-through: exercise every interactive element one at a time, record per-element result. A PASS claim without the recorded list is not a PASS. Exercise every theme and mobile breakpoint during click-through.
