---
name: coding-style
description: Python coding conventions — type hints, PEP 8, naming, project structure
tags: [python, conventions, coding-style]
---

# Python Coding Style

## Type Hints
- Use Python 3.10+ type hint syntax: `str | None` over `Optional[str]`
- Use `Self` return type for class methods returning `self`
- Use `dataclasses` or `Pydantic` for data containers
- Use `TypeVar` for generics, `Protocol` for structural typing

## Naming
- **Classes:** PascalCase — `UserService`, `DatabaseClient`
- **Functions/variables:** snake_case — `get_user`, `max_retries`
- **Constants:** UPPER_SNAKE_CASE — `MAX_CONNECTIONS`
- **Private:** Prefix with `_` — `_internal_helper()`
- **Dunder methods:** Use only for standard protocols

## Formatting & Linting
- Format with Ruff or Black — 88 char line width
- Sort imports with `isort` or Ruff's import sorting
- Run Ruff before every commit
- Max line length 88 (Black default)

## Project Structure
- One class per file for non-trivial classes
- `__init__.py` exports public API surface
- Business logic in `service/` or `core/` directory
- Keep `main.py` / entry points thin
