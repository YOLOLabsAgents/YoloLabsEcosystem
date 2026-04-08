export interface LaunchConfig {
  contractName: string
  parameters: Record<string, any>
  deployEndpoint: string
  apiKey?: string
  retries?: number
  timeoutMs?: number
}

export interface LaunchResult {
  success: boolean
  address?: string
  transactionHash?: string
  network?: string
  gasUsed?: number
  error?: string
  raw?: unknown
}

export class LaunchNode {
  constructor(private config: LaunchConfig) {}

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeout: NodeJS.Timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error("Deployment timed out")), ms)
    })
    try {
      return await Promise.race([promise, timeoutPromise])
    } finally {
      clearTimeout(timeout!)
    }
  }

  async deploy(): Promise<LaunchResult> {
    const { deployEndpoint, apiKey, contractName, parameters, retries = 1, timeoutMs = 15000 } = this.config

    let attempt = 0
    while (attempt < retries) {
      attempt++
      try {
        const res = await this.withTimeout(
          fetch(deployEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify({ contractName, parameters }),
          }),
          timeoutMs
        )

        if (!res.ok) {
          const text = await res.text()
          if (attempt >= retries) {
            return { success: false, error: `HTTP ${res.status}: ${text}` }
          }
          continue
        }

        const json = await res.json()
        return {
          success: true,
          address: json.contractAddress,
          transactionHash: json.txHash,
          network: json.network,
          gasUsed: json.gasUsed,
          raw: json,
        }
      } catch (err: any) {
        if (attempt >= retries) {
          return { success: false, error: err.message }
        }
      }
    }

    return { success: false, error: "Deployment failed after retries" }
  }
}
