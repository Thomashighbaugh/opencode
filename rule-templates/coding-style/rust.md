---
name: coding-style
description: Rust coding conventions — clippy, naming, error discipline, traits
tags: [rust, conventions, coding-style]
---

# Rust Coding Style

## Clippy Lints
- Enable `clippy::pedantic` and `clippy::nursery` in CI
- Use `#[allow(clippy::...)]` over disabling globally
- Run `cargo clippy -- -D warnings` before every commit

## Naming
- **Types (structs, enums, traits):** PascalCase — `UserProfile`, `HttpClient`
- **Functions, methods, variables:** snake_case — `get_user`, `max_count`
- **Constants:** SCREAMING_SNAKE_CASE — `MAX_RETRY_COUNT`
- **Type parameters:** short uppercase — `T`, `E`, `Item`
- **Lifetime parameters:** single lowercase — `'a`, `'ctx`

## Error Discipline
- Use `thiserror` for library error types
- Use `anyhow` for application-level errors
- Prefer `Result<T, E>` over `panic!` for recoverable errors
- Use `?` operator to propagate — never `.unwrap()` in production code
- Use `.expect("message")` only in tests and setup code

## Traits
- Derive `Debug`, `Clone`, `PartialEq` on all data types
- Use `impl Trait` in argument position over generics where simple
- Use `dyn Trait` only when dynamic dispatch is needed
- Implement `From`/`TryFrom` for conversions over custom `into_*` methods
