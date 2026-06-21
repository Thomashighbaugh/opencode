---
name: harden
description: Composable robustness — safeTask (error+deviation tracking), circuitBreaker (halt on failure rate), verificationGate (block downstream until verified)
---

# Harden

Composable security and robustness hardening. Run `@security-reviewer` to audit the codebase, apply fixes for discovered vulnerabilities, then re-verify that all issues are resolved. Uses composable robustness patterns: safeTask for error tracking, circuitBreaker for failure rate control, verificationGate for downstream blocking.

## When to Use

- Security audit of existing code before a release
- Hardening a codebase after initial implementation
- Addressing known vulnerabilities (OWASP Top 10, CVE findings)
- Adding input validation, output encoding, authentication checks
- Reviewing dependency security (npm audit, pip audit, etc.)
- Preparing code for production deployment

**Do not use when:**
- The codebase is brand new with no implementation yet — security is built in during development
- You need a full autonomous pipeline — use `autopilot` instead
- The task is purely about adding features — use `plan-execute` or `tdd` instead
- You need a comprehensive project health audit — use `/project audit` instead

## Workflow

### Phase 1: Security Audit

Delegate to `@security-reviewer` to perform a comprehensive audit:

1. **Code scan**: Review all files for security issues:
   - Hardcoded secrets (API keys, passwords, tokens)
   - SQL injection vectors (raw queries, string concatenation)
   - XSS vulnerabilities (unencoded user output)
   - CSRF protection gaps
   - Insecure deserialization
   - Path traversal vulnerabilities
   - Command injection
   - Insecure direct object references (IDOR)
2. **Dependency audit**: Run security scans on dependencies:
   - `npm audit` for Node.js projects
   - `pip audit` or `safety check` for Python
   - `cargo audit` for Rust
   - `trivy` or `snyk` if available
3. **Configuration review**: Check for:
   - Debug mode enabled in production
   - Weak CORS policies
   - Missing rate limiting
   - Insecure cookie settings
   - Overly permissive file permissions

**Output:** A `SECURITY_AUDIT.md` file in `.opencode/state/orchestration/harden/` with categorized findings (Critical, High, Medium, Low).

### Phase 2: Apply Fixes

For each finding, apply fixes in priority order (Critical → High → Medium → Low):

1. **Critical/High**: Fix immediately. Delegate to `@executor` with specific instructions.
2. **Medium**: Fix if the fix is low-risk. Document if deferred.
3. **Low**: Document and note for future. Fix if trivial.

**Fix patterns:**
- Secrets: Move to environment variables, add to `.gitignore`, rotate if exposed
- SQL injection: Replace string concatenation with parameterized queries/ORM
- XSS: Add output encoding, Content-Security-Policy headers
- CSRF: Add CSRF tokens to forms, SameSite cookie attributes
- Input validation: Add schema validation (zod, joi, pydantic)
- Dependency issues: Update to patched versions

### Phase 3: Re-verify

After applying fixes:

1. Re-run the security audit on changed files
2. Verify each finding is resolved
3. Run the full test suite — fixes must not break existing functionality
4. Run build/typecheck

### Phase 4: Robustness Composables

Apply composable robustness patterns to critical code paths:

**safeTask** — Wrap operations with error and deviation tracking:
```typescript
// Pattern: track errors and unexpected behavior
function safeTask<T>(fn: () => T, context: string): T {
  try {
    const result = fn()
    return result
  } catch (error) {
    console.error(`[safeTask] ${context}:`, error)
    throw error
  }
}
```

**circuitBreaker** — Halt operations when failure rate exceeds threshold:
```typescript
// Pattern: track failure rate, open circuit when threshold exceeded
// Use for external API calls, database operations, file I/O
```

**verificationGate** — Block downstream operations until upstream is verified:
```typescript
// Pattern: require explicit verification before proceeding
// Use for deploy gates, data pipeline stages, payment processing
```

### Phase 5: Report

Generate a hardening report:

1. Summary of findings by severity
2. Which findings were fixed
3. Which findings were deferred (with rationale)
4. Robustness composables applied
5. Final security posture assessment
6. Recommendations for ongoing security

## Constraints

- **Fix before feature**: Security fixes take priority over new features during a harden session.
- **No silent deferrals**: Every deferred finding must have a documented rationale and suggested timeline.
- **Re-verify everything**: After fixes, re-run the full audit — not just a spot-check of changed files.
- **Tests must pass**: Security fixes must not break existing tests. If a fix requires test changes, update tests.
- **Secrets must be rotated**: If a secret was hardcoded and committed, it is compromised. Rotate it, don't just remove it.

## Reminder

Wrap workflow with robustness composables.
