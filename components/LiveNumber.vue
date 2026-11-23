<script setup lang="ts">
/**
 * A value that updates in place. Characters that changed since the last
 * value flash in --accent (aligned from the right, so digits keep their
 * place as the number grows or shrinks).
 */
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  value: string
  size?: number
  /** disable the flash (print / reduced motion) */
  still?: boolean
}>(), { size: 72, still: false })

interface Ch { c: string, k: number, hot: boolean }
let seq = 0
const chars = ref<Ch[]>(props.value.split('').map(c => ({ c, k: seq++, hot: false })))

watch(() => props.value, (next, prev) => {
  const a = prev.split('')
  const b = next.split('')
  const off = a.length - b.length
  chars.value = b.map((c, i) => {
    const old = a[i + off]
    const changed = !props.still && old !== c
    return { c, k: changed ? seq++ : (chars.value[i + off]?.k ?? seq++), hot: changed }
  })
})
</script>

<template>
  <span class="live-number display" :style="{ fontSize: `${size}px` }">
    <span v-for="ch in chars" :key="ch.k" :class="{ flash: ch.hot }">{{ ch.c }}</span>
  </span>
</template>

<style scoped>
.live-number {
  font-variant-numeric: tabular-nums;
  white-space: pre;
  line-height: 1;
}
</style>
