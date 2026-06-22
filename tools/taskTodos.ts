import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"

type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
type TodoPriority = 'high' | 'medium' | 'low'

interface TodoItem {
  content: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
}

function getTodoPath(projectRoot: string): string {
  return path.join(projectRoot, '.opencode', 'state', 'todos.json')
}

function readTodos(projectRoot: string): TodoItem[] {
  try {
    const todoPath = getTodoPath(projectRoot)
    if (!fs.existsSync(todoPath)) return []
    const data = JSON.parse(fs.readFileSync(todoPath, 'utf-8'))
    return data.todos || []
  } catch {
    return []
  }
}

function writeTodos(projectRoot: string, todos: TodoItem[]): void {
  const stateDir = path.join(projectRoot, '.opencode', 'state')
  fs.mkdirSync(stateDir, { recursive: true })
  fs.writeFileSync(getTodoPath(projectRoot), JSON.stringify({ todos }, null, 2))
}

const VALID_TODO_ACTIONS = ['create', 'add', 'update', 'get', 'clear', 'next', 'summary'] as const
const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const
const VALID_PRIORITIES = ['high', 'medium', 'low'] as const

export default tool({
  description: "Manage task todos: create list, add items, update status, get current, or clear all",
  args: {
    action: tool.schema.string().describe(`Action to perform. Valid: ${VALID_TODO_ACTIONS.join(', ')}`),
    items: tool.schema.array(tool.schema.any()).optional().describe("Todo items for create/add actions"),
    content: tool.schema.string().optional().describe("Task content for single add/update"),
    status: tool.schema.string().optional().describe(`Status for update. Valid: ${VALID_STATUSES.join(', ')}`),
    priority: tool.schema.string().optional().describe(`Priority level. Valid: ${VALID_PRIORITIES.join(', ')}`),
    index: tool.schema.number().optional().describe("Index for update action")
  },
  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()
    
    switch (args.action) {
      case 'create': {
        const todos: TodoItem[] = (args.items || []).map((item: any) => ({
          content: typeof item === 'string' ? item : item.content,
          status: item.status || 'pending',
          priority: item.priority || 'medium'
        }))
        writeTodos(projectRoot, todos)
        return JSON.stringify({ created: todos.length, todos })
      }
      
      case 'add': {
        const todos = readTodos(projectRoot)
        if (args.content) {
          todos.push({
            content: args.content,
            status: (args.status || 'pending') as 'pending' | 'in_progress' | 'completed' | 'cancelled',
            priority: (args.priority || 'medium') as 'high' | 'medium' | 'low'
          })
        } else if (args.items) {
          for (const item of args.items) {
            todos.push({
              content: typeof item === 'string' ? item : item.content,
              status: (item.status || 'pending') as 'pending' | 'in_progress' | 'completed' | 'cancelled',
              priority: (item.priority || 'medium') as 'high' | 'medium' | 'low'
            })
          }
        }
        writeTodos(projectRoot, todos)
        return JSON.stringify({ added: args.items?.length || 1, total: todos.length })
      }
      
      case 'update': {
        const todos = readTodos(projectRoot)
        const idx = args.index !== undefined ? args.index : todos.findIndex(t => t.content === args.content)
        
        if (idx === -1 || idx >= todos.length) return JSON.stringify({ error: 'Task not found' })
        
        if (args.status) todos[idx].status = args.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'
        if (args.priority) todos[idx].priority = args.priority as 'high' | 'medium' | 'low'
        
        writeTodos(projectRoot, todos)
        return JSON.stringify({ updated: idx, task: todos[idx] })
      }
      
      case 'get': {
        return JSON.stringify({ todos: readTodos(projectRoot), path: getTodoPath(projectRoot) })
      }
      
      case 'clear': {
        writeTodos(projectRoot, [])
        return JSON.stringify({ cleared: true })
      }
      
      case 'next': {
        const todos = readTodos(projectRoot)
        const next = todos.find(t => t.status === 'pending') || todos.find(t => t.status === 'in_progress')
        return JSON.stringify(next || { message: 'All tasks completed' })
      }
      
      case 'summary': {
        const todos = readTodos(projectRoot)
        const summary = {
          total: todos.length,
          pending: todos.filter(t => t.status === 'pending').length,
          inProgress: todos.filter(t => t.status === 'in_progress').length,
          completed: todos.filter(t => t.status === 'completed').length,
          cancelled: todos.filter(t => t.status === 'cancelled').length,
          high: todos.filter(t => t.priority === 'high' && t.status !== 'completed').length
        }
        return JSON.stringify(summary)
      }
      
      default:
        return JSON.stringify({ error: `Unknown action: ${args.action}` })
    }
  }
})