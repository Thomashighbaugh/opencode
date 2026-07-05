import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH, RULES_SECURITY, SKILLS_PRIVACY_SCAN } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "scan",
  description: "Security vulnerability scan — SAST rules, secrets detection, dependency audit, compliance checks",
  reminder: "Run security vulnerability scan.",
  inline: true,

  detailedDescription: `Security vulnerability scan with four dimensions:

1. SAST (static analysis): scans source code for vulnerability patterns (injection, XSS, CSRF, auth bypass, path traversal, unsafe deserialization).
2. Secrets detection: scans for hardcoded API keys, tokens, passwords, credentials in the codebase.
3. Dependency audit: checks dependencies against known vulnerability databases (npm audit, pip audit, etc.).
4. Compliance checks: verifies security-relevant configurations (HTTPS, CORS, headers, rate limiting).

Output: a security report with findings classified by severity (critical, high, medium, low) and specific remediation instructions. Follows the security.md rule's response protocol.

Use before commits, releases, or periodically as a security baseline. Also runs as gate 4 of /project converge.`,

  tools: TOOLS_BASH,
  rules: RULES_SECURITY,
  relatedSkills: SKILLS_PRIVACY_SCAN,
}

export default spec