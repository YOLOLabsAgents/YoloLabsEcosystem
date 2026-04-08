import nodemailer from "nodemailer"

export interface AlertConfig {
  email?: {
    host: string
    port: number
    user: string
    pass: string
    from: string
    to: string[]
    secure?: boolean
  }
  console?: boolean
  bufferMode?: boolean
}

export interface AlertSignal {
  title: string
  message: string
  level: "info" | "warning" | "critical"
  timestamp?: number
  tags?: string[]
}

export class AlertService {
  constructor(private cfg: AlertConfig) {}

  private async sendEmail(signal: AlertSignal) {
    if (!this.cfg.email) return
    const { host, port, user, pass, from, to, secure } = this.cfg.email
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: secure ?? false,
      auth: { user, pass },
    })
    await transporter.sendMail({
      from,
      to,
      subject: `[${signal.level.toUpperCase()}] ${signal.title}`,
      text: `[${new Date(signal.timestamp ?? Date.now()).toISOString()}]\n${signal.message}`,
    })
  }

  private logConsole(signal: AlertSignal) {
    if (!this.cfg.console) return
    console.log(
      `[Alert][${signal.level.toUpperCase()}][${new Date(signal.timestamp ?? Date.now()).toISOString()}] ${signal.title}\n${signal.message}`
    )
    if (signal.tags && signal.tags.length > 0) {
      console.log(`Tags: ${signal.tags.join(", ")}`)
    }
  }

  async dispatch(signals: AlertSignal[]) {
    for (const sig of signals) {
      const enriched = { ...sig, timestamp: sig.timestamp ?? Date.now() }
      await this.sendEmail(enriched)
      this.logConsole(enriched)
    }
  }

  async dispatchSingle(signal: AlertSignal) {
    await this.dispatch([signal])
  }
}
