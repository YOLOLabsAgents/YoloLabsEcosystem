export class SigningEngine {
  private keyPair?: CryptoKeyPair

  constructor() {}

  /**
   * Initialize the keypair asynchronously
   */
  async init(): Promise<void> {
    this.keyPair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    )
  }

  private ensureReady(): asserts this is { keyPair: CryptoKeyPair } {
    if (!this.keyPair) {
      throw new Error("SigningEngine not initialized. Call init() first.")
    }
  }

  async sign(data: string): Promise<string> {
    this.ensureReady()
    const enc = new TextEncoder().encode(data)
    const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", this.keyPair.privateKey, enc)
    return Buffer.from(sig).toString("base64")
  }

  async verify(data: string, signature: string): Promise<boolean> {
    this.ensureReady()
    const enc = new TextEncoder().encode(data)
    const sig = Buffer.from(signature, "base64")
    return crypto.subtle.verify("RSASSA-PKCS1-v1_5", this.keyPair.publicKey, sig, enc)
  }

  /**
   * Export public key in PEM format
   */
  async exportPublicKey(): Promise<string> {
    this.ensureReady()
    const spki = await crypto.subtle.exportKey("spki", this.keyPair.publicKey)
    const b64 = Buffer.from(spki).toString("base64")
    const lines = b64.match(/.{1,64}/g) ?? []
    return `-----BEGIN PUBLIC KEY-----\n${lines.join("\n")}\n-----END PUBLIC KEY-----`
  }
}
