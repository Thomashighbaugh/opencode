# Relearning Flow — OpenCode Skills for AI-Assisted Content Creation

> **Source:** https://github.com/kedbin/relearning-flow
> **Fetched:** 2026-07-02
> **Type:** Public open-source repository (Apache-2.0)
> **Stars:** 3 | **Forks:** 0 | **Commits:** 1

## Summary

A modular skill system for OpenCode that powers an end-to-end content pipeline from idea to published audio narration. Created by kedbin, it applies enterprise-grade engineering discipline to personal knowledge content — reframing human problems (sleep, focus, decision-making) as systems engineering problems.

## Pipeline Overview

```
[Content Idea] → [Research & Draft] → [Fact-Check] → [Audio Script] → [TTS Generation] → [Published]
```

The system uses a **two-step audio pipeline** for high-quality voiceovers:
1. `create-script` skill — LLM-powered condensation (~50% reduction) + paralinguistic tags
2. `voiceover` skill — Chatterbox TTS generation with voice cloning

## Skills (3)

| Skill | Purpose |
|-------|---------|
| **relearning-content** | Creates journal entries with "Fallacy → Model → Protocol" structure |
| **create-script** | Condenses content ~50% and adds paralinguistic tags for natural speech |
| **voiceover** | Generates audio using Chatterbox TTS with voice cloning |

## Agents (1)

| Agent | Purpose |
|-------|---------|
| **google-search** | Research subagent for fact-checking, finding sources, and drafting content |

## Key Architectural Decisions

### Two-Step Audio Pipeline (Why not basic TTS?)

| What | `--transform` flag | `create-script` skill |
|------|-------------------|----------------------|
| Method | Regex/rules-based | LLM intelligence |
| Condensation | None | ~50% reduction |
| Paralinguistic tags | None | `[chuckle]`, `[sigh]`, etc. |
| Conversational rewrite | Basic cleanup | Full rewrite for speech |
| Result | 10-min article → 10-min audio | 10-min article → 5-min audio |

### Single Subagent Pattern

Only ONE subagent type is typically needed: `google-search` for fact-checking. The system avoids spawning subagents for style reference (guide is in SKILL.md), file scanning, or audio generation.

### Paralinguistic Tags (Chatterbox TTS)

| Tag | When to Use | Example |
|-----|-------------|---------|
| `[chuckle]` | Self-deprecating humor, light irony | "I spent three weeks on that. [chuckle] Classic." |
| `[sigh]` | Frustration, resignation, relief | "[sigh] And that's when I realized I was wrong." |
| `[laugh]` | Genuine amusement, absurdity | "Thirty-five thousand decisions a day! [laugh]" |
| `[gasp]` | Surprise, sudden realization | "[gasp] That's it. That's the answer." |
| `[clear throat]` | Topic transition, emphasis | "[clear throat] Here's the thing." |
| `[sniff]` | Emotional reflection | "Looking back now... [sniff] it was obvious." |
| `[groan]` | Bad news, frustration | "[groan] Another meeting about meetings." |

**NEVER USE:** `[pause]`, `[breath]`, `[emphasis]`, `[slower]` — Chatterbox ignores these.

## Content Voice & Style

- **Titles:** "The [Technical Noun]: [Subtitle]" (e.g., "The Asymptote of Effort")
- **Metaphors:** Decision fatigue → Memory leak, Habits → Cached functions
- **Structure:** Fallacy → Model → Protocol
- **Endings:** Memorable one-liners ("Stop calculating. Start retrieving.")

## Dependencies

- **voiceover skill:** Python with torch, torchaudio, chatterbox, pydub, ffmpeg
- **create-script skill:** No external dependencies (LLM-powered)
- **google-search agent:** Requires web search MCP tools

## File System Layout

```
~/.opencode/skill/
├── relearning-content/SKILL.md    # Main skill (v3.0)
├── create-script/SKILL.md         # LLM condensation + tags (v5.0)
└── voiceover/SKILL.md             # TTS generation (v8.0)

~/projects/your-site/
├── src/content/
│   ├── config.ts                  # Zod schema
│   ├── journal/entry-XXX.md       # Journal entries
│   └── projects/*.md              # Project pages
├── public/audio/*.mp3             # Deployed audio files
└── docs/ARCHITECTURE.md           # Architecture docs

~/projects/chatterbox/
├── archive/
│   ├── voiceover_script.py        # TTS script
│   ├── entry-XXX.txt              # Condensed scripts
│   └── entry-XXX.mp3              # Generated audio
├── clone.wav                      # Voice reference
└── voiceover.log                  # Runtime log
```

## Token Budget

| Operation | Tokens | Notes |
|-----------|--------|-------|
| Load relearning-content skill | ~15,000 | Includes style guide |
| Fact-check (google-search subagent) | ~10,000 | Isolated context |
| create-script (main thread) | ~5,000 | LLM transformation |
| voiceover (bash command) | ~500 | Just command execution |
| **Total main context** | ~20,500 | Efficient use of context |

## Relevance to OpenCode Hubs

- **Skill composition pattern** — three skills chained into a pipeline (content → script → audio) is a good example of skill-to-skill delegation
- **Single subagent optimization** — only `google-search` subagent is used, demonstrating minimal subagent dispatch for API efficiency
- **Paralinguistic tag system** — structured markup for TTS output, relevant if we ever build audio narration skills
- **Engineering voice for content** — reframing human problems as systems problems is a distinctive content style worth noting

## Source

- Repository: https://github.com/kedbin/relearning-flow
- License: Apache-2.0
- Built with: OpenCode, Chatterbox TTS (resemble-ai/chatterbox)