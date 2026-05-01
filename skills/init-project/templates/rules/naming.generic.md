# Naming Conventions - Generic

Use these conventions when language detection fails or for mixed-language projects.

## Files

### General Rules
- **Consistent style** - Choose one style and stick to it
- **Descriptive names** - `user_service` not `svc`
- **No spaces** - Use underscores or hyphens, not spaces

### Common Patterns
- **kebab-case**: `user-service.ext`, `api-client.ext` (most common)
- **snake_case**: `user_service.ext` (Python, Ruby style)
- **PascalCase**: `UserService.ext` (C#, Java style for classes)

### Tests
- **_test suffix**: `user_service_test.ext`
- **_spec suffix**: `user_service_spec.ext`
- **test_ prefix**: `test_user_service.ext`

## Directories

### Organization
- **kebab-case** (recommended): `user-service/`, `api-client/`
- **Lowercase**: Avoid uppercase in directory names
- **Descriptive**: `services/`, `controllers/`, `models/`

## Variables

### General Rules
- **Consistent style** - snake_case or camelCase, not both
- **Descriptive names** - Names should reveal intent
- **Boolean prefixes** - `is_`, `has_`, `can_` (snake_case) or `is`, `has`, `can` (camelCase)

### Common Patterns
| Style | Example |
|-------|---------|
| snake_case | `user_name`, `is_active`, `user_count` |
| camelCase | `userName`, `isActive`, `userCount` |
| SCREAMING_SNAKE_CASE (constants) | `MAX_RETRIES`, `API_BASE_URL` |

## Functions/Methods

### General Rules
- **Verb prefix** - `get`, `set`, `create`, `delete`, `update`
- **Descriptive** - `get_user_by_id` not `get_user`
- **Boolean return** - `is_valid`, `has_permission`, `can_edit`

### Common Patterns
| Style | Example |
|-------|---------|
| snake_case | `get_user_profile()`, `calculate_total()` |
| camelCase | `getUserProfile()`, `calculateTotal()` |

## Classes/Types

### General Rules
- **PascalCase** - Universal across most languages
- **Nouns** - `User`, `Account`, `PaymentService`
- **Avoid prefix** - No `IUser` or `CUser` unless convention

### Common Patterns
| Style | Example |
|-------|---------|
| PascalCase | `UserService`, `PaymentProcessor` |

## Constants

### General Rules
- **SCREAMING_SNAKE_CASE** - Most common
- **Grouped related** - `MAX_RETRIES`, `DEFAULT_TIMEOUT`

### Common Patterns
```
MAX_RETRIES = 3
DEFAULT_TIMEOUT = 5000
API_BASE_URL = "https://api.example.com"
```

## Interfaces

### General Rules
- **PascalCase** - Same as classes
- **Adjective** - `Runnable`, `Serializable`, `Comparable`
- **No I prefix** - Modern convention avoids `IInterface`

## Packages/Modules

### General Rules
- **Lowercase** - `com.example.userservice`
- **No special chars** - Avoid underscores in package names
- **Reverse domain** - `com.company.project.module`

## File Organization

### Recommended Structure
```
project/
├── src/
│   ├── components/      # UI components
│   ├── services/        # Business logic
│   ├── models/          # Data models
│   ├── utils/           # Utilities
│   └── config/          # Configuration
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
├── config/
└── scripts/
```

## Best Practices

1. **Be consistent** - Same style throughout project
2. **Be descriptive** - Names should reveal intent
3. **Avoid abbreviations** - `get_user` not `get_usr`
4. **Follow conventions** - Match language/community norms
5. **Document deviations** - If you must deviate, document why

## Mixed Language Projects

For projects with multiple languages:

### Option 1: Per-Directory Convention
```
src/
├── python/     # snake_case files and functions
│   └── user_service.py
├── typescript/ # camelCase functions, PascalCase components
│   └── UserService.ts
└── rust/       # snake_case files, PascalCase types
    └── user_service.rs
```

### Option 2: Universal Convention
- Choose one style (usually the dominant language's style)
- Apply consistently across all languages
- Document in project AGENTS.md

## Special Cases

### Event Handlers
- **handle prefix**: `handleClick`, `handleSubmit`

### Callbacks
- **on prefix**: `onClick`, `onSubmit`

### Getters/Setters
- **get/set prefix**: `getName()`, `setName()`

### Builders
- **Builder suffix**: `UserBuilder`, `ConfigBuilder`

### Factories
- **Factory suffix**: `UserFactory`, `ConnectionFactory`