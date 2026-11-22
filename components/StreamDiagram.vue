<script setup lang="ts">
/**
 * Slide 8 — Stream: an ordered, durable log. New records append at the head;
 * a live reader follows the head, a replay reader starts from an earlier
 * moment and catches up.
 */
import { computed, ref, watch } from 'vue'
import WirePulse from './WirePulse.vue'
import { wirePath, type Pt } from './flow'
import { useTickFeed } from './TickFeed'
import { useBeats } from './useBeats'

const { b, at, live, clicks } = useBeats()

const N = 13
const X0 = 250
const CW = 94
const GAP = 12
const Y = 250
const H = 110
const cellX = (i: number) => X0 + i * (CW + GAP)

const KEYS = ['XYZ', 'ABC', 'XYZ', 'FX', 'DEF', 'XYZ', 'ABC', 'XYZ', 'FX', 'ABC', 'DEF', 'XYZ']
const START_BASE = 4180
const START_HEAD = 9 // filled cells

const base = ref(START_BASE) // offset of cell 0
const head = ref(START_HEAD) // number of filled cells
const replay = ref(START_BASE + 2) // absolute offset of the replay reader
const fresh = ref(-1) // cell index just written

const headOffset = computed(() => base.value + head.value - 1)
const timeOf = (off: number) => {
  const s = 7 + (off - START_BASE) * 0.137
  return `14:02:${String(Math.floor(s)).padStart(2, '0')}.${String(Math.round((s % 1) * 1000)).padStart(3, '0')}`
}

function reset() {
  base.value = START_BASE
  head.value = START_HEAD
  replay.value = START_BASE + 2
  fresh.value = -1
}

const writeX = computed(() => cellX(Math.min(head.value, N - 1)) + CW / 2)
const writePts = computed<Pt[]>(() => [[180, Y + H / 2], [220, Y + H / 2], [220, 190], [writeX.value, 190], [writeX.value, Y - 4]])
const pWrite = ref<InstanceType<typeof WirePulse>>()

const feedOn = computed(() => live.value && clicks.value >= 2)
watch(feedOn, v => v && reset())
useTickFeed(Array.from({ length: 6 }, () => ({ gap: 1500 })), feedOn, async () => {
  if (!(await pWrite.value?.fire({ speed: 1500 }))) return
  if (head.value < N) head.value++
  else base.value++
  fresh.value = head.value - 1
  if (at(4)) replay.value = Math.min(replay.value + 2, headOffset.value - 3)
})

const replayIdx = computed(() => Math.max(0, replay.value - base.value))
const liveIdx = computed(() => head.value - 1)
</script>

<template>
  <div class="stream">
    <svg width="1680" height="660" viewBox="0 0 1680 660" overflow="visible">
      <!-- writer -->
      <g :class="b(1, 'lift')">
        <rect x="0" :y="Y" width="180" :height="H" rx="6" class="node-box strong" />
        <text class="node-label" x="90" :y="Y + H / 2 + 10" text-anchor="middle">Connect</text>
      </g>
      <path :d="wirePath(writePts)" class="wire" :class="b(2, 'fade')" />
      <WirePulse ref="pWrite" :d="wirePath(writePts)" />

      <!-- the log -->
      <g :class="b(1, 'draw-x')">
        <text style="font-size: 20px; letter-spacing: 2px" class="svg-body" :x="X0" y="150">TOPIC · fills-and-prices · partition 0</text>
        <g v-for="i in N" :key="i">
          <rect
            :x="cellX(i - 1)" :y="Y" :width="CW" :height="H" rx="6"
            class="node-box"
            :class="{ ghost: i - 1 >= head, accent: i - 1 === fresh && at(2) }"
          />
          <template v-if="i - 1 < head">
            <text style="font-size: 22px" class="svg-mono" :x="cellX(i - 1) + CW / 2" :y="Y + 46" text-anchor="middle">{{ KEYS[(base + i - 1) % KEYS.length] }}</text>
            <text style="font-size: 17px" class="svg-body" :x="cellX(i - 1) + CW / 2" :y="Y + 82" text-anchor="middle">{{ base + i - 1 }}</text>
          </template>
        </g>
        <text style="font-size: 20px" class="svg-body" :x="X0" :y="Y + H + 44">oldest</text>
        <text style="font-size: 20px" class="svg-body" :x="cellX(N - 1) + CW" :y="Y + H + 44" text-anchor="end">head →</text>
      </g>

      <!-- live reader -->
      <g class="reader" :style="{ transform: `translateX(${cellX(liveIdx) + CW / 2}px)` }"><g :class="b(3, 'lift')">
        <path d="M0 -14 L-12 6 L12 6 Z" :transform="`translate(0 ${Y + H + 90})`" class="arrow hot" />
        <text style="font-size: 24px" class="svg-mono" x="0" :y="Y + H + 140" text-anchor="middle">Risk agent</text>
        <text style="font-size: 20px" class="svg-body" x="0" :y="Y + H + 172" text-anchor="middle">reads the head</text>
      </g></g>

      <!-- replay reader -->
      <g class="reader" :style="{ transform: `translateX(${cellX(replayIdx) + CW / 2}px)` }"><g :class="b(4, 'lift')">
        <path d="M0 -14 L-12 6 L12 6 Z" :transform="`translate(0 ${Y + H + 90})`" class="arrow" />
        <text style="font-size: 24px" class="svg-mono" x="0" :y="Y + H + 140" text-anchor="middle">Audit replay</text>
        <text style="font-size: 20px" class="svg-body" x="0" :y="Y + H + 172" text-anchor="middle">from {{ timeOf(replay) }}</text>
      </g></g>
    </svg>
  </div>
</template>

<style scoped>
.stream { position: relative; width: 1680px; height: 660px; }
.stream svg { position: absolute; inset: 0; overflow: visible; }
.reader { transition: transform 500ms var(--ease); }
</style>
