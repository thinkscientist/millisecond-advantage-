<script setup lang="ts">
/**
 * Ambient pulses: while the slide is live and at/after beat `from`, send a
 * pulse down each path in turn (fixed order, fixed interval). Emits `land`
 * with the path index when a pulse arrives.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import WirePulse from './WirePulse.vue'
import { useBeats } from './useBeats'

const props = withDefaults(defineProps<{
  paths: string[]
  from?: number
  /** ms between pulses */
  every?: number
  speed?: number
  /** fire all paths at once instead of round-robin */
  together?: boolean
}>(), { from: 0, every: 900, speed: 1100, together: false })
const emit = defineEmits<{ land: [index: number] }>()

const { live, at } = useBeats()
const pulses = ref<(InstanceType<typeof WirePulse> | null)[]>([])
const on = computed(() => live.value && at(props.from))
let timer: ReturnType<typeof setInterval> | undefined
let i = 0

function fireOne(k: number) {
  pulses.value[k]?.fire({ speed: props.speed }).then(ok => ok && emit('land', k))
}
function tick() {
  if (props.together) props.paths.forEach((_, k) => fireOne(k))
  else fireOne(i++ % props.paths.length)
}
function stop() {
  if (timer) clearInterval(timer)
  timer = undefined
}
watch(on, (v) => {
  stop()
  if (v) {
    i = 0
    setTimeout(() => on.value && tick(), 250)
    timer = setInterval(tick, props.every)
  }
}, { immediate: true })
onBeforeUnmount(stop)
</script>

<template>
  <g>
    <WirePulse
      v-for="(d, k) in paths" :key="k"
      :ref="(el: any) => (pulses[k] = el)"
      :d="d" :speed="speed"
    />
  </g>
</template>
