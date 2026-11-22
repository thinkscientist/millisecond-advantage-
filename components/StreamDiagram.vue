<script setup lang="ts">
/**
 * Slide 8 — Stream: one ordered, durable log; many readers, each at its own place.
 *
 * Beat 0  the log: a month of records as a dense barcode on a log time axis
 * Beat 1  new records arrive as cream chips at NOW; everything slides left as it ages
 * Beat 2  a live reader sits at NOW and reads each record as it lands
 * Beat 3  two more readers keep their own places: a lakehouse a few minutes
 *         behind, and a replay that rebuilds the number as of yesterday 16:00
 * Beat 4  the replay rewinds a week: the log keeps what you tell it to keep
 * Beat 5  takeaway (PillarSlide)
 */
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import Flap from './Flap.vue'
import WirePulse from './WirePulse.vue'
import {
  applyTick, EXPOSURE_TICKS, exposureOf, seeded, START_POSITIONS, START_PRICES,
} from './TickFeed'
import { useBeats } from './useBeats'

const { b, at, live, isStatic, clicks } = useBeats()

// ── Geometry ───────────────────────────────────────────────────────────
const PX = 0 // log panel
const PY = 10
const PW = 1680
const CANVAS_X = 20
const CANVAS_Y = 60 // inside panel
const CW = 1640
const CH = 168
const LANES = 4
const LOG_BOTTOM = PY + CANVAS_Y + CH // diagram-space y of the barcode's bottom

// Log time axis: NOW at the right edge, 1 month at the left.
const S = 1000
const MIN = 60 * S
const H = 60 * MIN
const DAY = 24 * H
const OLDEST = 31 * DAY
const NEWEST = 2 * S
const L0 = Math.log10(NEWEST)
const L1 = Math.log10(OLDEST)
const xOfAge = (age: number) => {
  const a = Math.min(OLDEST, Math.max(NEWEST, age))
  return CW * (1 - (Math.log10(a) - L0) / (L1 - L0))
}
const AXIS = [
  { age: 30 * DAY, t: '1 MONTH' }, { age: 7 * DAY, t: '1 WEEK' }, { age: DAY, t: '1 DAY' },
  { age: H, t: '1 H' }, { age: 5 * MIN, t: '5 MIN' }, { age: MIN, t: '1 MIN' }, { age: 10 * S, t: '10 S' }, { age: NEWEST, t: 'NOW' },
]

// ── History: a month of records, deterministic ─────────────────────────
interface Bar { t: number, lane: number, w: number, live?: boolean }
let simNow = 0 // ms of simulated time; records are stamped in this clock
const bars: Bar[] = []
function buildHistory() {
  bars.length = 0
  const rnd = seeded(2231)
  // density falls off with age, roughly even per log-decade
  for (let i = 0; i < 1400; i++) {
    const u = rnd()
    const age = 10 ** (L0 + 0.15 + u * (L1 - L0 - 0.15))
    // trading hours cluster: thin out some bands to give the barcode texture
    if (rnd() < 0.35 && Math.floor(Math.log10(age) * 7) % 3 === 0) continue
    bars.push({ t: -age, lane: Math.floor(rnd() * LANES), w: rnd() < 0.15 ? 6 : rnd() < 0.5 ? 3 : 2 })
  }
}

// ── Canvas ─────────────────────────────────────────────────────────────
const canvas = ref<HTMLCanvasElement>()
let raf = 0
let t0 = performance.now()
function draw() {
  const c = canvas.value
  if (!c) return
  const g = c.getContext('2d')!
  g.clearRect(0, 0, CW, CH)
  const laneH = CH / LANES
  // lane rules
  g.fillStyle = 'rgba(255,255,255,0.04)'
  for (let l = 0; l < LANES; l++) g.fillRect(0, l * laneH + laneH * 0.2, CW, laneH * 0.6)
  for (const bar of bars) {
    const age = simNow - bar.t
    const x = xOfAge(age)
    const fresh = bar.live && age < 2500
    const a = fresh ? 1 : Math.max(0.28, 0.85 - (Math.log10(Math.max(age, NEWEST)) - L0) / (L1 - L0) * 0.55)
    g.fillStyle = fresh ? `rgba(232,213,176,${a})` : `rgba(169,183,217,${a})`
    g.fillRect(x - bar.w / 2, bar.lane * laneH + laneH * 0.18, bar.w, laneH * 0.64)
  }
}
function loop() {
  simNow = performance.now() - t0
  draw()
  raf = requestAnimationFrame(loop)
}
function start() {
  cancelAnimationFrame(raf)
  t0 = performance.now()
  simNow = 0
  buildHistory()
  raf = requestAnimationFrame(loop)
}
onBeforeUnmount(() => cancelAnimationFrame(raf))

// ── Values: the live number, and the number as of earlier moments ──────
const prices = reactive<Record<string, number>>({ ...START_PRICES })
const positions = reactive<Record<string, number>>({ ...START_POSITIONS })
const fmt = (n: number) => Math.round(n).toLocaleString('en-US')
const liveVal = ref(exposureOf(prices, positions))
const lakeVal = ref(12_461_350)
const REPLAY = computed(() => at(4)
  ? { age: 7 * DAY, asOf: '15 NOV 16:00:00', value: 11_204_750 }
  : { age: 22 * H, asOf: 'YESTERDAY 16:00:00', value: 11_930_400 })

// ── Readers: cursor x in diagram space ─────────────────────────────────
const cursorX = (age: number) => PX + CANVAS_X + xOfAge(age)
const READ_Y = 420 // top of reader cards
const readers = computed(() => [
  { id: 'replay', name: 'Risk officer', role: 'replays the past', x: cursorX(REPLAY.value.age), beat: 3 },
  { id: 'lake', name: 'Lakehouse', role: 'reads in batches', x: cursorX(5 * MIN), beat: 3 },
  { id: 'live', name: 'Agent', role: 'reads the head', x: cursorX(NEWEST), beat: 2 },
])
const CARD_W = 300
const cardLeft = (x: number) => Math.min(PW - CARD_W, Math.max(0, x - CARD_W / 2))
const leader = (x: number) => `M${x} ${LOG_BOTTOM + 4} V${READ_Y}`

// ── Feed: positions and prices arrive at NOW ───────────────────────────
const chipHost = ref<HTMLDivElement>()
const pLive = ref<InstanceType<typeof WirePulse>>()
const pLake = ref<InstanceType<typeof WirePulse>>()
const pReplay = ref<InstanceType<typeof WirePulse>>()
const running = new Set<Animation>()
let timer: ReturnType<typeof setTimeout> | undefined
let i = 0

function chip(text: string[]) {
  const host = chipHost.value
  if (!host) return Promise.resolve(false)
  const el = document.createElement('div')
  el.className = 'st-chip mono'
  el.innerHTML = text.map(t => `<div>${t}</div>`).join('')
  host.appendChild(el)
  const a = el.animate([
    { transform: 'translateX(180px)', opacity: 0 },
    { transform: 'translateX(0)', opacity: 1, offset: 0.35 },
    { transform: 'translateX(0)', opacity: 1, offset: 0.8 },
    { transform: 'translateX(-30px)', opacity: 0 },
  ], { duration: 1500, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' })
  running.add(a)
  return a.finished.then(() => true, () => false).finally(() => { running.delete(a); el.remove() })
}

const clockText = () => {
  const ms = 14 * H + 2 * MIN + 7400 + simNow
  const p = (n: number) => String(Math.floor(n)).padStart(2, '0')
  return `${p(ms / H)}:${p(ms / MIN % 60)}:${p(ms / S % 60)}.${Math.floor(ms / 100 % 10)}`
}

function step() {
  const t = EXPOSURE_TICKS[i % EXPOSURE_TICKS.length]
  i++
  const lane = (t.sym === 'XYZ' ? 0 : 1) + (t.qty ? 2 : 0)
  if (at(1)) {
    const line = t.qty ? `${t.sym} ${fmt(positions[t.sym] + t.qty)}` : `${t.sym} ${((prices[t.sym] * 100 + t.cents!) / 100).toFixed(2)}`
    chip([t.qty ? 'ACCT 2231' : 'PRICE', line, clockText()]).then((ok) => {
      if (!ok) return
      bars.push({ t: simNow, lane, w: 4, live: true })
      applyTick(t, prices, positions)
      if (at(2)) pLive.value?.fire({ speed: 900 }).then(r => r && (liveVal.value = exposureOf(prices, positions)))
      else liveVal.value = exposureOf(prices, positions)
    })
  }
  if (at(3) && i % 4 === 0) pLake.value?.fire({ speed: 700 }).then(r => r && (lakeVal.value += i % 8 === 0 ? 2_470 : -3_600))
  if (at(3) && i % 3 === 1) pReplay.value?.fire({ speed: 700 })
  timer = setTimeout(step, Math.max(900, t.gap * 0.6))
}

watch(live, (v) => {
  clearTimeout(timer)
  running.forEach(a => a.cancel()); running.clear()
  if (v) {
    Object.assign(prices, START_PRICES)
    Object.assign(positions, START_POSITIONS)
    liveVal.value = exposureOf(prices, positions)
    lakeVal.value = 12_461_350
    i = 0
    start()
    timer = setTimeout(step, 400)
  }
  else {
    cancelAnimationFrame(raf)
  }
}, { immediate: true, flush: 'post' })
onBeforeUnmount(() => clearTimeout(timer))

// Static: draw the month once, with a few fresh records at the head.
watch([isStatic, clicks, canvas], () => {
  if (!isStatic.value || !canvas.value) return
  buildHistory()
  simNow = 0
  if (clicks.value >= 1) [1200, 2600, 4800].forEach((a, k) => bars.push({ t: -a + 2000, lane: k, w: 4, live: true }))
  draw()
}, { immediate: true, flush: 'post' })
</script>

<template>
  <div class="stream">
    <!-- the log -->
    <div class="log panel" :style="{ left: `${PX}px`, top: `${PY}px`, width: `${PW}px` }">
      <div class="log-head label">
        <span>topic / positions · keyed by account</span>
        <span class="muted">ordered · durable · replayable</span>
      </div>
      <canvas ref="canvas" :width="CW" :height="CH" class="bars" :style="{ left: `${CANVAS_X}px`, top: `${CANVAS_Y}px` }" />
      <div ref="chipHost" class="chip-host" :style="{ top: `${CANVAS_Y - 8}px` }" />
    </div>
    <div class="axis" :style="{ top: `${LOG_BOTTOM + 18}px` }">
      <span
        v-for="a in AXIS" :key="a.t" class="label"
        :class="{ end: a.t === 'NOW', kept: at(4) && (a.t === '1 MONTH' || a.t === '1 WEEK') }"
        :style="{ left: `${CANVAS_X + xOfAge(a.age)}px` }"
      >{{ a.t }}</span>
    </div>
    <div class="retention label" :class="b(4, 'fade')" :style="{ top: `${LOG_BOTTOM + 48}px` }">
      kept as long as you set · a day, a year, forever
    </div>

    <!-- readers: cursors on the log, leader lines, cards -->
    <svg class="overlay" width="1680" height="660" viewBox="0 0 1680 660">
      <g v-for="r in readers" :key="r.id" :class="b(r.beat, 'fade')">
        <path :d="`M${r.x} ${PY + CANVAS_Y - 6} V${LOG_BOTTOM + 4}`" class="cursor" :class="{ head: r.id === 'live' }" />
        <path :d="leader(r.x)" class="wire" />
      </g>
      <WirePulse ref="pLive" :d="leader(readers[2].x)" :seg="40" />
      <WirePulse ref="pLake" :d="leader(readers[1].x)" :seg="40" />
      <WirePulse ref="pReplay" :d="leader(readers[0].x)" :seg="40" />
    </svg>

    <div
      v-for="r in readers" :key="r.id" class="reader panel" :class="[b(r.beat, 'rise'), { live: r.id === 'live' }]"
      :style="{ left: `${cardLeft(r.x)}px`, top: `${READ_Y}px` }"
    >
      <div class="reader-name">{{ r.name }}</div>
      <div class="label reader-role">{{ r.role }}</div>
      <div class="label reader-sub">acct 2231 exposure</div>
      <template v-if="r.id === 'live'">
        <Flap :value="fmt(liveVal)" :size="40" />
        <div class="asof label">as of <span class="pill now">now</span></div>
      </template>
      <template v-else-if="r.id === 'lake'">
        <Flap :value="fmt(lakeVal)" :size="40" />
        <div class="asof label">as of <span class="pill">5 min ago</span></div>
      </template>
      <template v-else>
        <Flap :value="fmt(REPLAY.value)" :size="40" />
        <div class="asof label">as of <span class="pill">{{ REPLAY.asOf }}</span></div>
      </template>
    </div>

    <div class="note label" :class="b(3, 'fade')">
      each reader keeps its own place · same records, no private copies
    </div>
  </div>
</template>

<style scoped>
.stream { position: relative; width: 1680px; height: 660px; }
.log { position: absolute; height: 248px; box-sizing: border-box; overflow: hidden; }
.log-head { display: flex; justify-content: space-between; padding: 16px 20px 0; font-size: 15px; }
.bars { position: absolute; }
.chip-host { position: absolute; right: 14px; width: 120px; height: 100px; pointer-events: none; }
.chip-host :deep(.st-chip) {
  position: absolute; right: 0; top: 0; width: 132px; box-sizing: border-box;
  padding: 7px 9px; border-radius: var(--radius); background: var(--hit); color: var(--ink);
  font-size: 14px; line-height: 1.4; box-shadow: 0 0 22px rgba(232, 213, 176, .5);
}
.axis { position: absolute; left: 0; width: 1680px; height: 20px; }
.axis span { position: absolute; transform: translateX(-50%); font-size: 15px; white-space: nowrap; transition: color 400ms; }
.axis span:first-child { transform: none; }
.axis span.end { transform: translateX(-100%); color: var(--text); }
.axis span.kept { color: var(--hit); }
.retention { position: absolute; left: 230px; font-size: 15px; color: var(--hit); }
.retention, .note { line-height: 20px; }

.overlay { position: absolute; inset: 0; overflow: visible; pointer-events: none; }
.cursor { stroke: var(--text); stroke-width: 2; }
.cursor.head { stroke: var(--hit); }
.overlay g, .reader { transition: transform 900ms var(--ease); }

.reader { position: absolute; width: 300px; box-sizing: border-box; padding: 14px 16px; border-left: 3px solid var(--text); transition: left 900ms var(--ease); }
.reader.live { border-left-color: var(--hit); }
.reader-name { font-size: 22px; font-weight: 700; line-height: 1.1; }
.reader-role { font-size: 13px; margin-top: 2px; }
.reader-sub { font-size: 13px; margin: 8px 0 6px; }
.asof { font-size: 13px; margin-top: 8px; }
.pill { display: inline-block; padding: 2px 8px; margin-left: 4px; border-radius: 99px; background: var(--hit); color: var(--ink); }
.pill.now { background: transparent; color: var(--hit); border: 1px solid var(--hit); }
.note { position: absolute; left: 0; top: 630px; font-size: 15px; }
</style>
