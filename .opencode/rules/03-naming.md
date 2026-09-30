# Naming Conventions

Auto-generated from codebase analysis.

## General Rules

| Category | Convention | Example |
|----------|-----------|---------|
| kebab-case (.ts) / PascalCase (.tsx) | kebab-case | `user-profile.tsx` |
| camelCase | camelCase | `userProfile` |
| camelCase | camelCase | `getUserProfile()` |
| PascalCase | PascalCase | `UserProfileService` |
| UPPER_SNAKE_CASE | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |

## Framework-Specific

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase, prefixed "use" | `useUserProfile` |
| API Routes | kebab-case | `/api/user-profiles` |
| Database Models | PascalCase | `UserProfile` |

## Abbreviations

- Avoid abbreviations in names (prefer `index` over `idx`)
- Common accepted: `id`, `url`, `uri`, `html`, `css`, `json`, `http`
