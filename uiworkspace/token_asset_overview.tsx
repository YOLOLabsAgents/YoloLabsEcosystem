import React, { useEffect, useMemo, useRef, useState } from "react"

interface AssetOverviewPanelProps {
  assetId: string
  refreshMs?: number
}

interface AssetOverview {
  name: string
  priceUsd: number
  supply: number
  holders: number
}

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success" }

const numberFmt = (n: number, opts?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(undefined, opts).format(n)

export const AssetOverviewPanel: React.FC<AssetOverviewPanelProps> = ({ assetId, refreshMs }) => {
  const [info, setInfo] = useState<AssetOverview | null>(null)
  const [state, setState] = useState<FetchState>({ status: "idle" })
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const timerRef = useRef<number | null>(null)

  const endpoint = useMemo(() => `/api/assets/${encodeURIComponent(assetId)}`, [assetId])

  useEffect(() => {
    let abort = new AbortController()

    async function load() {
      setState({ status: "loading" })
      try {
        const res = await fetch(endpoint, { signal: abort.signal })
        if (!res.ok) {
          const text = await res.text().catch(() => "")
          throw new Error(`HTTP ${res.status} ${text}`.trim())
        }
        const json: AssetOverview = await res.json()
        setInfo(json)
        setUpdatedAt(Date.now())
        setState({ status: "success" })
      } catch (e: any) {
        if (e?.name === "AbortError") return
        setState({ status: "error", error: e?.message ?? "Failed to load" })
      }
    }

    load()

    if (refreshMs && refreshMs > 0) {
      timerRef.current = window.setInterval(() => {
        // refresh with a fresh controller
        abort.abort()
        abort = new AbortController()
        load()
      }, refreshMs)
    }

    return () => {
      abort.abort()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [endpoint, refreshMs])

  const onManualRefresh = async () => {
    // trigger a one off refresh without waiting for interval
    setUpdatedAt(null)
    setState({ status: "loading" })
    try {
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: AssetOverview = await res.json()
      setInfo(json)
      setUpdatedAt(Date.now())
      setState({ status: "success" })
    } catch (e: any) {
      setState({ status: "error", error: e?.message ?? "Failed to load" })
    }
  }

  const header = (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-xl font-semibold">Asset Overview</h2>
      <div className="flex items-center gap-2">
        {updatedAt ? (
          <span className="text-xs text-gray-500">
            updated {new Date(updatedAt).toLocaleTimeString()}
          </span>
        ) : null}
        <button
          onClick={onManualRefresh}
          className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
        >
          refresh
        </button>
      </div>
    </div>
  )

  if (state.status === "loading" && !info) {
    return (
      <div className="p-4 bg-white rounded shadow">
        {header}
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
          <div className="h-4 bg-gray-200 rounded w-3/6" />
        </div>
      </div>
    )
  }

  if (state.status === "error" && !info) {
    return (
      <div className="p-4 bg-white rounded shadow">
        {header}
        <div className="text-red-600 text-sm">Error loading asset overview: {state.error}</div>
      </div>
    )
  }

  if (!info) {
    return (
      <div className="p-4 bg-white rounded shadow">
        {header}
        <div className="text-sm text-gray-600">No data</div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      {header}
      <p>
        <strong>ID:</strong> {assetId}
      </p>
      <p>
        <strong>Name:</strong> {info.name}
      </p>
      <p>
        <strong>Price (USD):</strong> ${numberFmt(info.priceUsd, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <p>
        <strong>Circulating Supply:</strong> {numberFmt(info.supply)}
      </p>
      <p>
        <strong>Holders:</strong> {numberFmt(info.holders)}
      </p>
      {state.status === "error" ? (
        <p className="mt-2 text-xs text-red-600">latest refresh error: {state.error}</p>
      ) : null}
    </div>
  )
}

export default AssetOverviewPanel
