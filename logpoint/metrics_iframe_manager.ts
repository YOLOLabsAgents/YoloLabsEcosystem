import type { TokenMetrics } from "./tokenAnalysisCalculator"

export interface IframeConfig {
  containerId: string
  srcUrl: string
  metrics: TokenMetrics
  refreshIntervalMs?: number
  sandbox?: string
  allowFullscreen?: boolean
}

export class TokenAnalysisIframe {
  private iframeEl: HTMLIFrameElement | null = null
  private refreshTimer: number | null = null

  constructor(private config: IframeConfig) {}

  init(): void {
    const container = document.getElementById(this.config.containerId)
    if (!container) throw new Error("Container not found: " + this.config.containerId)

    const iframe = document.createElement("iframe")
    iframe.src = this.config.srcUrl
    iframe.width = "100%"
    iframe.height = "100%"
    iframe.style.border = "0"
    if (this.config.sandbox) iframe.sandbox.add(this.config.sandbox)
    if (this.config.allowFullscreen) iframe.allowFullscreen = true

    iframe.onload = () => this.postMetrics()
    container.appendChild(iframe)
    this.iframeEl = iframe

    if (this.config.refreshIntervalMs && this.config.refreshIntervalMs > 0) {
      this.refreshTimer = window.setInterval(
        () => this.postMetrics(),
        this.config.refreshIntervalMs
      )
    }
  }

  private postMetrics(): void {
    if (!this.iframeEl?.contentWindow) return
    this.iframeEl.contentWindow.postMessage(
      {
        type: "TOKEN_ANALYSIS_METRICS",
        payload: { ...this.config.metrics, timestamp: Date.now() },
      },
      "*"
    )
    console.debug("[TokenAnalysisIframe] Posted metrics:", this.config.metrics)
  }

  destroy(): void {
    if (this.refreshTimer !== null) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
    if (this.iframeEl && this.iframeEl.parentNode) {
      this.iframeEl.parentNode.removeChild(this.iframeEl)
      this.iframeEl = null
    }
  }
}
