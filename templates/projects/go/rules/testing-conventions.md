---
name: testing-conventions
description: Go testing conventions — unit, integration, fuzz, and benchmark tests
tags: [testing, go, golang]
---

# Testing Conventions

## Test Placement
- Unit tests: co-located in the same package as the source: `handler_test.go` beside `handler.go`
- Integration tests: `tests/` directory root, with build tags
- Test helpers: `testutil/` package or `_test.go` files with `export_test.go` for internal access

## Naming
- Test functions: `TestFunctionName_caseDescription`
- Table tests: `TestFunctionName` with subtest names in `t.Run("case name", ...)`
- Example functions: `ExampleFunctionName` in `example_test.go`

## Patterns
- Table-driven tests: `tests []struct{ name string; args ...; want ... }`
- Use `t.Parallel()` for independent tests
- Use `testify/suite` for setup/teardown shared state
- Golden files for complex output comparison (`testdata/*.golden`)

## Coverage
- `go test -coverprofile=coverage.out ./...`
- `go tool cover -html=coverage.out` for visual report
- Aim for 80%+ on `internal/` packages
- Aim for 50%+ on `cmd/` packages (thin main functions)

## Benchmarks
- `BenchmarkFunctionName` in `_test.go`
- Use `b.ReportAllocs()` to track allocation counts
- Run with `go test -bench=. -benchmem`
