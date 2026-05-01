# Architecture Patterns - Go

## Project Structure

### Standard Layout
```
cmd/
├── myapp/
│   └── main.go          # Application entry point
internal/
├── user/
│   ├── user.go          # User domain
│   ├── service.go       # Business logic
│   └── repository.go    # Data access
├── auth/
│   └── auth.go
pkg/
├── utils/
│   └── format.go        # Public utilities
api/
└── handler/
    └── user.go          # HTTP handlers
go.mod
go.sum
```

### Domain-Driven Design
```
domain/
├── user/
│   ├── entity.go        # Domain entities
│   ├── value_object.go  # Value objects
│   ├── repository.go    # Repository interfaces
│   └── service.go       # Domain services
application/
├── user/
│   ├── service.go       # Application services
│   └── dto.go           # Data transfer objects
infrastructure/
├── persistence/
│   └── user_repo.go     # Repository implementations
presentation/
├── http/
│   └── user_handler.go  # HTTP handlers
```

## Interface Patterns

### Repository Interface
```go
type UserRepository interface {
    GetByID(ctx context.Context, id int64) (*User, error)
    GetByEmail(ctx context.Context, email string) (*User, error)
    Save(ctx context.Context, user *User) error
    Delete(ctx context.Context, id int64) error
}

// Implementation
type PostgresUserRepository struct {
    db *sql.DB
}

func (r *PostgresUserRepository) GetByID(ctx context.Context, id int64) (*User, error) {
    query := `SELECT id, name, email, created_at FROM users WHERE id = $1`
    row := r.db.QueryRowContext(ctx, query, id)
    
    var user User
    err := row.Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt)
    if err == sql.ErrNoRows {
        return nil, ErrNotFound
    }
    if err != nil {
        return nil, err
    }
    return &user, nil
}
```

### Service Interface
```go
type UserService interface {
    Create(ctx context.Context, cmd CreateUserCommand) (*User, error)
    GetByID(ctx context.Context, id int64) (*User, error)
    Update(ctx context.Context, cmd UpdateUserCommand) (*User, error)
    Delete(ctx context.Context, id int64) error
}

// Implementation
type userService struct {
    repo UserRepository
}

func NewUserService(repo UserRepository) UserService {
    return &userService{repo: repo}
}

func (s *userService) Create(ctx context.Context, cmd CreateUserCommand) (*User, error) {
    if err := cmd.Validate(); err != nil {
        return nil, err
    }
    
    user := &User{
        Name:  cmd.Name,
        Email: cmd.Email,
    }
    
    if err := s.repo.Save(ctx, user); err != nil {
        return nil, err
    }
    
    return user, nil
}
```

## Error Handling

### Custom Error Types
```go
type AppError struct {
    Code    int
    Message string
    Err     error
}

func (e *AppError) Error() string {
    if e.Err != nil {
        return fmt.Sprintf("%s: %v", e.Message, e.Err)
    }
    return e.Message
}

func (e *AppError) Unwrap() error {
    return e.Err
}

// Domain errors
var (
    ErrNotFound      = &AppError{Code: 404, Message: "resource not found"}
    ErrBadRequest    = &AppError{Code: 400, Message: "bad request"}
    ErrUnauthorized  = &AppError{Code: 401, Message: "unauthorized"}
    ErrInternal      = &AppError{Code: 500, Message: "internal error"}
)

// Helper functions
func NewValidationError(field, message string) error {
    return &AppError{
        Code:    400,
        Message: fmt.Sprintf("validation error on %s: %s", field, message),
    }
}
```

### Error Wrapping
```go
func (s *userService) GetByID(ctx context.Context, id int64) (*User, error) {
    user, err := s.repo.GetByID(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("failed to get user: %w", err)
    }
    return user, nil
}

// Checking errors
if errors.Is(err, ErrNotFound) {
    // Handle not found
}

var appErr *AppError
if errors.As(err, &appErr) {
    // Handle app error
}
```

## Dependency Injection

### Constructor Injection
```go
type UserService struct {
    repo   UserRepository
    cache  Cache
    logger *slog.Logger
}

func NewUserService(repo UserRepository, cache Cache, logger *slog.Logger) *UserService {
    return &UserService{
        repo:   repo,
        cache:  cache,
        logger: logger,
    }
}
```

### Functional Options
```go
type Config struct {
    Timeout time.Duration
    Retries int
}

type Option func(*Config)

func WithTimeout(timeout time.Duration) Option {
    return func(c *Config) {
        c.Timeout = timeout
    }
}

func WithRetries(retries int) Option {
    return func(c *Config) {
        c.Retries = retries
    }
}

func NewUserService(repo UserRepository, opts ...Option) *UserService {
    config := &Config{
        Timeout: 30 * time.Second,
        Retries: 3,
    }
    for _, opt := range opts {
        opt(config)
    }
    return &UserService{repo: repo, config: config}
}

// Usage
service := NewUserService(repo, WithTimeout(60*time.Second), WithRetries(5))
```

## HTTP Handler Patterns

### Handler Structure
```go
type UserHandler struct {
    service UserService
}

func NewUserHandler(service UserService) *UserHandler {
    return &UserHandler{service: service}
}

func (h *UserHandler) RegisterRoutes(r *mux.Router) {
    r.HandleFunc("/users", h.List).Methods("GET")
    r.HandleFunc("/users/{id}", h.Get).Methods("GET")
    r.HandleFunc("/users", h.Create).Methods("POST")
    r.HandleFunc("/users/{id}", h.Update).Methods("PUT")
    r.HandleFunc("/users/{id}", h.Delete).Methods("DELETE")
}

func (h *UserHandler) Get(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    id, err := strconv.ParseInt(vars["id"], 10, 64)
    if err != nil {
        respondError(w, http.StatusBadRequest, "invalid id")
        return
    }
    
    user, err := h.service.GetByID(r.Context(), id)
    if err != nil {
        if errors.Is(err, ErrNotFound) {
            respondError(w, http.StatusNotFound, "user not found")
            return
        }
        respondError(w, http.StatusInternalServerError, "internal error")
        return
    }
    
    respondJSON(w, http.StatusOK, user)
}
```

### Middleware Pattern
```go
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token == "" {
            respondError(w, http.StatusUnauthorized, "missing token")
            return
        }
        
        user, err := VerifyToken(token)
        if err != nil {
            respondError(w, http.StatusUnauthorized, "invalid token")
            return
        }
        
        ctx := context.WithValue(r.Context(), UserKey, user)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

func LoggingMiddleware(logger *slog.Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            next.ServeHTTP(w, r)
            logger.Info("request",
                "method", r.Method,
                "path", r.URL.Path,
                "duration", time.Since(start),
            )
        })
    }
}
```

## Context Patterns

### Context Values
```go
type contextKey string

const UserKey contextKey = "user"

func UserFromContext(ctx context.Context) (*User, bool) {
    user, ok := ctx.Value(UserKey).(*User)
    return user, ok
}

func ContextWithUser(ctx context.Context, user *User) context.Context {
    return context.WithValue(ctx, UserKey, user)
}
```

### Timeout Pattern
```go
func (s *userService) GetByID(ctx context.Context, id int64) (*User, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()
    
    return s.repo.GetByID(ctx, id)
}
```

## Testing Patterns

### Table-Driven Tests
```go
func TestUserService_Create(t *testing.T) {
    tests := []struct {
        name    string
        cmd     CreateUserCommand
        wantErr error
    }{
        {
            name: "valid user",
            cmd:  CreateUserCommand{Name: "John", Email: "john@example.com"},
        },
        {
            name:    "empty name",
            cmd:     CreateUserCommand{Name: "", Email: "john@example.com"},
            wantErr: ErrBadRequest,
        },
        {
            name:    "invalid email",
            cmd:     CreateUserCommand{Name: "John", Email: "invalid"},
            wantErr: ErrBadRequest,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            service := NewUserService(NewMockRepository())
            _, err := service.Create(context.Background(), tt.cmd)
            
            if tt.wantErr != nil {
                if !errors.Is(err, tt.wantErr) {
                    t.Errorf("expected error %v, got %v", tt.wantErr, err)
                }
            } else {
                if err != nil {
                    t.Errorf("unexpected error: %v", err)
                }
            }
        })
    }
}
```

### Mock Implementation
```go
type MockUserRepository struct {
    users map[int64]*User
}

func NewMockRepository() *MockUserRepository {
    return &MockUserRepository{users: make(map[int64]*User)}
}

func (m *MockUserRepository) GetByID(ctx context.Context, id int64) (*User, error) {
    user, ok := m.users[id]
    if !ok {
        return nil, ErrNotFound
    }
    return user, nil
}

func (m *MockUserRepository) Save(ctx context.Context, user *User) error {
    user.ID = int64(len(m.users) + 1)
    m.users[user.ID] = user
    return nil
}
```

## Concurrency Patterns

### Worker Pool
```go
func ProcessItems(ctx context.Context, items []Item, workers int) error {
    jobs := make(chan Item, len(items))
    results := make(chan Result, len(items))
    
    var wg sync.WaitGroup
    
    for i := 0; i < workers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for item := range jobs {
                results <- processItem(ctx, item)
            }
        }()
    }
    
    for _, item := range items {
        jobs <- item
    }
    close(jobs)
    
    go func() {
        wg.Wait()
        close(results)
    }()
    
    for result := range results {
        if result.Err != nil {
            return result.Err
        }
    }
    return nil
}
```

## Best Practices

1. **Accept interfaces, return structs** - Flexible consumers, concrete producers
2. **Use context for cancellation** - Pass context through call chain
3. **Wrap errors with context** - Use `fmt.Errorf("operation failed: %w", err)`
4. **Keep interfaces small** - Prefer single-method interfaces
5. **Avoid global state** - Use dependency injection