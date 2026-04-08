export interface AgentCapabilities {
  canAnswerProtocolQuestions: boolean
  canAnswerTokenQuestions: boolean
  canDescribeTooling: boolean
  canReportEcosystemNews: boolean
  canAnalyzeWallets: boolean
  canProvideMarketSignals: boolean
}

export interface AgentFlags {
  requiresExactInvocation: boolean
  noAdditionalCommentary: boolean
  allowAsyncExecution: boolean
  restrictedAccess?: boolean
}

export const SOLANA_AGENT_CAPABILITIES: AgentCapabilities = {
  canAnswerProtocolQuestions: true,
  canAnswerTokenQuestions: true,
  canDescribeTooling: true,
  canReportEcosystemNews: true,
  canAnalyzeWallets: true,
  canProvideMarketSignals: true,
}

export const SOLANA_AGENT_FLAGS: AgentFlags = {
  requiresExactInvocation: true,
  noAdditionalCommentary: true,
  allowAsyncExecution: true,
  restrictedAccess: false,
}

/**
 * Utility to check if an agent can perform a specific capability
 */
export function hasCapability(
  capabilities: AgentCapabilities,
  key: keyof AgentCapabilities
): boolean {
  return capabilities[key] === true
}

/**
 * Utility to enforce flag constraints
 */
export function enforceFlags<T>(
  flags: AgentFlags,
  response: T
): T | { error: string } {
  if (flags.noAdditionalCommentary) {
    return response
  }
  return { ...response, meta: "Additional commentary allowed" }
}
