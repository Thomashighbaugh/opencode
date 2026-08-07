---
name: code-standards-extractor
description: Extract coding standards from existing source files and produce a standards document. Use when the user wants a STYLE.md / CODING_STANDARDS.md / CONTRIBUTING.md generated from an existing file or folder, wants conventions inferred from the codebase ("use the existing syntax of these files as the style guide"), or wants a standards test written to enforce them. Invoked via /project extract-standards.
level: 2
license: MIT
---

# Coding Standards Extractor

Use the existing syntax of the file(s) to establish the standards and style guidelines for the project. If more than one file or a folder is passed, loop through each file or files in the folder, appending the file's data to temporary memory or a file, then when complete use temporary data as a single instance — as if it were the file name to base the standards and style guideline on.

## When to Use

- The user wants a coding standards document generated from existing code.
- The user says "use the existing syntax/style of these files as the standard".
- A standards file (STYLE.md, CODING_STANDARDS.md, etc.) needs to be created from an existing codebase.
- The user wants a test that verifies files adhere to the extracted standards.
- The user wants to find/fix inconsistencies in indentation, naming, commenting, etc. relative to the majority convention.

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `fileName` | **Yes** | File to analyze: indentation, variable naming, commenting, conditional/functional procedures, and other syntax-related data for the file's language |
| `folderName` | No | Folder whose files are aggregated into one dataset, then analyzed as a single instance |
| `instructions` | No | Additional instructions, rules, and procedures for unique cases |
| config flags | No | Any config variable passed as a parameter overrides its default (see Config section) |

## Configuration Variables

Defaults are listed; passing the variable name as a prompt parameter overrides the default.

| Variable | Default | Purpose |
|----------|---------|---------|
| `addStandardsTest` | `false` | After the standards file is complete, write a test file enforcing adherence |
| `addToREADME` | `false` | Insert standards into README.md instead of creating a file / printing to prompt |
| `addToREADMEInsertions` | `"beforeEnd"` | Where in README.md: `atBegin` \| `middle` \| `beforeEnd` \| `bestFitUsingContext` |
| `createNewFile` | `true` | Create a new standards file (name chosen from `newFileName` list) |
| `fetchStyleURL` | `true` | Fetch the language style guide URL (see Fetch Links) as additional context |
| `findInconsistencies` | `true` | Evaluate syntax (indentation, line-breaks, comments, nesting, quote wrappers); count per category; flag low-count items |
| `fixInconsistencies` | `true` | Edit low-count categories to match the majority (requires `findInconsistencies`) |
| `newFileName` | `["CONTRIBUTING.md", "STYLE.md", "CODE_OF_CONDUCT.md", "CODING_STANDARDS.md", "DEVELOPING.md", "CONTRIBUTION_GUIDE.md", "GUIDELINES.md", "PROJECT_STANDARDS.md", "BEST_PRACTICES.md", "HACKING.md"]` | Candidate names; use first that doesn't already exist, then stop |
| `outputSpecToPrompt` | `false` | Output the standards to the prompt instead of creating a file / adding to README |
| `useTemplate` | `"verbose"` | Template: `v`/`verbose`, `m`/`minimal`, `b`/`best fit`, or `custom` |

### Configuration Conditions

- If `fileName.length > 1 || folderName != undefined` → toggle `fixInconsistencies` to **false**.
- If `addToREADME == true` → insert into README.md (per `addToREADMEInsertions`), and toggle both `createNewFile` and `outputSpecToPrompt` to **false**.
  - `atBegin`: insert after the title.
  - `middle`: insert at the middle, matching the README's title heading style.
  - `beforeEnd`: insert on a new line after the last character.
  - `bestFitUsingContext`: insert at the best-fitting line based on README composition/flow.
- If `createNewFile == true` → create a file named by the `newFileName` rule; toggle both `outputSpecToPrompt` and `addToREADME` to **false**.
- `typeof newFileName == "string"` → use that exact name.
- `typeof newFileName != "string"` (array) → first name in the list that doesn't exist, then stop.
- If `outputSpecToPrompt == true` → print to prompt; toggle both `createNewFile` and `addToREADME` to **false**.
- If `fetchStyleURL == true` → `webfetch` the matching language style guide from Fetch Links and use it as context for standards, specifications, and styling data.
- If `addStandardsTest == true` → after the standards file is complete, write a test file ensuring the analyzed files adhere to it.

## Workflow

1. **Resolve targets**: determine input file(s) — single `fileName`, or every file in `folderName`. If multiple files/folder: loop through each, append each file's data to temporary memory (`.opencode/state/`), then treat the aggregated data as a single instance.
2. **Determine output mode**: apply the config conditions above to decide: new file, README insertion, or prompt output.
3. **Apply inconsistency analysis** (`findInconsistencies`):
   - Evaluate syntax: indentations, line-breaks, comments, conditional/function nesting, quotation wrappers (`'` vs `"`), etc.
   - Categorize and count each category.
   - If an item does not match the majority count, commit it to temporary memory.
   - If `fixInconsistencies == true`: edit the low-count categories to match the majority. Else: output the stored inconsistencies to the prompt.
4. **Fetch style context** (`fetchStyleURL == true`): for the file's language, `webfetch` the corresponding URL from Fetch Links.
5. **Compose the standards** using the selected template (`v`/`verbose`, `m`/`minimal`, `b`/best fit, or `custom`).
6. **Write the output** to the chosen destination (file / README / prompt).
7. **Write standards test** (`addStandardsTest == true`) enforcing the standards.
8. **Report**: summarize the output destination, detected conventions, and any fixed inconsistencies.

## Fetch Links

For each language, fetch the style guide when `fetchStyleURL == true` and the analyzed language matches:

- C: https://users.ece.cmu.edu/~eno/coding/CCodingStandard.html
- C#: https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions
- C++: https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines
- Go: https://github.com/golang-standards/project-layout
- Java: https://coderanch.com/wiki/718799/Style
- AngularJS: https://github.com/mgechev/angularjs-style-guide
- jQuery: https://contribute.jquery.org/style-guide/js/
- JavaScript: https://www.w3schools.com/js/js_conventions.asp
- JSON: https://google.github.io/styleguide/jsoncstyleguide.xml
- Kotlin: https://kotlinlang.org/docs/coding-conventions.html
- Markdown: https://cirosantilli.com/markdown-style-guide/
- Perl: https://perldoc.perl.org/perlstyle
- PHP: https://phptherightway.com/
- Python: https://peps.python.org/pep-0008/
- Ruby: https://rubystyle.guide/
- Rust: https://github.com/rust-lang/rust/tree/HEAD/src/doc/style-guide/src
- Swift: https://www.swift.org/documentation/api-design-guidelines/
- TypeScript: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html
- Visual Basic: https://en.wikibooks.org/wiki/Visual_Basic/Coding_Standards
- Shell: https://google.github.io/styleguide/shellguide.html
- Git: https://github.com/agis/git-style-guide
- PowerShell: https://github.com/PoshCode/PowerShellPracticeAndStyle
- CSS: https://cssguidelin.es/
- Sass: https://sass-guidelin.es/
- HTML: https://github.com/marcobiedermann/html-style-guide
- Linux kernel: https://www.kernel.org/doc/html/latest/process/coding-style.html
- Node.js: https://github.com/felixge/node-style-guide
- SQL: https://www.sqlstyle.guide/
- Angular: https://angular.dev/style-guide
- Vue: https://vuejs.org/style-guide/rules-strongly-recommended.html
- Django: https://docs.djangoproject.com/en/dev/internals/contributing/writing-code/coding-style/
- SystemVerilog: https://github.com/lowRISC/style-guides/blob/master/VerilogCodingStyle.md

## Coding Standards Templates

### `"m"`, `"minimal"`

```markdown
## 1. Introduction
*   **Purpose:** Briefly explain why the coding standards are being established (e.g., to improve code quality, maintainability, and team collaboration).
*   **Scope:** Define which languages, projects, or modules this specification applies to.

## 2. Naming Conventions
*   **Variables:** `camelCase`
*   **Functions/Methods:** `PascalCase` or `camelCase`.
*   **Classes/Structs:** `PascalCase`.
*   **Constants:** `UPPER_SNAKE_CASE`.

## 3. Formatting and Style
*   **Indentation:** Use 4 spaces per indent (or tabs).
*   **Line Length:** Limit lines to a maximum of 80 or 120 characters.
*   **Braces:** Use the "K&R" style (opening brace on the same line) or the "Allman" style (opening brace on a new line).
*   **Blank Lines:** Specify how many blank lines to use for separating logical blocks of code.

## 4. Commenting
*   **Docstrings/Function Comments:** Describe the function's purpose, parameters, and return values.
*   **Inline Comments:** Explain complex or non-obvious logic.
*   **File Headers:** Specify what information should be included in a file header, such as author, date, and file description.

## 5. Error Handling
*   **General:** How to handle and log errors.
*   **Specifics:** Which exception types to use, and what information to include in error messages.

## 6. Best Practices and Anti-Patterns
*   **General:** List common anti-patterns to avoid (e.g., global variables, magic numbers).
*   **Language-specific:** Specific recommendations based on the project's programming language.

## 7. Examples
*   Provide a small code example demonstrating the correct application of the rules.
*   Provide a small code example of an incorrect implementation and how to fix it.

## 8. Contribution and Enforcement
*   Explain how the standards are to be enforced (e.g., via code reviews).
*   Provide a guide for contributing to the standards document itself.
```

### `"v"`, `"verbose"`

```markdown
# Style Guide

This document defines the style and conventions used in this project.
All contributions should follow these rules unless otherwise noted.

## 1. General Code Style

- Favor clarity over brevity.
- Keep functions and methods small and focused.
- Avoid repeating logic; prefer shared helpers/utilities.
- Remove unused variables, imports, code paths, and files.

## 2. Naming Conventions

Use descriptive names. Avoid abbreviations unless well-known.

| Item            | Convention           | Example            |
|-----------------|----------------------|--------------------|
| Variables       | `lower_snake_case`   | `buffer_size`      |
| Functions       | `lower_snake_case()` | `read_file()`      |
| Constants       | `UPPER_SNAKE_CASE`   | `MAX_RETRIES`      |
| Types/Structs   | `PascalCase`         | `FileHeader`       |
| File Names      | `lower_snake_case`   | `file_reader.c`    |

## 3. Formatting Rules

- Indentation: **4 spaces**
- Line length: **max 100 characters**
- Encoding: **UTF-8**, no BOM
- End files with a newline

### Braces (example in C, adjust for your language)

```c
if (condition) {
    do_something();
} else {
    do_something_else();
}
```

### Spacing

- One space after keywords: `if (x)`, not `if(x)`
- One blank line between top-level functions

## 4. Comments & Documentation

- Explain *why*, not *what*, unless intent is unclear.
- Keep comments up-to-date as code changes.
- Public functions should include a short description of purpose and parameters.

Recommended tags:

```text
TODO: follow-up work
FIXME: known incorrect behavior
NOTE: non-obvious design decision
```

## 5. Error Handling

- Handle error conditions explicitly.
- Avoid silent failures; either return errors or log them appropriately.
- Clean up resources (files, memory, handles) before returning on failure.

## 6. Commit & Review Practices

### Commits
- One logical change per commit.
- Write clear commit messages:

```text
Short summary (max ~50 chars)
Optional longer explanation of context and rationale.
```

### Reviews
- Keep pull requests reasonably small.
- Be respectful and constructive in review discussions.
- Address requested changes or explain if you disagree.

## 7. Tests

- Write tests for new functionality.
- Tests should be deterministic (no randomness without seeding).
- Prefer readable test cases over complex test abstraction.

## 8. Changes to This Guide

Style evolves.
Propose improvements by opening an issue or sending a patch updating this document.
```

### `"b"`, `"best fit"`

Use either the verbose or minimal template depending on the data extracted from the analyzed file(s); pick whichever fits best.

### `"custom"` or any other name

Use the custom prompt, instructions, template, or other data passed as the guiding template.
