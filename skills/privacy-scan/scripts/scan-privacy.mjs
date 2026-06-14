#!/usr/bin/env node

/**
 * Privacy Scan — scan files/content for secrets, PII, and privacy-compromising content.
 *
 * Usage:
 *   node scan-privacy.mjs --file path/to/file.md
 *   echo '{"content": "...", "filePath": "..."}' | node scan-privacy.mjs --stdin
 *
 * Output: JSON with risk level, findings, and recommendation.
 * Exit code: 0 for LOW risk, 1 for HIGH/MEDIUM/UNCERTAIN.
 */

import fs from 'fs';

const patterns = {
  // API keys and tokens
  apiKey: /(?:sk|pk|sk-live|sk-test|pk-live|pk-test)[-_][a-zA-Z0-9]{20,}/gi,
  apiKeyGeneric: /(?:api[-_]?(?:key|secret|token)|access[-_]?(?:key|secret|token))\s*[:=]\s*['"][a-zA-Z0-9_\-\.\/+]{16,}['"]/gi,
  bearerToken: /bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi,
  authToken: /(?:auth[-_]?token|jwt|refresh[-_]?token)\s*[:=]\s*['"][a-zA-Z0-9_\-\.]{20,}['"]/gi,

  // Passwords and credentials
  password: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{4,}['"]/gi,
  credential: /(?:credential|login|username|user)\s*[:=]\s*['"][^'"]{4,}['"]/gi,

  // Private keys
  privateKey: /-----BEGIN\s+(?:RSA|DSA|EC|PGP|OPENSSH|PRIVATE)\s+PRIVATE\s+KEY-----/g,

  // Connection strings
  mongoUri: /mongodb(?:\+srv)?:\/\/[^@\s]+@[^\s]+/gi,
  postgresUri: /postgres(?:ql)?:\/\/[^@\s]+@[^\s]+/gi,
  mysqlUri: /mysql:\/\/[^@\s]+@[^\s]+/gi,
  redisUri: /redis:\/\/[^@\s]+@[^\s]+/gi,

  // PII
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  phone: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,

  // Environment variables with hardcoded values
  envVar: /(?:export\s+)?[A-Z][A-Z0-9_]+\s*=\s*['"][^'"]+['"]/g,

  // Session/chat indicators in paths
  sessionPath: /\.opencode\/(?:state\/sessions|chat-history|chat|state\/.*session)/i,
  transcriptPath: /(?:session|transcript|chat-history|conversation)\.(?:md|json|txt|log)/i,
};

const derivedKnowledgeIndicators = [
  /^# (?:Architecture Decision|ADR|Decision|Pattern|Lesson|Summary)/im,
  /^## (?:Decision|Rationale|Consequences|Tradeoffs?|Lessons? Learned)/im,
  /^(?:We decided|The team decided|Architecture choice|Design decision)/im,
  /^(?:Pattern|Anti-pattern|Best practice|Recommendation):/im,
  /^## (?:Key Findings|Results|Conclusion|Next Steps)/im,
  /^> \*\*Decision\*\*/im,
  /^### Context$/im,
];

const rawDataIndicators = [
  /^## (?:Full Session|Transcript|Raw Output|Debug Log)/im,
  /^(?:User:|Assistant:|Human:|AI:)/im,
  /^\[(?:START|END)\s+(?:SESSION|CONVERSATION|CHAT)\]/im,
  /^### (?:Raw|Unfiltered|Complete)\s+(?:Log|Output|Dump)/im,
];

function scanContent(content, filePath) {
  const findings = [];
  let maxRisk = 'low';

  // Determine if this is derived knowledge (safe) or raw data (risky)
  const isDerived = derivedKnowledgeIndicators.some((re) => re.test(content));
  const isRawData = rawDataIndicators.some((re) => re.test(content));

  // Check file path for session/chat indicators
  if (filePath) {
    for (const [name, re] of Object.entries(patterns)) {
      if (name === 'sessionPath' && re.test(filePath)) {
        findings.push(`File path suggests session/chat content: ${filePath}`);
        maxRisk = escalate(maxRisk, 'high');
      }
      if (name === 'transcriptPath' && re.test(filePath)) {
        findings.push(`File path suggests transcript content: ${filePath}`);
        maxRisk = escalate(maxRisk, 'high');
      }
    }
  }

  // If it's clearly derived knowledge, skip the raw content scan
  // unless there are also raw data indicators
  if (isDerived && !isRawData) {
    // Still do a light scan for obvious secrets
    for (const [name, re] of Object.entries(patterns)) {
      if (['sessionPath', 'transcriptPath', 'email', 'ipAddress', 'phone', 'ssn'].includes(name)) {
        continue; // Skip PII and path checks for derived knowledge
      }
      const matches = content.match(re);
      if (matches) {
        findings.push(`[${name}] Found ${matches.length} potential match(es)`);
        maxRisk = escalate(maxRisk, 'medium');
      }
    }
    if (findings.length === 0) {
      return {
        risk: 'low',
        findings: ['Content appears to be derived knowledge (ADRs, patterns, decisions) — no raw secrets detected'],
        recommendation: 'commit',
        details: 'Derived knowledge is safe to commit. No raw secrets or PII detected.',
      };
    }
    // If we found something even in derived knowledge, flag it
    return {
      risk: maxRisk,
      findings,
      recommendation: maxRisk === 'high' ? 'gitignore' : 'review',
      details: `Content appears to be derived knowledge but ${maxRisk}-risk patterns were detected.`,
    };
  }

  // Full scan for raw/unknown content
  for (const [name, re] of Object.entries(patterns)) {
    if (['sessionPath', 'transcriptPath'].includes(name)) {
      continue; // Already checked above
    }
    const matches = content.match(re);
    if (matches) {
      // Filter out common false positives
      const filtered = matches.filter((m) => {
        // Skip example.com, test@test.com, etc.
        if (name === 'email' && /example\.com|test@|@localhost/i.test(m)) return false;
        // Skip 0.0.0.0, 127.0.0.1, etc.
        if (name === 'ipAddress' && /^0\.|^127\.|^255\.|\.0$|\.255$/.test(m)) return false;
        // Skip placeholder passwords
        if (name === 'password' && /password|secret|changeme|placeholder/i.test(m) && m.length < 20) return false;
        return true;
      });

      if (filtered.length > 0) {
        const risk = ['privateKey', 'apiKey', 'apiKeyGeneric', 'bearerToken', 'authToken', 'mongoUri', 'postgresUri', 'mysqlUri', 'redisUri', 'sessionPath', 'transcriptPath'].includes(name)
          ? 'high'
          : ['password', 'credential', 'ssn'].includes(name)
            ? 'high'
            : 'medium';
        findings.push(`[${name}] Found ${filtered.length} potential match(es) (risk: ${risk})`);
        maxRisk = escalate(maxRisk, risk);
      }
    }
  }

  // Determine recommendation
  let recommendation;
  if (maxRisk === 'high') {
    recommendation = 'gitignore';
  } else if (maxRisk === 'medium') {
    recommendation = 'sanitize';
  } else if (maxRisk === 'uncertain') {
    recommendation = 'review';
  } else {
    recommendation = 'commit';
  }

  return {
    risk: maxRisk,
    findings: findings.length > 0 ? findings : ['No secrets or PII detected'],
    recommendation,
    details: findings.length > 0
      ? `Found ${findings.length} potential issue(s). Risk level: ${maxRisk.toUpperCase()}.`
      : 'Content appears safe to commit.',
  };
}

function escalate(current, candidate) {
  const levels = ['low', 'medium', 'high', 'uncertain'];
  return levels.indexOf(candidate) > levels.indexOf(current) ? candidate : current;
}

// CLI entry point
function main() {
  const args = process.argv.slice(2);
  let content = '';
  let filePath = '';

  if (args.includes('--file')) {
    const idx = args.indexOf('--file');
    filePath = args[idx + 1];
    const fs = require('fs');
    content = fs.readFileSync(filePath, 'utf-8');
  } else if (args.includes('--stdin')) {
    let input = '';
    process.stdin.on('data', (chunk) => (input += chunk));
    process.stdin.on('end', () => {
      try {
        const parsed = JSON.parse(input);
        content = parsed.content || '';
        filePath = parsed.filePath || '';
      } catch {
        content = input;
      }
      const result = scanContent(content, filePath);
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      process.exit(result.risk === 'low' ? 0 : 1);
    });
    return;
  } else if (args.length > 0 && !args[0].startsWith('--')) {
    // Treat first non-flag arg as file path
    filePath = args[0];
    content = fs.readFileSync(filePath, 'utf-8');
  } else {
    process.stderr.write('Usage: node scan-privacy.mjs [--file <path> | --stdin | <path>]\n');
    process.exit(1);
  }

  const result = scanContent(content, filePath);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.risk === 'low' ? 0 : 1);
}

// Check if this is the main module
const isMain = process.argv[1] && (
  process.argv[1] === import.meta.url ||
  process.argv[1].endsWith('scan-privacy.mjs')
);

if (isMain) {
  main();
}

export { scanContent };
