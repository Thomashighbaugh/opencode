# Architecture Patterns - Rust

## Project Structure

### Library Crate
```
src/
├── lib.rs              # Library entry point
├── error.rs            # Error types
├── config.rs           # Configuration
├── models/
│   ├── mod.rs
│   └── user.rs         # User model
├── services/
│   ├── mod.rs
│   └── user_service.rs # Business logic
├── repositories/
│   ├── mod.rs
│   └── user_repo.rs    # Data access
└── utils/
    ├── mod.rs
    └── format.rs
```

### Binary Crate
```
src/
├── main.rs             # Entry point
├── cli.rs              # CLI handling
├── lib.rs              # Library exports
└── [library modules]
```

### Workspace
```
Cargo.toml              # Workspace definition
crates/
├── api/
│   ├── Cargo.toml
│   └── src/
├── domain/
│   ├── Cargo.toml
│   └── src/
└── infrastructure/
    ├── Cargo.toml
    └── src/
```

## Error Handling

### Result-Based Error Handling
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum UserError {
    #[error("User not found: {0}")]
    NotFound(i64),
    
    #[error("Invalid email: {0}")]
    InvalidEmail(String),
    
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
}

pub type Result<T> = std::result::Result<T, UserError>;

// Usage
async fn get_user(id: i64) -> Result<User> {
    let user = db::find_user(id).await?;
    user.ok_or(UserError::NotFound(id))
}
```

### Custom Error Types
```rust
use std::fmt;

#[derive(Debug)]
pub struct ValidationError {
    pub field: String,
    pub message: String,
}

impl fmt::Display for ValidationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Validation error on {}: {}", self.field, self.message)
    }
}

impl std::error::Error for ValidationError {}
```

## Structs and Types

### Struct Patterns
```rust
// Builder pattern
pub struct User {
    pub id: i64,
    pub name: String,
    pub email: String,
}

pub struct UserBuilder {
    name: Option<String>,
    email: Option<String>,
}

impl UserBuilder {
    pub fn new() -> Self {
        Self { name: None, email: None }
    }
    
    pub fn name(mut self, name: impl Into<String>) -> Self {
        self.name = Some(name.into());
        self
    }
    
    pub fn email(mut self, email: impl Into<String>) -> Self {
        self.email = Some(email.into());
        self
    }
    
    pub fn build(self) -> Result<User, &'static str> {
        Ok(User {
            id: 0,
            name: self.name.ok_or("name is required")?,
            email: self.email.ok_or("email is required")?,
        })
    }
}

// Usage
let user = UserBuilder::new()
    .name("John")
    .email("john@example.com")
    .build()?;
```

### Newtype Pattern
```rust
// Strong typing for domain concepts
#[derive(Debug, Clone)]
pub struct UserId(i64);

#[derive(Debug, Clone)]
pub struct Email(String);

impl Email {
    pub fn new(email: String) -> Result<Self, ValidationError> {
        if email.contains('@') {
            Ok(Self(email))
        } else {
            Err(ValidationError {
                field: "email".into(),
                message: "Invalid email format".into(),
            })
        }
    }
    
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

// Type-safe API
fn get_user(id: UserId) -> Result<User, UserError> {
    // Can't accidentally pass wrong type
}
```

## Trait Patterns

### Trait for Abstraction
```rust
#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn find_by_id(&self, id: i64) -> Result<Option<User>>;
    async fn find_by_email(&self, email: &str) -> Result<Option<User>>;
    async fn save(&self, user: &User) -> Result<User>;
}

pub struct PostgresUserRepository {
    pool: PgPool,
}

#[async_trait]
impl UserRepository for PostgresUserRepository {
    async fn find_by_id(&self, id: i64) -> Result<Option<User>> {
        sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
            .fetch_optional(&self.pool)
            .await
            .map_err(UserError::from)
    }
    
    async fn save(&self, user: &User) -> Result<User> {
        // Implementation
    }
}
```

### Trait for Behavior
```rust
pub trait Validate {
    type Error;
    
    fn validate(&self) -> Result<(), Self::Error>;
}

impl Validate for User {
    type Error = ValidationError;
    
    fn validate(&self) -> Result<(), Self::Error> {
        if self.name.is_empty() {
            return Err(ValidationError {
                field: "name".into(),
                message: "Name cannot be empty".into(),
            });
        }
        Ok(())
    }
}
```

## Async Patterns

### Async Service
```rust
pub struct UserService {
    repository: Arc<dyn UserRepository>,
}

impl UserService {
    pub fn new(repository: Arc<dyn UserRepository>) -> Self {
        Self { repository }
    }
    
    pub async fn create_user(&self, cmd: CreateUserCmd) -> Result<User> {
        let mut user = User {
            id: 0,
            name: cmd.name,
            email: cmd.email,
        };
        user.validate()?;
        self.repository.save(&user).await
    }
}
```

### Concurrent Operations
```rust
use tokio::try_join;

async fn get_user_with_posts(id: i64) -> Result<(User, Vec<Post>)> {
    let user_future = get_user(id);
    let posts_future = get_posts(id);
    
    let (user, posts) = try_join!(user_future, posts_future)?;
    Ok((user, posts))
}
```

## Testing Patterns

### Unit Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn user_validation_fails_empty_name() {
        let user = UserBuilder::new()
            .email("test@example.com")
            .build()
            .unwrap();
        
        assert!(user.validate().is_err());
    }
    
    #[tokio::test]
    async fn create_user_saves_to_repository() {
        let mock_repo = MockUserRepository::new();
        let service = UserService::new(Arc::new(mock_repo));
        
        let cmd = CreateUserCmd {
            name: "Test".into(),
            email: "test@example.com".into(),
        };
        
        let result = service.create_user(cmd).await;
        assert!(result.is_ok());
    }
}
```

### Integration Tests
```rust
// tests/integration_test.rs
use sqlx::postgres::PgPoolOptions;

#[sqlx::test]
async fn test_user_creation(pool: PgPool) {
    let repo = PostgresUserRepository::new(pool);
    let service = UserService::new(Arc::new(repo));
    
    let user = service.create_user(CreateUserCmd {
        name: "Test".into(),
        email: "test@example.com".into(),
    }).await.unwrap();
    
    assert!(user.id > 0);
}
```

## Safety Patterns

### Safe Wrappers
```rust
pub fn parse_int(s: &str) -> Result<i32, ParseIntError> {
    s.parse::<i32>()
}

pub fn safe_divide(a: i32, b: i32) -> Option<i32> {
    if b == 0 {
        None
    } else {
        Some(a / b)
    }
}
```

### Interior Mutability
```rust
use std::cell::RefCell;
use std::rc::Rc;

pub struct Cache {
    data: RefCell<HashMap<String, String>>,
}

impl Cache {
    pub fn new() -> Self {
        Self {
            data: RefCell::new(HashMap::new()),
        }
    }
    
    pub fn get(&self, key: &str) -> Option<String> {
        self.data.borrow().get(key).cloned()
    }
    
    pub fn insert(&self, key: String, value: String) {
        self.data.borrow_mut().insert(key, value);
    }
}
```

## Web Framework Patterns (Actix/Axum)

### Handler Pattern
```rust
// axum
pub async fn get_user(
    Path(id): Path<i64>,
    State(service): State<Arc<UserService>>,
) -> Result<Json<User>, ApiError> {
    let user = service.get_user(id).await?;
    Ok(Json(user))
}

// Router
let app = Router::new()
    .route("/users/:id", get(get_user))
    .route("/users", post(create_user))
    .with_state(user_service);
```

### Middleware Pattern
```rust
pub async fn auth_middleware(
    req: Request,
    next: Next,
) -> Result<Response, ApiError> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(ApiError::Unauthorized)?;
    
    let user = verify_token(auth_header)?;
    req.extensions_mut().insert(user);
    
    Ok(next.run(req).await)
}
```