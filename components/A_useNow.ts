import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

/**
 * performance.now() as a ref, updated every animation frame while `on` is
 * true (fork A helper for slides 1–6). Frozen otherwise.
 */
export function useNow(on: Ref<boolean>) {
  const now = ref(performance.now())
  let raf = 0
  const loop = () => { now.value = performance.now(); raf = requestAnimationFrame(loop) }
  watch(on, (v) => {
    cancelAnimationFrame(raf)
    if (v) raf = requestAnimationFrame(loop)
  }, { immediate: true })
  onBeforeUnmount(() => cancelAnimationFrame(raf))
  return now
}

const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, '0')

/** 19H 32M 05S / 12M 05S / 12S / 0.4S */
export function fmtAge(ms: number) {
  if (ms < 10_000) return `${(ms / 1000).toFixed(1)}S`
  if (ms < 60_000) return `${Math.floor(ms / 1000)}S`
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}M ${pad(ms / 1000 % 60)}S`
  return `${Math.floor(ms / 3_600_000)}H ${pad(ms / 60_000 % 60)}M ${pad(ms / 1000 % 60)}S`
}

/** HH:MM:SS from ms-of-day (wraps; negative = yesterday) */
export function fmtWall(msOfDay: number, tenths = false) {
  const t = ((msOfDay % 86_400_000) + 86_400_000) % 86_400_000
  const base = `${pad(t / 3_600_000)}:${pad(t / 60_000 % 60)}:${pad(t / 1000 % 60)}`
  return tenths ? `${base}.${Math.floor(t / 100 % 10)}` : base
}

/** +MM:SS */
export function fmtTimer(ms: number) {
  return `+${pad(ms / 60_000)}:${pad(ms / 1000 % 60)}`
}

export const hms = (h: number, m = 0, s = 0) => ((h * 60 + m) * 60 + s) * 1000
