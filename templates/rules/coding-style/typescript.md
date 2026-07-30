---
name: coding-style
description: TypeScript/JavaScript coding conventions — strict mode, naming, imports, null safety
tags: [typescript, conventions, coding-style]
---

# TypeScript Coding Style

## TypeScript Strict Mode
- Enable `strict: true` in tsconfig.json
- Enable `noUncheckedIndexedAccess` for safe object access
- Enable `exactOptionalPropertyTypes` for precise optional handling
- Use `as const` for literal types and enum replacements

## Naming
- **Types/interfaces:** PascalCase — `UserProfile`, `ApiResponse`
- **Functions/variables:** camelCase — `getUser`, `isLoading`
- **Constants:** UPPER_SNAKE_CASE only for magic numbers/strings — `MAX_RETRY_COUNT`
- **React components:** PascalCase — `UserCard`, `LoginForm`
- **Hooks:** camelCase with `use` prefix — `useAuth`, `useDebounce`
- **Type parameters:** Single uppercase or PascalCase — `T`, `TData`

## Imports
- Use `type` prefix for type-only imports: `import type { User } from './types'`
- Absolute imports via `@/` alias preferred over relative paths
- Group order: external → internal → types
- No barrelless imports from deep paths — use index files

## Null Safety
- Prefer `??` over `||` for default values (catches empty string, 0 correctly)
- Use optional chaining: `user?.profile?.name` over nested `&&` checks
- Avoid `any` — use `unknown` and narrow with type guards
- Use branded types for IDs: `type UserId = string & { __brand: 'UserId' }`

## Async
- Use `async/await` over `.then()` chains
- Use `Promise.allSettled()` over `Promise.all()` for independent parallel calls
- Handle promise rejections — no floating promises without `.catch()`
