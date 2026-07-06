---
title: "lit-search-cite — Multi-Source Academic Literature Search & Citation Skill"
type: source-summary
tags: [opencode, claude-code, skill, academic, literature-search, cnki, pubmed, arxiv, citation]
created: 2026-07-05
updated: 2026-07-05
sources: [npm-registry, github-readme]
status: active
---

# lit-search-cite

Multi-source academic literature search, journal ranking query, auto-citation annotation, and PDF download skill for AI coding assistants.

- **Package**: `lit-search-cite` on npm
- **Repository**: [luffysolution-svg/lit-search-cite](https://github.com/luffysolution-svg/lit-search-cite)
- **License**: MIT
- **Latest Version**: 1.0.23
- **Platforms**: Claude Code, Claude Desktop, OpenCode, Codex, Hermes

## Quick Install

```bash
npx lit-search-cite@latest                    # Auto-detect all platforms (recommended)
npx lit-search-cite --opencode                # OpenCode only
npx lit-search-cite --claude                  # Claude Code / Claude Desktop only
npx lit-search-cite --codex                   # Codex only
npx lit-search-cite --agents                  # Agent Skills (.agents)
npx lit-search-cite --target ~/my-skills      # Custom path
```

Each install clears the old directory first then writes — safe to re-run. Installed contents: `SKILL.md`, `AGENTS.md`, `scripts/`, `references/`.

## Supported Literature Sources

| Source | Scale | Cost |
|--------|-------|------|
| OpenAlex | 250M papers | Free |
| CrossRef | 150M papers | Free |
| PubMed | 36M papers | Free |
| arXiv | 2M+ papers | Free |
| Semantic Scholar | 214M papers | Free Key |
| Google Scholar | — | ai4scholar MCP Key |
| CNKI (China National Knowledge Infrastructure) | — | OpenCLI (browser login state, zero extra config) |
| Wanfang Data | — | API Key |
| Baidu Scholar / VIP | — | Browser URL |
| Elsevier Scopus | 78M papers | Institutional access |
| Springer Nature OA | — | Free Key |

## Capabilities

| Feature | Details |
|---------|---------|
| **Literature Search** | OpenAlex, CrossRef, PubMed, arXiv (zero config); Semantic Scholar, Google Scholar (ai4scholar MCP); CNKI (OpenCLI, reuse browser login); Wanfang (API Key) |
| **Journal Ranking** | OneScholar online API (IF / JCR / CAS / CiteScore) + 300+ journal offline database (no API key needed) |
| **PDF Download** | scansci-pdf MCP (13+ sources: Springer Direct, Elsevier API, OA repositories, Sci-Hub); paywall fallback: OpenCLI (zero extra config, reuses institutional login — Wiley tested 6.2MB real PDF) |
| **Citation Formatting** | GB/T 7714, APA, IEEE, MLA, Chicago, Nature, Vancouver |
| **Review Writing** | Multi-round search + paper clustering + structured draft |

## Scripts

| Script | Platform | Description |
|--------|----------|-------------|
| `multi-search.py` | Cross-platform | One-click multi-source search (OpenAlex/CrossRef/PubMed/arXiv) + DOI dedup + journal ranking |
| `multi-search.ps1` | Windows | Same as above, PowerShell version |
| `journal-rank.py` | Cross-platform | OneScholar API journal ranking query (requires API key) |
| `journal-rank.ps1` | Windows | Same, PowerShell version with ISSN query support |
| `pdf-fetch.py` | Cross-platform | PDF download fallback chain (DOI input: Unpaywall → OpenAlex → EuropePMC) |
| `pdf-fetch.ps1` | Windows | Same, PowerShell version |
| `cnki-search.ps1` | Windows | Wanfang API + CNKI/Baidu Scholar/VIP browser URL generation |
| `check-deps.ps1` | Windows | Dependency check |
| `setup.ps1` | Windows | API Key configuration wizard |

## MCP Configuration

See `references/mcp-template.md`. Three configuration levels:

| Level | MCP | Use Case |
|-------|-----|----------|
| Minimal | scansci-pdf | OA PDF download only |
| Recommended | ai4scholar + scansci-pdf | Full-featured search + multi-source download |
| Full | ai4scholar + scansci-pdf | Same (paywall fallback via OpenCLI CLI, not MCP) |

## Platform Support

Claude Code · Claude Desktop · OpenCode · Codex · Hermes
