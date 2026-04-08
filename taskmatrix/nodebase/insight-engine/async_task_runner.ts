/**
 * Simple task executor: registers and runs tasks by name with queue management and error handling
 */
type Handler = (params: any) => Promise<any>

interface Task {
  id: string
  type: string
  params: any
  retries?: number
  createdAt: number
}

interface ExecutionResult {
  id: string
  result?: any
  error?: string
  attempts: number
  finishedAt: number
}

export class ExecutionEngine {
  private handlers: Record<string, Handler> = {}
  private queue: Task[] = []

  register(type: string, handler: Handler): void {
    this.handlers[type] = handler
  }

  enqueue(id: string, type: string, params: any, retries: number = 0): void {
    if (!this.handlers[type]) throw new Error(`No handler for ${type}`)
    this.queue.push({ id, type, params, retries, createdAt: Date.now() })
  }

  clear(): void {
    this.queue = []
  }

  size(): number {
    return this.queue.length
  }

  async runAll(): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = []
    while (this.queue.length) {
      const task = this.queue.shift()!
      let attempts = 0
      let success = false
      while (attempts <= (task.retries ?? 0) && !success) {
        attempts++
        try {
          const data = await this.handlers[task.type](task.params)
          results.push({ id: task.id, result: data, attempts, finishedAt: Date.now() })
          success = true
        } catch (err: any) {
          if (attempts > (task.retries ?? 0)) {
            results.push({
              id: task.id,
              error: err.message,
              attempts,
              finishedAt: Date.now(),
            })
          }
        }
      }
    }
    return results
  }
}
