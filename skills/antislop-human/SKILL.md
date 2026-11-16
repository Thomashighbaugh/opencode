---
name: antislop-human
description: Accessibility slop filter — contrast, keyboard, focus, states, interaction affordances, WCAG 2.2
level: 3
license: MIT
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# antislop-human — Accessibility & People Slop Filter

Load this skill when real people have to use the result: readable colors, keyboard use, visible focus, button states, interaction affordances, WCAG 2.2 references, contrast checking.

The core antislop rules (`rules/antislop.md`) always apply first. This skill adds depth; it references the core rules by number and never duplicates them.

## What it covers

| Area | Core rules |
|------|------------|
| Color & Contrast | R-25 WCAG AA (4.5:1 normal / 3:1 large), no grey-on-grey, no white-on-light-gradient |
| Keyboard | R-32 Tab/Shift+Tab, Enter/Space, Escape, visible focus indicator |
| Focus & States | R-39 hover/active/disabled states, cursor: pointer/not-allowed |
| Zoom & Mobile Use | R-03 mobile, R-39 viewport meta no user-scalable=no |
| Interaction Affordances | R-39 semantics, names, labels, alt text, aria-hidden on icons |

## Pattern table — name it, reject it

| Pattern | Telltale signs | Rule |
|---------|---------------|------|
| Low-Contrast Text | grey text on grey background | R-25 |
| Text Over Photo/Gradient | white text on gradient light in some areas | R-25 |
| Grey-on-Grey Hallucination | any low-contrast pairing | R-25 |
| Removed Focus Outline | `outline: none` without replacement | R-32 |
| Mouse-Only Patterns | interactive elements not reachable by Tab | R-32 |
| Broken Tab Order | Tab not following visual order | R-32 |
| Weak/Invisible Focus | no visible focus indicator | R-32 |
| Color-Only Feedback | state communicated by color alone | R-39 |
| Missing UI States | no hover/active/disabled states | R-39 |
| Clickable div/span | non-native interactive element | R-39 |
| Icon-only button without name | no aria-label or visually hidden text | R-39 |
| Image without alt | missing `alt` attribute | R-39 |
| Form field without label | no visible `<label>` | R-39 |
| Motion ignoring prefers-reduced-motion | no pause control for >5s motion | R-39 |
| viewport user-scalable=no | `maximum-scale=1` or `user-scalable=no` | R-39 |

## Contrast checker

WCAG AA minimum: normal text 4.5:1, large text (18px+) 3:1. Test contrast across the entire area the text passes over, not at a single point.

## Keyboard requirements

- Tab and Shift+Tab navigate logically following visual order.
- Buttons and links activatable with Enter or Space.
- Dialogs and modals closable with Escape.
- Every focused element has a clearly visible focus indicator.
- Never use `outline: none` or `outline: 0` without a better custom focus indicator.

## Interaction affordances

- Every enabled interactive element shows `cursor: pointer` (set once in base CSS layer); disabled controls show `cursor: not-allowed`.
- Actions are `<button>`, navigation is `<a href>` to a real destination; no clickable `div`/`span`.
- Every control has an accessible name; every image has `alt` (empty `alt=""` when decorative); every form field has a visible `<label>`.
- Distinct hover, active, disabled states — never color alone.
- Non-essential motion stops under `prefers-reduced-motion: reduce`; anything moving longer than 5 seconds has a pause control.
- ARIA must not contradict the native role.
- Whole HTML document: `<html lang>`, unique `<title>`, landmarks (`header`, `nav`, `main`, `footer`), one `h1`, no skipped heading levels.
