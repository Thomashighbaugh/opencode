# Naming Conventions - JavaScript

## Files

### Components
- **PascalCase**: `Button.jsx`, `UserProfile.jsx`
- **One component per file**: File name matches component name

### Utilities
- **camelCase**: `formatDate.js`, `parseConfig.js`

### Tests
- **Test files**: `*.test.js`, `*.spec.js`
- **Test directories**: `__tests__/` or `tests/`

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

## Functions

### Named Functions
- **camelCase**: `getUserProfile()`, `calculateTotal()`

### Arrow Functions
- **Variables get camelCase**: `const handleClick = () => {}`

### Async Functions
- **Same naming**: `async function fetchUser()`, `const loadData = async () => {}`

## Classes

### Class Names
- **PascalCase**: `UserService`, `PaymentProcessor`

### Methods
- **camelCase**: `getUser()`, `calculateTotal()`

### Private Methods (ES2022+)
- **Hash prefix**: `#privateMethod()`, `#privateField`

## Object Properties

### Object Keys
- **camelCase**: `{ userName: "John", isActive: true }`

### Computed Properties
- **Variable names**: `[eventType]: handler`

## React Conventions

### Components
- **PascalCase**: `UserProfile`, `NavigationMenu`

### Props
- **camelCase prop names**: `userName`, `isActive`, `onSubmit`

### Hooks
- **use prefix**: `useAuth()`, `useLocalStorage()`

### Context
- **PascalCase**: `ThemeContext`, `AuthContext`

## Best Practices

1. **Be consistent** - Follow existing patterns in the codebase
2. **Be descriptive** - Names should reveal intent
3. **Avoid abbreviations** - `getUser` not `getUsr`
4. **Boolean prefixes**: `is`, `has`, `can`, `will`

## Special Cases

### Event Handlers
- **handle prefix**: `handleClick`, `handleSubmit`

### Boolean Variables
- **is/has prefix**: `isLoading`, `hasError`, `canEdit`

### Callback Props
- **on prefix**: `onClick`, `onSubmit`, `onChange`