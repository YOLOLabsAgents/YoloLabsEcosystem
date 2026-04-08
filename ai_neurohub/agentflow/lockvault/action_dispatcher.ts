import type { BaseAction, ActionResponse } from "./action_contract_base"
import { z } from "zod"

export interface AgentContext {
  apiEndpoint: string
  apiKey: string
  timeoutMs?: number
  headers?: Record<string, string>
}

/**
 * Central Agent: routes calls to registered actions
 */
export class Agent {
  private readonly actions = new Map<string, BaseAction<z.ZodObject<z.ZodRawShape>, any, AgentContext>>()

  register<S extends z.ZodObject<z.ZodRawShape>, R>(action: BaseAction<S, R, AgentContext>): void {
    this.actions.set(action.id, action)
  }

  registerMany(entries: Array<BaseAction<z.ZodObject<z.ZodRawShape>, any, AgentContext>>): void {
    for (const a of entries) this.register(a)
  }

  hasAction(actionId: string): boolean {
    return this.actions.has(actionId)
  }

  unregister(actionId: string): boolean {
    return this.actions.delete(actionId)
  }

  clear(): void {
    this.actions.clear()
  }

  list(): string[] {
    return Array.from(this.actions.keys())
  }

  async invoke<R, S extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>>(
    actionId: string,
    payload: unknown,
    ctx: AgentContext
  ): Promise<ActionResponse<R>> {
    const startedAt = Date.now()
    const action = this.actions.get(actionId) as BaseAction<S, R, AgentContext> | undefined

    if (!action) {
      return {
        success: false,
        error: { code: "ACTION_NOT_FOUND", message: `Unknown action "${actionId}"` },
        meta: { startedAt, finishedAt: Date.now(), durationMs: Date.now() - startedAt },
      }
    }

    // Validate payload against the action schema before execution
    const parsed = action.input.safeParse(payload)
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Payload does not match the expected schema",
          cause: parsed.error.flatten(),
        },
        meta: { startedAt, finishedAt: Date.now(), durationMs: Date.now() - startedAt },
      }
    }

    try {
      const res = await action.execute({ payload: parsed.data, context: ctx })
      return {
        ...res,
        success: res.success ?? true,
        meta: res.meta ?? {
          startedAt,
          finishedAt: Date.now(),
          durationMs: Date.now() - startedAt,
        },
      }
    } catch (err) {
      return {
        success: false,
        error: { code: "EXECUTION_ERROR", message: "Action execution failed", cause: err },
        meta: { startedAt, finishedAt: Date.now(), durationMs: Date.now() - startedAt },
      }
    }
  }
}
