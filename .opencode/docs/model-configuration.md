# Model Configuration

> Complete reference for configuring AI models in Hubs

## Table of Contents

- [Overview](#overview)
- [Default Models](#default-models)
- [Model Properties](#model-properties)
- [Provider Configuration](#provider-configuration)
- [Model Tiering & Fallback](#model-tiering--fallback)
- [Custom Models](#custom-models)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Hubs uses Opencode Zen models as the primary provider, with ollama cloud (Fallback 1) and opencode-go hosted (Fallback 2) as automatic fallbacks when the Opencode Zen provider errors out. Models are configured in `opencode.jsonc`.

## Default Models

| Model | Context | Output | Tier | Best For | Fallback | Notes |
|-------|---------|--------|------|----------|----------|-------|
| **opencode/deepseek-v4-flash-free** | 1M | 131K | **All** | All agents (primary) | `ollama/deepseek-v4-flash:cloud` (FB1), `opencode-go/deepseek-v4-flash` (FB2) | Default for all agents |
| **ollama/deepseek-v4-pro:cloud** | 1M | 131K | **Top** | Complex reasoning, architecture, security review | `opencode-go/deepseek-v4-pro` (FB2) | Fallback 1 for Top tier |
| **ollama/deepseek-v4-flash:cloud** | 1M | 131K | **Mid** | Implementation, execution, general work | `opencode-go/deepseek-v4-flash` (FB2) | Fallback 1 for Mid tier |
| **ollama/glm-5.1:cloud** | 202K | 131K | **Fast** | Exploration, documentation, simple tasks | `opencode-go/glm-5.1` (FB2) | Fallback 1 for Fast tier |
| **kimi-k2.6:cloud** | 262K | 262K | — | Extended context, long documents | — | Same input/output context |
| **minimax-m2.7:cloud** | 205K | 128K | — | High performance tasks | — | Balanced performance |
| **qwen3.6:cloud** | 262K | 32K | — | Long document processing | — | Limited output |

### Model Selection by Task

| Task Type | Tier | Recommended Model | Reason |
|-----------|------|-------------------|--------|
| All tasks | All | opencode/deepseek-v4-flash-free | Universal primary model |
| Complex reasoning | Top | ollama/deepseek-v4-pro:cloud | Fallback for deep reasoning |
| Agent Orchestration | Mid | ollama/nemotron-3-ultra:cloud | Long-running agents |
| Search/Explore | Fast | ollama/glm-5.1:cloud | Fast, efficient |
| Documentation | Fast | ollama/glm-5.1:cloud | Simple generation |
| Security Review | Top | ollama/deepseek-v4-pro:cloud | Critical analysis |
| Long documents | — | kimi-k2.6:cloud | Extended context |
| Complex analysis | Mid | minimax-m2.7:cloud | High performance |

## Model Properties

### Context Window

The maximum input context size in tokens.

```
Context = System Prompt + User Message + Conversation History

Example:
System: 1,000 tokens
User: 500 tokens
History: 10,000 tokens
Total: 11,500 tokens (must be < context_limit)
```

### Output Limit

The maximum output size in tokens.

```
Output = Generated Response

For code generation:
- Short functions: ~500 tokens
- Full files: ~2,000 tokens
- Multiple files: Limited by output

For long outputs, models may need continuation.
```

### Launch Behavior

The `_launch` property controls automatic model startup:

```jsonc
{
  "glm-5.1:cloud": {
    "_launch": true  // Auto-start on first use
  }
}
```

## Provider Configuration

### Basic Configuration

```jsonc
{
  "provider": {
    "opencode": {
      "options": {},
      "models": {
        "deepseek-v4-flash-free": {
          "name": "deepseek-v4-flash-free",
          "limit": { "context": 1048576, "output": 131072 }
        }
      }
    },
    "ollama": {
      "models": {
        "deepseek-v4-flash:cloud": {
          "_launch": true,
          "limit": { "context": 1048576, "output": 131072 },
          "name": "deepseek-v4-flash:cloud"
        },
        "deepseek-v4-pro:cloud": {
          "_launch": true,
          "limit": { "context": 1048576, "output": 131072 },
          "name": "deepseek-v4-pro:cloud"
        },
        "glm-5.1:cloud": {
          "_launch": true,
          "limit": { "context": 202752, "output": 131072 },
          "name": "glm-5.1:cloud"
        }
      }
    }
  }
}
```

### Multiple Providers

```jsonc
{
  "provider": {
    "opencode": {
      "options": {},
      "models": {
        "deepseek-v4-flash-free": {
          "name": "deepseek-v4-flash-free",
          "limit": { "context": 1048576, "output": 131072 }
        }
      }
    },
    "ollama": {
      "models": {
        "deepseek-v4-flash:cloud": { "_launch": true },
        "deepseek-v4-pro:cloud": { "_launch": true },
        "glm-5.1:cloud": { "_launch": true },
        "kimi-k2.5:cloud": { "_launch": true }
      }
    },
    "openrouter": {
      "models": {
        "glm-5:cloud": {
          "limit": { "context": 200000, "output": 131072 }
        }
      }
    }
  }
}
```

### Environment Variables

```jsonc
{
  "provider": {
    "opencode": {
      "options": {},
      "models": {
        "deepseek-v4-flash-free": {
          "name": "deepseek-v4-flash-free",
          "limit": { "context": 1048576, "output": 131072 }
        }
      }
    },
    "ollama": {
      "models": {
        "deepseek-v4-flash:cloud": {
          "_launch": true,
          "env": {
            "OLLAMA_HOST": "${OLLAMA_HOST}",
            "OLLAMA_API_KEY": "${OLLAMA_API_KEY}"
          }
        }
      }
    }
  }
}
```

## Model Tiering & Fallback

When the Opencode Zen provider fails (connection errors, model unavailable, timeouts), Hubs automatically retries subagent tasks using the ollama cloud equivalent (Fallback 1), then opencode-go hosted (Fallback 2). This is configured in `opencode.jsonc` under `hubs.modelTiering`.

### Tier-to-Fallback Mapping

| Tier | Primary (opencode zen) | Fallback 1 (ollama) | Fallback 2 (opencode-go) |
|------|----------------------|---------------------|--------------------------|
| **Top** | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-pro:cloud` | `opencode-go/deepseek-v4-pro` |
| **Mid** | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:cloud` | `opencode-go/deepseek-v4-flash` |
| **Fast** | `opencode/deepseek-v4-flash-free` | `ollama/glm-5.1:cloud` | `opencode-go/glm-5.1` |

### Configuration

```jsonc
{
  "hubs": {
    "modelTiering": {
      "top": {
        "primary": "opencode/deepseek-v4-flash-free",
        "fallback1": "ollama/deepseek-v4-pro:cloud",
        "fallback2": "opencode-go/deepseek-v4-pro"
      },
      "mid": {
        "primary": "opencode/deepseek-v4-flash-free",
        "fallback1": "ollama/deepseek-v4-flash:cloud",
        "fallback2": "opencode-go/deepseek-v4-flash"
      },
      "fast": {
        "primary": "opencode/deepseek-v4-flash-free",
        "fallback1": "ollama/glm-5.1:cloud",
        "fallback2": "opencode-go/glm-5.1"
      },
      "retry": {
        "max_attempts_per_provider": 3,
        "total_max_retries": 6
      }
    }
  }
}
```

### Fallback Protocol

| Attempt | Provider | Model | Behavior |
|---------|----------|-------|----------|
| 0 (initial) | Opencode Zen | `opencode/deepseek-v4-flash-free` | Default from agent definition |
| 1 (first retry) | ollama | `ollama/{model}:cloud` | Fallback 1 |
| 2 (second retry) | opencode-go | `opencode-go/{model}` | Fallback 2 |
| 3 (third retry) | opencode-go | `opencode-go/{model}` | Retry Fallback 2 |
| After 3 retries | — | — | Escalate to user via `question` tool |

### When Fallback Applies

Fallback is triggered ONLY for provider-level errors:

| Error Type | Apply Fallback? |
|-----------|----------------|
| Connection refused / timeout | **Yes** — retry with ollama (FB1), then opencode-go (FB2) |
| Model unavailable / 502/503/504 | **Yes** — retry with ollama (FB1), then opencode-go (FB2) |
| Rate limit / quota exceeded | **Yes** — retry with ollama (FB1), then opencode-go (FB2) |
| Wrong output / incorrect implementation | **No** — fix the task prompt |
| File not found / permission denied | **No** — fix environmental issue |

### Provider Setup

Add models to `opencode.jsonc` for the three providers:

```jsonc
{
  "provider": {
    "opencode": {
      "options": {},
      "models": {
        "deepseek-v4-flash-free": {
          "name": "deepseek-v4-flash-free",
          "limit": { "context": 1048576, "output": 131072 }
        }
      }
    },
    "ollama": {
      "options": {
        "baseURL": "http://127.0.0.1:11434/v1"
      },
      "models": {
        "deepseek-v4-pro:cloud": {
          "name": "deepseek-v4-pro:cloud",
          "_launch": true,
          "limit": { "context": 1048576, "output": 131072 }
        },
        "deepseek-v4-flash:cloud": {
          "name": "deepseek-v4-flash:cloud",
          "_launch": true,
          "limit": { "context": 1048576, "output": 131072 }
        },
        "glm-5.1:cloud": {
          "name": "glm-5.1:cloud",
          "_launch": true,
          "limit": { "context": 202752, "output": 131072 }
        }
      }
    },
    "opencode-go": {
      "options": {},
      "models": {
        "deepseek-v4-pro": {
          "name": "deepseek-v4-pro",
          "limit": { "context": 1048576, "output": 131072 }
        },
        "deepseek-v4-flash": {
          "name": "deepseek-v4-flash",
          "limit": { "context": 1048576, "output": 131072 }
        },
        "glm-5.1": {
          "name": "glm-5.1",
          "limit": { "context": 202752, "output": 131072 }
        },
        "nemotron-3-ultra": {
          "name": "nemotron-3-ultra",
          "limit": { "context": 262144, "output": 131072 }
        }
      }
    }
  }
}
```

## Custom Models

### Adding a New Model

1. **Define in opencode.jsonc:**

```jsonc
{
  "provider": {
    "ollama": {
      "models": {
        "my-custom-model": {
          "_launch": true,
          "limit": {
            "context": 128000,
            "output": 4096
          },
          "name": "my-custom-model"
        }
      }
    }
  }
}
```

2. **Assign to Agents:**

```yaml
---
name: my-agent
description: Uses custom model
model: opencode/deepseek-v4-flash-free
mode: subagent
---
```

3. **Use in Skills:**

```markdown
<Configuration>
model: my-custom-model
</Configuration>
```

### Model-Specific Settings

```jsonc
{
  "provider": {
    "ollama": {
      "models": {
        "code-specialist": {
          "_launch": true,
          "limit": { "context": 100000, "output": 16000 },
          "parameters": {
            "temperature": 0.1,      // Lower = more focused
            "top_p": 0.95,
            "frequency_penalty": 0.1,
            "presence_penalty": 0.1
          },
          "defaults": {
            "system_prompt": "You are a code specialist...",
            "stop_sequences": ["```", "---END---"]
          }
        }
      }
    }
  }
}
```

### Tiered Model Strategy

Configured in `opencode.jsonc` under `hubs.modelTiering`:

```jsonc
{
  "hubs": {
    "modelTiering": {
      "top": "opencode/deepseek-v4-flash-free",
      "mid": "opencode/deepseek-v4-flash-free",
      "fast": "opencode/deepseek-v4-flash-free"
    }
  }
}
```

| Tier | Models | Use Case |
|------|--------|----------|
| **Top** | opencode/deepseek-v4-flash-free (primary), ollama/deepseek-v4-pro:cloud (fallback) | Complex architecture, security review, deep reasoning |
| **Mid** | opencode/deepseek-v4-flash-free (primary), ollama/deepseek-v4-flash:cloud (fallback) | Implementation, agent orchestration, most tasks |
| **Fast** | opencode/deepseek-v4-flash-free (primary), ollama/glm-5.1:cloud (fallback) | Search, explore, documentation, simple generation |

### Model Routing

```jsonc
{
  "model_routing": {
    "default": "opencode/deepseek-v4-flash-free",
    "routing": {
      "explore": "opencode/deepseek-v4-flash-free",
      "executor": "opencode/deepseek-v4-flash-free",
      "architect": "opencode/deepseek-v4-flash-free",
      "security-reviewer": "opencode/deepseek-v4-flash-free"
    }
  }
}
```

## Best Practices

### Context Management

1. **Monitor context usage:**
   ```typescript
   // Large files consume context
   // Split into chunks if needed
   const chunks = await splitLargeFile(file, maxChunkSize)
   ```

2. **Use conversation compaction:**
   - Let Hubs compact when needed
   - Key state is preserved

3. **Prefer focused prompts:**
   - Be specific
   - Avoid redundant context

### Output Optimization

1. **Request appropriate sizes:**
   ```typescript
   // Bad: Request entire file if only need function
   "Write the entire UserService.ts file"
   
   // Good: Request specific part
   "Write the authenticate method for UserService"
   ```

2. **Use streaming for long outputs:**
   ```typescript
   // Stream long responses
   for await (const chunk of stream) {
     process(chunk)
   }
   ```

3. **Break down complex tasks:**
   - Multiple smaller requests
   - Assemble results

### Cost Optimization

1. **Use tiered models:**
   ```jsonc
   {
    "model_routing": {
        "explore": "opencode/deepseek-v4-flash-free",  // Fast, cheap
        "default": "opencode/deepseek-v4-flash-free",  // Standard
        "architecture": "opencode/deepseek-v4-flash-free"  // Universal
      }
   }
   ```

2. **Cache frequently used context:**
   ```typescript
   // Store common context once
   await agentContext({
     action: "setMemory",
     data: { techStack: { ... } }
   })
   ```

3. **Batch similar operations:**
   ```typescript
   // Bad: Multiple agent calls
   await agent("fix", { file: "a.ts" })
   await agent("fix", { file: "b.ts" })
   
   // Good: Single call with multiple files
   await agent("fix", { files: ["a.ts", "b.ts"] })
   ```

## Troubleshooting

### Model Not Found

**Error:** `Model 'glm-5.1:cloud' not found`

**Solutions:**
1. Check model name spelling
2. Verify provider configuration
3. Ensure `_launch: true` is set

### Context Exceeded

**Error:** `Context window exceeded (150000 > 100000)`

**Solutions:**
1. Reduce input size
2. Use model with larger context
3. Clear conversation history

```typescript
// Clear history to free context
await clearHistory()
```

### Output Truncated

**Error:** `Output truncated at 8000 tokens`

**Solutions:**
1. Use model with larger output limit
2. Request smaller chunks
3. Use streaming

### Rate Limiting

**Error:** `Rate limit exceeded`

**Solutions:**
1. Implement backoff
2. Reduce concurrent requests
3. Use multiple API keys (rotate)

```typescript
// Exponential backoff
let delay = 1000
while (retries < maxRetries) {
  try {
    return await generate(prompt)
  } catch (e) {
    if (e.status === 429) {
      await sleep(delay)
      delay *= 2
      retries++
    } else throw e
  }
}
```

### Slow Response

**Causes:**
1. Large context
2. Complex reasoning required
3. Network latency
4. Model under load

**Solutions:**
1. Use faster tier model
2. Reduce context
3. Use streaming for progress feedback
4. Check network connectivity

## See Also

- [Agents](./agents.md) - Agent model assignments
- [Skills](./skills.md) - Skill model requirements
- [Installation](./installation.md) - Initial configuration