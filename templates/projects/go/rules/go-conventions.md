---
name: go-conventions
description: Go project conventions — project layout, error handling, naming, concurrency patterns
tags: [go, golang, conventions]
---

# Go Conventions

## Project Layout
- Follow the standard Go project layout: `cmd/`, `internal/`, `pkg/`, `api/`
- `cmd/` — main application entry points, one directory per binary
- `internal/` — private application code (not importable by external projects)
- `pkg/` — public library code that external projects can import
- `api/` — API definitions (protobuf, OpenAPI, etc.)

## Naming
- Use `camelCase` for unexported, `PascalCase` for exported
- Acronyms are all-caps: `HTTPHandler`, `APIClient`, `DBConn`
- Single-letter receiver names are idiomatic: `s` for `Server`, `h` for `Handler`
- Package names are short, lowercase, singular: `user`, `db`, `httpclient`

## Error Handling
- Always check errors — never use `_` to discard an error
- Wrap errors with context: `fmt.Errorf("fetch user %d: %w", id, err)`
- Use `errors.Is()` / `errors.As()` for sentinel error matching
- Define sentinel errors with `var ErrNotFound = errors.New("not found")`
- Return early, avoid deep nesting

## Concurrency
- Use `sync.WaitGroup` or `errgroup` for goroutine coordination
- Use `context.Context` as the first parameter for cancellation
- Use `sync.RWMutex` over `sync.Mutex` when reads dominate
- Prefer channels for communication, mutexes for state protection
- Race detector must pass: `go test -race ./...`

## Testing
- Use `testing` package with `go test` runner
- Table-driven tests for multiple input/output cases
- Use `testify/assert` or `testify/require` for assertions
- Integration tests in `tests/` directory with `//go:build integration` tag
- Fuzz tests for parsing and encoding functions

## Modules & Dependencies
- One `go.mod` at module root; multi-module repos use workspace mode
- Pin major versions in `go.mod`, use `go mod tidy` before commits
- Use `replace` directives sparingly (local development only)
- Vendoring: avoid unless required by build environment

## Linting & Formatting
- `gofumpt` for strict formatting over `gofmt`
- `golangci-lint` with `revive`, `staticcheck`, `errcheck`, `govet` enabled
- `go mod tidy` in CI to catch dependency drift
