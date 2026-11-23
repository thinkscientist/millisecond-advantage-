<script setup lang="ts">
/**
 * Slide 9 — Process.
 *
 * Beat 0  inputs tick; an on-demand report sits stale ("N changes since")
 * Beat 1  the report becomes a continuous Process: every record updates the number
 * Beat 2  the record x price contributions shove in, newest first
 * Beat 3  the result is written to an exposure topic and fans out; waiting
 *         questions from consumers are answered at once
 * Beat 4  the statement that does it, and what else Process can do
 * Beat 5  takeaway (PillarSlide)
 */
import { computed, reactive, ref, watch } from 'vue'
import Clock from './Clock.vue'
import Flap from './Flap.vue'
import FlowDiagram from './FlowDiagram.vue'
import WirePulse from './WirePulse.vue'
import { wirePath, type FlowWire, type Pt } from './flow'
import {
  applyTick, EXPOSURE_TICKS, exposureOf, START_POSITIONS, START_PRICES,
  type Tick, useTickFeed,
} from './TickFeed'
import { useBeats } from './useBeats'

const { b, at, live, isStatic, clicks, epoch } = useBeats()

// ── Coordinate map (diagram space 1680 x 660) ──────────────────────────
const IN_W = 330
const CARD = { x: 410, y: 10, w: 640 }
const TOPIC = { x: 1110, y: 150, w: 240, h: 120 }
const CONS_X = 1430
const CONS = ['Agent', 'Risk officer', 'Advisor', 'Trading desk']
const CONS_Y = [40, 125, 210, 295] // row tops, 64 high

const W_POS: Pt[] = [[IN_W, 120], [370, 120], [370, 150], [CARD.x, 150]]
const W_PX: Pt[] = [[IN_W, 290], [370, 290], [370, 230], [CARD.x, 230]]
const W_OUT: Pt[] = [[CARD.x + CARD.w, 210], [TOPIC.x, 210]]
const W_CONS: Pt[][] = CONS_Y.map(y => [[TOPIC.x + TOPIC.w, 210], [1390, 210], [1390, y + 32], [CONS_X, y + 32]])

const wires: FlowWire[] = [
  { id: 'pos', pts: W_POS },
  { id: 'px', pts: W_PX },
  { id: 'out', pts: W_OUT, beat: 3 },
  ...W_CONS.map((pts, i) => ({ id: `c${i}`, pts, beat: 3 })),
]

// ── Live state ──────────────────────────────────────────────────────────
interface Row { k: number, rec: string, change: number, time: string }
const prices = reactive<Record<string, number>>({ ...START_PRICES })
const positions = reactive<Record<string, number>>({ ...START_POSITIONS })
const exposure = ref(exposureOf(prices, positions)) // what the card shows
const changesSince = ref(0)
const lastChange = ref(performance.now())
const asOf = ref('14:02:07.4')
const rows = ref<Row[]>([])
const topicVal = ref(exposure.value)
const topicAt = ref('14:02:07.4')
const inPos = reactive({ text: 'ACCT 2231 · XYZ 250,000', at: '14:02:06.9', k: 0 })
const inPx = reactive({ text: 'XYZ 41.12 · ABC 18.40', at: '14:02:07.1', k: 0 })
const asks = ref<boolean[]>(CONS.map(() => false))
const answers = ref<(string | null)[]>(CONS.map(() => null))
const answerK = ref<number[]>(CONS.map(() => 0))
let rowKey = 0

// a simulated wall clock: 14:02:07.4 at slide entry, advancing in real time
let t0 = performance.now()
const clock = () => {
  const ms = 14 * 3_600_000 + 2 * 60_000 + 7_400 + (performance.now() - t0)
  const p = (n: number) => String(Math.floor(n)).padStart(2, '0')
  return `${p(ms / 3_600_000)}:${p(ms / 60_000 % 60)}:${p(ms / 1000 % 60)}.${Math.floor(ms / 100 % 10)}`
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-US')
const signed = (n: number) => `${n >= 0 ? '+' : '−'}${fmt(Math.abs(n))}`

function describe(t: Tick): { rec: string, change: number } {
  if (t.cents !== undefined) {
    const qty = positions[t.sym]
    return { rec: `${fmt(qty)} ${t.sym} × ${t.cents > 0 ? '+' : '−'}${(Math.abs(t.cents) / 100).toFixed(2)}`, change: qty * t.cents / 100 }
  }
  return { rec: `${t.qty! > 0 ? '+' : '−'}${fmt(Math.abs(t.qty!))} ${t.sym} × ${prices[t.sym].toFixed(2)}`, change: t.qty! * prices[t.sym] }
}

function reset() {
  t0 = performance.now()
  Object.assign(prices, START_PRICES)
  Object.assign(positions, START_POSITIONS)
  exposure.value = exposureOf(prices, positions)
  topicVal.value = exposure.value
  changesSince.value = 0
  lastChange.value = performance.now()
  asOf.value = topicAt.value = '14:02:07.4'
  rows.value = []
  inPos.text = 'ACCT 2231 · XYZ 250,000'
  inPx.text = 'XYZ 41.12 · ABC 18.40'
  asks.value = CONS.map(() => false)
  answers.value = CONS.map(() => null)
}

/** Apply n ticks instantly: the settled picture for print and reduced motion. */
function prime(n: number) {
  reset()
  for (let i = 0; i < n; i++) {
    const t = EXPOSURE_TICKS[i]
    const d = describe(t)
    applyTick(t, prices, positions)
    rows.value.unshift({ k: rowKey++, rec: d.rec, change: d.change, time: `14:02:${String(8 + i * 2).padStart(2, '0')}.${i * 3 % 10}` })
  }
  rows.value = rows.value.slice(0, 3)
  const now = exposureOf(prices, positions)
  if (clicks.value >= 1) { exposure.value = now; asOf.value = rows.value[0]?.time ?? asOf.value }
  else changesSince.value = n
  topicVal.value = now
  topicAt.value = asOf.value
  inPos.text = `ACCT 2231 · ABC ${fmt(positions.ABC)}`
  inPx.text = `XYZ ${prices.XYZ.toFixed(2)} · ABC ${prices.ABC.toFixed(2)}`
  asks.value = CONS.map((_, i) => clicks.value < 3 && i % 2 === 0)
  answers.value = CONS.map(() => (clicks.value >= 3 ? fmt(now) : null))
}

// ── Pulses & glows ─────────────────────────────────────────────────────
const flow = ref<InstanceType<typeof FlowDiagram>>()
const pPos = ref<InstanceType<typeof WirePulse>>()
const pPx = ref<InstanceType<typeof WirePulse>>()
const pOut = ref<InstanceType<typeof WirePulse>>()
const pCons = ref<(InstanceType<typeof WirePulse> | null)[]>([])
const cardHit = ref(0)
const topicHit = ref(0)

async function answer(i: number) {
  const ok = await pCons.value[i]?.fire({ speed: 1600 })
  if (!ok) return
  asks.value[i] = false
  answers.value[i] = fmt(topicVal.value)
  answerK.value[i]++
}

async function onTick(t: Tick) {
  const isPrice = t.cents !== undefined
  const time = clock()
  if (isPrice) { inPx.text = `${t.sym} ${((prices[t.sym] * 100 + t.cents!) / 100).toFixed(2)} · ${t.cents! > 0 ? '▲' : '▼'}`; inPx.at = time; inPx.k++ }
  else { inPos.text = `ACCT 2231 · ${t.sym} ${fmt(positions[t.sym] + t.qty!)}`; inPos.at = time; inPos.k++ }

  const landed = await (isPrice ? pPx : pPos).value?.fire()
  if (!landed) return
  const d = describe(t)
  applyTick(t, prices, positions)
  cardHit.value++

  if (!at(1)) { changesSince.value++; return } // the report doesn't know yet

  exposure.value = exposureOf(prices, positions)
  asOf.value = time
  lastChange.value = performance.now()
  rows.value = [{ k: rowKey++, rec: d.rec, change: d.change, time }, ...rows.value].slice(0, 3)

  if (at(3) && await pOut.value?.fire({ speed: 1500 })) {
    topicVal.value = exposure.value
    topicAt.value = time
    topicHit.value++
    flow.value?.flash('topic')
  }
}

// consumers keep asking; before beat 3 nobody answers
let askTimer: ReturnType<typeof setInterval> | undefined
let askN = 0
function startAsks() {
  clearInterval(askTimer)
  askN = 0
  askTimer = setInterval(() => {
    const i = [0, 3, 1, 0, 2, 0, 3][askN++ % 7]
    asks.value[i] = true
    if (at(3)) setTimeout(() => answer(i), 260)
  }, 1300)
}

const feedOn = computed(() => live.value)
watch(feedOn, (v) => {
  if (v) { reset(); startAsks() }
  else clearInterval(askTimer)
}, { immediate: true })
watch(epoch, () => { if (!live.value) return; /* step back: pulses cancelled; state stays */ })
useTickFeed(EXPOSURE_TICKS, feedOn, onTick)

// When Process takes over, the number catches up at once.
watch(() => at(1), (v) => {
  if (!live.value) return
  if (v) {
    exposure.value = exposureOf(prices, positions)
    changesSince.value = 0
    lastChange.value = performance.now()
    asOf.value = clock()
  }
})
// When consumers get wired up, answer everyone who is waiting.
watch(() => at(3), (v) => {
  if (!live.value) return
  if (v) asks.value.forEach((w, i) => w && setTimeout(() => answer(i), 300 + i * 120))
  else answers.value = CONS.map(() => null)
})

// Static: settle each beat to a fixed picture.
watch([isStatic, clicks], () => { if (isStatic.value) prime(3) }, { immediate: true })

const continuous = computed(() => at(1))
const OPS = [
  { t: 'Filter & transform', s: 'fills only' },
  { t: 'Join & enrich', s: 'record + its price', on: true },
  { t: 'Aggregate', s: 'sum by account', on: true },
  { t: 'Route & split', s: 'equities / fx' },
  { t: 'Detect patterns', s: '3 breaches → alert' },
  { t: 'Run inference', s: 'note → model' },
]
</script>

<template>
  <FlowDiagram ref="flow" :nodes="[]" :wires="wires">
    <WirePulse ref="pPos" :d="wirePath(W_POS)" />
    <WirePulse ref="pPx" :d="wirePath(W_PX)" />
    <WirePulse ref="pOut" :d="wirePath(W_OUT)" />
    <WirePulse
      v-for="(pts, i) in W_CONS" :key="i"
      :ref="(el: any) => (pCons[i] = el)"
      :d="wirePath(pts)"
    />
    <template #html>
      <!-- inputs -->
      <div class="in panel" style="top: 60px">
        <div class="in-head label"><span>Topic / positions</span><span>{{ inPos.at }}</span></div>
        <div :key="inPos.k" class="in-val mono" :class="{ cool: inPos.k > 0 }">{{ inPos.text }}</div>
      </div>
      <div class="in panel" style="top: 230px">
        <div class="in-head label"><span>Topic / prices</span><span>{{ inPx.at }}</span></div>
        <div :key="inPx.k" class="in-val mono" :class="{ cool: inPx.k > 0 }">{{ inPx.text }}</div>
      </div>

      <!-- the card: on-demand report, then continuous Process -->
      <div class="card panel" :class="{ live: continuous }" :style="{ left: `${CARD.x}px`, top: `${CARD.y}px`, width: `${CARD.w}px` }">
        <div :key="cardHit" class="card-glow" :class="{ go: cardHit > 0 && !isStatic }" />
        <div class="card-head">
          <div>
            <div class="card-title">{{ continuous ? 'Process' : 'Exposure report' }}</div>
            <div class="label card-sub">{{ continuous ? 'stream processor' : 'built when somebody asks' }}</div>
          </div>
          <div class="mode label" :class="{ on: continuous }">
            <span v-if="continuous" class="dot breathe" />{{ continuous ? 'continuous' : 'on demand' }}
          </div>
        </div>
        <div class="card-body">
          <div class="row-meta label"><span>ACCT 2231 exposure</span><span>as of {{ asOf }}</span></div>
          <div class="num-row">
            <Flap :value="fmt(exposure)" :size="72" />
            <span v-if="continuous" class="age mono"><Clock mode="age" :since="lastChange" :frozen="600" /></span>
          </div>
          <div class="since label" :class="{ stale: changesSince > 0 }">
            {{ changesSince }} {{ changesSince === 1 ? 'change' : 'changes' }} since
          </div>

          <div class="contrib" :class="b(2, 'rise')">
            <div class="contrib-head label"><span>this record × its price</span><span>change</span><span>time</span></div>
            <TransitionGroup name="shove" tag="div" class="contrib-rows">
              <div v-for="(r, i) in rows" :key="r.k" class="contrib-row mono" :class="{ first: i === 0 }">
                <span>{{ r.rec }}</span><span>{{ signed(r.change) }}</span><span>{{ r.time }}</span>
              </div>
            </TransitionGroup>
          </div>
        </div>
      </div>

      <!-- output topic -->
      <div class="topic" :class="b(3, 'rise')" :style="{ left: `${TOPIC.x}px`, top: `${TOPIC.y}px`, width: `${TOPIC.w}px` }">
        <div class="label topic-head">Topic / exposure</div>
        <div :key="topicHit" class="topic-chip mono" :class="{ pop: topicHit > 0 && !isStatic }">
          <div>ACCT 2231</div>
          <div class="topic-num">{{ fmt(topicVal) }}</div>
          <div>{{ topicAt }}</div>
        </div>
        <div class="label topic-note">anyone can subscribe</div>
      </div>

      <!-- consumers -->
      <div
        v-for="(c, i) in CONS" :key="c" class="cons panel"
        :style="{ left: `${CONS_X}px`, top: `${CONS_Y[i]}px` }"
      >
        <span class="cons-name">{{ c }}</span>
        <span v-if="answers[i]" :key="answerK[i]" class="cons-ans mono cool">{{ answers[i] }}</span>
        <Transition name="ask"><span v-if="asks[i]" class="ask mono">?</span></Transition>
      </div>

      <!-- the statement -->
      <pre class="sql mono" :class="b(4, 'rise')"><span class="muted">-- keep each account's exposure current</span>
<span class="kw">INSERT INTO</span> exposure
<span class="kw">SELECT</span> account, <span class="kw">SUM</span>(qty * price) <span class="kw">AS</span> exposure,
       <span class="kw">MAX</span>(event_time) <span class="kw">AS</span> as_of
<span class="kw">FROM</span> positions <span class="kw">JOIN</span> prices <span class="kw">USING</span> (symbol)
<span class="kw">GROUP BY</span> account;</pre>

      <div class="ops" :class="b(4, 'lift')">
        <div v-for="(o, i) in OPS" :key="o.t" class="op" :class="{ on: o.on }" :style="{ animationDelay: `${i * 50}ms` }">
          <div class="op-t">{{ o.t }}</div>
          <div class="label op-s">{{ o.s }}</div>
        </div>
      </div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.in { position: absolute; left: 0; width: 330px; box-sizing: border-box; padding: 14px 16px; pointer-events: none; }
.in-head { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 10px; white-space: nowrap; }
.in-val { font-size: 19px; white-space: nowrap; }

.card { position: absolute; overflow: hidden; transition: background-color 500ms var(--ease), box-shadow 500ms var(--ease), border-color 500ms; }
.card.live { background: var(--live-deep); }
.card.live .card-head { background: var(--live); }
.card-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 18px 22px 14px; transition: background-color 500ms var(--ease);
}
.card-title { font-size: 30px; font-weight: 700; letter-spacing: 0; }
.card-sub { font-size: 16px; margin-top: 4px; color: var(--muted); }
.mode { font-size: 15px; padding: 4px 10px; border-radius: 99px; border: 1px solid var(--panel-line); display: flex; gap: 8px; align-items: center; }
.mode.on { border-color: rgba(var(--text-rgb), .5); color: var(--text); }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--hit); }
.card-body { padding: 18px 22px 20px; }
.row-meta { display: flex; justify-content: space-between; font-size: 16px; }
.num-row { display: flex; align-items: center; justify-content: space-between; margin: 12px 0 8px; }
.age { font-size: 20px; padding: 6px 12px; border-radius: 99px; border: 1px solid rgba(var(--hit-rgb), .5); color: var(--hit); }
.since { font-size: 16px; text-align: right; }
.since.stale { color: var(--accent); }
.card-glow { position: absolute; inset: 0; pointer-events: none; border-radius: var(--radius); box-shadow: inset 0 0 0 2px var(--hit), 0 0 30px rgba(var(--hit-rgb), .45); opacity: 0; }
.card-glow.go { animation: glow 780ms both; }
@keyframes glow { 0% { opacity: 0 } 10% { opacity: .9 } 100% { opacity: 0 } }

.contrib { margin-top: 16px; border-top: 1px solid var(--rule); padding-top: 12px; }
.contrib-head, .contrib-row { display: grid; grid-template-columns: 1fr 120px 140px; gap: 8px; white-space: nowrap; }
.contrib-head span:not(:first-child), .contrib-row span:not(:first-child) { text-align: right; }
.contrib-head { font-size: 15px; margin-bottom: 6px; }
.contrib-rows { position: relative; height: 102px; overflow: hidden; }
.contrib-row { font-size: 17px; height: 34px; line-height: 34px; color: rgba(var(--text-rgb), .82); }
.contrib-row.first { color: var(--text); }
.shove-move { transition: transform 360ms var(--ease); }
.shove-enter-active { transition: transform 360ms var(--ease), opacity 360ms var(--ease); }
.shove-enter-from { transform: translateY(-34px); opacity: 0; }
.shove-enter-active span { animation: ss-hit 900ms var(--ease-out); }
.shove-leave-active { display: none; }

.topic { position: absolute; }
.topic-head { font-size: 15px; margin-bottom: 8px; }
.topic-chip { background: var(--hit); color: var(--ink); border-radius: var(--radius); padding: 12px 14px; font-size: 17px; line-height: 1.45; }
.topic-num { font-size: 26px; }
.topic-chip.pop { animation: pop 420ms var(--ease); }
@keyframes pop { 0% { transform: translateX(-18px); opacity: .4 } 100% { transform: none; opacity: 1 } }
.topic-note { font-size: 14px; margin-top: 10px; }

.cons { position: absolute; width: 250px; height: 64px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; gap: 2px; padding: 0 16px; border-left: 3px solid var(--text); }
.cons-name { font-size: 21px; font-weight: 600; line-height: 1.1; white-space: nowrap; }
.cons-ans { font-size: 15px; color: var(--muted); }
.ask { position: absolute; right: -14px; top: -12px; width: 30px; height: 30px; border-radius: 50%; background: var(--hit); color: var(--ink); display: grid; place-items: center; font-size: 18px; }
.ask-enter-active { transition: transform 300ms var(--ease), opacity 300ms; }
.ask-enter-from { transform: scale(.3); opacity: 0; }
.ask-leave-active { transition: transform 240ms ease-in, opacity 240ms; }
.ask-leave-to { transform: translate(-30px, 8px) scale(.5); opacity: 0; }

.sql {
  position: absolute; left: 1110px; top: 398px; width: 570px; margin: 0; box-sizing: border-box;
  padding: 14px 16px; font-size: 15px; line-height: 1.5; white-space: pre;
  background: var(--panel); border: 1px solid var(--panel-line); border-radius: var(--radius);
}
.kw { color: var(--hit); }

.ops { position: absolute; left: 0; top: 584px; width: 1680px; display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
.op { padding: 10px 14px; border-radius: var(--radius); background: var(--panel); border: 1px solid var(--panel-line); }
.op.on { background: var(--live); border-color: rgba(255, 255, 255, .35); color: #fff; }
.op.on .op-s { color: rgba(255, 255, 255, .78); }
.op-t { font-size: 20px; font-weight: 600; }
.op-s { font-size: 14px; margin-top: 2px; }
</style>
