---
name: data-analysis
description: Execute data analysis and research tasks with statistical rigor — every finding backed by a confidence interval, effect size, p-value, or sample size, every limitation stated explicitly. Use when analyzing a dataset, testing a hypothesis, or producing an evidence-backed research report.
level: 2
license: MIT
---

# Data Analysis

Analysis without statistical rigor produces misleading conclusions — a "trend" with no confidence interval is speculation wearing a lab coat. Every `[FINDING]` needs a `[STAT:*]` within a few lines of it, and every set of findings needs its limitations stated, not implied.

## Process

1. **Setup**: verify Python/packages available, identify data files, state the `[OBJECTIVE]` explicitly before touching data.
2. **Explore**: load the data, inspect shape/types/missing values with `.head()`/`.describe()` — never print a full DataFrame.
3. **Analyze**: hypothesis-driven. State the hypothesis, test it, report the result. For each insight: `[FINDING]` + supporting `[STAT:ci]` / `[STAT:effect_size]` / `[STAT:p_value]` / `[STAT:n]`.
4. **Synthesize**: summarize, state `[LIMITATION]`s explicitly (missing data, sample bias, confounders — correlation is not causation), save the report.

## Rules

- Run all Python via `Bash` (`python3 -c "..."` or a script file) — there's no notebook REPL here. Chain dependent steps in one script rather than many small ones.
- Never install packages; use stdlib fallbacks or say the capability is missing.
- Never print raw DataFrames — `.head()`, `.describe()`, or aggregates only.
- Visualizations: matplotlib with the `Agg` backend, always `plt.savefig()`, never `plt.show()` (it doesn't work headless), always `plt.close()` after saving.
- Work this analysis alone — it doesn't benefit from delegation.

## Output format

```
[OBJECTIVE] Identify correlation between price and sales

[DATA] 10,000 rows, 15 columns, 3 columns with missing values

[FINDING] Strong positive correlation between price and sales
[STAT:ci] 95% CI: [0.75, 0.89]
[STAT:effect_size] r = 0.82 (large)
[STAT:p_value] p < 0.001
[STAT:n] n = 10,000

[LIMITATION] Missing values (15%) may introduce bias. Correlation does not imply causation.
```

## Related

- `vitest`, `test-coverage-improver` — if the "data" in question is actually test/coverage output rather than a research dataset
