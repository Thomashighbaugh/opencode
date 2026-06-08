<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-01 | Updated: 2026-05-01 -->

# agent-tests

## Purpose
YAML-based test scenarios for validating agent behavior. Each test defines a sequence of actions, expected responses, and assertions for verifying agent capabilities.

## Key Files

| File | Description |
|------|-------------|
| `test-config-template.yaml` | Base configuration template for test scenarios |
| `test-1-planning-approval.yaml` | Planning and approval workflow test |
| `test-2-context-loading.yaml` | Context loading and injection test |
| `test-3-incremental.yaml` | Incremental execution test |
| `test-4-tool-usage.yaml` | Tool invocation and response test |
| `test-5-error-handling.yaml` | Error handling and recovery test |
| `test-6-extended-thinking.yaml` | Extended thinking/reasoning test |
| `test-7-compaction.yaml` | Context compaction test |
| `test-8-completion.yaml` | Task completion verification test |

## For AI Agents

### Working In This Directory
- Tests are YAML files with structured assertions
- Each test targets a specific agent capability
- Follow the `test-config-template.yaml` format when adding new tests
- Tests can be run via the Hubs QA pipeline

### Testing Requirements
- All 8 numbered tests should pass for a healthy system
- Run via Hubs doctor or QA pipeline

### Common Patterns
- YAML format with `name`, `agent`, `steps`, `assertions` sections
- Template-based config using `test-config-template.yaml`

<!-- MANUAL: -->
