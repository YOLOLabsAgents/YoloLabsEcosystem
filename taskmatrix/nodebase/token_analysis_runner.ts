(async () => {
  const SOLANA_RPC = process.env.SOLANA_RPC ?? "https://solana.rpc"
  const DEX_API = process.env.DEX_API ?? "https://dex.api"
  const MINT = process.env.TOKEN_MINT ?? "MintPubkeyHere"
  const MARKET = process.env.MARKET_ID ?? "MarketPubkeyHere"

  const activityAnalyzer = new TokenActivityAnalyzer(SOLANA_RPC)
  const depthAnalyzer = new TokenDepthAnalyzer(DEX_API, MARKET)
  const engine = new ExecutionEngine()
  const signer = new SigningEngine()

  const t0 = Date.now()
  try {
    // 1) Analyze activity
    const records: any[] = await activityAnalyzer.analyzeActivity(MINT, 20)
    const recordCount = Array.isArray(records) ? records.length : 0
    const volumes = (Array.isArray(records) ? records : [])
      .map(r => Number(r?.amount))
      .filter(n => Number.isFinite(n))

    // 2) Analyze depth
    const depthMetrics = await depthAnalyzer.analyze(30)

    // 3) Detect patterns
    const patterns = safeDetectVolumePatterns(volumes, 5, 100)

    // 4) Execute a custom task
    engine.register("report", async (params) => ({
      records: Array.isArray(params.records) ? params.records.length : 0,
      totalVolume: volumes.reduce((a, b) => a + b, 0),
    }))
    engine.enqueue("task1", "report", { records })
    const taskResults = await engine.runAll()

    // 5) Sign the results
    const payload = JSON.stringify({ depthMetrics, patterns, taskResults }, null, 2)
    const signature = await signer.sign(payload)
    const signatureValid = await signer.verify(payload, signature)

    const summary = {
      recordCount,
      totalVolume: volumes.reduce((a, b) => a + b, 0),
      spread: depthMetrics.spread,
      midPrice: (depthMetrics as any).midPrice ?? undefined,
    }

    console.log({
      summary,
      depthMetrics,
      patternsCount: Array.isArray(patterns) ? patterns.length : 0,
      taskResults,
      signatureValid,
      signatureSize: typeof signature === "string" ? signature.length : undefined,
      elapsedMs: Date.now() - t0,
    })
  } catch (err: any) {
    console.error("Pipeline failed:", err?.message ?? err)
    process.exitCode = 1
  }

  function safeDetectVolumePatterns(v: number[], window: number, threshold: number) {
    try {
      return detectVolumePatterns(v, window, threshold)
    } catch {
      return []
    }
  }
})()
