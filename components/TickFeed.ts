import { onBeforeUnmount, watch, type Ref } from 'vue'

/** One scripted record. `cents` moves a price, `qty` changes a position. */
export interface Tick {
  gap: number
  sym: string
  cents?: number
  qty?: number
}

/**
 * Fixed, repeating record stream. Deterministic: the same sequence every
 * time, always restarting from the first record when `running` turns on
 * (slide enter, or stepping back onto the beat that starts it).
 */
export function useTickFeed<T extends { gap: number }>(
  script: readonly T[],
  running: Ref<boolean>,
  onTick: (tick: T, index: number) => void,
) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let i = 0

  function stop() {
    if (timer) clearTimeout(timer)
    timer = undefined
  }
  function schedule() {
    const tick = script[i % script.length]
    timer = setTimeout(() => {
      onTick(tick, i)
      i++
      schedule()
    }, tick.gap)
  }
  function start() {
    stop()
    i = 0
    // First record arrives quickly so the beat has something to show.
    const first = script[0]
    timer = setTimeout(() => {
      onTick(first, 0)
      i = 1
      schedule()
    }, Math.min(first.gap, 500))
  }

  watch(running, v => (v ? start() : stop()), { immediate: true })
  onBeforeUnmount(stop)

  return { start, stop }
}

/** Small seeded PRNG (mulberry32) for any generated-but-deterministic data. */
export function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Prices and positions for the exposure story, shared across slides. */
export const START_PRICES = { XYZ: 41.12, ABC: 18.4 } as const
export const START_POSITIONS = { XYZ: 250_000, ABC: 120_000 } as const

export const EXPOSURE_TICKS: readonly Tick[] = [
  { gap: 2000, sym: 'XYZ', cents: +2 },
  { gap: 2300, sym: 'ABC', qty: +10_000 },
  { gap: 1700, sym: 'XYZ', cents: -1 },
  { gap: 2600, sym: 'XYZ', qty: -3_000 },
  { gap: 1900, sym: 'ABC', cents: +3 },
  { gap: 2200, sym: 'XYZ', cents: +1 },
  { gap: 2400, sym: 'ABC', qty: -10_000 },
  { gap: 1800, sym: 'ABC', cents: -3 },
  { gap: 2100, sym: 'XYZ', cents: -2 },
  { gap: 2500, sym: 'XYZ', qty: +3_000 },
]

export function exposureOf(prices: Record<string, number>, positions: Record<string, number>) {
  let sum = 0
  for (const s of Object.keys(positions)) sum += positions[s] * (prices[s] ?? 0)
  return Math.round(sum * 100) / 100
}

export function applyTick(t: Tick, prices: Record<string, number>, positions: Record<string, number>) {
  if (t.cents) prices[t.sym] = Math.round((prices[t.sym] * 100 + t.cents)) / 100
  if (t.qty) positions[t.sym] = (positions[t.sym] ?? 0) + t.qty
}

export const usd = (n: number, digits = 0) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
