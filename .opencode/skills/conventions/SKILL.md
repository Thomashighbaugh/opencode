---
name: conventions
description: Coding conventions — naming, imports, error handling, testing patterns
level: 1
---

# Conventions

Coding conventions for the typescript/undefined project.

## Naming

| Category | Convention | Example |
|----------|-----------|---------|
| Variables | camelCase |
| Classes | PascalCase |
| Files | kebab-case (.ts) / PascalCase (.tsx) |
| Constants | UPPER_SNAKE_CASE |
| Components | PascalCase |

## Imports

- ES modules
- Use path aliases where configured
- Group: external → internal → relative

## Error Handling

- try/catch with typed errors
- Log errors with appropriate context
- Return user-friendly error messages

## Testing (vitest)

- Run: `npx vitest run`

- Test name describes behavior: "returns X when Y"
- One assertion pattern per test where possible
