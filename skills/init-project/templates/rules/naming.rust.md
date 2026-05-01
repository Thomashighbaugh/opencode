# Naming Conventions - Rust

## Files

### Module Files
- **snake_case**: `user_service.rs`, `api_client.rs`
- **Match module name**: File name matches module name

### Tests
- **Tests in same file**: `#[cfg(test)] mod tests { }`
- **Integration tests**: `tests/` directory, `tests/integration_test.rs`

### Directories
- **snake_case**: `src/user_service/`, `src/api_client/`

## Variables

### Local Variables
- **snake_case**: `let user_name = "John";`
- **Descriptive**: `let is_loading = true;`

### Constants
- **SCREAMING_SNAKE_CASE**: `const MAX_RETRIES: usize = 3;`
- **Associated constants**: `const DEFAULT_TIMEOUT: Duration;`

### Static Variables
- **SCREAMING_SNAKE_CASE**: `static GLOBAL_COUNTER: AtomicUsize = ...;`

## Functions

### Function Names
- **snake_case**: `fn get_user_profile()`, `fn calculate_total()`
- **Descriptive**: `fn fetch_user()`, `fn load_data()`

### Methods
- **snake_case**: `fn get_user(&self, id: u64) -> User`

### Boolean Functions
- **`is_` prefix**: `is_valid()`, `is_empty()`, `is_ready()`
- **`has_` prefix**: `has_permission()`, `has_data()`

### Private Functions
- **No special prefix**: Rust uses visibility modifiers (`fn private_func()`)

## Types

### Structs
- **PascalCase**: `struct UserService`, `struct PaymentProcessor`

### Enums
- **PascalCase enum**: `enum Status`
- **PascalCase variants**: `Status::Pending`, `Status::Complete`

### Type Aliases
- **PascalCase**: `type UserId = u64;`
- **Descriptive**: `type Result<T> = std::result::Result<T, Error>;`

### Traits
- **PascalCase**: `trait Serialize`, `trait FromStr`

## Modules

### Module Names
- **snake_case**: `mod user_service;`, `mod api_client;`

### Re-exports
- **Use concise names**: `pub use self::user_service::UserService;`

## Macros

### Macro Names
- **snake_case with `!`**: `macro_rules! vec`, `macro_rules! println!`
- **Descriptive**: `make_request!`, `define_api!`

## File Organization

```
src/
├── main.rs            # Binary entry point
├── lib.rs             # Library entry point
├── user_service.rs    # UserService module
├── api/
│   ├── mod.rs         # api module entry
│   ├── client.rs      # APIClient
│   └── types.rs       # API types
├── models/
│   ├── mod.rs
│   └── user.rs        # User struct
├── utils/
│   ├── mod.rs
│   └── format.rs      # Formatting utilities
└── error.rs           # Error types
```

## Special Naming

### Lifetimes
- **Short names for simple cases**: `'a`, `'b`, `'c`
- **Descriptive for complex cases**: `'session`, `'request`

### Generics
- **Single letter for simple**: `T`, `E`, `K`, `V`
- **Descriptive for complex**: `TResult`, `TInput`, `TError`

### Unsafe Blocks
- **Comment why unsafe**: `// SAFETY: pointer is valid because...`

## Safety Annotations

### `#[must_use]`
- Add to important types: `#[must_use] pub struct User { ... }`

### `#[non_exhaustive]`
- For evolving APIs: `#[non_exhaustive] pub struct Config { ... }`

## Best Practices

1. **Follow Rust API Guidelines** - https://rust-lang.github.io/api-guidelines/
2. **Be descriptive** - Names should reveal intent
3. **Avoid abbreviations** - `get_user` not `get_usr`
4. **Boolean prefixes**: `is_`, `has_`, `can_`, `should_`
5. **Result naming**: `Result<T>` for fallible operations

## Error Handling

### Error Types
- **PascalCase**: `enum Error`, `struct ParseError`

### Error Variants
- **snake_case**: `Error::InvalidInput`, `Error::ConnectionFailed`

### Result Types
- **Standard pattern**: `Result<T, Error>` or custom `Result<T>`

## Async Conventions

### Async Functions
- **Same naming as sync**: `get_user()` vs `async fn get_user()`

### Futures
- **Suffix optional**: `get_user()` returns `impl Future<Output = User>`

## Testing Conventions

### Test Functions
- **snake_case with test_ prefix**: `fn test_user_creation()`

### Test Modules
- **Same file**: `#[cfg(test)] mod tests { ... }`
- **Test file**: `tests/integration_test.rs`

## Common Patterns

### Builder Pattern
```rust
let user = UserBuilder::new()
    .name("John")
    .email("john@example.com")
    .build()?;
```

### Newtype Pattern
```rust
struct UserId(u64);  // PascalCase wrapper type
struct Email(String); // Strong typing for domain
```