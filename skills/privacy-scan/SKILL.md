---
name: privacy-scan
description: Dynamically scan files and content for secrets, PII, API keys, tokens, credentials, and privacy-compromising content before committing to version control or saving as durable context. Used by init-project and harvest-context hubs.
level: 2
---

# Privacy Scan

Dynamically scan files and content for secrets, PII, and privacy-compromising content before they are committed to version control or saved as durable context.

## When to Use

- Before saving any new context file to `.opencode/context/` (called by harvest-context)
- During init-project setup/refresh when configuring .gitignore
- When the user asks about what should be gitignored
- After any session that may have captured sensitive information

## Workflow

### Step 1: Scan Content

Analyze the provided content or file for:

| Category | Patterns |
|----------|----------|
| **API Keys & Tokens** | `sk-[a-zA-Z0-9]{20,}`, `pk-[a-zA-Z0-9]{20,}`, `api_key`, `api_secret`, `bearer [token]`, `auth_token` |
| **Passwords & Credentials** | `password=`, `passwd=`, `credential=`, `login=`, `pwd=` |
| **Private Keys** | `-----BEGIN (RSA\|DSA\|EC\|PGP\|OPENSSH) PRIVATE KEY-----` |
| **Connection Strings** | `mongodb(\+srv)?://[^@]+@`, `postgresql://[^@]+@`, `mysql://[^@]+@`, `redis://[^@]+@` |
| **PII** | Email addresses, IP addresses, phone numbers, SSN patterns |
| **Session/Transcript Indicators** | File paths containing `session`, `chat`, `transcript`, `history` under `.opencode/` |
| **Environment Variables** | Hardcoded env var assignments with values (e.g., `API_KEY=sk-...`) |

### Step 2: Classify Risk Level

| Risk | Meaning | Action |
|------|---------|--------|
| **HIGH** | Contains actual secrets, API keys, tokens, passwords, private keys | MUST be gitignored |
| **MEDIUM** | Contains PII, email addresses, IPs, or patterns that look like secrets | Should be gitignored or sanitized |
| **LOW** | Contains no detectable secrets or PII | Safe to commit |
| **UNCERTAIN** | Ambiguous patterns that might be false positives | Flag for human review |

### Step 3: Distinguish Derived Knowledge from Raw Data

**Derived knowledge** (safe to commit):
- ADRs, pattern descriptions, architectural decisions
- Lessons learned, summaries, code snippets without credentials
- Configuration patterns without real secrets
- Design decisions and tradeoff analyses

**Raw data** (risky — scan for secrets):
- Full session transcripts
- Raw logs, environment dumps
- Config files with real values
- API responses, debug output
- Files with paths containing `session`, `chat`, `transcript`, `history`

### Step 4: Output Verdict

```
## Privacy Scan Result

**Risk Level**: [HIGH|MEDIUM|LOW|UNCERTAIN]
**Findings**: [list of findings]
**Recommendation**: [gitignore|sanitize|commit|review]

[Details/Explanation]
```

## Script

A companion script at `scripts/scan-privacy.mjs` can be called programmatically:

```bash
# Scan a file
node scripts/scan-privacy.mjs --file path/to/file.md

# Scan content from stdin
echo '{"content": "..."}' | node scripts/scan-privacy.mjs --stdin
```

Returns JSON: `{ "risk": "low"|"medium"|"high"|"uncertain", "findings": [...], "recommendation": "commit"|"gitignore"|"sanitize"|"review", "details": "..." }`

Exit code: 0 for LOW risk, 1 for HIGH/MEDIUM/UNCERTAIN.

## Integration Points

### Called by init-project (Phase 3 — .gitignore setup)
When init-project creates or refreshes `.opencode/` configuration, it uses privacy-scan to determine which additional patterns should be added to `.gitignore`.

### Called by harvest-context (before saving context files)
Before any new context file is saved to `.opencode/context/`, harvest-context invokes privacy-scan. If the scan returns HIGH or MEDIUM risk, the file is added to `.gitignore` instead of being committed. LOW risk files are committed as normal durable context.

## Related

- `init-project` skill — Uses privacy-scan during setup/refresh
- `harvest-context` skill — Uses privacy-scan before saving context files
- `rules/context-strategy.md` — State vs context separation model
