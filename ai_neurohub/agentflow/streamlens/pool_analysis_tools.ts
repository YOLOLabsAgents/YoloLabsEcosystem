import { toolkitBuilder } from "@/ai/core"
import { FETCH_POOL_DATA_KEY } from "@/ai/modules/liquidity/pool-fetcher/key"
import { ANALYZE_POOL_HEALTH_KEY } from "@/ai/modules/liquidity/health-checker/key"
import { FetchPoolDataAction } from "@/ai/modules/liquidity/pool-fetcher/action"
import { AnalyzePoolHealthAction } from "@/ai/modules/liquidity/health-checker/action"

type Toolkit = ReturnType<typeof toolkitBuilder>

/**
 * Toolkit exposing liquidity-related actions:
 * – fetch raw pool data
 * – run health / risk analysis on a liquidity pool
 * – calculate performance signals
 */
export const LIQUIDITY_ANALYSIS_TOOLS: Record<string, Toolkit> = Object.freeze({
  [`liquidityscan-${FETCH_POOL_DATA_KEY}`]: toolkitBuilder(new FetchPoolDataAction()),
  [`poolhealth-${ANALYZE_POOL_HEALTH_KEY}`]: toolkitBuilder(new AnalyzePoolHealthAction()),
})

/**
 * Utility to get available liquidity tool keys
 */
export function getLiquidityToolKeys(): string[] {
  return Object.keys(LIQUIDITY_ANALYSIS_TOOLS)
}

/**
 * Utility to resolve a specific toolkit by key
 */
export function getLiquidityTool(key: string): Toolkit | undefined {
  return LIQUIDITY_ANALYSIS_TOOLS[key]
}

/**
 * Metadata for liquidity analysis tools
 */
export const LIQUIDITY_TOOL_METADATA = {
  version: "1.1.0",
  tools: [
    {
      key: `liquidityscan-${FETCH_POOL_DATA_KEY}`,
      description: "Fetch raw liquidity pool data for given addresses",
    },
    {
      key: `poolhealth-${ANALYZE_POOL_HEALTH_KEY}`,
      description: "Run liquidity pool health and risk checks",
    },
  ],
} as const
