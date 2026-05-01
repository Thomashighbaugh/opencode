# Phase 1: Detection

Detect project language, framework, and tooling from existing files.

## Delegation

```
Task(subagent_type="explore",
  prompt="Detect project language, framework, and tooling configuration")
```

## Detection Sequence

Execute detection in order. Stop at first match for each category.

### Step 1: Detect Language

| File Check | Language |
|------------|----------|
| `package.json` exists + `tsconfig.json` exists | `typescript` |
| `package.json` exists (no tsconfig) | `javascript` |
| `pyproject.toml` exists | `python` |
| `requirements.txt` exists | `python` |
| `setup.py` exists | `python` |
| `Cargo.toml` exists | `rust` |
| `go.mod` exists | `go` |
| `pom.xml` exists | `java` |
| `build.gradle` exists | `java` |
| `Gemfile` exists | `ruby` |
| `*.gemspec` exists | `ruby` |
| `CMakeLists.txt` exists | `cpp` |
| `Makefile` exists (with `.c`/`.cpp` files) | `cpp` / `c` |
| None of the above | `generic` |

**Bash:**
```bash
detect_language() {
    local dir="$1"

    if [[ -f "$dir/package.json" ]]; then
        if [[ -f "$dir/tsconfig.json" ]] || grep -q '"typescript"' "$dir/package.json" 2>/dev/null; then
            echo "typescript"
        else
            echo "javascript"
        fi
        return 0
    fi

    if [[ -f "$dir/pyproject.toml" ]] || [[ -f "$dir/requirements.txt" ]] || [[ -f "$dir/setup.py" ]]; then
        echo "python"
        return 0
    fi

    if [[ -f "$dir/Cargo.toml" ]]; then
        echo "rust"
        return 0
    fi

    if [[ -f "$dir/go.mod" ]]; then
        echo "go"
        return 0
    fi

    if [[ -f "$dir/pom.xml" ]] || [[ -f "$dir/build.gradle" ]]; then
        echo "java"
        return 0
    fi

    if [[ -f "$dir/Gemfile" ]] || compgen -G "$dir/*.gemspec" > /dev/null 2>&1; then
        echo "ruby"
        return 0
    fi

    if [[ -f "$dir/CMakeLists.txt" ]]; then
        echo "cpp"
        return 0
    fi

    if [[ -f "$dir/Makefile" ]] && compgen -G "$dir/**/*.c" > /dev/null 2>&1; then
        echo "c"
        return 0
    fi

    if [[ -f "$dir/Makefile" ]] && compgen -G "$dir/**/*.cpp" > /dev/null 2>&1; then
        echo "cpp"
        return 0
    fi

    echo "generic"
}
```

### Step 2: Detect Framework

Based on detected language, check for framework markers:

| Language | File Check | Framework |
|----------|------------|-----------|
| typescript/javascript | `next.config.js` / `next.config.mjs` | `nextjs` |
| typescript/javascript | `nuxt.config.js` | `nuxt` |
| typescript/javascript | `vue.config.js` | `vue` |
| typescript/javascript | `angular.json` | `angular` |
| typescript/javascript | `svelte.config.js` | `svelte` |
| typescript/javascript | `remix.config.js` | `remix` |
| typescript/javascript | `gatsby-config.js` | `gatsby` |
| typescript/javascript | `vite.config.ts` (no framework) | `vite` |
| typescript/javascript | `package.json` has `express` | `express` |
| typescript/javascript | `package.json` has `@nestjs/core` | `nestjs` |
| python | `manage.py` exists | `django` |
| python | `app.py` exists + imports `flask` | `flask` |
| python | `main.py` exists + imports `fastapi` | `fastapi` |
| python | `scrape.py` / `spiders/` dir | `scrapy` |
| python | `celery.py` / imports `celery` | `celery` |
| rust | `src/bin/` directory | `cli` |
| rust | `Cargo.toml` has `actix-web` | `actix-web` |
| rust | `Cargo.toml` has `rocket` | `rocket` |
| rust | `Cargo.toml` has `axum` | `axum` |
| go | `main.go` imports `gin-gonic` | `gin` |
| go | `main.go` imports `echo` | `echo` |
| go | `main.go` imports `fiber` | `fiber` |

**Bash:**
```bash
detect_framework() {
    local dir="$1"
    local lang="$2"

    case "$lang" in
        typescript|javascript)
            [[ -f "$dir/next.config.js" ]] || [[ -f "$dir/next.config.mjs" ]] && echo "nextjs" && return 0
            [[ -f "$dir/nuxt.config.js" ]] && echo "nuxt" && return 0
            [[ -f "$dir/vue.config.js" ]] && echo "vue" && return 0
            [[ -f "$dir/angular.json" ]] && echo "angular" && return 0
            [[ -f "$dir/svelte.config.js" ]] && echo "svelte" && return 0
            [[ -f "$dir/remix.config.js" ]] && echo "remix" && return 0
            [[ -f "$dir/gatsby-config.js" ]] && echo "gatsby" && return 0
            [[ -f "$dir/vite.config.ts" ]] && echo "vite" && return 0
            grep -q '"express"' "$dir/package.json" 2>/dev/null && echo "express" && return 0
            grep -q '"@nestjs/core"' "$dir/package.json" 2>/dev/null && echo "nestjs" && return 0
            [[ -d "$dir/src/components" ]] && echo "component-library" && return 0
            echo "node"
            ;;
        python)
            [[ -f "$dir/manage.py" ]] && echo "django" && return 0
            grep -q "flask" "$dir/app.py" 2>/dev/null && echo "flask" && return 0
            grep -q "fastapi" "$dir/main.py" 2>/dev/null && echo "fastapi" && return 0
            [[ -f "$dir/scrape.py" ]] || [[ -d "$dir/spiders" ]] && echo "scrapy" && return 0
            grep -q "celery" "$dir/"*.py 2>/dev/null && echo "celery" && return 0
            ;;
        rust)
            [[ -d "$dir/src/bin" ]] && echo "cli" && return 0
            grep -q "actix-web" "$dir/Cargo.toml" 2>/dev/null && echo "actix-web" && return 0
            grep -q "rocket" "$dir/Cargo.toml" 2>/dev/null && echo "rocket" && return 0
            grep -q "axum" "$dir/Cargo.toml" 2>/dev/null && echo "axum" && return 0
            ;;
        go)
            grep -q "gin-gonic" "$dir/main.go" 2>/dev/null && echo "gin" && return 0
            grep -q "echo" "$dir/main.go" 2>/dev/null && echo "echo" && return 0
            grep -q "fiber" "$dir/main.go" 2>/dev/null && echo "fiber" && return 0
            ;;
    esac

    echo "none"
}
```

### Step 3: Detect Package Manager

| Check | Manager |
|-------|---------|
| `pnpm-lock.yaml` exists | `pnpm` |
| `yarn.lock` exists | `yarn` |
| `package-lock.json` exists | `npm` |
| `bun.lockb` exists | `bun` |
| `poetry.lock` exists | `poetry` |
| `uv.lock` exists | `uv` |
| `Pipfile.lock` exists | `pipenv` |
| `Cargo.lock` exists | `cargo` |
| `go.sum` exists | `go-mod` |
| `Gemfile.lock` exists | `bundler` |

### Step 4: Detect Build System

| Check | Build System |
|-------|---------------|
| `tsconfig.json` build config | `tsc` |
| `vite.config.*` exists | `vite` |
| `webpack.config.*` exists | `webpack` |
| `rollup.config.*` exists | `rollup` |
| `esbuild.config.*` exists | `esbuild` |
| `Makefile` exists | `make` |
| `CMakeLists.txt` exists | `cmake` |
| `build.gradle` exists | `gradle` |
| `pom.xml` exists | `maven` |

### Step 5: Detect Key Directories

Scan for common directory structures:

```bash
detect_directories() {
    local dir="$1"
    local dirs=()

    # Common source directories
    [[ -d "$dir/src" ]] && dirs+=("src")
    [[ -d "$dir/lib" ]] && dirs+=("lib")
    [[ -d "$dir/app" ]] && dirs+=("app")
    [[ -d "$dir/apps" ]] && dirs+=("apps")
    [[ -d "$dir/packages" ]] && dirs+=("packages")

    # Test directories
    [[ -d "$dir/tests" ]] && dirs+=("tests")
    [[ -d "$dir/test" ]] && dirs+=("test")
    [[ -d "$dir/__tests__" ]] && dirs+=("__tests__")
    [[ -d "$dir/spec" ]] && dirs+=("spec")

    # Config directories
    [[ -d "$dir/config" ]] && dirs+=("config")
    [[ -d "$dir/.github" ]] && dirs+=(".github")
    [[ -d "$dir/docs" ]] && dirs+=("docs")

    # Infrastructure
    [[ -d "$dir/docker" ]] && dirs+=("docker")
    [[ -d "$dir/k8s" ]] && dirs+=("k8s")
    [[ -d "$dir/terraform" ]] && dirs+=("terraform")

    printf '%s\n' "${dirs[@]}"
}
```

### Step 6: Check for CI/CD

```bash
detect_ci() {
    local dir="$1"

    if [[ -d "$dir/.github/workflows" ]]; then
        echo "github-actions"
    elif [[ -f "$dir/.gitlab-ci.yml" ]]; then
        echo "gitlab-ci"
    elif [[ -f "$dir/.circleci/config.yml" ]]; then
        echo "circleci"
    elif [[ -f "$dir/Jenkinsfile" ]]; then
        echo "jenkins"
    elif [[ -f "$dir/azure-pipelines.yml" ]]; then
        echo "azure-pipelines"
    else
        echo "none"
    fi
}
```

## Output

After all detection steps, produce JSON:

```json
{
  "language": "typescript",
  "framework": "nextjs",
  "packageManager": "npm",
  "buildSystem": "tsc",
  "directories": ["src", "tests", "docs", ".github"],
  "ci": "github-actions",
  "confidence": "high"
}
```

Save to `.opencode/state/init-detection.json` for Phase 2.

## Delegation Example

```
Task(
  subagent_type="explore",
  prompt="Detect project configuration for init-project:

1. Language: Check for package.json (typescript/javascript), pyproject.toml (python), Cargo.toml (rust), go.mod (go), pom.xml/build.gradle (java), Gemfile (ruby)
2. Framework: Based on language, check for framework markers (next.config.js = Next.js, manage.py = Django, etc.)
3. Package Manager: Check lockfiles (pnpm-lock.yaml, yarn.lock, package-lock.json, poetry.lock, Cargo.lock, go.sum)
4. Build System: Check build configs (tsconfig.json, vite.config.*, webpack.config.*)
5. Key Directories: List src/, tests/, docs/, .github/
6. CI/CD: Check .github/workflows/, .gitlab-ci.yml, Jenkinsfile

Output JSON result with: language, framework, packageManager, buildSystem, directories, ci, confidence level.

Project root: $(pwd)"
)
```

## Next Phase

After detection completes successfully, proceed to **Phase 2: Planning**.

If detection fails or returns `generic` with low confidence, prompt user:
> "Could not auto-detect project type. Use `--language <lang>` to specify manually, or `--skip-detection` for generic defaults."