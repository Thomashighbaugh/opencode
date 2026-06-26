---
name: cli-conventions
description: CLI tool conventions — argument parsing, error handling, output formatting, testing
tags: [cli, conventions]
---

# CLI Tool Conventions

## Argument Parsing
- Use dedicated argument parsing libraries: `clap` (Rust), `cobra` (Go), `commander`/`yargs` (Node)
- Support `--help` and `--version` flags
- Use subcommands for multi-operation CLIs
- Environment variables for config over `--flag` where appropriate

## Error Handling
- Exit codes: 0 for success, 1 for general errors, 2 for usage errors
- Error messages go to stderr, output to stdout
- Use structured error types (Rust `thiserror`/`anyhow`, Go `errors` package)
- Never panic/crash on user input errors

## Output Formatting
- Support `--json` flag for machine-readable output
- Use colored output with `--no-color` flag for CI compatibility
- Progress indicators for long-running operations (controlled by `--quiet`/`--verbose`)
- Tables for listing commands, aligned columns

## Testing
- Integration tests that run the compiled binary
- Golden file tests for output comparison
- Test both success and error paths
- CI must build and test across supported platforms

## Nix Flake Development Shell
- A `flake.nix` is provided for reproducible cross-language toolchain
- Use `nix develop` to enter the shell with Node.js, `just`, and CI tools
- Use `just` as the task runner (defined in `justfile`)
- CI commands: `nix develop --command just build` and `nix develop --command just test`

## Task Runner (just)
- Use `just` as a language-agnostic task runner over Make
- Common recipes: `build`, `test`, `lint`, `clean`, `release`
- Keeps CI and local dev on the same commands
