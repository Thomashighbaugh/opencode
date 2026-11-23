import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "taste",
  description: "Run tasteskill gate checks against the current frontend",
  reminder: "Runs the taste-skill finish gate (consistency + layout + copy-lint).",
  inline: true,

  detailedDescription: `Runs the taste-skill finish gate against the current page/build: consistency.mjs at 1440x390 widths, assets/layout check at 1440x900x390x844, copy-lint, and kit-edited/checker-gaming static checks. Requires Node 22+ and Chrome/Edge/Chromium.

Usage:
  /design-hub taste [<page.html | url>] [--root <dist>] [--kind <kind>] [--category <what is sold>] [--primary <main action>]

With no page argument, it checks DESIGN.md presence first: if DESIGN.md exists it reads the declared page type / site kind / category from the file; otherwise it falls back to index.html or the only .html in the folder. Results print as FAIL/WARN/PASS lines; GATE: FAIL blocks delivery until fixed or waived in .taste-skill/waivers.json.

The skill itself lives at skills/taste-skill/ (linked from github.com/Leonxlnx/taste-skill). Nothing is installed into the project — the gate runs from the global skill folder. It needs no API keys; bundled Wikimedia Commons photographs work offline. Chrome/Edge/Chromium must be installed (set CHROME_PATH if non-standard). ffmpeg is optional (WebP output, hero phone crop).

## Examples

| Input | Approach |
|-------|----------|
| /design-hub taste | Checks DESIGN.md if present, else index.html; runs full gate |
| /design-hub taste https://localhost:5173 | Checks a dev server URL |
| /design-hub taste dist/index.html --root dist | Checks a built site |

## Warnings

- The gate blocks on fixable FAILs. A build may not end while FAILs remain.
- Only local pages are checked: a file, or a URL on localhost / *.localhost / *.test.
- kit-edited and checker-gaming findings cannot be waived.

`,
  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["taste-skill"],
}

export default spec
