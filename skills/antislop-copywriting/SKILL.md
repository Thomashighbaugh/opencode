---
name: antislop-copywriting
description: Copy and text slop filter — headlines, CTAs, tone, fake stats, anti-AI writing, markdown hygiene
level: 3
license: MIT
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# antislop-copywriting — Copy & Text Slop Filter

Load this skill when the AI writes or edits text: headlines, buttons, CTAs, value propositions, tone, landing-page text, product prose, emails.

The core antislop rules (`rules/antislop.md`) always apply first. This skill adds depth; it references the core rules by number and never duplicates them.

## What it covers

| Area | Core rules |
|------|------------|
| Tone & Voice | R-02 em-dash ban, R-16 buzzword ban, R-36 no fabricated claims |
| Rhythm & Structure | R-31 one-line reason per decision, R-16 no AI marketing language |
| Honesty & Evidence | R-17 no fabricated numbers, R-18 no fake testimonials, R-36 no unverified claims |
| Hygiene & Markdown | R-02 em-dash, plain text structure |

## Pattern table — name it, reject it unless purpose-stated

| Pattern | Telltale signs | Rule |
|---------|---------------|------|
| Em Dash (—) | "Fast, secure — and built for developers." | R-02 |
| Generic CTAs | Get Started, Learn More, Try Now, Explore, Discover | R-15 |
| AI Marketing Buzzwords | AI Powered, Revolutionary, Next Generation, Seamless, Cutting Edge | R-16 |
| Fake Statistics | 10K+ Users, 99.9% Uptime, 500M Requests, 120+ Countries | R-17 |
| Fake Testimonials | AI avatars, random names, random job titles, fictional reviews | R-18 |
| Fabricated Trust Claims | "SOC 2 compliant", "ISO 27001", "Enterprise-grade", "300% faster" without evidence | R-36 |
| Empty Claims & Social Proof | significance inflation, weasel attributions, persuasive authority tropes | R-16, R-36 |
| Chatbot Closers | "I hope this helps!", "Let me know if..." | R-36 (tone) |
| Fake-Candid Openers | "Here's what gets me..." manufactured persona | R-36 |
| Signposting Announcements | "In this post we'll cover..." meta-talk | R-16 |
| Temporal Runway Clichés | "the future of", "a new era of", "dawn of" | R-16 |

## Honesty requirements

- Any statistic presented as fact must be real and verifiable, or not shown at all (R-17).
- Any testimonial must use real names/titles or not exist (R-18).
- Any security/compliance/performance claim must have real evidence (R-36).
- Show evidence, not claims.

## Em dash carve-out

Rule documentation headings (`R-XX — Title`) and this skill's own em-dash example are exempt from R-02. UI/copy text is not.
