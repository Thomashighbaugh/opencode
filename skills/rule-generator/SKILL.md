---
name: rule-generator
description: Generate project-specific OpenCode rules from a conventions fingerprint — converts detected coding patterns into .opencode/rules/*.md files with BAD/GOOD examples, tags, and auto-registration
level: 3
tags: [provisioning, conventions, rules, init]
---

# Rule Generator

Takes a conventions fingerprint (from `@convention-extractor` agent) and generates project-specific `.opencode/rules/*.md` files that encode the project's actual coding conventions as enforceable agent instructions.

## When to Use

- After running `@convention-extractor` on a project
- During `/init-project provision` to generate project-specific rules
- When onboarding an existing codebase to OpenCode Hubs
- When the project's conventions have changed and rules need updating

## Input

The skill expects a conventions fingerprint JSON. This can come from:
1. `@convention-extractor` agent output (preferred)
2. A file at `.opencode/state/ideation/work-products/` (from a prior extraction)
3. Direct user input describing conventions

## Workflow

### Step 1: Load the Fingerprint

Locate the conventions fingerprint. Check in order:
1. If the caller provides a fingerprint directly, use it
2. Check `.opencode/state/ideation/work-products/` for the most recent `*convention*` file
3. If none found, suggest running `@convention-extractor` first

### Step 2: Determine Which Rules to Generate

Not every convention dimension needs a rule. Use this decision table:

| Convention Dimension | Generate Rule? | Rule File | Condition |
|---------------------|----------------|-----------|-----------|
| `fileNaming` | Yes | `file-naming.md` | Always — fundamental |
| `codeStyle` | Yes | `code-style.md` | Always — fundamental |
| `naming` | Yes | `naming.md` | Always — fundamental |
| `errorHandling` | Yes | `error-handling.md` | If `dominantStyle` is not "not-detected" |
| `testing` | Yes | `testing.md` | If `framework` is not null |
| `imports` | Yes | `imports.md` | If `moduleSystem` is detected |
| `fileOrganization` | Yes | `file-organization.md` | If `pattern` is not "unknown" |
| `documentation` | Yes | `documentation.md` | If `style` is not "none" |
| `typescript` | Yes | `typescript.md` | If `strict` is detected (TS project) |
| `git` | Yes | `git-workflow.md` | If `commitStyle` is detected |
| `css` | Yes | `styling.md` | If `approach` is not null |
| `react` | Yes | `components.md` | If `componentStyle` is detected |

**Skip rules** where the convention matches the global default (e.g., if the global `testing.md` already covers the project's patterns, don't duplicate). Instead, note in the generated rule: "Extends global `testing.md` with project-specific patterns."

### Step 3: Generate Each Rule File

For each rule to generate, follow this template:

```markdown
# {Title} Rule

**Applies to:** {project name}
**Generated from:** conventions fingerprint
**Extends:** {global rule reference, if any}

## {Section 1}: {Convention Name}

**Convention:** {description of the detected convention}

### BAD (violates convention)
```{language}
{actual bad example from the codebase or a constructed counter-example}
```

### GOOD (follows convention)
```{language}
{actual good example from the codebase}
```

## {Section 2}: {Next Convention}

...
```

**Critical rules for rule generation:**
- Use **actual code examples** from the fingerprint's `evidence` and `examples` fields
- If the fingerprint has `sampleFiles`, reference them as evidence
- Each rule MUST have at least one BAD/GOOD pair per convention
- Rules MUST be actionable — an agent reading the rule should know exactly what to do
- Rules MUST NOT conflict with global rules in `~/.config/opencode/rules/`
- Add frontmatter tags matching the `resource-tags.md` vocabulary

### Step 4: Write Rule Files

Write each generated rule to `.opencode/rules/{filename}`. Use the `Write` tool (not scripts).

**Before writing, check:**
- Does `.opencode/rules/` exist? Create it if not.
- Does a rule with this name already exist? If so, ask the user: "Rule `{name}` already exists. Overwrite, merge, or skip?"
- Is the content valid Markdown?

### Step 5: Register Rules in opencode.jsonc

After writing all rules, register them in the project's `opencode.jsonc` (or `.opencode/opencode.jsonc`):

```jsonc
{
  "instructions": [
    // ... existing instructions ...
    "./.opencode/rules/file-naming.md",
    "./.opencode/rules/code-style.md",
    "./.opencode/rules/naming.md"
    // ... etc for each generated rule
  ]
}
```

Use `json-edit` tool to add the new rules to the `instructions` array:
```
json-edit { file: ".opencode/opencode.jsonc", action: "arrayAppend", path: "$.instructions", value: "./.opencode/rules/file-naming.md" }
```

### Step 6: Validate

After generation, verify:
- [ ] All generated rules have frontmatter tags
- [ ] All rules are registered in opencode.jsonc
- [ ] No rule conflicts with global rules
- [ ] Each rule has at least one BAD/GOOD pair
- [ ] File paths in rules are relative to project root

### Step 7: Report

Output a summary:

```
Generated {N} project rules in .opencode/rules/:

| Rule | Covers | Key Convention |
|------|--------|----------------|
| file-naming.md | File naming | kebab-case for modules, PascalCase for components |
| code-style.md | Formatting | 2-space indent, single quotes, no semicolons |
| naming.md | Identifiers | camelCase variables, PascalCase classes, UPPER_CASE constants |
| error-handling.md | Errors | try/catch with custom AppError classes |
| testing.md | Tests | Vitest with describe/it, co-located test files |
| imports.md | Imports | ESM, grouped imports, @/ path alias |
| file-organization.md | Structure | Feature-based layout, 3 levels deep |
| documentation.md | Docs | TSDoc on public exports, moderate density |
| typescript.md | TS config | strict mode, explicit return types |
| git-workflow.md | Git | Conventional commits, feature/type/ branches |
| styling.md | CSS | Tailwind v4, utility-first, CSS variables |
| components.md | React | Arrow function components, interface Props, named exports |

All rules registered in .opencode/opencode.jsonc.
```

## Per-Dimension Generation Details

### file-naming.md

```markdown
# File Naming Convention

**Convention:** {dominant pattern}

## Source Files

- TypeScript modules: `{pattern}` (e.g., `user-service.ts`, `auth-utils.ts`)
- React components: `{pattern}` (e.g., `UserCard.tsx`, `LoginForm.tsx`)
- Test files: `{pattern}` (e.g., `user-service.test.ts`)
- Style files: `{pattern}` (e.g., `user-card.module.css`)

### BAD
```
src/components/userCard.tsx        ← should be PascalCase for components
src/utils/user_service.ts          ← should be kebab-case for modules
```

### GOOD
```
src/components/UserCard.tsx
src/utils/user-service.ts
src/components/UserCard.test.tsx
```

## Test Files

Tests are {co-located | in __tests__/ | in tests/} with the pattern `{testPattern}`.
```

### code-style.md

```markdown
# Code Style

**Source of truth:** {.prettierrc | .eslintrc | biome.json | inferred}

## Formatting

- Indentation: {spaces/tabs}, {size} spaces
- Quotes: {single/double}
- Semicolons: {yes/no}
- Trailing commas: {all/es5/none}
- Brace style: {same-line/next-line}
- Max line length: {N}

### BAD
```ts
const config = {
    port: 3000,
    host: "localhost"
};
```

### GOOD
```ts
const config = {
  port: 3000,
  host: 'localhost',
}
```
```

### naming.md

```markdown
# Naming Conventions

## Variables & Functions

- Variables: `{convention}` (e.g., `userName`, `maxRetries`)
- Functions: `{convention}` (e.g., `fetchUserData`, `handleSubmit`)
- Boolean variables: `is{Adjective}` or `has{Property}` (e.g., `isLoading`, `hasError`)

## Types & Interfaces

- Interfaces: `{convention}` (e.g., `User`, `LoginFormProps`)
- Types: `{convention}` (e.g., `UserRole`, `ApiResponse<T>`)
- Enums: `{convention}` (e.g., `UserRole`, `OrderStatus`)
- Enum members: `{convention}` (e.g., `UserRole.Admin`, `OrderStatus.Pending`)

## Constants

- Module-level constants: `{convention}` (e.g., `MAX_RETRIES`, `DEFAULT_TIMEOUT`)

## React

- Components: `{convention}` (e.g., `UserCard`, `LoginForm`)
- Hooks: `{convention}` (e.g., `useAuth`, `useDebounce`)
- Event handlers: `handle{Event}` (e.g., `handleSubmit`, `handleClick`)

### BAD
```ts
const user_name = "alice";        // snake_case
function GetUserData() {}         // PascalCase for function
const MyComponent = () => {};     // PascalCase is correct for components
```

### GOOD
```ts
const userName = "alice";         // camelCase
function getUserData() {}         // camelCase
const MyComponent = () => {};     // PascalCase for components
```
```

### error-handling.md

```markdown
# Error Handling

**Style:** {dominantStyle}

## Pattern

{description of the error handling pattern with code example}

### BAD
```ts
// Swallowing errors
try {
  await fetchUser(id);
} catch (e) {
  // silently ignore
}
```

### GOOD
```ts
// Proper error handling with custom errors
try {
  await fetchUser(id);
} catch (e) {
  if (e instanceof NotFoundError) {
    return { error: 'User not found', code: 404 };
  }
  logError(e);
  throw new AppError('Failed to fetch user', { cause: e });
}
```

## Custom Errors

{If customErrors: true, list the error classes and when to use each}

## API Error Format

{If apiErrors detected, show the standard error response shape}
```

### testing.md

```markdown
# Testing Conventions

**Framework:** {framework}
**Style:** {structureStyle}

## Test Structure

```ts
// {testNaming} pattern
describe('{Component/Module}', () => {
  it('should {expected behavior} when {condition}', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## File Location

Tests are {co-located | in __tests__/ | in tests/} with the pattern `{testPattern}`.

## Mocking

Use `{mockingStyle}` for mocking. {Additional mocking conventions}

## Fixtures

{If fixturePattern detected, describe the fixture convention}

### BAD
```ts
test('works', () => {
  const result = myFunction();
  // no assertion
});
```

### GOOD
```ts
it('should return user data when given a valid ID', async () => {
  const user = await fetchUser('123');
  expect(user).toMatchObject({ id: '123', name: expect.any(String) });
});
```
```

### imports.md

```markdown
# Import Conventions

**Module system:** {moduleSystem}
**Grouping:** {grouping}

## Import Order

1. Node built-ins (`fs`, `path`, `os`)
2. External packages (`react`, `lodash`, `@tanstack/query`)
3. Absolute imports (`@/components/...`, `@/utils/...`)
4. Relative imports (`./`, `../`)

## Path Aliases

{If pathAliases detected, list them with examples}

## Type Imports

{If typeImports detected, describe the convention}

### BAD
```ts
import { useState } from 'react';
import './styles.css';
import { Button } from '@/components/Button';
import fs from 'fs';
```

### GOOD
```ts
import fs from 'fs';

import { useState } from 'react';

import { Button } from '@/components/Button';

import './styles.css';
```
```

### file-organization.md

```markdown
# File Organization

**Pattern:** {pattern}
**Depth:** {depth} levels

## Directory Structure

```
src/
├── {layout description}
```

## Rules

- One component per file
- {barrelFiles rule}
- {other organization rules}

### BAD
```
src/
├── components/
│   └── AllComponents.tsx    ← 500 lines, multiple components
```

### GOOD
```
src/
├── components/
│   ├── UserCard.tsx
│   ├── LoginForm.tsx
│   └── index.ts             ← barrel export
```
```

### documentation.md

```markdown
# Documentation Conventions

**Style:** {style}
**Density:** {density}

## What to Document

{If publicOnly: "Document all public exports with TSDoc/JSDoc"}
{If not: "Document all exports with TSDoc/JSDoc"}

## TSDoc Format

```ts
/**
 * {Description of what the function does}
 *
 * @param {paramName} - {description}
 * @returns {description of return value}
 * @throws {ErrorType} - {when this error is thrown}
 */
```

## TODO Comments

Format: `{todoFormat}`

### BAD
```ts
// fix this later
function processData(data: any) { ... }
```

### GOOD
```ts
/**
 * Processes raw API data into the application format.
 * @param data - Raw API response
 * @returns Normalized user data
 */
function processData(data: RawApiResponse): NormalizedUser { ... }
```
```

### typescript.md

```markdown
# TypeScript Configuration

**Strict mode:** {strict}
**Target:** {target}

## Type Safety Rules

- `strictNullChecks`: {enabled/disabled} — {implication}
- `noImplicitAny`: {enabled/disabled} — {implication}
- `noUncheckedIndexedAccess`: {enabled/disabled} — {implication}

## Type Conventions

- Always prefer explicit return types on exported functions
- Use `interface` for object shapes, `type` for unions/intersections
- Avoid `any` — use `unknown` and narrow with type guards
- Use `as const` for literal types where appropriate

### BAD
```ts
function getUser(id) {           // implicit any
  return fetch(`/api/users/${id}`);
}
```

### GOOD
```ts
function getUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`).then(res => res.json());
}
```
```

### git-workflow.md

```markdown
# Git Workflow

**Branch naming:** {branchNaming}
**Commit style:** {commitStyle}

## Branch Naming

```
{type}/{description-in-kebab-case}
```

Examples:
- `feature/user-authentication`
- `fix/login-redirect-loop`
- `chore/update-dependencies`

## Commit Messages

{If conventional-commits: "Follow Conventional Commits specification"}
{If imperative: "Use imperative mood: 'Add feature' not 'Added feature'"}

Format: `{type}({scope}): {description}`

### BAD
```
fixed the bug
WIP
stuff
```

### GOOD
```
fix(auth): resolve redirect loop after login
feat(api): add user search endpoint
chore(deps): update typescript to 5.5
```
```

### styling.md

```markdown
# Styling Conventions

**Approach:** {approach}
**Version:** {version}

## Pattern

{Description of the styling pattern}

### BAD
```tsx
<div style={{ padding: '16px', backgroundColor: '#f0f0f0' }}>
  <h1 style={{ fontSize: '24px' }}>Title</h1>
</div>
```

### GOOD
```tsx
<div className="p-4 bg-gray-100">
  <h1 className="text-2xl font-bold">Title</h1>
</div>
```

## {If utilityFirst: "Use utility classes. Avoid custom CSS unless necessary."}
## {If cssVariables: "Use CSS custom properties for theme values."}
```

### components.md

```markdown
# React Component Conventions

**Component style:** {componentStyle}
**Prop typing:** {propTyping}
**Export style:** {exportStyle}

## Component Structure

```tsx
{Example component following all conventions}
```

## Rules

- One component per file
- Props interface named `{ComponentName}Props`
- {exportStyle} exports
- Event handlers: `handle{Event}` naming
- {fragmentStyle} for fragments

### BAD
```tsx
export default function(props: any) {
  return <div onClick={() => alert('clicked')}>{props.children}</div>;
}
```

### GOOD
```tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  const handleClick = () => {
    onClick();
  };

  return (
    <button className={variant} onClick={handleClick}>
      {children}
    </button>
  );
}
```
```

## Integration with /init-project

The rule-generator skill is called during `/init-project provision` (Phase 5: rules). The flow is:

```
/init-project detect → @stack-detector → stack fingerprint
/init-project provision → @convention-extractor → conventions fingerprint
                        → rule-generator skill → .opencode/rules/*.md
```

## Related

- `@convention-extractor` agent — produces the conventions fingerprint
- `@stack-detector` agent — produces the technology stack fingerprint
- `provision` skill — orchestrates the full init-project pipeline
- `resource-tags.md` rule — tagging vocabulary for generated rules
- `global-reference.md` rule — where generated rules go
