---
name: python-conventions
description: Python project conventions — type hints, async patterns, project structure
tags: [python, conventions]
---

# Python Conventions

## Type Hints
- Use type hints on all function signatures (Python 3.10+ syntax)
- Use `|` for unions: `str | None` over `Optional[str]`
- Use `Self` return type for class methods
- Use `dataclasses` or `Pydantic` models for data containers

## Async Patterns
- Use `async def` for I/O-bound functions
- Use `asyncio` or `anyio` for concurrency
- Use `httpx.AsyncClient` for async HTTP requests
- Database queries should use async drivers (asyncpg, databases, SQLAlchemy async)

## Project Structure
- `src/` package layout for application code
- `tests/` mirroring the `src/` structure
- `app/` for web application code (FastAPI/Django)
- `core/` for business logic
- `infra/` for database, cache, external service adapters

## Package Management (uv)
- Use `uv` as the primary package manager over `pip` or `poetry`
- Project metadata in `pyproject.toml` — avoid `requirements.txt` for production
- Use `uv add <package>` to add dependencies, `uv remove <package>` to remove
- Use `uv sync` to install all dependencies from `pyproject.toml` + `uv.lock`
- Use `uv lock` to update lockfile without syncing
- Use `uv run <command>` to run scripts in the venv without explicit activation
- Commit `uv.lock` to version control for reproducible builds
- Virtual environments live in `.venv/` at project root (gitignored)

## Nix Flake Development Shell
- A `flake.nix` is provided for reproducible development environment
- Use `nix develop` to enter the shell with pinned Python version, uv, and tools
- The flake auto-creates a virtual environment with `uv venv` on entry
- All linting tools (ruff, mypy, pytest) are available through the flake
- CI can use `nix develop --command uv run pytest` for reproducible testing

## Coding Standards
- Follow PEP 8 (enforced by Ruff)
- Use `snake_case` for functions and variables
- Use `PascalCase` for classes
- Use `UPPER_CASE` for constants
- Docstrings: Google style for public APIs
