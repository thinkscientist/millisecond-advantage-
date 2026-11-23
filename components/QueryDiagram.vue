<script setup lang="ts">
/**
 * Slide 11 — Query: answer where the data lives.
 *
 * Beat 1  the agent asks, over and over; the asked counter runs
 * Beat 2  two paths: the live table, and a warehouse copy; the SQL types in
 * Beat 3  answers land: counter catches up, AS OF clock, time scale shows the gap
 * Beat 4  takeaway (PillarSlide)
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import Clock from './Clock.vue'
import Flap from './Flap.vue'
import FlowDiagram from './FlowDiagram.vue'
import TimeScale from './TimeScale.vue'
import WirePulse from './WirePulse.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'
import { applyTick, EXPOSURE_TICKS, exposureOf, START_POSITIONS, START_PRICES } from './TickFeed'
import { useBeats } from './useBeats'

const { b, at, live, isStatic, clicks, epoch } = useBeats()

const nodes: FlowNode[] = [
  { id: 'agent', x: 0, y: 150, w: 300, h: 140, label: 'Risk agent', sub: 'asks before every order', beat: 1, tone: 'strong' },
  { id: 'table', x: 700, y: 130, w: 460, h: 180, label: 'exposure_by_account', sub: 'kept current by Process', beat: 2, tone: 'live' },
  { id: 'wh', x: 700, y: 360, w: 460, h: 96, label: 'Warehouse copy', sub: 'loaded hourly · last load 13:00', beat: 2, tone: 'ghost' },
]
const ASK: Pt[] = [[300, 190], [700, 190]]
const ANS: Pt[] = [[700, 250], [300, 250]]
const OLD: Pt[] = [[150, 290], [150, 408], [700, 408]]
const wires: FlowWire[] = [
  { id: 'ask', pts: ASK, beat: 2 },
  { id: 'answer', pts: ANS, beat: 3, hotAt: 3 },
  { id: 'old', pts: OLD, beat: 2, dashed: true },
]

// The value the table holds: walks through the scripted ticks.
const VALUES = (() => {
  const px: Record<string, number> = { ...START_PRICES }
  const pos: Record<string, number> = { ...START_POSITIONS }
  return EXPOSURE_TICKS.map((t) => { applyTick(t, px, pos); return exposureOf(px, pos) })
})()
const fmt = (n: number) => Math.round(n).toLocaleString('en-US')

const asked = ref(0)
const answered = ref(0)
const value = ref(VALUES[VALUES.length - 1])
const lastAnswer = ref(performance.now())
let vi = 0

const flow = ref<InstanceType<typeof FlowDiagram>>()
const pAsk = ref<InstanceType<typeof WirePulse>>()
const pAns = ref<InstanceType<typeof WirePulse>>()

let timer: ReturnType<typeof setInterval> | undefined
let n = 0
async function round() {
  const ok = await pAsk.value?.fire({ speed: 1600 })
  if (!ok) return
  flow.value?.flash('table', 0.8)
  if (!at(3)) return
  if (await pAns.value?.fire({ speed: 1600 })) {
    flow.value?.flash('agent', 0.8)
    value.value = VALUES[vi++ % VALUES.length]
    lastAnswer.value = performance.now()
  }
}
function tick() {
  asked.value++
  if (at(3)) answered.value = asked.value // answered in milliseconds
  if (n++ % 6 === 0 && at(2)) round()
}
const running = computed(() => live.value && at(1))
watch(running, (v) => {
  clearInterval(timer)
  if (v) timer = setInterval(tick, 140)
}, { immediate: true })
watch(live, (v) => { if (v) { asked.value = 0; answered.value = 0; n = 0 } })
watch(() => at(3), (v) => { if (v && live.value) answered.value = asked.value; if (!v) answered.value = 0 })
onBeforeUnmount(() => clearInterval(timer))

// SQL types in on beat 2.
const SQL = [
  ['SELECT', ' exposure, as_of'],
  ['FROM', '   exposure_by_account'],
  ['WHERE', '  account = \'ACCT-2231\';'],
]
const FULL = SQL.reduce((s, l) => s + l[0].length + l[1].length, 0)
const typed = ref(FULL)
let typeRaf = 0
watch([() => at(2), live, epoch], ([on]) => {
  cancelAnimationFrame(typeRaf)
  if (!on || !live.value || clicks.value !== 2) { typed.value = FULL; return }
  typed.value = 0
  const t0 = performance.now()
  const step = (t: number) => {
    typed.value = Math.min(FULL, Math.floor((t - t0) / 22))
    if (typed.value < FULL) typeRaf = requestAnimationFrame(step)
  }
  typeRaf = requestAnimationFrame(step)
})
onBeforeUnmount(() => cancelAnimationFrame(typeRaf))
const lines = computed(() => {
  let left = typed.value
  return SQL.map(([k, r]) => {
    const kk = k.slice(0, Math.max(0, left)); left -= k.length
    const rr = r.slice(0, Math.max(0, left)); left -= r.length
    return { k: kk, r: rr }
  })
})

// Static: a settled picture per beat.
watch([isStatic, clicks], () => {
  if (!isStatic.value) return
  asked.value = clicks.value >= 1 ? 1284 : 0
  answered.value = clicks.value >= 3 ? 1284 : 0
  value.value = VALUES[VALUES.length - 1]
}, { immediate: true })

const marks = [
  { ms: 38, label: '38 ms', sub: 'asked the table', tone: 'hit' as const, at: 3 },
  { ms: 3_720_000, label: '1 h 02 m', sub: 'the copy is this old', tone: 'accent' as const, at: 2 },
]
</script>

<template>
  <FlowDiagram ref="flow" :nodes="nodes" :wires="wires">
    <WirePulse ref="pAsk" :d="wirePath(ASK)" />
    <WirePulse ref="pAns" :d="wirePath(ANS)" />
    <g :class="b(2, 'fade')">
      <path d="M400 390 l36 36 M436 390 l-36 36" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" />
      <text class="svg-body" x="452" y="446" style="font-size: 18px">too old to act on</text>
    </g>
    <template #html>
      <div class="bubble" :class="b(1, 'rise')">“What is ACCT-2231's exposure, right now?”</div>

      <div class="counts" :class="b(1, 'fade')">
        <div><span class="label">asked</span><span class="mono cnt">{{ fmt(asked) }}</span></div>
        <div><span class="label">answered</span><span class="mono cnt" :class="{ stale: !at(3) }">{{ fmt(answered) }}</span></div>
      </div>

      <div class="tbl-asof label" :class="b(2, 'fade')">as of <Clock mode="wall" start="14:02:07.4" :frozen="0" /></div>

      <pre class="sql mono" :class="b(2, 'rise')"><template v-for="(l, i) in lines" :key="i"><span class="kw">{{ l.k }}</span>{{ l.r }}<span v-if="i < lines.length - 1">{{ '\n' }}</span></template><span v-if="typed < FULL" class="caret">▍</span></pre>

      <div class="answer panel" :class="b(3, 'rise')">
        <div class="label ans-head"><span>answer</span><span>38 ms</span></div>
        <Flap :value="fmt(value)" :size="52" />
        <div class="label ans-foot">as of <Clock mode="wall" start="14:02:07.4" :frozen="0" /> · <Clock mode="age" :since="lastAnswer" :frozen="400" /> old</div>
      </div>

      <div class="scale" :class="b(2, 'fade')">
        <TimeScale :marks="marks" :width="1680" :fill="at(3) ? 0 : -1" />
      </div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.bubble { position: absolute; left: 0; top: 40px; width: 1000px; white-space: nowrap; font-size: 32px; line-height: 1.3; font-weight: 600; }
.counts { position: absolute; left: 0; top: 304px; display: flex; gap: 28px; }
.counts > div { display: flex; flex-direction: column; gap: 4px; }
.counts .label { font-size: 15px; }
.cnt { font-size: 30px; font-variant-numeric: tabular-nums; }
.cnt.stale { color: var(--accent); }
.tbl-asof { position: absolute; left: 700px; top: 318px; width: 460px; text-align: center; font-size: 15px; }
.sql {
  position: absolute; left: 1220px; top: 130px; width: 460px; height: 118px; margin: 0; box-sizing: border-box;
  font-size: 19px; line-height: 1.55; padding: 14px 18px; white-space: pre;
  border: 1px solid var(--panel-line); border-radius: var(--radius); background: var(--panel);
}
.kw { color: var(--hit); }
.caret { color: var(--hit); animation: ss-breathe .8s infinite; }
.answer { position: absolute; left: 1220px; top: 268px; width: 460px; box-sizing: border-box; padding: 16px 18px; }
.ans-head, .ans-foot { display: flex; justify-content: space-between; font-size: 15px; }
.ans-head { margin-bottom: 10px; }
.ans-foot { margin-top: 10px; justify-content: flex-start; gap: 6px; }
.scale { position: absolute; left: 0; top: 500px; width: 1680px; }
</style>
