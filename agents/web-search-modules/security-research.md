# Security Research Module

> Security-focused search for vulnerabilities, advisories, exploits

**Trigger scenarios**: CVEs, vulnerabilities, security advisories, penetration testing, secure coding, threat intel

## Search sources
- **NVD** (nvd.nist.gov) - CVE database, CVSS, references
- **CVE.org** (cve.org) - official CVE records
- **MITRE** (cve.mitre.org) - CVE details
- **GitHub Security Advisories** (github.com/advisories) - GHSA, patched versions
- **OSV.dev** (osv.dev) - open source vulnerability DB
- **Exploit-DB** (www.exploit-db.com) - exploits (use responsibly)
- **Snyk** (snyk.io/vuln) - vulnerability DB
- **CISA KEV** (www.cisa.gov/known-exploited-vulnerabilities-catalog) - known exploited vulns
- **VulnCheck** / **Packet Storm** (use with caution)
- **Project security advisories** - vendor/security pages

## Query strategy
- Search for "CVE-YYYY-NNNNN [product/version]"
- Include version numbers exactly as in product
- Look for GHSA IDs
- Check affected/fixed versions
- Find PoCs, patches, mitigations
- Look for writeups explaining root cause
- Cross-reference with vendor advisories

## Information extraction
- CVE ID, CVSS score/vector, CWE
- Affected versions, fixed versions
- Attack vector, prerequisites, impact
- PoC existence, exploitability
- Mitigations/workarounds
- Disclosure timeline
