---
name: testing-conventions
description: Rust testing conventions — unit, integration, doc-tests, property-based, benchmarking
tags: [testing, rust]
---

# Testing Conventions

## Unit Tests
- Inline in each module: `#[cfg(test)] mod tests { ... }`
- Co-located with source: `src/handler.rs` → `#[cfg(test)]` in same file
- Use `assert_eq!`, `assert!`, `assert_ne!` for basic assertions
- Use `quickcheck` or `proptest` for property-based testing
- Use `mockall` for trait mocking (or `unimock` for lighter weight)

## Integration Tests
- `tests/` directory at crate root, one file per integration scenario
- Use `cargo test --test integration_test_name` to run specific suites
- Shared test helpers in `tests/common/mod.rs`
- Database tests: use `testcontainers` or SQLite in-memory

## Doc Tests
- Document public API with code examples in doc comments: `/// ````
- Doc tests run with `cargo test --doc`
- Mark examples that should not compile: `/// ```compile_fail`
- Keep doc tests runnable in CI

## Benchmarking
- Use `criterion` or `divan` for stable benchmarks
- Benchmark in `benches/` directory
- Compare against known baselines in CI
- Use `cargo bench` for the default benchmark suite

## Testing Tools
- `cargo nextest` for parallel test execution (replace `cargo test` in CI)
- `cargo tarpaulin` for code coverage
- `cargo fuzz` for fuzz testing — `cargo fuzz run fuzz_target`
- `cargo insta` for snapshot testing

## Coverage
- `cargo tarpaulin --out Html --output-dir coverage/`
- Aim for 80%+ on library crates
- Aim for 50%+ on binary entry points
