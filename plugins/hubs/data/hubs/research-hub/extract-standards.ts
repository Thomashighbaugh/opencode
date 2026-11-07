import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "extract-standards",
  description: "Infer a style guide from the code that already exists",
  reminder: "Extract coding standards from existing file(s). Asks: output target + template.",
  skill: "code-standards-extractor",

  detailedDescription: `Extracts coding standards from existing source files via the code-standards-extractor skill. Uses the existing syntax of the given file(s) to establish the project's style guidelines.

Parameters:
- fileName (required): the file to analyze — indentation, variable naming, commenting, conditional/functional procedures, and other syntax-related data for the file's language.
- folderName (optional): aggregate data from all files in the folder into one dataset, then analyze as a single instance. Loops through each file, appending data to temporary memory, then treats the aggregate as one input.
- instructions (optional): additional rules/procedures for unique cases.
- Config flags as parameters (optional): addStandardsTest, addToREADME, addToREADMEInsertions, createNewFile, fetchStyleURL, findInconsistencies, fixInconsistencies, newFileName, outputSpecToPrompt, useTemplate. Passing any of these overrides its default.

Output modes (default: create a new standards file):
- New file: picks the first unused name from [CONTRIBUTING.md, STYLE.md, CODE_OF_CONDUCT.md, CODING_STANDARDS.md, DEVELOPING.md, CONTRIBUTION_GUIDE.md, GUIDELINES.md, PROJECT_STANDARDS.md, BEST_PRACTICES.md, HACKING.md].
- addToREADME=true: inserts standards into README.md (atBegin | middle | beforeEnd | bestFitUsingContext).
- outputSpecToPrompt=true: prints standards to the prompt instead.
- .opencode/context/: writes the guide as durable knowledge (e.g. .opencode/context/patterns/style.md) so agents load it as project context.
- .opencode/rules/: writes the guide as an enforced rule (e.g. .opencode/rules/style.md) so it is registered and applied during code work.

Also detects syntax inconsistencies (indentation, line-breaks, comments, nesting, quote wrappers): categorizes, counts, flags low-count items; optionally fixes them to match the majority (fixInconsistencies, default true — auto-disabled when analyzing multiple files/folders). Optionally fetches the language's official style guide as extra context (fetchStyleURL, default true). Optionally writes a standards-adherence test (addStandardsTest, default false).

Use when the user wants a style guide derived from an existing codebase, or wants consistency fixes applied per the majority convention.

## Gatekeeping Question

Before extracting, ask (passing the flags skips the question — non-interactive path):

> **Question 1 — output target?**
> 1. New standards file — CONTRIBUTING.md / STYLE.md / …
> 2. README.md — insert into the existing README
> 3. .opencode/context/ — durable knowledge (context/patterns/style.md)
> 4. .opencode/rules/ — enforced rule (rules/<name>.md)
> 5. Prompt only — print, write no file
> (or type your own path)
>
> **Question 2 — template?**
> 1. standard
> 2. minimal
> (or type your own)
>
> **Question 3 — README placement?** (only when README is chosen)
> 1. beforeEnd
> 2. afterFrontmatter / middle / atBegin / bestFitUsingContext

Resolved answers map to \`outputSpecToPrompt\`, \`addToREADME\`, \`createNewFile\`/\`newFileName\`, and \`useTemplate\`.`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["rule-generator", "convention-extractor"],
  examples: [
    {
      input: "/build-hub extract-standards src/main.py",
      approach: "Asks output target (new standards file) and template (standard). Analyze src/main.py's syntax conventions (indentation, naming, comments), fetch the Python style guide (PEP 8), compose a standards doc using the verbose template, write to the first unused file name (e.g. STYLE.md)."
    },
    {
      input: "/build-hub extract-standards src/",
      approach: "Asks output target (.opencode/rules/) and template (minimal). Aggregate all files in src/ into one dataset, analyze as a single instance, write a minimal standards rule to .opencode/rules/style.md so it is registered and enforced."
    },
    {
      input: "/build-hub extract-standards app.js --addToREADME=beforeEnd",
      approach: "Flag passed → placement gate skipped. Extract standards from app.js and append them to README.md after the last character on a new line, instead of creating a new file."
    }
  ],
}

export default spec
