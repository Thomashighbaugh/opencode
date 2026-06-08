# Model Configuration

> Complete reference for configuring AI models in Hubs

## Table of Contents

- [Overview](#overview)
- [Default Models](#default-models)
- [Model Properties](#model-properties)
- [Provider Configuration](#provider-configuration)
- [Custom Models](#custom-models)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Hubs uses ollama cloud models by default, providing a balance of capability and cost-effectiveness. Models are configured in `opencode.jsonc`.

## Default Models

| Model | Context | Output | Best For | Notes |
|-------|---------|--------|----------|-------|
| **glm-5.1:cloud** | 202K | 131K | General purpose, most tasks | Default for most agents |
| **kimi-k2.5:cloud** | 262K | 262K | Extended context, long documents | Same input/output context |
| **minimax-m2.7:cloud** | 205K | 128K | High performance tasks | Balanced performance |
| **qwen3.5:cloud** | 262K | 32K | Long document processing | Limited output |

### Model Selection by Task

| Task Type | Recommended Model | Reason |
|-----------|-------------------|--------|
| Implementation | glm-5.1:cloud | Balanced, cost-effective |
| Architecture | opus | Deep reasoning (override) |
| Search/Explore | haiku | Fast, efficient |
| Documentation | haiku | Simple generation |
| Security Review | opus | Critical analysis (override) |
| Long documents | kimi-k2.5:cloud | Extended context |
| Complex analysis | minimax-m2.7:cloud | High performance |

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
      "options": {}
    },
    "ollama": {
      "models": {
        "glm-5.1:cloud": {
          "_launch": true,
          "limit": {
            "context": 202752,
            "output": 131072
          },
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
      "options": {}
    },
    "ollama": {
      "models": {
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
    "ollama": {
      "models": {
        "glm-5.1:cloud": {
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
model: ollama/my-custom-model
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

Configure different models for different agent types:

```jsonc
{
  "provider": {
    "ollama": {
      "models": {
        // Fast tier - reading, searching, simple generation
        "fast-model": {
          "limit": { "context": 50000, "output": 2000 },
          "tier": "fast"
        },
        // Standard tier - most operations
        "glm-5.1:cloud": {
          "limit": { "context": 200000, "output": 100000 },
          "tier": "standard"
        },
        // Deep tier - complex reasoning
        "deep-model": {
          "limit": { "context": 300000, "output": 20000 },
          "tier": "deep"
        }
      }
    }
  }
}
```

### Model Routing

```jsonc
{
  "model_routing": {
    "default": "glm-5.1:cloud",
    "routing": {
      "explore": "fast-model",
      "executor": "glm-5.1:cloud",
      "architect": "deep-model",
      "security-reviewer": "deep-model"
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
       "explore": "haiku",      // Fast, cheap
       "default": "glm-5.1:cloud", // Standard
       "architecture": "opus"    // Expensive, use sparingly
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