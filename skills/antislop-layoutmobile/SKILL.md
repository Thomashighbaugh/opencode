---
name: antislop-layoutmobile
description: Mobile/responsive slop filter — breakpoints, scale, grids, overflow, tap targets, mobile navigation
level: 3
license: MIT
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# antislop-layoutmobile — Mobile & Responsive Slop Filter

Load this skill when the same page has to work on a phone and on a desktop: reflow across screen widths, breakpoints, grids, overflow, tap targets, mobile navigation.

The core antislop rules (`rules/antislop.md`) always apply first. This skill adds depth; it references the core rules by number and never duplicates them.

## What it covers

| Area | Core rules |
|------|------------|
| Breakpoints | R-03 mobile responsiveness, R-05 layout structure |
| Scale & Sizing | R-03 44px tap targets, R-06 typography readability |
| Grids & Stacking | R-05 no bento-grid default, R-29 palette consistency |
| Overflow | R-03 no horizontal overflow, R-03 no clipping |
| Tap Targets | R-03 44px minimum, R-39 cursor states |
| Mobile Navigation | R-24 real nav destinations, R-32 keyboard |

## Pattern table — name it, reject it

| Pattern | Telltale signs | Rule |
|---------|---------------|------|
| Desktop-Only Layout | desktop design squeezed onto phone | R-03 |
| Breakpoint Driven by Device List | breakpoints keyed to device names, not content | R-03 |
| Mobile Styled Last | mobile treated as an afterthought | R-03 |
| Two-State Layout | only desktop and mobile, nothing in between | R-03 |
| Desktop-Sized Everything | fixed pixel type, 100vh sections, huge padding | R-03, R-06 |
| Columns That Don't Collapse | fixed-width grid, forced 12-column | R-03 |
| Fixed-Width Grid | grid that doesn't reflow | R-03 |
| Horizontal Scroll Leak | content overflows the viewport | R-03 |
| Overflow Hidden Clipping | content clipped at edges | R-03 |
| Fixed-Width Children | children wider than container | R-03 |
| Under-Sized Tap Targets | buttons smaller than 44px | R-03 |
| Targets Too Close | tap targets crowding each other | R-03 |
| Hover-Only Interactions | controls that only work on hover | R-32, R-39 |
| Nav That Stays Desktop | desktop navbar on mobile | R-24, R-03 |
| The Bare Hamburger | hamburger with no real mobile structure | R-03 |
| Bottom Nav That Eats Content | bottom nav covering content | R-03 |
| Sticky Nav Steals the Screen | sticky nav consuming viewport | R-03 |

## Mobile requirements

- No horizontal overflow.
- Text does not escape its container.
- Cards do not collide or clip off-screen.
- Navbar remains comfortable to use.
- Button sizes meet the 44px minimum tap target.
- Spacing stays consistent across all breakpoints.
- Mobile layout is part of the design, not an add-on (R-03).
