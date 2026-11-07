import { HubSubcommandSpec } from "../../hub-data"

import { RULES_CONTEXT_STRATEGY } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "yt-transcript",
  description: "Fetch a YouTube transcript with tgrab and file it in context",
  reminder: "Fetch the YouTube transcript with tgrab, file it under .opencode/context/research/youtube/, and regenerate the wiki index.",

  detailedDescription: `Fetches the transcript of a YouTube video and files it as durable context.

1. Take the video URL from the user. If none was given, ask for one — do not guess.
2. Run \`tgrab [--lang <code>] <url>\` through bash. Output format is \`# <title>\` followed by \`[M:SS] text\` caption lines. Add \`--lang\` only when the user asked for a specific language or the default came back empty.
3. Do not read the whole transcript back into context. Capture the title line and the line count, then write the output to a file with bash redirection.
4. Slug: lowercase the title, collapse non-alphanumerics to hyphens, append the video id (the \`v=\` parameter or the youtu.be path segment). Keep it under 80 characters.
5. Write \`.opencode/context/research/youtube/<slug>.md\` with frontmatter:

\`\`\`
---
title: "<video title>"
type: source-summary
tags: [youtube, transcript, <topic tags>]
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
sources: ["<url>"]
status: active
---
\`\`\`

   Body: the URL, the channel/video id if visible, then the transcript verbatim under a \`## Transcript\` heading. Never summarise in place of the transcript — this file is the source of record; summaries belong in a separate page.
6. Add it to the wiki: run \`npx tsx skills/graph-context/scripts/regen-index.ts\`. If the script is unavailable, append the row to \`.opencode/context/index.md\` by hand under Research.
7. Report the file path and the line count. Mention the language chosen if \`--lang\` was used.

If tgrab fails (age-restricted, region-locked, no captions), say which failure it reported. Do not fabricate a transcript and do not substitute a summary for one.`,

  skill: "wiki",
  tools: ["bash", "read", "edit", "write"],
  rules: RULES_CONTEXT_STRATEGY,
  relatedSkills: ["wiki"],

  examples: [
    {
      input: "/memory-hub yt-transcript https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      approach:
        "tgrab → 212 caption lines. Slug rick-astley-never-gonna-give-you-up-dQw4w9WgXcQ. Write .opencode/context/research/youtube/<slug>.md with frontmatter + verbatim transcript, run regen-index.ts, report path and 212 lines.",
    },
  ],

  warnings: [
    "Transcripts are long. Redirect tgrab output to the target file; do not echo it into the conversation.",
    "A summary is not a transcript. Keep the verbatim text in the source page.",
  ],
}

export default spec
