# Security Rules

## Mandatory Security Checks

Before ANY commit:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] CSRF protection enabled
- [ ] Authentication/authorization verified
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't leak sensitive data

## Secret Management

```typescript
// NEVER: Hardcoded secrets
const apiKey = "sk-proj-xxxxx"

// ALWAYS: Environment variables
const apiKey = process.env.API_KEY
if (!apiKey) throw new Error('API_KEY not configured')
```

## Security Response Protocol

If security issue found:
1. Flag the issue and continue if non-critical
2. For CRITICAL issues (exposed secrets, auth bypass): fix immediately
3. Rotate any exposed secrets
4. Note the finding for review

## [CUSTOMIZE] Project-Specific Security

Add your project-specific security requirements here:
- Authentication method
- Authorization rules
- Data encryption requirements
- Compliance requirements (GDPR, HIPAA, etc.)
