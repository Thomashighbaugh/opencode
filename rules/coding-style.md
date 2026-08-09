# Coding Style Rules

## Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate:

```javascript
// WRONG: Mutation
function updateUser(user, name) {
  user.name = name  // MUTATION!
  return user
}

// CORRECT: Immutability
function updateUser(user, name) {
  return { ...user, name }
}
```

## File Organization

MANY SMALL FILES > FEW LARGE FILES:
- High cohesion, low coupling
- 200-400 lines typical, 800 max
- Extract utilities from large components
- Organize by feature/domain, not by type

## Error Handling

ALWAYS handle errors comprehensively:

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('User-friendly error message')
}
```

## Input Validation

ALWAYS validate user input:

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

const validated = schema.parse(input)
```

## Code Quality Checklist

Before marking work complete:
- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] Immutable patterns used

## Two-Gate Review Discipline (from opencode-ts)

Before submitting any diff, run BOTH gates. A diff that fails either gate goes back for fixing.

**CHECK GATE — code must pass all of these before review:**
- [ ] No `try`/`catch` where a typed result or error channel exists; no `else` after early return; no `any`
- [ ] `const` + ternary over `let` + mutation
- [ ] Project's boundary/schema conventions applied (annotate identifiers/descriptions; typed schemas, not loose objects)
- [ ] No speculative abstraction — inline first, extract only when awkwardness repeats
- [ ] Module/file ends with the project's export-barrel convention (no ad-hoc namespace objects)

**REVIEW GATE — the diff MUST NOT contain any of these:**
- [ ] Changes to files outside the task scope
- [ ] `as any` or `as unknown as` casts
- [ ] Custom utilities that duplicate existing helpers or community primitives
- [ ] Code removal without a clear reason documented in the commit
- [ ] Unexplained variable renames or structural changes
- [ ] Abstraction a reviewer would ask to remove

## [CUSTOMIZE] Project-Specific Style

Add your project-specific coding style rules here:
- Naming conventions
- File structure requirements
- Framework-specific patterns
- YAGNI/Minimalist: No speculative features, no abstractions for single-use code. "If you write 200 lines and it could be 50, rewrite it."
