# Naming Conventions - Ruby

## Files

### Classes/Modules
- **snake_case**: `user_service.rb`, `payment_processor.rb`
- **Match class name**: `UserService` → `user_service.rb`

### Tests
- **_spec suffix**: `user_service_spec.rb`
- **Test directories**: `spec/`, `test/`

### Directories
- **snake_case**: `user_service/`, `api_client/`

## Variables

### Local Variables
- **snake_case**: `user_name = "John"`
- **Descriptive**: `is_loading`, `has_error`

### Constants
- **SCREAMING_SNAKE_CASE**: `MAX_RETRIES = 3`
- **Module level**: `DEFAULT_TIMEOUT = 5000`

### Instance Variables
- **@ prefix**: `@user_name`, `@user_count`

### Class Variables
- **@@ prefix**: `@@instances_count`

### Global Variables
- **$ prefix**: `$global_config` (avoid when possible)

## Methods

### Method Names
- **snake_case**: `get_user_profile`, `calculate_total`

### Boolean Methods
- **? suffix**: `valid?`, `admin?`, `has_permission?`
- **No is_ prefix**: Use `valid?` not `is_valid?`

### Dangerous Methods
- **! suffix**: `save!`, `destroy!` (raises on failure)

### Setter Methods
- **= suffix**: `def name=(value)`

### Private Methods
- **private keyword**: `private def internal_method`

## Classes and Modules

### Class Names
- **PascalCase**: `UserService`, `PaymentProcessor`

### Module Names
- **PascalCase**: `Authentication`, `PaymentProcessing`

### Namespacing
```ruby
module MyProject
  module Services
    class UserService
    end
  end
end
```

## Symbols

### Symbol Names
- **snake_case**: `:user_name`, `:has_permission`
- **PascalCase for constants**: `:ActiveStatus`

## Blocks

### Block Parameters
- **|params|**: `{ |user| user.name }`
- **Short names**: `{ |u| u.name }` for one-liners

## Best Practices

1. **Follow Ruby style guide** - https://rubystyle.guide/
2. **snake_case for files and methods**
3. **PascalCase for classes and modules**
4. **? for predicates, ! for danger**
5. **Avoid global variables**

## File Organization

```
lib/
├── my_project/
│   ├── user_service.rb
│   ├── models/
│   │   └── user.rb
│   └── services/
│       └── auth.rb
└── my_project.rb
```

## Rails Conventions

### Models
- **Singular PascalCase**: `User`, `PaymentProcessor`
- **File**: `app/models/user.rb`

### Controllers
- **Plural PascalCase**: `UsersController`
- **File**: `app/controllers/users_controller.rb`

### Views
- **snake_case**: `app/views/users/index.html.erb`