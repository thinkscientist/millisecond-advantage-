<script setup lang="ts">
/**
 * Govern slide helper: when `text` changes, scramble from the old string to
 * the new one, locking left to right. Static: just the text.
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import { useBeats } from './useBeats'

const props = withDefaults(defineProps<{ text: string, ms?: number }>(), { ms: 520 })
const { live } = useBeats()
const shown = ref(props.text)
let raf = 0
const POOL = '0123456789abcdef'

watch(() => props.text, (next) => {
  cancelAnimationFrame(raf)
  if (!live.value) { shown.value = next; return }
  const t0 = performance.now()
  const n = next.length
  const frame = (now: number) => {
    const p = (now - t0) / props.ms
    if (p >= 1) { shown.value = next; return }
    const locked = Math.floor(p * n)
    let s = next.slice(0, locked)
    for (let i = locked; i < n; i++) s += next[i] === ' ' ? ' ' : POOL[(Math.floor(now / 40) * 7 + i * 13) % POOL.length]
    shown.value = s
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template><span class="gs">{{ shown }}</span></template>

<style scoped>.gs { white-space: pre; }</style>
