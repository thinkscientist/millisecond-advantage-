<script setup lang="ts">
/**
 * Text that decodes in when its slide comes on screen: each character
 * scrambles through glyphs of a similar width, then locks, left to right
 * and line by line, with a little seeded jitter.
 *
 * Static (print / reduced motion / thumbnails): plain text, no motion.
 */
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { seeded } from './TickFeed'
import { useBeats } from './useBeats'

const props = withDefaults(defineProps<{
  text: string
  /** ms before the first line starts */
  delay?: number
  tag?: string
}>(), { delay: 0, tag: 'span' })

const { live, entered, isStatic } = useBeats()
const root = ref<HTMLElement>()
let raf = 0

// Width classes: scramble only through glyphs of a similar width so the
// line doesn't jump while it decodes.
const CLASSES = ['ijl', 'frt', 'mw', 'abcdeghknopqsuvxyz', 'IJ1', '023456789', 'MW', 'BEFKLPRSTXYZ', 'ACDGHNOQUV']
const classOf = (c: string) => CLASSES.find(k => k.includes(c)) ?? ''

const LINE = 130 // ms between lines
const LEAD = 170 // how long a character scrambles before it locks
const FRAME = 42 // ms per scramble frame
const JITTER = 55
const span = (n: number) => Math.min(500, Math.max(160, n * 28))

function hash(s: string) {
  let h = 0
  for (const c of s) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0
  return h
}

function stop() {
  cancelAnimationFrame(raf)
  root.value?.querySelectorAll<HTMLElement>('.dc').forEach((el) => {
    el.dataset.s = ''
    el.classList.remove('dc-wait', 'dc-scr')
  })
}

async function run() {
  stop()
  await nextTick()
  const el = root.value
  if (!el) return
  const cells = [...el.querySelectorAll<HTMLElement>('.dc')]
  if (!cells.length) return
  // group into lines by vertical position
  const lines: HTMLElement[][] = []
  let lastTop = Number.NaN
  for (const c of cells) {
    const t = c.offsetTop
    if (!(Math.abs(t - lastTop) < 4)) { lines.push([]); lastTop = t }
    lines[lines.length - 1].push(c)
  }
  const seed = hash(props.text)
  const rnd = seeded(seed)
  const lockAt = new Map<HTMLElement, number>()
  lines.forEach((line, li) => line.forEach((c, i) => {
    lockAt.set(c, props.delay + li * LINE + LEAD + (i / Math.max(1, line.length - 1)) * span(line.length) + (rnd() - 0.5) * 2 * JITTER)
  }))
  cells.forEach(c => c.classList.add('dc-wait'))
  const t0 = performance.now()
  const frame = (now: number) => {
    const t = now - t0
    let pending = false
    cells.forEach((c, n) => {
      const at = lockAt.get(c)!
      if (t >= at) {
        if (c.classList.contains('dc-wait') || c.classList.contains('dc-scr')) {
          c.classList.remove('dc-wait', 'dc-scr')
          c.dataset.s = ''
        }
        return
      }
      pending = true
      const k = classOf(c.dataset.c ?? '')
      if (k && t >= at - LEAD) {
        const r = seeded(seed + n * 7919 + Math.floor(t / FRAME) * 104729)()
        c.dataset.s = k[Math.floor(r * k.length)]
        c.classList.remove('dc-wait')
        c.classList.add('dc-scr')
      }
    })
    if (pending) raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
}

watch([entered, () => props.text], () => {
  if (live.value) run()
}, { flush: 'post' })
watch(live, (v) => { if (v) run(); else stop() }, { immediate: true, flush: 'post' })
onBeforeUnmount(stop)
</script>

<template>
  <component :is="tag" ref="root" class="decode" :aria-label="text">
    <template v-if="isStatic">{{ text }}</template>
    <template v-else>
      <template v-for="(c, i) in text.split('')" :key="i">
        <template v-if="c === ' '">{{ ' ' }}</template>
        <span v-else class="dc" :data-c="c">{{ c }}</span>
      </template>
    </template>
  </component>
</template>

<style>
.decode .dc {
  position: relative;
}
/* hidden until its line starts */
.decode .dc.dc-wait {
  color: transparent;
}
/* scrambling: hide the real glyph, draw the stand-in centered over it */
.decode .dc.dc-scr {
  color: transparent;
}
.decode .dc.dc-scr::after {
  content: attr(data-s);
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  color: var(--text);
}
</style>
