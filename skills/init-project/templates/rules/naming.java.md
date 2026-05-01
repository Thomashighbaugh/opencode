# Naming Conventions - Java

## Files

### Classes
- **PascalCase**: `UserService.java`, `PaymentProcessor.java`
- **One public class per file**: File name matches class name

### Tests
- **Test suffix**: `UserServiceTest.java`, `PaymentProcessorTest.java`
- **Test directories**: `src/test/java/`

### Packages
- **All lowercase**: `com.example.userservice`
- **Reverse domain**: `com.company.project.module`

## Variables

### Local Variables
- **camelCase**: `String userName`, `int userCount`
- **Descriptive**: `isLoading`, `hasError`

### Constants
- **SCREAMING_SNAKE_CASE**: `static final int MAX_RETRIES = 3;`

### Instance Variables
- **camelCase**: `private String userName;`, `private int userCount;`

## Methods

### Method Names
- **camelCase**: `getUserProfile()`, `calculateTotal()`
- **Descriptive verbs**: `get`, `set`, `is`, `has`, `can`

### Boolean Methods
- **is/has/can prefix**: `isValid()`, `hasPermission()`, `canEdit()`

### Getter/Setter
- **get/set prefix**: `getName()`, `setName()`, `isActive()`

## Classes

### Class Names
- **PascalCase**: `UserService`, `PaymentProcessor`
- **Nouns**: `User`, `Account`, `PaymentService`

### Interface Names
- **PascalCase**: `UserService` (no I prefix preferred)
- ** adjective for behaviors**: `Runnable`, `Comparable`

### Abstract Classes
- **PascalCase**: `AbstractUserService`, `BaseController`

### Enums
- **PascalCase enum**: `enum Status`
- **SCREAMING_SNAKE_CASE values**: `PENDING`, `APPROVED`, `REJECTED`

## Packages

### Package Names
- **All lowercase**: `com.example.userservice`
- **No underscores**: `com.example.userservice` not `com.example.user_service`

### Import Ordering
```java
// java.*
import java.util.List;
import java.util.Map;

// javax.*
import javax.servlet.http.*;

// Third-party
import org.springframework.*;

// Project
import com.company.project.*;
```

## Best Practices

1. **Follow Java naming conventions** - Standard Java style guide
2. **Be descriptive** - Names should reveal intent
3. **Avoid abbreviations** - `getUser` not `getUsr`
4. **Boolean prefixes**: `is`, `has`, `can`, `should`

## File Organization

```
src/
├── main/java/com/example/
│   ├── UserService.java
│   ├── model/
│   │   └── User.java
│   ├── repository/
│   │   └── UserRepository.java
│   └── controller/
│       └── UserController.java
└── test/java/com/example/
    └── UserServiceTest.java
```