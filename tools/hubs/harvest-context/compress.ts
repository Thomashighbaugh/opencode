import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "compress",
  description: "Token compression strategies — density filtering (~29% savings), command output compression (~47%), library cache compression (~94%)",
  reminder: "Apply 4-layer token compression.",
  inline: true,

  detailedDescription: `Applies token compression strategies to context and output. Four layers:

1. Density filtering (~29% savings): remove low-information-density lines (boilerplate, whitespace-heavy, repetitive) from text while preserving meaning.
2. Command output compression (~47% savings): compress verbose CLI output (test runners, build logs) by removing timestamps, progress bars, and repetitive lines while preserving pass/fail signals.
3. Library cache compression (~94% savings): compress cached library documentation by extracting only the relevant API signatures and examples, discarding prose.
4. Context compaction: when the context window is full, summarize older context into key facts and free the tokens.

Use when token efficiency matters — large context windows, many tool outputs, or approaching context limits.`,

  tools: ["bash"],
  relatedSkills: ["compact", "llm-cache"],
}

export default spec