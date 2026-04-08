import type { TaskFormInput } from "./taskFormSchemas"
import { TaskFormSchema } from "./taskFormSchemas"

/**
 * Processes a Typeform webhook payload to schedule a new task
 */
export async function handleTypeformSubmission(
  raw: unknown
): Promise<{ success: boolean; message: string; task?: TaskFormInput }> {
  const parsed = TaskFormSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      message: `Validation error: ${parsed.error.issues.map(i => i.message).join("; ")}`,
    }
  }

  const { taskName, taskType, parameters, scheduleCron } = parsed.data

  // Simulate generating an ID for the scheduled task
  const taskId = `${taskType}-${Date.now()}`

  // Here you would normally persist to DB or enqueue a scheduler
  console.info("[TaskHandler] Scheduling task:", {
    id: taskId,
    taskName,
    taskType,
    parameters,
    scheduleCron,
  })

  return {
    success: true,
    message: `Task "${taskName}" scheduled with ID ${taskId}`,
    task: parsed.data,
  }
}

/**
 * Utility to validate payload only
 */
export function validateTypeformPayload(raw: unknown): { valid: boolean; errors?: string[] } {
  const parsed = TaskFormSchema.safeParse(raw)
  if (!parsed.success) {
    return { valid: false, errors: parsed.error.issues.map(i => i.message) }
  }
  return { valid: true }
}
