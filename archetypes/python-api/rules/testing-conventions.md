---
name: testing-conventions
description: Pytest conventions for Python API projects
tags: [testing, pytest, python]
---

# Testing Conventions

## Pytest
- Use `pytest` as the test runner
- Test files: `test_*.py` in `tests/` directory
- Use `pytest-asyncio` for async test support
- Use `pytest-cov` for coverage reporting

## Fixtures
- Prefer `conftest.py` for shared fixtures
- Scope fixtures appropriately (session, module, function)
- Use `factory_boy` for model factories over raw fixtures

## Mocking
- Use `unittest.mock` or `pytest-mock`
- Mock at the adapter boundary, not the domain layer
- Prefer dependency injection over monkey-patching

## Test Structure
- Arrange → Act → Assert pattern
- One assertion per test case where practical
- Use parametrize for testing multiple inputs
