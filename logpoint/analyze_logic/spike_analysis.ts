export interface VolumePoint {
  timestamp: number
  volumeUsd: number
}

export interface SpikeEvent {
  timestamp: number
  volume: number
  spikeRatio: number
  averageWindow: number
  threshold: number
}

/**
 * Detects spikes in trading volume compared to a rolling average window.
 * Includes context: window size, threshold, and rounded ratio
 */
export function detectVolumeSpikes(
  points: VolumePoint[],
  windowSize: number = 10,
  spikeThreshold: number = 2.0
): SpikeEvent[] {
  const events: SpikeEvent[] = []
  if (points.length <= windowSize) return events

  const volumes = points.map(p => p.volumeUsd)
  for (let i = windowSize; i < volumes.length; i++) {
    const window = volumes.slice(i - windowSize, i)
    const avg = window.reduce((sum, v) => sum + v, 0) / (window.length || 1)
    const curr = volumes[i]
    const ratio = avg > 0 ? curr / avg : Infinity

    if (ratio >= spikeThreshold) {
      events.push({
        timestamp: points[i].timestamp,
        volume: curr,
        spikeRatio: Math.round(ratio * 100) / 100,
        averageWindow: windowSize,
        threshold: spikeThreshold,
      })
    }
  }
  return events
}

/**
 * Finds the largest spike event within the detected list
 */
export function getMaxSpike(events: SpikeEvent[]): SpikeEvent | undefined {
  if (events.length === 0) return undefined
  return events.reduce((max, ev) => (ev.spikeRatio > max.spikeRatio ? ev : max), events[0])
}

/**
 * Groups spikes by day (UTC)
 */
export function groupSpikesByDay(events: SpikeEvent[]): Record<string, SpikeEvent[]> {
  return events.reduce<Record<string, SpikeEvent[]>>((acc, ev) => {
    const day = new Date(ev.timestamp).toISOString().split("T")[0]
    acc[day] = acc[day] || []
    acc[day].push(ev)
    return acc
  }, {})
}
