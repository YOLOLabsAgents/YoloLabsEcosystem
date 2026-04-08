/**
 * Analyze on-chain token activity: fetches recent activity and summarizes transfers
 */
export interface ActivityRecord {
  timestamp: number
  signature: string
  source: string
  destination: string
  amount: number
}

type SignatureEntry = { signature: string }
type SignaturesResponse = SignatureEntry[]
type TokenBalance = { owner: string | null; uiTokenAmount: { uiAmount: number | null } }
type TxMeta = { preTokenBalances?: TokenBalance[]; postTokenBalances?: TokenBalance[] }
type TransactionResponse = { blockTime?: number | null; meta?: TxMeta | null }

export class TokenActivityAnalyzer {
  constructor(private rpcEndpoint: string, private timeoutMs: number = 12000) {}

  private async withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ms)
    try {
      return await Promise.race([
        p,
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Request timed out")), ms)),
      ])
    } finally {
      clearTimeout(timer)
    }
  }

  private async fetchJSON<T>(url: string): Promise<T> {
    const res = await this.withTimeout(fetch(url), this.timeoutMs)
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
    return (await res.json()) as T
  }

  async fetchRecentSignatures(mint: string, limit = 100): Promise<string[]> {
    const url = `${this.rpcEndpoint}/getSignaturesForAddress/${encodeURIComponent(mint)}?limit=${limit}`
    const json = await this.fetchJSON<SignaturesResponse>(url)
    return Array.isArray(json) ? json.map(e => e.signature).filter(Boolean) : []
  }

  private static ownerOrUnknown(v: string | null | undefined): string {
    return v && v.length > 0 ? v : "unknown"
  }

  private mapTransactionRecords(sig: string, tx: TransactionResponse): ActivityRecord[] {
    const meta = tx?.meta ?? {}
    const pre = Array.isArray(meta.preTokenBalances) ? meta.preTokenBalances : []
    const post = Array.isArray(meta.postTokenBalances) ? meta.postTokenBalances : []
    const out: ActivityRecord[] = []

    for (let i = 0; i < post.length; i++) {
      const p = post[i]
      const q = pre[i] ?? { uiTokenAmount: { uiAmount: 0 }, owner: null }
      const pAmt = Number(p?.uiTokenAmount?.uiAmount ?? 0)
      const qAmt = Number(q?.uiTokenAmount?.uiAmount ?? 0)
      const delta = pAmt - qAmt
      if (delta !== 0) {
        out.push({
          timestamp: Math.max(0, Number(tx?.blockTime ?? 0) * 1000),
          signature: sig,
          source: TokenActivityAnalyzer.ownerOrUnknown(q?.owner ?? null),
          destination: TokenActivityAnalyzer.ownerOrUnknown(p?.owner ?? null),
          amount: Math.abs(delta),
        })
      }
    }
    return out
  }

  /**
   * Analyze recent activity for a token mint
   * @param mint token mint address
   * @param limit number of signatures to inspect
   * @param concurrency number of parallel transaction fetches
   */
  async analyzeActivity(mint: string, limit = 50, concurrency = 6): Promise<ActivityRecord[]> {
    const sigs = await this.fetchRecentSignatures(mint, limit)
    if (sigs.length === 0) return []

    const results: ActivityRecord[] = []
    let idx = 0

    const worker = async () => {
      while (idx < sigs.length) {
        const myIndex = idx++
        const sig = sigs[myIndex]
        try {
          const txUrl = `${this.rpcEndpoint}/getTransaction/${encodeURIComponent(sig)}`
          const tx = await this.fetchJSON<TransactionResponse>(txUrl)
          results.push(...this.mapTransactionRecords(sig, tx))
        } catch {
          // ignore failed tx fetch
        }
      }
    }

    const workers = Array.from({ length: Math.min(concurrency, sigs.length) }, () => worker())
    await Promise.all(workers)

    // sort newest first for consistency
    return results.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Summarize total transferred amounts by address
   */
  summarizeTransfers(records: ActivityRecord[]): {
    bySource: Record<string, number>
    byDestination: Record<string, number>
    total: number
  } {
    const bySource: Record<string, number> = {}
    const byDestination: Record<string, number> = {}
    let total = 0
    for (const r of records) {
      bySource[r.source] = (bySource[r.source] ?? 0) + r.amount
      byDestination[r.destination] = (byDestination[r.destination] ?? 0) + r.amount
      total += r.amount
    }
    return { bySource, byDestination, total }
  }
}
