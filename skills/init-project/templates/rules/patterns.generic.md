# Architecture Patterns - Generic

Use these patterns when no language-specific patterns are available or for mixed-language projects.

## Project Structure

### Layer-Based Organization
```
src/
├── presentation/         # UI/Controllers
│   ├── components/
│   ├── pages/
│   └── handlers/
├── application/          # Use Cases/Services
│   ├── services/
│   └── commands/
├── domain/              # Business Logic
│   ├── entities/
│   ├── value_objects/
│   └── services/
└── infrastructure/      # External Services
    ├── persistence/
    ├── messaging/
    └── external/
```

### Feature-Based Organization
```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── services/
│   │   ├── models/
│   │   └── tests/
│   ├── users/
│   └── products/
├── core/
│   ├── utils/
│   ├── config/
│   └── types/
└── shared/
    └── components/
```

## Separation of Concerns

### Presentation Layer
- User interface components
- Input validation
- View rendering
- User interaction handling

### Application Layer
- Use case orchestration
- Transaction management
- Authorization checks
- Cross-cutting concerns

### Domain Layer
- Business rules
- Entity relationships
- Domain events
- Validation logic

### Infrastructure Layer
- Database access
- External API calls
- Messaging systems
- File system access

## Repository Pattern

### Interface Definition
```
Repository<T> {
    findById(id): T | null
    findAll(): List<T>
    save(entity: T): T
    delete(id): void
}
```

### Implementation Strategies
- Memory-based (testing)
- Database-backed (production)
- Cache-decorated (performance)

## Service Patterns

### Application Service
- Coordinates use cases
- Manages transactions
- Returns DTOs
- No business logic

### Domain Service
- Contains business logic
- Works with entities
- Pure functions
- No infrastructure dependencies

### Infrastructure Service
- External integrations
- Third-party APIs
- Message queues
- Email sending

## Dependency Injection

### Constructor Injection
```
UserService(repository: UserRepository, 
            cache: CacheService,
            logger: Logger) {
    this.repository = repository
    this.cache = cache
    this.logger = logger
}
```

### Factory Pattern
```
UserServiceFactory {
    static create(config: Config): UserService {
        repo = RepositoryFactory.create(config)
        cache = CacheFactory.create(config)
        return new UserService(repo, cache, logger)
    }
}
```

## Error Handling Patterns

### Result Type
```
Result<T, E> {
    success: boolean
    value?: T
    error?: E
}

// Usage
function getUser(id): Result<User, Error> {
    try {
        user = repository.find(id)
        return Result.ok(user)
    } catch (e) {
        return Result.fail(e)
    }
}
```

### Error Types
```
ValidationError { field, message }
NotFoundError { resource, id }
AuthorizationError { message }
InternalError { cause }
```

## Testing Patterns

### Unit Tests
- Test single function/method
- Mock dependencies
- Fast execution
- Isolated from external systems

### Integration Tests
- Test component interactions
- Use test databases
- Test boundaries

### E2E Tests
- Test user flows
- Full system stack
- Browser/API testing

## Configuration Patterns

### Environment Variables
```
DATABASE_URL=postgres://...
API_KEY=secret
LOG_LEVEL=info
PORT=3000
```

### Configuration Class
```
Config {
    database: DatabaseConfig
    api: ApiConfig
    logging: LoggingConfig
    
    static fromEnv(): Config {
        return new Config(
            DatabaseConfig.fromEnv(),
            ApiConfig.fromEnv(),
            LoggingConfig.fromEnv()
        )
    }
}
```

## API Design Patterns

### RESTful Endpoints
```
GET    /users          # List users
GET    /users/:id      # Get user
POST   /users          # Create user
PUT    /users/:id      # Update user
DELETE /users/:id      # Delete user
```

### Request/Response Patterns
```
# Pagination
GET /users?page=1&limit=20

# Response
{
    "data": [...],
    "meta": {
        "page": 1,
        "limit": 20,
        "total": 100
    }
}

# Filtering
GET /users?status=active&role=admin

# Sorting
GET /users?sort=name&order=asc
```

## Caching Patterns

### Cache-Aside
```
function getUser(id) {
    cached = cache.get(id)
    if cached return cached
    
    user = database.find(id)
    cache.set(id, user, ttl)
    return user
}
```

### Write-Through
```
function saveUser(user) {
    database.save(user)
    cache.set(user.id, user, ttl)
}
```

## Concurrency Patterns

### Thread Safety
- Use immutable data structures
- Synchronize shared mutable state
- Use atomic operations for counters
- Prefer message passing over shared memory

### Async Patterns
- Event loops for I/O-bound work
- Thread pools for CPU-bound work
- Coroutines/futures for sequential async code

## Logging Patterns

### Structured Logging
```
{
    "timestamp": "2024-01-15T10:30:00Z",
    "level": "INFO",
    "service": "user-service",
    "trace_id": "abc123",
    "message": "User created",
    "user_id": 123
}
```

### Log Levels
- ERROR: Application failures
- WARN: Unexpected but recoverable
- INFO: Key business events
- DEBUG: Detailed diagnostic info
- TRACE: Very detailed debugging

## Security Patterns

### Authentication
- Verify identity (who)
- Token-based (JWT, OAuth)
- Session-based

### Authorization
- Verify permissions (what)
- Role-based (RBAC)
- Attribute-based (ABAC)
- Resource-based

### Input Validation
- Validate at boundaries
- Sanitize all inputs
- Use allowlists not blocklists

## Documentation Patterns

### API Documentation
- OpenAPI/Swagger specifications
- Request/response examples
- Error codes and messages

### Code Documentation
- Document intent, not implementation
- Keep docs near code
- Update when code changes

## Best Practices

1. **Keep layers separate** - Don't mix concerns
2. **Dependency injection** - Don't hardcode dependencies
3. **Interface segregation** - Small, focused interfaces
4. **Single responsibility** - One reason to change
5. **Test at appropriate level** - More unit, fewer E2E