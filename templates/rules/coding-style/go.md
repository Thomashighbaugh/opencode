---
name: coding-style
description: Go coding conventions — formatting, naming, error handling, package structure
tags: [go, golang, conventions, coding-style]
---

# Go Coding Style

## Formatting
- Use `gofmt` or `gofumpt` — never custom formatting
- Use `golangci-lint` with `revive`, `staticcheck`, `errcheck`, `govet`
- Run `go mod tidy` before every commit

## Naming
- **Exported:** PascalCase — `GetUser`, `NewClient`
- **Unexported:** camelCase — `getUser`, `maxRetries`
- **Acronyms:** all-caps in identifiers — `HTTPHandler`, `APIClient`, `DBConn`
- **Receiver names:** 1-2 chars, idiomatic — `s Server`, `h Handler`
- **Package names:** short, lowercase, singular — `user`, `db`, `httpclient`

## Error Handling
- Always check errors — never use `_` to discard
- Wrap errors: `fmt.Errorf("fetch user %d: %w", id, err)`
- Use `errors.Is()` / `errors.As()` for sentinel matching
- Define sentinels: `var ErrNotFound = errors.New("not found")`
- Return early, avoid deep `if err != nil` nesting

## Package Structure
- One package per directory
- `internal/` for private code (not importable externally)
- `cmd/` for binary entry points
- `pkg/` for shared library code
