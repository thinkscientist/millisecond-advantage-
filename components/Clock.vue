<script setup lang="ts">
/**
 * Ticking time readouts. `mode`:
 *  - 'wall'   a wall clock starting at `start` (HH:MM:SS.s), advancing in real time
 *  - 'age'    time since `since` (ms timestamp from performance.now()), e.g. 0.6S, 12S, 2M 04S
 *  - 'timer'  +MM:SS.mmm since `since`
 * Frozen at `frozen` (ms) when static.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useBeats } from './useBeats'

const props = withDefaults(defineProps<{
  mode?: 'wall' | 'age' | 'timer'
  start?: string
  since?: number
  frozen?: number
  running?: boolean
}>(), { mode: 'age', start: '14:02:07.4', since: 0, frozen: 0, running: true })

const { live } = useBeats()
const now = ref(performance.now())
let raf = 0
const loop = () => { now.value = performance.now(); raf = requestAnimationFrame(loop) }
watch(() => live.value && props.running, (v) => {
  cancelAnimationFrame(raf)
  if (v) raf = requestAnimationFrame(loop)
}, { immediate: true })
onBeforeUnmount(() => cancelAnimationFrame(raf))

const startMs = (() => {
  const [h, m, s] = props.start.split(':')
  return ((+h * 60 + +m) * 60 + +s) * 1000
})()
const t0 = performance.now()

const elapsed = computed(() => {
  if (!live.value) return props.frozen
  return props.mode === 'wall' ? now.value - t0 : Math.max(0, now.value - props.since)
})

const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, '0')
const text = computed(() => {
  const e = elapsed.value
  if (props.mode === 'wall') {
    const t = startMs + e
    return `${pad(t / 3_600_000 % 24)}:${pad(t / 60_000 % 60)}:${pad(t / 1000 % 60)}.${Math.floor(t / 100 % 10)}`
  }
  if (props.mode === 'timer')
    return `+${pad(e / 60_000)}:${pad(e / 1000 % 60)}.${pad(e % 1000, 3)}`
  if (e < 10_000) return `${(e / 1000).toFixed(1)}S`
  if (e < 60_000) return `${Math.floor(e / 1000)}S`
  return `${Math.floor(e / 60_000)}M ${pad(e / 1000 % 60)}S`
})
</script>

<template>
  <span class="clock mono">{{ text }}</span>
</template>

<style scoped>
.clock { font-variant-numeric: tabular-nums; white-space: nowrap; }
</style>
