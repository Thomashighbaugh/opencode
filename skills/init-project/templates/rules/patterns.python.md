# Architecture Patterns - Python

## Project Structure

### Feature-Based Organization
```
src/
├── features/              # Feature modules
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── routes.py      # FastAPI routes
│   │   ├── services.py    # Business logic
│   │   ├── models.py      # Domain models
│   │   └── schemas.py     # Pydantic schemas
│   └── users/
├── core/                  # Shared utilities
│   ├── __init__.py
│   ├── config.py
│   ├── security.py
│   └── database.py
├── models/                # Database models
├── schemas/               # API schemas
└── tests/
```

### Layer-Based Organization
```
src/
├── api/                   # Routes/Controllers
│   ├── __init__.py
│   └── endpoints/
├── domain/               # Business logic
│   ├── __init__.py
│   └── services/
├── infrastructure/       # External services
│   ├── __init__.py
│   └── repositories/
└── models/              # Data models
    └── __init__.py
```

## Class Patterns

### Data Classes
```python
from dataclasses import dataclass
from datetime import datetime

@dataclass
class User:
    id: int
    name: str
    email: str
    created_at: datetime
    
    def __post_init__(self):
        if '@' not in self.email:
            raise ValueError("Invalid email")
```

### Pydantic Models
```python
from pydantic import BaseModel, EmailStr, validator

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True  # SQLAlchemy v2
```

### Service Pattern
```python
class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository
    
    async def get_user(self, user_id: int) -> User:
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        return user
    
    async def create_user(self, data: UserCreate) -> User:
        # Validate business rules
        if await self.repository.exists_by_email(data.email):
            raise EmailAlreadyExistsError(data.email)
        
        # Hash password
        hashed_password = hash_password(data.password)
        
        # Create user
        user = await self.repository.create(
            name=data.name,
            email=data.email,
            password=hashed_password
        )
        return user
```

### Repository Pattern
```python
from abc import ABC, abstractmethod

class UserRepository(ABC):
    @abstractmethod
    async def get_by_id(self, user_id: int) -> User | None:
        pass
    
    @abstractmethod
    async def get_by_email(self, email: str) -> User | None:
        pass
    
    @abstractmethod
    async def create(self, **kwargs) -> User:
        pass

class SQLAlchemyUserRepository(UserRepository):
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, user_id: int) -> User | None:
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def create(self, **kwargs) -> User:
        user = UserModel(**kwargs)
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return User.from_orm(user)
```

## Dependency Injection

### FastAPI Dependencies
```python
from fastapi import Depends

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    user = await verify_token(token, db)
    if not user:
        raise HTTPException(status_code=401)
    return user

# Usage
@router.get("/users/me")
async def get_me(user: User = Depends(get_current_user)):
    return user
```

### Factory Pattern
```python
class ServiceFactory:
    @staticmethod
    def create_user_service(db: AsyncSession) -> UserService:
        repository = SQLAlchemyUserRepository(db)
        return UserService(repository)
    
    @staticmethod
    def create_auth_service(db: AsyncSession) -> AuthService:
        user_repo = SQLAlchemyUserRepository(db)
        token_repo = SQLAlchemyTokenRepository(db)
        return AuthService(user_repo, token_repo)
```

## Error Handling Patterns

### Custom Exceptions
```python
class AppException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class NotFoundError(AppException):
    def __init__(self, resource: str, identifier: str | int):
        super().__init__(f"{resource} not found: {identifier}", 404)

class ValidationError(AppException):
    def __init__(self, errors: list[dict]):
        super().__init__("Validation failed", 422)
        self.errors = errors

# Exception handler
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.message}
    )
```

### Result Pattern
```python
from typing import Generic, TypeVar, Union

T = TypeVar('T')
E = TypeVar('E')

class Result(Generic[T, E]):
    def __init__(self, success: bool, value: T | None = None, error: E | None = None):
        self.success = success
        self.value = value
        self.error = error
    
    @staticmethod
    def ok(value: T) -> 'Result[T, E]':
        return Result(success=True, value=value)
    
    @staticmethod
    def fail(error: E) -> 'Result[T, E]':
        return Result(success=False, error=error)

# Usage
async def get_user(user_id: int) -> Result[User, str]:
    user = await repository.get_by_id(user_id)
    if not user:
        return Result.fail("User not found")
    return Result.ok(user)
```

## Async Patterns

### Async Context Managers
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def get_db_session():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

# Usage
async with get_db_session() as db:
    user = await db.execute(select(User))
```

### Async Generators
```python
async def get_users_paginated(
    db: AsyncSession,
    page_size: int = 100
) -> AsyncGenerator[list[User], None]:
    offset = 0
    while True:
        users = await db.execute(
            select(User).limit(page_size).offset(offset)
        )
        users = users.scalars().all()
        if not users:
            break
        yield users
        offset += page_size
```

## Testing Patterns

### Pytest Fixtures
```python
import pytest

@pytest.fixture
async def db_session():
    async with async_session() as session:
        yield session

@pytest.fixture
def user_repository(db_session: AsyncSession):
    return SQLAlchemyUserRepository(db_session)

@pytest.fixture
def user_service(user_repository: UserRepository):
    return UserService(user_repository)

# Tests
@pytest.mark.asyncio
async def test_create_user(user_service: UserService):
    user_data = UserCreate(name="Test", email="test@example.com", password="password123")
    user = await user_service.create_user(user_data)
    assert user.id is not None
    assert user.name == "Test"
```

### Mocking
```python
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_get_user_not_found():
    repository = AsyncMock(spec=UserRepository)
    repository.get_by_id.return_value = None
    
    service = UserService(repository)
    
    with pytest.raises(UserNotFoundError):
        await service.get_user(999)
```

## FastAPI Specific Patterns

### Router Organization
```python
# api/endpoints/users.py
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user)
):
    ...

# main.py
from api.endpoints import users

app = FastAPI()
app.include_router(users.router)
```

### Dependency Overrides
```python
# For testing
app.dependency_overrides[get_db] = get_test_db
app.dependency_overrides[get_current_user] = get_test_user

# After tests
app.dependency_overrides.clear()
```

## Django Patterns

### Model Layer
```python
# models.py
class User(AbstractUser):
    phone = models.CharField(max_length=20, blank=True)
    
    class Meta:
        db_table = 'users'
    
    def get_full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
```

### Service Layer
```python
# services.py
class UserService:
    @staticmethod
    @transaction.atomic
    def create_user(email: str, name: str) -> User:
        user = User.objects.create_user(username=email, email=email, first_name=name)
        Profile.objects.create(user=user)
        return user
```

### View Layer
```python
# views.py
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
```