---
name: framework-conventions
description: FastAPI conventions — path operations, dependency injection, validation, async
tags: [python, fastapi, conventions, framework]
---

# FastAPI Framework Conventions

## Path Operations
- Use plural nouns for collection endpoints: `/users`, `/items`
- Use singular for single-resource: `/users/{user_id}`
- Tag operations by resource: `@router.get("/users", tags=["users"])`
- Group related endpoints in `routers/` directory

## Validation
- Use Pydantic v2 models for request/response schemas
- Use `Query()`, `Path()`, `Body()` for parameter documentation
- Use `Field(description=...)` for model field documentation
- Use `ConfigDict(strict=True)` on Pydantic models

## Dependency Injection
- Use `Depends()` for shared dependencies (auth, db sessions)
- Use `Annotated[Type, Depends()]` pattern (Python 3.10+)
- Keep dependency functions in `dependencies.py` or `core/deps.py`
- Use `yield` for database sessions with cleanup

## Async
- Use `async def` for all path operations
- Use async database drivers (asyncpg, databases, SQLAlchemy async)
- Use `BackgroundTasks` for post-response processing
- Avoid blocking calls in async endpoints
