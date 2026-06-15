#!/usr/bin/env node

/**
 * provision.mjs — Codebase analysis and artifact generation engine
 * 
 * Analyzes a project codebase (or user intent for empty directories)
 * and auto-generates project-specific agents, skills, tools, and rules
 * under .opencode/.
 * 
 * Usage: node provision.mjs [options]
 * 
 * See SKILL.md for full documentation.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

// ─── Config ────────────────────────────────────────────────────────────

const PROJECT_ROOT = execSync('git rev-parse --show-toplevel 2>/dev/null', { encoding: 'utf-8' }).trim() || process.cwd();
const GLOBAL_DIR = process.env.OPENCODE_CONFIG_DIR || path.join(os.homedir(), '.config', 'opencode');
const OPENCODE_DIR = path.join(PROJECT_ROOT, '.opencode');

const DEFAULTS = {
  detection: path.join(OPENCODE_DIR, 'state', 'init', 'init-detection.json'),
  checkpoint: path.join(OPENCODE_DIR, 'state', 'init', 'provision-checkpoint.json'),
  outputDir: OPENCODE_DIR,
  templatesDir: null,
};

// ─── CLI Parsing ───────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    detection: DEFAULTS.detection,
    phases: 'all',
    skipAgents: false,
    skipSkills: false,
    skipTools: false,
    skipRules: false,
    force: false,
    outputDir: DEFAULTS.outputDir,
    templatesDir: null,
    checkpoint: DEFAULTS.checkpoint,
    scanOnly: false,
    projectDesc: null,
    verbose: false,
    subcommand: 'full',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--detection': opts.detection = args[++i]; break;
      case '--phases': opts.phases = args[++i]; break;
      case '--skip-agents': opts.skipAgents = true; break;
      case '--skip-skills': opts.skipSkills = true; break;
      case '--skip-tools': opts.skipTools = true; break;
      case '--skip-rules': opts.skipRules = true; break;
      case '--force': opts.force = true; break;
      case '--output-dir': opts.outputDir = args[++i]; break;
      case '--templates': opts.templatesDir = args[++i]; break;
      case '--checkpoint': opts.checkpoint = args[++i]; break;
      case '--scan-only': opts.scanOnly = true; break;
      case '--project-desc': opts.projectDesc = args[++i]; break;
      case '--verbose': opts.verbose = true; break;
      case '--subcommand': opts.subcommand = args[++i]; break;
      default:
        // First unknown arg that isn't a flag value
        if (!args[i].startsWith('--') && !opts.projectDesc) {
          opts.subcommand = args[i];
        }
    }
  }

  return opts;
}

// ─── Detection (Phase 1) ───────────────────────────────────────────────

function detectProject(opts) {
  if (opts.verbose) console.log('[provision] Phase 1: Scanning codebase...');

  const detection = { confidence: 'low' };

  // Check for common config files in order of specificity
  const configs = {
    'package.json': (fp) => scanPackageJson(fp),
    'pyproject.toml': (fp) => scanPyprojectToml(fp),
    'Cargo.toml': (fp) => scanCargoToml(fp),
    'go.mod': (fp) => scanGoMod(fp),
  };

  for (const [file, scanner] of Object.entries(configs)) {
    const fullPath = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(fullPath)) {
      const result = scanner(fullPath);
      Object.assign(detection, result);
      detection.confidence = 'high';
      break;
    }
  }

  // If no config found, check for directory patterns
  if (detection.confidence === 'low') {
    // Look for source files
    const srcFiles = [...scanDir(PROJECT_ROOT, 2)];
    if (srcFiles.length > 0) {
      const types = new Set(srcFiles.map(f => path.extname(f).toLowerCase().replace('.', '')));
      
      if (types.has('tsx') || types.has('ts')) {
        detection.language = 'typescript';
        detection.confidence = types.has('tsx') ? 'high' : 'medium';
      } else if (types.has('jsx') || types.has('js')) {
        detection.language = 'javascript';
        detection.confidence = types.has('jsx') ? 'high' : 'medium';
      } else if (types.has('py')) {
        detection.language = 'python';
        detection.confidence = 'medium';
      } else if (types.has('rs')) {
        detection.language = 'rust';
        detection.confidence = 'medium';
      } else if (types.has('go')) {
        detection.language = 'go';
        detection.confidence = 'medium';
      } else if (types.has('rb')) {
        detection.language = 'ruby';
        detection.confidence = 'medium';
      } else if (types.has('java')) {
        detection.language = 'java';
        detection.confidence = 'medium';
      } else if (types.has('cs')) {
        detection.language = 'csharp';
        detection.confidence = 'medium';
      } else if (types.has('vue')) {
        detection.language = 'vue';
        detection.confidence = 'medium';
      } else if (types.size > 0) {
        detection.language = [...types][0];
        detection.confidence = 'low';
      }
    }

    // Scan for framework indicators
    const fileNames = new Set(srcFiles.map(f => path.basename(f).toLowerCase()));
    
    if (fileNames.has('next.config.js') || fileNames.has('next.config.mjs') || fileNames.has('next.config.ts')) {
      detection.framework = 'nextjs';
    } else if (fileNames.has('vite.config.ts') || fileNames.has('vite.config.js')) {
      detection.framework = 'vite';
    } else if (fileNames.has('astro.config.mjs') || fileNames.has('astro.config.ts')) {
      detection.framework = 'astro';
    }
  }

  // Fill in detection defaults
  detection.language = detection.language || 'unknown';
  detection.packageManager = detection.packageManager || detectPackageManager();
  detection.buildSystem = detection.buildSystem || detection.packageManager || 'unknown';
  detection.directories = detection.directories || detectDirectories();
  detection.keyFiles = detection.keyFiles || detectKeyFiles();

  // Detect available LSPs
  detection.lsp = detectAvailableLsps(detection.language);

  // Fill in convention defaults based on language
  fillConventionDefaults(detection);

  return detection;
}

/**
 * Detect available language servers on the system and map them to the project's language.
 * Returns an object suitable for the "lsp" key in opencode.jsonc.
 */
function detectAvailableLsps(language) {
  const lspConfig = {};

  // Language-to-LSP mapping
  const lspMap = {
    typescript: { name: 'typescript', binary: 'typescript-language-server', always: true },
    javascript: { name: 'typescript', binary: 'typescript-language-server', always: true },
    python:     { name: 'python', binary: 'pyright', alt: 'pylsp' },
    rust:       { name: 'rust', binary: 'rust-analyzer' },
    go:         { name: 'go', binary: 'gopls' },
    lua:        { name: 'lua', binary: 'lua-language-server' },
    vue:        { name: 'vue', binary: 'vue-language-server' },
    svelte:     { name: 'svelte', binary: 'svelte-language-server' },
    java:       { name: 'java', binary: 'jdtls' },
    csharp:     { name: 'csharp', binary: 'csharp-ls' },
    ruby:       { name: 'ruby', binary: 'solargraph' },
    php:        { name: 'php', binary: 'intelephense' },
  };

  // Always-enable LSPs (built into OpenCode or universally useful)
  const alwaysEnabled = ['css', 'html', 'json'];

  // Add language-specific LSP if detected
  const langLsp = lspMap[language];
  if (langLsp) {
    if (langLsp.always) {
      lspConfig[langLsp.name] = { enabled: true };
    } else {
      const found = checkBinary(langLsp.binary) || (langLsp.alt && checkBinary(langLsp.alt));
      if (found) {
        lspConfig[langLsp.name] = { enabled: true };
      }
    }
  }

  // Add always-enabled LSPs
  for (const lsp of alwaysEnabled) {
    lspConfig[lsp] = { enabled: true };
  }

  return lspConfig;
}

function checkBinary(binary) {
  try {
    execSync(`which ${binary} 2>/dev/null`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function scanPackageJson(filepath) {
  const content = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  const pkg = content;

  const detection = {
    language: 'typescript',
    packageManager: detectPackageManager(),
    keyFiles: ['package.json'],
  };

  // Detect framework from dependencies
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const frameworkPatterns = {
    'next': { framework: 'nextjs', frameworkVersion: deps.next },
    'react': { framework: 'react' },
    'vue': { framework: 'vue' },
    '@angular/core': { framework: 'angular' },
    'svelte': { framework: 'svelte' },
    '@nestjs/core': { framework: 'nestjs' },
    'express': { framework: 'express' },
    'fastify': { framework: 'fastify' },
    'nuxt': { framework: 'nuxt' },
    'remix': { framework: 'remix' },
    'gatsby': { framework: 'gatsby' },
    'astro': { framework: 'astro' },
  };

  for (const [dep, fw] of Object.entries(frameworkPatterns)) {
    if (deps[dep]) {
      Object.assign(detection, fw);
      // Try to extract detected version
      if (deps[dep] && !detection.frameworkVersion) {
        const match = deps[dep].match(/\d+\.\d+/);
        if (match) detection.frameworkVersion = match[0];
      }
      break;
    }
  }

  // Detect build system
  if (pkg.scripts?.build) {
    const buildCmd = pkg.scripts.build;
    if (buildCmd.includes('next')) detection.buildSystem = 'next build';
    else if (buildCmd.includes('vite')) detection.buildSystem = 'vite build';
    else if (buildCmd.includes('tsc')) detection.buildSystem = 'tsc';
    else if (buildCmd.includes('webpack')) detection.buildSystem = 'webpack';
    else if (buildCmd.includes('rollup')) detection.buildSystem = 'rollup';
    else if (buildCmd.includes('esbuild')) detection.buildSystem = 'esbuild';
    else detection.buildSystem = buildCmd;
  }

  // Detect test framework
  const testPatterns = {
    'jest': { testFramework: 'jest', testCommand: 'npm test' },
    'vitest': { testFramework: 'vitest', testCommand: 'npx vitest run' },
    '@playwright/test': { testFramework: 'playwright', testCommand: 'npx playwright test' },
    'mocha': { testFramework: 'mocha', testCommand: 'npx mocha' },
    'cypress': { testFramework: 'cypress', testCommand: 'npx cypress run' },
    'ava': { testFramework: 'ava', testCommand: 'npx ava' },
    'jasmine': { testFramework: 'jasmine', testCommand: 'npx jasmine' },
  };

  for (const [dep, tf] of Object.entries(testPatterns)) {
    if (deps[dep]) {
      Object.assign(detection, tf);
      break;
    }
  }

  // Detect lint/formatter
  const lintPatterns = {
    'eslint': { lintCommand: 'npx eslint .' },
    'prettier': { lintCommand: 'npx prettier --check .' },
    'biome': { lintCommand: 'npx biome check .' },
    'rome': { lintCommand: 'npx rome check .' },
    'standard': { lintCommand: 'npx standard' },
  };

  for (const [dep, lf] of Object.entries(lintPatterns)) {
    if (deps[dep]) {
      Object.assign(detection, lf);
      if (pkg.scripts?.lint) detection.lintCommand = `npm run lint`;
      break;
    }
  }

  // Detect database
  const dbPatterns = ['prisma', 'typeorm', 'drizzle-orm', 'sequelize', 'mongoose', 'knex', 'pg', 'mysql2'];
  for (const db of dbPatterns) {
    if (deps[db]) {
      detection.database = db;
      break;
    }
  }

  // Detect UI libraries
  const uiPatterns = {
    'tailwindcss': 'tailwind',
    '@mui/material': 'mui',
    '@chakra-ui/react': 'chakra',
    'antd': 'ant-design',
    'shadcn': 'shadcn',
    '@radix-ui/react': 'radix',
    'bootstrap': 'bootstrap',
  };

  for (const [dep, ui] of Object.entries(uiPatterns)) {
    if (deps[dep]) {
      detection.uiLibrary = ui;
      break;
    }
  }

  // Detect state management
  const statePatterns = ['zustand', 'redux', 'mobx', 'jotai', 'recoil', 'pinia', 'vuex', 'effector'];
  for (const sm of statePatterns) {
    if (deps[sm]) {
      detection.stateManagement = sm;
      break;
    }
  }

  // Detect ORM (if not already set)
  if (!detection.database) {
    const ormPatterns = ['prisma', 'typeorm', 'drizzle-orm', 'sequelize', 'mongoose', 'knex'];
    for (const orm of ormPatterns) {
      if (deps[orm]) {
        detection.database = orm;
        break;
      }
    }
  }

  // Detect testing library
  const testingLibs = ['@testing-library/react', '@testing-library/vue', '@testing-library/angular'];
  for (const tl of testingLibs) {
    if (deps[tl]) {
      detection.testingLibrary = tl;
      break;
    }
  }

  if (pkg.scripts?.dev) detection.devCommand = 'npm run dev';
  if (pkg.scripts?.start) detection.startCommand = 'npm start';

  // Detect architecture patterns
  if (fs.existsSync(path.join(PROJECT_ROOT, 'src', 'app')) && deps.next) {
    detection.architecture = 'Next.js App Router';
  } else if (fs.existsSync(path.join(PROJECT_ROOT, 'src', 'pages')) && deps.next) {
    detection.architecture = 'Next.js Pages Router';
  } else if (fs.existsSync(path.join(PROJECT_ROOT, 'src', 'components'))) {
    detection.architecture = 'Component-based SPA';
  }

  // Detect CI/CD
  if (fs.existsSync(path.join(PROJECT_ROOT, '.github', 'workflows'))) {
    detection.ci = 'github-actions';
  } else if (fs.existsSync(path.join(PROJECT_ROOT, '.gitlab-ci.yml'))) {
    detection.ci = 'gitlab-ci';
  } else if (fs.existsSync(path.join(PROJECT_ROOT, '.circleci', 'config.yml'))) {
    detection.ci = 'circleci';
  }

  // Detect deployment
  if (deps.vercel || fs.existsSync(path.join(PROJECT_ROOT, 'vercel.json'))) {
    detection.deployment = 'vercel';
  } else if (deps.netlify || fs.existsSync(path.join(PROJECT_ROOT, 'netlify.toml'))) {
    detection.deployment = 'netlify';
  } else if (fs.existsSync(path.join(PROJECT_ROOT, 'Dockerfile'))) {
    detection.deployment = 'docker';
  }

  // Detect styling
  if (deps.tailwindcss) {
    detection.styling = 'Tailwind CSS';
  } else if (deps['styled-components']) {
    detection.styling = 'styled-components';
  } else if (deps['@emotion/react']) {
    detection.styling = 'Emotion';
  } else if (deps.sass || deps['node-sass']) {
    detection.styling = 'SASS/SCSS';
  } else {
    detection.styling = 'CSS Modules';
  }

  // Detect TypeScript config
  const tsconfigPaths = ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json'];
  for (const ts of tsconfigPaths) {
    if (fs.existsSync(path.join(PROJECT_ROOT, ts))) {
      detection.keyFiles.push(ts);
      try {
        const tsConfig = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, ts), 'utf-8'));
        if (tsConfig.compilerOptions?.paths) {
          detection.pathAliases = tsConfig.compilerOptions.paths;
        }
      } catch {}
    }
  }

  return detection;
}

function scanPyprojectToml(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const detection = {
    language: 'python',
    packageManager: detectPackageManager(),
    keyFiles: ['pyproject.toml'],
  };

  if (content.includes('django')) {
    detection.framework = 'django';
  } else if (content.includes('fastapi') || content.includes('starlette')) {
    detection.framework = 'fastapi';
  } else if (content.includes('flask')) {
    detection.framework = 'flask';
  } else if (content.includes('pytest')) {
    detection.framework = 'python';
    detection.testFramework = 'pytest';
    detection.testCommand = 'pytest';
  }

  return detection;
}

function scanCargoToml(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const detection = {
    language: 'rust',
    packageManager: 'cargo',
    buildSystem: 'cargo build',
    keyFiles: ['Cargo.toml'],
  };

  if (content.includes('actix-web')) {
    detection.framework = 'actix-web';
  } else if (content.includes('rocket')) {
    detection.framework = 'rocket';
  } else if (content.includes('axum')) {
    detection.framework = 'axum';
  } else if (content.includes('warp')) {
    detection.framework = 'warp';
  } else if (content.includes('tokio')) {
    detection.framework = 'tokio';
  }

  return detection;
}

function scanGoMod(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  return {
    language: 'go',
    packageManager: 'go mod',
    buildSystem: 'go build',
    keyFiles: ['go.mod'],
    framework: detectGoFramework(content),
  };
}

function detectGoFramework(content) {
  if (content.includes('gin-gonic')) return 'gin';
  if (content.includes('fiber')) return 'fiber';
  if (content.includes('echo')) return 'echo';
  if (content.includes('chi')) return 'chi';
  if (content.includes('gorilla/mux')) return 'gorilla-mux';
  return 'go';
}

function detectPackageManager() {
  const lockFiles = {
    'package-lock.json': 'npm',
    'yarn.lock': 'yarn',
    'pnpm-lock.yaml': 'pnpm',
    'bun.lockb': 'bun',
    'bun.lock': 'bun',
    'poetry.lock': 'poetry',
    'Cargo.lock': 'cargo',
    'Gemfile.lock': 'bundler',
    'composer.lock': 'composer',
    'mix.lock': 'hex',
    'go.sum': 'go mod',
    'Pipfile.lock': 'pipenv',
  };
  
  for (const [lock, pm] of Object.entries(lockFiles)) {
    if (fs.existsSync(path.join(PROJECT_ROOT, lock))) return pm;
  }
  return 'unknown';
}

function detectDirectories() {
  const dirs = {};
  
  // Common source directory patterns
  const sourceDirs = ['src', 'app', 'lib', 'source', 'packages', 'server', 'client'];
  for (const d of sourceDirs) {
    const fullPath = path.join(PROJECT_ROOT, d);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory() && !d.startsWith('.')) {
      dirs.source = d;
      break;
    }
  }

  // Test directories
  const testDirs = ['tests', 'test', '__tests__', 'spec', 'e2e', 'cypress'];
  for (const d of testDirs) {
    if (fs.existsSync(path.join(PROJECT_ROOT, d))) {
      dirs.test = d;
      break;
    }
  }

  // Other common dirs
  if (fs.existsSync(path.join(PROJECT_ROOT, 'public'))) dirs.public = 'public';
  if (fs.existsSync(path.join(PROJECT_ROOT, 'docs'))) dirs.docs = 'docs';
  if (fs.existsSync(path.join(PROJECT_ROOT, 'scripts'))) dirs.scripts = 'scripts';
  if (fs.existsSync(path.join(PROJECT_ROOT, 'config'))) dirs.config = 'config';
  if (fs.existsSync(path.join(PROJECT_ROOT, 'docker'))) dirs.docker = 'docker';
  if (fs.existsSync(path.join(PROJECT_ROOT, 'examples'))) dirs.examples = 'examples';

  return dirs;
}

function detectKeyFiles() {
  const files = [];
  const commonFiles = [
    'package.json', 'tsconfig.json', 'next.config.js', 'next.config.ts', 'next.config.mjs',
    'vite.config.ts', 'vite.config.js', 'astro.config.mjs',
    'pyproject.toml', 'setup.py', 'requirements.txt',
    'Cargo.toml', 'go.mod', 'composer.json', 'Gemfile',
    '.eslintrc.js', '.eslintrc.json', '.eslintrc', '.prettierrc',
    'biome.json', '.github/workflows',
    'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
    'vercel.json', 'netlify.toml',
    'tailwind.config.ts', 'tailwind.config.js', 'postcss.config.js',
    'jest.config.ts', 'jest.config.js', 'vitest.config.ts', 'vitest.config.js',
    '.env.example',
  ];
  for (const f of commonFiles) {
    if (fs.existsSync(path.join(PROJECT_ROOT, f))) files.push(f);
  }
  return files;
}

function fillConventionDefaults(detection) {
  const langDefaults = {
    typescript: {
      version: '5.x',
      importStyle: 'ES modules',
      errorHandling: 'try/catch with typed errors',
      namingConventions: {
        variables: 'camelCase',
        functions: 'camelCase',
        classes: 'PascalCase',
        interfaces: 'PascalCase with I? prefix',
        types: 'PascalCase',
        files: 'kebab-case (.ts) / PascalCase (.tsx)',
        constants: 'UPPER_SNAKE_CASE',
        components: 'PascalCase',
      },
    },
    javascript: {
      version: 'ES2022+',
      importStyle: 'ES modules',
      errorHandling: 'try/catch',
      namingConventions: {
        variables: 'camelCase',
        functions: 'camelCase',
        classes: 'PascalCase',
        files: 'kebab-case (.js) / PascalCase (.jsx)',
        constants: 'UPPER_SNAKE_CASE',
        components: 'PascalCase',
      },
    },
    python: {
      version: '3.x',
      importStyle: 'absolute imports',
      errorHandling: 'try/except with custom exceptions',
      namingConventions: {
        variables: 'snake_case',
        functions: 'snake_case',
        classes: 'PascalCase',
        modules: 'snake_case',
        constants: 'UPPER_SNAKE_CASE',
        files: 'snake_case',
      },
    },
    rust: {
      version: '2024 edition',
      importStyle: 'crate::module::item',
      errorHandling: 'Result<T, E> with ? operator',
      namingConventions: {
        variables: 'snake_case',
        functions: 'snake_case',
        types: 'PascalCase',
        traits: 'PascalCase',
        enums: 'PascalCase',
        files: 'snake_case',
        constants: 'SCREAMING_SNAKE_CASE',
      },
    },
    go: {
      version: '1.22+',
      importStyle: 'full module paths',
      errorHandling: 'if err != nil { return err }',
      namingConventions: {
        variables: 'camelCase',
        exported: 'PascalCase (capitalized = exported)',
        files: 'snake_case',
        packages: 'single word, lowercase',
        constants: 'PascalCase',
      },
    },
  };

  const lang = detection.language;
  if (lang === 'typescript' || lang === 'javascript') {
    if (detection.framework === 'nextjs') {
      detection.architecture = detection.architecture || 'Next.js App Router with React Server Components';
      detection.styling = detection.styling || 'Tailwind CSS + CSS Modules';
      detection.testingStrategy = detection.testFramework 
        ? `${detection.testFramework} + React Testing Library`
        : 'Jest + React Testing Library';
    } else if (detection.framework === 'react') {
      detection.architecture = detection.architecture || 'Component-based SPA';
      detection.styling = detection.styling || 'CSS-in-JS/CSS Modules';
      detection.testingStrategy = detection.testFramework
        ? `${detection.testFramework} + React Testing Library`
        : 'Jest + React Testing Library';
    }
  }

  if (langDefaults[lang]) {
    Object.assign(detection, {
      ...langDefaults[lang],
      ...detection, // Don't override explicit detections
    });
  }
}

function* scanDir(dir, maxDepth, currentDepth = 0) {
  if (currentDepth > maxDepth) return;
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      if (entry.startsWith('.') || entry === 'node_modules' || entry === 'target' || 
          entry === 'dist' || entry === '.next' || entry === '__pycache__' ||
          entry === '.venv' || entry === 'venv') continue;
      const fullPath = path.join(dir, entry);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) yield fullPath;
        else if (stat.isDirectory() && currentDepth < maxDepth) {
          yield* scanDir(fullPath, maxDepth, currentDepth + 1);
        }
      } catch {}
    }
  } catch {}
}

// ─── Template System ────────────────────────────────────────────────────

function resolveTemplatesDir(opts) {
  if (opts.templatesDir) return opts.templatesDir;
  // Look for templates relative to this script
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const localTemplates = path.join(scriptDir, '..', 'templates');
  if (fs.existsSync(localTemplates)) return localTemplates;
  return null;
}

function applyTemplate(template, values) {
  let result = template;
  for (const [key, val] of Object.entries(values)) {
    const placeholder = new RegExp(`\\[${key}\\]`, 'g');
    result = result.replace(placeholder, String(val ?? ''));
  }
  return result;
}

function readTemplateFile(templatesDir, category, name) {
  const filePath = path.join(templatesDir, category, name);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return null;
}

function safeWriteFile(filePath, content, force, verbose = false) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (fs.existsSync(filePath) && !force) {
    if (verbose) console.log(`  ⏭  Skipping existing file: ${filePath} (use --force to overwrite)`);
    return false;
  }
  
  fs.writeFileSync(filePath, content, 'utf-8');
  if (verbose) console.log(`  ✓ ${filePath}`);
  return true;
}

// ─── Phase 2: Agents ──────────────────────────────────────────────────

function generateAgents(detection, opts) {
  if (opts.skipAgents) return [];
  if (opts.verbose) console.log('\n[provision] Phase 2: Generating project-aware agent wrappers...');

  const agentsDir = path.join(opts.outputDir, 'agents');
  if (!fs.existsSync(agentsDir)) fs.mkdirSync(agentsDir, { recursive: true });

  // Select which agents to wrap based on language
  const agentSelections = agentSelectionMap(detection);
  const generated = [];

  for (const [name, config] of Object.entries(agentSelections)) {
    const content = generateAgentWrapper(name, config, detection);
    const filePath = path.join(agentsDir, `${name}.md`);
    if (safeWriteFile(filePath, content, opts.force, opts.verbose)) {
      generated.push({ type: 'agent', name, path: `.opencode/agents/${name}.md` });
    }
  }

  return generated;
}

function agentSelectionMap(detection) {
  const lang = detection.language;
  const fw = detection.framework;

  // Default: all agents
  const allAgents = {
    executor: { description: 'Implementation with project conventions and build/test commands' },
    planner: { description: 'Planning with awareness of project structure and dependencies' },
    architect: { description: 'Architecture decisions respecting existing patterns and constraints' },
    critic: { description: 'Review with project-specific quality bars, conventions, and anti-patterns' },
    'code-reviewer': { description: 'Code review using project conventions, testing expectations, and naming rules' },
    'security-reviewer': { description: 'Security audit with awareness of project-specific attack surface' },
    refactoring: { description: 'Refactoring with knowledge of module boundaries and conventions' },
    'test-engineer': { description: 'Test writing matching project test framework and coverage targets' },
    debugger: { description: 'Debugging with project-specific error patterns and entry points' },
    verifier: { description: 'Verification using project-specific test/lint/build commands' },
  };

  // Language-specific selections
  const selections = {
    typescript: allAgents,
    javascript: allAgents,
    python: {
      executor: allAgents.executor,
      planner: allAgents.planner,
      'test-engineer': allAgents['test-engineer'],
      debugger: allAgents.debugger,
      'code-reviewer': allAgents['code-reviewer'],
      verifier: allAgents.verifier,
    },
    rust: {
      executor: allAgents.executor,
      'code-reviewer': allAgents['code-reviewer'],
      debugger: allAgents.debugger,
      'security-reviewer': allAgents['security-reviewer'],
      planner: allAgents.planner,
    },
    go: {
      executor: allAgents.executor,
      planner: allAgents.planner,
      'code-reviewer': allAgents['code-reviewer'],
      'security-reviewer': allAgents['security-reviewer'],
      verifier: allAgents.verifier,
    },
  };

  return selections[lang] || allAgents;
}

function generateAgentWrapper(name, config, detection) {
  const lang = detection.language;
  const fw = detection.framework;

  return `---
extends: ../../agents/${name}.md
description: Project-aware wrapper for ${name} agent with ${lang}/${fw} context injected
model: ollama/deepseek-v4-flash:cloud
mode: subagent
---

You are a project-aware ${name} agent for a ${lang}/${fw} project.

<Agent_Prompt>
  <Project_Context>
    ### Language & Framework
    - Language: ${lang}${detection.version ? ' ' + detection.version : ''}
    - Framework: ${fw}${detection.frameworkVersion ? ' ' + detection.frameworkVersion : ''}
    - Package manager: ${detection.packageManager}
    - Build system: ${detection.buildSystem}

    ### Architecture
    - Architecture: ${detection.architecture || 'Not yet detected'}
    - Source directory: ${detection.directories?.source || 'N/A'}
    - Test directory: ${detection.directories?.test || 'N/A'}
    - Key files: ${(detection.keyFiles || []).join(', ')}

    ### Conventions
    - Import style: ${detection.importStyle || 'N/A'}
    - Error handling: ${detection.errorHandling || 'N/A'}
    - File naming: ${detection.namingConventions?.files || 'N/A'}
    - Function/variable naming: ${detection.namingConventions?.functions || 'N/A'}

    ### Testing
    - Framework: ${detection.testFramework || 'Not detected'}
    - Command: \`${detection.testCommand || 'N/A'}\`
    - Library: ${detection.testingLibrary || 'N/A'}

    ### UI/Styling
    - Styling: ${detection.styling || 'N/A'}
    - UI library: ${detection.uiLibrary || 'None detected'}
    - State management: ${detection.stateManagement || 'None detected'}

    ### Database
    - ORM/DB: ${detection.database || 'None detected'}

    ### DevOps
    - CI: ${detection.ci || 'None detected'}
    - Deployment: ${detection.deployment || 'Not configured'}
  </Project_Context>

  <Commands>
    - Build: \`${detection.buildSystem ? (detection.packageManager === 'npm' ? 'npm run build' : detection.packageManager + ' build') : 'Not configured'}\`
    - Test: \`${detection.testCommand || 'Not configured'}\`
    - Lint: \`${detection.lintCommand || 'Not configured'}\`
    - Dev: \`${detection.devCommand || (detection.packageManager === 'npm' ? 'npm run dev' : 'Not configured')}\`
  </Commands>

  <Loading_Instructions>
    Load this file in the agent's system prompt via the \`@opencode-config\` system, allowing inherited agents to seamlessly access project context without manual specification.
  </Loading_Instructions>
</Agent_Prompt>
`;
}

// ─── Phase 3: Skills ───────────────────────────────────────────────────

function generateSkills(detection, opts) {
  if (opts.skipSkills) return [];
  if (opts.verbose) console.log('\n[provision] Phase 3: Generating project-specific skills...');

  const skillsBaseDir = path.join(opts.outputDir, 'skills');
  const generated = [];

  // Build skill
  const buildContent = generateBuildSkill(detection);
  if (buildContent) {
    const skillDir = path.join(skillsBaseDir, 'build');
    if (!fs.existsSync(skillDir)) fs.mkdirSync(skillDir, { recursive: true });
    if (safeWriteFile(path.join(skillDir, 'SKILL.md'), buildContent, opts.force)) {
      generated.push({ type: 'skill', name: 'build', path: `.opencode/skills/build/SKILL.md` });
    }
  }

  // Test skill
  const testContent = generateTestSkill(detection);
  if (testContent) {
    const skillDir = path.join(skillsBaseDir, 'test');
    if (!fs.existsSync(skillDir)) fs.mkdirSync(skillDir, { recursive: true });
    if (safeWriteFile(path.join(skillDir, 'SKILL.md'), testContent, opts.force)) {
      generated.push({ type: 'skill', name: 'test', path: `.opencode/skills/test/SKILL.md` });
    }
  }

  // Lint skill
  const lintContent = generateLintSkill(detection);
  if (lintContent) {
    const skillDir = path.join(skillsBaseDir, 'lint');
    if (!fs.existsSync(skillDir)) fs.mkdirSync(skillDir, { recursive: true });
    if (safeWriteFile(path.join(skillDir, 'SKILL.md'), lintContent, opts.force)) {
      generated.push({ type: 'skill', name: 'lint', path: `.opencode/skills/lint/SKILL.md` });
    }
  }

  // Deploy skill (only if deployment detected)
  if (detection.deployment) {
    const deployContent = generateDeploySkill(detection);
    if (deployContent) {
      const skillDir = path.join(skillsBaseDir, 'deploy');
      if (!fs.existsSync(skillDir)) fs.mkdirSync(skillDir, { recursive: true });
      if (safeWriteFile(path.join(skillDir, 'SKILL.md'), deployContent, opts.force)) {
        generated.push({ type: 'skill', name: 'deploy', path: `.opencode/skills/deploy/SKILL.md` });
      }
    }
  }

  // Architecture skill
  const archContent = generateArchitectureSkill(detection);
  if (archContent) {
    const skillDir = path.join(skillsBaseDir, 'architecture');
    if (!fs.existsSync(skillDir)) fs.mkdirSync(skillDir, { recursive: true });
    if (safeWriteFile(path.join(skillDir, 'SKILL.md'), archContent, opts.force)) {
      generated.push({ type: 'skill', name: 'architecture', path: `.opencode/skills/architecture/SKILL.md` });
    }
  }

  // Conventions skill
  const convContent = generateConventionsSkill(detection);
  if (convContent) {
    const skillDir = path.join(skillsBaseDir, 'conventions');
    if (!fs.existsSync(skillDir)) fs.mkdirSync(skillDir, { recursive: true });
    if (safeWriteFile(path.join(skillDir, 'SKILL.md'), convContent, opts.force)) {
      generated.push({ type: 'skill', name: 'conventions', path: `.opencode/skills/conventions/SKILL.md` });
    }
  }

  return generated;
}

function generateBuildSkill(detection) {
  const pm = detection.packageManager;
  const buildCmd = detection.buildSystem || `${pm} build`;
  
  return `---
name: build
description: Build the project using ${detection.buildSystem} — handles compilation, bundling, and output verification
level: 1
---

# Build

Build instructions for the ${detection.language}/${detection.framework} project.

## Workflow

1. Install dependencies: \`${pm} install\`
2. Build: \`${pm === 'npm' ? 'npm run build' : pm + ' build'}\`
3. Verify: Ensure build output exists in the expected output directory

## Common Commands

| Command | Description |
|---------|-------------|
| \`${pm} install\` | Install dependencies |
| \`${pm === 'npm' ? 'npm run build' : pm + ' build'}\` | Production build |
| \`${pm === 'npm' ? 'npm run dev' : pm + ' dev'}\` | Development server |
| \`${pm} run build -- --analyze\` | Build with bundle analysis |

## Common Issues

- **Type errors during build**: Run \`npx tsc --noEmit\` first to check types
- **Missing dependencies**: Run \`${pm} install\` to sync
- **Build cache issues**: Delete \`node_modules/.cache\` and retry
`;
}

function generateTestSkill(detection) {
  const tf = detection.testFramework || 'unknown';
  const cmd = detection.testCommand || `${detection.packageManager || 'npm'} test`;
  
  return `---
name: test
description: Run tests using ${tf} — run all, single file, watch mode, or coverage
level: 1
---

# Test

Test execution for the project using ${tf}.

## Commands

| Command | Description |
|---------|-------------|
| \`${cmd}\` | Run all tests |
| \`${cmd} -- --coverage\` | Run with coverage report |
| \`${cmd} -- --watch\` | Watch mode |
| \`${cmd} -- <file-path>\` | Specific test file |

## Conventions

- Test location: ${detection.directories?.test || 'co-located with source'}
- File naming: \`*.test.*\` or \`*.spec.*\`
- ${detection.testingLibrary ? `Testing library: ${detection.testingLibrary}` : ''}

## Coverage Targets

- Aim for 80%+ coverage on business logic
- Critical paths require 100% coverage
`;
}

function generateLintSkill(detection) {
  const lintCmd = detection.lintCommand || `${detection.packageManager} run lint`;
  
  return `---
name: lint
description: Lint and format code — auto-fix, check, format
level: 1
---

# Lint

Lint and format the project codebase.

## Commands

| Command | Description |
|---------|-------------|
| \`${lintCmd}\` | Run lint check |
| \`${lintCmd} -- --fix\` | Auto-fix issues |
| Run linter on path | Check specific files/directories |

## Pre-Commit

Run lint before committing to catch issues early.
`;
}

function generateDeploySkill(detection) {
  const target = detection.deployment || 'production';
  
  return `---
name: deploy
description: Deploy to ${target} — preview, production, rollback
level: 1
---

# Deploy

Deployment workflow for ${target}.

## Environments

${detection.deployment === 'vercel' ? `- Preview: \`vercel\`
- Production: \`vercel --prod\`` : 
 detection.deployment === 'netlify' ? `- Preview: \`netlify deploy\`
- Production: \`netlify deploy --prod\`` :
 `- Production: Deploy via CI/CD pipeline`}

## Workflow

1. Build: \`${detection.packageManager === 'npm' ? 'npm run build' : detection.packageManager + ' build'}\`
2. ${detection.deployment === 'docker' ? 'Build image: `docker build -t app:latest .`\n2. Push: `docker push registry/app:latest`' : `Deploy: Use platform-specific command`}
3. Verify: Check deployment health endpoint
`;
}

function generateArchitectureSkill(detection) {
  const dirs = detection.directories || {};
  
  return `---
name: architecture
description: Reference skill describing project architecture — directory layout, design patterns, data flow
level: 1
---

# Architecture

Architecture reference for the ${detection.language}/${detection.framework} project.

## Directory Layout

\`\`\`
${dirs.source || 'src/'}/             — Source code
  ${detection.framework === 'nextjs' ? 'app/           — App Router pages and API routes' : 'components/   — UI components'}
${dirs.test || 'tests/'}/            — Test files
${dirs.public ? 'public/        — Static assets' : ''}
${dirs.docs ? 'docs/          — Documentation' : ''}
${dirs.scripts ? 'scripts/      — Build and utility scripts' : ''}
\`\`\`

## Design Patterns

${detection.architecture ? `- Architecture style: ${detection.architecture}` : ''}
${detection.stateManagement ? `- State management: ${detection.stateManagement}` : ''}
${detection.database ? `- Database/ORM: ${detection.database}` : ''}
${detection.styling ? `- Styling approach: ${detection.styling}` : ''}

## Key Dependencies

| Dependency | Purpose |
|------------|---------|
| ${detection.framework} | Core framework |
| ${detection.testFramework} | Testing |
| ${detection.database} | Database access |
| ${detection.styling} | Styling |
`;
}

function generateConventionsSkill(detection) {
  const nc = detection.namingConventions || {};
  
  return `---
name: conventions
description: Coding conventions — naming, imports, error handling, testing patterns
level: 1
---

# Conventions

Coding conventions for the ${detection.language}/${detection.framework} project.

## Naming

| Category | Convention | Example |
|----------|-----------|---------|
| ${nc.variables ? 'Variables | ' + nc.variables : 'Functions | ' + (nc.functions || 'camelCase')} |
| ${nc.classes ? 'Classes | ' + nc.classes : ''} |
| ${nc.files ? 'Files | ' + nc.files : ''} |
| ${nc.constants ? 'Constants | ' + nc.constants : ''} |
| ${nc.components ? 'Components | ' + nc.components : ''} |

## Imports

- ${detection.importStyle || 'ES modules'}
- Use path aliases where configured
- Group: external → internal → relative

## Error Handling

- ${detection.errorHandling || 'try/catch with custom error types'}
- Log errors with appropriate context
- Return user-friendly error messages

## ${detection.testFramework ? `Testing (${detection.testFramework})` : 'Testing'}

${detection.testCommand ? `- Run: \`${detection.testCommand}\`` : ''}
${detection.testingLibrary ? `- Library: ${detection.testingLibrary}` : ''}
- Test name describes behavior: "returns X when Y"
- One assertion pattern per test where possible
`;
}

// ─── Phase 4: Tools ────────────────────────────────────────────────────

function generateTools(detection, opts) {
  if (opts.skipTools) return [];
  if (opts.verbose) console.log('\n[provision] Phase 4: Generating project-specific tools...');

  const toolsDir = path.join(opts.outputDir, 'tools');
  if (!fs.existsSync(toolsDir)) fs.mkdirSync(toolsDir, { recursive: true });

  const generated = [];

  // project-info.ts — always generated
  const infoContent = generateProjectInfoTool(detection);
  if (safeWriteFile(path.join(toolsDir, 'project-info.ts'), infoContent, opts.force)) {
    generated.push({ type: 'tool', name: 'project-info', path: '.opencode/tools/project-info.ts' });
  }

  // Deploy tool (if deployment detected)
  if (detection.deployment) {
    const deployContent = generateDeployTool(detection);
    if (safeWriteFile(path.join(toolsDir, 'deploy.ts'), deployContent, opts.force)) {
      generated.push({ type: 'tool', name: 'deploy', path: '.opencode/tools/deploy.ts' });
    }
  }

  // DB migration tool (if database detected)
  if (detection.database) {
    const dbContent = generateDbMigrateTool(detection);
    if (safeWriteFile(path.join(toolsDir, 'db-migrate.ts'), dbContent, opts.force)) {
      generated.push({ type: 'tool', name: 'db-migrate', path: '.opencode/tools/db-migrate.ts' });
    }
  }

  return generated;
}

function generateProjectInfoTool(detection) {
  return `import { tool } from "@opencode-ai/plugin"

export default tool({
  name: "project-info",
  description: "Returns project metadata including language, framework, build/test/lint commands, and conventions.",
  args: {},
  async execute(args, context) {
    return JSON.stringify({
      language: "${detection.language}",
      version: "${detection.version || ''}",
      framework: "${detection.framework || ''}",
      packageManager: "${detection.packageManager}",
      buildCommand: "${detection.packageManager === 'npm' ? 'npm run build' : detection.packageManager + ' build'}",
      testCommand: "${detection.testCommand || 'Not configured'}",
      lintCommand: "${detection.lintCommand || 'Not configured'}",
      devCommand: "${detection.devCommand || (detection.packageManager === 'npm' ? 'npm run dev' : 'Not configured')}",
      sourceDir: "${detection.directories?.source || 'src/'}",
      testDir: "${detection.directories?.test || 'tests/'}",
      style: "${detection.styling || 'Not detected'}",
      testing: "${detection.testFramework || 'Not detected'}",
      architecture: "${detection.architecture || 'Not detected'}",
      lint: "${detection.lintCommand || 'Not detected'}",
      ci: "${detection.ci || 'Not detected'}",
      deployment: "${detection.deployment || 'Not configured'}",
      keyFiles: ${JSON.stringify(detection.keyFiles || [])},
      directories: ${JSON.stringify(detection.directories || {})}
    }, null, 2)
  }
})
`;
}

function generateDeployTool(detection) {
  return `import { tool } from "@opencode-ai/plugin"
import { execSync } from "child_process"

export default tool({
  name: "deploy",
  description: "Deploy the project to ${detection.deployment}.",
  args: {
    environment: {
      type: "string",
      description: "Deployment environment (preview or production)",
      default: "preview"
    }
  },
  async execute(args, context) {
    const env = args.environment || "preview"
    try {
      const buildCmd = "${detection.packageManager === 'npm' ? 'npm run build' : detection.packageManager + ' build'}"
      execSync(buildCmd, { stdio: "inherit" })
      return { environment: env, status: "built", message: "Build completed. Ready for deployment." }
    } catch (error) {
      return { environment: env, status: "failed", error: error.message }
    }
  }
})
`;
}

function generateDbMigrateTool(detection) {
  const orm = detection.database;
  // Determine migration commands based on ORM
  let createCmd, upCmd, downCmd, statusCmd;
  
  if (orm === 'prisma') {
    createCmd = 'npx prisma migrate dev --name';
    upCmd = 'npx prisma migrate deploy';
    downCmd = 'npx prisma migrate reset';
    statusCmd = 'npx prisma migrate status';
  } else if (orm === 'typeorm') {
    createCmd = 'npx typeorm migration:create';
    upCmd = 'npx typeorm migration:run';
    downCmd = 'npx typeorm migration:revert';
    statusCmd = 'npx typeorm migration:show';
  } else if (orm === 'drizzle-orm') {
    createCmd = 'npx drizzle-kit generate';
    upCmd = 'npx drizzle-kit push';
    downCmd = 'npx drizzle-kit drop';
    statusCmd = 'npx drizzle-kit check';
  } else {
    createCmd = 'npx migrate create';
    upCmd = 'npx migrate up';
    downCmd = 'npx migrate down';
    statusCmd = 'npx migrate status';
  }

  return `import { tool } from "@opencode-ai/plugin"
import { execSync } from "child_process"

export default tool({
  name: "db-migrate",
  description: "Run database migrations for ${orm} — create, apply, rollback, status.",
  args: {
    action: {
      type: "string",
      enum: ["create", "up", "down", "status"],
      description: "Migration action"
    },
    name: {
      type: "string",
      description: "Migration name (for create action)"
    }
  },
  async execute(args, context) {
    try {
      let cmd
      switch (args.action) {
        case "create":
          cmd = "${createCmd}" + (args.name ? " " + args.name : "")
          break
        case "up":
          cmd = "${upCmd}"
          break
        case "down":
          cmd = "${downCmd}"
          break
        case "status":
          cmd = "${statusCmd}"
          break
        default:
          return { error: "Unknown action: " + args.action }
      }
      execSync(cmd, { stdio: "inherit" })
      return { action: args.action, status: "executed" }
    } catch (error) {
      return { action: args.action, status: "failed", error: error.message }
    }
  }
})
`;
}

// ─── Phase 5: Rules ────────────────────────────────────────────────────

function generateRules(detection, opts) {
  if (opts.skipRules) return [];
  if (opts.verbose) console.log('\n[provision] Phase 5: Generating project rules...');

  const rulesDir = path.join(opts.outputDir, 'rules');
  if (!fs.existsSync(rulesDir)) fs.mkdirSync(rulesDir, { recursive: true });

  const generated = [];
  const lang = detection.language;
  const fw = detection.framework;
  const prefix = `${lang}${fw ? '-' + fw : ''}`;

  // Core rules (always generated)
  const rules = {
    [`00-${prefix}-conventions.md`]: generateConventionsRule(detection),
    ['01-architecture.md']: generateArchitectureRule(detection),
    ['02-testing.md']: generateTestingRule(detection),
    ['03-naming.md']: generateNamingRule(detection),
  };

  // Conditional rules
  if (detection.directories?.api || detection.architecture?.toLowerCase().includes('api') || detection.framework?.match(/express|fastify|nestjs|django|fastapi|flask|gin|fiber|echo/)) {
    rules['04-API.md'] = generateApiRule(detection);
  }

  if (detection.database) {
    rules[`05-${detection.database}-database.md`] = generateDatabaseRule(detection);
  }

  if (detection.deployment || detection.ci) {
    rules['06-deployment.md'] = generateDeploymentRule(detection);
  }

  if (detection.styling || detection.uiLibrary || detection.framework?.match(/nextjs|react|vue|angular|svelte/)) {
    rules['07-ui.md'] = generateUiRule(detection);
  }

  for (const [filename, content] of Object.entries(rules)) {
    const filePath = path.join(rulesDir, filename);
    if (safeWriteFile(filePath, content, opts.force, opts.verbose)) {
      generated.push({ type: 'rule', name: filename, path: `.opencode/rules/${filename}` });
    }
  }

  return generated;
}

function generateConventionsRule(detection) {
  return `# ${detection.framework ? detection.framework.charAt(0).toUpperCase() + detection.framework.slice(1) : detection.language.charAt(0).toUpperCase() + detection.language.slice(1)} Conventions

Auto-generated from codebase analysis.

## Code Organization

- Source code lives in ${detection.directories?.source || 'src/'}
- Tests live in ${detection.directories?.test || 'tests/'}
${detection.architecture ? `- Architecture: ${detection.architecture}` : ''}

## Imports

- ${detection.importStyle || 'ES modules'}
${detection.pathAliases ? `- Path aliases: ${JSON.stringify(detection.pathAliases)}` : ''}

## Error Handling

- ${detection.errorHandling || 'try/catch patterns'}
- Use typed error classes where appropriate

## Async Patterns

- async/await for asynchronous operations
- Handle promise rejections in all async functions
`;
}

function generateArchitectureRule(detection) {
  const dirs = detection.directories || {};
  
  return `# Architecture Overview

Auto-generated from codebase analysis.

## High-Level Architecture

${detection.architecture || `${detection.language}/${detection.framework} project`}

## Directory Layout

\`\`\`
${dirs.source || 'src/'}/             — Main source directory
${detection.framework === 'nextjs' ? '  app/             — App Router pages and API routes\n  components/      — Reusable UI components\n  lib/             — Utility functions and shared logic\n  hooks/           — Custom React hooks' : 
 detection.framework === 'react' ? '  components/      — Reusable UI components\n  hooks/           — Custom React hooks\n  utils/           — Utility functions' : 
 '  (project-specific structure)'}
${dirs.test || 'tests/'}/            — Test files
\`\`\`

## Key Dependencies

| Dependency | Purpose |
|------------|---------|
| ${detection.framework || 'N/A'} | Core framework |
| ${detection.testFramework || 'N/A'} | Testing |
| ${detection.database || 'N/A'} | Data access |
| ${detection.styling || 'N/A'} | Styling |
`;
}

function generateTestingRule(detection) {
  return `# Testing Conventions

Auto-generated from codebase analysis.

## Test Framework

- Framework: ${detection.testFramework || 'Not detected'}
- Command: \`${detection.testCommand || 'N/A'}\`
${detection.testingLibrary ? `- Library: ${detection.testingLibrary}` : ''}

## Test Organization

- Tests live in ${detection.directories?.test || 'tests/'}
- Test files mirror source structure (\`Component.test.tsx\` next to \`Component.tsx\`)
- Use \`*.test.*\` or \`*.spec.*\` naming

## Coverage Targets

- Business logic: 80%+ coverage
- Critical paths: 100% coverage
- UI components: Smoke tests for rendering

## Mocking

- Mock external services and API calls
- Use dependency injection where possible
- Prefer integration tests over heavy mocking
`;
}

function generateNamingRule(detection) {
  const nc = detection.namingConventions || {};
  
  return `# Naming Conventions

Auto-generated from codebase analysis.

## General Rules

| Category | Convention | Example |
|----------|-----------|---------|
| ${nc.files || 'Files'} | kebab-case | \`user-profile.tsx\` |
| ${nc.variables || 'Variables'} | camelCase | \`userProfile\` |
| ${nc.functions || 'Functions'} | camelCase | \`getUserProfile()\` |
| ${nc.classes || 'Classes'} | PascalCase | \`UserProfileService\` |
| ${nc.constants || 'Constants'} | UPPER_SNAKE_CASE | \`MAX_RETRY_COUNT\` |

## Framework-Specific

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | \`UserProfile.tsx\` |
| Hooks | camelCase, prefixed "use" | \`useUserProfile\` |
| API Routes | kebab-case | \`/api/user-profiles\` |
| Database Models | PascalCase | \`UserProfile\` |

## Abbreviations

- Avoid abbreviations in names (prefer \`index\` over \`idx\`)
- Common accepted: \`id\`, \`url\`, \`uri\`, \`html\`, \`css\`, \`json\`, \`http\`
`;
}

function generateApiRule(detection) {
  return `# API Conventions

Auto-generated from codebase analysis.

## API Style

- Type: ${detection.framework?.match(/express|fastify|nestjs/) ? 'REST' : detection.framework?.match(/graphql/) ? 'GraphQL' : 'REST/API'}
- Auth: Token-based (JWT recommended)
- Base URL: \`/api\`

## Endpoint Patterns

| Pattern | Method | Example |
|---------|--------|---------|
| List | GET | \`/api/[resources]\` |
| Detail | GET | \`/api/[resources]/:id\` |
| Create | POST | \`/api/[resources]\` |
| Update | PATCH | \`/api/[resources]/:id\` |
| Delete | DELETE | \`/api/[resources]/:id\` |

## Request/Response Format

- Request body: JSON
- Response envelope: \`{ data, error?, meta? }\`
- Error format: \`{ error: { message, code, details? } }\`
- Pagination: cursor-based or offset-based

## Validation

- Validate all inputs at the API boundary
- Return 400 with descriptive error messages for validation failures
- Use schema validation (Zod/Yup/Joi)
`;
}

function generateDatabaseRule(detection) {
  return `# Database Conventions

Auto-generated from codebase analysis.

## ORM / Access Layer

- ORM: ${detection.database || 'Not detected'}
- Connection: Environment-configured via \`DATABASE_URL\`

## Migration Workflow

- Create migration for every schema change
- Never edit applied migrations
- Test migrations on staging before production

## Query Patterns

- Use the ORM's query builder for standard operations
- Raw SQL only for complex queries (and wrap carefully)
- Always parameterize queries (no string interpolation)

## Model Naming

- Tables: snake_case, plural (\`user_profiles\`)
- Models: PascalCase, singular (\`UserProfile\`)
- Columns: snake_case (\`created_at\`)
`;
}

function generateDeploymentRule(detection) {
  return `# Deployment & CI/CD Conventions

Auto-generated from codebase analysis.

## CI/CD

${detection.ci === 'github-actions' ? '- Platform: GitHub Actions' :
  detection.ci === 'gitlab-ci' ? '- Platform: GitLab CI' :
  detection.ci === 'circleci' ? '- Platform: CircleCI' :
  '- CI: Auto-detected'}${detection.ci ? '\n- Pipeline: lint → test → build → deploy' : ''}

## Deployment Target

${detection.deployment === 'vercel' ? `- Platform: Vercel
- Preview: Auto-deployed on PR
- Production: Deployed from main branch` :
  detection.deployment === 'netlify' ? `- Platform: Netlify
- Preview: Deploy preview on PR
- Production: Deployed from main branch` :
  detection.deployment === 'docker' ? `- Container: Docker
- Registry: Container registry
- Orchestration: Docker Compose / Kubernetes` :
  '- Deployment: Not fully configured'}

## Pre-Deploy Checklist

1. All tests pass
2. Lint clean
3. Build succeeds
4. Migrations up-to-date
5. Environment variables configured
`;
}

function generateUiRule(detection) {
  return `# UI Conventions

Auto-generated from codebase analysis.

## Styling Approach

- ${detection.styling || 'CSS Modules / CSS-in-JS'}
${detection.uiLibrary ? `- UI Library: ${detection.uiLibrary}` : ''}

## Component Organization

- One component per file
- Co-locate styles with components
- Group related components in feature directories

## Component Patterns

- Presentational components: Pure, receive data via props
- Container components: Handle state and data fetching
- Shared components: Reusable building blocks in \`components/ui/\`

## Accessibility

- Use semantic HTML elements
- Include aria-labels on interactive elements
- Ensure keyboard navigation works
- Maintain contrast ratios

## Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
`;
}

// ─── Phase 6: Install ──────────────────────────────────────────────────

function generateInstall(generated, detection, opts) {
  if (opts.verbose) console.log('\n[provision] Phase 6: Installing artifacts...');

  const configPath = path.join(opts.outputDir, 'opencode.jsonc');
  const agentsMdPath = path.join(opts.outputDir, 'AGENTS.md');
  const modifications = [];

  // Create/update AGENTS.md
  const agentsMdContent = generateAgentsMd(generated, detection);
  if (safeWriteFile(agentsMdPath, agentsMdContent, opts.force)) {
    modifications.push({ type: 'config', file: '.opencode/AGENTS.md' });
  }

  // Generate opencode.jsonc with LSP config if it doesn't exist
  if (!fs.existsSync(configPath)) {
    const lspEntries = detection.lsp || {};
    const lspSection = Object.keys(lspEntries).length > 0
      ? Object.entries(lspEntries).map(([k, v]) => `    "${k}": ${JSON.stringify(v)}`).join(',\n')
      : '';

    const configContent = `{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "edit": { ".opencode/**": "allow" }
  },
  "mcp": {},
  "lsp": {
${lspEntries ? Object.entries(lspEntries).map(([k, v]) => `    "${k}": ${JSON.stringify(v)}`).join(',\n') : '    // No language servers detected'}
  },
  "skills": { "paths": ["./.opencode/skills"] },
  "plugin": ["./plugins/hubs-plugin.ts"],
  "instructions": ["AGENTS.md"]
}
`;
    if (safeWriteFile(configPath, configContent, opts.force)) {
      modifications.push({ type: 'config', file: '.opencode/opencode.jsonc' });
    }
  }

  return modifications;
}

function generateAgentsMd(generated, detection) {
  const now = new Date().toISOString().split('T')[0];
  
  const agents = generated.filter(g => g.type === 'agent');
  const skills = generated.filter(g => g.type === 'skill');
  const tools = generated.filter(g => g.type === 'tool');
  const rules = generated.filter(g => g.type === 'rule');

  let md = `<!-- Parent: ../AGENTS.md -->
<!-- Generated: ${now} -->

# .opencode — Provisioned Artifacts

Project-specific agents, skills, tools, and rules for the ${detection.language}/${detection.framework} project.

> Auto-generated by \`/init-project provision\`. Re-run to update as the project evolves.

## Overview

- **Language:** ${detection.language}${detection.version ? ' ' + detection.version : ''}
- **Framework:** ${detection.framework || 'None detected'}
- **Package Manager:** ${detection.packageManager}
- **Build System:** ${detection.buildSystem}
- **Test Framework:** ${detection.testFramework || 'None detected'}
`;

  if (agents.length > 0) {
    md += `

## Agents

Project-aware agent wrappers that inject deep project context into subagents.

| Agent | Purpose |
|-------|---------|
`;
    for (const a of agents) {
      md += `| \`${a.name}\` | ${agentPurposeDescription(a.name)} |\n`;
    }
  }

  if (skills.length > 0) {
    md += `

## Skills

Project-specific reusable workflow skills.

| Skill | Purpose |
|-------|---------|
`;
    for (const s of skills) {
      const desc = {
        build: 'Build, compile, and bundle the project',
        test: 'Run tests with project-specific framework',
        lint: 'Lint and format code',
        deploy: 'Deploy preview and production builds',
        architecture: 'Architecture reference with directory layout and patterns',
        conventions: 'Coding conventions for naming, imports, error handling',
      }[s.name] || 'Project workflow skill';
      md += `| \`${s.name}\` | ${desc} |\n`;
    }
  }

  if (tools.length > 0) {
    md += `

## Tools

Project-specific TypeScript tools.

| Tool | Description |
|------|-------------|
`;
    for (const t of tools) {
      const desc = {
        'project-info': 'Returns project metadata (language, framework, commands, conventions)',
        deploy: 'Deploy project to target environment',
        'db-migrate': 'Database migration management (create, apply, rollback)',
      }[t.name] || 'Project tool';
      md += `| \`${t.name}\` | ${desc} |\n`;
    }
  }

  if (rules.length > 0) {
    md += `

## Rules

Project-specific conventions and guidelines.

| Rule | Description |
|------|-------------|
`;
    for (const r of rules) {
      md += `| \`${r.name}\` | ${r.name.replace(/\.md$/, '').replace(/^\d+-/, '')} |\n`;
    }
  }

  md += `

## Usage

Subagents loaded from project-level directories will automatically access these artifacts. To use:

1. **Agents**: Project wrappers extend global agents with project context
2. **Skills**: Load via \`/orchestrate <skill>\` or reference from hub commands
3. **Tools**: Used by agents during task execution
4. **Rules**: Auto-loaded into agent context for instruction

## Regeneration

Re-run \`/init-project provision\` when:
- Adding a new subsystem
- Changing frameworks or major dependencies
- The project architecture evolves significantly
`;

  return md;
}

function agentPurposeDescription(name) {
  const descriptions = {
    executor: 'Implementation with project conventions, build commands, and testing patterns',
    planner: 'Planning with awareness of project structure, dependencies, and subsystems',
    architect: 'Architecture decisions respecting existing patterns, tradeoffs, and constraints',
    critic: 'Review with project-specific quality bars, conventions, and anti-patterns',
    'code-reviewer': 'Code review using project conventions, testing expectations, and naming rules',
    'security-reviewer': 'Security audit with awareness of project-specific attack surface',
    refactoring: 'Refactoring with knowledge of module boundaries, import conventions, and test coverage',
    'test-engineer': 'Test writing matching project test framework, mocking strategy, and coverage targets',
    debugger: 'Debugging with project-specific error handling patterns and entry points',
    verifier: 'Verification using project-specific test, lint, and build commands',
  };
  return descriptions[name] || 'Project-aware agent wrapper';
}

// ─── Phase 7: Verify ───────────────────────────────────────────────────

function generateVerify(generated, opts) {
  if (opts.verbose) console.log('\n[provision] Phase 7: Verifying generated artifacts...');

  const errors = [];
  const report = [];

  report.push('# Provision Verification Report');
  report.push('');
  report.push(`Generated: ${new Date().toISOString()}`);
  report.push('');

  // Check agents
  if (!opts.skipAgents) {
    report.push('## Agents');
    for (const g of generated.filter(g => g.type === 'agent')) {
      const fullPath = path.join(opts.outputDir, g.path.replace('.opencode/', ''));
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const hasExtends = content.includes('extends:');
        const hasDescription = content.includes('description:');
        const hasProjectContext = content.includes('Project_Context');
        
        if (hasExtends && hasDescription && hasProjectContext) {
          report.push(`  ✓ ${g.name} — valid wrapper`);
        } else {
          const missing = [];
          if (!hasExtends) missing.push('extends');
          if (!hasDescription) missing.push('description');
          if (!hasProjectContext) missing.push('project context');
          report.push(`  ✗ ${g.name} — missing: ${missing.join(', ')}`);
          errors.push(`Agent ${g.name}: missing ${missing.join(', ')}`);
        }
      } else {
        report.push(`  ✗ ${g.name} — file not found`);
        errors.push(`Agent ${g.name}: file not found`);
      }
    }
    report.push('');
  }

  // Check skills
  if (!opts.skipSkills) {
    report.push('## Skills');
    for (const g of generated.filter(g => g.type === 'skill')) {
      const fullPath = path.join(opts.outputDir, g.path.replace('.opencode/', ''));
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const hasName = content.includes('name:');
        const hasDescription = content.includes('description:');
        
        if (hasName && hasDescription) {
          report.push(`  ✓ ${g.name} — valid skill`);
        } else {
          report.push(`  ✗ ${g.name} — missing frontmatter`);
          errors.push(`Skill ${g.name}: missing frontmatter`);
        }
      } else {
        report.push(`  ✗ ${g.name} — file not found`);
        errors.push(`Skill ${g.name}: file not found`);
      }
    }
    report.push('');
  }

  // Check tools
  if (!opts.skipTools) {
    report.push('## Tools');
    for (const g of generated.filter(g => g.type === 'tool')) {
      const fullPath = path.join(opts.outputDir, g.path.replace('.opencode/', ''));
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes('export default tool')) {
          report.push(`  ✓ ${g.name} — valid tool export`);
        } else {
          report.push(`  ⚠ ${g.name} — may lack default export`);
          errors.push(`Tool ${g.name}: may lack default export`);
        }
      } else {
        report.push(`  ✗ ${g.name} — file not found`);
        errors.push(`Tool ${g.name}: file not found`);
      }
    }
    report.push('');
  }

  // Check rules
  if (!opts.skipRules) {
    report.push('## Rules');
    for (const g of generated.filter(g => g.type === 'rule')) {
      const fullPath = path.join(opts.outputDir, g.path.replace('.opencode/', ''));
      if (fs.existsSync(fullPath)) {
        report.push(`  ✓ ${g.name}`);
      } else {
        report.push(`  ✗ ${g.name} — file not found`);
        errors.push(`Rule ${g.name}: file not found`);
      }
    }
    report.push('');
  }

  // Check config — agents, tools, rules are auto-discovered; only skills needs path registration
  const configPath = path.join(opts.outputDir, 'opencode.jsonc');
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf-8');
    const hasSkillsPath = config.includes('.opencode/skills');
    report.push(`## Registration`);
    report.push(`  ${hasSkillsPath ? '✓' : '⚠'} Skills path registered in opencode.jsonc`);
    report.push(`  ℹ  Agents, tools, rules are auto-discovered from .opencode/ subdirectories`);
  }

  // Summary
  report.push('');
  if (errors.length === 0) {
    report.push('## Result: ALL VERIFIED SUCCESSFULLY');
  } else {
    report.push(`## Result: ${errors.length} issue(s) found`);
    for (const err of errors) {
      report.push(`- ${err}`);
    }
  }

  // Write report
  const reportPath = path.join(opts.outputDir, 'state', 'init', 'provision-report.md');
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportPath, report.join('\n'), 'utf-8');
  if (opts.verbose) console.log(`  ✓ Verification report: ${reportPath}`);

  return { errors: errors.length, reportPath };
}

// ─── Checkpoint ────────────────────────────────────────────────────────

function saveCheckpoint(phase, generated, opts) {
  const checkpoint = {
    lastCompletedPhase: phase,
    timestamp: new Date().toISOString(),
    subcommand: opts.subcommand || 'full',
    force: opts.force,
    skipAgents: opts.skipAgents,
    skipSkills: opts.skipSkills,
    skipTools: opts.skipTools,
    skipRules: opts.skipRules,
    generated: {
      agents: generated.filter(g => g.type === 'agent').map(g => g.path),
      skills: generated.filter(g => g.type === 'skill').map(g => g.path),
      tools: generated.filter(g => g.type === 'tool').map(g => g.path),
      rules: generated.filter(g => g.type === 'rule').map(g => g.path),
    },
  };

  const checkpointDir = path.dirname(opts.checkpoint);
  if (!fs.existsSync(checkpointDir)) fs.mkdirSync(checkpointDir, { recursive: true });
  fs.writeFileSync(opts.checkpoint, JSON.stringify(checkpoint, null, 2), 'utf-8');
  if (opts.verbose) console.log(`  Checkpoint saved: phase ${phase}`);
}

function loadCheckpoint(opts) {
  if (fs.existsSync(opts.checkpoint)) {
    try {
      return JSON.parse(fs.readFileSync(opts.checkpoint, 'utf-8'));
    } catch {}
  }
  return null;
}

function loadDetection(opts) {
  if (fs.existsSync(opts.detection)) {
    try {
      return JSON.parse(fs.readFileSync(opts.detection, 'utf-8'));
    } catch {}
  }
  return null;
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();
  let generated = [];
  let detection = null;

  console.log(`🔧 OpenCode Provision Engine
   Project root: ${PROJECT_ROOT}
   .opencode:    ${OPENCODE_DIR}
`);

  // Determine phases to run
  let phases = [];
  if (opts.phases === 'all') {
    phases = [1, 2, 3, 4, 5, 6, 7];
  } else {
    phases = opts.phases.split(',').map(Number).filter(n => !isNaN(n));
  }

  // If resuming, load checkpoint
  const checkpoint = loadCheckpoint(opts);
  if (checkpoint && opts.phases === 'all') {
    // Only run phases after the last completed one
    phases = phases.filter(p => p > checkpoint.lastCompletedPhase);
    if (phases.length === 0) {
      console.log('All phases already completed. Use --force to re-run.');
      process.exit(0);
    }
  }

  // Handle subcommands
  if (opts.subcommand === 'agents') {
    phases = [2];
    opts.skipSkills = true;
    opts.skipTools = true;
    opts.skipRules = true;
  } else if (opts.subcommand === 'skills') {
    phases = [3];
    opts.skipAgents = true;
    opts.skipTools = true;
    opts.skipRules = true;
  } else if (opts.subcommand === 'tools') {
    phases = [4];
    opts.skipAgents = true;
    opts.skipSkills = true;
    opts.skipRules = true;
  } else if (opts.subcommand === 'rules') {
    phases = [5];
    opts.skipAgents = true;
    opts.skipSkills = true;
    opts.skipTools = true;
  }

  // Load or create detection data
  detection = loadDetection(opts);

  // Phase 1: Scan
  if (phases.includes(1)) {
    if (opts.projectDesc) {
      // Parse user description for empty directories
      detection = parseProjectDescription(opts.projectDesc);
    } else {
      detection = detectProject(opts);
    }

    // Save detection
    const detectionDir = path.dirname(opts.detection);
    if (!fs.existsSync(detectionDir)) fs.mkdirSync(detectionDir, { recursive: true });
    fs.writeFileSync(opts.detection, JSON.stringify(detection, null, 2), 'utf-8');
    
    console.log(`📋 Detection complete: ${detection.language}/${detection.framework || 'generic'}
   Confidence: ${detection.confidence}
   Architect:  ${detection.architecture || 'Not detected'}
   Testing:    ${detection.testFramework || 'Not detected'}
`);
    
    saveCheckpoint(1, generated, opts);

    if (opts.scanOnly) {
      console.log('Scan-only mode. Exiting.');
      process.exit(0);
    }
  }

  // Ensure detection exists for phases 2+
  if (!detection) {
    detection = loadDetection(opts);
    if (!detection) {
      console.error('No detection data found. Run phase 1 first or provide --project-desc.');
      process.exit(2);
    }
  }

  // Phase 2: Agents
  if (phases.includes(2)) {
    console.log('🧠 Generating project-aware agent wrappers...');
    generated = [...generated, ...generateAgents(detection, opts)];
    saveCheckpoint(2, generated, opts);
    console.log(`   Created ${generated.filter(g => g.type === 'agent').length} agent(s)`);
  }

  // Phase 3: Skills
  if (phases.includes(3)) {
    console.log('🛠  Generating project-specific skills...');
    generated = [...generated, ...generateSkills(detection, opts)];
    saveCheckpoint(3, generated, opts);
    console.log(`   Created ${generated.filter(g => g.type === 'skill').length} skill(s)`);
  }

  // Phase 4: Tools
  if (phases.includes(4)) {
    console.log('🔧 Generating project-specific tools...');
    generated = [...generated, ...generateTools(detection, opts)];
    saveCheckpoint(4, generated, opts);
    console.log(`   Created ${generated.filter(g => g.type === 'tool').length} tool(s)`);
  }

  // Phase 5: Rules
  if (phases.includes(5)) {
    console.log('📏 Generating project rules...');
    generated = [...generated, ...generateRules(detection, opts)];
    saveCheckpoint(5, generated, opts);
    console.log(`   Created ${generated.filter(g => g.type === 'rule').length} rule(s)`);
  }

  // Phase 6: Install
  if (phases.includes(6)) {
    console.log('📦 Installing artifacts...');
    const modifications = generateInstall(generated, detection, opts);
    saveCheckpoint(6, generated, opts);
    console.log(`   Modified ${modifications.length} config file(s)`);
  }

  // Phase 7: Verify
  if (phases.includes(7)) {
    console.log('✅ Verifying generated artifacts...');
    const result = generateVerify(generated, opts);
    saveCheckpoint(7, generated, opts);
    console.log(`   ${result.errors === 0 ? 'All verified successfully!' : result.errors + ' issue(s) found'}`);
  }

  // Summary
  console.log(`
┌─────────────────────────────────────────────────┐
│           Provision Summary                      │
├─────────────────────────────────────────────────┤
│ Language:    ${detection.language.padEnd(30)}│
│ Framework:   ${(detection.framework || '-').padEnd(30)}│
│ Agents:      ${String(generated.filter(g => g.type === 'agent').length).padEnd(30)}│
│ Skills:      ${String(generated.filter(g => g.type === 'skill').length).padEnd(30)}│
│ Tools:       ${String(generated.filter(g => g.type === 'tool').length).padEnd(30)}│
│ Rules:       ${String(generated.filter(g => g.type === 'rule').length).padEnd(30)}│
└─────────────────────────────────────────────────┘
`);
}

function parseProjectDescription(desc) {
  const lower = desc.toLowerCase();
  const detection = {
    confidence: 'low',
    description: desc,
    directories: {},
    keyFiles: [],
  };

  // Language detection from text
  if (lower.includes('python')) {
    detection.language = 'python';
    if (lower.includes('fastapi')) detection.framework = 'fastapi';
    else if (lower.includes('django')) detection.framework = 'django';
    else if (lower.includes('flask')) detection.framework = 'flask';
    detection.packageManager = 'pip';
    detection.buildSystem = 'python';
  } else if (lower.includes('typescript') || lower.includes('ts') || lower.includes('next') || lower.includes('react')) {
    detection.language = 'typescript';
    if (lower.includes('next')) detection.framework = 'nextjs';
    else if (lower.includes('react')) detection.framework = 'react';
    else if (lower.includes('vue') || lower.includes('nuxt')) { detection.language = 'vue'; detection.framework = 'vue'; }
    else if (lower.includes('angular')) detection.framework = 'angular';
    else if (lower.includes('svelte')) detection.framework = 'svelte';
    detection.packageManager = 'npm';
    detection.buildSystem = detection.framework === 'nextjs' ? 'next build' : 'tsc';
  } else if (lower.includes('rust')) {
    detection.language = 'rust';
    detection.packageManager = 'cargo';
    detection.buildSystem = 'cargo build';
  } else if (lower.includes('go') || lower.includes('golang')) {
    detection.language = 'go';
    detection.packageManager = 'go mod';
    detection.buildSystem = 'go build';
  } else if (lower.includes('ruby') || lower.includes('rails')) {
    detection.language = 'ruby';
    detection.framework = lower.includes('rails') ? 'rails' : 'ruby';
    detection.packageManager = 'bundler';
  } else {
    detection.language = 'unknown';
    detection.packageManager = 'unknown';
  }

  // Architecture detection
  if (lower.includes('api') || lower.includes('rest') || lower.includes('backend')) {
    detection.architecture = 'API service';
  } else if (lower.includes('cli')) {
    detection.architecture = 'CLI tool';
  } else if (lower.includes('frontend') || lower.includes('ui') || lower.includes('web app')) {
    detection.architecture = 'Web application';
  } else if (lower.includes('microservice')) {
    detection.architecture = 'Microservices';
  }

  // Database detection
  const dbPatterns = ['postgres', 'postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'prisma', 'drizzle'];
  for (const db of dbPatterns) {
    if (lower.includes(db)) {
      detection.database = db;
      break;
    }
  }

  // Deployment detection
  if (lower.includes('vercel')) detection.deployment = 'vercel';
  else if (lower.includes('docker') || lower.includes('container')) detection.deployment = 'docker';
  else if (lower.includes('aws') || lower.includes('lambda')) detection.deployment = 'aws';

  fillConventionDefaults(detection);
  return detection;
}

main().catch(err => {
  console.error('Provision failed:', err.message);
  process.exit(1);
});