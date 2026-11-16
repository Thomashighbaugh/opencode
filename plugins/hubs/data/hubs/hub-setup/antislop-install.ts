import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "antislop-install",
  description: "Install antislop skills + pointer block into AGENTS.md",
  reminder: "Interactive skill selection, then writes the antislop pointer block into the project entry file.",
  inline: false,

  detailedDescription: `Anti-slop install wizard. Follows anti-slop's First-Run Install Wizard: an offer, not a requirement — the core antislop.md rules file alone remains a complete filter if the user declines skills.

## Steps (gated, requires approval)

1. **Declare the setup before doing anything.** Tell the user (a) the chosen skill(s) go in skills/<name>/ subfolders next to the core file (the user fetches them; the agent never downloads from the network), and (b) an antislop pointer block is appended at the end of the project's entry file. Get approval. Never modify the entry file silently.
2. **Ask which skills to install** (multi-select). List only skills that exist in this version:
   - All (recommended): every available skill
   - antislop-ui — UI / visual
   - antislop-copywriting — copy & text
   - antislop-human — people / accessibility
   - antislop-layoutmobile — mobile / responsive
   - antislop-code — code comments
   If the user declines or says "core only", stop here and use the core rules file alone as the filter. Do not install anything.
3. **Resolve direction** (only if a UI skill was selected). Check for DESIGN.md or explicit brand/style direction. If none, be honest that antislop is a filter, not a beautifier: without direction output tends toward monotonous. Recommend a DESIGN.md, then offer: (1) user supplies direction (recommended), (2) agent supplies direction with honest warning, (3) skip direction for now → output labeled "draft without direction" with dials ENERGY 1 / RHYTHM 1 / MOTION 1.
4. **Get the chosen skill(s) in place; the user does the fetching.** A SKILL.md is instructions the agent will obey, so the agent never downloads one at runtime. If a chosen skill folder is missing, tell the user which ones are missing and that they come with the release matching this core.
5. **Append the pointer block at the END of the project's entry file** (AGENTS.md for OpenCode). Never modify existing content. Block:

   \`\`\`md
   <!-- antislop:start -->
   ## antislop
   For UI, copy, people, mobile layout, or code comments work, read antislop.md (core) and then the skill for the task:
   - UI / visual: skills/antislop-ui/SKILL.md
   - Copy & text: skills/antislop-copywriting/SKILL.md
   - People: skills/antislop-human/SKILL.md
   - Mobile / responsive: skills/antislop-layoutmobile/SKILL.md
   - Code comments: skills/antislop-code/SKILL.md
   Before starting, follow the core's "Two Usage Modes" section in strict order.
   <!-- antislop:end -->
   \`\`\`

   If an older antislop block exists (even without markers), replace just that block instead of appending a duplicate.
6. **Resolve and announce the usage mode** (see antislop-mode), then proceed with the work.

## Entry file (OpenCode)

AGENTS.md — the file OpenCode reads at session start. The pointer takes effect from the next session.

## Examples

| Input | Approach |
|-------|----------|
| /hub-setup antislop-install | Declares setup, asks skill selection (multi-select), resolves DESIGN.md direction, writes pointer block into AGENTS.md, resolves mode. |
| /hub-setup antislop-install --core-only | Skips skill selection, writes core-only pointer block into AGENTS.md. |
`,
  tools: ["read", "write", "edit", "bash", "agentContext"],
  rules: ["anti-refusal", "file-operations"],
  relatedSkills: ["antislop-ui", "antislop-copywriting", "antislop-human", "antislop-layoutmobile", "antislop-code"],
  warnings: [
    "The agent never downloads skills from the network — the user fetches skill folders. The agent only writes the pointer block.",
    "Never modify existing entry-file content; append the pointer block at the end, or replace an older antislop block in place.",
    "Never invent example content for DESIGN.md. The user is the author; the agent only formats their answers.",
  ]
}

export default spec
