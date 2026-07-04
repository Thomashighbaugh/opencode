#!/usr/bin/env node

/**
 * compress-context.mjs — Reductive context file compressor.
 *
 * CLI: node compress-context.mjs --file <path> [--threshold 200] [--backup]
 *
 * Applies 5 deterministic reductive rules to context files > threshold lines.
 * Idempotent: running twice on the same file produces the same output.
 * Exempted: decisions.md is never compressed.
 *
 * Rules:
 *   a. Drop conversational narrative lines
 *   b. Drop exploratory dead-end lines
 *   c. Collapse verbose code blocks (>5 lines) to // See reference
 *   d. Replace raw terminal output blocks with one-line HTML comment
 *   e. Preserve headings, table rows, code signatures, list items
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Patterns ──────────────────────────────────────────────────────────────

/** Rule (a): conversational narrative starters */
const CONVERSATIONAL_RE = /^(The user|I then|We then|So I|After that|Next, I|First, I|Let me|Now I)/;

/** Rule (b): exploratory dead-end phrases */
const DEAD_END_RE = /(didn't work|not the right approach|dead end|abandoned|scrap(?:ed| this))/i;

/** Rule (d): command prompt markers inside terminal blocks */
const COMMAND_PROMPT_RE = /^[\s>]*(\$|>)/;

/** Rule (e): preservation patterns — checked first so they always win */
function isPreserved(line) {
  return /^\s*#{1,3}\s/.test(line)         // headings
    || /^\|/.test(line)                     // table rows
    || /\b(function|class|interface|export|import|const|type)\b/.test(line)  // code signatures
    || /^\s*([-*]\s|\d+\.\s)/.test(line);  // list items
}

// ── CLI Argument Parsing ──────────────────────────────────────────────────

function parseArgs(args) {
  let file = null;
  let threshold = 200;
  let backup = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--file':
        file = args[++i];
        break;
      case '--threshold':
        threshold = parseInt(args[++i], 10);
        if (Number.isNaN(threshold) || threshold < 0) threshold = 200;
        break;
      case '--backup':
        backup = true;
        break;
    }
  }

  return { file, threshold, backup };
}

// ── Main Compression Logic ────────────────────────────────────────────────

function compress({ file, threshold, backup }) {
  if (!file) {
    console.log(JSON.stringify({ error: 'No file specified. Use --file <path>' }));
    process.exit(1);
  }

  const basename = path.basename(file);

  // Hardcoded exemption: decisions.md (ADRs are canonical)
  if (basename === 'decisions.md') {
    console.log(JSON.stringify({ compressed: false, reason: 'exempted file: decisions.md', lines: 0 }));
    process.exit(0);
  }

  if (!fs.existsSync(file)) {
    console.log(JSON.stringify({ error: `File not found: ${file}` }));
    process.exit(1);
  }

  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const totalLines = lines.length;

  // Under threshold — no compression needed
  if (totalLines <= threshold) {
    console.log(JSON.stringify({ compressed: false, reason: 'under threshold', lines: totalLines }));
    process.exit(0);
  }

  // ── Process into segments ───────────────────────────────────────────────

  /** Result lines after applying rules */
  const outputLines = [];
  let originalCount = 0;
  let compressedCount = 0;
  let i = 0;

  const relPath = path.relative(process.cwd(), file);

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    // ── Fenced code block detection ─────────────────────────────────────
    if (trimmed.startsWith('```')) {
      const fence = line;
      const lang = fence.replace(/^```/, '').trim().split(/\s+/)[0];
      const blockLines = [];
      i++;

      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        blockLines.push(lines[i]);
        i++;
      }
      // i is at closing ``` or past end
      const hasClose = i < lines.length;
      const closeLine = hasClose ? lines[i] : '';
      const contentLen = blockLines.length;

      // Count original lines: opening fence + content + closing fence
      originalCount += 1 + contentLen + (hasClose ? 1 : 0);

      // Rule (d): tagged as bash/text AND contains command prompts
      if (
        (lang === 'bash' || lang === 'text') &&
        blockLines.some(l => COMMAND_PROMPT_RE.test(l.trim()))
      ) {
        const firstLine = blockLines[0].trim();
        outputLines.push(`<!-- Terminal output: ${firstLine} ... (${contentLen} lines) -->`);
        compressedCount += 1;
      }
      // Rule (c): content >5 lines → collapse
      else if (contentLen > 5) {
        const startLine = i - contentLen + 1;  // 1-indexed
        const endLine = i;
        outputLines.push(`// See ${relPath}:${startLine}-${endLine}`);
        compressedCount += 1;
      }
      // Small block → keep as-is
      else {
        outputLines.push(fence);
        outputLines.push(...blockLines);
        if (hasClose) outputLines.push(closeLine);
        compressedCount += 1 + contentLen + (hasClose ? 1 : 0);
      }

      if (hasClose) i++; // skip closing fence
      continue;
    }

    // ── Regular (non-fence) lines ────────────────────────────────────────
    originalCount++;

    // Rule (e): preserved content always wins
    if (isPreserved(line)) {
      outputLines.push(line);
      compressedCount++;
    }
    // Rule (a): drop conversational narrative
    else if (CONVERSATIONAL_RE.test(line.trim())) {
      // skipped — not added to outputLines
    }
    // Rule (b): drop exploratory dead-ends
    else if (DEAD_END_RE.test(line)) {
      // skipped
    }
    // Everything else kept
    else {
      outputLines.push(line);
      compressedCount++;
    }

    i++;
  }

  // ── Write output ────────────────────────────────────────────────────────

  if (backup) {
    const backupPath = file + '.orig.md';
    fs.writeFileSync(backupPath, content, 'utf-8');
  }

  const output = outputLines.join('\n');
  fs.writeFileSync(file, output, 'utf-8');

  const reduction = originalCount > 0
    ? ((1 - compressedCount / originalCount) * 100).toFixed(1)
    : '0.0';

  console.log(JSON.stringify({
    compressed: true,
    originalLines: originalCount,
    compressedLines: compressedCount,
    reduction: `${reduction}%`,
  }));
}

// ── Entry Point ───────────────────────────────────────────────────────────

compress(parseArgs(process.argv.slice(2)));
