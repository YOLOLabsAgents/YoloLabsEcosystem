export const SOLANA_KNOWLEDGE_AGENT_ID = "solana-knowledge-agent" as const

export const SOLANA_KNOWLEDGE_AGENT_VERSION = "1.0.0" as const

export const SOLANA_KNOWLEDGE_AGENT_METADATA = {
  id: SOLANA_KNOWLEDGE_AGENT_ID,
  version: SOLANA_KNOWLEDGE_AGENT_VERSION,
  description:
    "Agent responsible for answering authoritative questions about Solana protocols, tokens, tooling, wallets, validators, and ecosystem news",
  tags: ["solana", "knowledge", "agent"],
  createdAt: new Date().toISOString(),
} as const

export type SolanaKnowledgeAgentMeta = typeof SOLANA_KNOWLEDGE_AGENT_METADATA
