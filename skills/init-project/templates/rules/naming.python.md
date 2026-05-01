# Naming Conventions - Python

## Files

### Modules
- **snake_case**: `user_service.py`, `api_client.py`
- **One class per file**: File name matches class name (lowercase)

### Tests
- **test_ prefix**: `test_user_service.py`
- **Test directories**: `tests/` or module-level `test_*.py`

### Packages
- **Lowercase**: `mypackage/`, `api/`
- **No underscores**: Prefer `myproject` not `my_project` in package names

## Variables

### Local Variables
- **snake_case**: `user_name = "John"`
- **Descriptive**: `is_loading`, `has_error`, `user_count`

### Constants
- **SCREAMING_SNAKE_CASE**: `MAX_RETRIES`, `API_BASE_URL`
- **Module-level**: `DEFAULT_TIMEOUT = 5000`

### Private Variables
- **Single underscore**: `_private_var` (convention)
- **Double underscore**: `__private_var` (name mangling)

## Functions

### Function Names
- **snake_case**: `get_user_profile()`, `calculate_total()`
- **Async**: `async def fetch_user()`, `async def load_data()`
- **Boolean returns**: `is_valid()`, `has_permission()`, `can_edit()`

### Private Methods
- **Underscore prefix**: `def _private_method(self):`

### Property Methods
- **snake_case**: `@property def user_name(self):`

## Classes

### Class Names
- **PascalCase**: `UserService`, `PaymentProcessor`
- **No underscores**: `PaymentProcessor` not `Payment_Processor`

### Class Variables
- **snake_case**: `default_timeout`, `max_connections`

### Instance Variables
- **snake_case**: `self.user_name`, `self._private_data`

### Methods
- **snake_case**: `def get_user(self, user_id):`

## Type Hints

### Type Aliases
- **PascalCase**: `UserId = int`, `UserProfile = dict[str, Any]`

### Generic Types
- **Descriptive**: `T`, `K`, `V` (single letter for simple generics)
- **Descriptive**: `TResult`, `TInput` (descriptive for complex generics)

## Packages and Imports

### Import Ordering
```python
# Standard library
import os
import sys
from pathlib import Path

# Third-party
import requests
from fastapi import FastAPI

# Local
from mypackage import module
from mypackage.submodule import Class
```

### Import Names
- **Keep original names**: `import requests` (not `import requests as req`)
- **From imports**: `from typing import Optional, Dict`

## File Organization

```
src/
├── __init__.py          # Package init
├── user_service.py     # UserService class
├── api_client.py       # APIClient class
├── utils/
│   ├── __init__.py
│   ├── format.py       # Formatting utilities
│   └── parse.py        # Parsing utilities
├── models/
│   ├── __init__.py
│   └── user.py         # User model
├── services/
│   ├── __init__.py
│   └── auth.py         # Auth service
└── constants/
    └── __init__.py      # Constants
```

## Special Naming

### Dunder Methods
- **Prescribed names**: `__init__`, `__str__`, `__eq__`, `__repr__`

### Magic Methods
- **Operator overloads**: `__add__`, `__len__`, `__iter__`

### Protected Attributes
- **Single underscore**: `_protected_attr` (convention, not enforced)

### Name Mangling
- **Double underscore**: `__private_attr` (becomes `_ClassName__private_attr`)

## Best Practices

1. **Follow PEP 8** - Python Enhancement Proposal 8 is the style guide
2. **Be descriptive** - Names should reveal intent
3. **Avoid single letters** - Except for loop counters (`i`, `j`)
4. **Boolean prefixes**: `is_`, `has_`, `can_`, `should_`
5. **Function naming**: Use verbs (`get_`, `set_`, `create_`, `delete_`)

## Type Annotations

```python
# Function with type hints
def get_user(user_id: int) -> Optional[User]:
    ...

# Generic types
from typing import TypeVar, Generic

T = TypeVar('T')

class Container(Generic[T]):
    def get(self) -> T:
        ...
```

## Django Conventions

### Models
- **PascalCase model**: `class UserProfile(models.Model):`
- **snake_case fields**: `user_name = models.CharField()`

### Views
- **snake_case**: `def user_detail(request, user_id):`

### URLs
- **kebab-case in URLs**: `/user-profile/<int:user_id>/`

## FastAPI Conventions

### Routers
- **snake_case file**: `user_router.py`
- **PascalCase prefix**: `router = APIRouter(prefix="/users")`

### Pydantic Models
- **PascalCase**: `class UserCreate(BaseModel):`
- **snake_case fields**: `user_name: str`