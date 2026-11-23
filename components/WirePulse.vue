<script setup lang="ts">
/**
 * One animated pulse layer along an SVG path. Call `fire()` to send a pulse;
 * it resolves `true` when the pulse lands and `false` if it was cancelled or
 * motion is off. Several pulses can be in flight on the same wire.
 *
 * A pulse is three stacked strokes (glow, core, head) animated with the Web
 * Animations API on stroke-dashoffset, linear.
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import { useBeats } from './useBeats'

const props = withDefaults(defineProps<{
  d: string
  /** px per second */
  speed?: number
  /** length of the lit segment */
  seg?: number
  color?: string
}>(), { speed: 1100, seg: 90, color: 'var(--hit)' })

const host = ref<SVGGElement>()
const { live, epoch } = useBeats()
const running = new Set<Animation>()
const NS = 'http://www.w3.org/2000/svg'

function cancelAll() {
  for (const a of running) a.cancel()
  running.clear()
}
watch(epoch, cancelAll)
watch(live, (v) => { if (!v) cancelAll() })
onBeforeUnmount(cancelAll)

function layer(width: number, opacity: number, dash: number, gap: number, filter?: string) {
  const p = document.createElementNS(NS, 'path')
  p.setAttribute('d', props.d)
  p.setAttribute('fill', 'none')
  p.setAttribute('stroke-linecap', 'round')
  p.style.stroke = props.color
  p.style.strokeWidth = String(width)
  p.style.opacity = String(opacity)
  p.style.strokeDasharray = `${dash} ${gap}`
  if (filter) p.style.filter = filter
  host.value!.appendChild(p)
  return p
}

function fire(opts: { speed?: number } = {}): Promise<boolean> {
  if (!live.value || !host.value) return Promise.resolve(false)

  const probe = document.createElementNS(NS, 'path')
  probe.setAttribute('d', props.d)
  host.value.appendChild(probe)
  const len = probe.getTotalLength()
  probe.remove()

  const seg = Math.min(props.seg, len * 0.6)
  const head = 6
  const gap = len + seg + head + 10
  const duration = Math.max(380, (len / (opts.speed ?? props.speed)) * 1000)

  const glow = layer(12, 0.22, seg, gap, 'blur(3px)')
  const core = layer(3, 0.95, seg, gap)
  const tip = layer(6, 1, head, gap)
  tip.style.stroke = 'var(--pulse-tip)'

  // Segment covers [-offset, -offset + seg]; slide it from before the start
  // to past the end. The head rides on the segment's front edge.
  const timing: KeyframeAnimationOptions = { duration, easing: 'linear', fill: 'forwards' }
  // opacity fades in over the first 6% and out after 88% (reference: ss-head)
  const fade = (from: number, to: number, o: number) => [
    { strokeDashoffset: from, opacity: 0 },
    { opacity: o, offset: 0.06 },
    { opacity: o, offset: 0.88 },
    { strokeDashoffset: to, opacity: 0 },
  ]
  const anims = [
    glow.animate(fade(seg, -len, 0.22), timing),
    core.animate(fade(seg, -len, 0.95), timing),
    tip.animate(fade(head, -len - seg + head, 1), timing),
  ]
  anims.forEach(a => running.add(a))

  const cleanup = () => {
    anims.forEach(a => running.delete(a))
    glow.remove(); core.remove(); tip.remove()
  }

  // Resolve on "landed": the moment the head reaches the end of the path.
  const landAt = duration * (len / (len + seg))
  return new Promise<boolean>((resolve) => {
    let done = false
    const t = setTimeout(() => {
      if (!done) { done = true; resolve(true) }
    }, landAt)
    anims[1].finished.then(cleanup, () => {
      cleanup()
      clearTimeout(t)
      if (!done) { done = true; resolve(false) }
    })
  })
}

defineExpose({ fire, cancelAll })
</script>

<template>
  <g ref="host" class="wire-pulse" pointer-events="none" />
</template>
