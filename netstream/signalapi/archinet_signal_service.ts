export interface Signal {
  id: string
  type: string
  timestamp: number
  payload: Record<string, any>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  status?: number
  fetchedAt?: number
}

/**
 * HTTP client for fetching signals from ArchiNet
 */
export class SignalApiClient {
  constructor(private baseUrl: string, private apiKey?: string, private timeoutMs: number = 10000) {}

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`
    return headers
  }

  private async request<T>(path: string): Promise<ApiResponse<T>> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: controller.signal,
      })
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}`, status: res.status, fetchedAt: Date.now() }
      }
      const data = (await res.json()) as T
      return { success: true, data, status: res.status, fetchedAt: Date.now() }
    } catch (err: any) {
      return { success: false, error: err.message, fetchedAt: Date.now() }
    } finally {
      clearTimeout(timer)
    }
  }

  async fetchAllSignals(): Promise<ApiResponse<Signal[]>> {
    return this.request<Signal[]>("/signals")
  }

  async fetchSignalById(id: string): Promise<ApiResponse<Signal>> {
    return this.request<Signal>(`/signals/${encodeURIComponent(id)}`)
  }

  async fetchSignalsByType(type: string): Promise<ApiResponse<Signal[]>> {
    return this.request<Signal[]>(`/signals?type=${encodeURIComponent(type)}`)
  }
}
