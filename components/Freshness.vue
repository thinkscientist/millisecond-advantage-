<script setup lang="ts">
/**
 * Slide 3 — six inputs behind one number, each with its own age. Ages tick
 * in real time (the feeds keep refreshing, the files don't); bars on a log
 * scale grow in on entry; the answer's age is set by the stalest input and
 * flips on a split-flap readout.
 * Static: frozen at the moment the slide opens.
 */
import { computed } from 'vue'
import Flap from './Flap.vue'
import { fmtAge, fmtWall, hms, useNow } from './A_useNow'
import { useBeats } from './useBeats'

const { live, isStatic } = useBeats()
const now = useNow(live)
const t0 = performance.now()
const START = hms(14, 2, 7) + 400

// every = how often the source refreshes (ms of wall time); null = never today
const INPUTS = [
  { name: 'Price feed', kind: 'stream', asOf: START - 120, every: 400 },
  { name: 'Order system', kind: 'poll · 15 s', asOf: START - 9_000, every: 15_000 },
  { name: 'Risk dashboard', kind: 'hourly', asOf: hms(13, 0, 0), every: null },
  { name: 'Desk spreadsheet', kind: 'by hand', asOf: hms(11, 41, 30), every: null },
  { name: 'Treasury FX file', kind: 'daily drop', asOf: hms(6, 0, 0), every: null },
  { name: 'Positions file', kind: 'overnight batch', asOf: hms(18, 30, 0) - 86_400_000, every: null },
]

const wall = computed(() => START + (isStatic.value || !live.value ? 0 : now.value - t0))

function lastUpdate(inp: typeof INPUTS[number]) {
  if (!inp.every) return inp.asOf
  const since = wall.value - inp.asOf
  return inp.asOf + Math.floor(since / inp.every) * inp.every
}
const rows = computed(() => INPUTS.map((inp) => {
  const at = lastUpdate(inp)
  const age = Math.max(1, wall.value - at)
  return { ...inp, at, age }
}))
const stalest = computed(() => rows.value.reduce((a, r) => (r.age > a.age ? r : a)))

const DAY = 86_400_000
const W = 760
const barW = (ms: number) => Math.max(4, (Math.log10(Math.max(1, ms)) / Math.log10(DAY)) * W)
const TICKS = [{ ms: 1, t: '1 MS' }, { ms: 1000, t: '1 S' }, { ms: 60_000, t: '1 MIN' }, { ms: 3_600_000, t: '1 HR' }, { ms: DAY, t: '1 DAY' }]
const whenLabel = (ms: number) => (ms < 0 ? `yesterday ${fmtWall(ms)}` : `today ${fmtWall(ms)}`)
</script>

<template>
  <div class="fresh" :class="{ moving: !isStatic }">
    <div class="head label">
      <span>input</span><span>last updated</span><span>age</span><span />
    </div>
    <div
      v-for="(r, i) in rows" :key="r.name" class="row"
      :class="{ stale: r.name === stalest.name }"
      :style="{ '--d': `${200 + i * 90}ms` }"
    >
      <span class="name">{{ r.name }}<span class="kind label">{{ r.kind }}</span></span>
      <span class="when mono">{{ whenLabel(r.at) }}</span>
      <span class="track"><span class="bar" :style="{ width: `${barW(r.age)}px` }" /></span>
      <span class="age mono">{{ fmtAge(r.age) }}</span>
    </div>
    <div class="ticks">
      <span v-for="t in TICKS" :key="t.t" class="label" :style="{ left: `${barW(t.ms)}px` }">{{ t.t }}</span>
    </div>

    <div class="answer">
      <div class="label">the exposure you were handed is as old as</div>
      <div class="answer-row">
        <Flap :value="fmtAge(stalest.age)" :size="84" tone="hit" />
        <div class="answer-why">
          <div>set by the stalest input:</div>
          <div class="accent">{{ stalest.name.toLowerCase() }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fresh { position: relative; width: 1680px; height: 660px; }
.head, .row { display: grid; grid-template-columns: 430px 300px 790px 160px; align-items: center; }
.head { height: 40px; font-size: 15px; }
.row { height: 54px; border-top: 1px solid var(--rule); }
.name { font-size: 26px; font-weight: 600; display: flex; align-items: baseline; gap: 14px; white-space: nowrap; }
.kind { font-size: 14px; }
.when { font-size: 18px; color: var(--muted); white-space: nowrap; }
.track { position: relative; height: 20px; }
.bar { position: absolute; left: 0; top: 0; height: 20px; border-radius: 2px; background: rgba(var(--muted-rgb), .45); transform-origin: left; transition: width 300ms var(--ease); }
.age { font-size: 20px; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.row.stale .bar { background: var(--accent); }
.row.stale .age, .row.stale .name { color: var(--accent); }
.moving .row { animation: ss-enter 500ms var(--ease-out) var(--d) both; }
.moving .bar { animation: grow 900ms var(--ease) calc(var(--d) + 120ms) both; }
@keyframes grow { from { transform: scaleX(0); } }
.ticks { position: relative; height: 30px; margin-left: 730px; margin-top: 6px; border-top: 1px solid var(--rule); }
.ticks span { position: absolute; top: 8px; font-size: 14px; transform: translateX(-50%); white-space: nowrap; }
.ticks span:first-child { transform: none; }
.answer { position: absolute; left: 0; top: 450px; width: 1680px; }
.moving .answer { animation: ss-enter 600ms var(--ease-out) 900ms both; }
.answer-row { display: flex; align-items: center; gap: 48px; margin-top: 14px; }
.answer-why { font-size: 30px; line-height: 1.3; color: var(--muted); }
.answer-why .accent { font-weight: 700; }
</style>
