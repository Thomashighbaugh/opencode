# Naming Conventions - Go

## Files

### Package Files
- **All lowercase**: `userservice.go`, `apiclient.go`
- **Match package**: Files in `package user` start in `user/`

### Test Files
- **_test suffix**: `user_test.go`, `client_test.go`

### Directories
- **All lowercase, no underscores**: `user/`, `apiclient/`
- **Short and descriptive**: `cmd/`, `pkg/`, `internal/`

## Packages

### Package Names
- **All lowercase, single word**: `package user`, `package http`
- **Match directory**: `package mypkg` in `mypkg/` directory
- **No underscores or camelCase**: `package user` not `package userService`

### Import Aliases
- **Only when necessary**: `import format "encoding/json"`
- **Standard aliases**: `import . "testing"` (only in tests)

## Variables

### Local Variables
- **Short names preferred**: `u` for `user`, `i` for index
- **CamelCase for longer names**: `userName`, `httpClient`

### Constants
- **MixedCase or SCREAMING_SNAKE_CASE**: `const MaxRetries = 3` or `const MAX_RETRIES = 3`
- **Grouped**: `const ( StatusOK = 200 )`

### Package Variables
- **Lowercase first letter**: Private `var client *http.Client`
- **Uppercase first letter**: Exported `var DefaultClient = &http.Client{}`

## Functions

### Function Names
- **MixedCase (PascalCase for exported)**: `func GetUser()`, `func calculate()`
- **Descriptive**: `fetchUser`, `loadData`

### Methods
- **Same as functions**: `func (u *User) GetName() string`

### Boolean Functions
- **`Is`, `Has`, `Can` prefixes**: `IsValid()`, `HasPermission()`

### Private Functions
- **Lowercase first letter**: `func privateFunction()`

## Types

### Structs
- **MixedCase**: `type UserService struct`, `type PaymentProcessor struct`
- **Exported**: `type User struct { Name string }`
- **Unexported**: `type user struct { name string }`

### Interfaces
- **MixedCase**: `type Reader interface`
- **Single method:verb+er**: `type Writer interface { Write([]byte) }`

### Type Aliases
- **MixedCase**: `type UserId int64`, `type HttpResponse struct`

## Interfaces

### Interface Names
- **MixedCase**: `type DataStore interface`
- **Verb suffix for behavior**: `Reader`, `Writer`, `Closer`

### Single-Method Interfaces
```go
type Writer interface {
    Write([]byte) (int, error)
}
type Reader interface {
    Read([]byte) (int, error)
}
```

## File Organization

```
project/
├── cmd/
│   └── myapp/
│       └── main.go      # Entry point
├── pkg/
│   └── user/
│       ├── user.go      # Package main file
│       ├── service.go   # UserService
│       └── user_test.go # Tests
├── internal/
│   └── api/
│       └── client.go    # Internal API client
├── api/
│   └── handler.go       # Public API handlers
└── go.mod
```

## Exported vs Unexported

### Exported (Public)
- **Uppercase first letter**: `func GetUser()`, `type Server struct`
- **Accessible from other packages**

### Unexported (Private)
- **Lowercase first letter**: `func getUser()`, `type server struct`
- **Package-private only**

## Constants

### Grouped Constants
```go
const (
    StatusOK       = 200
    StatusNotFound = 404
)

const (
    DefaultTimeout = 30 * time.Second
    MaxRetries     = 3
)
```

### iota Enumerations
```go
type Status int

const (
    StatusPending Status = iota
    StatusActive
    StatusInactive
)
```

## Best Practices

1. **Use short names** - `i` for index, `u` for user (context matters)
2. **Be descriptive when needed** - `userId` vs `u`
3. **Follow idiomatic Go** - `GetUser` for getters, `SetUser` for setters
4. **Avoid stuttering** - `user.User` not `user.UserService`
5. **Interface naming**: `Reader`, not `IReader` or `Readable`

## Error Handling

### Error Types
- **MixedCase**: `type ValidationError struct`

### Error Variables
- **Err prefix**: `var ErrNotFound = errors.New("not found")`

### Error Wrapping
```go
if err != nil {
    return fmt.Errorf("failed to get user: %w", err)
}
```

## Testing Conventions

### Test Functions
- **Test prefix**: `func TestGetUser(t *testing.T)`

### Benchmark Functions
- **Benchmark prefix**: `func BenchmarkGetUser(b *testing.B)`

### Example Functions
- **Example prefix**: `func ExampleUser_GetName()`
- **Output comment**: `// Output: John`

## Receiver Names

### Struct Methods
- **Short name**: `func (u *User)` not `func (user *User)`
- **Consistent within struct**: Always use same receiver name
- **1-2 letters**: `u` for `User`, `s` for `Server`

## Common Patterns

### Constructor Pattern
```go
func NewUser(name string, email string) *User {
    return &User{Name: name, Email: email}
}
```

### Functional Options
```go
type Option func(*Config)

func WithTimeout(timeout time.Duration) Option {
    return func(c *Config) { c.Timeout = timeout }
}

// Usage: NewClient(WithTimeout(30*time.Second))
```