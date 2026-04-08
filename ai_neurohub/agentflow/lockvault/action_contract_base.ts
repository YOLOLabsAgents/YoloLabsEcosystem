import { z } from "zod"

/**
 * Base types for any action
 */
export type ActionSchema = z.ZodObject<z.ZodRawShape>

export interface ActionError {
  code: string
  message: string
  cause?: unknown
}

export interface ActionResponse<T> {
  success: boolean
  notice?: string
  data?: T
  error?: ActionError
  meta?: {
    startedAt: number
    finishedAt: number
    durationMs: number
  }
}

export type ExecutionArgs<S extends ActionSchema, Ctx> = {
  payload: z.infer<S>
  context: Ctx
}

export interface BaseAction<S extends ActionSchema, R, Ctx = unknown> {
  readonly id: string
  readonly summary: string
  readonly input: S
  execute(args: ExecutionArgs<S, Ctx>): Promise<ActionResponse<R>>
}

/**
 * Type guard for successful responses
 */
export function isOk<T>(res: ActionResponse<T>): res is ActionResponse<T> & { success: true; data: T } {
  return res.success === true && res.error === undefined
}

/**
 * Helper to create a strongly typed action object
 */
export function createAction<S extends ActionSchema, R, Ctx = unknown>(config: {
  id: string
  summary: string
  input: S
  execute: (args: ExecutionArgs<S, Ctx>) => Promise<ActionResponse<R>>
}): BaseAction<S, R, Ctx> {
  return {
    id: config.id,
    summary: config.summary,
    input: config.input,
    execute: config.execute,
  }
}
