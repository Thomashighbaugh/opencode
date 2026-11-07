# Naming Conventions - TypeScript

## Files

### Components
- **PascalCase**: `Button.tsx`, `UserProfile.tsx`
- **One component per file**: File name matches component name
- **Index files**: `index.ts` for barrel exports

### Utilities
- **camelCase**: `formatDate.ts`, `parseConfig.ts`
- **Descriptive names**: `getUserById.ts` not `get.ts`

### Tests
- **Test files**: `*.test.ts`, `*.spec.ts`
- **Test directories**: `__tests__/` or `tests/`
- **E2E tests**: `*.e2e.ts`, `*.e2e-spec.ts`

### Directories
- **kebab-case**: `user-profile/`, `api-client/`
- **Feature-based**: `features/auth/`, `components/forms/`

## Variables

### Local Variables
- **camelCase**: `const userName = "John"`
- **Descriptive**: `isLoading`, `hasError`, `userCount`

### Constants
- **SCREAMING_SNAKE_CASE**: `MAX_RETRIES`, `API_BASE_URL`
- **Module-level**: `const DEFAULT_TIMEOUT = 5000`

### Private Properties
- **Underscore prefix**: `_privateMethod()`, `#privateField` (ES2022+)

## Functions

### Named Functions
- **camelCase**: `getUserProfile()`, `calculateTotal()`
- **Async**: `fetchUser()`, `loadData()`
- **Boolean returns**: `isValid()`, `hasPermission()`, `canEdit()`

### Arrow Functions
- **Variables get camelCase**: `const handleClick = () => {}`

### Event Handlers
- **handle prefix**: `handleClick`, `handleSubmit`, `handleInputChange`
- **on prefix for props**: `onClick`, `onSubmit`, `onChange`

## Classes and Types

### Classes
- **PascalCase**: `UserService`, `PaymentProcessor`
- **Instances get camelCase**: `const userService = new UserService()`

### Interfaces
- **PascalCase with I prefix (optional)**: `IUser` or `User`
- **Props interface**: `ButtonProps`, `UserCardProps`

### Type Aliases
- **PascalCase**: `type UserRole = "admin" | "user"`
- **Descriptive**: `type ApiResponse<T>`, `type HttpStatus = number`

### Enums
- **PascalCase enum**: `enum UserRole { Admin, User }`
- **SCREAMING_SNAKE_CASE values (optional)**: `enum Status { PENDING, APPROVED }`

## React Components

### Component Names
- **PascalCase**: `UserProfile`, `NavigationMenu`, `DataTable`

### Props
- **Interface naming**: `UserProfileProps`, `ButtonProps`
- **Destructured props**: `{ userName, isActive, onSubmit }`

### Hooks
- **use prefix**: `useAuth()`, `useLocalStorage()`
- **Custom hooks**: `const { user, isLoading } = useAuth()`

### Context
- **Context name**: `ThemeContext`, `AuthContext`
- **Provider**: `ThemeProvider`, `AuthProvider`
- **Hook**: `useTheme()`, `useAuth()`

## File Organization

```
src/
├── components/           # UI components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   ├── Button.styles.ts
│   │   └── index.ts
│   └── UserProfile/
├── hooks/               # Custom hooks
│   ├── useAuth.ts
│   └── useLocalStorage.ts
├── utils/               # Utility functions
│   ├── formatDate.ts
│   └── parseConfig.ts
├── types/               # Type definitions
│   ├── user.types.ts
│   └── api.types.ts
├── services/            # API services
│   └── apiClient.ts
└── constants/           # Constants
    └── endpoints.ts
```

## Best Practices

1. **Be consistent** - Follow existing patterns in the codebase
2. **Be descriptive** - Names should reveal intent
3. **Avoid abbreviations** - `getUser` not `getUsr`
4. **Avoid redundancy** - `User` not `IUserInterface`
5. **Use verb prefixes** - `get`, `set`, `has`, `is`, `can`, `will`