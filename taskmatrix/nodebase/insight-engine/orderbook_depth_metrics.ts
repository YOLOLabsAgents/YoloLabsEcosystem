/**
 * Analyze on-chain orderbook depth for a given market with extra metrics
 */
export interface Order {
  price: number
  size: number
}

export interface DepthMetrics {
  averageBidDepth: number
  averageAskDepth: number
  spread: number
  totalBidVolume: number
  totalAskVolume: number
  midPrice: number
}

export class TokenDepthAnalyzer {
  constructor(private rpcEndpoint: string, private marketId: string) {}

  private async fetchOrderbook(depth = 50): Promise<{ bids: Order[]; asks: Order[] }> {
    const url = `${this.rpcEndpoint}/orderbook/${this.marketId}?depth=${depth}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Orderbook fetch failed: ${res.status}`)
    return await res.json()
  }

  private calculateAverage(arr: Order[]): number {
    if (arr.length === 0) return 0
    return arr.reduce((s, o) => s + o.size, 0) / arr.length
  }

  async analyze(depth = 50): Promise<DepthMetrics> {
    const { bids, asks } = await this.fetchOrderbook(depth)
    const bestBid = bids[0]?.price ?? 0
    const bestAsk = asks[0]?.price ?? 0

    const avgBid = this.calculateAverage(bids)
    const avgAsk = this.calculateAverage(asks)
    const totalBidVolume = bids.reduce((s, o) => s + o.size, 0)
    const totalAskVolume = asks.reduce((s, o) => s + o.size, 0)
    const midPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : 0

    return {
      averageBidDepth: avgBid,
      averageAskDepth: avgAsk,
      spread: bestAsk - bestBid,
      totalBidVolume,
      totalAskVolume,
      midPrice,
    }
  }

  async getLiquidityImbalance(depth = 50): Promise<number> {
    const { bids, asks } = await this.fetchOrderbook(depth)
    const totalBid = bids.reduce((s, o) => s + o.size, 0)
    const totalAsk = asks.reduce((s, o) => s + o.size, 0)
    if (totalBid + totalAsk === 0) return 0
    return (totalBid - totalAsk) / (totalBid + totalAsk)
  }
}
