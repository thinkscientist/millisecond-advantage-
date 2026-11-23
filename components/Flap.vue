<script setup lang="ts">
/**
 * Split-flap value: each character that changes flips down, swaps, and
 * flips back up with a small overshoot. Changed characters land warm
 * (--hit) and cool to the text color.
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import { useBeats } from './useBeats'

const props = withDefaults(defineProps<{
  value: string
  size?: number
  /** ms for one full flip */
  ms?: number
  tone?: 'text' | 'hit'
}>(), { size: 96, ms: 420, tone: 'text' })

const { isStatic, live } = useBeats()
const shown = ref<string[]>(props.value.split(''))
const cells = ref<HTMLElement[]>([])
const running = new Set<Animation>()
onBeforeUnmount(() => running.forEach(a => a.cancel()))

watch(() => props.value, (next) => {
  const prev = shown.value
  const b = next.split('')
  // right-align old against new so digits keep their places
  const off = prev.length - b.length
  const out = b.map((c, i) => prev[i + off] ?? ' ')
  shown.value = out
  if (isStatic.value || !live.value) { shown.value = b; return }
  b.forEach((c, i) => {
    if (out[i] === c) return
    const el = cells.value[i]
    if (!el) { shown.value[i] = c; return }
    const stagger = (b.length - 1 - i) * 18 // right-most digits flip first
    const down = el.animate(
      [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }],
      { duration: props.ms * 0.45, delay: stagger, easing: 'ease-in', fill: 'forwards' },
    )
    running.add(down)
    down.finished.then(() => {
      running.delete(down)
      shown.value[i] = c
      el.classList.remove('cool'); void el.offsetWidth; el.classList.add('cool')
      const up = el.animate(
        [{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)', offset: 0.78 }, { transform: 'rotateX(9deg)', offset: 0.9 }, { transform: 'rotateX(0deg)' }],
        { duration: props.ms * 0.55, easing: 'ease-out' },
      )
      running.add(up)
      up.finished.finally(() => running.delete(up))
      down.cancel()
    }, () => { shown.value[i] = c })
  })
})
</script>

<template>
  <span class="flap mono" :class="tone" :style="{ fontSize: `${size}px` }">
    <span
      v-for="(c, i) in shown" :key="i"
      :ref="(el: any) => (cells[i] = el)"
      class="flap-cell"
    >{{ c }}</span>
  </span>
</template>

<style scoped>
.flap {
  display: inline-flex;
  perspective: 600px;
  line-height: 1;
  letter-spacing: 0;
  font-variant-numeric: tabular-nums;
  white-space: pre;
}
.flap.hit { color: var(--hit); }
.flap-cell {
  display: inline-block;
  transform-origin: 50% 55%;
  backface-visibility: hidden;
}
</style>
