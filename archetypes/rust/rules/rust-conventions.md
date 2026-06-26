---
name: rust-conventions
description: Rust project conventions — project layout, error handling, async patterns, naming, crate structure
tags: [rust, conventions]
---

# Rust Conventions

## Project Layout
- Binary: `src/main.rs` + `src/lib.rs` if shared logic
- Library: `src/lib.rs` with public API surface
- Workspace for multi-crate projects: `[workspace]` in root `Cargo.toml`
- Integration tests: `tests/` directory (one file per integration scenario)
- Benchmarks: `benches/` directory with `criterion` or `divan`
- Examples: `examples/` directory for usage demonstrations

## Naming
- Types (structs, enums, traits): `PascalCase`: `UserProfile`, `HttpClient`
- Functions, methods, variables: `snake_case`: `get_user`, `parse_config`
- Constants: `SCREAMING_SNAKE_CASE`: `MAX_RETRY_COUNT`
- Crates: single word, hyphenated if needed: `serde`, `tokio`, `axum`
- Feature flags: `snake_case` in `Cargo.toml`
- Avoid `as` keyword for type coercion — use `From`/`Into` traits

## Error Handling
- Use `thiserror` for library error types — derive `Error` + `Display`
- Use `anyhow` for application-level error handling with `Result<T>`
- Prefer `Result<T, E>` over `panic!` for recoverable errors
- Use `unwrap()` / `expect()` only in tests and prototypes
- Use `eyre` with `color-eyre` for rich error reporting in binaries
- Propagate errors with `?` operator — never `.ok()` or `.unwrap()` on fallible operations

## Async Patterns
- Use `tokio` as the default async runtime
- Use `tokio::select!` over `futures::join!` for cancellation
- Prefer `tokio::sync` channels (mpsc, broadcast, watch) over `std::sync::mpsc`
- Use `tokio::spawn` for CPU-bound work on `spawn_blocking`
- Avoid `async` in hot loops — batch operations instead

## Traits & Generics
- Prefer trait bounds on impl blocks over function signatures: `impl<T: Display>`
- Use `dyn` trait objects only when dynamic dispatch is required
- Implement `From`/`TryFrom` for conversions instead of custom `into_X` methods
- Derive common traits: `Debug`, `Clone`, `PartialEq`, `Serialize`, `Deserialize`

## Dependencies
- Pin major versions in `Cargo.toml`, use `cargo update` for minor bumps
- Use `cargo deny` or `cargo-audit` for dependency vulnerability scanning
- Split large crates into workspace members with focused responsibility
- Minimize feature flags — prefer small focused crates

## Linting & Formatting
- `rustfmt` with 100-char line width (configured in `rustfmt.toml`)
- `clippy` with `clippy::pedantic` and `clippy::nursery` enabled
- `cargo check` before every commit
- `cargo clippy -- -D warnings` in CI
