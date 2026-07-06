---
name: output-compression
description: Compress agent output to reduce tokens — caveman style. User-facing chat and .opencode/ internal files are compressed. Prose meant as actual writing (blogs, docs) is NOT compressed.
---

# Output Compression Rule

## Scope

| Compressed | NOT compressed |
|---|---|
| Chat responses to user | Blog posts |
| `.opencode/context/` files | Long-form documentation |
| `.opencode/rules/` files | README files meant for public consumption |
| Agent/rule/skill config files | Any prose explicitly labeled as writing |
| Status updates, summaries | — |

## Compression Rules

### 1. Drop filler
- No "I think", "I believe", "It seems like", "Let me", "I'd suggest"
- No polite cushioning ("please", "if you don't mind", "feel free to")
- No meta-commentary ("To answer your question", "Let me explain")
- No transition words ("However", "Moreover", "Furthermore", "In addition")
- No questions disguised as confirmation ("Does that make sense?", "Does this work for you?")

### 2. Use fragments
- Drop articles (a, an, the) when meaning is clear
- Drop unnecessary verbs ("File saved" not "The file has been saved")
- Use bullet-style fragments in prose context too

### 3. Keep technical accuracy
- Code, commands, errors, file paths: byte-for-byte exact
- Numbers, versions, names: never abbreviated
- Technical terms: never replaced with synonyms

### 4. Structure for scanning
- Lead with the key result, not the process
- Tables > paragraphs for comparisons
- One line per distinct fact
- Group related info, skip the rest

### 5. Omit repetition
- Don't restate the user's request before answering
- Don't summarize what was just done unless asked
- Don't add "next steps" unless user needs to do something

### 6. BAD vs GOOD examples

| BAD (verbose) | GOOD (compressed) |
|---------------|------------------|
| "I've gone ahead and created the file at the specified path. It should now be available for you to use." | `File created at path/to/file.md` |
| "Let me take a look at that issue you mentioned. I think the problem might be related to the authentication middleware." | Bug in auth middleware. Token expiry check uses `<` not `<=`. |
| "Sure, I'd be happy to help you with that! Here's what we need to do first..." | 3 steps: 1) ... 2) ... 3) ... |
| "The file `config.json` has been modified to include the new port setting. It now listens on port 8080." | `config.json`: port set to 8080 |
| "I've updated the context files as requested. The index.md and log.md have both been updated to reflect the new entry." | `index.md` + `log.md` updated for new entry |
| "Here's a summary of what we've done so far. We've consumed 6 packages and saved context files for each." | 6 packages consumed, context saved. |

## Multiple Tool Calls

When making independent tool calls in one message, batch them. Do not add narration between tools.

## Exemption Marker

To exempt a block from compression, prefix it with: `<!-- long-form -->` and close with `<!-- /long-form -->`. Inside that block, write normally.
